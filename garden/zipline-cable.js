import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ZIPLINE,cablePoint,zipSample} from './zipline-state.mjs';

// Use the ride's curve for both the distant cable and the close strand detail.
const lay=.16,coreRadius=.0085,strandRadius=.0032,strandOrbit=.0075;
const direction=new T.Vector3(ZIPLINE.end.x-ZIPLINE.start.x,0,ZIPLINE.end.z-ZIPLINE.start.z).normalize();
const across=new T.Vector3(direction.z,0,-direction.x),up=new T.Vector3(0,1,0);
function frame(distance){
 const p=zipSample(distance),horizontal=Math.sqrt(1-p.slope*p.slope);
 const tangent=new T.Vector3(direction.x*horizontal,p.slope,direction.z*horizontal);
 return {point:new T.Vector3(p.x,p.y,p.z),tangent,binormal:new T.Vector3().crossVectors(tangent,across)};
}

export function createZiplineCable(root,renderer){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const ridge=Math.pow(.5+.5*Math.cos(Math.PI*12*(y-x)/256),.45);
  const grain=Math.sin(x*127.1+y*311.7)*Math.sin(x*17.3-y*43.9);
  const shade=147+ridge*72+grain*9,i=(y*256+x)*4;
  pixels.data.set([shade,shade+2,shade+3,255],i);
 }
 ctx.putImageData(pixels,0,0);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(ZIPLINE.length/lay,1);
 map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const bump=map.clone();bump.colorSpace=T.NoColorSpace;
 const cableMaterial=new T.MeshStandardMaterial({map,bumpMap:bump,bumpScale:.0008,metalness:.48,roughness:.48});
 class Cable extends T.Curve{getPoint(t,target=new T.Vector3()){const p=cablePoint(t);return target.set(p.x,p.y,p.z);}}
 const cable=new T.Mesh(new T.TubeGeometry(new Cable(),320,coreRadius,12,false),cableMaterial);
 cable.name='Zip-line cable';cable.castShadow=true;root.add(cable);

 // One reusable patch follows the nearest part of the cable. Its geometry and
 // buffers stay allocated; the full span only needs the textured smooth tube.
 const segments=384,sides=5,patchLength=6.4,vertices=6*(segments+1)*(sides+1);
 const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3),indices=[];
 for(let strand=0;strand<6;strand++)for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){
  const a=(strand*(segments+1)+i)*(sides+1)+j,b=a+sides+1;
  indices.push(a,a+1,b,b,a+1,b+1);
 }
 const geometry=new T.BufferGeometry();geometry.setIndex(indices);
 geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));
 geometry.setAttribute('normal',new T.BufferAttribute(normals,3).setUsage(T.DynamicDrawUsage));
 const strandMaterial=new T.MeshStandardMaterial({color:'#bfc3c4',metalness:.48,roughness:.5});
 const detail=new T.Mesh(geometry,strandMaterial);detail.name='Zip-line twisted steel strands';detail.visible=false;root.add(detail);
 const radial=new T.Vector3(),side=new T.Vector3(),helix=new T.Vector3(),n=new T.Vector3(),v=new T.Vector3();
 let lastStart=-Infinity;
 function updateDetail(camera){
  // Project onto the horizontal span, then sample the same arc-length table
  // used by the trolley; vertical distance excludes visitors on the ground.
  const span=Math.hypot(ZIPLINE.end.x-ZIPLINE.start.x,ZIPLINE.end.z-ZIPLINE.start.z);
  const t=T.MathUtils.clamp(((camera.position.x-ZIPLINE.start.x)*direction.x+(camera.position.z-ZIPLINE.start.z)*direction.z)/span,0,1);
  const p=cablePoint(t);detail.visible=camera.position.distanceTo(v.set(p.x,p.y,p.z))<7;
  if(!detail.visible)return;
  let lo=0,hi=ZIPLINE.length;
  for(let i=0;i<14;i++){const mid=(lo+hi)/2,q=zipSample(mid);if((q.x-ZIPLINE.start.x)*direction.x+(q.z-ZIPLINE.start.z)*direction.z<t*span)lo=mid;else hi=mid;}
  const start=T.MathUtils.clamp((lo+hi)/2-patchLength*.35,0,ZIPLINE.length-patchLength);
  if(Math.abs(start-lastStart)<.25)return;lastStart=start;
  for(let i=0;i<=segments;i++){
   const d=start+patchLength*i/segments,{point,tangent,binormal}=frame(d);
   const fade=T.MathUtils.smoothstep(Math.min(i,segments-i)/segments,0,.16);
   for(let strand=0;strand<6;strand++){
    const angle=2*Math.PI*(d/lay+strand/6);
    radial.copy(across).multiplyScalar(Math.cos(angle)).addScaledVector(binormal,Math.sin(angle));
    side.crossVectors(tangent,radial);
    helix.copy(tangent).addScaledVector(side,2*Math.PI*strandOrbit/lay).normalize();
    side.crossVectors(helix,radial).normalize();
    for(let j=0;j<=sides;j++){
     const angleAround=2*Math.PI*j/sides;
     n.copy(radial).multiplyScalar(Math.cos(angleAround)).addScaledVector(side,Math.sin(angleAround));
     v.copy(point).addScaledVector(radial,strandOrbit).addScaledVector(n,strandRadius*fade);
     const index=((strand*(segments+1)+i)*(sides+1)+j)*3;
     v.toArray(positions,index);n.toArray(normals,index);
    }
   }
  }
  geometry.attributes.position.needsUpdate=geometry.attributes.normal.needsUpdate=true;
  geometry.computeBoundingSphere();
 }

 // Swaged ends, eye fittings and bolted saddles sit beyond the trolley travel.
 const fittings=[],darkFittings=[];
 function cylinder(list,a,b,r,radialSegments=12){const delta=b.clone().sub(a),g=new T.CylinderGeometry(r,r,delta.length(),radialSegments);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,delta.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5));list.push(g);}
 for(const [distance,sign] of [[0,-1],[ZIPLINE.length,1]]){
  const {point,tangent}=frame(distance),out=tangent.multiplyScalar(sign),at=d=>point.clone().addScaledVector(out,d);
  cylinder(fittings,at(0),at(.19),.024);
  for(const d of [.035,.145])cylinder(darkFittings,at(d),at(d+.018),.028);
  const eye=new T.TorusGeometry(.061,.012,8,24);eye.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),across));eye.translate(...at(.24));fittings.push(eye);
  const mount=point.clone().add(new T.Vector3(0,sign<0?.15:.36,sign<0?-.35:0));
  const plate=new T.BoxGeometry(.19,.035,.24);plate.translate(...mount);darkFittings.push(plate);
  const pin=at(.24);cylinder(fittings,pin.clone().addScaledVector(across,-.08),pin.clone().addScaledVector(across,.08),.021);
  for(const side of [-1,1]){
   const a=pin.clone().addScaledVector(across,side*.085),b=mount.clone().addScaledVector(up,-.015).addScaledVector(across,side*.085);
   cylinder(darkFittings,a,b,.018);
   cylinder(fittings,b.clone().addScaledVector(up,-.012),b.clone().addScaledVector(up,.045),.025,6);
  }
 }
 for(const [parts,material,name] of [[fittings,strandMaterial,'Zip-line silver anchor fittings'],[darkFittings,new T.MeshStandardMaterial({color:'#687172',metalness:.55,roughness:.58}),'Zip-line bolted anchor saddles']]){
  const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());
  const mesh=new T.Mesh(merged,material);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 }
 return {updateDetail};
}
