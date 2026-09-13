// Recorded foley layers over the optional synthesised outdoor ambience.
// Assets are local, CC0, and fetched only after the visitor enables Sound.
const GROUPS={gravel:5,wood:4,grass:4,splash:3,'water-lap':1};
export function gardenAudio({onNotice=()=>{}}={}){
 let context,master,waterBus,enabled=false,loading,timer,ambientSource,rainSource,rainGain;
 let stride=.48,rustleDistance=0,foot=1,lastStep=-10,lastSplash=-10,waterCountdown=2;
 let waterProximity=0,waterPan=0,rainAmount=0;
 const buffers=new Map(),previous=new Map(),voices=new Set();
 const random=(a,b)=>a+(b-a)*Math.random();
 const ready=()=>enabled&&context?.state==='running';
 function scheduleBird(){clearTimeout(timer);if(!ready())return;timer=setTimeout(()=>{bird();scheduleBird();},random(13000,24000));}
 function bird(){if(!ready()||rainAmount>.5)return;const now=context.currentTime,base=random(1900,2350),pan=random(-.65,.65);for(let i=0;i<3;i++){
  const osc=context.createOscillator(),gain=context.createGain(),stereo=context.createStereoPanner();stereo.pan.value=pan;
  osc.type='sine';osc.frequency.setValueAtTime(base+i*80,now+i*.17);osc.frequency.exponentialRampToValueAtTime(base*1.4,now+i*.17+.06);osc.frequency.exponentialRampToValueAtTime(base*.9,now+i*.17+.13);
  gain.gain.setValueAtTime(0,now+i*.17);gain.gain.linearRampToValueAtTime(.009,now+i*.17+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.17+.15);
  osc.connect(gain);gain.connect(stereo);stereo.connect(master);const voice={source:osc,gain,nodes:[osc,gain,stereo],kind:'bird'};track(voice);osc.start(now+i*.17);osc.stop(now+i*.17+.17);
 }}
 function track(voice){voices.add(voice);voice.source.onended=()=>{voice.nodes.forEach(n=>n.disconnect());voices.delete(voice);};}
 function clearVoices(kind,immediate=false){for(const v of voices){if(kind&&v.kind!==kind)continue;if(immediate){try{v.source.stop();}catch{}v.nodes.forEach(n=>n.disconnect());voices.delete(v);continue;}v.gain.gain.cancelScheduledValues(context.currentTime);v.gain.gain.setTargetAtTime(0,context.currentTime,.012);try{v.source.stop(context.currentTime+.055);}catch{}if(context.state!=='running'){v.nodes.forEach(n=>n.disconnect());voices.delete(v);}}}
 function choose(group){const available=buffers.get(group)||[];if(!available.length)return null;let index=Math.floor(Math.random()*available.length);if(available.length>1&&index===previous.get(group))index=(index+1)%available.length;previous.set(group,index);return available[index];}
 function play(group,{volume=.2,pan=0,rate=1,highpass=70,lowpass=10000,kind='effect'}={}){
  if(!ready())return;const buffer=choose(group);if(!buffer||voices.size>=12)return;
  const source=context.createBufferSource(),gain=context.createGain(),hp=context.createBiquadFilter(),lp=context.createBiquadFilter(),stereo=context.createStereoPanner();
  source.buffer=buffer;source.playbackRate.value=rate;hp.type='highpass';hp.frequency.value=highpass;lp.type='lowpass';lp.frequency.value=lowpass;stereo.pan.value=pan;
  const now=context.currentTime,duration=buffer.duration/rate;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.setValueAtTime(volume,now+Math.max(.01,duration-.045));gain.gain.linearRampToValueAtTime(0,now+duration);
  source.connect(hp);hp.connect(lp);lp.connect(gain);gain.connect(stereo);stereo.connect(kind==='water'?waterBus:master);track({source,gain,stereo,nodes:[source,hp,lp,gain,stereo],kind});source.start();source.stop(now+duration+.015);
 }
 async function load(){const results=await Promise.allSettled(Object.entries(GROUPS).flatMap(([group,count])=>Array.from({length:count},async(_,i)=>{
  const name=count===1?group:`${group}-${i+1}`,response=await fetch(`/assets/garden-audio/${name}.mp3`,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Audio file unavailable');
  const buffer=await context.decodeAudioData(await response.arrayBuffer());if(!buffers.has(group))buffers.set(group,[]);buffers.get(group).push(buffer);
 })));if(results.some(r=>r.status==='rejected'))onNotice('Some sound effects couldn’t load. Available sounds will still play; toggle Sound to retry.');}
 function initialize(){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');context=new Audio();master=context.createGain();master.gain.value=.55;waterBus=context.createGain();waterBus.gain.value=0;waterBus.connect(master);
  const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=15;limiter.ratio.value=3;limiter.attack.value=.01;limiter.release.value=.2;master.connect(limiter);limiter.connect(context.destination);
  const buffer=context.createBuffer(1,context.sampleRate*8,context.sampleRate),samples=buffer.getChannelData(0);let b=0;for(let i=0;i<samples.length;i++){b=(b+(Math.random()*2-1)*.025)/1.012;samples[i]=b;}
  ambientSource=context.createBufferSource();ambientSource.buffer=buffer;ambientSource.loop=true;const filter=context.createBiquadFilter(),volume=context.createGain();filter.type='lowpass';filter.frequency.value=1600;volume.gain.value=.22;ambientSource.connect(filter);filter.connect(volume);volume.connect(master);ambientSource.start();
  // Two independent channels of filtered noise and small droplets make a quiet rain bed.
  const rainBuffer=context.createBuffer(2,context.sampleRate*10,context.sampleRate);for(let channel=0;channel<2;channel++){const samples=rainBuffer.getChannelData(channel);let low=0;for(let i=0;i<samples.length;i++){low=low*.82+(Math.random()*2-1)*.18;samples[i]=low*.32;}for(let drop=0;drop<1200;drop++){const start=Math.floor(Math.random()*(samples.length-1500)),length=350+Math.floor(Math.random()*1000);for(let j=0;j<length;j++)samples[start+j]+=(Math.random()*2-1)*.055*Math.exp(-j/(length*.18));}const fade=400;for(let i=0;i<fade;i++){samples[i]*=i/fade;samples[samples.length-1-i]*=i/fade;}}
  rainSource=context.createBufferSource();rainSource.buffer=rainBuffer;rainSource.loop=true;const rainFilter=context.createBiquadFilter();rainFilter.type='lowpass';rainFilter.frequency.value=6500;rainGain=context.createGain();rainGain.gain.value=0;rainSource.connect(rainFilter);rainFilter.connect(rainGain);rainGain.connect(master);rainSource.start();
 }
 async function toggle(){if(!context)initialize();if(enabled){enabled=false;clearTimeout(timer);clearVoices(null,true);resetMotion();await context.suspend();return false;}
  await context.resume();enabled=true;resetMotion();scheduleBird();if(!loading||[...Object.entries(GROUPS)].some(([g,n])=>(buffers.get(g)?.length||0)<n)){buffers.clear();loading=load();}await loading;return enabled;
 }
 function resetMotion(){stride=.48;rustleDistance=0;clearVoices('movement');}
 function pause(){clearTimeout(timer);resetMotion();if(context){clearVoices(null,true);context.suspend().catch(()=>{});}}
 function resume(){if(enabled)context?.resume().then(scheduleBird).catch(()=>{});}
 function update({distance=0,dt=0,surface='gravel',x=0,z=30,yaw=0,still=false,rain=0}){
  // Distance is actual movement after collisions, never the requested key speed.
  const pondDistance=Math.hypot((x-5)/8,(z-1)/10);waterProximity=Math.max(0,Math.min(1,(2.2-pondDistance)/1.4));
  const dx=5-x,dz=1-z;waterPan=Math.max(-.7,Math.min(.7,(dx*Math.cos(yaw)-dz*Math.sin(yaw))/(Math.hypot(dx,dz)||1)*.7));
  rainAmount=Math.max(0,Math.min(1,rain));if(!ready())return;
  rainGain.gain.setTargetAtTime(rainAmount*.25,context.currentTime,.7);
  waterBus.gain.setTargetAtTime(waterProximity,context.currentTime,.45);for(const v of voices)if(v.kind==='water')v.stereo.pan.setTargetAtTime(waterPan,context.currentTime,.15);
  if(!still){waterCountdown-=dt;if(waterCountdown<=0){waterCountdown=random(7,13);if(waterProximity>.08)play('water-lap',{volume:.09,pan:waterPan,rate:random(.92,1.02),highpass:120,lowpass:3500,kind:'water'});}}
  if(still||distance<.0001||distance>.3){if(stride!==.48||rustleDistance)resetMotion();return;}
  stride+=distance;rustleDistance+=surface==='grass'?distance:0;
  if(stride>=.72&&context.currentTime-lastStep>.24){stride%=.72;lastStep=context.currentTime;foot*=-1;play(surface,{volume:(surface==='wood'?.26:surface==='grass'?.21:.30)*random(.9,1.05),pan:foot*.09,rate:random(.96,1.045),lowpass:surface==='wood'?5500:8500,kind:'movement'});}
  if(surface==='grass'&&rustleDistance>1.1){rustleDistance=0;rustle();}
 }
 function rustle(){play('grass',{volume:.085,pan:random(-.3,.3),rate:random(.75,.9),highpass:1300,lowpass:6200,kind:'movement'});}
 function interact(kind,still){if(!ready())return;if(kind==='water'&&!still&&context.currentTime-lastSplash>.8){lastSplash=context.currentTime;play('splash',{volume:.20,pan:waterPan,rate:random(.94,1.04),highpass:100,lowpass:6500});}else if(kind==='flower'||kind==='trees')rustle();}
 return {toggle,pause,resume,update,interact,resetMotion,stop(){enabled=false;clearTimeout(timer);clearVoices();ambientSource?.stop();rainSource?.stop();context?.close();}};
}
