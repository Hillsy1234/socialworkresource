async page => {
  const results=[];
  const assert=(ok,label)=>{if(!ok)throw new Error(label);results.push(label);};
  await page.goto('http://127.0.0.1:8765/monitoring/');
  await page.locator('#reportFile').setInputFiles('output/monitoring/triage-demo.json');
  await page.waitForFunction(()=>document.getElementById('scope').textContent.includes('Fictional prioritisation'));
  assert((await page.locator('#triageStats').textContent()).includes('Review first'),'Priority totals visible');
  assert((await page.locator('#discoveryResults .source').first().textContent()).includes('FICTIONAL EXAMPLE — updated guidance'),'Highest priority appears first across locations');
  await page.locator('#location').selectOption('wales');
  assert(await page.locator('#discoveryResults .source').count()===2,'Shortlist keeps high and unverified leads');
  await page.locator('#discoveryPriority').selectOption('review-first');
  assert(await page.locator('#discoveryResults .source').count()===1,'Review-first filter isolates strongest lead');
  assert((await page.locator('#discoveryResults').textContent()).includes('not been verified'),'Priority explains uncertainty');
  assert(await page.locator('#discoveryResults a[href*="resource=care-support"]').count()===1,'Topic suggestion links to actual local learning resource');
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download review brief',exact:true}).click();
  const download=await event,stream=await download.createReadStream();let body='';for await(const chunk of stream)body+=chunk.toString();
  assert(body.includes('Location: Wales')&&body.includes('resource=care-support')&&body.includes('not a verified interpretation'),'Downloaded brief includes source context, learning links and review limitation');
  await page.locator('#discoveryPriority').selectOption('background');
  assert(await page.locator('#discoveryResults .source').count()===1,'Background findings remain accessible');
  assert((await page.locator('#discoveryResults').textContent()).includes('recruitment advert'),'Background reason explains classification');
  await page.locator('#discoveryPriority').selectOption('all');
  assert(await page.locator('#discoveryResults .source').count()===3,'All findings retains complete location set');
  await page.locator('#discoveryPriority').selectOption('review-first');
  for(const width of [1440,390,320]){
    await page.setViewportSize({width,height:1000});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Prioritisation fits ${width}px`);
    if(width!==320)await page.locator('.discovery').screenshot({path:`output/playwright/triage-${width}.png`});
  }
  return results;
}
