'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const repo = path.resolve(__dirname, '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-accordion-tabs-pack-'));
const tarballName = execFileSync('npm', ['pack', '--silent', '--pack-destination', tempRoot], {
  cwd: repo,
  encoding: 'utf8'
}).trim().split('\n').pop();
const tarball = path.join(tempRoot, tarballName);
const consumer = path.join(tempRoot, 'consumer');

fs.mkdirSync(consumer);
fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ name: 'consumer-fixture', private: true }, null, 2));
execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], {
  cwd: consumer,
  stdio: 'ignore'
});

const installed = path.join(consumer, 'node_modules', 'a11y-accordion-tabs');
const requiredFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'a11y-accordion-tabs.js',
  'a11y-accordion-tabs.min.js',
  'docs/styles.css'
];
requiredFiles.forEach(function (file) {
  assert.ok(fs.existsSync(path.join(installed, file)), 'missing packed file: ' + file);
});

for (const excluded of ['.agents', 'test', 'AGENTS.md', 'DEPENDENCY_AUDIT.md']) {
  assert.equal(fs.existsSync(path.join(installed, excluded)), false, 'unexpected packed file: ' + excluded);
}

const exported = require(path.join(installed));
assert.equal(typeof exported, 'function', 'package main must export the AccordionTabs constructor');
assert.equal(typeof exported.prototype.selectTab, 'function');
assert.equal(typeof exported.prototype.destroy, 'function');

function fixture (script) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Packed package smoke test</title>
  <link rel="stylesheet" href="file://${installed}/docs/styles.css">
</head>
<body>
  <main>
    <section class="accordion-tabs js-tabs">
      <ul role="tablist" aria-label="Pack smoke" class="tabs-tab-list">
        <li role="presentation"><a id="smoke-tab1" href="#smoke-panel1" role="tab" aria-controls="smoke-panel1" aria-selected="true" class="tabs-trigger js-tabs-trigger">One</a></li>
        <li role="presentation"><a id="smoke-tab2" href="#smoke-panel2" role="tab" aria-controls="smoke-panel2" class="tabs-trigger js-tabs-trigger">Two</a></li>
      </ul>
      <section id="smoke-panel1" role="tabpanel" aria-labelledby="smoke-tab1" class="tabs-panel js-tabs-panel" tabindex="0">
        <div class="accordion-trigger js-accordion-trigger" aria-controls="smoke-panel1" aria-expanded="true" tabindex="0">One</div>
        <div class="content" aria-hidden="false">First panel</div>
      </section>
      <section id="smoke-panel2" role="tabpanel" aria-labelledby="smoke-tab2" class="tabs-panel js-tabs-panel">
        <div class="accordion-trigger js-accordion-trigger" aria-controls="smoke-panel2" aria-expanded="false" tabindex="0">Two</div>
        <div class="content" aria-hidden="true">Second panel</div>
      </section>
    </section>
  </main>
    <script src="file://${installed}/${script}"></script>
</body>
</html>`;
}

(async function () {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const script of ['a11y-accordion-tabs.js', 'a11y-accordion-tabs.min.js']) {
      const fixturePath = path.join(consumer, script + '.html');
      fs.writeFileSync(fixturePath, fixture(script));
      const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
      await page.goto('file://' + fixturePath);
      await page.waitForSelector('.is-initialized');
      assert.equal(await page.locator('#smoke-tab1').getAttribute('aria-selected'), 'true', script);
      await page.locator('#smoke-tab2').click();
      assert.equal(await page.locator('#smoke-tab2').getAttribute('aria-selected'), 'true', script);
      assert.equal(await page.locator('#smoke-panel1 .content').getAttribute('aria-hidden'), 'true', script);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log('Package smoke test passed.');
  fs.rmSync(tempRoot, { recursive: true, force: true });
})().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
