async browserPage => {
  const browser = browserPage.context().browser(), checks = [], errors = [];
  const assert = (ok, label) => { if (!ok) throw Error(label); checks.push(label); };
  const base = browserPage.url().split('/').slice(0, 3).join('/');
  const context = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  try {
    const p = await context.newPage(); p.on('pageerror', error => errors.push(error.message));
    await p.goto(`${base}/garden/`); await p.waitForSelector('body[data-garden-ready=true]'); await p.locator('#enterButton').tap();
    for (const [width, height] of [[390, 844], [320, 740], [844, 390]]) {
      await p.setViewportSize({width, height});
      await p.locator('#quietButton').tap();
      assert(await p.locator('#showControls').isVisible(), `${width}: quiet view has an accessible return control`);
      await p.touchscreen.tap(width / 2, height / 2);
      assert(!await p.locator('body').evaluate(node => node.classList.contains('quiet-view')), `${width}: a touch restores the controls`);
      await p.locator('#visitButton').tap();
      await p.locator('#qualitySelect').selectOption('battery');
      await p.locator('#saveFavourite').tap();
      assert((await p.locator('#favouriteSummary').innerText()).includes('garden gate'), `${width}: favourite can be saved from the visit dialog`);
      await p.locator('#doneVisit').tap();
      await p.locator('#soundMixButton').tap(); await p.locator('#rainVolume').fill('25'); await p.locator('#rainVolume').dispatchEvent('change'); await p.locator('#doneSound').tap();
      await p.locator('#mapButton').tap(); await p.locator('[data-place="8"]').tap(); await p.locator('#readingButton').tap();
      assert(await p.locator('#readingText').isVisible(), `${width}: original readings remain readable`);
      await p.locator('#doneReading').tap();
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: controls do not overflow horizontally`);
      await p.screenshot({path: `output/playwright/immersion-mobile-${width}.png`});
      await p.locator('#mapButton').tap(); await p.locator('[data-place="0"]').tap();
    }
    await p.emulateMedia({reducedMotion: 'reduce'}); await p.reload(); await p.waitForSelector('body[data-garden-ready=true]'); await p.locator('#favouriteEntry').tap();
    assert(await p.locator('#motionButton').getAttribute('aria-pressed') === 'true', 'Returning to a favourite respects system reduced motion');
    assert(await p.locator('#soundButton').getAttribute('aria-pressed') === 'false', 'Mobile favourites do not enable sound');
    assert(errors.length === 0, `No mobile runtime errors: ${errors.join('; ')}`);
  } finally { await context.close(); }
  const blocked = await browser.newContext();
  try {
    await blocked.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Blocked for test', 'SecurityError'); }; });
    const p = await blocked.newPage(); await p.goto(`${base}/garden/`); await p.waitForSelector('body[data-garden-ready=true]'); await p.locator('#enterButton').click();
    await p.locator('#visitButton').click(); await p.locator('#saveFavourite').click();
    assert(await p.locator('#goFavourite').isDisabled() && (await p.locator('#visitStatus').textContent()).includes('Saving is unavailable'), 'Blocked storage never falsely confirms a saved favourite');
    await p.locator('#doneVisit').click(); await p.locator('#quietButton').click(); await p.keyboard.press('Escape');
    assert(await p.locator('#visitButton').isVisible(), 'Quiet view remains usable when browser storage is blocked');
  } finally { await blocked.close(); }
  return {passed: checks.length, checks};
}
