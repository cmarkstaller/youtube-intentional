import { SELECTORS } from './youtube/selectors';
import { whenAvailable } from './youtube/whenAvailable';

const STYLE_ID = 'yti-sidebar-styles';

interface Icon {
  outlined: string;
  /** Shown on the current page's entry, like YouTube's own icons. */
  filled: string;
}

/** Material Icons "explore", Apache License 2.0. Subscriptions keeps YouTube's icon. */
const DISCOVER_ICON: Icon = {
  outlined:
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z',
  filled:
    'M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z',
};

/** YouTube's sidebar entries and the label each one is shown with. */
const LABELS: ReadonlyArray<{ entry: string; label: string }> = [
  { entry: SELECTORS.guideSubscriptionsEntry, label: 'Subscriptions' },
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

/** Hides Shorts and moves Subscriptions above Discover. */
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
${iconRule(SELECTORS.guideHomeEntry, DISCOVER_ICON)}
`;

/**
 * Turns YouTube's native sidebar into Subscriptions, Discover, You.
 *
 * YouTube's own entries are reused, so their links, navigation, and "current
 * page" highlight keep working. Layout and the Discover icon are CSS;
 * Subscriptions keeps YouTube's icon. Labels are text, so they are rewritten
 * in place; YouTube renders the sidebar lazily and can re-render it, so
 * observers on the guide drawer and mini-guide re-apply them.
 * Those trees are far smaller than `ytd-app`, so feed mutations do not wake
 * the label rewriter. Entry nodes are cached until they disconnect.
 */
export function startSidebar(): void {
  injectStyles();
  applyLabels();

  let frame: number | undefined;
  const observer = new MutationObserver(() => {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      applyLabels();
    });
  });

  const observedRoots = new Set<Element>();
  const observeRoot = (root: Element): void => {
    if (observedRoots.has(root)) return;
    observedRoots.add(root);
    cachedEntries = LABELS.map(() => []);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'aria-label'],
    });
    applyLabels();
  };

  const attachGuideRoots = (): void => {
    for (const root of document.querySelectorAll(
      `${SELECTORS.guideDrawer}, ${SELECTORS.guideRenderer}, ${SELECTORS.miniGuideRenderer}`,
    )) {
      observeRoot(root);
    }
  };

  whenAvailable(SELECTORS.guideRenderer, observeRoot);
  whenAvailable(SELECTORS.miniGuideRenderer, observeRoot);
  whenAvailable(SELECTORS.app, (app) => {
    attachGuideRoots();
    // Direct children only: the feed lives deeper, so this does not see card
    // mutations. It does see `#guide` and the mini-guide mounting.
    new MutationObserver(attachGuideRoots).observe(app, { childList: true });
  });
}

/** Cached Subscriptions / Discover entries; empty arrays mean "look up again". */
let cachedEntries: Element[][] = LABELS.map(() => []);

/** Only writes values that differ, so its own changes don't trigger it again. */
function applyLabels(): void {
  for (let i = 0; i < LABELS.length; i++) {
    const { entry, label } = LABELS[i]!;
    let elements = cachedEntries[i] ?? [];
    if (elements.length === 0 || elements.some((element) => !element.isConnected)) {
      elements = collectEntries(entry);
      cachedEntries[i] = elements;
    }
    for (const element of elements) {
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

function collectEntries(selector: string): Element[] {
  const roots = document.querySelectorAll(
    `${SELECTORS.guideDrawer}, ${SELECTORS.guideRenderer}, ${SELECTORS.miniGuideRenderer}`,
  );
  if (roots.length === 0) return [...document.querySelectorAll(selector)];

  const elements: Element[] = [];
  const seen = new Set<Element>();
  const add = (element: Element): void => {
    if (seen.has(element)) return;
    seen.add(element);
    elements.push(element);
  };
  for (const root of roots) {
    if (root.matches(selector)) add(root);
    for (const match of root.querySelectorAll(selector)) add(match);
  }
  return elements;
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
