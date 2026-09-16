import {ZIPLINE,zipJourney,landingSupport} from './zipline-state.mjs';
import {LOOKOUT,LOOKOUT_ENTRY,LOOKOUT_TOP,lookoutSupport,lookoutZone,spurHeight,stairJourney} from './lookout-layout.mjs';
import {pebbleToss} from './pebble-toss.js';
import {SOUND_LAYERS,daylightController,themeLight,shelterAmount,qualityController} from './immersion-state.mjs';
import {visitControls} from './visit-controls.js';
import {weatherController,WEATHER_LABELS} from './weather-state.mjs';
import * as T from 'three';
import {createLandscape} from './landscape.js';
import {gardenAudio} from './walk-audio.js';
import {safeReturnPath} from './state.mjs';
import {WALK_SAVE_KEY,route,ROUTE_LENGTH,places,nearestRoute,groundHeight,canWalk,cleanWalkSave,inPond,breakJourney} from './walk-route.mjs';
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
let saved;try{saved=cleanWalkSave(JSON.parse(localStorage.getItem(WALK_SAVE_KEY)));}catch{saved=cleanWalkSave(null);}
const weather=weatherController(saved.weather,saved.weatherAuto),daylight=daylightController(themeLight(saved.theme),saved.daylightAuto);
let visit,pebbles,towerWalk=null,zipRide=null;
let breakRemaining=0,breakSpeed=1.3,breathingTime=0;
let started=false,failed=false,still=saved.still||reduced.matches,guided=false,sitting=false,dirty=true,activePlace=0,walkT=0,guideDistance=0;
let yaw=0,pitch=-.015,guideLook=0,keys=new Set(),touchKeys=new Set(),drag=null,scene,camera,renderer,landscape;
let savedReturn;try{savedReturn=JSON.parse(sessionStorage.getItem('quietGarden.return'));if(!Number.isFinite(savedReturn?.at)||Date.now()-savedReturn.at>86400000)savedReturn=null;}catch{}
const returnPath=safeReturnPath(savedReturn?.url||'/',location.origin);
for(const id of['returnLink','fallbackReturn']){$(id).href=returnPath;$(id).addEventListener('click',()=>{try{sessionStorage.setItem('quietGarden.returning','yes');}catch{}});}
const audio=gardenAudio({onNotice:announce,natureVolume:saved.natureVolume,footstepsVolume:saved.footstepsVolume,layers:saved});let toastTimer;
function announce(message){$('status').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('status').textContent='',6500);}
function save(){try{localStorage.setItem(WALK_SAVE_KEY,JSON.stringify(saved));return true;}catch{announce('Saving is unavailable. You can still enjoy this visit.');return false;}}
function stopWalking(){if(zipRide)zipRide.paused=true;towerWalk=null;pebbles?.cancelAim();breakRemaining=0;audio.resetMotion();guided=false;keys.clear();touchKeys.clear();drag=null;updateControls();}
function updateControls(){if(!started)return;pebbles?.refresh(started&&!still&&!failed);$('guideButton').setAttribute('aria-pressed',String(guided));$('guideButton').textContent=guided?'Pause the walk  Ⅱ':'Follow the path  →';$('pauseButton').disabled=(!zipRide||zipRide.paused)&&!guided&&!towerWalk&&!keys.size&&!touchKeys.size;$('guideButton').disabled=still;$('breakButton').disabled=still;$('breakButton').textContent=breakRemaining>0?'End garden break':'2-minute break';$('sitButton').textContent=sitting?'Stand up':'Sit a while';$('sitButton').setAttribute('aria-pressed',String(sitting));$('walkState').textContent=still?'Still view · Choose a place on the map':sitting?'A moment to sit · Drag to look around':towerWalk?(towerWalk.down?'Following the stairs down · Pause to look around':'Climbing the lookout · Pause to look around'):guided?(breakRemaining>0?'Your two-minute break · A bench awaits':'Following the path · Look around or pause'):coarse.matches?'Hold arrows to walk · Drag the view to look':'Drag to look · W A S D / arrows · Q / E to turn';$('touchControls').hidden=!started||!coarse.matches||still||sitting||!!zipRide;$('quietWalk').hidden=!started||still||sitting||failed||!!zipRide;$('zipRidePanel').hidden=!zipRide;$('pauseZip').textContent=zipRide?.paused?'Resume ride':'Pause ride';$('pauseZip').disabled=still;$('zipRideState').textContent=zipRide?.paused?'A moment above the garden':'Gliding through the garden';$('zipRideHint').textContent=still?'Still view. Land now or return to the tower.':zipRide?.paused?'Resume when ready, or choose where to return.':'Drag to look around. Esc pauses the ride.';$('controlHint').textContent=still?'Still mode · Ten places to pause.':(guided||towerWalk)?'Escape or Pause stops the walk.':'Walk at your own pace. No scores. No rush.';}
function fail(reason){visit?.showControls();failed=true;stopWalking();audio.pause();$('fallback').hidden=false;$('fallbackReason').textContent=reason;$('intro').hidden=true;$('walkHud').hidden=true;$('gardenFooter').hidden=true;$('interaction').hidden=true;$('touchControls').hidden=true;$('mapPanel').hidden=true;$('weatherPanel').hidden=true;$('weatherButton').disabled=true;$('reticle').hidden=true;}
$('soundMixButton').onclick=()=>{stopWalking();$('soundDialog').showModal();};
for(const id of['closeSound','doneSound'])$(id).onclick=()=>$('soundDialog').close();
for(const id of['natureVolume','footstepsVolume',...SOUND_LAYERS]){const slider=$(id);slider.value=String(Math.round(saved[id]*100));const updateLabel=()=>{$(id+'Value').textContent=slider.value==='0'?'Off':slider.value+'%';slider.setAttribute('aria-valuetext',slider.value==='0'?'Off':slider.value+' percent');};updateLabel();slider.oninput=()=>{saved[id]=Number(slider.value)/100;audio.setMix(saved.natureVolume,saved.footstepsVolume,saved);updateLabel();};slider.onchange=save;}
$('retryButton').onclick=()=>location.reload();
$('helpButton').onclick=()=>{stopWalking();$('helpDialog').showModal();};
for(const id of['closeHelp','doneHelp'])$(id).onclick=()=>$('helpDialog').close();
$('soundButton').onclick=async()=>{const button=$('soundButton');button.disabled=true;try{const on=await audio.toggle();button.setAttribute('aria-pressed',String(on));button.querySelector('span').textContent=on?'Sound on':'Sound off';}catch{button.setAttribute('aria-pressed','false');button.querySelector('span').textContent='Sound off';audio.pause();announce('Sound isn’t available in this browser. You can keep exploring.');}finally{button.disabled=false;}};
try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch{fail('This browser couldn’t open the 3D walk. You can still take a moment here.');}
if(renderer){try{init();}catch(error){console.error('Garden walk setup failed',error);fail('The garden couldn’t finish loading. Try again, or return to your learning.');}}
function init(){
 const mobile=innerWidth<=760,quality=qualityController(saved.quality,mobile);renderer.setPixelRatio(quality.pixelRatio(devicePixelRatio));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.outputColorSpace=T.SRGBColorSpace;$('world').append(renderer.domElement);
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Garden walk. Use W A S D or arrows to walk, Q and E to turn, or use Follow the path and the map.');canvas.setAttribute('role','region');canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('The 3D view was interrupted. Reload to return to the garden.');});
 scene=new T.Scene();camera=new T.PerspectiveCamera(62,innerWidth/innerHeight,.08,320);camera.rotation.order='YXZ';
 landscape=createLandscape(scene,renderer,mobile);landscape.setSeason(saved.season);$('seasonSelect').value=saved.season;$('seasonSelect').onchange=()=>{saved.season=$('seasonSelect').value;landscape.setSeason(saved.season);dirty=true;save();};landscape.setWeather(weather.snapshot());
 function headingAt(t){const here=route.getPointAt((t+1)%1),ahead=route.getPointAt((t+.016+1)%1);return Math.atan2(here.x-ahead.x,here.z-ahead.z);}
 function positionAt(t){clearZipRide();pebbles?.reset();const p=route.getPointAt(t);camera.position.set(p.x,groundHeight(p.x,p.z)+1.67,p.z);yaw=headingAt(t);pitch=-.015;camera.rotation.set(pitch,yaw,0);walkT=t;dirty=true;}
 positionAt(0);
 function setTheme(name){saved.theme=name;saved.daylightAuto=false;daylight.setAutomatic(false);daylight.choose(themeLight(name));$('daylightAuto').checked=false;landscape.setTheme(name);document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===name)));dirty=true;save();}
 document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>setTheme(b.dataset.theme));landscape.setTheme(saved.theme);document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===saved.theme)));
 function weatherUi(){const state=weather.snapshot();document.querySelectorAll('[data-weather]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.weather===state.selected)));$('weatherAuto').checked=saved.weatherAuto;$('weatherAuto').disabled=still;$('daylightAuto').checked=saved.daylightAuto;$('daylightAuto').disabled=still;$('daylightNote').textContent=still?'Still mode pauses the daylight journey.':'Light moves slowly toward evening, then rests there.';$('weatherNote').textContent=still?'Still mode pauses weather animation and automatic changes.':'Changes about every two minutes during your visit.';$('weatherStatus').textContent=(state.transitioning&&!still?'Changing to ':'')+WEATHER_LABELS[state.selected]+(still?' · still view':'');$('weatherButton').setAttribute('aria-label',`Weather: ${WEATHER_LABELS[state.selected]}`);}
 function closeWeather(){ $('weatherPanel').hidden=true;$('weatherButton').setAttribute('aria-expanded','false');}
 $('weatherButton').onclick=()=>{const opening=$('weatherPanel').hidden;stopWalking();toggleMap(false);$('weatherPanel').hidden=!opening;$('weatherButton').setAttribute('aria-expanded',String(opening));if(opening)$('closeWeather').focus({preventScroll:true});};
 $('closeWeather').onclick=()=>{closeWeather();$('weatherButton').focus({preventScroll:true});};
 document.querySelectorAll('[data-weather]').forEach(b=>b.onclick=()=>{saved.weather=b.dataset.weather;weather.choose(saved.weather,still);landscape.setWeather(weather.snapshot());dirty=true;save();weatherUi();});
 $('weatherAuto').onchange=()=>{saved.weatherAuto=$('weatherAuto').checked;weather.setAutomatic(saved.weatherAuto);save();weatherUi();};weatherUi();
 $('daylightAuto').onchange=()=>{saved.daylightAuto=$('daylightAuto').checked;daylight.setAutomatic(saved.daylightAuto);save();};
 $('speedSelect').value=String(saved.pace);$('speedSelect').onchange=()=>{saved.pace=Number($('speedSelect').value);save();};
 function setStill(value){pebbles?.reset();still=value;saved.still=still;stopWalking();$('motionButton').setAttribute('aria-pressed',String(still));$('reticle').hidden=still||!started;dirty=true;save();updateLocation();updateControls();weatherUi();}
 $('motionButton').onclick=()=>setStill(!still);$('motionButton').setAttribute('aria-pressed',String(still));reduced.addEventListener('change',e=>{if(e.matches)setStill(true);});
 $('enterButton').onclick=()=>{started=true;$('intro').hidden=true;$('walkHud').hidden=false;$('reticle').hidden=still;document.body.classList.add('playing');updateLocation();updateControls();(still?$('nextButton'):$('guideButton')).focus({preventScroll:true});};
 function joinPath(){clearZipRide();stopWalking();sitting=false;const near=nearestRoute(camera.position.x,camera.position.z);walkT=near.t;const p=route.getPointAt(walkT);camera.position.set(p.x,groundHeight(p.x,p.z)+1.67,p.z);yaw=headingAt(walkT);pitch=-.015;guideLook=0;guided=true;guideDistance=0;dirty=true;updateControls();}
 $('guideButton').onclick=()=>{if(still)return;if(guided)stopWalking();else joinPath();};$('pauseButton').onclick=stopWalking;
 function arrive(index){stopWalking();sitting=false;positionAt(places[index].t);if(index===2){yaw=Math.PI;pitch=-.07;}if(index===9){camera.position.set(LOOKOUT_ENTRY.x,LOOKOUT_ENTRY.y+1.67,LOOKOUT_ENTRY.z);yaw=Math.PI;pitch=.12;}updateLocation();updateControls();announce(places[index].name+'. Take your time.');}
 $('woodlandEntry').onclick=()=>{$('enterButton').click();arrive(6);};
 $('woodlandButton').onclick=()=>arrive(6);
 $('lookoutButton').onclick=()=>arrive(9);
 function towerView(){clearZipRide();stopWalking();sitting=false;camera.position.set(LOOKOUT_TOP.x,LOOKOUT_TOP.y+1.67,LOOKOUT_TOP.z);yaw=Math.atan2(camera.position.x+45,camera.position.z-18);pitch=-.12;dirty=true;updateLocation();updateControls();announce('The woodland lookout. Drag to enjoy the view, or choose Go back down.');}
 function followStairs(down=false){
  if(still){if(down)arrive(9);return;}
  stopWalking();sitting=false;
  const journey=stairJourney(down);let nearest=Infinity,distance=0;
  for(let d=0;d<=journey.length;d+=.08){const p=journey.at(d),delta=Math.hypot(p.x-camera.position.x,p.y+1.67-camera.position.y,p.z-camera.position.z);if(delta<nearest){nearest=delta;distance=d;}}
  towerWalk={journey,distance,down};const p=journey.at(distance);camera.position.set(p.x,p.y+1.67,p.z);dirty=true;updateControls();announce(down?'Following the stairs back down. Pause whenever you like.':'Climbing the lookout. Pause whenever you like.');
 }
 $('climbLookout').onclick=()=>followStairs();$('descendLookout').onclick=()=>followStairs(true);$('viewLookout').onclick=towerView;

 function clearZipRide(){zipRide=null;document.body.classList.remove('zip-riding');landscape.lookout.setGate(false);landscape.zipline.update(0);$('zipRidePanel').hidden=true;}
 function finishZipRide(){clearZipRide();stopWalking();sitting=false;camera.position.set(ZIPLINE.end.x,ZIPLINE.end.y+ZIPLINE.eyeHeight,ZIPLINE.end.z);yaw=Math.PI/2;pitch=-.06;dirty=true;visit?.showControls();updateLocation();updateControls();announce('Back on the ground. Walk into the garden, or return to the zip line.');$('returnZipTower').focus({preventScroll:true});}
 function pauseZipRide(){if(!zipRide||still)return;zipRide.paused=!zipRide.paused;keys.clear();touchKeys.clear();audio.resetMotion();dirty=true;updateControls();}
 function openZip(){stopWalking();$('zipMotionNote').textContent=still?'Still mode is on. You can visit the landing without animation.':'Ready when you are.';$('startZip').disabled=still;$('zipDialog').showModal();}
 $('ziplineButton').onclick=openZip;$('closeZip').onclick=()=>$('zipDialog').close();
 $('startZip').onclick=()=>{if(still)return;$('zipDialog').close();stopWalking();sitting=false;visit?.showControls();pebbles?.reset();zipRide={journey:zipJourney(),paused:false};const p=zipRide.journey.snapshot();camera.position.set(p.x,p.y-ZIPLINE.hang+ZIPLINE.eyeHeight,p.z);yaw=p.yaw;pitch=-.08;guideLook=0;landscape.lookout.setGate(true);document.body.classList.add('zip-riding');dirty=true;updateLocation();updateControls();$('pauseZip').focus({preventScroll:true});announce('Your garden glide. Drag to look around. Pause or press Esc whenever you like.');};
 $('pauseZip').onclick=pauseZipRide;$('finishZip').onclick=finishZipRide;
 $('returnZip').onclick=()=>{visit?.showControls();towerView();$('ziplineButton').focus({preventScroll:true});};
 $('clearZip').onclick=()=>$('quietButton').click();
 $('visitZipLanding').onclick=()=>{$('zipDialog').close();finishZipRide();};
 $('returnZipTower').onclick=()=>{towerView();$('ziplineButton').focus({preventScroll:true});};


 $('breakButton').onclick=()=>{if(still)return;if(breakRemaining>0){stopWalking();return;}const trip=breakJourney(saved.pace);stopWalking();sitting=false;positionAt(trip.start);guided=true;guideLook=0;guideDistance=0;breakSpeed=trip.speed;breakRemaining=trip.duration;updateControls();announce('Two minutes along the path, ending at the woodland bench. Pause whenever you like.');};
 $('breatheButton').onclick=()=>{arrive(2);toggleSit();breathingTime=0;$('breathingDialog').showModal();dirty=true;};
 for(const id of['closeBreathing','doneBreathing'])$(id).onclick=()=>$('breathingDialog').close();
 $('breathingDialog').addEventListener('close',()=>{breathingTime=0;});
 $('nextButton').onclick=()=>{const current=nearestRoute(camera.position.x,camera.position.z).t;let next=0,best=2;places.forEach((p,i)=>{const d=(p.t-current+1)%1;if(d>.025&&d<best){best=d;next=i;}});arrive(next);};
 let standingPosition=null;
 function toggleSit(){if(Math.hypot(camera.position.x-LOOKOUT.x,camera.position.z-LOOKOUT.z)<7){announce('Enjoy the lookout standing, or return to a garden bench to sit.');return;}pebbles?.reset();stopWalking();if(sitting){sitting=false;if(standingPosition)camera.position.copy(standingPosition);standingPosition=null;}else{standingPosition=camera.position.clone();sitting=true;const b=landscape.benches.filter(b=>Math.hypot(camera.position.x-b.x,camera.position.z-b.z)<8).sort((a,b)=>Math.hypot(camera.position.x-a.x,camera.position.z-a.z)-Math.hypot(camera.position.x-b.x,camera.position.z-b.z))[0];if(b){camera.position.set(b.x,groundHeight(b.x,b.z)+1.08,b.z);yaw=b.angle+Math.PI;pitch=0;}else camera.position.y=groundHeight(camera.position.x,camera.position.z)+1.05;announce('A moment to sit. Stand up whenever you’re ready.');}dirty=true;updateControls();}
 $('sitButton').onclick=toggleSit;
 function toggleMap(open){stopWalking();if(open)closeWeather();$('mapPanel').hidden=!open;$('mapButton').setAttribute('aria-expanded',String(open));if(open)$('closeMap').focus({preventScroll:true});}
 $('mapButton').onclick=()=>toggleMap($('mapPanel').hidden);$('closeMap').onclick=()=>{toggleMap(false);$('mapButton').focus({preventScroll:true});};
 $('mapPath').setAttribute('d',Array.from({length:121},(_,i)=>{const p=route.getPointAt(i/120);return `${i?'L':'M'}${p.x.toFixed(2)},${p.z.toFixed(2)}`;}).join(' ')+' Z');
 places.forEach((p,i)=>{const point=i===9?LOOKOUT_ENTRY:route.getPointAt(p.t),dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('cx',point.x);dot.setAttribute('cy',point.z);dot.setAttribute('r','1.1');dot.setAttribute('fill','#c5cba8');$('mapStops').append(dot);const b=document.createElement('button');b.textContent=p.name;b.dataset.place=String(i);b.onclick=()=>{arrive(i);toggleMap(false);$('nextButton').focus({preventScroll:true});};$('mapPlaces').append(b);});
 function updateLocation(){const near=nearestRoute(camera.position.x,camera.position.z);let d=Infinity;places.forEach((p,i)=>{const n=Math.abs(p.t-near.t),delta=Math.min(n,1-n);if(delta<d){d=delta;activePlace=i;}});const towerNear=Math.hypot(camera.position.x-LOOKOUT.x,camera.position.z-LOOKOUT.z)<9;if(towerNear)activePlace=9;document.body.classList.toggle('at-lookout',towerNear);$('sitButton').disabled=towerNear||!!zipRide;const current=places[activePlace];$('lookoutActions').hidden=!started||!towerNear;$('climbLookout').disabled=still||camera.position.y>LOOKOUT.base+9;$('descendLookout').disabled=camera.position.y<LOOKOUT.base+2;$('viewLookout').disabled=camera.position.y>LOOKOUT.base+9;$('ziplineButton').disabled=camera.position.y<LOOKOUT.base+9.5||!!towerWalk;$('zipLandingActions').hidden=!started||!!zipRide||Math.hypot(camera.position.x-ZIPLINE.end.x,camera.position.z-ZIPLINE.end.z)>5;visit?.update(activePlace);$('placeName').textContent=current.name;$('placeDescription').textContent=current.description;$('mapDot').setAttribute('cx',camera.position.x.toFixed(3));$('mapDot').setAttribute('cy',camera.position.z.toFixed(3));document.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.place)===activePlace)));const p=activePlace===9?LOOKOUT_ENTRY:route.getPointAt(current.t);pebbles?.refresh(started&&!still&&!failed);$('interaction').hidden=!started||!!zipRide||towerNear||(Math.hypot(camera.position.x-p.x,camera.position.z-p.z)>8&&!pebbles?.available);$('interactButton').textContent=current.action;$('interactionDescription').textContent=current.description;}
 function interactAt(index,point){if(index===9){arrive(9);return;}stopWalking();if(places[index].kind==='bench'&&!sitting)toggleSit();else{if(!saved.opened.includes(index)){saved.opened.push(index);save();}landscape.interact(index,still,point);audio.interact(places[index].kind,still);}dirty=true;announce(places[index].kind==='water'&&still?'Still water. Notice the reflections.':places[index].note);}
 $('interactButton').onclick=()=>interactAt(activePlace);

 const moves={KeyW:'forward',ArrowUp:'forward',KeyS:'backward',ArrowDown:'backward',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyQ:'turnLeft',KeyE:'turnRight'};
 function acceptsMovement(e){return started&&!zipRide&&!still&&!sitting&&!failed&&!$('zipDialog').open&&!$('helpDialog').open&&!$('soundDialog').open&&!$('breathingDialog').open&&!$('visitDialog').open&&!$('readingDialog').open&&$('mapPanel').hidden&&$('weatherPanel').hidden&&!['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName);}
 window.addEventListener('keydown',e=>{if(e.code==='Escape'){stopWalking();if(!$('mapPanel').hidden)toggleMap(false);if(!$('weatherPanel').hidden){closeWeather();$('weatherButton').focus({preventScroll:true});}return;}const key=moves[e.code];if(!key||!acceptsMovement(e))return;e.preventDefault();pebbles?.cancelAim();if(guided||towerWalk)stopWalking();keys.add(key);updateControls();});
 window.addEventListener('keyup',e=>{if(moves[e.code]){keys.delete(moves[e.code]);updateControls();}});
 document.querySelectorAll('[data-move], [data-quiet-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{if(still||sitting||zipRide)return;e.preventDefault();if(guided||towerWalk)stopWalking();b.setPointerCapture(e.pointerId);touchKeys.add(b.dataset.move||b.dataset.quietMove);updateControls();});for(const name of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>{touchKeys.delete(b.dataset.move||b.dataset.quietMove);updateControls();});});
 canvas.addEventListener('pointerdown',e=>{if(!started||still)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,total:0};});
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||still)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.total+=Math.abs(dx)+Math.abs(dy);drag.x=e.clientX;drag.y=e.clientY;if(guided||zipRide){guideLook=T.MathUtils.clamp(guideLook-dx*.004*saved.lookSensitivity,-1.4,1.4);if(zipRide?.paused)yaw=zipRide.journey.snapshot().yaw+guideLook;}else yaw-=dx*.004*saved.lookSensitivity;pitch=T.MathUtils.clamp(pitch-dy*.003*saved.lookSensitivity,-.75,.65);dirty=true;});
 const ray=new T.Raycaster(),pointer=new T.Vector2();canvas.addEventListener('pointerup',e=>{if(zipRide){drag=null;return;}if(drag?.total<6){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(landscape.hitTargets,true).find(h=>h.distance<18);if(pebbles?.armed){if(hit?.object.userData.placeIndex===2)pebbles.select(hit.point);else announce('Choose open water within a gentle throw.');drag=null;return;}if(hit&&hit.distance<13){let obj=hit.object;while(obj&&obj.userData.placeIndex===undefined)obj=obj.parent;if(obj)interactAt(obj.userData.placeIndex,hit.point);}}drag=null;});for(const event of['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
 window.addEventListener('blur',()=>{stopWalking();audio.pause();});window.addEventListener('focus',()=>{if(!document.hidden&&!failed)audio.resume();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopWalking();audio.pause();}else if(!failed){last=performance.now();audio.resume();dirty=true;}});window.addEventListener('pagehide',()=>{stopWalking();audio.pause();});
 function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<600?68:62;camera.updateProjectionMatrix();dirty=true;updateControls();}
 window.addEventListener('resize',resize);coarse.addEventListener('change',updateControls);resize();updateLocation();
 function move(dt,elapsed=dt){let changed=false;
  if(zipRide){if(!zipRide.paused){const p=zipRide.journey.advance(elapsed);camera.position.set(p.x,p.y-ZIPLINE.hang+ZIPLINE.eyeHeight,p.z);landscape.zipline.update(p.distance,true);if(p.distance>3)landscape.lookout.setGate(false);const angle=Math.atan2(Math.sin(p.yaw+guideLook-yaw),Math.cos(p.yaw+guideLook-yaw));yaw+=angle*Math.min(1,dt*3);if(p.done)finishZipRide();return true;}return false;}

  if(towerWalk){towerWalk.distance=Math.min(towerWalk.journey.length,towerWalk.distance+saved.pace*dt);const p=towerWalk.journey.at(towerWalk.distance);camera.position.set(p.x,p.y+1.67,p.z);const angle=Math.atan2(Math.sin(p.yaw-yaw),Math.cos(p.yaw-yaw));yaw+=angle*Math.min(1,dt*2.4);changed=true;if(towerWalk.distance>=towerWalk.journey.length){const down=towerWalk.down;stopWalking();if(down)arrive(9);else towerView();}}
if(guided){const shortBreak=breakRemaining>0,step=shortBreak?breakSpeed*Math.min(elapsed,breakRemaining):saved.pace*dt;if(shortBreak)breakRemaining=Math.max(0,breakRemaining-elapsed);walkT=(walkT+step/ROUTE_LENGTH)%1;guideDistance+=step;const p=route.getPointAt(walkT);camera.position.set(p.x,groundHeight(p.x,p.z)+1.67,p.z);const target=headingAt(walkT)+guideLook,angle=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));yaw+=angle*Math.min(1,dt*3);changed=true;if(shortBreak&&breakRemaining===0){arrive(4);toggleSit();announce('Your two-minute break is complete. Stay as long as you like.');}else if(guideDistance>=ROUTE_LENGTH){stopWalking();announce('A full circle. Stay a little, or return whenever you’re ready.');}}
  const pressed=new Set([...keys,...touchKeys]);if(!sitting&&pressed.size){if(pressed.has('turnLeft'))yaw+=dt*.8;if(pressed.has('turnRight'))yaw-=dt*.8;const forward=Number(pressed.has('forward'))-Number(pressed.has('backward')),side=Number(pressed.has('right'))-Number(pressed.has('left')),length=Math.hypot(forward,side)||1,step=saved.pace*dt;const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)/length*step,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)/length*step;const x=camera.position.x,z=camera.position.z,foot=camera.position.y-1.67;
   function support(nx,nz){const landing=landingSupport(nx,nz,foot);if(landing!==null)return canWalk(nx,nz,landscape.obstacles)?landing:null;const h=lookoutSupport(nx,nz,foot);if(h!==null)return h;if(lookoutZone(nx,nz)||Math.abs(groundHeight(nx,nz)-foot)>.26)return null;return canWalk(nx,nz,landscape.obstacles)?groundHeight(nx,nz):null;}
   for(const [nx,nz]of[[x+dx,z+dz],[x+dx,z],[x,z+dz]]){const h=support(nx,nz);if(h!==null){camera.position.set(nx,h+1.67,nz);break;}}
   changed=true;}return changed;}
 let last=0,lastRender=0,animationTime=0,locationTimer=0;
 function frame(now){
  requestAnimationFrame(frame);
  if(failed||document.hidden){last=now;return;}
  if(now-lastRender<1000/quality.fps-1)return;
  const elapsedFrame=Math.min((now-last)/1000,.5)||.016,dt=Math.min(elapsedFrame,.05);last=now;lastRender=now;
  if(!still)animationTime+=dt;
  const weatherState=weather.tick(elapsedFrame,{still,active:started});
  if(weatherState.changed){saved.weather=weatherState.selected;save();weatherUi();}
  landscape.setWeather(weatherState);
  const previousLight=daylight.snapshot(),light=daylight.tick(elapsedFrame,{still,active:started});
  if(light!==previousLight){landscape.setDaylight(light);dirty=true;}
  const wasRiding=!!zipRide,oldX=camera.position.x,oldZ=camera.position.z;
  if(started&&!still)dirty=move(dt,elapsedFrame)||dirty;
  const near=nearestRoute(camera.position.x,camera.position.z),surface=(landingSupport(camera.position.x,camera.position.z,camera.position.y-1.67)!==null)?'wood':(lookoutZone(camera.position.x,camera.position.z)||spurHeight(camera.position.x,camera.position.z)!==null)?'wood':inPond(camera.position.x,camera.position.z,1.55)&&near.distance<1.65?'wood':near.distance<=1.65?(camera.position.x < -30?'grass':'gravel'):'grass';
  camera.rotation.set(pitch,yaw,0);
  pebbles?.update(elapsedFrame,still);
  if(!still||dirty)landscape.update(animationTime,dt,camera,still,saved.opened,elapsedFrame);
  audio.update({distance:started&&!still&&!wasRiding?Math.hypot(camera.position.x-oldX,camera.position.z-oldZ):0,dt,surface,...camera.position,yaw,pitch,still,rain:weatherState.rain,season:saved.season,theme:light>1.6?'night':saved.theme,shelter:shelterAmount(camera.position,landscape.shelter),roof:landscape.shelter,birdCalls:still?[]:landscape.birdCalls,stream:landscape.streamPosition});
  if($('breathingDialog').open){if(!still)breathingTime+=elapsedFrame;const phase=breathingTime%10,inhale=phase<4;$('breathingCue').textContent=still?'Breathe comfortably, at your own pace':inhale?'Breathe in gently':'Breathe out slowly';$('breathingCircle').style.transform=`scale(${still?1:inhale?.65+phase/4*.35:1-(phase-4)/6*.35})`;}
  if(still&&!dirty)return;
  const renderStart=performance.now();renderer.render(scene,camera);const renderMs=performance.now()-renderStart;
  if(!still&&started&&quality.sample(renderMs,elapsedFrame*1000)){renderer.setPixelRatio(quality.pixelRatio(devicePixelRatio));renderer.setSize(innerWidth,innerHeight);landscape.water.getRenderTarget().setSize(Math.max(256,Math.round((mobile?512:1024)*quality.scale)),Math.max(256,Math.round((mobile?512:1024)*quality.scale)));}
  dirty=false;locationTimer+=dt;if(locationTimer>.2){updateLocation();weatherUi();locationTimer=0;}
 }
 pebbles=pebbleToss({scene,camera,landscape,audio,announce,stopWalking});
 visit=visitControls({saved,save,announce,stopWalking,
  isGuided:()=>guided||!!towerWalk||!!zipRide&&!zipRide.paused,canMove:()=>started&&!still&&!sitting&&!failed&&!zipRide,prepareQuiet(){pebbles?.cancelAim();keys.clear();touchKeys.clear();drag=null;if(!guided)audio.resetMotion();updateControls();},
  getView:()=>({place:activePlace,sitting,daylight:daylight.snapshot()}),
  onQuality(){quality.choose(saved.quality);renderer.setPixelRatio(quality.pixelRatio(devicePixelRatio));resize();},
  restore(f){
   for(const key of['season','weather','theme','natureVolume','footstepsVolume',...SOUND_LAYERS])saved[key]=f[key];
   saved.daylightAuto=false;saved.weatherAuto=false;weather.setAutomatic(false);weather.choose(f.weather,true);daylight.setAutomatic(false);daylight.choose(f.daylight);
   landscape.setSeason(f.season);landscape.setWeather(weather.snapshot());landscape.setDaylight(f.daylight);$('seasonSelect').value=f.season;
   document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===f.theme)));
   for(const key of['natureVolume','footstepsVolume',...SOUND_LAYERS]){$(key).value=Math.round(saved[key]*100);$(key).dispatchEvent(new Event('input'));}
   audio.setMix(saved.natureVolume,saved.footstepsVolume,saved);weatherUi();arrive(f.place);if(f.sitting)toggleSit();save();
  }});visit.update(activePlace);
 // Compile once before enabling entry, avoiding a shader compilation stall mid-walk.
 renderer.compile(scene,camera);renderer.render(scene,camera);$('enterButton').disabled=false;$('woodlandEntry').disabled=false;$('enterButton').textContent='Begin your garden walk  →';document.body.dataset.gardenReady='true';requestAnimationFrame(frame);
}
