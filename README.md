# a11y-accordion-tabs

[![npm version](https://badge.fury.io/js/a11y-accordion-tabs.svg)](https://badge.fury.io/js/a11y-accordion-tabs) [![Build Status](https://travis-ci.org/matthiasott/a11y-accordion-tabs.svg?branch=master)](https://travis-ci.org/matthiasott/a11y-accordion-tabs) [![devDependency Status](https://david-dm.org/matthiasott/a11y-accordion-tabs.svg)](https://david-dm.org/matthiasott/a11y-accordion-tabs#info=devDependencies)

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
npm install a11y-accordion-tabs --save-dev
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
  <ul role="tablist" class="tabs-tab-list">
    <li role="presentation"><a href="#section1" role="tab" id="tab1" aria-controls="section1" aria-selected="true" class="tabs-trigger js-tabs-trigger">Section 1</a></li>
    <li role="presentation"><a href="#section2" role="tab" id="tab2" aria-controls="section2" class="tabs-trigger js-tabs-trigger">Section 2</a></li>
    <li role="presentation"><a href="#section3" role="tab" id="tab3" aria-controls="section3" class="tabs-trigger js-tabs-trigger">Section 3</a></li>
  </ul>
  <section id="section1" role="tabpanel" aria-labelledby="tab1" class="tabs-panel js-tabs-panel" tabindex="0">
    <div class="accordion-trigger js-accordion-trigger" aria-controls="section1" aria-expanded="true" tabindex="0">Section 1</div>
    <div class="content" aria-hidden="false">
      abc
    </div>
  </section>
  <section id="section2" role="tabpanel" aria-labelledby="tab2" class="tabs-panel js-tabs-panel">
    <div class="accordion-trigger js-accordion-trigger" aria-controls="section2" aria-expanded="false" tabindex="0">Section 2</div>
    <div class="content" aria-hidden="true">
      def
    </div>
  </section>
  <section id="section3" role="tabpanel" aria-labelledby="tab3" class="tabs-panel js-tabs-panel">
    <div class="accordion-trigger js-accordion-trigger" aria-controls="section3" aria-expanded="false" tabindex="0">Section 3</div>
    <div class="content" aria-hidden="true">
      def
    </div>
  </section>
</div>
```

For an advanced version [have a look at the demo](https://matthiasott.github.io/a11y-accordion-tabs/).

By default, the script looks for all elements with the class `js-tabs` and turns them into an accordion tabs component automatically.
But you can also instantiate the component in your JavaScript like this:

```javascript
var tabs = document.getElementById("myTabs");

new AccordionTabs(tabs);
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

| **tabsAllowed** | Boolean | `true` | If `tabsAllowed` is set to `false`, the component always stays an accordion |
| **breakpoint** | Number | `640` | Defines the min-width breakpoint where the accordion becomes a tabs component. **Make sure to also adjust the CSS accordingly.** |
| **selectedTab** | Number | `0` | Sets the tab that is selected on init |
| **startCollapsed** | Boolean | `false` | Defines if the accordion should be collapsed on startup |

## Compatibility

The functions in the script are supported by all modern browsers, including IE10+.
If you need support for IE9, you might want to use [this polyfill](https://github.com/eligrey/classList.js) for `element.classList`.

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
