import { SELECTORS } from './youtube/selectors';

const STYLE_ID = 'yti-sidebar-styles';

interface Icon {
  outlined: string;
  /** Shown on the current page's entry, like YouTube's own icons. */
  filled: string;
}

/** Material Icons "home" and "explore", Apache License 2.0. */
const HOME_ICON: Icon = {
  outlined: 'M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z',
  filled: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
};
const DISCOVER_ICON: Icon = {
  outlined:
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z',
  filled:
    'M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z',
};

/** YouTube's sidebar entries and the label each one is shown with. */
const LABELS: ReadonlyArray<{ entry: string; label: string }> = [
  { entry: SELECTORS.guideSubscriptionsEntry, label: 'Home' },
  { entry: SELECTORS.guideHomeEntry, label: 'Discover' },
];

/**
 * Icons are drawn as a CSS mask filled with the text color, so they follow
 * YouTube's light and dark theme. YouTube's own SVG stays in place, hidden.
 */
function iconRule(entry: string, icon: Icon): string {
  const icons = `${entry} ${SELECTORS.guideEntryIcon}`;
  const activeIcons =
    `${entry}${SELECTORS.guideEntryActive} ${SELECTORS.guideEntryIcon}, ` +
    `${entry} > ${SELECTORS.guideEntryLinkActive} ${SELECTORS.guideEntryIcon}`;
  return `
${icons} > * {
  visibility: hidden;
}
${icons} {
  background-color: currentColor;
  -webkit-mask: ${iconMask(icon.outlined)};
  mask: ${iconMask(icon.outlined)};
}
${activeIcons} {
  -webkit-mask: ${iconMask(icon.filled)};
  mask: ${iconMask(icon.filled)};
}`;
}

function iconMask(path: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${path}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 24px 24px no-repeat`;
}

/** Hides Shorts and moves Home (YouTube's Subscriptions entry) above Discover. */
const STYLES = `
${SELECTORS.guideShortsEntry} {
  display: none !important;
}
${SELECTORS.guideSectionItems} {
  display: flex;
  flex-direction: column;
}
${SELECTORS.guideSubscriptionsEntry} {
  order: -1;
}
${iconRule(SELECTORS.guideSubscriptionsEntry, HOME_ICON)}
${iconRule(SELECTORS.guideHomeEntry, DISCOVER_ICON)}
`;

/**
 * Turns YouTube's native sidebar into Home (Subscriptions), Discover, You.
 *
 * YouTube's own entries are reused, so their links, navigation, and "current
 * page" highlight keep working. Layout and icons are CSS. Labels are text, so
 * they are rewritten in place; YouTube renders the sidebar lazily and can
 * re-render it at any time, so a MutationObserver re-applies them. It runs for
 * the life of the tab, because the sidebar exists on every page.
 */
export function startSidebar(): void {
  injectStyles();

  let frame: number | undefined;
  const observer = new MutationObserver(() => {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      applyLabels();
    });
  });
  observer.observe(document.querySelector(SELECTORS.app) ?? document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['title', 'aria-label'],
  });
  applyLabels();
}

/** Only writes values that differ, so its own changes don't trigger it again. */
function applyLabels(): void {
  for (const { entry, label } of LABELS) {
    for (const element of document.querySelectorAll(entry)) {
      const link = element.querySelector(SELECTORS.guideEntryLink);
      if (link) {
        setAttribute(link, 'title', label);
        if (link.hasAttribute('aria-label')) setAttribute(link, 'aria-label', label);
      }
      for (const text of element.querySelectorAll(SELECTORS.guideEntryText)) {
        if (text.textContent !== label) text.textContent = label;
      }
    }
  }
}

function setAttribute(element: Element, name: string, value: string): void {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  (document.head ?? document.documentElement).append(style);
}
