import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {LOOKOUT,LOOKOUT_ENTRY,LOOKOUT_JOIN,world} from './lookout-layout.mjs';
import {terrainHeight} from './walk-route.mjs';
export function createLookout(scene,wood,metal){
 const root=new T.Group();root.name='Woodland lookout tower';scene.add(root);
 const timber=[],dark=[],decks=[],lights=[];
 const pale=wood.clone();pale.color.set('#c7b18c');const rail=wood.clone();rail.color.set('#a68b66');
 function box(list,w,h,d,x,y,z,angle=0){const g=new T.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x+LOOKOUT.x,y+LOOKOUT.base,z+LOOKOUT.z);list.push(g);}
 function beam(list,a,b,w=.13,d=w){const p=new T.Vector3(a.x,a.y,a.z),q=new T.Vector3(b.x,b.y,b.z),delta=q.clone().sub(p),g=new T.BoxGeometry(w,delta.length(),d);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...p.add(q).multiplyScalar(.5));list.push(g);}
 function localBeam(list,a,b,w=.13,d=w){beam(list,world(...a),world(...b),w,d);}
 function floor(x1,x2,z1,z2,y){for(let z=z1;z<z2-.01;z+=.21){const depth=Math.min(.2,z2-z);box(decks,x2-x1,.13,depth,(x1+x2)/2,y-.065,z+depth/2);}box(timber,.18,.24,z2-z1,x1+.1,y-.22,(z1+z2)/2);box(timber,.18,.24,z2-z1,x2-.1,y-.22,(z1+z2)/2);}
 function fence(a,b){localBeam(timber,[a[0],a[1]+1.08,a[2]],[b[0],b[1]+1.08,b[2]],.12);localBeam(timber,[a[0],a[1]+.55,a[2]],[b[0],b[1]+.55,b[2]],.07);
  const count=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.5);for(let i=0;i<=count;i++){const t=i/count;box(timber,.065,.99,.065,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+.5,a[2]+(b[2]-a[2])*t);}}
 // Six substantial posts and cross-bracing frame an open timber stair tower.
 for(const x of[-3.05,3.05])for(const z of[-3.95,0,3.95]){const ground=terrainHeight(LOOKOUT.x+x,LOOKOUT.z+z)-LOOKOUT.base;box(timber,.29,9.2-ground,.29,x,(9.2+ground)/2,z);box(dark,.36,.24,.36,x,.1,z);}
 for(const x of[-3.05,3.05])for(const y of[0,4]){localBeam(timber,[x,y+.2,-3.9],[x,y+3.8,3.9],.18);localBeam(timber,[x,y+.2,3.9],[x,y+3.8,-3.9],.18);}
 for(const z of[-3.95,3.95])localBeam(timber,[-3,2.25,z],[3,3.7,z],.17);
 floor(-3,3,-3.95,-2.6,0);
 for(let flight=0;flight<4;flight++){
  const left=flight%2===0,x=left?-1.7:1.7,y=flight*2,start=left?-2.6:2.6,end=-start;
  for(let i=0;i<12;i++){const z=start+(end-start)*(i+.5)/12;box(decks,2.2,(i+1)*2/12-i*2/12+.04,5.2/12-.012,x,y+(i+.5)*2/12-.02,z);}
  for(const side of[-1,1]){const xx=x+side*1.1;localBeam(timber,[xx,y-.2,start],[xx,y+1.8,end],.18,.24);fence([xx,y,start],[xx,y+2,end]);}
  const far=left;floor(-3,3,far?2.6:-3.95,far?3.95:-2.6,y+2);
  fence([-3,y+2,far?3.95:-3.95],[3,y+2,far?3.95:-3.95]);
  for(const side of[-3,3])fence([side,y+2,far?2.6:-3.95],[side,y+2,far?3.95:-2.6]);
 }
 // A continuous left deck and rear deck surround the stairwell at the top.
 floor(-3,.5,-2.6,3.95,8);floor(.5,3,2.85,3.95,8);
 fence([-3,8,-3.95],[-3,8,3.95]);fence([3,8,-2.15],[3,8,3.95]);fence([-3,8,3.95],[3,8,3.95]);
 fence([.5,8,-2.6],[.5,8,2.85]);fence([.5,8,2.85],[3,8,2.85]);
 // Roof over the rear half of the lookout, leaving its viewing edge open.
 for(const x of[-3.05,.35])for(const z of[.8,3.95])box(timber,.16,2.6,.16,x,9.3,z);
 const roofMat=new T.MeshStandardMaterial({color:'#596357',roughness:.98});
 for(const side of[-1,1]){const g=new T.BoxGeometry(1.95,.12,3.6);g.rotateZ(side*.23);g.translate(LOOKOUT.x-1.35+side*.93,LOOKOUT.base+10.55,LOOKOUT.z+2.4);const m=new T.Mesh(g,roofMat);m.castShadow=true;root.add(m);}
 // Warm, restrained lanterns on the entrance and top posts.
 for(const [x,y,z]of[[-2.9,1.25,-3.8],[-2.9,9.3,3.8],[2.9,9.3,-3.8]]){
  box(dark,.19,.3,.19,x,y,z);const bulb=new T.Mesh(new T.BoxGeometry(.13,.18,.13),new T.MeshStandardMaterial({color:'#edd6a8',emissive:'#ffd094',emissiveIntensity:.6}));bulb.position.set(LOOKOUT.x+x,LOOKOUT.base+y,LOOKOUT.z+z);root.add(bulb);lights.push(bulb);
 }
 for(const [geometries,material,name]of[[timber,rail,'Lookout posts and rails'],[decks,pale,'Lookout stairs and decks'],[dark,metal,'Lookout metalwork']]){const m=new T.Mesh(mergeGeometries(geometries),material);m.name=name;m.castShadow=m.receiveShadow=true;root.add(m);}
 // A gently graded plank spur joins the unchanged garden loop.
 const a=LOOKOUT_JOIN,b=LOOKOUT_ENTRY,dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),planks=[];
 for(let d=0;d<length;d+=.22){const t=(d+.1)/length,q=t*t*(3-2*t),y=terrainHeight(a.x,a.z)+.04+(LOOKOUT.base-terrainHeight(a.x,a.z)-.04)*q;const g=new T.BoxGeometry(2.15,.1,.21);g.rotateY(yaw);g.translate(a.x+dx*t,y-.05,a.z+dz*t);planks.push(g);
  for(const side of[-1,1]){const x=a.x+dx*t+Math.cos(yaw)*side*.95,z=a.z+dz*t-Math.sin(yaw)*side*.95;const beam=new T.BoxGeometry(.12,.24,.22);beam.rotateY(yaw);beam.translate(x,y-.18,z);planks.push(beam);if(Math.round(d/.22)%9===0){const ground=terrainHeight(x,z),h=Math.max(.08,y-ground);const post=new T.BoxGeometry(.12,h,.12);post.translate(x,ground+h/2-.05,z);planks.push(post);}}
 }
 const spur=new T.Mesh(mergeGeometries(planks),pale);spur.name='Lookout approach';spur.receiveShadow=true;root.add(spur);
 const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=192;const c=signCanvas.getContext('2d');c.fillStyle='#284537';c.fillRect(0,0,512,192);c.strokeStyle='#c3b28a';c.lineWidth=4;c.strokeRect(12,12,488,168);c.fillStyle='#f0e1be';c.textAlign='center';c.font='32px Georgia';c.fillText('The woodland lookout',256,82);c.font='20px sans-serif';c.fillText('Take the stairs. Enjoy the view.',256,126);const texture=new T.CanvasTexture(signCanvas);texture.colorSpace=T.SRGBColorSpace;
 const sign=new T.Mesh(new T.PlaneGeometry(2,.75),new T.MeshStandardMaterial({map:texture,roughness:1,side:T.DoubleSide}));sign.position.set(LOOKOUT_ENTRY.x-2,terrainHeight(LOOKOUT_ENTRY.x-2,LOOKOUT_ENTRY.z-4)+1.35,LOOKOUT_ENTRY.z-4);const signPost=new T.Mesh(new T.BoxGeometry(.12,1.65,.12),rail);signPost.position.set(sign.position.x,sign.position.y-.52,sign.position.z);signPost.castShadow=true;root.add(signPost);sign.rotation.y=Math.atan2(LOOKOUT_JOIN.x-sign.position.x,LOOKOUT_JOIN.z-sign.position.z);signPost.position.x-=Math.sin(sign.rotation.y)*.16;signPost.position.z-=Math.cos(sign.rotation.y)*.16;root.add(sign);
 const gate=new T.Group();gate.name='Zip-line launch gate';gate.position.set(LOOKOUT.x+3,LOOKOUT.base+8,LOOKOUT.z-3.95);root.add(gate);
 for(const y of[.55,1.08]){const m=new T.Mesh(new T.BoxGeometry(.09,.09,1.8),rail);m.position.set(0,y,.9);gate.add(m);}for(let z=.15;z<1.8;z+=.35){const m=new T.Mesh(new T.BoxGeometry(.06,1,.06),rail);m.position.set(0,.5,z);gate.add(m);}
 return {root,setGate(open){gate.rotation.y=open?Math.PI/2:0;},setLight(value){lights.forEach(m=>m.material.emissiveIntensity=.25+value*.65);}};
}
