import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";
import { TOTP, Secret } from "https://esm.sh/otpauth@9.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

      // Save to database (server-side, validated)
      const { error: dbError } = await adminClient
        .from("totp_secrets")
        .upsert(
          {
            user_id: user.id,
            secret: secret,
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
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
