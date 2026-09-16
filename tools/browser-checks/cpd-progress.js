async browserPage => {
  const context = await browserPage.context().browser().newContext();
  const page = await context.newPage();
  const checks = [];
  const assert = (ok, label) => { if (!ok) throw new Error(label); checks.push(label); };
  const ready = () => page.waitForFunction(() => document.querySelector('#cpdRequirementStatus') && document.querySelector('#learningWorkspace').getAttribute('aria-busy') === 'false');
  try {
    const origin = browserPage.url().split('/').slice(0, 3).join('/');
    await page.goto(`${origin}/?jurisdiction=england&resource=cpd-log`);
    await ready();
    const years = await page.evaluate(() => {
      const entries = ['2025-11-30', '2025-12-01', '2026-11-30', '2026-12-01', ''].map(activityDate => ({activityDate}));
      return [new Date(2026, 10, 30), new Date(2026, 11, 1)].map(date => currentYearCpdEntries(entries, date).map(entry => entry.activityDate));
    });
    assert(JSON.stringify(years) === JSON.stringify([['2025-12-01', '2026-11-30'], ['2026-12-01']]), 'Annual count includes both boundaries, rolls over on 1 December and excludes undated drafts');
    await page.evaluate(() => {
      const current = new Date();
      const startYear = current.getMonth() === 11 ? current.getFullYear() : current.getFullYear() - 1;
      window.cpdFixtures = [1, 2].map(id => ({id: String(id), title: 'Synthetic prior-year draft', activityDate: `${startYear}-06-01`, registrationYear: currentRegistrationYearLabel(), learning: 'Synthetic learning', impact: 'Synthetic impact', peerReflectionIncluded: id === 1}));
      saveCpdEntries(window.cpdFixtures);
      renderCpdEntries();
    });
    assert((await page.locator('#cpdRequirementStatus').innerText()).includes('0/2'), 'Older activity dates cannot count even when the year label contains its default');
    assert(await page.locator('#cpdEntries .cpd-entry').count() === 2, 'Older drafts remain available in the saved log');
    await page.evaluate(() => {
      const now = new Date();
      const startYear = now.getMonth() === 11 ? now.getFullYear() : now.getFullYear() - 1;
      saveCpdEntries([...window.cpdFixtures, ...[3, 4].map(id => ({id: String(id), title: 'Synthetic current draft', activityDate: `${startYear}-12-01`, learning: 'Synthetic learning', impact: 'Synthetic impact'}))]);
      renderCpdEntries();
    });
    let status = await page.locator('#cpdRequirementStatus').innerText();
    assert(status.includes('2/2') && status.includes('0/1') && status.includes('Drafting'), 'Previous-year peer reflection cannot satisfy this year’s count');
    await page.evaluate(() => {
      const entries = getCpdEntries();
      entries[2].peerReflectionIncluded = true;
      saveCpdEntries(entries);
      renderCpdEntries();
    });
    assert((await page.locator('#cpdRequirementStatus').innerText()).includes('Ready'), 'Two current-year drafts with current-year peer reflection show Ready');
    await page.locator('#confidenceSelect').selectOption('learning');
    await page.evaluate(() => {
      window.nativeSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function () { throw new DOMException('Synthetic quota failure', 'QuotaExceededError'); };
    });
    await page.locator('#confidenceSelect').selectOption('confident');
    assert(await page.locator('#confidenceSelect').inputValue() === 'learning', 'Failed confidence save restores the previous selection');
    assert((await page.locator('#readerSaveStatus').innerText()).includes('Unable to save confidence'), 'Failed confidence save displays an error');
    for (const button of ['#markReadButton', '#readerMarkReadButton']) {
      await page.locator(button).click();
      assert((await page.locator('#readerSaveStatus').innerText()).includes('Unable to save reading progress'), `${button}: failed save displays an error`);
      assert(await page.locator(button).getAttribute('aria-pressed') === 'false', `${button}: failed save does not mark the section read`);
      assert(!await page.locator('#readerSaveStatus').evaluate(node => node.classList.contains('is-confirmed')), `${button}: failed save has no success styling`);
    }
    await page.evaluate(() => { Storage.prototype.setItem = window.nativeSetItem; });
    await page.reload(); await ready();
    assert(await page.locator('#confidenceSelect').inputValue() === 'learning' && await page.locator('#readerMarkReadButton').getAttribute('aria-pressed') === 'false', 'Reload preserves the last successfully saved state');
    await page.locator('#confidenceSelect').selectOption('confident');
    await page.locator('#readerMarkReadButton').click();
    assert(await page.locator('#readerSaveStatus').evaluate(node => node.classList.contains('is-confirmed')), 'Successful retry displays success styling');
    await page.reload(); await ready();
    assert(await page.locator('#confidenceSelect').inputValue() === 'confident' && await page.locator('#readerMarkReadButton').getAttribute('aria-pressed') === 'true', 'Successful confidence and reading-progress retries survive reload');
    return {passed: checks.length, checks};
  } finally { await context.close(); }
}
