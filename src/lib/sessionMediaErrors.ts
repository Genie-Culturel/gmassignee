/** TUS / Storage size-limit errors, mapped to the GM-facing French copy. */

type TusLikeError = {
  originalResponse?: {
    getStatus?: () => number;
    getBody?: () => string;
  };
  causingError?: unknown;
};

export function sessionMediaTooLargeMessage(maxLabel: string): string {
  return `Fichier trop lourd (max ${maxLabel}).`;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? '');
}

/** HTTP 413 « Maximum size exceeded » from TUS, or our already-mapped French copy. */
export function isSessionMediaSizeExceededError(error: unknown): boolean {
  if (error == null) return false;
  const msg = errorText(error);
  if (/fichier trop lourd/i.test(msg)) return true;
  if (/maximum size exceeded/i.test(msg) || /response code:\s*413/i.test(msg)) return true;
  const tus = error as TusLikeError;
  if (tus.originalResponse?.getStatus?.() === 413) return true;
  const body = tus.originalResponse?.getBody?.();
  if (typeof body === 'string' && /maximum size exceeded/i.test(body)) return true;
  if (tus.causingError && tus.causingError !== error) {
    return isSessionMediaSizeExceededError(tus.causingError);
  }
  return false;
}

export function mapSessionMediaUploadError(error: unknown, maxLabel: string): Error {
  if (isSessionMediaSizeExceededError(error)) {
    return new Error(sessionMediaTooLargeMessage(maxLabel));
  }
  return error instanceof Error ? error : new Error(String(error));
}
