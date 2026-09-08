async page => {
  const results = [];
  const assert = (ok, label) => { if (!ok) throw new Error(label); results.push(label); };
  await page.goto('http://127.0.0.1:8765/monitoring/?demo=discovery');
  await page.locator('#report').waitFor({state:'visible'});
  assert((await page.locator('#message').innerText()).includes('FICTIONAL DEMONSTRATION'), 'Demo clearly labelled');
  assert(await page.locator('#discoveryResults .source').count() === 12, 'All 12 locations have example findings');
  assert(await page.locator('#discoveryQueries .source').count() === 96, 'All 96 queries shown');
  await page.locator('#location').selectOption('wales');
  assert(await page.locator('#discoveryResults .source').count() === 1, 'Location filter isolates findings');
  assert((await page.locator('#discoveryQueries').textContent()).includes('rate limit'), 'Failure evidence retained');
  assert((await page.locator('#discoveryQueries').textContent()).includes('20-result limit'), 'Truncated coverage disclosed');
  await page.locator('#status').selectOption('unchanged');
  assert(await page.locator('#discoveryResults .source').count() === 1, 'Source status filter does not hide discovery leads');
  for (const width of [1440,390,320]) {
    await page.setViewportSize({width,height:1000});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `Dashboard fits ${width}px`);
  }
  const fixture = await page.evaluate(async () => (await fetch('/output/monitoring/discovery-demo.json')).json());
  const active = fixture.discovery.reports.find(r=>r.jurisdiction==='wales');
  active.candidateCount = 2;
  const extra = {...active.candidates[0],id:'unsafe-demo',title:'<img src=x onerror="window.discoveryXss=true">',url:'javascript:alert(1)',snippet:'<script>window.discoveryXss=true</script>'};
  let calls=0;
  await page.route('**/.netlify/functions/source-monitor-report?*', async route => {
    calls++;
    const url = route.request().url();
    const body = url.includes('discoveryLocation=') ? {runId:fixture.runId,jurisdiction:'wales',candidates:[active.candidates[0],extra]} : fixture;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.locator('#month').fill('2026-09');
  await page.locator('#token').fill('fictional-access-key');
  await page.getByRole('button',{name:'Load report',exact:true}).click();
  await page.getByRole('button',{name:'Load all 2 Wales findings',exact:true}).waitFor();
  await page.locator('#location').selectOption('wales');
  await page.getByRole('button',{name:'Load all 2 Wales findings',exact:true}).click();
  await page.locator('#discoveryResults .source').nth(1).waitFor();
  assert(await page.locator('#discoveryResults .source').count() === 2, 'Remaining findings load through authenticated request');
  assert(calls === 2, 'Only mocked report requests used');
  assert(await page.locator('#discoveryResults img, #discoveryResults script').count() === 0, 'Search text cannot inject markup');
  assert(await page.locator('#discoveryResults a[href^="javascript:"]').count() === 0, 'Unsafe links are not clickable');
  assert(!await page.evaluate(()=>window.discoveryXss), 'No script executed');
  const downloadEvent = page.waitForEvent('download'); await page.locator('#download').click(); const download=await downloadEvent;
  const stream=await download.createReadStream();let exported='';for await(const chunk of stream)exported+=chunk.toString();
  assert(JSON.parse(exported).discovery.reports.find(r=>r.jurisdiction==='wales').candidates.length===2,'Export includes loaded findings');
  await page.unroute('**/.netlify/functions/source-monitor-report?*');
  await page.goto('http://127.0.0.1:8765/monitoring/?demo=discovery');
  await page.locator('#report').waitFor({state:'visible'});
  await page.locator('#location').selectOption('wales');
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:1000});
    await page.locator('.discovery').screenshot({path:`output/playwright/discovery-${width}.png`});
  }
  // Older report format continues to work without web-search data.
  delete fixture.discovery;
  await page.route('**/.netlify/functions/source-monitor-report?*', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
  await page.getByRole('button',{name:'Load report',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('discoveryStatus').textContent.includes('does not include web searches'));
  assert((await page.locator('#discoveryStatus').innerText()).includes('does not include web searches'),'Older reports remain readable');
  await page.unroute('**/.netlify/functions/source-monitor-report?*');
  await page.goto('http://127.0.0.1:8765/monitoring/?demo=discovery');
  return results;
}
