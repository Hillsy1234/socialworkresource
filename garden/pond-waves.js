import * as T from 'three';
import {insideWater, WATER_Y} from './pebble-physics.mjs';
// Eight bounded, damped wave packets shared by the surface and its reflection.
const declarations=`uniform vec4 pondWaves[8];uniform float pondTime;
float pondHeight(vec2 p){float h=0.;for(int i=0;i<8;i++){
 vec4 w=pondWaves[i];float age=pondTime-w.z;float r=length(p-w.xy);float front=r-age*1.15;
 if(age>=0.&&age<7.)h+=w.w*sin(front*13.)*exp(-front*front*2.8)*exp(-age*.52)/sqrt(1.+r*2.);
 }return h;}
vec2 pondSlope(vec2 p){float e=.025;return vec2(pondHeight(p+vec2(e,0.))-pondHeight(p-vec2(e,0.)),pondHeight(p+vec2(0.,e))-pondHeight(p-vec2(0.,e)))/(2.*e);}
`;
export function pondWaves(scene, water, surface) {
 const waves=Array.from({length:8},()=>new T.Vector4(0,0,-100,0)),clock={value:0},uniforms={pondWaves:{value:waves},pondTime:clock};let cursor=0;
 const rings=[],drops=[],dropGeometry=new T.SphereGeometry(.022,5,4),dropMaterial=new T.MeshBasicMaterial({color:'#d2e2d4',transparent:true,opacity:.7});
 for(let i=0;i<18;i++){const m=new T.Mesh(dropGeometry,dropMaterial);m.visible=false;m.name='Pebble splash droplet';scene.add(m);drops.push(m);}
 let splash=null;
 // World coordinates keep waves circular despite the elliptical pond geometry.
 for(const mat of[water.material,surface.material]){
  Object.assign(mat.uniforms,uniforms);
  mat.vertexShader='varying vec3 pondWorld;\n'+mat.vertexShader;
  mat.vertexShader=mat.vertexShader.replace('void main() {','void main(){').replace('void main(){','void main(){pondWorld=(modelMatrix*vec4(position,1.)).xyz;');
  mat.fragmentShader='varying vec3 pondWorld;\n'+declarations+mat.fragmentShader;
 }
 water.material.fragmentShader=water.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );','vec4 rippleUv=vUv; rippleUv.xy+=pondSlope(pondWorld.xz)*.035*vUv.w; vec4 base=texture2DProj(tDiffuse,rippleUv);');
 surface.material.fragmentShader=surface.material.fragmentShader.replace('gl_FragColor=vec4(', 'b+=min(.55,length(pondSlope(pondWorld.xz))*.9);gl_FragColor=vec4(');
 function ripple(point={x:5,z:0},strength=.35){
  if(!insideWater(point))return;
  waves[cursor].set(point.x,point.z,clock.value,.035*strength);cursor=(cursor+1)%waves.length;
  // Thin highlights accompany the distorted reflection, clipped at the bank.
  while(rings.length>=24){const r=rings.shift();scene.remove(r.mesh);r.mesh.geometry.dispose();r.mesh.material.dispose();}
  for(let i=0;i<3;i++){
   const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{opacity:{value:0}},
    vertexShader:'varying vec3 world;void main(){world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}',
    fragmentShader:'varying vec3 world;uniform float opacity;void main(){vec2 p=(world.xz-vec2(5.,1.))/vec2(8.,10.);if(dot(p,p)>=1.)discard;gl_FragColor=vec4(.83,.9,.78,opacity);}'});
   const mesh=new T.Mesh(new T.RingGeometry(.985,1,80),mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(point.x,WATER_Y+.014,point.z);mesh.scale.setScalar(.001);mesh.name='Touch ripple';mesh.userData.origin={x:point.x,z:point.z};mesh.renderOrder=3;scene.add(mesh);rings.push({mesh,start:clock.value+i*.18,strength});
  }
 }
 return {ripple,
  impact(point,speed){const strength=T.MathUtils.clamp(speed/8,.45,1.4);ripple(point,strength);splash={point:{...point},start:clock.value,strength};},
  height(x,z){let h=0;for(const w of waves){const age=clock.value-w.z,r=Math.hypot(x-w.x,z-w.y),front=r-age*1.15;if(age>=0&&age<7)h+=w.w*Math.sin(front*13)*Math.exp(-front*front*2.8)*Math.exp(-age*.52)/Math.sqrt(1+r*2);}return h;},
  update(dt,still){if(!still)clock.value+=dt;
   for(let i=rings.length-1;i>=0;i--){const r=rings[i],age=clock.value-r.start;r.mesh.visible=age>=0;if(age<0)continue;r.mesh.scale.setScalar(.07+age*1.15);r.mesh.material.uniforms.opacity.value=.23*r.strength*Math.exp(-age*.65);if(age>6){scene.remove(r.mesh);r.mesh.geometry.dispose();r.mesh.material.dispose();rings.splice(i,1);}}
   drops.forEach((m,i)=>{if(!splash){m.visible=false;return;}const t=clock.value-splash.start,a=i*2.399,v=(.5+i%4*.16)*splash.strength,y=WATER_Y+v*t-4.905*t*t;m.visible=t<.6&&y>=WATER_Y;if(m.visible){m.position.set(splash.point.x+Math.cos(a)*t*.55,y,splash.point.z+Math.sin(a)*t*.55);m.scale.set(1,1+t*3,1);}});
  }
 };
}
