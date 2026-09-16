import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ZIPLINE,ZIP_JOIN,cablePoint,zipSample} from './zipline-state.mjs';
import {LOOKOUT} from './lookout-layout.mjs';
import {terrainHeight} from './walk-route.mjs';
export function createZipline(scene,wood,metal){
 const root=new T.Group();root.name='Garden zip line';scene.add(root);const timber=[],steel=[],up=new T.Vector3(0,1,0),obstacles=[];
 const mat=wood.clone();mat.color.set('#c5ad83');
 function beam(list,a,b,r=.12){const p=new T.Vector3(a.x,a.y,a.z),q=new T.Vector3(b.x,b.y,b.z),v=q.clone().sub(p),g=new T.BoxGeometry(r,v.length(),r);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,v.normalize()));g.translate(...p.add(q).multiplyScalar(.5));list.push(g);}
 function box(list,w,h,d,x,y,z){const g=new T.BoxGeometry(w,h,d);g.translate(x,y,z);list.push(g);}
 const direction=new T.Vector3(ZIPLINE.end.x-ZIPLINE.start.x,0,ZIPLINE.end.z-ZIPLINE.start.z).normalize(),normal=new T.Vector3(direction.z,0,-direction.x);
 for(const [point,launch]of[[ZIPLINE.start,true],[ZIPLINE.end,false]]){const y=point.y+ZIPLINE.hang+.22,posts=[];for(const side of[-1,1]){const p=launch?{x:LOOKOUT.x+3.05*side,z:LOOKOUT.z-3.95}:{x:point.x+normal.x*1.35*side,z:point.z+normal.z*1.35*side},base=launch?point.y:terrainHeight(p.x,p.z);beam(timber,{...p,y:base},{...p,y},.2);box(steel,.26,.18,.26,p.x,base+.09,p.z);posts.push({...p,y});if(!launch)obstacles.push({...p,r:.32});}beam(timber,posts[0],posts[1],.24);if(launch)beam(steel,{x:point.x,y,z:LOOKOUT.z-3.95},{x:point.x,y:point.y+ZIPLINE.hang,z:point.z},.1);for(const side of[-1,1]){const a=posts[side===-1?0:1];beam(timber,{...a,y:y-.8},{x:point.x+normal.x*.5*side,y,z:point.z+normal.z*.5*side},.1);}}
 class Cable extends T.Curve{getPoint(t,target=new T.Vector3()){const p=cablePoint(t);return target.set(p.x,p.y,p.z);}}
 const cable=new T.Mesh(new T.TubeGeometry(new Cable(),240,.018,6,false),metal);cable.name='Zip-line cable';root.add(cable);
 const end=ZIPLINE.end;for(let z=-2;z<2;z+=.2)box(timber,4,.12,.19,end.x,end.y-.06,end.z+z+.095);
 for(const side of[-1,1])box(timber,.16,.2,4,end.x+side*1.8,end.y-.16,end.z);
 const dx=ZIP_JOIN.x-end.x,dz=ZIP_JOIN.z-end.z,len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);
 for(let d=0;d<len;d+=.2){const t=d/len,g=new T.BoxGeometry(2,.1,.19);g.rotateY(angle);g.translate(end.x+dx*t,end.y+(terrainHeight(ZIP_JOIN.x,ZIP_JOIN.z)+.04-end.y)*t-.05,end.z+dz*t);timber.push(g);}
 // A visible braking sleeve occupies the final eleven metres of cable.
 for(let d=ZIPLINE.length-11;d<ZIPLINE.length-.5;d+=.22){const p=zipSample(d),ring=new T.TorusGeometry(.075,.017,5,10);ring.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(direction.x,p.slope,direction.z).normalize()));ring.translate(p.x,p.y,p.z);steel.push(ring);}
 for(const [geos,m,name]of[[timber,mat,'Zip-line timber supports and landing'],[steel,metal,'Zip-line fittings and brake']]){const mesh=new T.Mesh(mergeGeometries(geos),m);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
 const trolley=new T.Group();trolley.name='Zip-line trolley';root.add(trolley);const shell=new T.Mesh(new T.BoxGeometry(.15,.16,.32),metal);shell.position.y=-.13;trolley.add(shell);
 for(const z of[-.105,.105]){const wheel=new T.Mesh(new T.CylinderGeometry(.085,.085,.12,12),metal);wheel.rotation.z=Math.PI/2;wheel.position.set(0,.04,z);trolley.add(wheel);}
 const straps=[];const strapMat=new T.MeshStandardMaterial({color:'#56674b',roughness:1});for(const side of[-1,1]){const strap=new T.Mesh(new T.BoxGeometry(.035,1.45,.035),strapMat);strap.position.set(side*.22,-.95,0);trolley.add(strap);straps.push(strap);}
 const badge=document.createElement('canvas');badge.width=512;badge.height=192;const c=badge.getContext('2d');c.fillStyle='#234136';c.fillRect(0,0,512,192);c.fillStyle='#ead8ae';c.textAlign='center';c.font='34px Georgia';c.fillText('The garden glide',256,75);c.font='21px sans-serif';c.fillText('A quiet journey through the trees',256,124);const texture=new T.CanvasTexture(badge);texture.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(1.3,.49),new T.MeshStandardMaterial({map:texture,side:T.DoubleSide,roughness:1}));sign.position.set(ZIPLINE.start.x-.1,ZIPLINE.start.y+1.2,ZIPLINE.start.z-.63);sign.rotation.y=Math.PI;root.add(sign);
 function update(distance=0,riding=false){const p=zipSample(distance);trolley.position.set(p.x,p.y,p.z);trolley.rotation.y=p.yaw;straps.forEach(s=>s.visible=!riding);}
 update();return {root,obstacles,update};
}
