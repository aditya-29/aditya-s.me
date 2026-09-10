// Run with SITE_TEST_MODULES pointing to a directory containing playwright and @axe-core/playwright.
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const http = require('node:http');
const modules = process.env.SITE_TEST_MODULES || '/private/tmp/personal-site-tools/node_modules';
const { chromium } = require(path.join(modules, 'playwright'));
const AxeBuilder = require(path.join(modules, '@axe-core/playwright')).default;
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'checks', 'artifacts');
fs.mkdirSync(output, { recursive: true });
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.bib': 'text/plain; charset=utf-8' };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(root, name === '/' ? 'index.html' : name);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});

(async () => {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const report = { browser: '', results: [] };
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    report.browser = await browser.version();
    for (const width of [320, 375, 390, 640, 768, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
      await page.goto(base, { waitUntil: 'networkidle' });
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      assert(dimensions.content <= dimensions.viewport, `Horizontal overflow at ${width}px`);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('.paper').count(), 4);
      assert.equal(await page.locator('.profile-portrait img[alt="Portrait of Aditya Shanmugham"]').count(), 1);
      assert.equal(await page.locator('.profile-portrait img').evaluate(image => image.complete && image.naturalWidth > 0), true, 'Profile photo must load');
      assert.equal(await page.locator('a[href="https://github.com/aditya-29/"]').count(), 2);
      assert.equal(await page.locator('a[href="mailto:shanmugham.aditya2901@gmail.com"]').count(), 1);
      const stillFrame = await page.locator('#graph-background').evaluate(canvas => canvas.toDataURL());
      await page.waitForTimeout(120);
      assert.equal(await page.locator('#graph-background').evaluate(canvas => canvas.toDataURL()), stillFrame, 'Reduced-motion setting must start static');
      const anchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(a => a.getAttribute('href')));
      for (const anchor of anchors) assert.equal(await page.locator(anchor).count(), 1, `Invalid anchor ${anchor}`);
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      report.results.push({ width, horizontalOverflow: false, accessibilityViolations: audit.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), errors });
      assert.equal(audit.violations.length, 0, JSON.stringify(report.results.at(-1)));
      assert.deepEqual(errors, []);
      if ([375, 768, 1440].includes(width)) await page.screenshot({ path: path.join(output, `site-${width}.png`), fullPage: true });
      if (width === 1440) {
        await page.keyboard.press('Tab');
        assert.equal(await page.locator(':focus').innerText(), 'Skip to content');
        await page.keyboard.press('Enter');
        await page.locator('nav a[href="#publications"]').click();
        assert.equal(new URL(page.url()).hash, '#publications');
        await page.locator('nav a[href="#experience"]').click();
        assert.equal(new URL(page.url()).hash, '#experience');
        await page.locator('.experience-description a[href="#deepcodeseek"]').click();
        assert.equal(new URL(page.url()).hash, '#deepcodeseek');
        for (const file of ['reveal', 'agentic-ecg', 'deepcodeseek', 'sleep-apnea']) {
          const [download] = await Promise.all([page.waitForEvent('download'), page.locator(`a[href="citations/${file}.bib"]`).click()]);
          assert.equal(download.suggestedFilename(), `${file}.bib`);
          assert.equal(await download.failure(), null);
        }
        await page.emulateMedia({ media: 'print' });
        await page.pdf({ path: path.join(output, 'print-preview.pdf'), format: 'A4', margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' } });
      }
      await context.close();
      console.log(`PASS ${width}px: layout, assets, anchors, headings, accessibility`);
    }
    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const plain = await noJS.newPage();
    await plain.goto(base);
    assert.equal(await plain.locator('.paper h3').count(), 4);
    assert.equal(await plain.locator('#motion-toggle').count(), 0);
    await plain.locator('nav a[href="#contact"]').click();
    assert.equal(new URL(plain.url()).hash, '#contact');
    await noJS.close();
    const animated = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference', deviceScaleFactor: 3 });
    const live = await animated.newPage();
    const animationErrors = [];
    live.on('pageerror', error => animationErrors.push(error.message));
    await live.goto(base, { waitUntil: 'networkidle' });
    const snapshot = () => live.locator('#graph-background').evaluate(canvas => canvas.toDataURL());
    const firstFrame = await snapshot();
    await live.waitForTimeout(250);
    assert.notEqual(await snapshot(), firstFrame, 'Graph must animate');
    assert.equal(await live.locator('#graph-background').evaluate(canvas => canvas.width), 2160, 'Canvas resolution should cap device pixel ratio');
    await live.emulateMedia({ reducedMotion: 'reduce' });
    const reducedFrame = await snapshot();
    await live.waitForTimeout(200);
    assert.equal(await snapshot(), reducedFrame, 'Preference changes must pause animation');
    await live.mouse.move(1160, 260);
    await live.waitForTimeout(80);
    assert.notEqual(await snapshot(), reducedFrame, 'Pointer movement must change graph orientation');
    await live.setViewportSize({ width: 390, height: 844 });
    await live.waitForTimeout(100);
    assert.equal(await live.locator('#graph-background').evaluate(canvas => canvas.width), 585);
    await live.emulateMedia({ reducedMotion: 'no-preference' });
    const mobileFrame = await snapshot();
    await live.waitForTimeout(200);
    assert.notEqual(await snapshot(), mobileFrame, 'Mobile graph must animate after resize');
    await live.evaluate(() => window.scrollTo({ top: 600 }));
    await live.waitForTimeout(40);
    const scrollFrame = await snapshot();
    await live.waitForTimeout(70);
    assert.equal(await snapshot(), scrollFrame, 'Mobile graph must pause while scrolling');
    assert.deepEqual(animationErrors, []);
    await animated.close();
    report.animation = 'passed: live frames, reduced-motion startup and changes, resize, capped resolution';
    report.keyboardAndDownloads = 'passed';
    report.withoutJavaScript = 'passed';
    console.log('PASS keyboard navigation, four citation downloads, print output, and no-JavaScript reading/navigation.');
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
