/**
 * Safely extracts a human-readable string from any Error, API JSON payload,
 * Vercel error object, or unknown rejection value. Never returns "[object Object]".
 */
export function extractErrorMessage(
  input: unknown,
  fallback: string = 'Payment failed, please try again.'
): string {
  const seen = new Set<unknown>();

  const unwrap = (val: unknown, depth: number): string | null => {
    if (val === null || val === undefined || depth > 5) return null;

    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed || trimmed === '[object Object]' || trimmed.toLowerCase() === 'object object') {
        return null;
      }
      return trimmed;
    }

    if (typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }

    if (typeof val !== 'object') {
      return null;
    }

    if (seen.has(val)) return null;
    seen.add(val);

    if (Array.isArray(val)) {
      const parts = val
        .map((item) => unwrap(item, depth + 1))
        .filter((s): s is string => Boolean(s));
      return parts.length ? parts.join('; ') : null;
    }

    const obj = val as Record<string, any>;

    // Handle Error objects or custom error wrappers
    const candidateKeys = [
      'error',
      'message',
      'error_description',
      'detail',
      'details',
      'reason',
      'gateway_response',
      'raw',
      'statusText',
      'code'
    ];

    // Prefer Error.message if it's not "[object Object]"
    if (val instanceof Error) {
      const msgStr = unwrap(val.message, depth + 1);
      if (msgStr) return msgStr;
    }

    // Check data/response wrappers too
    if (obj.data && typeof obj.data === 'object') {
      const nested = unwrap(obj.data, depth + 1);
      if (nested) return nested;
    }

    for (const key of candidateKeys) {
      if (key in obj && obj[key] !== undefined && obj[key] !== null) {
        const extracted = unwrap(obj[key], depth + 1);
        if (extracted) {
          if (key === 'code' && obj.message) {
            const msg = unwrap(obj.message, depth + 1);
            if (msg) return `${extracted}: ${msg}`;
          }
          return extracted;
        }
      }
    }

    try {
      const json = JSON.stringify(obj);
      if (json && json !== '{}' && json !== '[]') {
        return json.length > 260 ? `${json.slice(0, 260)}...` : json;
      }
    } catch {
      // Ignore circular serialization errors
    }

    return null;
  };

  return unwrap(input, 0) || fallback;
}

/**
 * Safely reads a fetch Response body whether JSON or plain text/HTML.
 */
export async function readResponseSafely(
  res: Response
): Promise<{ data: any; rawText: string }> {
  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    return { data: null, rawText: '' };
  }
  if (!rawText) {
    return { data: null, rawText: '' };
  }
  try {
    return { data: JSON.parse(rawText), rawText };
  } catch {
    return { data: null, rawText };
  }
}
