# Changelog

## 2.0.0 — Unreleased

### Upgrading from 1.x

- **Breaking: Internet Explorer is no longer supported.** The browser scripts now target [Baseline Widely available](https://web.dev/baseline). The `AccordionTabs` browser global, CommonJS entry point, and existing JavaScript and CSS paths are unchanged. There are still no runtime dependencies.
- If you customize the responsive styles, match your CSS media query to the JavaScript `breakpoint` in CSS pixels. The supplied stylesheet now uses `640px` rather than `40em`, and `.tabs-allowed` indicates that tabs mode is active.
- If you call `selectTab()` directly, pass a zero-based integer such as `selectTab(1)`. Numeric strings such as `"1"` are ignored.

### Added

- Opt-in deep links: set `data-deep-link="true"` on a component or pass `{ deepLink: true }`. A fragment such as `#section2` reveals the panel with that ID, even in an initially collapsed accordion. Pointer and keyboard activation update the fragment without adding a history entry. Following a fragment link or using Back/Forward reveals the matching panel without changing other components.

### Fixed

- Clicking an icon, span, or other child of a tab or disclosure trigger now activates the correct panel instead of throwing a `TypeError` ([#25](https://github.com/matthiasott/a11y-accordion-tabs/issues/25)).
- Enter and Space no longer collapse the selected tab and leave every panel hidden. Tabs always show one panel: the first by default, or the configured `selectedTab`. `startCollapsed` applies only to accordion mode.
- The demo and recommended markup use native disclosure buttons and expose all panel content when JavaScript is unavailable. If you copied the old markup, remove static `aria-hidden="true"` from `.content` to get the same fallback. Existing focusable `div` triggers still work with JavaScript.
- `destroy()` now detaches input and navigation listeners and clears hidden panel state. An incomplete component no longer prevents subsequent components from initializing.

### Packaging and development

- The npm package ships the library and demo assets without repository tooling or tests. For development, use Node 22.12 or newer. The build uses Dart Sass instead of Node Sass; regression checks cover keyboard interaction, axe accessibility checks, and installation from the packed tarball.

## 1.0.2 — 2020-09-09

- Fixed the initial panel selection in tabs view.

## 1.0.1 — 2020-08-05

- Updated lodash from 4.17.15 to 4.17.19 to address a vulnerability.

## 1.0.0 — 2020-08-05

- **Breaking:** corrected the spelling of `accordeon` to `accordion`. Update class names in your markup and styles, including `accordeon-trigger` and `js-accordeon-trigger`.
- Fixed `startCollapsed` and a bug that reopened a collapsed accordion when the window was resized.
- Updated dependencies and documentation.

## 0.5.0

- Added `startCollapsed` to start an accordion with all panels closed.

## 0.4.1 — 2018-11-29

- Fixed the CommonJS export and updated dependencies to address vulnerabilities.

## 0.4.0

- Changed data attributes to lowercase names and improved the default ARIA roles in the demo markup.
- Replaced the demo’s chevrons with plus and minus icons.

## 0.3.2 — 2017-09-19

- Updated the documentation.

## 0.3.1

- Cleaned up the example HTML.

## 0.3.0

- Added support for multiple component instances on the same page and documented basic usage.

## 0.2.1 — 2017-09-18

- Fixed the breakpoint to use a minimum viewport width.

## 0.2.0 — 2017-09-18

- Improved ARIA roles in accordion mode.

## 0.1.0

- Initial version of the responsive accordion/tabs component.

Dates are publication dates from [GitHub Releases](https://github.com/matthiasott/a11y-accordion-tabs/releases). Versions without a published release date are retained from the original README changelog.
