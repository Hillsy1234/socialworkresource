import {SOUND_LAYERS} from './immersion-state.mjs';
// Recorded foley layers over the optional synthesised outdoor ambience.
// Assets are local, CC0, and fetched only after the visitor enables Sound.
const GROUPS={gravel:5,wood:4,grass:4,splash:3,'water-lap':1,'woodland-birds':1,'meadow-wind':1};
export function gardenAudio({onNotice=()=>{},natureVolume=1,footstepsVolume=1,layers={}}={}){
 let context,master,natureBus,movementBus,waterBus,enabled=false,loading,timer,ambientSource,rainSource,rainGain,ambientGain;
 const natureLoops=new Map(), layerGains={};
 const mix=Object.fromEntries(SOUND_LAYERS.map(key=>[key,Number.isFinite(layers[key])?layers[key]:1]));
 let roofGain,roofSource,roofPan,streamGain,streamSource,streamPan,sheltered=0;
 function position(node,p){for(const [axis,key]of[['X','x'],['Y','y'],['Z','z']])node['position'+axis].setTargetAtTime(p[key],context.currentTime,.08);}
 function spatial(p){const node=context.createPanner();node.panningModel='HRTF';node.distanceModel='inverse';node.refDistance=3;node.maxDistance=50;node.rolloffFactor=1.2;for(const axis of ['x','y','z'])node['position'+axis.toUpperCase()].setValueAtTime(p[axis],context.currentTime);return node;}

 let stride=.48,rustleDistance=0,foot=1,lastStep=-10,lastSplash=-10,waterCountdown=2;
 let waterProximity=0,waterPan=0,rainAmount=0;
 const buffers=new Map(),previous=new Map(),voices=new Set();
 const random=(a,b)=>a+(b-a)*Math.random();
 const ready=()=>enabled&&context?.state==='running';
 function scheduleBird(){clearTimeout(timer);}
 function bird(point){if(!ready()||rainAmount>.6||voices.size>9)return;const now=context.currentTime,base=random(1900,2350);for(let i=0;i<3;i++){
  const osc=context.createOscillator(),gain=context.createGain(),panner=spatial(point);
  osc.type='sine';osc.frequency.setValueAtTime(base+i*80,now+i*.17);osc.frequency.exponentialRampToValueAtTime(base*1.4,now+i*.17+.06);osc.frequency.exponentialRampToValueAtTime(base*.9,now+i*.17+.13);
  gain.gain.setValueAtTime(0,now+i*.17);gain.gain.linearRampToValueAtTime(.035,now+i*.17+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.17+.15);
  osc.connect(gain);gain.connect(panner);panner.connect(layerGains.birdsVolume);track({source:osc,gain,nodes:[osc,gain,panner],kind:'bird'});osc.start(now+i*.17);osc.stop(now+i*.17+.17);
 }}
 function track(voice){voices.add(voice);voice.source.onended=()=>{voice.nodes.forEach(n=>n.disconnect());voices.delete(voice);};}
 function clearVoices(kind,immediate=false){for(const v of voices){if(kind&&v.kind!==kind)continue;if(immediate){try{v.source.stop();}catch{}v.nodes.forEach(n=>n.disconnect());voices.delete(v);continue;}v.gain.gain.cancelScheduledValues(context.currentTime);v.gain.gain.setTargetAtTime(0,context.currentTime,.012);try{v.source.stop(context.currentTime+.055);}catch{}if(context.state!=='running'){v.nodes.forEach(n=>n.disconnect());voices.delete(v);}}}
 function choose(group){const available=buffers.get(group)||[];if(!available.length)return null;let index=Math.floor(Math.random()*available.length);if(available.length>1&&index===previous.get(group))index=(index+1)%available.length;previous.set(group,index);return available[index];}
 function play(group,{volume=.2,pan=0,rate=1,highpass=70,lowpass=10000,kind='effect',point=null}={}){
  if(!ready())return;const buffer=choose(group);if(!buffer||voices.size>=12)return;
  const source=context.createBufferSource(),gain=context.createGain(),hp=context.createBiquadFilter(),lp=context.createBiquadFilter(),stereo=point?spatial(point):context.createStereoPanner();
  source.buffer=buffer;source.playbackRate.value=rate;hp.type='highpass';hp.frequency.value=highpass;lp.type='lowpass';lp.frequency.value=lowpass;if(!point)stereo.pan.value=pan;
  const now=context.currentTime,duration=buffer.duration/rate;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.setValueAtTime(volume,now+Math.max(.01,duration-.045));gain.gain.linearRampToValueAtTime(0,now+duration);
  source.connect(hp);hp.connect(lp);lp.connect(gain);gain.connect(stereo);stereo.connect(kind==='water'?waterBus:kind==='movement'?movementBus:layerGains.waterVolume);track({source,gain,stereo,nodes:[source,hp,lp,gain,stereo],kind});source.start();source.stop(now+duration+.015);
 }
 async function load(){const results=await Promise.allSettled(Object.entries(GROUPS).flatMap(([group,count])=>Array.from({length:count},async(_,i)=>{
  const name=count===1?group:`${group}-${i+1}`,response=await fetch(`/assets/garden-audio/${name}.mp3`,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Audio file unavailable');
  const buffer=await context.decodeAudioData(await response.arrayBuffer());if(!buffers.has(group))buffers.set(group,[]);buffers.get(group).push(buffer);
 })));startNatureLoops();if(results.some(r=>r.status==='rejected'))onNotice('Some sound effects couldn’t load. Available sounds will still play; toggle Sound to retry.');}
 function startNatureLoops(){for(const group of['woodland-birds','meadow-wind']){if(natureLoops.has(group)||!buffers.get(group)?.length)continue;const source=context.createBufferSource(),gain=context.createGain(),pan=context.createStereoPanner();source.buffer=buffers.get(group)[0];source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(pan);pan.connect(layerGains[group==='woodland-birds'?'birdsVolume':'windVolume']);source.start();natureLoops.set(group,{source,gain,pan});}if(natureLoops.size)ambientGain.gain.setTargetAtTime(.06,context.currentTime,1);}
 function initialize(){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');context=new Audio();master=context.createGain();master.gain.value=.55;natureBus=context.createGain();movementBus=context.createGain();natureBus.gain.value=natureVolume;movementBus.gain.value=footstepsVolume;natureBus.connect(master);movementBus.connect(master);waterBus=context.createGain();waterBus.gain.value=0;for(const key of SOUND_LAYERS){layerGains[key]=context.createGain();layerGains[key].gain.value=mix[key];layerGains[key].connect(natureBus);}waterBus.connect(layerGains.waterVolume);
  const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=15;limiter.ratio.value=3;limiter.attack.value=.01;limiter.release.value=.2;master.connect(limiter);limiter.connect(context.destination);
  const buffer=context.createBuffer(1,context.sampleRate*8,context.sampleRate),samples=buffer.getChannelData(0);let b=0;for(let i=0;i<samples.length;i++){b=(b+(Math.random()*2-1)*.025)/1.012;samples[i]=b;}
  ambientSource=context.createBufferSource();ambientSource.buffer=buffer;ambientSource.loop=true;const filter=context.createBiquadFilter(),volume=context.createGain();filter.type='lowpass';filter.frequency.value=1600;volume.gain.value=.22;ambientGain=volume;ambientSource.connect(filter);filter.connect(volume);volume.connect(layerGains.windVolume);ambientSource.start();
  // Two independent channels of filtered noise and small droplets make a quiet rain bed.
  const rainBuffer=context.createBuffer(2,context.sampleRate*10,context.sampleRate);for(let channel=0;channel<2;channel++){const samples=rainBuffer.getChannelData(channel);let low=0;for(let i=0;i<samples.length;i++){low=low*.82+(Math.random()*2-1)*.18;samples[i]=low*.32;}for(let drop=0;drop<1200;drop++){const start=Math.floor(Math.random()*(samples.length-1500)),length=350+Math.floor(Math.random()*1000);for(let j=0;j<length;j++)samples[start+j]+=(Math.random()*2-1)*.055*Math.exp(-j/(length*.18));}const fade=400;for(let i=0;i<fade;i++){samples[i]*=i/fade;samples[samples.length-1-i]*=i/fade;}}
  rainSource=context.createBufferSource();rainSource.buffer=rainBuffer;rainSource.loop=true;const rainFilter=context.createBiquadFilter();rainFilter.type='lowpass';rainFilter.frequency.value=6500;rainGain=context.createGain();rainGain.gain.value=0;rainSource.connect(rainFilter);rainFilter.connect(rainGain);rainGain.connect(layerGains.rainVolume);rainSource.start();
  const roofBuffer=context.createBuffer(1,context.sampleRate*8,context.sampleRate),roofData=roofBuffer.getChannelData(0);
  for(let d=0;d<180;d++){const start=Math.floor(Math.random()*(roofData.length-2400));for(let j=0;j<2000;j++)roofData[start+j]+=Math.sin(j*.15)*Math.exp(-j/220)*random(-.35,.35);}
  roofSource=context.createBufferSource();roofSource.buffer=roofBuffer;roofSource.loop=true;roofGain=context.createGain();roofGain.gain.value=0;roofPan=spatial({x:0,y:4,z:0});roofPan.refDistance=4;roofSource.connect(roofGain);roofGain.connect(roofPan);roofPan.connect(layerGains.rainVolume);roofSource.start();
  const streamBuffer=context.createBuffer(1,context.sampleRate*6,context.sampleRate),streamData=streamBuffer.getChannelData(0);let current=0;
  for(let i=0;i<streamData.length;i++){current=current*.65+random(-.02,.02);streamData[i]=current;}
  for(let bubble=0;bubble<160;bubble++){const start=Math.floor(Math.random()*(streamData.length-2500)),frequency=random(.04,.11);for(let j=0;j<2400;j++)streamData[start+j]+=Math.sin(j*frequency+j*j*.000003)*Math.exp(-j/400)*.045;}
  for(let i=0;i<400;i++){streamData[i]*=i/400;streamData[streamData.length-1-i]*=i/400;}
  streamSource=context.createBufferSource();streamSource.buffer=streamBuffer;streamSource.loop=true;streamSource.playbackRate.value=1.8;streamGain=context.createGain();streamGain.gain.value=.6;streamPan=spatial({x:17,y:0,z:9});streamPan.refDistance=2;streamSource.connect(streamGain);streamGain.connect(streamPan);streamPan.connect(layerGains.waterVolume);streamSource.start();
 }
 async function toggle(){if(!context)initialize();if(enabled){enabled=false;clearTimeout(timer);clearVoices(null,true);resetMotion();await context.suspend();return false;}
  await context.resume();enabled=true;resetMotion();scheduleBird();if(!loading||[...Object.entries(GROUPS)].some(([g,n])=>(buffers.get(g)?.length||0)<n)){buffers.clear();loading=load();}await loading;return enabled;
 }
 function resetMotion(){stride=.48;rustleDistance=0;clearVoices('movement');}
 function pause(){clearTimeout(timer);resetMotion();if(context){clearVoices(null,true);context.suspend().catch(()=>{});}}
 function resume(){if(enabled)context?.resume().then(scheduleBird).catch(()=>{});}
 function update({distance=0,dt=0,surface='gravel',x=0,y=1.67,z=30,yaw=0,pitch=0,still=false,rain=0,season='summer',theme='day',shelter=0,roof=null,birdCalls=[],stream=null}){
  // Distance is actual movement after collisions, never the requested key speed.
  const pondDistance=Math.hypot((x-5)/8,(z-1)/10);waterProximity=Math.max(0,Math.min(1,(2.2-pondDistance)/1.4));
  const dx=5-x,dz=1-z;waterPan=Math.max(-.7,Math.min(.7,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/(Math.hypot(dx,dz)||1)*.7));
  rainAmount=Math.max(0,Math.min(1,rain));if(!ready())return;
  const listener=context.listener;position(listener,{x,y,z});
  for(const [name,value]of Object.entries({forwardX:-Math.sin(yaw)*Math.cos(pitch),forwardY:Math.sin(pitch),forwardZ:-Math.cos(yaw)*Math.cos(pitch),upX:0,upY:1,upZ:0}))listener[name].setTargetAtTime(value,context.currentTime,.04);
  sheltered=shelter;layerGains.windVolume.gain.setTargetAtTime(mix.windVolume*(1-shelter*.68),context.currentTime,.5);
  if(roof)position(roofPan,{x:roof.x,y:roof.roofY,z:roof.z});if(stream)position(streamPan,stream);
  roofGain.gain.setTargetAtTime(rainAmount*(.1+shelter*.8),context.currentTime,.6);
  if(!still)birdCalls.forEach(bird);

  for(const [group,layer]of natureLoops){const bird=group==='woodland-birds',dx=(bird?-46:-43)-x,dz=(bird?-30:18)-z,distance=Math.hypot(dx,dz);const proximity=.24+.76*Math.max(0,1-distance/48);const level=(bird?.16:.38)*proximity*(bird?(1-rainAmount*.75)*(season==='winter'?.6:1)*(theme==='night'?.25:1):1);layer.gain.gain.setTargetAtTime(level,context.currentTime,1);layer.pan.pan.setTargetAtTime(Math.max(-.65,Math.min(.65,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/(distance||1)*.65)),context.currentTime,.3);}
  rainGain.gain.setTargetAtTime(rainAmount*.25*(1-shelter*.7),context.currentTime,.7);
  waterBus.gain.setTargetAtTime(waterProximity,context.currentTime,.45);for(const v of voices)if(v.kind==='water')v.stereo.pan.setTargetAtTime(waterPan,context.currentTime,.15);
  if(!still){waterCountdown-=dt;if(waterCountdown<=0){waterCountdown=random(7,13);if(waterProximity>.08)play('water-lap',{volume:.09,pan:waterPan,rate:random(.92,1.02),highpass:120,lowpass:3500,kind:'water'});}}
  if(still||distance<.0001||distance>.3){if(stride!==.48||rustleDistance)resetMotion();return;}
  stride+=distance;rustleDistance+=surface==='grass'?distance:0;
  // Keep recorded steps beneath the quiet ambience, even at the slider's maximum.
  if(stride>=.72&&context.currentTime-lastStep>.24){stride%=.72;lastStep=context.currentTime;foot*=-1;play(surface,{volume:(surface==='wood'?.036:surface==='grass'?.028:.03)*random(.9,1.05),pan:foot*.09,rate:random(.96,1.045),lowpass:surface==='wood'?3200:surface==='grass'?4000:2400,kind:'movement'});}
  if(surface==='grass'&&rustleDistance>1.1){rustleDistance=0;rustle();}
 }
 function rustle(){play('grass',{volume:.017,pan:random(-.3,.3),rate:random(.75,.9),highpass:1300,lowpass:6200,kind:'movement'});}
 function interact(kind,still){if(!ready())return;if(kind==='water'&&!still&&context.currentTime-lastSplash>.8){lastSplash=context.currentTime;play('splash',{volume:.20,pan:waterPan,rate:random(.94,1.04),highpass:100,lowpass:6500});}else if(kind==='flower'||kind==='trees')rustle();}
 function setMix(nature,footsteps,layers={}){for(const key of SOUND_LAYERS){if(Number.isFinite(layers[key]))mix[key]=Math.max(0,Math.min(1,layers[key]));if(layerGains[key])layerGains[key].gain.setTargetAtTime(mix[key]*(key==='windVolume'?1-sheltered*.68:1),context.currentTime,.08);}natureVolume=Math.max(0,Math.min(1,Number.isFinite(nature)?nature:1));footstepsVolume=Math.max(0,Math.min(1,Number.isFinite(footsteps)?footsteps:1));if(context){natureBus.gain.setTargetAtTime(natureVolume,context.currentTime,.08);movementBus.gain.setTargetAtTime(footstepsVolume,context.currentTime,.08);}}
 return {pebbleImpact(point,speed){play('splash',{point,volume:Math.min(.24,.12+speed*.009),rate:1.04,highpass:100,lowpass:6500});},setMix,toggle,pause,resume,update,interact,resetMotion,stop(){enabled=false;clearTimeout(timer);clearVoices();ambientSource?.stop();rainSource?.stop();roofSource?.stop();streamSource?.stop();for(const layer of natureLoops.values())layer.source.stop();natureLoops.clear();context?.close();}};
}
