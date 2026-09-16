async browserPage=>{
 const checks=[],errors=[],assert=(ok,m)=>{if(!ok)throw Error(m);checks.push(m);};
 for(const viewport of[{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
  const c=await browserPage.context().browser().newContext({viewport,isMobile:true,hasTouch:true});
  try{
   await c.addInitScript(()=>{window.gardenInspect={};window.__THREE_DEVTOOLS__=new EventTarget();__THREE_DEVTOOLS__.addEventListener('observe',e=>{const v=e.detail;if(v.isScene)gardenInspect.scene=v;if(typeof v.render==='function'){const render=v.render.bind(v);let depth=0;v.render=(s,c)=>{if(!depth)gardenInspect.camera=c;depth++;try{return render(s,c);}finally{depth--;}};}});});
   const p=await c.newPage();p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await p.goto(browserPage.url().split('/').slice(0,3).join('/')+'/garden/');await p.waitForSelector('body[data-garden-ready=true]');await p.locator('#enterButton').click();await p.locator('#mapButton').click();await p.locator('[data-place="2"]').click();await p.locator('#pebbleButton').click();
   assert(await p.locator('#pebbleThrow').isEnabled(),`${viewport.width}px: a reachable toss is available`);
   const rect=await p.locator('#pebbleThrow').boundingBox();assert(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=viewport.width&&rect.y+rect.height<=viewport.height,`${viewport.width}px: toss controls fit the viewport`);
   assert(await p.locator('#pebbleThrow').evaluate(el=>el.contains(document.elementFromPoint(el.getBoundingClientRect().x+10,el.getBoundingClientRect().y+10))),`${viewport.width}px: toss control is not covered`);
   assert(await p.locator('#walkHud').evaluate(el=>el.inert),'Aiming clears the walking panel from view and keyboard focus');
   await p.screenshot({path:`output/playwright/pebble-mobile-${viewport.width}.png`});
   if(viewport.width===390){
    const target=await p.evaluate(()=>{const camera=gardenInspect.camera,point=camera.position.clone().set(7,-.186,6),screen=point.project(camera);return{x:(screen.x+1)/2*innerWidth,y:(1-screen.y)/2*innerHeight};});
    await p.touchscreen.tap(target.x,target.y);await p.waitForFunction(()=>document.getElementById('status').textContent.includes('small splash'));
    assert(await p.evaluate(()=>gardenInspect.scene.children.some(n=>n.name==='Touch ripple'&&Math.abs(n.userData.origin.x-7)<.2&&Math.abs(n.userData.origin.z-6)<.2)),'Touch-selected pond point becomes the actual ripple origin');
    await p.waitForFunction(()=>!gardenInspect.scene.getObjectByName('Thrown pebble').visible);
    await p.locator('#pebbleButton').click();await p.locator('#motionButton').click();assert(await p.locator('#pebbleAim').isHidden()&&await p.locator('#pebbleButton').isHidden(),'Still mode cancels touch aiming');
   }else{await p.locator('#pebbleThrow').click();await p.waitForFunction(()=>document.getElementById('status').textContent.includes('small splash'));checks.push(`${viewport.width}px: mobile button completes a throw`);}
  }finally{await c.close();}
 }
 assert(errors.length===0,'Mobile has no runtime or shader errors: '+errors.join('; '));return {passed:checks.length,checks};
}
