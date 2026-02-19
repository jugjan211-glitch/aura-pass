import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";
import { TOTP, Secret } from "https://esm.sh/otpauth@9.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- AES-GCM encryption helpers using SERVICE_ROLE_KEY as master key ---

async function getEncryptionKey(): Promise<CryptoKey> {
  const masterKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterKey),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  // Use a fixed salt derived from the project context
  const salt = encoder.encode("totp-secret-encryption-salt-v1");
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );
  // Pack iv + ciphertext as base64 JSON
  const toBase64 = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };
  return JSON.stringify({
    iv: toBase64(iv.buffer),
    ct: toBase64(encrypted),
  });
}

async function decryptSecret(encryptedBundle: string): Promise<string> {
  // Handle legacy unencrypted secrets (plain base32 strings)
  try {
    const parsed = JSON.parse(encryptedBundle);
    if (!parsed.iv || !parsed.ct) {
      // Not encrypted format, return as-is (legacy)
      return encryptedBundle;
    }
    const fromBase64 = (b64: string) => {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    };
    const key = await getEncryptionKey();
    const iv = new Uint8Array(fromBase64(parsed.iv));
    const ciphertext = fromBase64(parsed.ct);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    // If JSON parse fails, it's a legacy plain base32 secret
    return encryptedBundle;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    // Verify the user's JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, code, secret } = await req.json();

    if (action === "check-status") {
      // Returns whether 2FA is enabled for the authenticated user (no secret returned)
      const { data: totpData } = await adminClient
        .from("totp_secrets")
        .select("is_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ enabled: totpData?.is_enabled ?? false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for DB operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "verify-and-enable") {
      // Validate inputs
      if (!secret || typeof secret !== "string" || secret.length > 64) {
        return new Response(
          JSON.stringify({ error: "Invalid secret" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
        return new Response(
          JSON.stringify({ error: "Invalid code format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validate TOTP code server-side
      const totp = new TOTP({
        issuer: "SecureVault",
        label: user.email || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(secret),
      });

      const delta = totp.validate({ token: code, window: 1 });

      if (delta === null) {
        return new Response(
          JSON.stringify({ error: "Invalid TOTP code" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Encrypt the secret before storing
      const encryptedSecret = await encryptSecret(secret);

      // Save encrypted secret to database
      const { error: dbError } = await adminClient
        .from("totp_secrets")
        .upsert(
          {
            user_id: user.id,
            secret: encryptedSecret,
            is_enabled: true,
          },
          { onConflict: "user_id" }
        );

      if (dbError) {
        return new Response(
          JSON.stringify({ error: "Failed to save 2FA settings" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      // Verify a TOTP code against stored (encrypted) secret
      if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
        return new Response(
          JSON.stringify({ error: "Invalid code format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: totpData, error: fetchError } = await adminClient
        .from("totp_secrets")
        .select("secret, is_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError || !totpData || !totpData.is_enabled) {
        return new Response(
          JSON.stringify({ error: "2FA not enabled" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Decrypt the stored secret
      const decryptedSecret = await decryptSecret(totpData.secret);

      const totp = new TOTP({
        issuer: "SecureVault",
        label: user.email || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(decryptedSecret),
      });

      const delta = totp.validate({ token: code, window: 1 });

      return new Response(
        JSON.stringify({ valid: delta !== null }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "disable") {
      const { error: dbError } = await adminClient
        .from("totp_secrets")
        .update({ is_enabled: false })
        .eq("user_id", user.id);

      if (dbError) {
        return new Response(
          JSON.stringify({ error: "Failed to disable 2FA" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
