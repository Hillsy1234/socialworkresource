async browserPage=>{
 const checks=[],errors=[];
 for(const size of [{width:390,height:844},{width:320,height:700},{width:844,height:390}]){
 const context=await browserPage.context().browser().newContext({viewport:size,isMobile:true,hasTouch:true});try{
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8766/garden/');await p.waitForSelector('body[data-garden-ready=true]');await p.locator('#enterButton').click();await p.locator('#lookoutButton').click();await p.locator('#viewLookout').click();await p.locator('#ziplineButton').click();await p.locator('#startZip').click();await p.waitForTimeout(650);await p.locator('#pauseZip').click();await p.waitForTimeout(250);
 if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+size.width);
 const panel=await p.locator('#zipRidePanel').boundingBox(),footer=await p.locator('#bottomDock').boundingBox();if(panel.y+panel.height>footer.y)throw Error('Ride panel overlaps footer '+size.width);
 await p.screenshot({path:`output/playwright/zipline-mobile-${size.width}.png`});await p.locator('#clearZip').click();if(await p.locator('#quietWalk').isVisible())throw Error('Walking pad visible in ride');await p.touchscreen.tap(size.width*.65,size.height*.45);if(!await p.locator('#pauseZip').isVisible())throw Error('Tap did not restore ride');await p.locator('#finishZip').click();if(!await p.locator('#returnZipTower').isVisible())throw Error('Instant landing failed');checks.push(`${size.width}×${size.height}: ride controls, clear view, tap restore and instant landing`);
 }finally{await context.close();}}
 if(errors.length)throw Error(errors.join('; '));return {checks};
}