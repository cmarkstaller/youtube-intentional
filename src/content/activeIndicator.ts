const INDICATOR_ID = 'yt-intentional-active-indicator';
const VISIBLE_MS = 4000;
const FADE_MS = 400;

/**
 * Shows a small, temporary badge confirming the content script is running.
 * Development aid only; it removes itself and never intercepts clicks.
 */
export function showActiveIndicator(): void {
  if (document.getElementById(INDICATOR_ID)) {
    return;
  }

  const indicator = document.createElement('div');
  indicator.id = INDICATOR_ID;
  indicator.textContent = 'YouTube Intentional active';
  Object.assign(indicator.style, {
    position: 'fixed',
    bottom: '16px',
    left: '16px',
    zIndex: '2147483647',
    padding: '6px 12px',
    borderRadius: '16px',
    background: 'rgba(15, 15, 15, 0.9)',
    color: '#fff',
    font: '500 12px Roboto, Arial, sans-serif',
    pointerEvents: 'none',
    opacity: '1',
    transition: `opacity ${FADE_MS}ms ease`,
  } satisfies Partial<CSSStyleDeclaration>);

  document.body.append(indicator);

  window.setTimeout(() => {
    indicator.style.opacity = '0';
    window.setTimeout(() => indicator.remove(), FADE_MS);
  }, VISIBLE_MS);
}
