import * as T from 'three';
import {PEBBLE_RADIUS} from './pebble-physics.mjs';
// Static collision proxies include both sides of thin rails and the sloping bank.
export function stoneCollisions(objects) {
 const material=new T.MeshBasicMaterial({side:T.DoubleSide});
 const cells=new Map(),v=new T.Vector3(),matrix=new T.Matrix4(),instance=new T.Matrix4();
 // Partition local triangles once: no whole-landscape raycasts during a throw.
 for(const object of objects){const geometry=object.geometry,index=geometry.index,position=geometry.attributes.position;
  for(let n=0;n<(object.isInstancedMesh?object.count:1);n++){
   matrix.copy(object.matrixWorld);if(object.isInstancedMesh){object.getMatrixAt(n,instance);matrix.multiply(instance);}
   for(let i=0;i<(index?index.count:position.count);i+=3){const points=[];
    for(let j=0;j<3;j++){v.fromBufferAttribute(position,index?index.getX(i+j):i+j).applyMatrix4(matrix);points.push(v.clone());}
    const centre=points[0].clone().add(points[1]).add(points[2]).divideScalar(3);
    if(Math.hypot(centre.x-5,centre.z-1)>32)continue;
    const key=`${Math.floor(centre.x/2)},${Math.floor(centre.z/2)}`;if(!cells.has(key))cells.set(key,[]);
    for(const point of points)cells.get(key).push(point.x,point.y,point.z);
   }
  }
 }
 const proxies=[...cells.values()].map(points=>{const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));geometry.computeBoundingBox();geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,material);mesh.updateMatrixWorld();return {mesh,box:geometry.boundingBox.clone().expandByScalar(PEBBLE_RADIUS)};});
 const ray=new T.Raycaster(),a=new T.Vector3(),b=new T.Vector3(),direction=new T.Vector3(),probe=new T.Vector3();
 const offsets=[[0,0,0],[PEBBLE_RADIUS,0,0],[-PEBBLE_RADIUS,0,0],[0,PEBBLE_RADIUS,0],[0,-PEBBLE_RADIUS,0],[0,0,PEBBLE_RADIUS],[0,0,-PEBBLE_RADIUS]];
 return (from,to)=>{
  a.set(from.x,from.y,from.z);b.set(to.x,to.y,to.z);direction.subVectors(b,a);const length=direction.length();if(length<1e-9)return null;direction.divideScalar(length);let closest=Infinity;
  for(const {mesh,box} of proxies){
   ray.set(a,direction);if(!box.containsPoint(a)&&(!ray.ray.intersectBox(box,probe)||probe.distanceTo(a)>length+PEBBLE_RADIUS))continue;
   for(const offset of offsets){ray.set(probe.copy(a).add(new T.Vector3(...offset)),direction);ray.near=0;ray.far=length;const hit=ray.intersectObject(mesh,false)[0];if(hit)closest=Math.min(closest,hit.distance/length);}
  }
  return Number.isFinite(closest)?closest:null;
 };
}
