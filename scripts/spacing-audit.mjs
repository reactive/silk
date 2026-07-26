// Renders Storybook stories headlessly and dumps computed spacing/sizing geometry
// plus screenshots, so layout review is based on actual rendering.
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
  const els = [];
  const collect = (el, depth, path) => {
    if (depth > 14) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    els.push({ el, depth, path, r });
    let i = 0;
    for (const c of el.children) collect(c, depth + 1, `${path}/${i++}`);
  };
  collect(root, 0, '');

  return els.map(({ el, depth, path, r }) => {
    const cs = getComputedStyle(el);
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
    return {
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
    };
  });
};

const browser = await chromium.launch();
try {
  await mkdir(OUT, { recursive: true });
  const report = {};
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: 900 },
    deviceScaleFactor: 2,
  });
  try {
    for (const id of TARGETS) {
      await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForSelector('#storybook-root *', { state: 'attached' });
      report[id] = await page.evaluate(probe);
      await page.screenshot({
        path: `${OUT}${id}.png`,
        fullPage: true,
        animations: 'disabled',
      });
      console.log('captured', id);
    }
  } finally {
    await page.close();
  }

  await writeFile(
    `${OUT}${process.env.OUT_NAME ?? 'geometry'}.json`,
    JSON.stringify(report, null, 1),
  );
  console.log('->', OUT);
} finally {
  await browser.close();
}
