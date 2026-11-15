import {
  BATCH_MAX,
  BATCH_MIN,
  BATCH_STEP,
  getBatchSize,
  onBatchSizeChange,
  setBatchSize,
  type BatchPage,
} from './batchSize';
import { SELECTORS } from './youtube/selectors';
import { whenAvailable } from './youtube/whenAvailable';

const STYLE_ID = 'yti-account-menu-styles';
const PANEL_ID = 'yti-batch-settings';

const ROWS: ReadonlyArray<{ page: BatchPage; label: string }> = [
  { page: 'subscriptions', label: 'Subscriptions' },
  { page: 'discover', label: 'Discover' },
];

/**
 * YouTube's theme CSS variables have obfuscated names, so the panel uses
 * YouTube's light and dark theme colors directly, matching the Load More button.
 */
const STYLES = `
#${PANEL_ID} {
  box-sizing: border-box;
  padding: 12px 16px 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-family: "Roboto", "Arial", sans-serif;
  color: #0f0f0f;
}
${SELECTORS.darkTheme} #${PANEL_ID} {
  border-bottom-color: rgba(255, 255, 255, 0.1);
  color: #f1f1f1;
}
#${PANEL_ID} .yti-batch-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
}
#${PANEL_ID} .yti-batch-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
}
#${PANEL_ID} .yti-batch-value {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
#${PANEL_ID} .yti-batch-slider {
  margin-bottom: 8px;
}
#${PANEL_ID} .yti-batch-slider:last-child {
  margin-bottom: 4px;
}
#${PANEL_ID} .yti-batch-track {
  position: relative;
  margin-top: 4px;
}
#${PANEL_ID} .yti-batch-ticks {
  position: absolute;
  left: 7px;
  right: 7px;
  top: 11px;
  height: 6px;
  pointer-events: none;
  z-index: 0;
}
#${PANEL_ID} .yti-batch-tick {
  position: absolute;
  top: 0;
  width: 1px;
  height: 6px;
  background: rgba(0, 0, 0, 0.22);
  transform: translateX(-50%);
}
${SELECTORS.darkTheme} #${PANEL_ID} .yti-batch-tick {
  background: rgba(255, 255, 255, 0.28);
}
#${PANEL_ID} .yti-batch-track input[type="range"] {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  margin: 0;
  height: 20px;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}
#${PANEL_ID} .yti-batch-track input[type="range"]::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
}
#${PANEL_ID} .yti-batch-track input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5.5px;
  border-radius: 50%;
  background: #606060;
  border: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}
#${PANEL_ID} .yti-batch-track input[type="range"]::-moz-range-track {
  height: 3px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
  border: none;
}
#${PANEL_ID} .yti-batch-track input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #606060;
  border: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}
${SELECTORS.darkTheme} #${PANEL_ID} .yti-batch-track input[type="range"]::-webkit-slider-runnable-track {
  background: rgba(255, 255, 255, 0.2);
}
${SELECTORS.darkTheme} #${PANEL_ID} .yti-batch-track input[type="range"]::-webkit-slider-thumb {
  background: #aaaaaa;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}
${SELECTORS.darkTheme} #${PANEL_ID} .yti-batch-track input[type="range"]::-moz-range-track {
  background: rgba(255, 255, 255, 0.2);
}
${SELECTORS.darkTheme} #${PANEL_ID} .yti-batch-track input[type="range"]::-moz-range-thumb {
  background: #aaaaaa;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}
#${PANEL_ID} .yti-batch-ends {
  display: flex;
  justify-content: space-between;
  margin-top: 2px;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: rgba(0, 0, 0, 0.45);
}
${SELECTORS.darkTheme} #${PANEL_ID} .yti-batch-ends {
  color: rgba(255, 255, 255, 0.45);
}
`;

/**
 * Puts a Subscriptions slider and a Discover slider at the top of YouTube's account
 * menu. YouTube creates that menu lazily, nested inside `ytd-popup-container`
 * (often by filling a dropdown that already exists), so watching the popup
 * host's direct children is not enough. Opening the avatar / settings-gear
 * button arms a short-lived subtree observer on the popup host until the
 * sliders are in the open dropdown. YouTube can keep a previous menu in the
 * DOM; the panel is moved into the dropdown that is not `aria-hidden`.
 */
export function startAccountMenu(): void {
  injectStyles();
  onBatchSizeChange(syncOpenPanel);

  let frame: number | undefined;
  let menuRoot: Element | null = null;
  const menuObserver = new MutationObserver(() => scheduleEnsure());
  const popupSubtreeObserver = new MutationObserver(() => scheduleEnsure());

  const scheduleEnsure = (): void => {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      observeAccountMenu();
      if (ensurePanel()) popupSubtreeObserver.disconnect();
    });
  };

  const observeAccountMenu = (): void => {
    if (menuRoot && !menuRoot.isConnected) {
      menuObserver.disconnect();
      menuRoot = null;
    }
    const sections = findOpenAccountMenuSections();
    const menu = sections?.closest(SELECTORS.accountMenuRenderer) ?? null;
    if (menu === menuRoot) return;
    menuObserver.disconnect();
    menuRoot = menu;
    if (!menu) return;
    menuObserver.observe(menu, { childList: true, subtree: true });
  };

  const watchPopupUntilMenu = (popup: Element): void => {
    popupSubtreeObserver.disconnect();
    popupSubtreeObserver.observe(popup, { childList: true, subtree: true });
    scheduleEnsure();
  };

  const onTopbarMenuClick = (event: Event): void => {
    if (!eventComesFromTopbarMenuButton(event)) return;
    const popup = document.querySelector(SELECTORS.popupContainer);
    if (popup) watchPopupUntilMenu(popup);
  };

  const onTopbarMenuKey = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    onTopbarMenuClick(event);
  };

  window.addEventListener('click', onTopbarMenuClick, true);
  window.addEventListener('keydown', onTopbarMenuKey, true);

  whenAvailable(SELECTORS.popupContainer, () => {
    observeAccountMenu();
    ensurePanel();
  });
  ensurePanel();
}

function eventComesFromTopbarMenuButton(event: Event): boolean {
  for (const node of event.composedPath()) {
    if (node instanceof Element && node.matches(SELECTORS.topbarMenuButton)) return true;
  }
  return false;
}

/**
 * The popup container can keep more than one account menu. Closed dropdowns
 * stay in the DOM with `aria-hidden="true"`; inserting into the first match
 * leaves the visible menu (e.g. on watch or Discover) without sliders.
 */
function findOpenAccountMenuSections(): HTMLElement | null {
  for (const sections of document.querySelectorAll<HTMLElement>(SELECTORS.accountMenuSections)) {
    if (isOpenAccountMenu(sections)) return sections;
  }
  return null;
}

function isOpenAccountMenu(sections: Element): boolean {
  const dropdown = sections.closest(SELECTORS.popupDropdown);
  if (dropdown?.getAttribute('aria-hidden') === 'true') return false;
  if (dropdown?.hasAttribute('hidden')) return false;
  const container = sections.closest('#container');
  if (container?.hasAttribute('hidden')) return false;
  return true;
}

/** Returns true when the panel is in the menu the user can see. */
function ensurePanel(): boolean {
  const sections = findOpenAccountMenuSections();
  if (!sections) return false;

  let panel = document.getElementById(PANEL_ID);
  if (!panel) panel = createPanel();
  if (sections.firstElementChild !== panel) sections.prepend(panel);
  syncPanel(panel);
  return true;
}

function syncOpenPanel(): void {
  const panel = document.getElementById(PANEL_ID);
  if (panel) syncPanel(panel);
}

/** Only writes values that differ, so its own changes don't trigger the observer again. */
function syncPanel(panel: HTMLElement): void {
  for (const { page } of ROWS) {
    const size = String(getBatchSize(page));
    const input = panel.querySelector<HTMLInputElement>(`input[data-page="${page}"]`);
    const value = panel.querySelector(`[data-value-for="${page}"]`);
    if (input && input.value !== size) input.value = size;
    if (value && value.textContent !== size) value.textContent = size;
  }
}

function createPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  const title = document.createElement('p');
  title.className = 'yti-batch-title';
  title.textContent = 'Videos at a time';
  panel.append(title);

  for (const { page, label } of ROWS) {
    panel.append(createSliderRow(page, label));
  }

  return panel;
}

function createSliderRow(page: BatchPage, label: string): HTMLElement {
  const inputId = `yti-batch-${page}`;
  const block = document.createElement('div');
  block.className = 'yti-batch-slider';

  const row = document.createElement('label');
  row.className = 'yti-batch-row';
  row.htmlFor = inputId;

  const name = document.createElement('span');
  name.textContent = label;

  const value = document.createElement('span');
  value.className = 'yti-batch-value';
  value.dataset.valueFor = page;
  value.textContent = String(getBatchSize(page));

  row.append(name, value);

  const track = document.createElement('div');
  track.className = 'yti-batch-track';

  const ticks = document.createElement('div');
  ticks.className = 'yti-batch-ticks';
  ticks.setAttribute('aria-hidden', 'true');
  const span = BATCH_MAX - BATCH_MIN;
  for (let v = BATCH_MIN; v <= BATCH_MAX; v += BATCH_STEP) {
    const tick = document.createElement('span');
    tick.className = 'yti-batch-tick';
    tick.style.left = `${((v - BATCH_MIN) / span) * 100}%`;
    ticks.append(tick);
  }

  const input = document.createElement('input');
  input.id = inputId;
  input.type = 'range';
  input.min = String(BATCH_MIN);
  input.max = String(BATCH_MAX);
  input.step = String(BATCH_STEP);
  input.value = String(getBatchSize(page));
  input.dataset.page = page;
  input.setAttribute('aria-label', `${label} videos at a time, ${BATCH_MIN} to ${BATCH_MAX}`);
  input.setAttribute('aria-valuemin', String(BATCH_MIN));
  input.setAttribute('aria-valuemax', String(BATCH_MAX));
  // YouTube's menu handles pointer and arrow keys for its own items.
  input.addEventListener('pointerdown', (event) => event.stopPropagation());
  input.addEventListener('keydown', (event) => event.stopPropagation());
  input.addEventListener('input', () => {
    const size = Number(input.value);
    value.textContent = String(size);
    input.setAttribute('aria-valuenow', String(size));
    setBatchSize(page, size);
  });
  input.setAttribute('aria-valuenow', input.value);

  const ends = document.createElement('div');
  ends.className = 'yti-batch-ends';
  const min = document.createElement('span');
  min.textContent = String(BATCH_MIN);
  const max = document.createElement('span');
  max.textContent = String(BATCH_MAX);
  ends.append(min, max);

  track.append(ticks, input, ends);
  block.append(row, track);
  return block;
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  (document.head ?? document.documentElement).append(style);
}
