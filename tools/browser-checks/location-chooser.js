async page => {
 const results=[]; const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const assert=(ok,label)=>{if(!ok)throw Error(label);results.push(label)};
 const ready=async id=>page.waitForFunction(id=>document.documentElement.dataset.jurisdiction===id && document.querySelector('#learningWorkspace').getAttribute('aria-busy')==='false',id);
 const go=async(id,resource='children')=>{await page.goto(`http://127.0.0.1:8765/?jurisdiction=${id}&resource=${resource}`);await ready(id)};
 const open=async()=>page.locator('#locationChooserButton').click();
 const choose=async id=>{await open();await page.locator(`[data-location="${id}"]`).click();await ready(id)};
 await page.setViewportSize({width:1440,height:1000});await go('wales');await open();
 assert(await page.locator('#locationSearch').evaluate(el=>el===document.activeElement),'Search receives focus');
 assert(await page.locator('.location-group').count()===6,'Six country groups');
 assert(await page.locator('[data-location]').count()===12,'Twelve locations');
 assert(await page.locator('[data-location="wales"]').getAttribute('aria-pressed')==='true','Current location marked');
 await page.locator('#locationSearch').fill('Canada');assert(await page.locator('[data-location]').count()===2,'Search finds provinces by country');
 await page.locator('#locationSearch').fill('NSW');assert(await page.locator('[data-location="australia-nsw"]').count()===1,'State abbreviation search');
 await page.locator('#locationSearch').fill('Cymru');assert(await page.locator('[data-location="wales"]').count()===1,'Welsh name search');
 await page.locator('#locationSearch').fill('no-such-place');assert(await page.locator('.location-empty').isVisible(),'Empty search message');
 await page.locator('#locationSearch').fill('New York');await page.keyboard.press('ArrowDown');
 assert(await page.locator('[data-location="united-states-new-york"]').evaluate(el=>el===document.activeElement),'Arrow key selects result');
 await page.keyboard.press('Enter');await ready('united-states-new-york');
 assert(!await page.locator('#locationDialog').isVisible(),'Selection closes dialog');
 assert(await page.locator('#locationChooserButton').evaluate(el=>el===document.activeElement),'Selection restores focus');
 assert((await page.locator('#activeTitle').innerText()).includes('Children'),'Selection preserves current topic');
 const locations=await page.evaluate(()=>practiceLocations);
 for(const location of locations){
  await choose(location.id);
  assert((await page.locator('#pageTitle').innerText()).includes(location.name),`${location.id}: hero title`);
  assert((await page.locator('#heroLocationContext').innerText()).includes(location.body),`${location.id}: professional context`);
  assert((await page.locator('#locationTriggerName').innerText())===location.name,`${location.id}: trigger`);
  assert(await page.locator('#heroLocationFlag img').evaluate(img=>img.complete && img.naturalWidth>0),`${location.id}: flag loads`);
  assert(await page.evaluate(()=>new URL(location.href).searchParams.get('jurisdiction'))===location.id,`${location.id}: URL`);
 }
 await choose('wales');await choose('scotland');await page.goBack();await ready('wales');
 assert((await page.locator('#heroLocationName').innerText())==='Wales','History restores hero');
 await open();await page.keyboard.press('Escape');assert(!await page.locator('#locationDialog').isVisible(),'Escape closes');
 await page.waitForFunction(()=>document.querySelector('#locationChooserButton').getAttribute('aria-expanded')==='false');
 assert(await page.locator('#locationChooserButton').getAttribute('aria-expanded')==='false','Closed trigger state');
 await open();await page.mouse.click(5,5);assert(!await page.locator('#locationDialog').isVisible(),'Backdrop closes');
 await go('england');await page.route('**/content/australia-victoria/manifest.json*',route=>route.abort());
 await open();await page.locator('[data-location="australia-victoria"]').click();
 await page.waitForFunction(()=>document.querySelector('#jurisdictionStatus').textContent.includes('Unable to load'));
 assert((await page.locator('#heroLocationName').innerText())==='England','Failed load preserves hero');
 assert(await page.locator('#locationChooserButton').isEnabled(),'Failed load allows retry');
 await page.unroute('**/content/australia-victoria/manifest.json*');await choose('australia-victoria');
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:800});await choose('canada-british-columbia');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px: hero fits`);
  await open();assert(await page.locator('#locationDialog').evaluate(el=>el.scrollWidth<=el.clientWidth),`${width}px: chooser fits`);
  assert(await page.locator('#locationSearch').isVisible(),`${width}px: search visible`);
  await page.locator('[data-location="united-states-new-york"]').click();await ready('united-states-new-york');
  assert((await page.locator('#heroLocationName').innerText())==='New York',`${width}px: last option reachable`);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await choose('wales');
 assert(await page.locator('.hero-content').evaluate(el=>el.getAnimations().length===0),'Reduced motion respected');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'output/playwright/location-hero-mobile.png',animations:'disabled'});await open();
 await page.screenshot({path:'output/playwright/location-chooser-mobile.png',animations:'disabled'});
 await page.keyboard.press('Escape');await page.setViewportSize({width:1440,height:1100});await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'output/playwright/location-hero-desktop.png',animations:'disabled'});await open();
 await page.screenshot({path:'output/playwright/location-chooser-desktop.png',animations:'disabled'});await page.keyboard.press('Escape');
 assert(errors.length===0,`No JavaScript errors: ${errors.join('; ')}`);
 return `${results.length} location chooser and hero checks passed.`;
}
