function sanitizeKey(rawKey: string): string {
  if (!rawKey) return '';
  let cleaned = rawKey.trim();

  // If format is VITE_FLW_PUBLIC_KEY=FLWPUBK...
  if (cleaned.includes('=')) {
    const parts = cleaned.split('=');
    cleaned = parts[parts.length - 1].trim();
  }

  // Remove surrounding quotes, double quotes or trailing semicolons
  cleaned = cleaned.replace(/['";]/g, '').trim();

  if (!cleaned) return '';

  // If already starts with valid Flutterwave Public Key prefix (FLWPUBK or FLWPUBK_TEST)
  if (cleaned.toUpperCase().startsWith('FLWPUBK')) {
    return cleaned;
  }

  // If user passed a raw 32-hex character string without FLWPUBK prefix
  let prefixed = `FLWPUBK-${cleaned}`;
  if (!prefixed.endsWith('-X') && !prefixed.endsWith('-x')) {
    prefixed = `${prefixed}-X`;
  }
  return prefixed;
}

export function getFlutterwavePublicKey(): string {
  // 1. Priority 1: Check environment variable from Google AI Studio Secrets / .env
  const rawEnvKey = (
    import.meta.env.VITE_FLW_PUBLIC_KEY || 
    import.meta.env.VITE_FLW_PUBLIC_KE || 
    import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
    ''
  ).trim();

  if (rawEnvKey) {
    const sanitizedEnv = sanitizeKey(rawEnvKey);
    if (sanitizedEnv) return sanitizedEnv;
  }

  // 2. Priority 2: Check browser localStorage override if manually saved by user
  const localKey = localStorage.getItem('efado_flw_public_key');
  if (localKey && localKey.trim()) {
    const sanitizedLocal = sanitizeKey(localKey);
    if (sanitizedLocal) return sanitizedLocal;
  }
  
  // 3. Fallback Key
  return 'FLWPUBK-c9b9eca1-6bc8-44ea-bef6-e5a721fbf873-X';
}

export function saveFlutterwavePublicKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem('efado_flw_public_key', trimmed);
  } else {
    localStorage.removeItem('efado_flw_public_key');
  }
}

export function clearFlutterwavePublicKey(): void {
  localStorage.removeItem('efado_flw_public_key');
}

export function isTestKey(key?: string): boolean {
  const activeKey = key || getFlutterwavePublicKey();
  return activeKey.toUpperCase().includes('FLWPUBK_TEST');
}

export function isDefaultOrInvalidKey(key?: string): boolean {
  const activeKey = key || getFlutterwavePublicKey();
  if (!activeKey || !activeKey.toUpperCase().startsWith('FLWPUBK')) {
    return true;
  }
  if (activeKey.includes('a3e7403487053e164c9f139d2c2ad3c1-X')) {
    return true;
  }
  return false;
}

