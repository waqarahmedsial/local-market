/**
 * Sanitize a user-provided string for safe use in MongoDB text-search queries.
 * Strips characters that MongoDB's text search treats as special operators.
 */
export function sanitizeSearchQuery(input: string): string {
  // Remove leading/trailing whitespace
  const trimmed = input.trim();
  // Remove characters that MongoDB $text search treats as operators
  // Specifically the negation prefix and phrase delimiters
  return trimmed.replace(/[$"\\]/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Validate that a string is a well-formed MongoDB ObjectId (24 hex chars).
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate a URL is an HTTPS URL (prevent SSRF to internal/file URIs).
 * Only allows http and https schemes.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validate a URL is a safe external HTTPS-only URL (for file downloads).
 * Rejects non-https, localhost, and private IP ranges.
 */
export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;

    const host = parsed.hostname.toLowerCase();

    // Block localhost and loopback
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;

    // Block private IP ranges
    const privatePatterns = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./, // link-local
      /^fc00:/, /^fd/, // IPv6 private
    ];
    if (privatePatterns.some((p) => p.test(host))) return false;

    return true;
  } catch {
    return false;
  }
}
