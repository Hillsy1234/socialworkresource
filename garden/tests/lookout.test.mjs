import test from 'node:test';
import assert from 'node:assert/strict';
import {LOOKOUT,LOOKOUT_ENTRY,LOOKOUT_TOP,LOOKOUT_JOIN,lookoutSupport,spurHeight,stairJourney,world} from '../lookout-layout.mjs';

for(const reverse of [false,true])test(`Lookout stairs support continuous ${reverse?'descent':'ascent'} without switching floors`,()=>{
 const journey=stairJourney(reverse);let previous=journey.at(0).y;
 for(let d=0;d<=journey.length;d+=.035){const p=journey.at(d),h=lookoutSupport(p.x,p.z,previous);assert.notEqual(h,null,`Unsupported at ${d}`);assert.ok(Math.abs(h-p.y)<.12,`Wrong floor at ${d}`);previous=h;}
 const end=journey.at(journey.length),expected=reverse?LOOKOUT_ENTRY:LOOKOUT_TOP;
 for(const axis of ['x','y','z'])assert.ok(Math.abs(end[axis]-expected[axis])<1e-9);
});
test('Lookout upper floor does not allow stepping through the outer rails or stairwell',()=>{
 for(const local of [[3.2,8,0],[-3.2,8,0],[0,8,4],[1.7,8,0],[.35,8,.8]]){const p=world(...local);assert.equal(lookoutSupport(p.x,p.z,p.y),null);}
 const p=world(-1.7,1,0);assert.ok(Math.abs(lookoutSupport(p.x,p.z,p.y)-p.y)<1e-9);assert.ok(Math.abs(lookoutSupport(p.x,p.z,p.y+4)-p.y-4)<1e-9);
});
test('Lookout approach joins the base at a continuous walking grade',()=>{
 let previous=spurHeight(LOOKOUT_JOIN.x,LOOKOUT_JOIN.z);
 for(let t=0;t<=1;t+=.01){const x=LOOKOUT_JOIN.x+(LOOKOUT_ENTRY.x-LOOKOUT_JOIN.x)*t,z=LOOKOUT_JOIN.z+(LOOKOUT_ENTRY.z-LOOKOUT_JOIN.z)*t,h=spurHeight(x,z);assert.notEqual(h,null);assert.ok(Math.abs(h-previous)<.1);previous=h;}
 assert.ok(Math.abs(spurHeight(LOOKOUT_ENTRY.x,LOOKOUT_ENTRY.z)-LOOKOUT.base)<1e-9);
});
