async browserPage => {
  // Isolate browser-local CPD records from the user's preview session.
  const context = await browserPage.context().browser().newContext();
  const page = await context.newPage(), checks = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (ok, label) => { if (!ok) throw new Error(label); checks.push(label); };
  const base = 'http://127.0.0.1:8766';
  const ready = () => page.waitForFunction(() => document.querySelector('#contentView')?.childElementCount && document.querySelector('#learningWorkspace').getAttribute('aria-busy') === 'false');
  const settle = () => page.waitForTimeout(1500);
  try {
    for (const width of [1440, 390]) {
      await page.setViewportSize({width, height:900});
      await page.goto(`${base}/?jurisdiction=canada-ontario&resource=cpd-log`); await ready();
      await page.locator('.cpd-form [name=title]').fill('Fictional navigation check');
      await page.evaluate(() => scrollTo({top:document.querySelector('#readerSection').getBoundingClientRect().top + scrollY + 650, behavior:'instant'}));
      const before = await page.evaluate(() => scrollY);
      const current = width === 1440 ? '#primaryNav [data-open=cpd-log]' : '#navList [data-open=cpd-log]';
      await page.locator(current).click(); await page.waitForTimeout(200);
      assert(Math.abs(await page.evaluate(() => scrollY) - before) < 3, `${width}: reselecting the open CPD guide preserves scroll`);
      assert(await page.locator('.cpd-form [name=title]').inputValue() === 'Fictional navigation check', `${width}: reselecting preserves form contents`);
      await page.locator('.toc-link').first().click(); await settle();
      const alignment = await page.evaluate(() => ({target:document.getElementById(decodeURIComponent(location.hash.slice(1))).getBoundingClientRect().top, offset:document.querySelector('.site-header').offsetHeight + (innerWidth <= 980 ? document.querySelector('.sidebar').offsetHeight : 0) + 18}));
      assert(Math.abs(alignment.target - alignment.offset) < 3, `${width}: contents links clear the sticky navigation`);
      await page.evaluate(() => window.navigationForm = document.querySelector('.cpd-form'));
      await page.goBack(); await page.waitForTimeout(300);
      assert(await page.evaluate(() => window.navigationForm === document.querySelector('.cpd-form')), `${width}: anchor Back preserves the existing form`);
      await page.goto(`${base}/community/?jurisdiction=wales`);
      await page.waitForFunction(() => document.getElementById('feedStatus').textContent.includes('discussions loaded'));
      await page.evaluate(() => window.navigationMarker = true);
      await page.getByRole('link', {name:'Practice Community', exact:true}).first().click(); await settle();
      assert(await page.evaluate(() => window.navigationMarker && new URL(location.href).searchParams.get('jurisdiction') === 'wales'), `${width}: current community link keeps location without reloading`);
      await page.locator('#topicList .topic-card h3 button').last().click(); await page.locator('#threadTitle').waitFor();
      const dialogY = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 700); await page.waitForTimeout(200);
      assert(await page.evaluate(() => scrollY) === dialogY, `${width}: discussion dialog locks background scrolling`);
      await page.locator('#threadDialog [data-close]').click(); await page.waitForTimeout(200);
      assert(await page.evaluate(() => scrollY) === dialogY, `${width}: closing discussion keeps the page position`);
      await page.locator('#chooseLocation').click();
      await page.locator('#locationOptions [data-location=canada-ontario]').click();
      assert(await page.locator('#selectedLocation').textContent() === 'Ontario', `${width}: community location picker remains functional`);
    }
    await page.setViewportSize({width:1440,height:900});
    await page.goto(`${base}/?jurisdiction=england&resource=cpd-log`); await ready();
    await page.evaluate(() => {
      scrollTo({top:document.body.scrollHeight-1000,behavior:'instant'});
      window.navigationSamples = [];
      const sample = () => { navigationSamples.push(scrollY); if(navigationSamples.length<90)requestAnimationFrame(sample); }; requestAnimationFrame(sample);
    });
    await page.locator('#primaryNav [data-open=contact-us]').click(); await settle();
    const samples = await page.evaluate(() => navigationSamples);
    assert(samples.length>20 && Math.max(...samples.slice(1).map((y,i)=>Math.abs(y-samples[i]))) < 500, 'Long-to-short guide change animates without an immediate page-height jump');
    assert(await page.locator('#readerSection').evaluate(n => n.style.minHeight === ''), 'Temporary reader height is cleared after navigation');
    assert(await page.evaluate(() => document.activeElement.id === 'readerSection'), 'Keyboard focus follows the newly opened guide');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('#primaryNav [data-open=cpd-log]').click();
    assert(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === 'auto'), 'Learning navigation respects reduced motion');
    const reduced = await page.locator('#readerSection').boundingBox();
    assert(reduced.y >= 70 && reduced.y < 110, 'Reduced-motion resource navigation reaches its destination immediately');
    await page.goto(`${base}/community/`);
    assert(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === 'auto'), 'Community navigation respects reduced motion');
    assert(!errors.length, `No browser errors: ${errors.join(', ')}`);
    return {passed:checks.length, checks};
  } finally { await context.close(); }
}
