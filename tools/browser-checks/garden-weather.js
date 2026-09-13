async browserPage => {
 const context=await browserPage.context().browser().newContext({viewport:{width:1280,height:850}}),checks=[],errors=[],requests=[];
 const assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 try{
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>requests.push(r.url()));
 await p.goto('http://127.0.0.1:8766/garden/');await p.bringToFront();await p.waitForSelector('body[data-garden-ready=true]');
 await p.locator('#weatherButton').click();assert(await p.locator('#weatherPanel').isVisible(),'Weather controls open independently of lighting');assert(await p.locator('[data-weather=clear]').getAttribute('aria-pressed')==='true','Fresh visits start with clear skies');
 await p.locator('[data-weather=rain]').click();assert((await p.locator('#weatherStatus').textContent()).includes('Changing to'),'Manual changes announce a gradual transition');await p.waitForFunction(()=>document.getElementById('weatherStatus').textContent==='Light rain',{},{timeout:15000});assert(true,'Rain settles after the transition');
 assert(await p.locator('[data-theme=sunset]').getAttribute('aria-pressed')==='true','Weather selection preserves time of day');assert(!requests.some(url=>url.includes('garden-audio/')),'Weather does not enable sound or fetch recordings');
 await p.locator('#weatherAuto').check();await p.locator('#closeWeather').click();await p.locator('[data-theme=night]').click();await p.reload();await p.waitForSelector('body[data-garden-ready=true]');await p.locator('#weatherButton').click();assert(await p.locator('[data-weather=rain]').getAttribute('aria-pressed')==='true'&&await p.locator('#weatherAuto').isChecked(),'Weather and automatic preference survive reload');assert(await p.locator('[data-theme=night]').getAttribute('aria-pressed')==='true','Evening lighting remains independent');
 await p.locator('#motionButton').click();assert(await p.locator('#weatherAuto').isDisabled(),'Still mode pauses automatic weather controls');
 for(const kind of['mist','cloud','clear','rain']){await p.locator(`[data-weather=${kind}]`).click();assert(await p.locator(`[data-weather=${kind}]`).getAttribute('aria-pressed')==='true',`Still mode allows an instant ${kind} selection`);}
 await p.locator('#closeWeather').click();await p.waitForTimeout(350);const first=await p.locator('#world canvas').screenshot();await p.waitForTimeout(450);const second=await p.locator('#world canvas').screenshot();assert(first.equals(second),'Still mode freezes the rendered rain and scenery');
 await p.locator('#enterButton').click();await p.locator('#weatherButton').click();await p.keyboard.press('Escape');assert(await p.locator('#weatherPanel').isHidden(),'Escape closes weather controls');
 await p.locator('#nextButton').click();assert(await p.locator('#placeName').textContent()==='The wildflower border','Instant garden navigation remains usable');
 await p.locator('#weatherButton').click();await p.locator('[data-weather=mist]').click();
 for(const [width,height]of[[390,844],[320,740],[844,390]]){await p.setViewportSize({width,height});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}×${height}: weather has no horizontal overflow`);await p.locator('[data-weather=rain]').scrollIntoViewIfNeeded();assert(await p.locator('[data-weather=rain]').isVisible(),`${width}×${height}: weather choices remain accessible`);}
 await p.setViewportSize({width:390,height:844});await p.locator('[data-weather=mist]').click();await p.screenshot({path:'output/playwright/garden-mist-mobile.png'});
 assert(errors.length===0,`No runtime or weather shader errors: ${errors.join('; ')}`);return {passed:checks.length,checks};
 }finally{await context.close();}
}
