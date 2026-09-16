import test from 'node:test';
import assert from 'node:assert/strict';
import {flightTo,flightPoint,advanceFlight,WATER_Y,PEBBLE_RADIUS,GRAVITY} from '../pebble-physics.mjs';
import {cleanWalkSave} from '../walk-route.mjs';
const origin={x:5,y:1.5,z:-10},target={x:5,z:1};
test('Standing and seated throws reach the water at the exact chosen point',()=>{
 for(const y of[1.1,1.67,2.1]){
  const f=flightTo({...origin,y},target),p=flightPoint(f,f.duration);
  assert.ok(Math.abs(p.x-target.x)<1e-9&&Math.abs(p.z-target.z)<1e-9);
  assert.ok(Math.abs(p.y-WATER_Y-PEBBLE_RADIUS)<1e-9);
  assert.ok(flightPoint(f,f.duration/2).y>y);
  assert.equal(flightPoint(f,.3).y,y+f.velocity.y*.3-GRAVITY*.3*.3/2);
 }
});
test('A throw has identical impact time, position and speed at 20, 30, 60 and 120 fps',()=>{
 const f=flightTo(origin,target),results=[];
 for(const fps of[20,30,60,120]){let hit=null,t=0;while(!hit){hit=advanceFlight(f,t,t+1/fps);t+=1/fps;}results.push(hit);}
 for(const result of results)assert.deepEqual(result,results[0]);
 assert.equal(results[0].kind,'water');assert.ok(results[0].speed>0);
});
test('A thin railing between frame positions intercepts the stone before water',()=>{
 const f=flightTo(origin,target),railZ=-5;
 const collide=(a,b)=>a.z<=railZ&&b.z>=railZ?(railZ-a.z)/(b.z-a.z):null;
 for(const fps of[20,30,60]){let hit=null,t=0;while(!hit){hit=advanceFlight(f,t,t+1/fps,collide);t+=1/fps;}
  assert.equal(hit.kind,'solid');assert.ok(hit.time<f.duration);assert.ok(Math.abs(hit.point.z-railZ)<1e-8);
 }
});
test('No water collision or splash is reported before actual surface contact',()=>{
 const f=flightTo(origin,target);assert.equal(advanceFlight(f,0,f.duration-.00001),null);
 assert.equal(advanceFlight(f,f.duration-.00001,f.duration).kind,'water');
});
test('Targets outside the pond, beyond gentle range and at the release point are rejected',()=>{
 assert.equal(flightTo(origin,{x:30,z:1}),null);
 assert.equal(flightTo({x:5,y:1,z:-30},target),null);
 assert.equal(flightTo({x:5,y:1,z:1},target),null);
 assert.equal(flightTo({x:5,y:-1,z:1},target),null);
 assert.equal(flightTo(origin,{x:13,z:1}),null);
});
test('Old hand preferences are discarded when restoring a visit',()=>{
 assert.equal('pebbleHand' in cleanWalkSave({pebbleHand:true}),false);
});

test('Actual swept mesh collision catches thin rails and the pebble edge',async()=>{
 const T=await import('three'),{stoneCollisions}=await import('../stone-collisions.mjs');
 const rail=new T.Mesh(new T.BoxGeometry(3,.05,.04));rail.position.set(0,1,0);rail.updateMatrixWorld(true);
 const collide=stoneCollisions([rail]);
 assert.ok(collide({x:0,y:1,z:-1},{x:0,y:1,z:1})<.5);
 assert.ok(collide({x:0,y:1.06,z:-1},{x:0,y:1.06,z:1})<.5);
 assert.equal(collide({x:0,y:1.2,z:-1},{x:0,y:1.2,z:1}),null);
 const reverse=collide({x:0,y:1,z:1},{x:0,y:1,z:-1});assert.ok(reverse<.5);
});
