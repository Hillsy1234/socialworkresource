import * as T from 'three';
import {route,places,terrainHeight} from './walk-route.mjs';

// Small local meshes, bounded in number; motion shares the garden's paused clock.
export function gardenWildlife(scene,mobile){
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
 let lastTime=0;
 function update(time,still,season,rain,theme){
  if(!still)lastTime=time;const t=lastTime;
  creatures.forEach(c=>{const a=t+c.phase,bird=c.kind==='bird';c.g.visible=bird||season!=='winter'&&rain<.5&&theme!=='night';if(!c.g.visible)return;
   const cycle=(a%26)/26,perched=bird&&cycle<.62;
   const r=bird?(perched?0:Math.sin((cycle-.62)/.38*Math.PI)*3):c.kind==='dragonfly'?1.3:1.8;
   const x=c.x+Math.sin(a*(bird?.7:.38))*r,z=c.z+Math.cos(a*.31)*r;
   c.g.position.set(x,terrainHeight(x,z)+(bird?perched?.18:.2+Math.sin((cycle-.62)/.38*Math.PI)*2.8:c.kind==='dragonfly'?.75:1.0+Math.sin(a*.7)*.3),z);
   c.g.rotation.y=a*.25;c.wings.forEach((w,i)=>{w.rotation.z=(i?1:-1)*(perched?.1:Math.sin(a*(bird?12:c.kind==='dragonfly'?40:9))*.8);});
  });
  petalMat.color.set(season==='autumn'?'#bd783c':'#f1c9d8');petals.forEach((m,i)=>{m.visible=season==='spring'||season==='autumn';if(!m.visible)return;const p=route.getPointAt(places[season==='autumn'?6:1].t),a=i*2.399;m.position.set(p.x+Math.sin(a)*7+Math.sin(t*.2+i)*.6,terrainHeight(p.x,p.z)+7-((t*.35+i*.37)%7),p.z+Math.cos(a)*7);m.rotation.set(t*.3+i,a,t*.2);});
 }
 return {update};
}
