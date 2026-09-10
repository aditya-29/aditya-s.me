const { chromium } = require('/private/tmp/personal-site-tools/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const references = [
  ['jon-barron', 'https://jonbarron.info/'],
  ['chelsea-finn', 'https://ai.stanford.edu/~cbfinn/'],
  ['yoon-kim', 'https://people.csail.mit.edu/yoonkim/'],
  ['danqi-chen', 'https://www.cs.princeton.edu/~danqic/'],
  ['tri-dao', 'https://tridao.me/'],
  ['vincent-sitzmann', 'https://www.vincentsitzmann.com/'],
  ['colin-raffel', 'https://colinraffel.com/'],
  ['sharon-li', 'https://pages.cs.wisc.edu/~sharonli/'],
  ['karthik-narasimhan', 'https://karthikncode.github.io/'],
  ['he-he', 'https://hhexiy.ai/'],
  ['graham-neubig', 'https://www.phontron.com/'],
  ['sanjeev-arora', 'https://profsanjeevarora.github.io/']
];
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const directory = '/private/tmp/researcher-pages/screenshots';
  fs.mkdirSync(directory, { recursive: true });
  const results = [];
  try {
    for (let i = 0; i < references.length; i += 4) {
      await Promise.all(references.slice(i, i + 4).map(async ([name, url]) => {
        const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
          await page.waitForTimeout(1500);
          await page.screenshot({ path: path.join(directory, `${name}.png`), timeout: 10000 });
          const info = await page.evaluate(() => ({ title: document.title, textLength: document.body.innerText.length }));
          results.push({ name, url: page.url(), ...info, screenshot: `${name}.png` });
        } catch (error) { results.push({ name, url, error: error.message.split('\n')[0] }); }
        finally { await page.close(); }
      }));
      console.log(`Rendered ${Math.min(i + 4, references.length)} / ${references.length} references`);
    }
    fs.writeFileSync('research/visual-evidence.json', JSON.stringify(results, null, 2) + '\n');
  } finally { await browser.close(); }
})();
