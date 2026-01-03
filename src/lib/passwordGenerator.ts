export interface GeneratorOptions {
  length: number;
  includeLetters: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
  excludeSimilar: boolean;
}

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = 'l1IO0';
const SIMILAR = 'iIlL1oO0';

export function generatePassword(options: GeneratorOptions): string {
  let chars = '';

  if (options.includeLetters) {
    chars += LOWERCASE + UPPERCASE;
  }
  if (options.includeNumbers) {
    chars += NUMBERS;
  }
  if (options.includeSymbols) {
    chars += SYMBOLS;
  }

  if (options.excludeAmbiguous) {
    chars = chars.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
  }
  if (options.excludeSimilar) {
    chars = chars.split('').filter(c => !SIMILAR.includes(c)).join('');
  }

  if (chars.length === 0) {
    chars = LOWERCASE + UPPERCASE;
  }

  let password = '';
  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);

  for (let i = 0; i < options.length; i++) {
    password += chars[array[i] % chars.length];
  }

  return password;
}

export function calculateStrength(password: string): {
  score: number;
  label: 'weak' | 'medium' | 'strong';
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Penalties
  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 1;
    feedback.push('Add numbers or symbols');
  }
  if (/^[0-9]+$/.test(password)) {
    score -= 2;
    feedback.push('Add letters and symbols');
  }
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }
  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  }
  if (password.length < 12) {
    feedback.push('Consider using 12+ characters');
  }

  // Normalize score
  score = Math.max(0, Math.min(score, 8));

  let label: 'weak' | 'medium' | 'strong';
  if (score <= 3) {
    label = 'weak';
  } else if (score <= 5) {
    label = 'medium';
  } else {
    label = 'strong';
  }

  return { score, label, feedback };
}

export function generatePassphrase(wordCount: number = 4): string {
  const words = [
    'apple', 'brave', 'cloud', 'delta', 'eagle', 'flame', 'grace', 'haven',
    'ivory', 'jewel', 'karma', 'lunar', 'magic', 'noble', 'ocean', 'pulse',
    'quest', 'river', 'solar', 'tiger', 'urban', 'vivid', 'waves', 'xenon',
    'yield', 'zesty', 'amber', 'blaze', 'coral', 'drift', 'ember', 'frost',
    'gleam', 'honey', 'inlet', 'jazzy', 'kelp', 'lotus', 'maple', 'north',
    'oasis', 'pearl', 'quill', 'ridge', 'storm', 'torch', 'unity', 'vault',
    'wisp', 'xerox', 'yacht', 'zenith', 'arrow', 'birch', 'crisp', 'dune',
  ];

  const result: string[] = [];
  const array = new Uint32Array(wordCount);
  crypto.getRandomValues(array);

  for (let i = 0; i < wordCount; i++) {
    const word = words[array[i] % words.length];
    result.push(word.charAt(0).toUpperCase() + word.slice(1));
  }

  return result.join('-');
}
