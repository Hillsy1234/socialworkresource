import {stoneCollisions} from './stone-collisions.mjs';
import * as T from 'three';
import {flightTo,flightPoint,advanceFlight,PEBBLE_RADIUS,WATER_Y} from './pebble-physics.mjs';

export function pebbleToss({scene,camera,landscape,audio,announce,stopWalking}) {
 const $=id=>document.getElementById(id),collision=stoneCollisions(landscape.projectileColliders);
 // A small, irregular river pebble lit by the garden's actual sun and sky.
 const geometry=new T.IcosahedronGeometry(PEBBLE_RADIUS,2),vertices=geometry.attributes.position;
 for(let i=0;i<vertices.count;i++){
  const x=vertices.getX(i)/PEBBLE_RADIUS,y=vertices.getY(i)/PEBBLE_RADIUS,z=vertices.getZ(i)/PEBBLE_RADIUS;
  const uneven=1+.065*Math.sin(x*7+z*3)*Math.cos(y*8)+.035*Math.sin(z*11-y*4);
  vertices.setXYZ(i,x*PEBBLE_RADIUS*uneven,y*PEBBLE_RADIUS*.76*uneven,z*PEBBLE_RADIUS*.91*uneven);
 }
 geometry.computeVertexNormals();
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(128,128);let seed=419;
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  seed=(seed*16807)%2147483647;
  const grain=(seed/2147483647-.5)*15;
  const mottling=Math.sin(x*.15+Math.sin(y*.13)*2)*8+Math.cos(y*.21-x*.08)*6;
  const v=143+mottling+grain,i=(y*128+x)*4;
  pixels.data.set([v+5,v+3,v-5,255],i);
 }
 ctx.putImageData(pixels,0,0);
 const colour=new T.CanvasTexture(canvas);colour.colorSpace=T.SRGBColorSpace;
 const relief=new T.CanvasTexture(canvas);
 const stoneMaterial=new T.MeshStandardMaterial({color:'#a2a396',map:colour,bumpMap:relief,bumpScale:.002,roughness:.93,metalness:0});
 const stone=new T.Mesh(geometry,stoneMaterial);stone.name='Thrown pebble';stone.castShadow=true;stone.receiveShadow=true;stone.visible=false;scene.add(stone);
 const marker=new T.Mesh(new T.RingGeometry(.13,.17,32),new T.MeshBasicMaterial({color:'#f1dfb5',transparent:true,opacity:.7,depthWrite:false,side:T.DoubleSide}));marker.name='Pebble landing marker';marker.rotation.x=-Math.PI/2;marker.visible=false;marker.renderOrder=4;scene.add(marker);
 let armed=false,available=false,target=null,shot=null,age=0,impact=null;
 // Release just below the visible frame: the pebble rises into view as if
 // tossed from the visitor's own position, with no floating object or avatar.
 function origin(){camera.updateMatrixWorld(true);const p=new T.Vector3(.10,-.42,-.48).applyMatrix4(camera.matrixWorld);return {x:p.x,y:p.y,z:p.z};}
 function plan(point){const release=origin(),local=new T.Vector3(point.x,WATER_Y,point.z).applyMatrix4(camera.matrixWorldInverse);if(local.z>-.3)return null;const f=flightTo(release,point);return f&&advanceFlight(f,0,f.duration,collision)?.kind==='water'?f:null;}
 function defaultTarget(){
  // The central pond point gives keyboard and touch visitors a reachable target.
  for(const p of[{x:5,z:5},{x:5,z:2},{x:8,z:1},{x:2,z:1},{x:5,z:-3}])if(plan(p))return p;
  return null;
 }
 function ui(){
  const busy=armed||!!shot;document.body.classList.toggle('pebble-aiming',busy);$('walkHud').inert=busy||document.body.classList.contains('quiet-view');
  $('pebbleButton').hidden=!available||armed||!!shot;$('pebbleAim').hidden=!armed;
  $('pebbleButton').disabled=!!shot;$('pebbleButton').setAttribute('aria-expanded',String(armed));
  $('pebbleThrow').disabled=!target;marker.visible=armed&&!!target;
  if(target)marker.position.set(target.x,WATER_Y+.022,target.z);
  $('pebbleHint').textContent=target?'Tap a spot on the water, or use Gentle toss. Drag to look.':'Look toward open water and select a reachable spot.';
 }
 function cancelAim(){const returnFocus=armed&&$('pebbleAim').contains(document.activeElement);armed=false;target=null;marker.visible=false;ui();if(returnFocus&&available)$('pebbleButton').focus({preventScroll:true});}
 function reset(){cancelAim();shot=null;impact=null;stone.visible=false;ui();}
 $('pebbleButton').onclick=()=>{if(!available||shot)return;stopWalking();target=defaultTarget();armed=true;ui();announce('Choose a spot on the water, or press Gentle toss. Escape puts the pebble down.');$(target?'pebbleThrow':'pebbleCancel').focus({preventScroll:true});};
 function toss(point){if(!armed||shot)return false;const f=plan(point);if(!f){announce('That spot is blocked or beyond a gentle throw. Try open water closer to you.');return false;}shot=f;age=0;impact=null;armed=false;target=null;ui();return true;}
 $('pebbleThrow').onclick=()=>{if(target&&toss(target))$('world').querySelector('canvas').focus({preventScroll:true});};
 $('pebbleCancel').onclick=()=>{cancelAim();$('pebbleButton').focus({preventScroll:true});};
 return {get armed(){return armed;},get available(){return available;},cancelAim,reset,
  select(point){return toss(point);},
  refresh(enabled){const p=camera.position;available=enabled&&Math.hypot((p.x-5)/12,(p.z-1)/14)<1.25;if(!available&&armed)cancelAim();ui();},
  update(dt,still){
   if(still){if(shot||armed)reset();return;}
   if(!shot)return;
   const oldAge=age;age+=dt;
   if(!impact){
    const nextAge=age,hit=advanceFlight(shot,oldAge,nextAge,collision);
    const p=hit?.point||flightPoint(shot,nextAge);stone.visible=true;stone.position.set(p.x,p.y,p.z);stone.rotation.set(nextAge*3,nextAge*2,0);
    if(hit){impact=hit;if(hit.kind==='water'){landscape.pondWaves.impact(hit.point,hit.speed);audio.pebbleImpact(hit.point,hit.speed);announce('A small splash. Watch the ripples spread.');}else{stone.visible=false;announce('The pebble met the bank or bridge. Try another spot.');}}
   }
   if(impact){const t=age-impact.time;if(impact.kind==='water'){
    // Drag rapidly removes entry speed underwater; the dense pebble keeps sinking.
    stone.position.y=WATER_Y-PEBBLE_RADIUS-.18*t-.08*(1-Math.exp(-t*8));
    stone.position.x=impact.point.x+shot.velocity.x*.035*(1-Math.exp(-t*8));stone.position.z=impact.point.z+shot.velocity.z*.035*(1-Math.exp(-t*8));
    stone.visible=t<1.8;
   }if(t>1.8){shot=null;stone.visible=false;ui();}}
  }
 };
}
