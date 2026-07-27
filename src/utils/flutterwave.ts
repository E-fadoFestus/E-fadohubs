function sanitizeKey(rawKey: string): string {
  let cleaned = rawKey.trim();
  if (cleaned.includes('=')) {
    cleaned = cleaned.split('=').pop() || '';
  }
  cleaned = cleaned.replace(/['";]/g, '').trim();

  if (!cleaned) return '';

  // If user passed a raw key without FLWPUBK prefix (e.g. c9b9eca1-6bc8-44ea-bef6-e5a72f1bf873)
  if (!cleaned.toUpperCase().startsWith('FLWPUBK')) {
    cleaned = `FLWPUBK-${cleaned}`;
  }

  // Ensure trailing -X
  if (!cleaned.endsWith('-X') && !cleaned.endsWith('-x')) {
    cleaned = `${cleaned}-X`;
  }

  return cleaned;
}

export function getFlutterwavePublicKey(): string {
  // 1. Check browser localStorage override set by user in UI
  const localKey = localStorage.getItem('efado_flw_public_key');
  if (localKey && localKey.trim()) {
    const sanitizedLocal = sanitizeKey(localKey);
    // Ignore legacy test key if user wants live production payments
    if (sanitizedLocal && !sanitizedLocal.startsWith('FLWPUBK_TEST')) {
      return sanitizedLocal;
    }
  }
  
  // 2. Check environment variables (supporting both VITE_FLW_PUBLIC_KEY and variations)
  const rawEnvKey = (
    import.meta.env.VITE_FLW_PUBLIC_KEY || 
    import.meta.env.VITE_FLW_PUBLIC_KE || 
    ''
  ).trim();

  if (rawEnvKey) {
    const sanitized = sanitizeKey(rawEnvKey);
    if (sanitized) return sanitized;
  }
  
  // 3. Live Mode default public key formatted from user's live public key: c9b9eca1-6bc8-44ea-bef6-e5a72f1bf873
  return 'FLWPUBK-c9b9eca1-6bc8-44ea-bef6-e5a72f1bf873-X';
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

