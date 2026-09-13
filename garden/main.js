import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {SAVE_KEY,cleanSave,safeReturnPath,MAX_ADDITIONS} from './state.mjs';
const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let data;try{data=cleanSave(JSON.parse(localStorage.getItem(SAVE_KEY)));}catch{data=cleanSave(null);}
let dirty=true,storageAvailable=true;
let still=data.still||reduced.matches,started=false,free=false,arranging=false,selectedObject='plant',sound=false,failed=false;
let savedReturn;try{savedReturn=JSON.parse(sessionStorage.getItem('quietGarden.return'));if(!Number.isFinite(savedReturn?.at)||Date.now()-savedReturn.at>86400000)savedReturn=null;}catch{}
const returnPath=safeReturnPath(savedReturn?.url||'/',location.origin);
for(const id of ['returnLink','fallbackReturn']){$(id).href=returnPath;$(id).addEventListener('click',()=>{try{sessionStorage.setItem('quietGarden.returning','yes');}catch{}});}
function announce(text){dirty=true;$('status').textContent=text;}
function save(){dirty=true;try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));storageAvailable=true;$('saveStatus').textContent='Your garden is saved in this browser.';}catch{storageAvailable=false;$('saveStatus').textContent='Saving is unavailable. Enjoy this visit without saving.';}}
$('helpButton').onclick=()=>$('helpDialog').showModal();
for(const id of ['closeHelp','doneHelp'])$(id).onclick=()=>$('helpDialog').close();
$('retryButton').onclick=()=>location.reload();
function fallback(reason){failed=true;$('fallback').hidden=false;$('fallbackReason').textContent=reason;$('intro').hidden=true;$('session').hidden=true;$('gardenFooter').hidden=true;$('arrangePanel').hidden=true;if(audio)audio.suspend();}
let audio,master,noiseSource,birdTimer;
function chime(index=0){if(!sound||!audio||audio.state!=='running')return;const start=audio.currentTime;[1,2.002].forEach((o,i)=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=[261.63,293.66,329.63,392,440,523.25][index%6]*o;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(i?.012:.05,start+.04);gain.gain.exponentialRampToValueAtTime(.0001,start+2.5);osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+2.6);osc.onended=()=>{osc.disconnect();gain.disconnect();};});}
async function toggleSound(){try{
  if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();audio=new Audio();master=audio.createGain();master.gain.value=.55;master.connect(audio.destination);
    const buffer=audio.createBuffer(1,audio.sampleRate*6,audio.sampleRate),samples=buffer.getChannelData(0);let brown=0;for(let i=0;i<samples.length;i++){brown=(brown+Math.random()*.035-.0175)/1.008;samples[i]=brown;}
    noiseSource=audio.createBufferSource();noiseSource.buffer=buffer;noiseSource.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;const volume=audio.createGain();volume.gain.value=.13;noiseSource.connect(filter);filter.connect(volume);volume.connect(master);noiseSource.start();
  }
  sound=!sound;if(sound){await audio.resume();chime(3);}else await audio.suspend();$('soundButton').setAttribute('aria-pressed',String(sound));$('soundButton').querySelector('span').textContent=sound?'Sound on':'Sound off';
}catch{sound=false;$('soundButton').setAttribute('aria-pressed','false');$('soundButton').querySelector('span').textContent='Sound off';announce('Audio isn’t available in this browser. The garden is still yours to explore.');}}
$('soundButton').onclick=toggleSound;
let renderer,scene,camera,controls,water,sun,ambient,fill;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{fallback('This browser couldn’t open the 3D garden. You can still take a quiet moment here.');}
if(renderer){try{buildGarden();}catch(error){console.error('Garden setup failed',error);fallback('The garden couldn’t finish loading. Try again, or enjoy the quiet moment here.');}}
function buildGarden(){
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
$('world').append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Garden view. Use the nearby flower and arrangement buttons for keyboard play.');renderer.domElement.setAttribute('role','img');
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback('The 3D view was interrupted. Your saved garden is safe; reload to reopen it.');});
scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#23494c',.018);
camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,120);
controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=!still;controls.dampingFactor=.065;controls.enablePan=false;controls.minDistance=13;controls.maxDistance=24;controls.minPolarAngle=.65;controls.maxPolarAngle=1.25;controls.enableZoom=!still;controls.enableRotate=!still;controls.rotateSpeed=.5;
ambient=new THREE.HemisphereLight('#d6eee4','#143733',2.2);scene.add(ambient);
sun=new THREE.DirectionalLight('#ffe4a8',3.5);sun.position.set(-4,10,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:30});sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;scene.add(sun);
fill=new THREE.DirectionalLight('#73d8d3',1.6);fill.position.set(5,5,-7);scene.add(fill);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.83,...extra});
const moss=mat('#446a4a'),rock=mat('#3d5753',{flatShading:true}),stone=mat('#a2ac91',{flatShading:true}),bark=mat('#655942'),stemMat=mat('#739e66'),gold=mat('#edcd81',{emissive:'#bb7434',emissiveIntensity:.3});
const sphereGeo=new THREE.IcosahedronGeometry(1,1),petalGeo=new THREE.SphereGeometry(1,10,7);
const interactive=[],flowers=[],lanterns=[],decorations=[],butterflies=[],ripples=[];
function mesh(geo,material,parent=scene){const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function pebble(x,y,z,s=1,parent=scene){const m=mesh(sphereGeo,stone,parent);m.position.set(x,y,z);m.scale.set(.4*s,.16*s,.28*s);m.rotation.set(.1,x*2,z);return m;}
function cylinderBetween(a,b,r1,r2,material,parent=scene){const v=new THREE.Vector3().subVectors(b,a),m=mesh(new THREE.CylinderGeometry(r2,r1,v.length(),7),material,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
let seed=19;function random(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
const baseGeo=new THREE.CylinderGeometry(5.45,2.85,2.4,48,3);const bp=baseGeo.attributes.position;
for(let i=0;i<bp.count;i++){const x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i),a=Math.atan2(z,x),k=1+.05*Math.sin(a*5)+.035*Math.cos(a*9+y);bp.setXYZ(i,x*k,y,z*k*.84);}baseGeo.computeVertexNormals();const base=mesh(baseGeo,rock);base.position.y=-1.35;
const topGeo=new THREE.CylinderGeometry(5.55,5.3,.4,64);const tp=topGeo.attributes.position;for(let i=0;i<tp.count;i++){const a=Math.atan2(tp.getZ(i),tp.getX(i)),k=1+.035*Math.sin(a*5);tp.setXYZ(i,tp.getX(i)*k,tp.getY(i),tp.getZ(i)*k*.84);}topGeo.computeVertexNormals();mesh(topGeo,moss).position.y=-.02;
// Separate hanging facets make the underside read as a tiny floating landscape.
for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=3.4+random(),m=mesh(sphereGeo,rock);m.position.set(Math.cos(a)*r,-1.6-random(),Math.sin(a)*r*.8);m.scale.set(.5+random()*.5,.8+random()*.5,.6);}
const tuftMat=mat('#749568',{side:THREE.DoubleSide});const grass=new THREE.InstancedMesh(new THREE.ConeGeometry(.055,.28,3),tuftMat,700);let count=0,dummy=new THREE.Object3D();
function isPond(x,z,pad=0){return ((x-1.1)/(2.28+pad))**2+((z-.7)/(1.65+pad))**2<1;}
for(let i=0;i<900&&count<700;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*5.1,x=Math.cos(a)*r,z=Math.sin(a)*r*.8;if(isPond(x,z,.24))continue;dummy.position.set(x,.27,z);dummy.rotation.set(random()*.25,random()*6,random()*.2);dummy.scale.setScalar(.5+random());dummy.updateMatrix();grass.setMatrixAt(count++,dummy.matrix);}grass.count=count;grass.receiveShadow=true;scene.add(grass);
// Water uses an actual reflected scene, with translucent colour and drawn ripple rings.
water=new Reflector(new THREE.CircleGeometry(1,64),{clipBias:.003,textureWidth:innerWidth<=760?256:512,textureHeight:innerWidth<=760?256:512,color:'#5b9c8e'});water.rotation.x=-Math.PI/2;water.scale.set(2.22,1.59,1);water.position.set(1.1,.205,.7);scene.add(water);
const tint=mesh(new THREE.CircleGeometry(1,64),new THREE.MeshBasicMaterial({color:'#2d9c91',transparent:true,opacity:.35,depthWrite:false}));tint.rotation.x=-Math.PI/2;tint.scale.set(2.22,1.59,1);tint.position.set(1.1,.214,.7);tint.userData.pond=true;interactive.push(tint);
for(let i=0;i<36;i++){let a=i/36*Math.PI*2;pebble(1.1+Math.cos(a)*2.32,.22,.7+Math.sin(a)*1.7,.7+random()*.55);}
function ripple(x,z){if(still)return;for(let i=0;i<3;i++){const ring=mesh(new THREE.RingGeometry(.92,1,60),new THREE.MeshBasicMaterial({color:'#c9efe0',transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.23,z);ring.scale.setScalar(.03);ring.userData={age:-i*.35};ripples.push(ring);}}
for(let i=0;i<4;i++){const x=.2+i*.65,z=.45+Math.sin(i*2)*.7;const pad=mesh(new THREE.CircleGeometry(.26,24),mat('#629771',{side:THREE.DoubleSide}));pad.rotation.x=-Math.PI/2;pad.position.set(x,.24,z);}
// A generous, branching canopy built from instanced leaves rather than a loaded model.
const tree=new THREE.Group();tree.position.set(-1.95,.13,-1.5);scene.add(tree);
cylinderBetween(new THREE.Vector3(0,0,0),new THREE.Vector3(.15,2.6,0),.36,.13,bark,tree);
for(let i=0;i<6;i++){let a=i/6*Math.PI*2;cylinderBetween(new THREE.Vector3(.02,.2,0),new THREE.Vector3(Math.cos(a)*.7,0,Math.sin(a)*.7),.15,.035,bark,tree);}
const leafMats=[mat('#adc38a'),mat('#8eb085'),mat('#d5ce8f')],leafGeo=new THREE.IcosahedronGeometry(1,0);
const leafSets=leafMats.map(m=>{const inst=new THREE.InstancedMesh(leafGeo,m,380);inst.castShadow=true;inst.receiveShadow=true;tree.add(inst);return inst;});const leafCounts=[0,0,0];
for(let b=0;b<9;b++){const a=b/9*Math.PI*2,end=new THREE.Vector3(Math.cos(a)*(1.2+random()*.8),2.4+random()*1.3,Math.sin(a)*(1.2+random()*.6));cylinderBetween(new THREE.Vector3(.13,1.2+random(),0),end,.14,.04,bark,tree);
 for(let j=0;j<95;j++){const angle=random()*Math.PI*2,r=Math.sqrt(random())*1.05,kind=Math.floor(random()*3),n=leafCounts[kind]++;dummy.position.set(end.x+Math.cos(angle)*r,end.y+random()*.85,end.z+Math.sin(angle)*r*.85);dummy.rotation.set(random(),random()*6,random()*.6);dummy.scale.set(.21+random()*.27,.10+random()*.15,.18+random()*.2);dummy.updateMatrix();leafSets[kind].setMatrixAt(n,dummy.matrix);}}
leafSets.forEach((inst,i)=>inst.count=leafCounts[i]);
// Mossy boulders and a curved stepping-stone path.
for(const [x,z,s] of [[-3.8,-.3,2.4],[3.7,-1.6,2],[-.1,-3.6,1.8],[4,1.8,1.7],[-3.5,2.3,1.6]]){const b=mesh(sphereGeo,rock);b.position.set(x,.5,z);b.scale.set(s*.45,s*.45,s*.35);pebble(x+.2,.9,z,.8);}
const path=new THREE.CatmullRomCurve3([new THREE.Vector3(-2.7,.28,3),new THREE.Vector3(-1.65,.28,1.2),new THREE.Vector3(-1,.28,-.3),new THREE.Vector3(.5,.28,-1.5),new THREE.Vector3(2.7,.28,-1.5)]);
for(let i=0;i<24;i++){const p=path.getPoint(i/23);pebble(p.x,p.y,p.z,.75+random()*.25);}
// A little timber footbridge by the pond.
const wood=mat('#887b58');for(let i=0;i<9;i++){const x=2.15+i*.15,y=.29+Math.sin(i/8*Math.PI)*.25;const plank=mesh(new THREE.BoxGeometry(.14,.08,.95),wood);plank.position.set(x,y,.4);}
function lantern(x,z,parent=scene){const g=new THREE.Group();g.position.set(x,.19,z);parent.add(g);const post=mesh(new THREE.CylinderGeometry(.045,.055,.7,6),bark,g);post.position.y=.35;const box=mesh(new THREE.BoxGeometry(.23,.3,.23),mat('#ffe7a3',{emissive:'#ffc373',emissiveIntensity:2}),g);box.position.y=.83;mesh(new THREE.ConeGeometry(.25,.14,4),bark,g).position.y=1.04;const light=new THREE.PointLight('#ffd084',.45,2.4,2);light.position.y=.8;g.add(light);lanterns.push(box);return g;}
for(const [x,z]of[[-2.8,2.2],[.1,-2.5],[3.85,.1],[-3.7,-1.6]])lantern(x,z);
function flower(x,z,index=-1,scale=1,parent=scene){const g=new THREE.Group();g.position.set(x,.18,z);g.scale.setScalar(scale);parent.add(g);const stalk=mesh(new THREE.CylinderGeometry(.018,.028,.48,5),stemMat,g);stalk.position.y=.24;
 const head=new THREE.Group();head.position.y=.48;g.add(head);const material=mat(index<0?'#dfb7a2':'#f7d59d',{emissive:index<0?'#4a2720':'#bf8847',emissiveIntensity:index<0?.08:.35});const petals=[];
 for(let p=0;p<7;p++){const hinge=new THREE.Group();hinge.rotation.y=p/7*Math.PI*2;head.add(hinge);const petal=mesh(petalGeo,material,hinge);petal.position.set(0,.055,.14);petal.scale.set(.08,.045,.19);petals.push(hinge);}
 const heart=mesh(new THREE.SphereGeometry(.075,12,8),gold,head);heart.position.y=.09;
 if(index>=0){const halo=mesh(new THREE.RingGeometry(.2,.215,36),new THREE.MeshBasicMaterial({color:'#ffd699',transparent:true,opacity:.6,side:THREE.DoubleSide}));halo.rotation.x=-Math.PI/2;halo.position.set(x,.215,z);const hit=mesh(new THREE.SphereGeometry(.48,8,6),new THREE.MeshBasicMaterial({visible:false}),g);hit.position.y=.45;hit.userData.flower=index;interactive.push(hit);flowers.push({g,head,petals,halo,openness:data.blooms.includes(index)?1:0,index});}
 return g;}
const spots=[[-2.9,2.9],[-3.15,.65],[-.45,-1.15],[1.5,-2.35],[3.5,2.1],[-.7,2.9]];spots.forEach(([x,z],i)=>flower(x,z,i,1.3));
for(let i=0;i<55;i++){const a=random()*Math.PI*2,r=3.3+random()*1.6,x=Math.cos(a)*r,z=Math.sin(a)*r*.83;if(!isPond(x,z,.2))flower(x,z,-1,.25+random()*.45);}
const orb=mesh(new THREE.SphereGeometry(.105,18,12),new THREE.MeshBasicMaterial({color:'#ffdda0'}));orb.position.set(-2.5,.85,3);const orbLight=new THREE.PointLight('#ffd393',1.1,3);orb.add(orbLight);
// A soft radial sprite gives light a photographic glow without an expensive full-screen bloom pass.
const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,232,176,1)');gradient.addColorStop(.18,'rgba(255,211,134,.5)');gradient.addColorStop(1,'rgba(255,196,99,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const glowMap=new THREE.CanvasTexture(canvas),glowMaterial=new THREE.SpriteMaterial({map:glowMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});const glow=new THREE.Sprite(glowMaterial);glow.scale.set(1.4,1.4,1);orb.add(glow);
for(const box of lanterns){const s=new THREE.Sprite(glowMaterial);s.scale.set(1,1,1);box.add(s);}
const motes=new THREE.BufferGeometry(),motePositions=new Float32Array(75*3);for(let i=0;i<75;i++){motePositions[i*3]=(random()-.5)*15;motePositions[i*3+1]=random()*6;motePositions[i*3+2]=(random()-.5)*12;}motes.setAttribute('position',new THREE.BufferAttribute(motePositions,3));const particles=new THREE.Points(motes,new THREE.PointsMaterial({map:glowMap,size:.16,transparent:true,depthWrite:false,color:'#ffdc9e',blending:THREE.AdditiveBlending}));scene.add(particles);
for(let i=0;i<5;i++){const butterfly=new THREE.Group();const wingMat=mat(i%2?'#e9ba95':'#e6d2a0',{side:THREE.DoubleSide});for(const sign of [-1,1]){const wing=mesh(new THREE.CircleGeometry(.09,5),wingMat,butterfly);wing.position.x=sign*.07;wing.rotation.y=sign*.7;}butterfly.userData.phase=random()*Math.PI*2;butterflies.push(butterfly);scene.add(butterfly);}
// Distant islands provide scale and depth while leaving the foreground uncluttered.
for(const [x,y,z,s] of [[-13,-5,-12,.6],[12,-2,-12,.55],[1,-6,-18,.45]]){const m=mesh(baseGeo,mat('#3e6866'));m.position.set(x,y,z);m.scale.setScalar(s);const cap=mesh(topGeo,mat('#729482'));cap.position.set(x,y+1.33*s,z);cap.scale.setScalar(s);for(let j=0;j<4;j++){const trunk=mesh(new THREE.CylinderGeometry(.08,.1,1.2,5),bark);trunk.position.set(x+(j-1.5)*s,y+1.9*s,z);trunk.scale.setScalar(s);const canopy=mesh(new THREE.ConeGeometry(.85,1.8,7),mat('#658b75'));canopy.position.set(x+(j-1.5)*s,y+3*s,z);canopy.scale.setScalar(s);}}
const themes={day:{bg:'#76988b',fog:'#78988f',sun:'#fff3ca',power:3,ambient:2.9,exposure:1.3,leaf:['#9dbc83','#6ea478','#c1cf94']},sunset:{bg:'#23494c',fog:'#23494c',sun:'#ffd293',power:3.6,ambient:2.2,exposure:1.2,leaf:['#c4c18b','#89ac88','#e2ca91']},night:{bg:'#102936',fog:'#193947',sun:'#badbf5',power:1,ambient:1.5,exposure:1.1,leaf:['#7baca5','#608f95','#9ab6ac']}};
function setTheme(theme){data.theme=theme;const c=themes[theme];$('world').style.background=`radial-gradient(ellipse at 65% 40%, ${c.bg}, #0c242d)`;scene.fog.color.set(c.fog);sun.color.set(c.sun);sun.intensity=c.power;ambient.intensity=c.ambient;renderer.toneMappingExposure=c.exposure;leafMats.forEach((m,i)=>m.color.set(c.leaf[i]));document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===theme)));save();}
for(const b of document.querySelectorAll('[data-theme]'))b.onclick=()=>setTheme(b.dataset.theme);
setTheme(data.theme);
function setMotion(){controls.enableRotate=!still;controls.enableZoom=!still;controls.enableDamping=!still;$('motionButton').setAttribute('aria-pressed',String(still));$('interactionHint').textContent=still?'Still mode · Use the flower and arrangement buttons':'Drag gently to look around · Scroll or pinch to zoom';data.still=still;save();}
$('motionButton').onclick=()=>{still=!still;setMotion();};reduced.addEventListener('change',event=>{if(event.matches){still=true;setMotion();}});setMotion();
const messages=['A little light is a lovely place to start.','There is no need to hurry.','Let the next thing be small.','You can simply be here for a moment.','A little space, just for you.','Your garden is in bloom. Stay, or take this moment with you.'];
function updateJourney(){const n=data.blooms.length;$('petalProgress').innerHTML=Array.from({length:6},(_,i)=>`<i class="${data.blooms.includes(i)?'open':''}"></i>`).join('');$('progressText').textContent=free?'Explore the pond, flowers and garden.':`${n} of 6 flowers open`;$('journeyTitle').textContent=free?'Stay a little.':n===6?'A moment, well spent.':'Let a little light in.';$('journeyText').textContent=n===6?'You can keep exploring, arrange your garden or return whenever you’re ready.':free?'Touch the water, open a flower, or make this corner your own.':'Touch a glowing flower, or use the button below.';$('bloomButton').textContent=n===6?'Follow the path again ↗':n===0?'Find the first flower ↗':'Find the next flower ↗';}
let travel=null;
function openFlower(index){const f=flowers[index];if(!f)return;const to=f.g.position.clone().add(new THREE.Vector3(0,.85,0));if(still){orb.position.copy(to);travel=null;}else travel={from:orb.position.clone(),to,start:performance.now()};if(!data.blooms.includes(index)){data.blooms.push(index);save();announce(messages[data.blooms.length-1]);chime(index);}else{announce('Already in bloom. You can enjoy it again.');chime(index);}updateJourney();}
$('bloomButton').onclick=()=>{if(data.blooms.length===6){data.blooms=[];save();updateJourney();announce('A fresh path, at your own pace.');return;}openFlower(spots.findIndex((_,i)=>!data.blooms.includes(i)));};
$('freeButton').onclick=()=>{free=!free;$('freeButton').textContent=free?'Follow the flowers':'Just explore';updateJourney();};
$('enterButton').onclick=()=>{started=true;document.body.classList.add('playing');$('intro').hidden=true;$('session').hidden=false;$('arrangeButton').disabled=false;$('bloomButton').focus({preventScroll:true});updateJourney();};
function addDecoration(p,persist=true){const g=p.type==='plant'?flower(p.x,p.z,-1,.95):p.type==='lantern'?lantern(p.x,p.z):new THREE.Group();if(p.type==='stone'){scene.add(g);g.position.set(p.x,.18,p.z);pebble(0,.12,0,1.15,g);pebble(.05,.32,.01,.75,g);pebble(.04,.46,0,.45,g);}decorations.push(g);if(persist){data.additions.push(p);save();chime(2);}updateDecorationCount();}
function updateDecorationCount(){$('decorationCount').textContent=`${decorations.length} of ${MAX_ADDITIONS} additions · ${storageAvailable?'Saved in this browser':'This visit only'}`;$('undoButton').disabled=!decorations.length;$('placeButton').disabled=decorations.length>=MAX_ADDITIONS;}
function placeAt(x,z){if(data.additions.length>=MAX_ADDITIONS){announce('Your garden has twelve additions. Undo one to make space.');return;}if(Math.hypot(x,z/ .84)>5||isPond(x,z,.4)||Math.hypot(x+1.95,z+1.5)<1||data.additions.some(p=>Math.hypot(p.x-x,p.z-z)<.45)){announce('Try an open patch of grass, or choose “Place for me”.');return;}addDecoration({type:selectedObject,x,z});announce(`${selectedObject==='plant'?'Flowers':selectedObject==='stone'?'A stack of stones':'A lantern'} added to your garden.`);}
for(const p of data.additions)addDecoration(p,false);updateDecorationCount();
$('arrangeButton').onclick=()=>{arranging=!arranging;$('arrangePanel').hidden=!arranging;$('arrangeButton').setAttribute('aria-expanded',String(arranging));};$('closeArrange').onclick=()=>{arranging=false;$('arrangePanel').hidden=true;$('arrangeButton').setAttribute('aria-expanded','false');$('arrangeButton').focus({preventScroll:true});};
for(const b of document.querySelectorAll('[data-object]'))b.onclick=()=>{selectedObject=b.dataset.object;document.querySelectorAll('[data-object]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));};
$('placeButton').onclick=()=>{const candidates=[[-4,1],[-3.1,3.1],[0,3.6],[1.5,3.25],[3.5,-2.1],[.7,-3.5],[-2.9,-3.1],[3.9,1.1],[-4,-1.4],[-1.3,3.4],[2.8,2.65],[2.2,-3.2],[-4.5,0],[-.7,-3.4]];const p=candidates.find(([x,z])=>!data.additions.some(a=>Math.hypot(a.x-x,a.z-z)<.5));if(p)placeAt(...p);};
$('undoButton').onclick=()=>{const g=decorations.pop();if(!g)return;scene.remove(g);const geometries=new Set(),materials=new Set();g.traverse(object=>{if(object.isPointLight)object.dispose();if(object.geometry&&![sphereGeo,petalGeo].includes(object.geometry))geometries.add(object.geometry);if(object.material&&![stone,stemMat,gold,bark,glowMaterial].includes(object.material))materials.add(object.material);const at=lanterns.indexOf(object);if(at>=0)lanterns.splice(at,1);});geometries.forEach(r=>r.dispose());materials.forEach(r=>r.dispose());data.additions.pop();save();updateDecorationCount();announce('Last addition removed.');};
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),-.2);let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});renderer.domElement.addEventListener('pointerup',e=>{if(!started||!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>9)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);if(arranging){const p=new THREE.Vector3();if(ray.ray.intersectPlane(ground,p))placeAt(p.x,p.z);return;}const hit=ray.intersectObjects(interactive,false)[0];if(hit?.object.userData.flower!==undefined)openFlower(hit.object.userData.flower);else if(hit?.object.userData.pond){ripple(hit.point.x,hit.point.z);chime(4);announce('A little ripple. Then stillness.');}});
function resize(){dirty=true;const w=innerWidth,h=Math.max(innerHeight,innerWidth<=760?720:650);renderer.setSize(w,h);camera.aspect=w/h;if(w<=760){controls.minDistance=24;controls.maxDistance=48;camera.position.set(21,22,28);controls.target.set(0,1.15,0);camera.setViewOffset(w,h,0,-h*.09,w,h);}else{controls.minDistance=13;controls.maxDistance=24;camera.position.set(11,10.8,15);controls.target.set(0,.9,0);camera.setViewOffset(w,h,-w*.12,0,w,h);}camera.updateProjectionMatrix();controls.update();controls.saveState();}
window.addEventListener('resize',resize);resize();updateJourney();$('enterButton').disabled=false;$('enterButton').textContent='Step into the garden ↗';document.body.dataset.gardenReady='true';
let last=0,previousFrame=0,animationTime=0,lastRipple=0;
function frame(now){requestAnimationFrame(frame);if(failed||document.hidden){last=now;return;}if(now-previousFrame<32)return;const dt=Math.min((now-last)/1000,.05)||.016;last=now;previousFrame=now;if(!still)animationTime+=dt;
 if(still&&!dirty&&!travel)return;dirty=false;
 const t=animationTime;
 for(const f of flowers){const target=data.blooms.includes(f.index)?1:0;f.openness=still?target:THREE.MathUtils.lerp(f.openness,target,.1);f.petals.forEach(p=>p.rotation.x=-(1-f.openness)*1.05);f.head.rotation.y=still?0:Math.sin(t*.5+f.index)*.05;f.halo.material.opacity=target?.12:still?.55:.35+Math.sin(t*1.6+f.index)*.22;}
 if(travel){const p=still?1:Math.min((now-travel.start)/1700,1),ease=p*p*(3-2*p);orb.position.lerpVectors(travel.from,travel.to,ease);orb.position.y+=still?0:Math.sin(p*Math.PI)*.65;if(p===1)travel=null;}
 glow.scale.setScalar(still?1.4:1.3+Math.sin(t*1.4)*.12);
 if(!still){tree.rotation.z=Math.sin(t*.2)*.007;if(t-lastRipple>8){lastRipple=t;ripple(1.4,.9);}particles.rotation.y=t*.018;butterflies.forEach((b,i)=>{const phase=b.userData.phase+t*.27;b.position.set(-1.6+Math.cos(phase)*(1.1+i*.14),1.2+Math.sin(phase*1.5)*.5,Math.sin(phase)*1.3-1);b.rotation.y=-phase;b.children.forEach((w,j)=>w.rotation.y=(j?-1:1)*Math.sin(t*6+i)*.9);});}
 for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.userData.age+=still?0:dt;if(r.userData.age<0)continue;r.scale.setScalar(.08+r.userData.age*.43);r.material.opacity=Math.max(0,.28-r.userData.age*.12);if(r.userData.age>2.35||still){scene.remove(r);r.geometry.dispose();r.material.dispose();ripples.splice(i,1);}}
 controls.update();renderer.render(scene,camera);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{if(audio){if(document.hidden)audio.suspend();else if(sound&&!failed)audio.resume().catch(()=>{});}});
window.addEventListener('pagehide',()=>{audio?.suspend();});
}
