/* eslint-env mocha */
'use strict';

const assert = require('node:assert/strict');
const AccordionTabs = require('..');

describe('CommonJS entry without a browser DOM', function () {
  it('exports the constructor and its public methods', function () {
    assert.equal(typeof AccordionTabs, 'function');
    assert.equal(typeof AccordionTabs.prototype.selectTab, 'function');
    assert.equal(typeof AccordionTabs.prototype.destroy, 'function');
  });

  it('allows teardown when there was no root to initialize', function () {
    const instance = new AccordionTabs(null);
    instance.destroy();
  });
});
