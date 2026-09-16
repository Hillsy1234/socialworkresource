async browserPage => {
 const context=await browserPage.context().browser().newContext({viewport:{width:1440,height:960}}),checks=[],errors=[];
 const assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 await context.addInitScript(()=>{window.gardenInspect={};window.__THREE_DEVTOOLS__=new EventTarget();__THREE_DEVTOOLS__.addEventListener('observe',e=>{const v=e.detail;if(v.isScene)gardenInspect.scene=v;if(typeof v.render==='function'){gardenInspect.renderer=v;const render=v.render.bind(v);let depth=0;v.render=(s,c)=>{if(!depth)gardenInspect.camera=c;depth++;try{return render(s,c);}finally{depth--;}};}});});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const position=()=>page.evaluate(()=>gardenInspect.camera.position.toArray());
 try{
 await page.goto('http://127.0.0.1:8766/garden/');await page.waitForSelector('body[data-garden-ready=true]');await page.locator('#enterButton').click();await page.locator('#lookoutButton').click();await page.locator('#speedSelect').selectOption('1.8');await page.locator('[data-theme=day]').click();
 const base=await position();assert(await page.evaluate(()=>!!gardenInspect.scene.getObjectByName('Woodland lookout tower')),'Tower geometry exists in the built scene');
 assert(await page.locator('[data-place]').count()===10,'Map retains nine places and adds the lookout');
 await page.locator('#climbLookout').click();await page.waitForTimeout(2200);const midway=await position();assert(midway[1]>base[1]+.35,'Guided climb ascends actual stairs');await page.locator('#pauseButton').click();await page.waitForTimeout(400);assert(Math.hypot(...(await position()).map((v,i)=>v-midway[i]))<.2,'Pause stops the stair journey');
 await page.locator('#climbLookout').click();await page.waitForFunction(y=>gardenInspect.camera.position.y>y+7.99&&document.getElementById('pauseButton').disabled,base[1],{timeout:55000});
 const top=await position();assert(Math.abs(top[1]-base[1]-8)<.02,'Guided climb finishes on the eight-metre viewing deck');
 await page.screenshot({path:'output/playwright/lookout-top.png'});
 await page.keyboard.down('w');await page.waitForTimeout(4500);await page.keyboard.up('w');const edge=await position();assert(Math.abs(edge[1]-top[1])<.02,'Free walking at the viewing rail cannot fall to ground level');
 await page.locator('#descendLookout').click();await page.waitForFunction(y=>Math.abs(gardenInspect.camera.position.y-y)<.02&&document.getElementById('pauseButton').disabled,base[1],{timeout:55000});assert(true,'Guided descent returns to the entrance');
 await page.keyboard.down('w');await page.waitForTimeout(1800);await page.keyboard.up('w');assert((await position())[1]>base[1]+.3,'Manual walking climbs the first stair flight');
 await page.locator('#motionButton').click();assert(await page.locator('#climbLookout').isDisabled(),'Still mode disables stair animation immediately');await page.locator('#viewLookout').click();assert(Math.abs((await position())[1]-top[1])<.02,'Still mode offers an instant top visit');await page.locator('#descendLookout').click();assert(Math.abs((await position())[1]-base[1])<.02,'Still mode returns directly to the entrance');
 await page.locator('#motionButton').click();await page.locator('#climbLookout').click();await page.locator('#quietButton').click();const quietStart=await position();await page.waitForTimeout(1300);assert((await position())[1]>quietStart[1]+.15,'Clear screen continues the guided climb');await page.keyboard.press('Escape');assert(await page.locator('#walkHud').isVisible()&&await page.locator('#pauseButton').isDisabled(),'Escape restores controls and pauses the climb');
 await page.locator('#helpButton').click();assert(await page.getByText('How do I visit the woodland lookout?',{exact:true}).isVisible(),'FAQ explains the tower controls');await page.locator('#doneHelp').click();
 assert(errors.length===0,`No runtime or shader errors: ${errors.join('; ')}`);
 return {checks};
 }finally{await context.close();}
}
