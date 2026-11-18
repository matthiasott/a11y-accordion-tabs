/*
 * Accessible AccordionTabs, by Matthias Ott (@m_ott)
 * Based on the work of @stowball (https://codepen.io/stowball/pen/xVWwWe)
 */
(function () {
  'use strict';

  const panelOwners = new WeakMap();
  const rootSelector = '.js-tabs, .accordion-tabs';

  function readOptions (data, options) {
    const settings = { breakpoint: 640, tabsAllowed: true, selectedTab: 0, startCollapsed: false, deepLink: false, ...options };
    for (const key of ['tabsAllowed', 'startCollapsed', 'deepLink']) {
      if (data[key] === 'true' || data[key] === 'false') settings[key] = data[key] === 'true';
    }
    for (const key of ['breakpoint', 'selectedTab']) {
      if (data[key]) settings[key] = parseInt(data[key], 10);
    }
    return settings;
  }

  function fragmentId () {
    try {
      return decodeURIComponent(window.location.hash.slice(1));
    } catch (error) {
      return ''; // Malformed percent escape, not a panel link.
    }
  }

  function AccordionTabs (el, options) {
    if (!el) return;
    this.el = el;
    // Compare nearest roots rather than requiring a particular wrapper depth.
    // Both may be null for a standalone, manually initialized element.
    const boundary = el.closest(rootSelector);
    const owns = node => node.closest(rootSelector) === boundary;
    const owned = selector => Array.from(el.querySelectorAll(selector)).filter(owns);
    this.tabTriggers = owned('.js-tabs-trigger');
    this.tabPanels = owned('.js-tabs-panel');
    this.accordionTriggers = owned('.js-accordion-trigger');
    this.contents = this.tabPanels.map(panel => Array.from(panel.querySelectorAll('.content')).find(owns));
    const count = this.tabTriggers.length;
    if (!count || count !== this.tabPanels.length || count !== this.accordionTriggers.length || this.contents.includes(undefined)) return;

    this.options = readOptions(el.dataset, options);
    const index = Number(this.options.selectedTab);
    this.selectedTab = Number.isInteger(index) ? Math.max(0, Math.min(count - 1, index)) : 0;
    this.media = window.matchMedia(`(min-width: ${Number(this.options.breakpoint)}px)`);
    this.isAccordion = !this.options.tabsAllowed || !this.media.matches;
    this.managedRole = this.tabPanels.map(panel => !panel.hasAttribute('role'));
    this.needsButtonRole = this.accordionTriggers.map(trigger => !trigger.matches('button, [role]'));
    this.clickListener = this._clickEvent.bind(this);
    this.keydownListener = this._keydownEvent.bind(this);

    this.tabTriggers.forEach((tab, i) => {
      const accordion = this.accordionTriggers[i];
      for (const trigger of [tab, accordion]) {
        trigger.index = i;
        trigger.addEventListener('click', this.clickListener);
        trigger.addEventListener('keydown', this.keydownListener);
      }
      panelOwners.set(this.tabPanels[i], this);
      // Support the focusable div in earlier versions of the markup.
      if (this.needsButtonRole[i]) accordion.setAttribute('role', 'button');
      this._setOpen(i, false);
    });

    this.modeListener = () => {
      this.isAccordion = !this.media.matches;
      this._syncMode();
      if (!this.isAccordion) this.selectTab(this.selectedTab);
    };
    this.el.classList.add('is-initialized');
    this._syncMode();
    if (this.options.deepLink) {
      this.hashListener = this._revealFragment.bind(this);
      window.addEventListener('hashchange', this.hashListener);
    }
    const linked = this.hashListener && this.hashListener();
    if (!linked && (!this.isAccordion || !this.options.startCollapsed)) this.selectTab(this.selectedTab);
    if (this.options.tabsAllowed) this.media.addEventListener('change', this.modeListener);
  }

  AccordionTabs.prototype._syncMode = function () {
    this.el.classList.toggle('tabs-allowed', !this.isAccordion);
    this.tabPanels.forEach((panel, i) => {
      if (this.managedRole[i]) {
        panel.setAttribute('role', this.isAccordion ? 'group' : 'tabpanel');
      }
    });
  };

  AccordionTabs.prototype._revealFragment = function () {
    const id = fragmentId();
    const index = id ? this.tabPanels.findIndex(panel => panel.id === id) : -1;
    if (index === -1) return false;
    // Reveal enclosing panels without toggling them, moving focus or rewriting the hash.
    for (let panel = this.el.closest('.js-tabs-panel'); panel; panel = panel.parentElement?.closest('.js-tabs-panel')) {
      const owner = panelOwners.get(panel);
      if (owner) owner.selectTab(owner.tabPanels.indexOf(panel));
    }
    this.selectTab(index);
    // Native fragment scrolling may already have skipped this then-hidden panel.
    this.tabPanels[index].scrollIntoView();
    return true;
  };

  AccordionTabs.prototype._activate = function (index) {
    this.selectTab(index, true);
    if (!this.options.deepLink) return;
    const panel = this.tabPanels[index];
    if (!panel.id) return;
    const open = panel.classList.contains('is-open');
    const matches = fragmentId() === panel.id;
    if (open === matches) return;
    const url = new URL(window.location.href);
    url.hash = open ? encodeURIComponent(panel.id) : '';
    window.history.replaceState(window.history.state, '', url);
  };

  AccordionTabs.prototype._clickEvent = function (e) {
    e.preventDefault();
    this._activate(e.currentTarget.index);
  };

  AccordionTabs.prototype._keydownEvent = function (e) {
    const trigger = e.currentTarget;
    let index = trigger.index;
    if (!this.isAccordion && e.key === 'ArrowLeft') index = Math.max(0, index - 1);
    else if (!this.isAccordion && e.key === 'ArrowRight') index = Math.min(this.tabTriggers.length - 1, index + 1);
    else if (e.key !== ' ' && e.key !== 'Enter') return;
    else if (trigger.matches('button') || (trigger.matches('a[href]') && e.key === 'Enter')) return; // Native click.
    e.preventDefault();
    this._activate(index);
  };

  AccordionTabs.prototype._setOpen = function (i, open) {
    const tab = this.tabTriggers[i];
    const panel = this.tabPanels[i];
    tab.classList.toggle('is-selected', open);
    tab.setAttribute('aria-selected', open);
    this.accordionTriggers[i].setAttribute('aria-expanded', open);
    this.contents[i].setAttribute('aria-hidden', !open);
    for (const element of [panel, this.contents[i]]) {
      element.classList.toggle('is-open', open);
      element.classList.toggle('is-hidden', !open);
    }
    if (open) {
      tab.removeAttribute('tabindex');
      panel.removeAttribute('tabindex');
    } else {
      tab.setAttribute('tabindex', '-1');
      panel.setAttribute('tabindex', '-1');
    }
  };

  AccordionTabs.prototype.selectTab = function (index, userInvoked) {
    if (index === null && !this.isAccordion) index = 0;
    if (!this.modeListener) return;
    if (!Number.isInteger(index) || index < 0 || index >= this.tabPanels.length) return;
    if (this.isAccordion && userInvoked && this.tabPanels[index].classList.contains('is-open')) {
      this._setOpen(index, false);
      this.selectedTab = null;
      return;
    }
    if (!this.isAccordion) {
      for (const i of this.tabPanels.keys()) {
        if (i !== index) this._setOpen(i, false);
      }
    }
    this.selectedTab = index;
    this._setOpen(index, true);
    if (userInvoked) (this.isAccordion ? this.accordionTriggers : this.tabTriggers)[index].focus();
  };

  AccordionTabs.prototype.destroy = function () {
    if (!this.modeListener) return;
    if (this.hashListener) window.removeEventListener('hashchange', this.hashListener);
    this.media.removeEventListener('change', this.modeListener);
    this.modeListener = null;
    this.tabTriggers.forEach((tab, i) => {
      const panel = this.tabPanels[i];
      const accordion = this.accordionTriggers[i];
      for (const trigger of [tab, accordion]) {
        trigger.removeEventListener('click', this.clickListener);
        trigger.removeEventListener('keydown', this.keydownListener);
        delete trigger.index;
      }
      tab.classList.remove('is-selected');
      tab.removeAttribute('aria-selected');
      tab.removeAttribute('tabindex');
      accordion.removeAttribute('aria-expanded');
      if (this.needsButtonRole[i]) accordion.removeAttribute('role');
      panelOwners.delete(panel);
      panel.removeAttribute('tabindex');
      if (this.managedRole[i]) panel.removeAttribute('role');
      panel.classList.remove('is-open', 'is-hidden');
      this.contents[i].classList.remove('is-open', 'is-hidden');
      this.contents[i].removeAttribute('aria-hidden');
    });
    this.el.classList.remove('is-initialized', 'tabs-allowed');
  };

  function init () {
    document.querySelectorAll('.js-tabs').forEach(el => { new AccordionTabs(el); });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
  if (typeof self !== 'undefined') self.AccordionTabs = AccordionTabs;
  if (typeof module === 'object' && module.exports) module.exports = AccordionTabs;
})();
