/**
 * Runs `onTarget` when `selector` matches, now or when it appears later.
 * At `document_start`, nodes like `ytd-app` are often not in the DOM yet.
 */
export function whenAvailable(selector: string, onTarget: (element: Element) => void): () => void {
  const found = document.querySelector(selector);
  if (found) {
    onTarget(found);
    return () => {};
  }

  const observer = new MutationObserver(() => {
    const element = document.querySelector(selector);
    if (!element) return;
    observer.disconnect();
    onTarget(element);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return () => observer.disconnect();
}
