import {terrainHeight,nearestRoute} from './walk-route.mjs';
export const LOOKOUT={x:-43,z:-32,height:8};
LOOKOUT.base=Math.max(...[-3.3,3.3].flatMap(x=>[-4.2,4.2].map(z=>terrainHeight(LOOKOUT.x+x,LOOKOUT.z+z))))+.12;
export const world=(x,y,z)=>({x:LOOKOUT.x+x,y:LOOKOUT.base+y,z:LOOKOUT.z+z});
export const LOOKOUT_ENTRY=world(-1.7,0,-3.4);
export const LOOKOUT_TOP=world(-1.35,8,2.3);
const localSteps=[[-1.7,0,-3.4],[-1.7,0,-2.6],[-1.7,2,2.6],[-1.7,2,3.15],[1.7,2,3.15],[1.7,2,2.6],[1.7,4,-2.6],[1.7,4,-3.15],[-1.7,4,-3.15],[-1.7,4,-2.6],[-1.7,6,2.6],[-1.7,6,3.15],[1.7,6,3.15],[1.7,6,2.6],[1.7,8,-2.6],[1.7,8,-3.15],[-1.35,8,-3.15],[-1.35,8,2.3]];
export const LOOKOUT_STAIRS=localSteps.map(p=>world(...p));
export const LOOKOUT_JOIN=nearestRoute(LOOKOUT_ENTRY.x,LOOKOUT_ENTRY.z).point;
function spurPoint(x,z){const a=LOOKOUT_JOIN,b=LOOKOUT_ENTRY,dx=b.x-a.x,dz=b.z-a.z,q=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));return {q,distance:Math.hypot(x-a.x-dx*q,z-a.z-dz*q)};}
export function lookoutClearing(x,z,padding=0){return Math.abs(x-LOOKOUT.x)<6+padding&&Math.abs(z-LOOKOUT.z)<7+padding||spurPoint(x,z).distance<2+padding;}
export function lookoutZone(x,z){return Math.abs(x-LOOKOUT.x)<3.35&&Math.abs(z-LOOKOUT.z)<4.1;}
export function spurHeight(x,z){const p=spurPoint(x,z);if(p.distance>1.05)return null;const t=p.q*p.q*(3-2*p.q);return terrainHeight(LOOKOUT_JOIN.x,LOOKOUT_JOIN.z)+.04+(LOOKOUT.base-terrainHeight(LOOKOUT_JOIN.x,LOOKOUT_JOIN.z)-.04)*t;}
// Overlapping stair flights are selected by current foot height, not x/z alone.
export function lookoutSupport(x,z,previous){
 const u=x-LOOKOUT.x,v=z-LOOKOUT.z,ys=[],inRange=(n,a,b)=>n>=a-1e-6&&n<=b+1e-6;
 if(inRange(u,-2.8,2.8)&&inRange(v,-3.7,-2.6))ys.push(LOOKOUT.base,LOOKOUT.base+4,LOOKOUT.base+8);
 if(inRange(u,-2.8,2.8)&&inRange(v,2.6,3.7))ys.push(LOOKOUT.base+2,LOOKOUT.base+6);
 if(inRange(v,-2.6,2.6)){
  if(inRange(u,-2.65,-.75))ys.push(LOOKOUT.base+(v+2.6)/5.2*2,LOOKOUT.base+4+(v+2.6)/5.2*2);
  if(inRange(u,.75,2.65))ys.push(LOOKOUT.base+2+(2.6-v)/5.2*2,LOOKOUT.base+6+(2.6-v)/5.2*2);
 }
 // The top deck keeps the final stair opening clear and has an inset boundary.
 if(inRange(u,-2.8,2.8)&&inRange(v,-3.7,3.7)&&!(u>.5&&u<2.85&&v>-2.6&&v<2.85))ys.push(LOOKOUT.base+8);
 const ground=spurHeight(x,z);if(ground!==null)ys.push(ground);
 return ys.filter(y=>Math.abs(y-previous)<.26&&!(y>LOOKOUT.base+7.9&&Math.hypot(u-.35,v-.8)<.28)).sort((a,b)=>Math.abs(a-previous)-Math.abs(b-previous))[0]??null;
}
export function stairJourney(reverse=false){const points=reverse?[...LOOKOUT_STAIRS].reverse():LOOKOUT_STAIRS;const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y,p.z-points[i].z)),length=lengths.reduce((a,b)=>a+b,0);
 return {length,at(distance){let d=Math.max(0,Math.min(length,distance));for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const t=Math.min(1,d/lengths[i]),a=points[i],b=points[i+1];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,yaw:Math.atan2(a.x-b.x,a.z-b.z)};}d-=lengths[i];}}};
}
