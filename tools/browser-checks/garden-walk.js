async browserPage => {
 const browser=browserPage.context().browser(),context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage(),checks=[],errors=[];
 const assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);},base='http://127.0.0.1:8766';
 const ready=p=>p.waitForSelector('body[data-garden-ready=true]');
 const position=async p=>[Number(await p.locator('#mapDot').getAttribute('cx')),Number(await p.locator('#mapDot').getAttribute('cy'))];
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  await page.goto(`${base}/?jurisdiction=canada-ontario&resource=cpd-log#readerSection`);
  await page.waitForFunction(()=>document.querySelector('.cpd-form')&&document.getElementById('learningWorkspace').getAttribute('aria-busy')==='false');
  assert(!await page.locator('script[src*="garden/app"]').count(),'Learning page keeps the 3D bundle separate');
  await page.locator('.cpd-form [name=title]').fill('Fictional walking navigation check');
  await page.locator('.header-garden-link[data-garden-link]').click();await ready(page);
  const returnData=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('quietGarden.return')));
  assert(returnData.url.includes('canada-ontario')&&returnData.url.includes('cpd-log'),'Walking view retains the learning location and resource');
  assert(await page.locator('#soundButton').getAttribute('aria-pressed')==='false','Sound starts off');
  await page.locator('#enterButton').click();assert(await page.locator('#guideButton').evaluate(n=>n===document.activeElement),'Entry sets keyboard focus');
  let before=await position(page);await page.keyboard.down('w');await page.waitForTimeout(850);await page.keyboard.up('w');await page.waitForTimeout(280);let after=await position(page);
  assert(distance(before,after)>.2,'Keyboard walking changes the eye-level position');
  await page.waitForTimeout(350);assert(distance(after,await position(page))<.01,'Releasing the key stops movement');
  await page.locator('#guideButton').click();before=await position(page);await page.waitForTimeout(900);after=await position(page);assert(distance(before,after)>.2,'Guided walking follows the path');
  await page.locator('#pauseButton').click();await page.waitForTimeout(250);before=await position(page);await page.waitForTimeout(350);assert(distance(before,await position(page))<.01,'Pause immediately stops the guided walk');
  await page.locator('#guideButton').click();await page.keyboard.press('Escape');assert(await page.locator('#guideButton').getAttribute('aria-pressed')==='false','Escape stops walking');
  await page.locator('#guideButton').click();await page.locator('#helpButton').click();assert(await page.locator('#guideButton').getAttribute('aria-pressed')==='false','Opening instructions pauses movement');await page.locator('#doneHelp').click();
  for(let i=0;i<9;i++){await page.locator('#mapButton').click();await page.locator(`[data-place="${i}"]`).click();assert(await page.locator(`[data-place="${i}"]`).getAttribute('aria-current')==='true',`Map reaches quiet spot ${i+1}`);}
  await page.locator('#mapButton').click();await page.locator('[data-place="2"]').click();await page.locator('#interactButton').click();assert((await page.locator('#status').textContent()).includes('circles'),'Water interaction creates a ripple');
  await page.locator('#mapButton').click();await page.locator('[data-place="4"]').click();before=await position(page);await page.locator('#sitButton').click();assert(await page.locator('#sitButton').getAttribute('aria-pressed')==='true','A bench offers a seated view');await page.locator('#sitButton').click();await page.waitForTimeout(300);assert(distance(before,await position(page))<.01,'Standing returns to a safe walking position');
  await page.locator('[data-theme=night]').click();await page.locator('#speedSelect').selectOption('0.8');
  await page.locator('#soundButton').click();await page.waitForFunction(()=>!document.getElementById('soundButton').disabled);assert(await page.locator('#soundButton').getAttribute('aria-pressed')==='true','Optional sound starts');await page.locator('#soundButton').click();
  await page.locator('#motionButton').click();assert(await page.locator('#guideButton').isDisabled(),'Still mode disables automatic walking');before=await position(page);await page.keyboard.down('w');await page.waitForTimeout(300);await page.keyboard.up('w');assert(distance(before,await position(page))<.01,'Still mode prevents keyboard motion');
  await page.locator('#nextButton').click();assert(await page.locator('#placeName').textContent()==='The woodland trail','Still mode retains instant navigation');
  await page.reload();await ready(page);assert(await page.locator('[data-theme=night]').getAttribute('aria-pressed')==='true'&&await page.locator('#speedSelect').inputValue()==='0.8','Lighting and pace survive reload');assert(await page.locator('#soundButton').getAttribute('aria-pressed')==='false','Reload never autoplays sound');
  await page.locator('.intro .miniature').click();await ready(page);await page.locator('#enterButton').click();await page.locator('#bloomButton').click();assert((await page.locator('#progressText').textContent()).startsWith('1 of 6'),'Original miniature remains independently playable');
  await page.locator('#returnLink').click();await page.waitForFunction(()=>document.querySelector('.cpd-form')&&document.getElementById('learningWorkspace').getAttribute('aria-busy')==='false');await page.waitForTimeout(350);
  assert(await page.locator('.cpd-form [name=title]').inputValue()==='Fictional walking navigation check','Returning preserves the unsaved CPD draft');assert(Math.abs(await page.evaluate(()=>scrollY)-returnData.y)<5,'Returning restores learning scroll position');
  assert(errors.length===0,`No desktop runtime or shader errors: ${errors.join('; ')}`);
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  try{const p=await mobile.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(`${base}/garden/`);await ready(p);await p.screenshot({path:'output/playwright/walk-mobile-intro.png'});await p.locator('#enterButton').click();assert(await p.locator('#touchControls').isVisible(),'Phone offers touch walking controls');const box=await p.locator('[data-move=forward]').boundingBox();before=await position(p);await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.waitForTimeout(900);await p.mouse.up();await p.waitForTimeout(250);assert(distance(before,await position(p))>.2,'Holding a touch arrow walks; releasing stops');
   await p.locator('#mapButton').click();await p.locator('[data-place="2"]').click();await p.waitForTimeout(300);await p.screenshot({path:'output/playwright/walk-mobile-pond.png'});
   for(const [width,height]of[[390,844],[320,740],[844,390]]){await p.setViewportSize({width,height});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}×${height}: no horizontal overflow`);const b=await p.locator('#guideButton').boundingBox();assert(b.y+b.height<height,`${width}×${height}: walking control remains visible`);}
   await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await ready(p);assert(await p.locator('#motionButton').getAttribute('aria-pressed')==='true','Device reduced-motion preference starts Still mode');
  }finally{await mobile.close();}
  const blocked=await browser.newContext();try{await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});const p=await blocked.newPage();await p.goto(`${base}/garden/`);await ready(p);await p.locator('#enterButton').click();await p.locator('[data-theme=day]').click();assert((await p.locator('#status').textContent()).includes('Saving is unavailable'),'Blocked storage leaves the garden usable');}finally{await blocked.close();}
  const unsupported=await browser.newContext();try{await unsupported.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args);};});const p=await unsupported.newPage();await p.goto(`${base}/garden/`);await p.locator('#fallback').waitFor();assert(await p.locator('#fallbackReturn').isVisible(),'Unavailable WebGL has an accessible fallback');}finally{await unsupported.close();}
  assert(errors.length===0,`No mobile runtime errors: ${errors.join('; ')}`);return {passed:checks.length,checks};
 }finally{await context.close();}
}
