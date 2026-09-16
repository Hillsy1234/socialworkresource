async browserPage => {
 const context=await browserPage.context().browser().newContext({viewport:{width:1360,height:900}}),checks=[],errors=[],requests=[];
 const assert=(ok,message)=>{if(!ok)throw Error(message);checks.push(message);};
 try{
  await context.addInitScript(()=>{
   window.gardenInspect={frames:[],panners:[]};window.__THREE_DEVTOOLS__=new EventTarget();
   __THREE_DEVTOOLS__.addEventListener('observe',event=>{const value=event.detail;
    if(value.isScene)gardenInspect.scene=value;
    if(typeof value.render==='function'){const render=value.render.bind(value);let depth=0;
     value.render=(scene,camera)=>{if(!depth){gardenInspect.camera=camera;const stone=scene.getObjectByName('Thrown pebble'),hand=scene.getObjectByName('First person pebble hand');if(stone?.visible||hand?.visible){gardenInspect.frames.push({stone:stone.visible,p:stone.position.toArray(),hand:!!hand?.visible,waves:scene.children.find(n=>n.userData.placeIndex===2)?.material.uniforms.pondWaves.value.map(v=>v.toArray())});if(gardenInspect.frames.length>300)gardenInspect.frames.shift();}}depth++;try{return render(scene,camera);}finally{depth--;}};
    }
   });
   const create=BaseAudioContext.prototype.createPanner;BaseAudioContext.prototype.createPanner=function(...args){const n=create.apply(this,args);gardenInspect.panners.push(n);return n;};
  });
  const p=await context.newPage();p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>requests.push(r.url()));
  const base=browserPage.url().split('/').slice(0,3).join('/');
  await p.goto(base+'/garden/');await p.waitForSelector('body[data-garden-ready=true]');await p.locator('#enterButton').click();
  assert(await p.locator('#pebbleButton').isHidden(),'Pebble prompt stays hidden away from the pond');
  const pond=async()=>{await p.locator('#mapButton').click();await p.locator('[data-place="2"]').click();};
  await pond();await p.locator('#pebbleButton').waitFor({state:'visible'});
  await p.locator('#pebbleButton').click();
  assert(await p.locator('#pebbleThrow').isEnabled(),'Bridge has a reachable default throw for keyboard users');
  await p.screenshot({path:'output/playwright/pebble-aim.png'});
  const before=await p.evaluate(()=>gardenInspect.frames.filter(f=>f.stone).length);
  await p.mouse.move(1100,420);await p.mouse.down();await p.mouse.move(1150,425,{steps:4});await p.mouse.up();
  assert(await p.evaluate(()=>gardenInspect.frames.filter(f=>f.stone).length)===before,'Dragging the view never launches a pebble');
  await p.keyboard.press('Escape');assert(await p.locator('#pebbleAim').isHidden(),'Escape puts the pebble down');
  await pond();await p.locator('#pebbleButton').click();await p.keyboard.press('Escape');assert(await p.evaluate(()=>document.activeElement.id==='pebbleButton'),'Keyboard cancellation returns focus to Toss a pebble');await p.locator('#pebbleButton').click();await p.locator('#pebbleThrow').click();
  await p.waitForFunction(()=>gardenInspect.scene.getObjectByName('Thrown pebble').visible);
  await p.screenshot({path:'output/playwright/pebble-flight.png'});
  await p.waitForFunction(()=>document.getElementById('status').textContent.includes('small splash'));
  await p.screenshot({path:'output/playwright/pebble-ripples.png'});
  const result=await p.evaluate(()=>{
   const frames=gardenInspect.frames,air=frames.filter(f=>f.stone&&f.p[1]>0),surface=gardenInspect.scene.children.find(n=>n.userData.placeIndex===2),hand=gardenInspect.scene.getObjectByName('First person pebble hand');
   return {air:air.length,hand:frames.some(f=>f.hand),below:frames.some(f=>f.stone&&f.p[1]<-.2),reflect:gardenInspect.scene.children.some(n=>n.isReflector&&n.material.fragmentShader.includes('pondSlope(pondWorld.xz)')),waves:surface.material.uniforms.pondWaves.value.some(w=>w.w>.02),noHand:!hand,shaded:(()=>{const s=gardenInspect.scene.getObjectByName('Thrown pebble');return s.material.isMeshStandardMaterial&&!!s.material.map&&!!s.material.bumpMap&&s.castShadow;})()};
  });
  assert(result.air>1&&!result.hand,'Pebble rises into flight without a hand overlay');
  assert(result.reflect&&result.waves,'Impact waves drive distortion in the actual reflected water');
  assert(result.noHand&&result.shaded,'Hand is absent and the pebble uses textured, lit stone shading');
  await p.waitForFunction(()=>!gardenInspect.scene.getObjectByName('Thrown pebble').visible);
  assert(await p.evaluate(()=>gardenInspect.frames.some(f=>f.stone&&f.p[1]<-.2)),'Pebble sinks below the surface before being recycled');
  assert(!requests.some(u=>u.includes('/garden-audio/')),'Throwing stays silent without audio opt-in');
  await pond();await p.locator('#sitButton').click();await p.locator('#pebbleButton').click();
  assert(await p.locator('#pebbleThrow').isEnabled(),'Pond bench has a valid seated throw');
  await p.evaluate(()=>gardenInspect.frames=[]);await p.locator('#pebbleThrow').click();await p.waitForFunction(()=>document.getElementById('status').textContent.includes('small splash'));
  assert(await p.evaluate(()=>gardenInspect.frames.some(f=>f.stone)&&!gardenInspect.frames.some(f=>f.hand)),'A seated throw rises from the lower viewpoint without an avatar');
  await p.locator('#motionButton').click();
  assert(await p.locator('#pebbleButton').isHidden(),'Still mode hides the tossing prompt');
  assert(await p.evaluate(()=>!gardenInspect.scene.getObjectByName('Thrown pebble').visible),'Still mode clears an active pebble');
  const a=await p.locator('#world canvas').screenshot();await p.waitForTimeout(400);const b=await p.locator('#world canvas').screenshot();assert(a.equals(b),'Still mode freezes the water after a throw');
  await p.reload();await p.waitForSelector('body[data-garden-ready=true]');assert(await p.locator('#pebbleHand').count()===0,'Obsolete hand setting is removed');
  await p.locator('#enterButton').click();await p.locator('#motionButton').click();await pond();
  await p.locator('#soundButton').click();const initialPanners=await p.evaluate(()=>gardenInspect.panners.length);
  await p.locator('#pebbleButton').click();await p.locator('#pebbleThrow').click();await p.waitForFunction(()=>document.getElementById('status').textContent.includes('small splash'));
  assert(await p.evaluate(n=>gardenInspect.panners.slice(n).some(p=>Math.abs(p.positionY.value+.186)<.05),initialPanners),'Splash sound is positioned at the water impact');
  assert(errors.length===0,'No runtime or shader errors: '+errors.join('; '));
  return {passed:checks.length,checks};
 }finally{await context.close();}
}
