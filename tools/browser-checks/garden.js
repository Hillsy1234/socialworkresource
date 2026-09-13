async browserPage => {
  const context=await browserPage.context().browser().newContext({viewport:{width:1440,height:960}});
  const page=await context.newPage(),checks=[],errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  const assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const base='http://127.0.0.1:8766';
  const ready=()=>page.waitForFunction(()=>document.body.dataset.gardenReady==='true');
  try{
    await page.goto(`${base}/?jurisdiction=canada-ontario&resource=cpd-log#readerSection`);
    await page.waitForFunction(()=>document.querySelector('.cpd-form')&&document.getElementById('learningWorkspace').getAttribute('aria-busy')==='false');
    assert(!requests.some(url=>url.includes('/garden/app.js')),'Learning page does not load the 3D bundle');
    await page.locator('.cpd-form [name=title]').fill('Fictional garden navigation check');
    await page.locator('[data-garden-link]').click();await ready();await page.locator('.intro .miniature').click();await ready();
    const returnData=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('quietGarden.return')));
    assert(returnData.url.includes('canada-ontario')&&returnData.url.includes('cpd-log'),'Garden remembers location and resource');
    assert(await page.locator('#soundButton').getAttribute('aria-pressed')==='false','Audio starts off');
    await page.locator('#enterButton').click();
    assert(await page.locator('#bloomButton').evaluate(n=>n===document.activeElement),'Entry moves keyboard focus to the flower action');
    await page.keyboard.press('Enter');
    assert((await page.locator('#progressText').textContent()).startsWith('1 of 6'),'Keyboard opens a flower');
    for(let i=0;i<5;i++)await page.locator('#bloomButton').click();
    assert((await page.locator('#progressText').textContent()).startsWith('6 of 6'),'All six flowers complete the journey');
    assert(await page.locator('#journeyTitle').textContent()==='A moment, well spent.','Journey ends with an optional stopping point');
    await page.locator('[data-theme=night]').click();
    await page.locator('#arrangeButton').click();
    for(const type of ['plant','stone','lantern']){await page.locator(`[data-object=${type}]`).click();await page.locator('#placeButton').click();}
    assert((await page.locator('#decorationCount').textContent()).startsWith('3 of 12'),'All three decoration types can be placed without canvas interaction');
    await page.locator('#undoButton').click();assert((await page.locator('#decorationCount').textContent()).startsWith('2 of 12'),'Undo removes only the latest addition');
    for(let i=0;i<10;i++)await page.locator('#placeButton').click();
    assert(await page.locator('#placeButton').isDisabled(),'The twelve-object limit is enforced');
    await page.locator('#closeArrange').click();
    await page.locator('#soundButton').click();assert(await page.locator('#soundButton').getAttribute('aria-pressed')==='true','Sound can be started with explicit interaction');
    await page.locator('#soundButton').click();assert(await page.locator('#soundButton').getAttribute('aria-pressed')==='false','Sound can be muted');
    await page.locator('#motionButton').click();assert(await page.locator('#motionButton').getAttribute('aria-pressed')==='true','Still mode can be enabled');
    await page.reload();await ready();
    assert(await page.locator('[data-theme=night]').getAttribute('aria-pressed')==='true','Lighting choice survives reload');
    await page.locator('#enterButton').click();
    assert((await page.locator('#progressText').textContent()).startsWith('6 of 6'),'Bloom progress survives reload');
    assert((await page.locator('#decorationCount').textContent()).startsWith('12 of 12'),'Garden additions survive reload');
    await page.locator('#returnLink').click();
    await page.waitForFunction(()=>document.querySelector('.cpd-form')&&document.getElementById('learningWorkspace').getAttribute('aria-busy')==='false');
    await page.waitForTimeout(300);
    assert(await page.locator('.cpd-form [name=title]').inputValue()==='Fictional garden navigation check','Returning preserves the CPD draft');
    assert(Math.abs(await page.evaluate(()=>scrollY)-returnData.y)<5,'Returning restores the learning scroll position');
    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});await page.goto(`${base}/garden/miniature.html`);await ready();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px: no horizontal overflow`);
      await page.locator('#enterButton').click();await page.locator('#bloomButton').click();await page.locator('#bloomButton').click();
      assert((await page.locator('#progressText').textContent()).startsWith(width===390?'1 of 6':'3 of 6'),`${width}px: game controls remain usable`);
    }
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await ready();
    assert(await page.locator('#motionButton').getAttribute('aria-pressed')==='true','System reduced motion enables Still mode');
    assert(!errors.length,`No runtime errors in the working garden: ${errors.join(', ')}`);
    const fallbackContext=await browserPage.context().browser().newContext();
    try{await fallbackContext.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
      const fallback=await fallbackContext.newPage();await fallback.goto(`${base}/garden/miniature.html`);await fallback.locator('#fallback').waitFor();assert(await fallback.locator('#fallbackReturn').isVisible(),'WebGL failure offers an accessible alternative and return link');
    }finally{await fallbackContext.close();}
    return {passed:checks.length,checks};
  }finally{await context.close();}
}
