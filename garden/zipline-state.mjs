import {LOOKOUT,world} from './lookout-layout.mjs';
import {terrainHeight,nearestRoute} from './walk-route.mjs';
const start=world(2.5,8,-3.2),end={x:3,z:28};
end.y=Math.max(...[-2,2].flatMap(x=>[-2,2].map(z=>terrainHeight(end.x+x,end.z+z))))+.12;
export const ZIPLINE={start,end,eyeHeight:1.67,hang:2.92,sag:1.6,maxSpeed:6,brake:1.7};
export const ZIP_JOIN=nearestRoute(end.x,end.z).point;
export function cablePoint(t){t=Math.max(0,Math.min(1,t));return {x:start.x+(end.x-start.x)*t,y:start.y+ZIPLINE.hang+(end.y-start.y)*t-4*ZIPLINE.sag*t*(1-t),z:start.z+(end.z-start.z)*t};}
const table=[{...cablePoint(0),distance:0}];
for(let i=1;i<=500;i++){const p=cablePoint(i/500),a=table[i-1];table.push({...p,distance:a.distance+Math.hypot(p.x-a.x,p.y-a.y,p.z-a.z)});}
ZIPLINE.length=table.at(-1).distance;
export function zipSample(distance){const d=Math.max(0,Math.min(ZIPLINE.length,distance));let lo=0,hi=table.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(table[mid].distance<d)lo=mid;else hi=mid;}const a=table[lo],b=table[hi],t=(d-a.distance)/(b.distance-a.distance);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,slope:(b.y-a.y)/(b.distance-a.distance),yaw:Math.atan2(start.x-end.x,start.z-end.z)};}
// This is a constrained virtual trolley: gravity down the cable, rolling
// resistance, drag, a speed governor, then a distance-based end brake.
export function zipJourney(){let distance=0,speed=0,remainder=0,done=false;const tick=1/120;
 const snapshot=()=>({distance,speed,done,...zipSample(distance)});
 return {snapshot,advance(dt){remainder+=Math.max(0,Math.min(.5,Number.isFinite(dt)?dt:0));while(remainder+1e-9>=tick&&!done){remainder-=tick;const p=zipSample(distance),remaining=ZIPLINE.length-distance,gravity=-9.81*p.slope,rolling=.015*9.81*Math.sqrt(1-p.slope*p.slope);speed=Math.max(0,speed+(gravity-rolling-.012*speed*speed)*tick);speed=Math.min(speed,ZIPLINE.maxSpeed,Math.sqrt(2*ZIPLINE.brake*remaining));distance=Math.min(ZIPLINE.length,distance+speed*tick);if(ZIPLINE.length-distance<.00001){distance=ZIPLINE.length;speed=0;done=true;}}return snapshot();}};
}
export function zipClearing(x,z,padding=0){const dx=end.x-start.x,dz=end.z-start.z,t=Math.max(0,Math.min(1,((x-start.x)*dx+(z-start.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-start.x-dx*t,z-start.z-dz*t)<1.7+padding;}
export function landingClearing(x,z,padding=0){return Math.hypot(x-end.x,z-end.z)<4+padding;}
export function landingSupport(x,z,previous){const dx=ZIP_JOIN.x-end.x,dz=ZIP_JOIN.z-end.z,t=Math.max(0,Math.min(1,((x-end.x)*dx+(z-end.z)*dz)/(dx*dx+dz*dz))),onDeck=Math.abs(x-end.x)<=1.9&&Math.abs(z-end.z)<=1.9,onSpur=Math.hypot(x-end.x-dx*t,z-end.z-dz*t)<.95;const h=onDeck?end.y:onSpur?end.y+(terrainHeight(ZIP_JOIN.x,ZIP_JOIN.z)+.04-end.y)*t:null;return h!==null&&Math.abs(h-previous)<.26?h:null;}
