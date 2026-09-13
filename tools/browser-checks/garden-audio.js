async browserPage => {
 const context=await browserPage.context().browser().newContext({viewport:{width:1280,height:850}}),checks=[],errors=[];
 const assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 try{
  await context.addInitScript(()=>{
   window.audioChecks={requests:[],starts:[],decoded:[],contexts:[]};const names=new WeakMap(),originalFetch=window.fetch;
   window.fetch=async(...args)=>{const response=await originalFetch(...args);const url=String(args[0]);if(url.includes('/assets/garden-audio/')){window.audioChecks.requests.push(url);const arrayBuffer=response.arrayBuffer.bind(response);response.arrayBuffer=async()=>{const data=await arrayBuffer();names.set(data,url.split('/').pop());return data;};}return response;};
   const decode=BaseAudioContext.prototype.decodeAudioData;BaseAudioContext.prototype.decodeAudioData=function(data,...rest){return decode.call(this,data,...rest).then(buffer=>{const name=names.get(data);if(name){names.set(buffer,name);window.audioChecks.decoded.push({name,duration:buffer.duration});}return buffer;});};
   const create=BaseAudioContext.prototype.createBufferSource;BaseAudioContext.prototype.createBufferSource=function(){if(!window.audioChecks.contexts.includes(this))window.audioChecks.contexts.push(this);const source=create.call(this),start=source.start.bind(source);source.start=(...args)=>{window.audioChecks.starts.push({name:names.get(source.buffer)||'ambient',at:performance.now(),rate:source.playbackRate.value});return start(...args);};return source;};
  });
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8766/garden/');await p.waitForSelector('body[data-garden-ready=true]');
  assert(await p.evaluate(()=>audioChecks.requests.length)===0,'No sound files load before explicit opt-in');
  await p.locator('#enterButton').click();await p.locator('#soundButton').click();await p.waitForFunction(()=>!document.getElementById('soundButton').disabled);
  assert(await p.evaluate(()=>audioChecks.decoded.length)===17,'All 17 local recordings decode successfully');
  let start=await p.evaluate(()=>audioChecks.starts.length);await p.waitForTimeout(700);assert(await p.evaluate(i=>audioChecks.starts.slice(i).every(s=>!s.name.startsWith('gravel')),start),'Standing still produces no footsteps');
  await p.locator('#guideButton').click();await p.waitForTimeout(2200);await p.locator('#pauseButton').click();
  const gravel=await p.evaluate(()=>audioChecks.starts.filter(s=>s.name.startsWith('gravel')));assert(gravel.length>=2,'Guided walking plays recorded gravel steps');assert(gravel.every((s,i)=>!i||s.name!==gravel[i-1].name),'Consecutive steps use different recordings');
  start=await p.evaluate(()=>audioChecks.starts.length);await p.waitForTimeout(700);assert(await p.evaluate(i=>audioChecks.starts.slice(i).every(s=>!s.name.startsWith('gravel')),start),'Pause stops new footfalls');
  await p.locator('#mapButton').click();await p.locator('[data-place="2"]').click();await p.locator('#guideButton').click();await p.waitForTimeout(1300);await p.locator('#pauseButton').click();assert(await p.evaluate(()=>audioChecks.starts.some(s=>s.name.startsWith('wood'))),'Bridge changes footfalls to timber recordings');
  await p.locator('#interactButton').click();assert(await p.evaluate(()=>audioChecks.starts.some(s=>s.name.startsWith('splash'))),'Pond interaction plays a recorded splash');
  await p.locator('#mapButton').click();await p.locator('[data-place="1"]').click();await p.locator('#interactButton').click();assert(await p.evaluate(()=>audioChecks.starts.some(s=>s.name.startsWith('grass'))),'Flower interaction adds a soft recorded rustle');
  await p.locator('#motionButton').click();start=await p.evaluate(()=>audioChecks.starts.length);await p.keyboard.down('w');await p.waitForTimeout(600);await p.keyboard.up('w');assert(await p.evaluate(i=>audioChecks.starts.slice(i).every(s=>!/^(gravel|wood|grass)-/.test(s.name)),start),'Still mode produces no movement effects');
  await p.locator('#soundButton').click();assert(await p.evaluate(()=>audioChecks.contexts.every(c=>c.state==='suspended')),'Mute suspends the audio engine');start=await p.evaluate(()=>audioChecks.starts.length);await p.locator('#interactButton').click();assert(await p.evaluate(()=>audioChecks.starts.length)===start,'Muted interactions create no sounds');
  await p.locator('#soundButton').click();await p.waitForFunction(()=>!document.getElementById('soundButton').disabled);assert(await p.evaluate(()=>audioChecks.requests.length)===17,'Unmuting reuses decoded recordings');assert(await p.evaluate(i=>audioChecks.starts.slice(i).every(s=>!/^(gravel|wood|grass|splash)-/.test(s.name)),start),'Unmuting does not replay stale effects');
  await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.waitForFunction(()=>audioChecks.contexts.every(c=>c.state==='suspended'));assert(true,'Leaving the window pauses audio');
  assert(errors.length===0,`No runtime errors: ${errors.join('; ')}`);
  return {passed:checks.length,checks,clips:await p.evaluate(()=>audioChecks.decoded)};
 }finally{await context.close();}
}
