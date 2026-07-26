/**
 * Renders Storybook stories headlessly and dumps computed spacing/sizing
 * geometry plus screenshots, so layout review is based on actual rendering
 * rather than on reading the source.
 *
 * Requires a running Storybook (`yarn docs`).
 *
 *   node scripts/spacing-audit.mjs                       # the default set
 *   node scripts/spacing-audit.mjs 'story-id,story-id'   # specific stories
 *
 * Env: SB_URL (origin), W (viewport width), OUT_NAME (json basename — give
 * concurrent runs different names so they do not clobber each other).
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = process.env.SB_URL ?? 'http://localhost:6006';
const OUT = new URL('../.audit/', import.meta.url).pathname;

const TARGETS = process.argv[2]
  ? process.argv[2].split(',')
  : [
      'fixtures-socialfeed--normal',
      'fixtures-socialfeed--long-thread',
      'fixtures-socialfeed--empty',
      'fixtures-socialfeed--loading',
      'fixtures-socialfeed--narrow',
      'fixtures-settingsform--normal',
      'fixtures-appskeleton--normal',
      'fixtures-inspectorpanel--normal',
      'components-composite-postcard--primary',
      'components-composite-profilecard--stacked',
      'components-composite-profilecard--horizontal',
      'components-composite-commentthread--primary',
      'components-composite-notification--unread',
      'components-composite-feeditem--post',
      'components-composite-feeditem--loading',
      'components-composite-statgroup--primary',
      'components-composite-emptystate--with-action',
      'components-composite-mediaobject--primary',
      'components-composite-identity--sizes',
      'components-composite-settingspanel--primary',
      'components-composite-actionbar--primary',
    ];

const WIDTH = Number(process.env.W ?? 900);

const probe = () => {
  const root = document.getElementById('storybook-root') ?? document.body;
  const px = (v) => (v && v !== '0px' ? v : null);
  const rows = [];
  const walk = (el, depth, path) => {
    if (depth > 14) return;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const tag = el.tagName.toLowerCase();
    const dataAttrs = {};
    for (const a of el.attributes) {
      if (a.name.startsWith('data-') && a.name !== 'data-testid')
        dataAttrs[a.name.slice(5)] = a.value;
    }
    const pad = [
      cs.paddingTop,
      cs.paddingRight,
      cs.paddingBottom,
      cs.paddingLeft,
    ];
    const mar = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft];
    rows.push({
      depth,
      path,
      tag,
      data: dataAttrs,
      display: cs.display,
      gap: px(cs.gap) ?? null,
      pad: pad.some((p) => p !== '0px') ? pad.join(' ') : null,
      mar: mar.some((m) => m !== '0px') ? mar.join(' ') : null,
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
      x: Math.round(r.x * 10) / 10,
      y: Math.round(r.y * 10) / 10,
      font: `${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight}`,
      radius: px(cs.borderRadius),
      border: cs.borderTopWidth !== '0px' ? cs.borderTopWidth : null,
      text:
        el.children.length === 0
          ? (el.textContent ?? '').trim().slice(0, 40)
          : null,
    });
    let i = 0;
    for (const c of el.children) walk(c, depth + 1, `${path}/${i++}`);
  };
  walk(root, 0, '');
  return rows;
};

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
const report = {};

for (const id of TARGETS) {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(400);

  // Storybook renders its own error page for an unknown id, which otherwise
  // gets captured as a perfectly valid-looking screenshot of nothing.
  if (await page.locator('text=/Couldn.t find story matching/').count()) {
    throw new Error(
      `No story matching '${id}'. Check the id in the story file.`,
    );
  }

  report[id] = await page.evaluate(probe);
  await page.screenshot({
    path: `${OUT}${id}.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.close();
  console.log('captured', id);
}

await writeFile(
  `${OUT}${process.env.OUT_NAME ?? 'geometry'}.json`,
  JSON.stringify(report, null, 1),
);
await browser.close();
console.log('->', OUT);
