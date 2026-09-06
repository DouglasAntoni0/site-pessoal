import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessReports } from '../../scripts/lighthouse-policy.mjs';
const report = (tbt = 40) => ({ categories: {performance:{score:0.99},accessibility:{score:1},'best-practices':{score:1},seo:{score:1}},audits:{'largest-contentful-paint':{numericValue:1800},'cumulative-layout-shift':{numericValue:0},'total-blocking-time':{numericValue:tbt}} });
test('a single slow sample does not replace the median TBT limit', () => {
    assert.equal(assessReports([report(10), report(140), report(400)]).passed, true);
    assert.deepEqual(assessReports([report(10), report(180), report(400)]).failures, ['TBT']);
});
test('accessibility regression fails even when two runs score 100', () => {
    const bad = report(); bad.categories.accessibility.score = 0.98;
    assert.deepEqual(assessReports([report(), bad, report()]).failures, ['accessibility']);
});
test('missing or incomplete measurements cannot pass the gate', () => {
    assert.throws(() => assessReports([report(), report()]));
    assert.throws(() => assessReports([report(), report(), {}]));
});
