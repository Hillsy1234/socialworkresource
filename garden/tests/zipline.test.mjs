import test from 'node:test';
import assert from 'node:assert/strict';
import {ZIPLINE,ZIP_JOIN,cablePoint,zipSample,zipJourney,landingSupport} from '../zipline-state.mjs';
import {terrainHeight} from '../walk-route.mjs';
test('The zip-line cable meets both platforms and sags below its chord',()=>{
 for(const [t,p]of[[0,ZIPLINE.start],[1,ZIPLINE.end]]){const c=cablePoint(t);assert.equal(c.x,p.x);assert.equal(c.z,p.z);assert.ok(Math.abs(c.y-ZIPLINE.hang-p.y)<1e-9);}
 assert.ok(Math.abs(cablePoint(.5).y-(cablePoint(0).y+cablePoint(1).y)/2+ZIPLINE.sag)<1e-9);
 for(let d=2;d<ZIPLINE.length;d+=.1){const p=zipSample(d);assert.ok(p.y-ZIPLINE.hang>terrainHeight(p.x,p.z)+.08,`Ground strike at ${d}`);}
});
test('The governed trolley is frame-rate independent, brakes and stops at the landing',()=>{
 const runs=[];for(const fps of[20,30,60,120]){const trip=zipJourney();let previous=0,max=0,braking=false;for(let frame=0;frame<fps*25&&!trip.snapshot().done;frame++){const p=trip.advance(1/fps);assert.ok(p.distance>=previous);assert.ok(p.speed<=ZIPLINE.maxSpeed);previous=p.distance;max=Math.max(max,p.speed);if(p.distance>ZIPLINE.length-2&&!p.done){assert.ok(p.speed<3);braking=true;}if(frame===fps*8-1)runs.push(p.distance);}const end=trip.snapshot();assert.equal(end.done,true);assert.equal(end.speed,0);assert.equal(end.distance,ZIPLINE.length);assert.ok(max>5&&braking);assert.ok(Math.abs(end.y-ZIPLINE.hang-ZIPLINE.end.y)<1e-9);}
 for(const d of runs)assert.ok(Math.abs(d-runs[0])<1e-7);
});
test('Paused time and invalid frame deltas cannot advance a trolley',()=>{const t=zipJourney();t.advance(2);const p=t.snapshot();assert.deepEqual(t.advance(0),p);assert.deepEqual(t.advance(NaN),p);assert.deepEqual(t.advance(-1),p);assert.ok(p.distance<1);});
test('Landing deck and exit remain walkable at their own height',()=>{let y=ZIPLINE.end.y;for(let t=0;t<=1;t+=.01){const x=ZIPLINE.end.x+(ZIP_JOIN.x-ZIPLINE.end.x)*t,z=ZIPLINE.end.z+(ZIP_JOIN.z-ZIPLINE.end.z)*t,h=landingSupport(x,z,y);assert.notEqual(h,null);assert.ok(Math.abs(h-y)<.26);y=h;}});
