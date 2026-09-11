let handler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void) {
  handler = fn;
}
export function notifyUnauthorized() {
  handler?.();
}
