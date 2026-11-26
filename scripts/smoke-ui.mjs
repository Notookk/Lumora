import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const browserCandidates = [
  process.env.LUMORA_BROWSER,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = browserCandidates.find((candidate) => existsSync(candidate));
if (!browser) throw new Error('Set LUMORA_BROWSER to a Chrome or Edge executable.');

const profile = await mkdtemp(resolve(tmpdir(), 'lumora-ui-'));
const port = 9333 + Math.floor(Math.random() * 300);
const child = spawn(browser, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  'about:blank',
], { stdio: 'ignore' });

const delay = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
let socket;
try {
  let targets;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      break;
    } catch {
      await delay(100);
    }
  }
  if (!targets) throw new Error('Browser debugging endpoint did not start.');
  const page = targets.find((target) => target.type === 'page');
  if (!page) throw new Error('Browser did not expose a page target.');

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolvePromise, reject) => {
    socket.addEventListener('open', resolvePromise, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let sequence = 0;
  const pending = new Map();
  const waiters = new Map();
  const exceptions = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve: resolvePromise, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolvePromise(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    const listeners = waiters.get(message.method);
    if (listeners) {
      waiters.delete(message.method);
      for (const listener of listeners) listener(message.params);
    }
  });

  const send = (method, params = {}) => new Promise((resolvePromise, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve: resolvePromise, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const waitFor = (method) => new Promise((resolvePromise) => {
    const listeners = waiters.get(method) ?? [];
    listeners.push(resolvePromise);
    waiters.set(method, listeners);
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const click = async (selector) => {
    const rect = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return null; const rect = element.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()`);
    if (!rect) throw new Error(`Element not found: ${selector}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...rect });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...rect, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...rect, button: 'left', clickCount: 1 });
  };
  const openMochiSettings = async () => {
    if (!await evaluate(`Boolean(document.querySelector('.settings-drawer'))`)) await click('.utility-controls button:last-child');
    await delay(250);
    await click('.settings-tabs button:nth-child(4)');
    await delay(250);
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const loaded = waitFor('Page.loadEventFired');
  await send('Page.navigate', { url: 'http://127.0.0.1:5173' });
  await Promise.race([loaded, delay(15000)]);
  await delay(1200);
  await evaluate('document.fonts.ready');

  const initial = await evaluate(`(() => {
    const rail = document.querySelector('.tab-rail').getBoundingClientRect();
    return {
      title: document.title,
      width: innerWidth,
      height: innerHeight,
      tabRows: document.querySelectorAll('.tab-row').length,
      railDisplay: getComputedStyle(document.querySelector('.tab-rail')).display,
      railWidth: Math.round(rail.width),
      railHeight: Math.round(rail.height),
      railTop: Math.round(rail.top),
      railBottom: Math.round(rail.bottom),
      searchWidth: Math.round(document.querySelector('.search-bar').getBoundingClientRect().width),
      hero: document.querySelector('.hero-wordmark')?.textContent,
      mochi: Boolean(document.querySelector('.mochi-avatar')),
      media: Boolean(document.querySelector('.dock-chip')),
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  })()`);
  if (initial.tabRows !== 4 || initial.railDisplay === 'none') throw new Error(`Desktop tab rail check failed: ${JSON.stringify(initial)}`);
  if (initial.railWidth !== 56 || initial.railHeight > initial.height * 0.65) throw new Error(`Collapsed rail geometry is invalid: ${JSON.stringify(initial)}`);
  if (initial.railTop < 0 || initial.railBottom > initial.height) throw new Error('Tab rail extends beyond the viewport.');
  if (initial.overflow) throw new Error('Desktop layout has horizontal overflow.');

  const railTarget = await evaluate(`(() => { const rect = document.querySelector('.tab-favicon').getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...railTarget });
  await delay(450);
  const expandedOpacity = await evaluate(`getComputedStyle(document.querySelector('.tab-rail-inner'), '::after').opacity`);
  if (Number(expandedOpacity) < 0.9) throw new Error(`Tab rail did not expand: ${expandedOpacity}`);

  const rowGap = await evaluate(`(() => { const rows = [...document.querySelectorAll('.tab-row')]; const first = rows[0].getBoundingClientRect(); const second = rows[1].getBoundingClientRect(); return { x: first.left + 130, y: (first.bottom + second.top) / 2 }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...rowGap });
  await delay(350);
  const gapHover = await evaluate(`(() => ({ hovering: document.querySelector('.tab-rail').matches(':hover'), opacity: getComputedStyle(document.querySelector('.tab-rail-inner'), '::after').opacity }))()`);
  if (!gapHover.hovering || Number(gapHover.opacity) < 0.9) throw new Error(`Rail collapsed while crossing a row gap: ${JSON.stringify(gapHover)}`);

  const gapCloseStates = await evaluate(`[...document.querySelectorAll('.tab-close')].map((element) => Number(getComputedStyle(element).opacity))`);
  if (gapCloseStates.some((opacity) => opacity > 0.1)) throw new Error(`Close controls remain visible in a row gap: ${gapCloseStates.join(',')}`);

  const secondFavicon = await evaluate(`(() => { const rect = document.querySelectorAll('.tab-favicon')[1].getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...secondFavicon });
  await delay(300);
  const hoveredCloseStates = await evaluate(`[...document.querySelectorAll('.tab-close')].map((element) => Number(getComputedStyle(element).opacity))`);
  if (hoveredCloseStates[0] > 0.1 || hoveredCloseStates[1] < 0.9) throw new Error(`Hovered close state is incorrect: ${hoveredCloseStates.join(',')}`);

  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 420 });
  await delay(450);
  const collapsedOpacity = await evaluate(`getComputedStyle(document.querySelector('.tab-rail-inner'), '::after').opacity`);
  if (Number(collapsedOpacity) > 0.1) throw new Error('Rail did not collapse after the pointer left.');
  await evaluate(`document.querySelector('.tab-main').focus()`);
  await delay(350);
  const keyboardExpanded = await evaluate(`getComputedStyle(document.querySelector('.tab-rail-inner'), '::after').opacity`);
  if (Number(keyboardExpanded) < 0.9) throw new Error('Keyboard focus did not expand the rail.');
  await evaluate(`document.activeElement.blur()`);

  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 700, deviceScaleFactor: 1, mobile: false });
  await delay(300);
  const tabletRail = await evaluate(`({ display: getComputedStyle(document.querySelector('.tab-rail')).display, overflow: document.documentElement.scrollWidth > innerWidth })`);
  if (tabletRail.display === 'none' || tabletRail.overflow) throw new Error(`Tablet rail layout failed: ${JSON.stringify(tabletRail)}`);
  await send('Emulation.setDeviceMetricsOverride', { width: 632, height: 616, deviceScaleFactor: 1, mobile: false });
  await delay(300);
  const compactRailDisplay = await evaluate(`getComputedStyle(document.querySelector('.tab-rail')).display`);
  if (compactRailDisplay !== 'none') throw new Error('Compact layout should hide the desktop tab rail.');

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...railTarget });
  await delay(450);
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(resolve(root, 'docs/assets/lumora-desktop.png'), Buffer.from(screenshot.data, 'base64'));

  await click('.utility-controls button:last-child');
  await delay(350);
  const settingsOpen = await evaluate(`Boolean(document.querySelector('.settings-drawer'))`);
  if (!settingsOpen) throw new Error('Settings drawer did not open.');
  const idleMochiHidden = await evaluate(`!document.querySelector('.mochi-panel') && document.querySelector('.utility-controls').classList.contains('mochi-off')`);
  if (!idleMochiHidden) throw new Error('Mochi should be hidden while idle.');

  await openMochiSettings();
  for (let index = 0; index < 4; index += 1) {
    await click('.button-row .primary-button');
    await delay(90);
  }
  await delay(400);
  const notificationState = await evaluate(`(() => {
    const avatar = document.querySelector('.mochi-avatar')?.getBoundingClientRect();
    return {
      visible: Boolean(document.querySelector('.mochi-panel')),
      avatarWidth: avatar ? Math.round(avatar.width) : 0,
      avatarHeight: avatar ? Math.round(avatar.height) : 0,
      activeCards: document.querySelectorAll('.notification-card:not(.is-exiting)').length,
      controlsReleased: !document.querySelector('.utility-controls').classList.contains('mochi-off'),
    };
  })()`);
  if (!notificationState.visible || notificationState.avatarWidth !== 48 || notificationState.avatarHeight !== 44) throw new Error(`Compact Mochi state is invalid: ${JSON.stringify(notificationState)}`);
  if (notificationState.activeCards !== 3 || !notificationState.controlsReleased) throw new Error(`Notification FIFO state is invalid: ${JSON.stringify(notificationState)}`);

  await click('.settings-header .icon-button');
  await delay(350);
  const notificationScreenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(resolve(root, 'docs/assets/lumora-notification.png'), Buffer.from(notificationScreenshot.data, 'base64'));
  await click('.notification-stack-header .icon-button');
  await delay(400);
  const clearedMochiHidden = await evaluate(`!document.querySelector('.mochi-panel') && document.querySelector('.utility-controls').classList.contains('mochi-off')`);
  if (!clearedMochiHidden) throw new Error('Mochi did not hide after clearing notifications.');

  await openMochiSettings();
  await click('.button-row .primary-button');
  await delay(250);
  await click('.settings-header .icon-button');
  await delay(250);
  await click('[aria-label="Dismiss notification"]');
  await delay(400);
  const dismissedMochiHidden = await evaluate(`!document.querySelector('.mochi-panel')`);
  if (!dismissedMochiHidden) throw new Error('Mochi did not hide after dismissing the last notification.');

  await openMochiSettings();
  await click('[aria-label="Do Not Disturb"]');
  await delay(150);
  await click('.settings-header .icon-button');
  await delay(250);
  const idleDndHidden = await evaluate(`!document.querySelector('.mochi-panel')`);
  if (!idleDndHidden) throw new Error('Mochi should stay hidden in Do Not Disturb mode while idle.');
  await openMochiSettings();
  await click('.button-row .primary-button');
  await delay(250);
  const dndNotificationState = await evaluate(`({ visible: Boolean(document.querySelector('.mochi-panel.is-dnd')), sleeping: Boolean(document.querySelector('.mochi-avatar.is-sleepy')), cards: document.querySelectorAll('.notification-card').length })`);
  if (!dndNotificationState.visible || !dndNotificationState.sleeping || dndNotificationState.cards !== 0) throw new Error(`Do Not Disturb notification state is invalid: ${JSON.stringify(dndNotificationState)}`);
  await click('.button-row .secondary-button');
  await delay(400);
  await click('[aria-label="Do Not Disturb"]');
  if (exceptions.length) throw new Error(`Browser exceptions: ${exceptions.join(' | ')}`);

  console.log(JSON.stringify({ ...initial, railExpandedOpacity: expandedOpacity, gapHoverPersistent: gapHover.hovering, keyboardExpanded: Number(keyboardExpanded) >= 0.9, tabletRail, compactRailDisplay, settingsOpen, idleMochiHidden, notificationState, clearedMochiHidden, dismissedMochiHidden, idleDndHidden, dndNotificationState, browserExceptions: exceptions.length }, null, 2));
} finally {
  try { socket?.close(); } catch {}
  child.kill();
  await delay(150);
  await rm(profile, { recursive: true, force: true });
}
