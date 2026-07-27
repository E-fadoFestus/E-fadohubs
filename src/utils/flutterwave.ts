function sanitizeKey(rawKey: string): string {
  let cleaned = rawKey.trim();
  if (cleaned.includes('=')) {
    cleaned = cleaned.split('=').pop() || '';
  }
  cleaned = cleaned.replace(/['";]/g, '').trim();

  // If user pasted a key starting with FLWPUBK_TEST or FLWPUBK but forgot the trailing '-X'
  if (
    (cleaned.startsWith('FLWPUBK_TEST') || cleaned.startsWith('FLWPUBK-')) &&
    !cleaned.endsWith('-X') &&
    !cleaned.endsWith('-x')
  ) {
    cleaned = `${cleaned}-X`;
  }

  return cleaned;
}

export function getFlutterwavePublicKey(): string {
  // 1. Check browser localStorage override set by user in UI
  const localKey = localStorage.getItem('efado_flw_public_key');
  if (localKey && localKey.trim()) {
    const sanitizedLocal = sanitizeKey(localKey);
    if (sanitizedLocal) return sanitizedLocal;
  }
  
  // 2. Check environment variables (supporting both correct and truncated secret names)
  const rawEnvKey = (
    import.meta.env.VITE_FLW_PUBLIC_KEY || 
    import.meta.env.VITE_FLW_PUBLIC_KE || 
    ''
  ).trim();

  if (rawEnvKey) {
    const sanitized = sanitizeKey(rawEnvKey);
    if (sanitized) return sanitized;
  }
  
  // 3. Fallback working test key placeholder
  return 'FLWPUBK_TEST-a3e7403487053e164c9f139d2c2ad3c1-X';
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

