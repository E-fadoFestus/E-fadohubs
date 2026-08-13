export function sanitizeKey(rawKey: string, isSecret = false): string {
  if (!rawKey) return '';
  let cleaned = rawKey.trim();

  // Handle KEY_NAME=VAL format if user pasted entire env line
  if (cleaned.includes('=')) {
    const parts = cleaned.split('=');
    cleaned = parts[parts.length - 1].trim();
  }

  // Remove surrounding quotes, double quotes, whitespace, or trailing semicolons
  cleaned = cleaned.replace(/['";]/g, '').trim();

  if (!cleaned) return '';

  const upper = cleaned.toUpperCase();

  // If secret key is requested or string starts with FLWSECK
  if (isSecret || upper.startsWith('FLWSECK')) {
    if (upper.startsWith('FLWSECK')) {
      return cleaned;
    }
    // If raw string without prefix
    return `FLWSECK-${cleaned}`;
  }

  // If public key is requested or starts with FLWPUBK
  if (upper.startsWith('FLWPUBK')) {
    return cleaned;
  }

  // If user pasted a Secret Key in Public Key field, do not prefix with FLWPUBK
  if (upper.startsWith('FLWSECK')) {
    return cleaned;
  }

  // Only prefix if it looks like a 32-char hex token
  return `FLWPUBK-${cleaned}`;
}

export function getFlutterwavePublicKey(): string {
  // 1. Priority 1: Check environment variables
  const rawEnvKey = (
    import.meta.env.VITE_FLW_PUBLIC_KEY || 
    import.meta.env.VITE_FLW_PUBLIC_KE || 
    import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
    ''
  ).trim();

  if (rawEnvKey) {
    const sanitizedEnv = sanitizeKey(rawEnvKey, false);
    if (sanitizedEnv && sanitizedEnv.toUpperCase().startsWith('FLWPUBK')) {
      return sanitizedEnv;
    }
  }

  // 2. Priority 2: Check browser localStorage override
  const localKey = localStorage.getItem('efado_flw_public_key');
  if (localKey && localKey.trim()) {
    const sanitizedLocal = sanitizeKey(localKey, false);
    if (sanitizedLocal && sanitizedLocal.toUpperCase().startsWith('FLWPUBK')) {
      return sanitizedLocal;
    }
  }
  
  return '';
}

export function getFlutterwaveSecretKey(): string {
  // 1. Check environment variables
  const rawEnvKey = (
    import.meta.env.VITE_FLW_SECRET_KEY || 
    import.meta.env.FLW_SECRET_KEY || 
    import.meta.env.FLUTTERWAVE_SECRET_KEY ||
    import.meta.env.FLWSECK ||
    ''
  ).trim();

  if (rawEnvKey) {
    const sanitized = sanitizeKey(rawEnvKey, true);
    if (sanitized && sanitized.toUpperCase().startsWith('FLWSECK')) {
      return sanitized;
    }
  }

  // 2. Check localStorage override
  const localKey = localStorage.getItem('efado_flw_secret_key');
  if (localKey && localKey.trim()) {
    const sanitizedLocal = sanitizeKey(localKey, true);
    if (sanitizedLocal && sanitizedLocal.toUpperCase().startsWith('FLWSECK')) {
      return sanitizedLocal;
    }
  }

  return '';
}

export function saveFlutterwavePublicKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem('efado_flw_public_key', trimmed);
  } else {
    localStorage.removeItem('efado_flw_public_key');
  }
}

export function saveFlutterwaveSecretKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem('efado_flw_secret_key', trimmed);
  } else {
    localStorage.removeItem('efado_flw_secret_key');
  }
}

export function clearFlutterwaveKeys(): void {
  localStorage.removeItem('efado_flw_public_key');
  localStorage.removeItem('efado_flw_secret_key');
}

export function isTestKey(key?: string): boolean {
  const activeKey = key || getFlutterwavePublicKey();
  return activeKey.toUpperCase().includes('TEST');
}

export function isDefaultOrInvalidKey(key?: string): boolean {
  const activeKey = key || getFlutterwavePublicKey();
  if (!activeKey || !activeKey.toUpperCase().startsWith('FLWPUBK')) {
    return true;
  }
  return false;
}


