import {createLookout} from './lookout.js';
import {lookoutClearing} from './lookout-layout.mjs';
import {pondWaves} from './pond-waves.js';
import {waterLife} from './water-life.js';
import {eveningSky} from './evening-sky.js';
import {gardenWildlife} from './wildlife.js';
import {weatherScene} from './weather-scene.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {route, samples, nearestRoute, inPond, terrainHeight, groundHeight, places} from './walk-route.mjs';

// All materials and scenery are generated here. No remote models or textures.
export function createLandscape(scene,renderer,mobile){
 let seed=603;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 const rand=(a,b)=>a+(b-a)*random(),dummy=new T.Object3D(),up=new T.Vector3(0,1,0);
 const projectileColliders=[];
 const obstacles=[],flowers=[],lamps=[],birdPerches=[],wind={value:0};
 const material=(color,opts={})=>new T.MeshStandardMaterial({color,roughness:.92,...opts});
 function add(geometry,mat,position,scale){const m=new T.Mesh(geometry,mat);if(position)m.position.set(...position);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
 function texture(draw,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return tex;}
 const groundMap=texture((c,s)=>{c.fillStyle='#4c643e';c.fillRect(0,0,s,s);for(let i=0;i<33000;i++){const n=rand(36,106);c.fillStyle=`rgba(${n},${n+rand(18,42)},${n*.57},.45)`;c.fillRect(rand(0,s),rand(0,s),rand(1,4),rand(1,4));}for(let i=0;i<3000;i++){c.strokeStyle=random()<.5?'#89916b':'#4a583f';c.lineWidth=.7;c.beginPath();const x=rand(0,s),y=rand(0,s);c.moveTo(x,y);c.lineTo(x+rand(-5,5),y-rand(2,9));c.stroke();}});
 groundMap.wrapS=groundMap.wrapT=T.RepeatWrapping;groundMap.repeat.set(54,54);
 const groundMat=material('#aabf8b',{map:groundMap,bumpMap:groundMap,bumpScale:.08});
 const gravel=texture((c,s)=>{c.fillStyle='#afa893';c.fillRect(0,0,s,s);for(let i=0;i<15500;i++){const x=rand(0,s),y=rand(0,s),r=rand(.5,3.7),v=rand(128,204);c.fillStyle=`rgb(${v},${v*.97},${v*.86})`;c.beginPath();c.ellipse(x,y,r,r*rand(.5,1),rand(0,6),0,Math.PI*2);c.fill();if(i%3===0){c.strokeStyle='#625e482f';c.lineWidth=.6;c.stroke();}}});gravel.wrapS=gravel.wrapT=T.RepeatWrapping;
 const woodlandMat=material('#786047',{map:gravel,bumpMap:gravel,bumpScale:.028});
 const pathMat=material('#e5ddc3',{map:gravel,bumpMap:gravel,bumpScale:.045});
 const barkMap=texture((c,s)=>{c.fillStyle='#6a6454';c.fillRect(0,0,s,s);for(let i=0;i<1900;i++){const x=rand(0,s),y=rand(0,s);c.strokeStyle=random()<.5?'#403f344b':'#b2a18a49';c.lineWidth=rand(.5,3);c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+rand(-7,7),y+25,x+rand(-8,8),y+55,x+rand(-8,8),y+rand(50,200));c.stroke();}for(let i=0;i<110;i++){c.fillStyle='#8c927f44';c.beginPath();c.ellipse(rand(0,s),rand(0,s),rand(2,13),rand(2,20),0,0,7);c.fill();}});barkMap.wrapS=barkMap.wrapT=T.RepeatWrapping;barkMap.repeat.set(2,3);
 const bark=material('#c3b399',{map:barkMap,bumpMap:barkMap,bumpScale:.07});
 const birchMap=texture((c,s)=>{c.fillStyle='#d2cdbb';c.fillRect(0,0,s,s);for(let i=0;i<2600;i++){c.fillStyle=i%5?'#99978729':'#393c36ad';c.fillRect(rand(0,s),rand(0,s),rand(1,40),rand(.4,3.5));}});birchMap.wrapS=birchMap.wrapT=T.RepeatWrapping;birchMap.repeat.set(1,3);const birch=material('#e2ddd0',{map:birchMap,bumpMap:birchMap,bumpScale:.03});
 const woodMap=texture((c,s)=>{c.fillStyle='#89725a';c.fillRect(0,0,s,s);for(let i=0;i<2400;i++){c.strokeStyle=i%2?'#503f3240':'#d4bb8940';c.lineWidth=rand(.5,2);c.beginPath();const x=rand(0,s);c.moveTo(x,0);c.bezierCurveTo(x+rand(-10,10),s/3,x+rand(-10,10),s*.7,x+rand(-4,4),s);c.stroke();}});woodMap.wrapS=woodMap.wrapT=T.RepeatWrapping;
 const wood=material('#b9a185',{map:woodMap,bumpMap:woodMap,bumpScale:.02}),metal=material('#323b34',{metalness:.55,roughness:.6});
 const leafMap=texture((c,s)=>{c.clearRect(0,0,s,s);for(let i=0;i<52;i++){const a=rand(0,Math.PI*2),r=rand(0,s*.38),x=s/2+Math.cos(a)*r,y=s/2+Math.sin(a)*r;c.strokeStyle='#625b36';c.lineWidth=1.5;c.beginPath();c.moveTo(s/2,s/2);c.lineTo(x,y);c.stroke();c.save();c.translate(x,y);c.rotate(a+rand(-1,1));const g=c.createLinearGradient(-18,0,18,0);g.addColorStop(0,'#4b642d');g.addColorStop(.5,'#93a359');g.addColorStop(1,'#617c39');c.fillStyle=g;c.beginPath();c.moveTo(0,-31);c.bezierCurveTo(24,-14,20,14,0,31);c.bezierCurveTo(-21,13,-23,-14,0,-31);c.fill();c.strokeStyle='#b4b67b99';c.lineWidth=.9;c.beginPath();c.moveTo(0,-26);c.lineTo(0,27);c.stroke();c.restore();}});
 const leafMat=material('#c1cb90',{map:leafMap,alphaTest:.48,side:T.DoubleSide,roughness:.85});
 const leafDepth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:leafMap,alphaTest:.48,side:T.DoubleSide});
 function sway(mat,strength){mat.onBeforeCompile=shader=>{shader.uniforms.gardenTime=wind;shader.vertexShader='uniform float gardenTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat phase=instanceMatrix[3].x*.7+instanceMatrix[3].z*.43;\ntransformed.x+=sin(gardenTime*.7+phase+position.y)*${strength.toFixed(3)};\n#endif`);};}
 sway(leafMat,.045);
 const terrain=new T.PlaneGeometry(220,220,220,220);terrain.rotateX(-Math.PI/2);const tp=terrain.attributes.position;
 for(let i=0;i<tp.count;i++)tp.setY(i,terrainHeight(tp.getX(i),tp.getZ(i)));const indices=[];const oldIndex=terrain.index.array;for(let i=0;i<oldIndex.length;i+=3){const ids=[oldIndex[i],oldIndex[i+1],oldIndex[i+2]],x=ids.reduce((s,j)=>s+tp.getX(j),0)/3,z=ids.reduce((s,j)=>s+tp.getZ(j),0)/3;if(!inPond(x,z,-.35))indices.push(...ids);}terrain.setIndex(indices);terrain.computeVertexNormals();const earth=add(terrain,groundMat);earth.castShadow=false;projectileColliders.push(earth);
 // A gravel ribbon follows the same curve used for guided walking.
 const verts=[],uvs=[],ix=[],pathGroups=[];for(let i=0;i<samples.length;i++){const t=i/(samples.length-1),p=samples[i],tangent=route.getTangentAt(t),normal=new T.Vector3(-tangent.z,0,tangent.x);for(const side of[-1,1]){const x=p.x+normal.x*1.52*side,z=p.z+normal.z*1.52*side;verts.push(x,terrainHeight(x,z)+.038,z);uvs.push(side===-1?0:1,t*route.getLength()/2);}if(i&& !inPond(p.x,p.z,1.3)){const k=i*2;pathGroups.push({start:ix.length,material:p.x < -30?1:0});ix.push(k-2,k-1,k,k,k-1,k+1);}}
 const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(verts,3));pg.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));pg.setIndex(ix);pg.computeVertexNormals();pathGroups.forEach(g=>pg.addGroup(g.start,6,g.material));add(pg,[pathMat,woodlandMat]).castShadow=false;
 // A real reflection under a transparent, gently rippling surface.
 const water=new Reflector(new T.CircleGeometry(1,96),{clipBias:.005,textureWidth:mobile?512:1024,textureHeight:mobile?512:1024,color:'#90a69a'});water.rotation.x=-Math.PI/2;water.scale.set(8,10,1);water.position.set(5,-.2,1);scene.add(water);
 water.material.transparent=true;water.material.depthWrite=false;water.renderOrder=1;
 water.material.fragmentShader=water.material.fragmentShader.replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4( blendOverlay( base.rgb, color ), .72 )');
 const pondLife=waterLife(scene,mobile);obstacles.push(...pondLife.obstacles);
 const waterMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:wind,tint:{value:new T.Color('#548378')}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;uniform vec3 tint;void main(){vec2 p=vUv*100.;float a=sin(p.x*1.6+p.y*.4+time*.45)*sin(p.y*2.1+time*.3);float b=pow(max(0.,a),14.);gl_FragColor=vec4(mix(tint,vec3(.85,.90,.75),b*.45),.24+b*.12);}'});
 const surface=add(new T.CircleGeometry(1,96),waterMaterial,[5,-.186,1],[8,10,1]);surface.rotation.x=-Math.PI/2;surface.castShadow=false;surface.userData.placeIndex=2;surface.renderOrder=2;const waves=pondWaves(scene,water,surface);
 const bankVertices=[],bankIndices=[],bankUvs=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2;for(const r of[.975,1.13]){const x=5+Math.cos(a)*8*r,z=1+Math.sin(a)*10*r;bankVertices.push(x,r<1?-.23:terrainHeight(x,z)+.01,z);bankUvs.push(x*.3,z*.3);}if(i){const k=i*2;bankIndices.push(k-2,k,k-1,k,k+1,k-1);}}const bank=new T.BufferGeometry();bank.setAttribute('position',new T.Float32BufferAttribute(bankVertices,3));bank.setAttribute('uv',new T.Float32BufferAttribute(bankUvs,2));bank.setIndex(bankIndices);bank.computeVertexNormals();const bankMesh=add(bank,groundMat);bankMesh.castShadow=false;projectileColliders.push(bankMesh);
 const rockGeo=new T.IcosahedronGeometry(1,2);const rp=rockGeo.attributes.position;for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),r=1+.12*Math.sin(x*12+z*3)*Math.cos(y*9);rp.setXYZ(i,x*r,y*r,z*r);}rockGeo.computeVertexNormals();const rockMap=texture((c,s)=>{c.fillStyle='#929586';c.fillRect(0,0,s,s);for(let i=0;i<12000;i++){c.fillStyle=i%3?'#d2ccb333':'#525b5233';c.fillRect(rand(0,s),rand(0,s),rand(1,6),rand(1,5));}});const rockMat=material('#b4b7a8',{map:rockMap,bumpMap:rockMap,bumpScale:.07});const rocks=new T.InstancedMesh(rockGeo,rockMat,190);let rockCount=0;
 function setRock(x,z,s){dummy.position.set(x,terrainHeight(x,z)+s*.17,z);dummy.rotation.set(rand(0,1),rand(0,6),rand(0,.4));dummy.scale.set(s,s*rand(.4,.7),s*rand(.6,1));dummy.updateMatrix();rocks.setMatrixAt(rockCount++,dummy.matrix);}
 for(let i=0;i<110;i++){const a=i/110*Math.PI*2,x=5+Math.cos(a)*8.3,z=1+Math.sin(a)*10.3;if(nearestRoute(x,z).distance<2)continue;setRock(x,z,rand(.25,.65));}
 for(let i=0;i<45;i++){const x=rand(-34,34),z=rand(-34,34);if(lookoutClearing(x,z,1)||nearestRoute(x,z).distance<3||inPond(x,z,1))continue;const s=rand(.4,1.2);setRock(x,z,s);obstacles.push({x,z,r:s*.6});}rocks.count=rockCount;rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);projectileColliders.push(rocks);
 const bridgeGeos=[],railGeos=[];
 function boxGeometry(w,h,d,x,y,z,angle=0){const g=new T.BoxGeometry(w,h,d);g.rotateY(angle);g.translate(x,y,z);return g;}
 function cylinderGeo(a,b,r1,r2,segments=7){const v=new T.Vector3().subVectors(b,a),g=new T.CylinderGeometry(r2,r1,v.length(),segments);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,v.clone().normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5));return g;}
 for(let t=0;t<1;t+=.24/route.getLength()){const p=route.getPointAt(t);if(!inPond(p.x,p.z,1.55))continue;const tangent=route.getTangentAt(t),angle=Math.atan2(tangent.x,tangent.z);bridgeGeos.push(boxGeometry(2.9,.14,.27,p.x,groundHeight(p.x,p.z)-.07,p.z,angle));}
 // Posts and continuous handrails track the gently arched deck.
 let previous=[null,null],n=0;for(let t=0;t<1;t+=.0045){const p=route.getPointAt(t);if(!inPond(p.x,p.z,1.45)){previous=[null,null];continue;}const tan=route.getTangentAt(t),normal=new T.Vector3(-tan.z,0,tan.x);[-1,1].forEach((side,i)=>{const x=p.x+normal.x*1.38*side,z=p.z+normal.z*1.38*side,y=groundHeight(p.x,p.z),top=new T.Vector3(x,y+1,z);if(n%2===0)railGeos.push(boxGeometry(.10,1.1,.10,x,y+.47,z));if(previous[i]){railGeos.push(cylinderGeo(previous[i],top,.045,.045));const a=previous[i].clone(),b=top.clone();a.y-=.45;b.y-=.45;railGeos.push(cylinderGeo(a,b,.028,.028));}previous[i]=top;});n++;}
 if(bridgeGeos.length)projectileColliders.push(add(mergeGeometries(bridgeGeos),wood));if(railGeos.length)projectileColliders.push(add(mergeGeometries(railGeos),wood));
 // Volumetric crowns: textured leaf sprays arranged around true branching trunks.
 const trunks=[],birches=[],leafTransforms=[],leafColors=[];
 const nookPoint=route.getPointAt(places[8].t),nookTangent=route.getTangentAt(places[8].t),nookCentre={x:nookPoint.x-nookTangent.z*2.9,z:nookPoint.z+nookTangent.x*2.9};
 function tree(x,z,height,radius,isBirch=false){if(lookoutClearing(x,z,3)||Math.hypot(x-nookCentre.x,z-nookCentre.z)<8||nearestRoute(x,z).distance<3.15||inPond(x,z,2)||Math.hypot(x+45,z-18)<9)return;const y=terrainHeight(x,z),out=isBirch?birches:trunks;const trunkTop=new T.Vector3(x+rand(-.3,.3),y+height*.72,z+rand(-.3,.3));out.push(cylinderGeo(new T.Vector3(x,y,z),trunkTop,radius,radius*.35,9));obstacles.push({x,z,r:radius});
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2+rand(-.2,.2),reach=height*rand(.19,.32),end=new T.Vector3(x+Math.cos(a)*reach,y+height*rand(.66,.91),z+Math.sin(a)*reach);out.push(cylinderGeo(new T.Vector3(x,y+height*rand(.35,.6),z),end,radius*.38,.035));birdPerches.push(end.clone());const crown=height*(isBirch?.17:.23);
   for(let j=0;j<(mobile?10:15);j++){const theta=rand(0,Math.PI*2),cost=rand(-1,1),r=crown*Math.cbrt(random());dummy.position.set(end.x+Math.cos(theta)*Math.sqrt(1-cost*cost)*r,end.y+cost*r*.7,end.z+Math.sin(theta)*Math.sqrt(1-cost*cost)*r);dummy.rotation.set(rand(-1.4,1.4),rand(0,Math.PI*2),rand(-1,1));const s=height*rand(.20,.32);dummy.scale.set(s,s,1);dummy.updateMatrix();leafTransforms.push(dummy.matrix.clone());leafColors.push(new T.Color().setHSL(rand(.19,.25),rand(.24,.4),rand(.62,.85)));}
  }
 }
 // Designed foreground trees frame the path, with denser woodland beyond.
 for(const [x,z,h,r,b] of [[-5,29,10,.4], [6,26,12,.5],[-9,21,11,.38],[-18,15,10,.4],[-8,8,9,.36],[-19,-3,13,.5],[-4,-12,11,.4],[18,-17,12,.34,true],[8,-24,13,.3,true],[2,-34,12,.27,true],[-2,-22,10,.28,true],[-15,-16,12,.4],[-28,5,13,.45],[-18,29,11,.45],[19,17,12,.42]])tree(x,z,h,r,b);
 for(let i=0;i<105;i++){const a=rand(0,Math.PI*2),r=rand(23,75),x=Math.sin(a)*r,z=Math.cos(a)*r;tree(x,z,rand(8,15),rand(.22,.55),z<-20&&x>-5);}
 for(let i=0;i<65;i++){const t=places[8].t-.04+(places[6].t+.16-places[8].t)*i/64,p=route.getPointAt(t),tan=route.getTangentAt(t);for(const side of[-1,1]){const r=rand(3.7,11);tree(p.x-tan.z*r*side,p.z+tan.x*r*side,rand(9,15),rand(.25,.5));}}
 // Low shrubs soften the path edges and hide bare ground beneath the canopy.
 for(let i=0;i<165;i++){const p=samples[Math.floor(random()*samples.length)],a=rand(0,6.28),r=rand(2.7,7),x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(lookoutClearing(x,z)||Math.hypot(x-nookCentre.x,z-nookCentre.z)<4.5||nearestRoute(x,z).distance<2.3||inPond(x,z,1.2))continue;const h=rand(.35,.95);for(let j=0;j<10;j++){dummy.position.set(x+rand(-.6,.6),terrainHeight(x,z)+rand(.15,h),z+rand(-.6,.6));dummy.rotation.set(rand(-1,1),rand(0,6.28),rand(-.6,.6));dummy.scale.set(1.0,1.0,1);dummy.updateMatrix();leafTransforms.push(dummy.matrix.clone());leafColors.push(new T.Color().setHSL(rand(.20,.26),.33,rand(.48,.72)));}}
 add(mergeGeometries(trunks),bark);if(birches.length)add(mergeGeometries(birches),birch);
 const foliage=new T.InstancedMesh(new T.PlaneGeometry(1,1),leafMat,leafTransforms.length);leafTransforms.forEach((m,i)=>{foliage.setMatrixAt(i,m);foliage.setColorAt(i,leafColors[i]);});foliage.castShadow=true;foliage.receiveShadow=true;foliage.customDepthMaterial=leafDepth;scene.add(foliage);
 // Individual curved grass blades have natural colour variation and a tiny breeze.
 const bladeGeo=new T.BufferGeometry();bladeGeo.setAttribute('position',new T.Float32BufferAttribute([-.034,0,0,.034,0,0,-.023,.32,.018,.023,.32,.018,0,.65,.11],3));bladeGeo.setIndex([0,1,2,1,3,2,2,3,4]);bladeGeo.computeVertexNormals();const bladesInTuft=[bladeGeo];for(let i=0;i<3;i++){const g=bladeGeo.clone();g.rotateY(i*2.1+1);g.scale(.65,.65,.65);g.translate(Math.sin(i*2)*.07,0,Math.cos(i*2)*.07);bladesInTuft.push(g);}const tuftGeo=mergeGeometries(bladesInTuft);const grassMat=material('#a8b977',{side:T.DoubleSide});sway(grassMat,.025);const bladeCount=mobile?23000:43000,grass=new T.InstancedMesh(tuftGeo,grassMat,bladeCount);let blades=0;
 for(let i=0;i<bladeCount*2&&blades<bladeCount;i++){const x=rand(-64,40),z=rand(-53,40),near=nearestRoute(x,z);if(lookoutClearing(x,z)||near.distance<1.7||inPond(x,z,.25))continue;const scale=rand(.27,.83);dummy.position.set(x,terrainHeight(x,z),z);dummy.rotation.set(0,rand(0,6),rand(-.18,.18));dummy.scale.set(scale,scale*rand(.65,1.3),scale);dummy.updateMatrix();grass.setMatrixAt(blades,dummy.matrix);grass.setColorAt(blades,new T.Color().setHSL(rand(.19,.25),rand(.25,.45),rand(.48,.75)));blades++;}grass.count=blades;grass.receiveShadow=true;scene.add(grass);
 // Flowers are fine petals and stems at eye-level scale, scattered in natural drifts.
 const petalGeo=new T.SphereGeometry(1,6,4),stemGeo=new T.CylinderGeometry(.008,.012,1,4),flowerTransforms=[],petalTransforms=[],flowerColors=[],stemTransforms=[];
 const white=material('#f2ecce'),stem=material('#677b3b'),pollen=material('#bb8c31');
 for(let i=0;i<1350;i++){const p=i>850?route.getPointAt(places[7].t):samples[Math.floor(random()*samples.length)],a=rand(0,Math.PI*2),r=rand(2.2,6.8),x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(lookoutClearing(x,z)||nearestRoute(x,z).distance<1.85||inPond(x,z,.5))continue;const y=terrainHeight(x,z),h=rand(.28,.8),color=new T.Color(i%5===0?'#afa1c7':i%7===0?'#d9b2a4':'#f1edda');dummy.position.set(x,y+h*.5,z);dummy.rotation.set(0,0,rand(-.08,.08));dummy.scale.set(1,h,1);dummy.updateMatrix();stemTransforms.push(dummy.matrix.clone());
  for(let j=0;j<7;j++){const a=j/7*Math.PI*2;dummy.position.set(x+Math.cos(a)*.065,y+h,z+Math.sin(a)*.065);dummy.rotation.set(rand(-.2,.2),-a,0);dummy.scale.set(.065,.012,.027);dummy.updateMatrix();petalTransforms.push(dummy.matrix.clone());flowerColors.push(color);}dummy.position.set(x,y+h+.014,z);dummy.rotation.set(0,0,0);dummy.scale.set(.035,.025,.035);dummy.updateMatrix();flowerTransforms.push(dummy.matrix.clone());
 }
 function instances(geo,mat,transforms,colors){const m=new T.InstancedMesh(geo,mat,transforms.length);transforms.forEach((t,i)=>{m.setMatrixAt(i,t);if(colors)m.setColorAt(i,colors[i]);});m.receiveShadow=true;scene.add(m);return m;}
 const flowerStems=instances(stemGeo,stem,stemTransforms),flowerPetals=instances(petalGeo,white,petalTransforms,flowerColors),flowerCentres=instances(petalGeo,pollen,flowerTransforms);
 // Reeds and lily pads keep the pond edge irregular.
 const reedGeos=[];for(let i=0;i<200;i++){const a=rand(0,Math.PI*2),x=5+Math.cos(a)*rand(7.7,8.6),z=1+Math.sin(a)*rand(9.6,10.5);if(nearestRoute(x,z).distance<2)continue;const h=rand(.6,1.65);reedGeos.push(cylinderGeo(new T.Vector3(x,-.2,z),new T.Vector3(x+.1,h,z+.07),.014,.008,3));}add(mergeGeometries(reedGeos),stem);
 for(let i=0;i<16;i++){const x=rand(1,10),z=rand(1,8),pad=add(new T.CircleGeometry(rand(.16,.35),20,0,Math.PI*1.9),material('#67784a'),[x,-.171,z]);pad.rotation.set(-Math.PI/2,0,rand(0,6));pad.castShadow=false;}
 function bench(x,z,angle){const group=new T.Group();group.position.set(x,terrainHeight(x,z),z);group.rotation.y=angle;scene.add(group);function part(w,h,d,px,py,pz,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(px,py,pz);m.castShadow=m.receiveShadow=true;group.add(m);projectileColliders.push(m);}for(let i=0;i<4;i++){part(1.9,.055,.115,0,.48,-.18+i*.13,wood);part(1.9,.12,.05,0,.78+i*.13,-.23,wood);}for(const x of[-.73,.73]){part(.07,.46,.43,x,.23,0,metal);part(.055,.8,.055,x,.73,-.22,metal);part(.065,.06,.5,x,.75,.04,wood);}obstacles.push({x,z,r:.85});return group;}
 const benches=[];for(const [t,side]of[[places[2].t,-1],[places[3].t,1],[places[4].t,1],[places[8].t,1],[places[7].t,-1]]){const p=route.getPointAt(t),tan=route.getTangentAt(t),pond=t===places[2].t,x=pond?5:p.x-tan.z*2.9*side,z=pond?-11.8:p.z+tan.x*2.9*side;const g=bench(x,z,pond?0:Math.atan2(p.x-x,p.z-z));benches.push({x,z,angle:g.rotation.y});}
 const glowMap=texture((c,s)=>{const g=c.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,226,168,.85)');g.addColorStop(.12,'rgba(255,204,128,.35)');g.addColorStop(1,'rgba(255,203,119,0)');c.fillStyle=g;c.fillRect(0,0,s,s);},64);
 const bulb=material('#f1dab2',{emissive:'#ffcc83',emissiveIntensity:1}),lampGeo=[];for(let i=0;i<24;i++){const p=route.getPointAt(i/24),tan=route.getTangentAt(i/24),x=p.x-tan.z*2,z=p.z+tan.x*2;if(inPond(x,z,1))continue;const y=terrainHeight(x,z);lampGeo.push(boxGeometry(.07,.85,.07,x,y+.42,z));lampGeo.push(boxGeometry(.24,.04,.24,x,y+1.03,z));const b=add(new T.BoxGeometry(.16,.2,.16),bulb,[x,y+.89,z]);const glow=new T.Sprite(new T.SpriteMaterial({map:glowMap,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));glow.position.set(x,y+.89,z);glow.scale.set(1.5,1.5,1);scene.add(glow);lamps.push({b,glow});}add(mergeGeometries(lampGeo),metal);
 // A reading shelter with a slatted roof beside the woodland path.
 const nook=benches[3];for(const side of[-1,1])for(const depth of[-1,1])add(new T.BoxGeometry(.13,2.5,.13),wood,[nook.x+side*1.45,terrainHeight(nook.x,nook.z)+1.25,nook.z+depth*1.1]);
 const shelter={x:nook.x,z:nook.z,halfX:1.65,halfZ:1.35,roofY:terrainHeight(nook.x,nook.z)+2.6};
 const roof=add(new T.BoxGeometry(3.3,.18,2.7),wood,[nook.x,terrainHeight(nook.x,nook.z)+2.6,nook.z]);roof.rotation.z=.07;
 // Timber entry posts and a small, legible garden sign.
 const signMap=texture((c,s)=>{c.fillStyle='#344a39';c.fillRect(0,0,s,s);c.strokeStyle='#c5bb9155';c.lineWidth=3;c.strokeRect(20,20,s-40,s-40);c.textAlign='center';c.fillStyle='#eee4c8';c.font='40px Georgia';c.fillText('The Quiet',s/2,210);c.font='italic 54px Georgia';c.fillText('Garden',s/2,278);c.font='14px sans-serif';c.fillStyle='#d4c7a2';c.fillText('TAKE YOUR TIME',s/2,355);});
 add(new T.BoxGeometry(.10,1.5,.10),wood,[-2.2,.75,28]);const sign=add(new T.BoxGeometry(.95,.9,.07),material('#fff',{map:signMap}),[-2.2,1.6,28]);sign.rotation.y=.15;
 for(const t of[0,.15]){const p=route.getPointAt(t),tan=route.getTangentAt(t);for(const side of[-1,1])add(new T.BoxGeometry(.18,1.15,.18),wood,[p.x-tan.z*1.9*side,.55,p.z+tan.x*1.9*side]);}
 // Close flowers at two resting places, opening in response to a touch or button.
 for(const index of[0,1]){const p=route.getPointAt(places[index].t),tan=route.getTangentAt(places[index].t),g=new T.Group();g.position.set(p.x-tan.z*2,terrainHeight(p.x,p.z),p.z+tan.x*2);scene.add(g);const heads=[];for(let j=0;j<9;j++){const x=rand(-.45,.45),z=rand(-.4,.4),h=rand(.4,.8),stalk=new T.Mesh(new T.CylinderGeometry(.012,.015,h,5),stem);stalk.position.set(x,h*.5,z);g.add(stalk);const head=new T.Group();head.position.set(x,h,z);g.add(head);for(let k=0;k<9;k++){const a=k/9*Math.PI*2,m=new T.Mesh(petalGeo,white);m.position.set(Math.cos(a)*.08,0,Math.sin(a)*.08);m.scale.set(.09,.015,.032);m.rotation.y=-a;head.add(m);}const heart=new T.Mesh(petalGeo,pollen);heart.scale.set(.045,.028,.045);heart.position.y=.02;head.add(heart);heads.push(head);}g.userData.placeIndex=index;flowers.push({index,g,heads,amount:.5});}
 const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{time:wind,topColor:{value:new T.Color('#709aab')},horizonColor:{value:new T.Color('#e2d7b9')},sunDirection:{value:new T.Vector3()},sunTint:{value:new T.Color('#fff0c9')},cloudCover:{value:0}},vertexShader:'varying vec3 vWorld;void main(){vWorld=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vWorld;uniform vec3 topColor,horizonColor,sunDirection,sunTint;uniform float cloudCover;uniform float time;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){vec3 d=normalize(vWorld);float h=clamp(d.y,0.,1.);vec3 c=mix(horizonColor,topColor,pow(h,.45));vec2 uv=d.xz/(max(.15,d.y)+.35)*3.;uv+=vec2(time*.003,time*.001);float n=noise(uv)*.55+noise(uv*2.1)*.27+noise(uv*4.3)*.13;float cloud=smoothstep(mix(.52,.2,cloudCover),mix(.8,.65,cloudCover),n)*smoothstep(0.,.12,h)*mix(.28,.85,cloudCover);c=mix(c,mix(vec3(.94,.93,.88),horizonColor*.88,cloudCover),cloud);float sun=max(0.,dot(d,sunDirection));c+=sunTint*(pow(sun,150.)*.22+pow(sun,22000.)*2.);gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>
 #include <colorspace_fragment>}`.replace(';#include',';\n#include')});
 const sky=new T.Mesh(new T.SphereGeometry(180,32,20),skyMat);scene.add(sky);
 const hemi=new T.HemisphereLight('#d6e0e7','#65704a',2.1);scene.add(hemi);const sun=new T.DirectionalLight('#ffe4b1',3.1);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:.5,far:110});sun.shadow.radius=3;sun.shadow.normalBias=.08;sun.shadow.bias=-.0002;scene.add(sun,sun.target);scene.fog=new T.FogExp2('#c6d0b8',.014);
 const flowerTargets=flowerTransforms.filter((_,i)=>i%8===0).map(m=>new T.Vector3().setFromMatrixPosition(m));const wildlife=gardenWildlife(scene,mobile,flowerTargets,birdPerches);const nightSky=eveningSky(scene,mobile);let season='summer';
 function setSeason(value){season=value;const palette={spring:['#d7e5a3','#adc67d'],summer:['#c1cb90','#a8b977'],autumn:['#e4a45d','#bda36e'],winter:['#acb2a2','#ccd2c7']}[season];leafMat.color.set(palette[0]);grassMat.color.set(palette[1]);foliage.count=season==='winter'?Math.floor(leafTransforms.length/4):leafTransforms.length;for(let i=0;i<foliage.count;i++){const source=season==='winter'?i*4:i;foliage.setMatrixAt(i,leafTransforms[source]);foliage.setColorAt(i,leafColors[source]);}foliage.instanceMatrix.needsUpdate=true;foliage.instanceColor.needsUpdate=true;flowerStems.visible=flowerPetals.visible=flowerCentres.visible=season!=='winter';white.color.set(season==='spring'?'#f5d8e6':season==='autumn'?'#e5cba4':'#f2ecce');flowers.forEach(f=>f.g.visible=season!=='winter');applyWeather();}
 const lookout=createLookout(scene,wood,metal);
 const sunDirection=new T.Vector3();let currentTheme='sunset',forceLanterns=false,baseTheme,daylight=1;const atmosphere=weatherScene(scene,mobile,shelter);const weatherColor=new T.Color();let weather={cloud:0,rain:0,mist:0};
 const lightPresets=[
  {elevation:40,azimuth:125,color:'#fff0d2',intensity:3.4,ambient:2.8,fog:'#cbd7c5',exposure:1,top:'#78aacb',horizon:'#d3e1df'},
  {elevation:12,azimuth:110,color:'#ffd39a',intensity:3.8,ambient:2.6,fog:'#d9c9a8',exposure:1.02,top:'#829fa9',horizon:'#e4ceb0'},
  {elevation:-3,azimuth:115,color:'#b2c6e5',intensity:.75,ambient:1.3,fog:'#718891',exposure:.83,top:'#233c58',horizon:'#647b85'}
 ];
 function setDaylight(value){
  daylight=T.MathUtils.clamp(value,0,2);lookout.setLight(daylight);currentTheme=daylight>1.6?'night':daylight>.45?'sunset':'day';
  const a=lightPresets[Math.min(1,Math.floor(daylight))],b=lightPresets[Math.min(2,Math.floor(daylight)+1)],f=daylight===2?1:daylight%1,c={};
  for(const key of['elevation','azimuth','intensity','ambient','exposure'])c[key]=T.MathUtils.lerp(a[key],b[key],f);
  for(const key of['color','fog','top','horizon'])c[key]=new T.Color(a[key]).lerp(new T.Color(b[key]),f);
  baseTheme=c;sunDirection.setFromSphericalCoords(1,T.MathUtils.degToRad(90-c.elevation),T.MathUtils.degToRad(c.azimuth));
  skyMat.uniforms.sunDirection.value.copy(sunDirection);sun.color.copy(c.color);renderer.toneMappingExposure=c.exposure;
  waterMaterial.uniforms.tint.value.set('#548378').lerp(weatherColor.set('#38535b'),daylight/2);
  bulb.emissiveIntensity=forceLanterns?2.7:.08+daylight*1.31;
  lamps.forEach(l=>l.glow.material.opacity=forceLanterns?.9:.04+daylight*.43);applyWeather();
 }
 function setTheme(name){setDaylight({day:0,sunset:1,night:2}[name]);}
 function applyWeather(){if(!baseTheme)return;const c=baseTheme,cloud=weather.cloud;
  sun.intensity=c.intensity*(1-cloud*.78);hemi.intensity=c.ambient*(1-cloud*.12);
  scene.fog.density=.014+weather.mist*.05+weather.rain*.006;
  scene.fog.color.copy(c.fog).lerp(weatherColor.set(currentTheme==='night'?'#73878f':'#bdc9c5'),Math.min(.85,weather.mist*.7+cloud*.35));
  skyMat.uniforms.topColor.value.copy(c.top).lerp(weatherColor.set(currentTheme==='night'?'#455b6c':'#899eaa'),cloud*.8);
  skyMat.uniforms.horizonColor.value.copy(c.horizon).lerp(scene.fog.color,Math.max(cloud*.85,weather.mist*.8));
  skyMat.uniforms.sunTint.value.set('#ffe1a2').multiplyScalar((1-T.MathUtils.smoothstep(daylight,1,2))*(1-cloud*.97));skyMat.uniforms.cloudCover.value=cloud;
  groundMat.roughness=.92-weather.rain*.2;pathMat.roughness=.92-weather.rain*.34;wood.roughness=.92-weather.rain*.34;
  groundMat.color.set(season==='winter'?'#e2e7df':season==='autumn'?'#c8b18a':'#aabf8b').multiplyScalar(1-weather.rain*.13);pathMat.color.set('#e5ddc3').multiplyScalar(1-weather.rain*.16);
  nightSky.update(daylight,cloud,weather.mist);
 }
 function setWeather(value){weather=value;applyWeather();}
 const ripple=waves.ripple;
 let lastRipple=0;
 function update(time,dt,camera,still,opened,waveDt=dt){wind.value=time;wildlife.update(time,still,season,weather.rain,currentTheme,camera);waves.update(waveDt,still);pondLife.update(time,season,daylight,waves.height);atmosphere.update(time,camera,weather,currentTheme);sun.target.position.set(camera.position.x,0,camera.position.z);sun.position.copy(sun.target.position).addScaledVector(sunDirection,50);if(currentTheme==='night')sun.position.y=25;sun.target.updateMatrixWorld();
  flowers.forEach(f=>{const target=opened.includes(f.index)?1:.55;f.amount=still?target:T.MathUtils.lerp(f.amount,target,.04);f.heads.forEach(h=>h.scale.set(f.amount,1,f.amount));});
  if(!still&&time-lastRipple>13){lastRipple=time;ripple();}
 }
 function interact(index,still,point){if(places[index].kind==='water'&&!still)ripple(point);if(places[index].kind==='light'){forceLanterns=true;setDaylight(daylight);}}
 scene.updateMatrixWorld(true);
 return {projectileColliders,pondWaves:waves,obstacles,benches,shelter,birdCalls:wildlife.calls,streamPosition:pondLife.streamPosition,setSeason,setTheme,setDaylight,setWeather,update,interact,water,hitTargets:[surface,...flowers.map(f=>f.g)]};
}
