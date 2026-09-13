import * as T from 'three';
// A small camera-centred rain volume, pond droplets and low translucent mist.
export function weatherScene(scene,mobile){
 const count=mobile?450:850,seeds=[],tips=[];
 let seed=58;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 for(let i=0;i<count;i++){const x=(random()-.5)*38,y=random()*18,z=(random()-.5)*38;for(const tip of[0,1]){seeds.push(x,y,z);tips.push(tip);}}
 const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.Float32BufferAttribute(seeds,3));rainGeo.setAttribute('tip',new T.Float32BufferAttribute(tips,1));
 const rainMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},amount:{value:0},tint:{value:new T.Color('#b9cdd0')}},vertexShader:`attribute float tip;uniform float time;varying float depth;void main(){vec3 p=position;p.y=mod(position.y-time*7.8,18.)+.28*tip;p.x+=.045*tip;vec4 mv=modelViewMatrix*vec4(p,1.);depth=-mv.z;gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float amount;uniform vec3 tint;varying float depth;void main(){gl_FragColor=vec4(tint,amount*.34*(1.-smoothstep(8.,25.,depth)));}`});
 const rain=new T.LineSegments(rainGeo,rainMat);rain.frustumCulled=false;scene.add(rain);
 const ringGeo=new T.RingGeometry(.8,1,24);ringGeo.rotateX(-Math.PI/2);
 const ringMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0},amount:{value:0}},vertexShader:`uniform float time;varying float age;void main(){age=fract(time*.9+instanceMatrix[3].x*.33+instanceMatrix[3].z*.47);vec3 p=position*(.015+age*.19);gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.);}`,fragmentShader:`uniform float amount;varying float age;void main(){gl_FragColor=vec4(.78,.86,.83,amount*.27*(1.-age));}`});
 const rings=new T.InstancedMesh(ringGeo,ringMat,45),dummy=new T.Object3D();for(let i=0;i<45;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*.88;dummy.position.set(5+Math.cos(a)*8*r,-.166,1+Math.sin(a)*10*r);dummy.updateMatrix();rings.setMatrixAt(i,dummy.matrix);}scene.add(rings);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');for(let i=30;i>0;i--){ctx.fillStyle=`rgba(210,222,218,${.008})`;ctx.beginPath();ctx.ellipse(128,32,i*4.2,i*.95,0,0,Math.PI*2);ctx.fill();}
 const map=new T.CanvasTexture(canvas),mist=[];for(let i=0;i<18;i++){const material=new T.SpriteMaterial({map,transparent:true,depthWrite:false,opacity:0,color:'#cbd9d1'}),sprite=new T.Sprite(material);const a=i/18*Math.PI*2,r=15+random()*23;sprite.position.set(Math.cos(a)*r,.8+random()*.4,Math.sin(a)*r);sprite.scale.set(18+random()*12,2.2+random()*1.2,1);scene.add(sprite);mist.push({sprite,x:sprite.position.x});}
 function update(time,camera,weather,theme){rain.position.set(camera.position.x,0,camera.position.z);rain.visible=weather.rain>.005;rainMat.uniforms.time.value=time;rainMat.uniforms.amount.value=weather.rain;rainMat.uniforms.tint.value.set(theme==='night'?'#8da4b4':'#c2d2d3');rings.visible=rain.visible;ringMat.uniforms.time.value=time;ringMat.uniforms.amount.value=weather.rain;mist.forEach(({sprite,x},i)=>{sprite.visible=weather.mist>.005;sprite.material.opacity=weather.mist*.7;sprite.position.x=x+Math.sin(time*.025+i)*1.5;});}
 return {update};
}
