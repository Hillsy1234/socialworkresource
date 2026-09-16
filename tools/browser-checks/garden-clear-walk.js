async browserPage=>{
 const checks=[],errors=[],assert=(ok,m)=>{if(!ok)throw Error(m);checks.push(m);};
 for(const mobile of[false,true]){
  const context=await browserPage.context().browser().newContext({viewport:mobile?{width:390,height:844}:{width:1360,height:900},isMobile:mobile,hasTouch:mobile});
  try{
   const p=await context.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
   await p.goto(browserPage.url().split('/').slice(0,3).join('/')+'/garden/');await p.waitForSelector('body[data-garden-ready=true]');await p.locator('#enterButton').click();
   const position=()=>p.locator('#mapDot').evaluate(el=>[Number(el.getAttribute('cx')),Number(el.getAttribute('cy'))]);
   const moved=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])>.15;
   assert(await p.locator('#quietHint').isVisible()&&(await p.locator('#quietHint').innerText()).includes('guided walk continues'),'Visible instructions explain continued walking and how to return');
   await p.locator('#guideButton').click();await p.locator('#quietButton').click();
   assert((await p.locator('#status').innerText()).includes('Hold the arrows'),'Entering clear view announces its behaviour');
   const a=await position();await p.waitForTimeout(800);assert(moved(a,await position()),'Guided camera keeps travelling while controls are hidden');
   assert(await p.locator('#walkHud').evaluate(el=>el.inert)&&await p.locator('body').evaluate(el=>el.classList.contains('quiet-view')),'Hidden controls are also removed from keyboard interaction');
   if(!mobile){await p.mouse.move(650,420);assert(await p.locator('body').evaluate(el=>el.classList.contains('quiet-view')),'Mouse movement leaves the garden clear');}
   await p.screenshot({path:`output/playwright/clear-walk-${mobile?'mobile':'desktop'}.png`});
   if(mobile)await p.touchscreen.tap(180,400);else await p.mouse.click(650,420);
   assert(!await p.locator('body').evaluate(el=>el.classList.contains('quiet-view'))&&await p.locator('#guideButton').getAttribute('aria-pressed')==='true','A restoring tap shows controls without interrupting the guided walk');
   await p.locator('#quietButton').click();await p.keyboard.press('Escape');
   assert(await p.locator('#guideButton').getAttribute('aria-pressed')==='false'&&await p.locator('#quietButton').evaluate(el=>document.activeElement===el),'Escape restores focus and pauses the walk');
   await p.waitForTimeout(300);const paused=await position();await p.waitForTimeout(500);assert(!moved(paused,await position()),'Escape leaves the camera stationary');
   await p.locator('#quietButton').click();
   assert(await p.locator('#quietWalk').isVisible()&&!await p.locator('#quietWalk').evaluate(el=>el.closest('[inert]')),'Walking pad stays visible and interactive in clear view');
   const arrow=await p.locator('#quietWalk [data-quiet-move=forward]').boundingBox();
   const beforePad=await position();await p.mouse.move(arrow.x+arrow.width/2,arrow.y+arrow.height/2);await p.mouse.down();await p.waitForTimeout(900);await p.mouse.up();await p.waitForTimeout(300);
   assert(moved(beforePad,await position())&&await p.locator('body').evaluate(el=>el.classList.contains('quiet-view')),'Holding the on-screen arrow walks without restoring the panels');
   const released=await position();await p.waitForTimeout(450);assert(!moved(released,await position()),'Releasing the clear-screen arrow stops walking');
   const beforeKey=await position();await p.keyboard.down('ArrowDown');await p.waitForTimeout(650);await p.keyboard.up('ArrowDown');await p.waitForTimeout(300);
   assert(moved(beforeKey,await position())&&await p.locator('body').evaluate(el=>el.classList.contains('quiet-view')),'Keyboard arrows walk while the screen stays clear');
   await p.keyboard.down('KeyQ');await p.waitForTimeout(250);await p.keyboard.up('KeyQ');assert(await p.locator('body').evaluate(el=>el.classList.contains('quiet-view')),'Keyboard turning keeps the screen clear');
   await p.mouse.move(mobile?180:650,400);await p.mouse.down();await p.mouse.move(mobile?250:730,430,{steps:8});await p.mouse.up();
   assert(await p.locator('body').evaluate(el=>el.classList.contains('quiet-view')),'Dragging the view leaves the panels hidden');
   await p.screenshot({path:`output/playwright/clear-walk-pad-${mobile?'mobile':'desktop'}.png`});
   const pad=await p.locator('#quietWalk').boundingBox(),restore=await p.locator('#showControls').boundingBox();
   assert(pad.x+pad.width<=restore.x||restore.x+restore.width<=pad.x||pad.y+pad.height<=restore.y||restore.y+restore.height<=pad.y,'Walking pad and Show controls do not overlap');
   if(mobile)await p.touchscreen.tap(180,400);else await p.mouse.click(650,420);
   assert(await p.locator('#walkHud').isVisible()&&!await p.locator('#quietWalk').isVisible(),'A tap elsewhere restores panels and hides the extra pad');
   await p.locator('#breakButton').click();await p.locator('#quietButton').click();
   const start=await position();await p.waitForTimeout(750);assert(moved(start,await position())&&(await p.locator('#breakButton').textContent()).includes('End garden break'),'Two-minute break continues in clear view: '+JSON.stringify({start,end:await position(),label:await p.locator('#breakButton').textContent(),guided:await p.locator('#guideButton').getAttribute('aria-pressed')}));
   await p.locator('#showControls').click();assert(await p.locator('#guideButton').getAttribute('aria-pressed')==='true','Show controls button preserves a running break');
   await p.locator('#pauseButton').click();await p.locator('#motionButton').click();await p.locator('#quietButton').click();
   assert((await p.locator('#status').innerText()).startsWith('Controls hidden.'),'Stationary visits receive an accurate message');
   assert(!await p.locator('#quietWalk').isVisible(),'Still mode hides the walking pad');
   const still=await position();await p.waitForTimeout(450);assert(!moved(still,await position()),'Clearing the screen never starts motion in Still mode');
   await p.keyboard.press('Escape');assert(await p.locator('#guideButton').isDisabled(),'Still mode remains active after controls return');
  }finally{await context.close();}
 }
 assert(errors.length===0,'No runtime errors: '+errors.join('; '));return{passed:checks.length,checks};
}
