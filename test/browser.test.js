/* eslint-env mocha */
/* global AccordionTabs, axe */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const demoUrl = require('node:url').pathToFileURL(path.join(root, 'docs/index.html')).href;
const sourcePath = path.join(root, 'a11y-accordion-tabs.js');
const cssText = fs.readFileSync(path.join(root, 'docs/styles.css'), 'utf8');
const axePath = require.resolve('axe-core/axe.min.js');

function componentMarkup (prefix, attributes = '', initClass = 'js-tabs') {
  const panels = [1, 2, 3].map(function (number) {
    const selected = number === 1;
    return `
      <section id="${prefix}-panel${number}" role="tabpanel" aria-labelledby="${prefix}-tab${number}" class="tabs-panel js-tabs-panel"${selected ? ' tabindex="0"' : ''}>
        <div class="accordion-trigger js-accordion-trigger" aria-controls="${prefix}-panel${number}" aria-expanded="${selected}" tabindex="0">${prefix} Section ${number}</div>
        <div class="content" aria-hidden="${!selected}">
          <h2>${prefix} content ${number}</h2>
          <p>Details for ${prefix} section ${number}. <a href="#after" class="probe">Open details ${number}</a></p>
        </div>
      </section>`;
  }).join('');

  return `
    <section class="accordion-tabs ${initClass}" ${attributes}>
      <ul role="tablist" aria-label="${prefix} sections" class="tabs-tab-list">
        ${[1, 2, 3].map(function (number) {
    const selected = number === 1;
    return `<li role="presentation"><a id="${prefix}-tab${number}" href="#${prefix}-panel${number}" role="tab" aria-controls="${prefix}-panel${number}"${selected ? ' aria-selected="true"' : ''} class="tabs-trigger js-tabs-trigger">${prefix} Section ${number}</a></li>`;
  }).join('')}
      </ul>
      ${panels}
    </section>`;
}

function pageShell (body, extraCss = '') {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Accordion regression fixture</title>
  <style>${cssText}</style>
  <style>${extraCss}</style>
</head>
<body>
  <main>${body}</main>
  <p id="after">After the component</p>
</body>
</html>`;
}

async function openComponent (browser, body, width = 800, extraCss = '') {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.setContent(pageShell(body, extraCss));
  await page.addScriptTag({ path: sourcePath });
  return { context, page };
}

async function componentState (page) {
  return page.evaluate(function () {
    return Array.from(document.querySelectorAll('.accordion-tabs')).map(function (root) {
      return {
        rootClass: root.className,
        tabs: Array.from(root.querySelectorAll('.js-tabs-trigger')).map(function (tab) {
          return {
            id: tab.id,
            text: tab.textContent.trim(),
            selected: tab.getAttribute('aria-selected'),
            tabIndex: tab.getAttribute('tabindex'),
            controls: tab.getAttribute('aria-controls')
          };
        }),
        accordionTriggers: Array.from(root.querySelectorAll('.js-accordion-trigger')).map(function (trigger) {
          return { expanded: trigger.getAttribute('aria-expanded'), controls: trigger.getAttribute('aria-controls') };
        }),
        panels: Array.from(root.querySelectorAll('.js-tabs-panel')).map(function (panel) {
          const content = panel.querySelector('.content');
          return {
            id: panel.id,
            labelledBy: panel.getAttribute('aria-labelledby'),
            contentHidden: content.getAttribute('aria-hidden'),
            contentVisible: content.getClientRects().length > 0
          };
        })
      };
    });
  });
}

describe('a11y-accordion-tabs browser regression suite', function () {
  let browser;

  before(async function () {
    browser = await chromium.launch({ headless: true });
  });

  after(async function () {
    if (browser) await browser.close();
  });

  describe('nested sets', function () {
    function nested (outer, inner) {
      return outer.replace('<h2>outer content 2</h2>', heading => heading + inner);
    }

    it('keeps pointer, arrow-key focus and selection inside the active set', async function () {
      const child = componentMarkup('inner').replace('<ul ', '<div><ul ').replace('</ul>', '</ul></div>');
      const { page, context } = await openComponent(browser, nested(componentMarkup('outer'), child));
      try {
        await page.locator('#outer-tab2').click();
        await page.locator('#inner-tab2').click();
        await page.keyboard.press('ArrowRight');
        assert.equal(await page.locator('#outer-tab2').getAttribute('aria-selected'), 'true');
        assert.equal(await page.locator('#inner-tab3').getAttribute('aria-selected'), 'true');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'inner-tab3');
        await page.addScriptTag({ path: axePath });
        const violations = await page.evaluate(async () => (await axe.run(document.querySelector('.js-tabs'), {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }
        })).violations.map(v => v.id));
        assert.deepEqual(violations, []);
        await page.locator('#outer-tab3').click();
        assert.equal(await page.locator('#inner-tab3').isVisible(), false);
        await page.locator('#outer-tab2').click();
        assert.equal(await page.locator('#inner-panel3 .content').isVisible(), true);
      } finally { await context.close(); }
    });

    it('shows accordion controls inside desktop tabs, including after resize', async function () {
      const body = nested(componentMarkup('outer', 'data-selected-tab="1"'), componentMarkup('inner', 'data-tabs-allowed="false"'));
      const { page, context } = await openComponent(browser, body);
      try {
        for (const width of [800, 500, 800]) {
          await page.setViewportSize({ width, height: 900 });
          await page.waitForFunction(width => document.querySelector('#outer-tab2').checkVisibility() === (width >= 640), width);
          assert.equal(await page.locator('#inner-tab1').isVisible(), false);
          const button = page.getByRole('button', { name: 'inner Section 2' });
          assert.equal(await button.isVisible(), true);
          await button.press('Space');
          assert.equal(await page.locator('#inner-panel2 .content').isVisible(), await button.getAttribute('aria-expanded') === 'true');
        }
      } finally { await context.close(); }
    });

    it('reveals the ancestor panels for an incoming child deep link, even without parent opt-in', async function () {
      const child = componentMarkup('inner', 'data-deep-link="true" data-tabs-allowed="false" data-start-collapsed="true"');
      const body = nested(componentMarkup('outer'), child);
      const page = await browser.newPage();
      try {
        await page.route('https://fixture.test/nested', route => route.fulfill({ contentType: 'text/html', body: pageShell(body) }));
        await page.goto('https://fixture.test/nested#inner-panel3');
        await page.addScriptTag({ path: sourcePath });
        assert.equal(await page.locator('#outer-tab2').getAttribute('aria-selected'), 'true');
        assert.equal(await page.locator('#inner-panel3 .content').isVisible(), true);
        await page.locator('#outer-tab1').click();
        await page.evaluate(() => { location.hash = 'inner-panel1'; });
        await page.locator('#inner-panel1 .content').waitFor({ state: 'visible', timeout: 2000 });
        assert.equal(await page.locator('#inner-panel3 .content').isVisible(), true);
      } finally { await page.close(); }
    });

    it('leaves a manual child operable after destroying its parent', async function () {
      const body = nested(componentMarkup('outer', 'id="outer"', ''), componentMarkup('inner', 'id="inner"', ''));
      const { page, context } = await openComponent(browser, body);
      try {
        await page.evaluate(() => {
          const outer = new AccordionTabs(document.getElementById('outer'));
          new AccordionTabs(document.getElementById('inner'), { tabsAllowed: false });
          outer.destroy();
        });
        const button = page.getByRole('button', { name: 'inner Section 2' });
        assert.equal(await button.isVisible(), true);
        await button.press('Enter');
        assert.equal(await button.getAttribute('aria-expanded'), 'true');
      } finally { await context.close(); }
    });
  });

  describe('opt-in deep links', function () {
    const url = 'https://fixture.test/demo?lang=en';
    const attrs = 'data-deep-link="true" data-selected-tab="1" data-start-collapsed="true"';
    let page;

    beforeEach(async function () {
      page = await browser.newPage({ viewport: { width: 800, height: 800 } });
      const body = '<a href="#two-panel3">Jump to three</a>' + componentMarkup('one', attrs) +
        componentMarkup('two', attrs) + componentMarkup('off');
      await page.route(url, route => route.fulfill({ contentType: 'text/html', body: pageShell(body) }));
    });

    afterEach(async function () { await page.close(); });

    async function load (hash) {
      await page.goto(url + hash);
      await page.addScriptTag({ path: sourcePath });
    }

    it('opens the incoming panel in its own instance, overriding even a collapsed start', async function () {
      await page.setViewportSize({ width: 320, height: 800 });
      await load('#two-panel3');
      assert.equal(await page.locator('.js-accordion-trigger[aria-expanded="true"]').count(), 2); // one in the default (off) instance
      assert.equal(await page.locator('#two-panel3 .content').isVisible(), true);
      assert.equal(await page.locator('#two-panel2 .content').isVisible(), false);
      assert.equal(await page.locator('#one-panel3 .content').isVisible(), false);
    });

    it('replaces only the fragment on pointer and keyboard activation without adding history entries', async function () {
      await load('#after');
      const length = await page.evaluate(() => { history.replaceState({ existing: 1 }, ''); return history.length; });
      await page.locator('#one-tab1').click();
      assert.equal(page.url(), url + '#one-panel1');
      const scroll = await page.evaluate(() => scrollY);
      await page.keyboard.press('ArrowRight');
      assert.equal(page.url(), url + '#one-panel2');
      assert.deepEqual(await page.evaluate(() => [history.length, history.state, document.activeElement.id, scrollY]),
        [length, { existing: 1 }, 'one-tab2', scroll]);
      await page.locator('#off-tab3').click();
      assert.equal(page.url(), url + '#one-panel2');
    });

    it('honors incoming anchors and Back/Forward without selecting a panel in another set', async function () {
      await load('#two-panel1');
      assert.equal(await page.locator('#two-tab1').getAttribute('aria-selected'), 'true');
      await page.getByRole('link', { name: 'Jump to three' }).click();
      const visible = id => page.locator(`#two-panel${id} .content`).waitFor({ state: 'visible', timeout: 2000 });
      await visible(3);
      await page.goBack();
      await visible(1);
      await page.goForward();
      await visible(3);
      assert.equal(await page.locator('#one-tab2').getAttribute('aria-selected'), 'true');
    });

    it('clears only the matching fragment when a disclosure closes', async function () {
      await page.setViewportSize({ width: 320, height: 800 });
      await load('#after');
      const first = page.locator('#one-panel1 .js-accordion-trigger');
      const second = page.locator('#one-panel2 .js-accordion-trigger');
      await first.click();
      await second.press('Enter');
      assert.equal(await first.getAttribute('aria-expanded'), 'true');
      await first.click();
      assert.equal(page.url(), url + '#one-panel2');
      await second.press('Space');
      assert.equal(page.url(), url);
    });

    it('ignores malformed fragments and leaves the URL alone on resize and API calls', async function () {
      await load('#bad%');
      assert.equal(await page.locator('#one-tab2').getAttribute('aria-selected'), 'true');
      await page.evaluate(() => {
        const el = document.createElement('div');
        el.innerHTML = document.querySelector('.accordion-tabs').innerHTML.replaceAll('one-', 'manual-');
        document.body.append(el);
        window.manual = new AccordionTabs(el, { deepLink: true });
        window.manual.selectTab(2, true);
      });
      await page.setViewportSize({ width: 320, height: 800 });
      assert.equal(page.url(), url + '#bad%');
      await page.locator('#manual-panel2 .js-accordion-trigger').click();
      assert.equal(page.url(), url + '#manual-panel2');
      await page.evaluate(() => window.manual.destroy());
      await page.evaluate(() => { location.hash = 'manual-panel3'; });
      assert.equal(await page.locator('#manual-panel3.is-open').count(), 0);
    });
  });

  it('initializes the documented tabs mode, ARIA relationships, and tab order', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('a'));
    try {
      const state = (await componentState(page))[0];
      assert.match(state.rootClass, /is-initialized/);
      assert.match(state.rootClass, /tabs-allowed/);
      assert.deepEqual(state.tabs.map(function (tab) { return tab.selected; }), ['true', 'false', 'false']);
      assert.deepEqual(state.tabs.map(function (tab) { return tab.tabIndex; }), [null, '-1', '-1']);
      assert.deepEqual(state.panels.map(function (panel) { return panel.contentHidden; }), ['false', 'true', 'true']);
      assert.deepEqual(state.panels.map(function (panel) { return panel.contentVisible; }), [true, false, false]);
      state.tabs.forEach(function (tab, index) {
        assert.equal(tab.controls, state.panels[index].id);
        assert.equal(state.panels[index].labelledBy, tab.id);
        assert.equal(state.accordionTriggers[index].controls, state.panels[index].id);
      });
    } finally {
      await context.close();
    }
  });

  it('supports pointer activation, arrow keys, and visible keyboard focus in tabs mode', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('b'));
    try {
      await page.keyboard.press('Tab');
      const focus = await page.evaluate(function () {
        const active = document.activeElement;
        const style = window.getComputedStyle(active);
        return { id: active.id, isTab: active.matches('[role="tab"]'), focusVisible: active.matches(':focus-visible'), outline: style.outlineStyle, width: style.outlineWidth };
      });
      assert.equal(focus.id, 'b-tab1');
      assert.equal(focus.isTab, true);
      assert.equal(focus.focusVisible, true);
      assert.notEqual(focus.outline, 'none');
      assert.notEqual(focus.width, '0px');

      await page.keyboard.press('ArrowRight');
      let state = (await componentState(page))[0];
      assert.deepEqual(state.tabs.map(function (tab) { return tab.selected; }), ['false', 'true', 'false']);
      assert.equal(await page.evaluate(function () { return document.activeElement.id; }), 'b-tab2');

      await page.locator('#b-tab3').click();
      state = (await componentState(page))[0];
      assert.deepEqual(state.tabs.map(function (tab) { return tab.selected; }), ['false', 'false', 'true']);
      assert.equal(await page.evaluate(function () { return document.activeElement.id; }), 'b-tab3');

      await page.keyboard.press('ArrowLeft');
      state = (await componentState(page))[0];
      assert.deepEqual(state.tabs.map(function (tab) { return tab.selected; }), ['false', 'true', 'false']);
      assert.equal(await page.evaluate(function () { return document.activeElement.id; }), 'b-tab2');
    } finally {
      await context.close();
    }
  });

  it('keeps one panel visible in tabs mode and removes hidden controls from the tab order', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('c'));
    try {
      await page.locator('#c-tab2').click();
      assert.equal(await page.locator('#c-panel2 .probe').isVisible(), true);
      assert.equal(await page.locator('#c-panel1 .probe').isVisible(), false);
      assert.equal(await page.locator('#c-panel1 .content').getAttribute('aria-hidden'), 'true');

      const tabStops = await page.evaluate(function () {
        return Array.from(document.querySelectorAll('a, button, input, [tabindex]'))
          .filter(function (element) { return element.tabIndex >= 0 && element.getClientRects().length > 0; })
          .map(function (element) { return element.textContent.trim(); });
      });
      assert.equal(tabStops.some(function (text) { return text.includes('Open details 1'); }), false);
      assert.equal(tabStops.some(function (text) { return text.includes('Open details 2'); }), true);
    } finally {
      await context.close();
    }
  });

  it('uses multiple-panel accordion behavior below the breakpoint and keeps focus on a closing trigger', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('d'), 500);
    try {
      const initial = (await componentState(page))[0];
      const display = await page.evaluate(function () {
        return {
          tab: getComputedStyle(document.querySelector('#d-tab1')).display,
          accordion: getComputedStyle(document.querySelector('#d-panel1 .js-accordion-trigger')).display
        };
      });
      assert.equal(display.tab, 'none');
      assert.notEqual(display.accordion, 'none');
      assert.deepEqual(initial.panels.map(function (panel) { return panel.contentVisible; }), [true, false, false]);

      await page.locator('#d-panel2 .js-accordion-trigger').click();
      await page.locator('#d-panel3 .js-accordion-trigger').click();
      let state = (await componentState(page))[0];
      assert.deepEqual(state.accordionTriggers.map(function (trigger) { return trigger.expanded; }), ['true', 'true', 'true']);
      assert.deepEqual(state.panels.map(function (panel) { return panel.contentVisible; }), [true, true, true]);

      await page.locator('#d-panel1 .js-accordion-trigger').click();
      state = (await componentState(page))[0];
      assert.deepEqual(state.accordionTriggers.map(function (trigger) { return trigger.expanded; }), ['false', 'true', 'true']);
      assert.equal(await page.evaluate(function () {
        return document.activeElement === document.querySelector('#d-panel1 .js-accordion-trigger');
      }), true);
    } finally {
      await context.close();
    }
  });

  it('supports Enter and Space activation on accordion triggers', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('e'), 500);
    try {
      const trigger = page.locator('#e-panel2 .js-accordion-trigger');
      await trigger.focus();
      await page.keyboard.press('Enter');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');

      await trigger.focus();
      await page.keyboard.press('Space');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    } finally {
      await context.close();
    }
  });

  it('honors every documented data option', async function () {
    const breakpointCss = `
      @media (max-width: 62.49em) {
        .tabs-allowed .tabs-trigger { display: none !important; }
        .tabs-allowed .accordion-trigger { display: flex !important; }
        .tabs-allowed .tabs-panel { display: block !important; }
      }`;
    const cases = [
      { attributes: 'data-tabs-allowed="false"', width: 900, tabs: false, selected: null },
      { attributes: 'data-breakpoint="1000"', width: 800, tabs: false, css: breakpointCss, selected: null },
      { attributes: 'data-selected-tab="2"', width: 800, tabs: true, selected: 2 },
      { attributes: 'data-start-collapsed="true"', width: 500, tabs: false, selected: null, collapsed: true }
    ];

    for (const testCase of cases) {
      const { context, page } = await openComponent(browser, componentMarkup('f', testCase.attributes), testCase.width, testCase.css || '');
      try {
        const state = (await componentState(page))[0];
        const tabDisplay = await page.evaluate(function () {
          return getComputedStyle(document.querySelector('#f-tab1')).display;
        });
        assert.equal(tabDisplay === 'block', testCase.tabs, testCase.attributes);
        if (testCase.selected !== null) {
          assert.deepEqual(state.tabs.map(function (tab) { return tab.selected; }), ['false', 'false', 'true'], testCase.attributes);
          assert.deepEqual(state.panels.map(function (panel) { return panel.contentHidden; }), ['true', 'true', 'false']);
        }
        if (testCase.collapsed) {
          assert.deepEqual(state.accordionTriggers.map(function (trigger) { return trigger.expanded; }), ['false', 'false', 'false'], testCase.attributes + ' expanded');
          assert.deepEqual(state.panels.map(function (panel) { return panel.contentHidden; }), ['true', 'true', 'true'], testCase.attributes + ' contentHidden');
        }
      } finally {
        await context.close();
      }
    }
  });

  it('supports constructor options and the public selectTab/destroy methods', async function () {
    const body = componentMarkup('g', '', '').replace('class="accordion-tabs "', 'id="g-instance" class="accordion-tabs"');
    const { context, page } = await openComponent(browser, body);
    try {
      await page.evaluate(function () {
        window.instance = new AccordionTabs(document.getElementById('g-instance'), {
          breakpoint: 800,
          tabsAllowed: true,
          selectedTab: 1,
          startCollapsed: false
        });
      });
      let state = (await componentState(page))[0];
      assert.deepEqual(state.tabs.map(function (tab) { return tab.selected; }), ['false', 'true', 'false']);

      await page.evaluate(function () { window.instance.selectTab(2, false); });
      state = (await componentState(page))[0];
      assert.deepEqual(state.tabs.map(function (tab) { return tab.selected; }), ['false', 'false', 'true']);

      await page.evaluate(function () { window.instance.destroy(); });
      const destroyed = await page.evaluate(function () {
        const root = document.getElementById('g-instance');
        return {
          initialized: root.classList.contains('is-initialized'),
          selectedAttr: root.querySelector('.js-tabs-trigger').getAttribute('aria-selected'),
          panelHiddenClass: root.querySelector('.js-tabs-panel').classList.contains('is-hidden')
        };
      });
      assert.equal(destroyed.initialized, false);
      assert.equal(destroyed.selectedAttr, null);
      assert.equal(destroyed.panelHiddenClass, false);
    } finally {
      await context.close();
    }
  });

  it('initializes multiple instances independently', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('one') + componentMarkup('two'));
    try {
      await page.locator('#two-tab2').click();
      const states = await componentState(page);
      assert.equal(states.length, 2);
      assert.deepEqual(states[0].tabs.map(function (tab) { return tab.selected; }), ['true', 'false', 'false']);
      assert.deepEqual(states[1].tabs.map(function (tab) { return tab.selected; }), ['false', 'true', 'false']);
    } finally {
      await context.close();
    }
  });

  it('activates the owning trigger when a nested SVG or tab label is clicked', async function () {
    for (const width of [500, 800]) {
      const { context, page } = await openComponent(browser, componentMarkup('nested'), width);
      try {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        const trigger = page.locator(width < 640 ? '#nested-panel2 .js-accordion-trigger' : '#nested-tab2');
        await trigger.evaluate(el => el.insertAdjacentHTML('beforeend', '<svg width="20" height="20"><rect width="20" height="20"/></svg>'));
        await trigger.locator('rect').click();
        assert.deepEqual(errors, []);
        assert.equal(await page.locator('#nested-panel2 .content').isVisible(), true);
      } finally {
        await context.close();
      }
    }
  });

  it('cannot collapse the selected tab using Enter or Space', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('active', 'data-start-collapsed="true"'));
    try {
      await page.keyboard.press('Tab');
      for (const key of ['Enter', 'Space']) {
        await page.keyboard.press(key);
        assert.equal(await page.getByRole('tab', { selected: true }).count(), 1);
        assert.equal(await page.getByRole('tabpanel', { name: 'active Section 1' }).count(), 1);
      }
    } finally {
      await context.close();
    }
  });

  it('isolates an incomplete instance and clamps a negative initial tab', async function () {
    const body = componentMarkup('bad').replace('js-accordion-trigger', '') + componentMarkup('ok', 'data-selected-tab="-1"');
    const { context, page } = await openComponent(browser, body);
    try {
      assert.equal(await page.locator('.is-initialized').count(), 1);
      assert.equal(await page.locator('#bad-panel1 .content').getAttribute('class'), 'content');
      assert.equal(await page.locator('#ok-tab1').getAttribute('aria-selected'), 'true');
    } finally {
      await context.close();
    }
  });

  it('changes from multiple disclosures to one tab and back at the exact breakpoint', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('resize'), 639);
    try {
      await page.locator('#resize-panel2 .js-accordion-trigger').click();
      await page.setViewportSize({ width: 640, height: 900 });
      await page.waitForFunction(() => !document.querySelector('#resize-panel1 .content').getClientRects().length);
      assert.equal(await page.getByRole('tab', { name: 'resize Section 2', selected: true }).count(), 1);
      await page.setViewportSize({ width: 639, height: 900 });
      await page.getByRole('button', { name: 'resize Section 3' }).click({ timeout: 1500 });
      assert.equal(await page.locator('#resize-panel2 .content').isVisible(), true);
      assert.equal(await page.locator('#resize-panel3 .content').isVisible(), true);
    } finally {
      await context.close();
    }
  });

  it('detaches accordion and responsive listeners and reveals all content on destroy', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('teardown', '', ''), 500);
    try {
      await page.evaluate(() => {
        const instance = new AccordionTabs(document.querySelector('.accordion-tabs'));
        instance.destroy();
        document.querySelector('.js-accordion-trigger').click();
      });
      await page.setViewportSize({ width: 800, height: 900 });
      await page.waitForTimeout(120);
      assert.equal(await page.locator('.tabs-allowed, .is-open, .is-hidden, .content[aria-hidden], .js-accordion-trigger[aria-expanded]').count(), 0);
    } finally {
      await context.close();
    }
  });

  it('exposes every demo panel before initialization / with JavaScript disabled', async function () {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 800, height: 900 } });
    try {
      const page = await context.newPage();
      await page.route('https://**', route => route.abort());
      await page.goto(demoUrl);
      assert.equal(await page.locator('.is-initialized').count(), 0);
      for (const i of [1, 2, 3]) {
        assert.equal(await page.locator(`#section${i} .content`).isVisible(), true);
        assert.equal(await page.getByRole('heading', { name: `Headline Section ${i}` }).count(), 1);
      }
      assert.equal(await page.getByRole('button').count(), 0);
    } finally {
      await context.close();
    }
  });

  for (const width of [320, 800]) {
    it(`exposes named demo controls and passes whole-page axe checks at ${width}px`, async function () {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        await page.route('https://**', route => route.abort());
        await page.goto(demoUrl);
        await page.addScriptTag({ path: axePath });
        const violations = await page.evaluate(async () => (await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }
        })).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })));
        assert.deepEqual(violations, []);
        const accordion = width < 640;
        const control = page.getByRole(accordion ? 'button' : 'tab', { name: 'Section 2', exact: true });
        assert.equal(await control.count(), 1);
        await control.focus();
        await page.keyboard.press('Space');
        assert.equal(await control.getAttribute(accordion ? 'aria-expanded' : 'aria-selected'), 'true');
        assert.notEqual(await control.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      } finally {
        await page.close();
      }
    });
  }

  it('has no axe WCAG A/AA violations in the component fixture', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('i'));
    try {
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async function () {
        const results = await axe.run(document.querySelector('.js-tabs'), {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }
        });
        return results.violations.map(function (violation) {
          return { id: violation.id, impact: violation.impact, nodes: violation.nodes.length, help: violation.help };
        });
      });
      assert.deepEqual(violations, []);
    } finally {
      await context.close();
    }
  });

  it('reflows at a 320px viewport without horizontal overflow', async function () {
    const { context, page } = await openComponent(browser, componentMarkup('j'));
    try {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.waitForTimeout(100);
      const overflow = await page.evaluate(function () {
        return document.documentElement.scrollWidth - window.innerWidth;
      });
      assert.ok(overflow <= 1, 'horizontal overflow: ' + overflow + 'px');
    } finally {
      await context.close();
    }
  });
});
