import * as T from 'three';
import {route,places,terrainHeight} from './walk-route.mjs';

// Small local meshes, bounded in number; motion shares the garden's paused clock.
export function gardenWildlife(scene,mobile,flowerTargets=[],perches=[]){
 const creatures=[],petals=[];
 const mat=(color)=>new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide});
 const dark=mat('#403b2b'),cream=mat('#f0d198'),orange=mat('#c67f47'),wingBlue=mat('#779b9a');
 function mesh(g,geometry,material,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;}
 const sphere=new T.SphereGeometry(1,8,6);
 function butterfly(i){const g=new T.Group(),wings=[];mesh(g,sphere,dark,0,0,0,.018,.055,.018);for(const side of[-1,1]){const pivot=new T.Group();g.add(pivot);mesh(pivot,sphere,i%2?orange:cream,side*.07,.025,0,.085,.075,.008);mesh(pivot,sphere,i%2?cream:orange,side*.05,-.045,0,.06,.052,.008);wings.push(pivot);}const p=route.getPointAt(places[i%3===0?1:7].t);scene.add(g);creatures.push({g,wings,x:p.x+Math.sin(i*4)*3,z:p.z+Math.cos(i*4)*3,phase:i*2.3,kind:'butterfly'});}
 for(let i=0;i<(mobile?6:12);i++)butterfly(i);
 for(let i=0;i<(mobile?2:4);i++){const g=new T.Group(),wings=[];mesh(g,sphere,wingBlue,0,0,0,.025,.025,.19);for(const side of[-1,1]){const pivot=new T.Group();g.add(pivot);for(const z of[-.04,.04])mesh(pivot,sphere,cream,side*.12,0,z,.14,.004,.028);wings.push(pivot);}scene.add(g);creatures.push({g,wings,x:5+Math.sin(i*2)*6,z:1+Math.cos(i*2)*7,phase:i*2,kind:'dragonfly'});}
 for(let i=0;i<(mobile?3:5);i++){const g=new T.Group(),wings=[];mesh(g,sphere,dark,0,0,0,.1,.11,.2);mesh(g,sphere,orange,0,.04,.13,.08,.09,.10);mesh(g,new T.ConeGeometry(.03,.1,5),cream,0,.04,.23).rotation.x=Math.PI/2;for(const side of[-1,1]){const pivot=new T.Group();g.add(pivot);mesh(pivot,sphere,dark,side*.17,0,-.03,.22,.026,.09);wings.push(pivot);}const p=route.getPointAt(places[i%2?6:8].t);scene.add(g);creatures.push({g,wings,x:p.x+3.4,z:p.z+i,phase:i*4,kind:'bird'});}
 const petalMat=mat('#f1c9d8');for(let i=0;i<(mobile?28:55);i++){const m=new T.Mesh(new T.PlaneGeometry(.10,.07),petalMat);scene.add(m);petals.push(m);}
 const calls=[];
 const random=(a,b)=>a+(b-a)*Math.random();
 for(const c of creatures){
  c.home=new T.Vector3(c.x,terrainHeight(c.x,c.z)+.15,c.z);
  c.from=c.home.clone();c.target=c.home.clone();c.g.position.copy(c.home);
  c.start=0;c.duration=random(4,11);c.mode='rest';c.nextCall=random(4,14);
 }
 function destination(c,camera){
  if(c.kind==='bird'){
   const nearPerches=perches.filter(p=>Math.hypot(p.x-c.x,p.z-c.z)<12);
   if(nearPerches.length&&Math.random()<.4)return new T.Vector3().copy(nearPerches[Math.floor(Math.random()*nearPerches.length)]);
   const x=c.x+random(-3,3),z=c.z+random(-3,3);return new T.Vector3(x,terrainHeight(x,z)+.15,z);
  }
  if(c.kind==='butterfly'&&flowerTargets.length){
   const nearby=flowerTargets.filter(p=>Math.hypot(p.x-c.x,p.z-c.z)<10);
   if(nearby.length)return new T.Vector3().copy(nearby[Math.floor(Math.random()*nearby.length)]).add(new T.Vector3(0,.06,0));
  }
  const x=c.x+random(-1.6,1.6),z=c.z+random(-1.6,1.6);
  return new T.Vector3(x,c.kind==='dragonfly'?.12:terrainHeight(x,z)+.5,z);
 }
 function update(time,still,season,rain,theme,camera){
  calls.length=0;
  creatures.forEach(c=>{
   const bird=c.kind==='bird';c.g.visible=bird||season!=='winter'&&rain<.5&&theme!=='night';if(!c.g.visible)return;
   const startled=bird&&camera&&c.mode==='rest'&&c.g.position.distanceTo(camera.position)<1.8;
   if(!still&&(time-c.start>c.duration||startled)){
    c.from.copy(c.g.position);c.start=time;
    if(c.mode==='travel'){c.mode='rest';c.duration=random(bird?5:3,bird?16:9);}
    else{c.mode='travel';c.target.copy(destination(c,camera));c.duration=random(bird?2:3,bird?5:7);}
   }
   const amount=Math.min(1,Math.max(0,(time-c.start)/c.duration)),e=amount*amount*(3-2*amount);
   if(c.mode==='travel'){
    c.g.position.lerpVectors(c.from,c.target,e);
    const hop=bird&&Math.abs(c.from.y-c.target.y)<.25&&c.from.distanceTo(c.target)<2;
    c.g.position.y+=Math.sin(amount*Math.PI)*(hop?.18:bird?1.3:.5);
    c.g.rotation.y=Math.atan2(c.target.x-c.from.x,c.target.z-c.from.z);
    c.g.rotation.x=0;
   }else if(bird){c.g.rotation.x=Math.max(0,Math.sin(time*1.3+c.phase))*.35;}
   c.wings.forEach((w,i)=>{w.rotation.z=(i?1:-1)*(c.mode==='rest'?(bird?.08:.5+Math.sin(time*.6+c.phase)*.08):Math.sin(time*(bird?12:c.kind==='dragonfly'?40:9))*.8);});
   if(bird&&!still&&time>c.nextCall){c.nextCall=time+random(12,30);if(c.mode==='rest'&&rain<.6&&theme!=='night')calls.push(c.g.position.clone());}
  });
  petalMat.color.set(season==='autumn'?'#bd783c':'#f1c9d8');
  petals.forEach((m,i)=>{m.visible=season==='spring'||season==='autumn';if(!m.visible)return;const p=route.getPointAt(places[season==='autumn'?6:1].t),a=i*2.399;m.position.set(p.x+Math.sin(a)*7+Math.sin(time*.2+i)*.6,terrainHeight(p.x,p.z)+7-((time*.35+i*.37)%7),p.z+Math.cos(a)*7);m.rotation.set(time*.3+i,a,time*.2);});
 }
 return {update,calls,birds:creatures.filter(c=>c.kind==='bird').map(c=>c.g)};
}
