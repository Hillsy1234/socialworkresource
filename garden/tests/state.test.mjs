import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanSave,safeReturnPath,MAX_ADDITIONS} from '../state.mjs';
test('saved data cannot introduce invalid themes, objects, coordinates or progress',()=>{
 const result=cleanSave({theme:'unknown',still:'yes',blooms:[0,0,2,6,-1,'3'],additions:[{type:'script',x:0,z:0},{type:'plant',x:Infinity,z:0},{type:'stone',x:900,z:0},{type:'lantern',x:1,z:2,extra:'not kept'}]});
 assert.deepEqual(result,{theme:'sunset',still:false,blooms:[0,2],additions:[{type:'lantern',x:1,z:2}]});
 assert.deepEqual(cleanSave(null),{theme:'sunset',still:false,blooms:[],additions:[]});
});
test('garden restores all six blooms and limits stored additions',()=>{
 const result=cleanSave({theme:'night',still:true,blooms:[0,1,2,3,4,5],additions:Array(100).fill({type:'plant',x:1,z:2})});
 assert.equal(result.blooms.length,6);assert.equal(result.additions.length,MAX_ADDITIONS);assert.equal(result.theme,'night');assert.equal(result.still,true);
});
test('return navigation accepts only the learning page on this origin',()=>{
 const origin='https://social-work-resource.netlify.app';
 assert.equal(safeReturnPath('/?jurisdiction=wales&resource=cpd-log#readerSection',origin),'/?jurisdiction=wales&resource=cpd-log#readerSection');
 for(const path of ['https://example.com/','//example.com/','javascript:alert(1)','/community/','/garden/'])assert.equal(safeReturnPath(path,origin),'/');
});
