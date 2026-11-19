# a11y-accordion-tabs

[![npm version](https://badge.fury.io/js/a11y-accordion-tabs.svg)](https://badge.fury.io/js/a11y-accordion-tabs)

A small script (less than 2 KB minified and gzipped) with zero dependencies for creating accessible accordion tabs components.
Based on the [accessible tabs component by @stowball](https://codepen.io/stowball/pen/xVWwWe).

The component is an accordion on smaller screens and switches to a tab view on larger viewports. In tabs mode, use Left and Right to move between tabs; one panel is always open. In accordion mode, Enter or Space toggles a disclosure, and several panels can stay open.

Upgrading from 1.x to 2.0? See the [migration checklist](CHANGELOG.md#upgrading-from-1x), especially if you support Internet Explorer or supply your own markup and CSS.

## Demo

[See it in action here](https://matthiasott.github.io/a11y-accordion-tabs/).

## Installation

### Download or clone

Download a tagged version from [GitHub Releases](https://github.com/matthiasott/a11y-accordion-tabs/releases), or clone the repository for the development version.

### npm

```sh
npm install a11y-accordion-tabs
```

## Usage

First, include `a11y-accordion-tabs.js` (or the minified version) in your document:

```html
<script src="a11y-accordion-tabs.js" async></script>
```

Use your own styles or copy the component rules from [docs/styles.css](docs/styles.css) in the same release. This is the demo stylesheet: it also styles the page body, links and headings. If you copy it to `styles.css`, link it like this:

```html
<link rel="stylesheet" href="styles.css" />
```

The stylesheet exposes `--aat-*` color and typography properties. Override them on a root to theme just that set and its descendants. For example:

```css
.accordion-tabs.product-details {
  --aat-color-surface: rgb(250 248 244);
  --aat-color-text: rgb(36 34 30);
  --aat-color-accent: rgb(144 51 66);
  --aat-font-family-body: Georgia, serif;
}
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

### Nested tab sets

To nest a set, place a **complete** `.accordion-tabs.js-tabs` component inside a parent panel’s `.content`. A second tablist alone is not a separate instance. Give each tablist a distinct accessible name and use page-unique IDs for its tabs, panels and disclosure content. Each set has its own selection and options: for example, the parent can show tabs while the child uses `data-tabs-allowed="false"` to stay an accordion. Closing and reopening the parent preserves the child’s selection.

When initializing nested sets manually, keep `.accordion-tabs` on each root, omit `.js-tabs`, and construct parents before children. Use the updated stylesheet or scope your own mode styles to each root; broad selectors such as `.tabs-allowed .accordion-trigger` also match controls in a nested accordion.

By default, the script looks for all elements with the class `js-tabs` and turns them into an accordion tabs component automatically.

### Manual initialization

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
| `deepLink` | `data-deep-link` | `false` | Reveal and share panels by their HTML `id` in the URL fragment. |

Data attributes take precedence over constructor options. Write boolean attributes as `"true"` or `"false"`.

### Deep links

Add `data-deep-link="true"` to the `.js-tabs` root (or pass `{ deepLink: true }` to the constructor). With the markup above, `#section2` opens the panel whose `id` is `section2`, not the tab whose `id` is `tab2`. Use a stable, page-unique panel ID so shared links keep working if panels are reordered.

On load, a matching fragment overrides `selectedTab` and `startCollapsed`. Following a fragment link or using Back/Forward reveals and scrolls to that panel; other components and unrelated fragments are left alone. In accordion mode, following a link opens the panel without closing others. For a nested destination, enable deep links on the child set. Its enclosing panels open as needed, even if the parent does not write its own links.

Activating a trigger by pointer or keyboard updates the fragment without jumping to the panel or adding a history entry. Closing a disclosure clears the fragment only if it names that disclosure's panel. Resizing and calls to `selectTab()` do not change the URL.

## Instance methods

- `instance.selectTab(index)` opens a panel without moving focus. In tabs mode only that panel stays open; in accordion mode other open panels stay open. An optional second argument of `true` treats the selection as user activation (including toggling an open disclosure).
- `instance.destroy()` removes input, breakpoint and fragment listeners and clears the enhanced state. With the supplied stylesheet the content returns to its readable, non-interactive layout. Create a new instance to re-enable it.

The component emits no custom events.

## Compatibility

New browser code targets [Baseline Widely available](https://web.dev/baseline): features interoperable across the core browsers for at least 30 months. Internet Explorer is no longer supported. Browser tests use Playwright's installed Chromium; that is not a compatibility test of every Baseline browser.

The accessibility target for new work is WCAG 2.2 AA. The browser suite exercises keyboard operation and runs axe; neither replaces testing with assistive technology.

For development use Node 22.12+ (Mocha itself also supports 20.19+, but the locked toolchain includes a Node 22+ transitive dependency). Node is not required to run the browser script.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the release history and notes on upgrading to 2.0.

## License 

Code released under [the MIT license](LICENSE).

## Author

Matthias Ott   
<mail@matthiasott.com>  
<https://matthiasott.com>  
<https://twitter.com/m_ott>

Copyright (c) 2017–2020 [Matthias Ott](https://matthiasott.com)
