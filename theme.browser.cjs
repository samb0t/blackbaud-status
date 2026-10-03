/* Visual fixture based on the reported layout, not a copy of the signed-in site.
 * Run: node theme.browser.cjs /absolute/existing/screenshot-directory
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { resolve, join } = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date(2026, 9, 2, 12));
    await page.goto(pathToFileURL(resolve('theme-preview.html')).href + '#calendar');
    const panel = page.locator('#bbs-personal-status');
    await panel.locator('#theme').click();
    await panel.locator('#collapse').click();
    const screenshot = async name => {
      if (process.argv[2]) await page.screenshot({ path: join(process.argv[2], name + '.png'), fullPage: true });
    };
    await screenshot('calendar-dark');
    await page.locator('#directories').click();
    await screenshot('calendar-dark-menu');

    // Measure rendered contrast against the nearest painted ancestor. Checking
    // text color alone misses dark text over a transparent navigation wrapper.
    const checkContrast = async () => {
      const results = await page.locator('header a, header .badge, nav a').evaluateAll(nodes => {
        const rgb = value => value.match(/[\d.]+/g).map(Number);
        const luminance = channels => channels.slice(0, 3).map(value => {
          const s = value / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
        }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
        return nodes.filter(node => node.getClientRects().length).map(node => {
          const textNode = [...node.querySelectorAll('span')].at(-1) || node;
          let background = [255, 255, 255];
          for (let ancestor = textNode; ancestor; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor);
            // Use the first stop for this fixture's pale active-tab gradient.
            const gradientColor = style.backgroundImage.match(/rgba?\([^)]+\)/)?.[0];
            const color = rgb(gradientColor || style.backgroundColor);
            if (color.length === 3 || color[3] === 1) { background = color; break; }
          }
          const fg = luminance(rgb(getComputedStyle(textNode).color)), bg = luminance(background);
          return { label: node.textContent.trim(), ratio: (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05) };
        });
      });
      for (const { label, ratio } of results) assert.ok(ratio >= 4.5, `${label}: contrast ${ratio.toFixed(2)}:1 is below 4.5:1`);
      return Math.min(...results.map(result => result.ratio));
    };
    const minimum = await checkContrast();
    assert.equal(await page.locator('.branding-band').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(117, 197, 223)');
    assert.equal(await page.locator('.navigation-band').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 251, 220)');
    assert.equal(await page.locator('.fc-toolbar').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(34, 48, 68)');
    await page.locator('nav a[href="#resources"]').hover();
    await checkContrast();
    await page.locator('nav .active').focus();
    await checkContrast();
    await screenshot('calendar-dark-focus');
    await page.setViewportSize({ width: 1000, height: 800 });
    await checkContrast();
    await screenshot('calendar-dark-1000');
    await page.setViewportSize({ width: 1600, height: 950 });
    await page.locator('#directories').click();
    await page.locator('nav a[href="#resources"]').click();
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-bbs-dark'));
    assert.equal(await page.locator('.branding-band').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(117, 197, 223)');
    assert.equal(await page.locator('header a').first().evaluate(node => getComputedStyle(node).color), 'rgb(181, 196, 213)');
    await screenshot('resources-native');
    await page.locator('nav .active').click();
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-bbs-dark'));
    await checkContrast();
    await panel.locator('#theme').click();
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-bbs-dark'));
    await screenshot('calendar-light');
    assert.deepEqual(errors, []);
    console.log(`Theme visual checks passed; minimum default navigation contrast ${minimum.toFixed(2)}:1. Screenshots: ${process.argv[2] || '(not requested)'}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
