# a11y-accordion-tabs

[![npm version](https://badge.fury.io/js/a11y-accordion-tabs.svg)](https://badge.fury.io/js/a11y-accordion-tabs)

A small script (less than 1.6 KB compressed and gzipped) with zero dependencies for creating accessible accordion tabs components.
Based on the [accessible tabs component by @stowball](https://codepen.io/stowball/pen/xVWwWe).

The component is an accordion on smaller screens and switches to a tab view on larger viewports.

## Demo

[See it in action here](https://matthiasott.github.io/a11y-accordion-tabs/).

## Installation

### Download or clone

Download the [latest](https://github.com/matthiasott/a11y-accordion-tabs/archive/master.zip) version or `git clone https://github.com/matthiasott/a11y-accordion-tabs.git`.

### npm

```sh
npm install a11y-accordion-tabs
```

## Usage

First, include `a11y-accordion-tabs.js` (or the minified version) in your document:

```html
<script src="a11y-accordion-tabs.js" async></script>
```

You can write your own styles from scratch or use [the CSS file in the docs folder](https://raw.githubusercontent.com/matthiasott/a11y-accordion-tabs/master/docs/styles.css) as a starting point and include it in your document, too.

```html
<link rel="stylesheet" href="styles.css" />
```

The basic HTML structure for the accordion tabs component reads as follows:

```html
<div class="accordion-tabs js-tabs">
  <ul role="tablist" aria-label="Sections" class="tabs-tab-list">
    <li role="presentation"><a href="#section1" role="tab" id="tab1" aria-controls="section1" aria-selected="true" class="tabs-trigger js-tabs-trigger">Section 1</a></li>
    <li role="presentation"><a href="#section2" role="tab" id="tab2" aria-controls="section2" class="tabs-trigger js-tabs-trigger">Section 2</a></li>
    <li role="presentation"><a href="#section3" role="tab" id="tab3" aria-controls="section3" class="tabs-trigger js-tabs-trigger">Section 3</a></li>
  </ul>
  <section id="section1" aria-labelledby="tab1" class="tabs-panel js-tabs-panel">
    <button type="button" class="accordion-trigger js-accordion-trigger" aria-controls="content1">Section 1</button>
    <div class="content" id="content1">
      abc
    </div>
  </section>
  <section id="section2" aria-labelledby="tab2" class="tabs-panel js-tabs-panel">
    <button type="button" class="accordion-trigger js-accordion-trigger" aria-controls="content2">Section 2</button>
    <div class="content" id="content2">
      def
    </div>
  </section>
  <section id="section3" aria-labelledby="tab3" class="tabs-panel js-tabs-panel">
    <button type="button" class="accordion-trigger js-accordion-trigger" aria-controls="content3">Section 3</button>
    <div class="content" id="content3">
      def
    </div>
  </section>
</div>
```

Keep one tab, one disclosure button and one `.content` per panel, in matching order. IDs must be unique across the page. Leave content visible in the HTML: the script sets expanded, selected and hidden states on initialization. With the supplied stylesheet, the controls appear only after initialization, so all content remains readable if the script fails to load.

For an advanced version [have a look at the demo](https://matthiasott.github.io/a11y-accordion-tabs/).

By default, the script looks for all elements with the class `js-tabs` and turns them into an accordion tabs component automatically.
For manual initialization, **omit `js-tabs` from the root** so it is not initialized twice. Keep the other hook classes:

```javascript
const tabs = document.getElementById('myTabs');
const instance = new AccordionTabs(tabs);
```

## Options

a11y-accordion-tabs comes with a few options to make the component more flexible. All options can be set via either a `data-` attribute or a JS property on the second argument of the constructor:

```javascript
new AccordionTabs(tabs, {
  breakpoint: 800,
  tabsAllowed: true,
  selectedTab: 2,
  startCollapsed: false
});
```

| Constructor option | HTML attribute | Default | Behavior |
| --- | --- | --- | --- |
| `tabsAllowed` | `data-tabs-allowed` | `true` | Set to `false` to stay in accordion mode at every width. |
| `breakpoint` | `data-breakpoint` | `640` | Minimum viewport width in CSS pixels for tabs. The option only changes JavaScript. Update the matching `@media (min-width: 640px)` in your stylesheet too. |
| `selectedTab` | `data-selected-tab` | `0` | Zero-based index of the initially open panel (bounded to the available panels). |
| `startCollapsed` | `data-start-collapsed` | `false` | Start with no open panel **in accordion mode only**. Tabs always start with one selected panel, the first by default. |

Data attributes take precedence over constructor options. Write boolean attributes as `"true"` or `"false"`.

## Instance methods

- `instance.selectTab(index)` opens a panel without moving focus. In tabs mode only that panel stays open; in accordion mode other open panels stay open. An optional second argument of `true` treats the selection as user activation (including toggling an open disclosure).
- `instance.destroy()` removes input and breakpoint listeners and clears the enhanced state. With the supplied stylesheet the content returns to its readable, non-interactive layout. Create a new instance to re-enable it.

The component emits no custom events.

## Compatibility

New browser code targets [Baseline Widely available](https://web.dev/baseline): features interoperable across the core browsers for at least 30 months. Internet Explorer is no longer supported. Browser tests use Playwright's installed Chromium; that is not a compatibility test of every Baseline browser.

The accessibility target for new work is WCAG 2.2 AA. The browser suite exercises keyboard operation and runs axe; neither replaces testing with assistive technology.

For development use Node 22.12+ (Mocha itself also supports 20.19+, but the locked toolchain includes a Node 22+ transitive dependency). Node is not required to run the browser script.

## Changelog

### 0.5.0
- New option `startCollapsed`: Defines if the accordion should be collapsed on startup

### 0.4.1
- Fix CJS module export
– Update dependencies to fix vulnerabilities

### 0.4.0
- Data attributes now follow the W3C naming conventions (no uppercase letters)
– Improved default aria-roles in the demo HTML code
– Plus / minus symbols instead of chevrons in the demo code

### 0.3.2
- Update documentation

### 0.3.1
- Cleanup example HTML code

### 0.3.0
- Add support for multiple instances
- Update README with basic documentation 

### 0.2.1
- Breakpoint min-width fix.

### 0.2.0
- Improved ARIA-roles for the accordion state.

### 0.1.0
- First basic version. Still a lot of cleanup to do. Please use with caution!

## License 

Code released under [the MIT license](https://github.com/matthiasott/a11y-accordion-tabs/LICENSE).

## Author

Matthias Ott   
<mail@matthiasott.com>  
<https://matthiasott.com>  
<https://twitter.com/m_ott>

Copyright (c) 2017–2020 [Matthias Ott](https://matthiasott.com)
