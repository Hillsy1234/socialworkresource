import * as T from 'three';
import {terrainHeight, nearestRoute} from './walk-route.mjs';

// Small scenery details share the scene's clock, including its stationary view.
export function waterLife(scene, mobile) {
  const root = new T.Group(); root.name = 'Pond life and stream'; scene.add(root);
  const green = new T.MeshStandardMaterial({color: '#7d8645', roughness: .9, side: T.DoubleSide});
  const stone = new T.MeshStandardMaterial({color: '#777e6c', roughness: .95});
  const fishMaterial = new T.MeshStandardMaterial({color: '#a18b59', roughness: .7});
  const fish = [], leaves = [], reeds = [];
  const oval = new T.SphereGeometry(1, 10, 6);
  for (let i = 0; i < (mobile ? 3 : 5); i++) {
    const g = new T.Group(); g.name = 'Pond fish';
    const body = new T.Mesh(oval, fishMaterial); body.scale.set(.09, .055, .29); g.add(body);
    const tail = new T.Mesh(new T.ConeGeometry(.10, .14, 3), fishMaterial);
    tail.rotation.x = -Math.PI / 2; tail.position.z = -.31; tail.scale.y = .5; g.add(tail);
    root.add(g); fish.push({g, tail, phase: i * 2.3});
  }
  for (let i = 0; i < (mobile ? 8 : 14); i++) {
    const leaf = new T.Mesh(new T.CircleGeometry(.11, 7), green);
    leaf.rotation.x = -Math.PI / 2; leaf.scale.y = .5; root.add(leaf); leaves.push(leaf);
  }
  const reedGeo = new T.CylinderGeometry(.01, .018, 1, 4);
  const reedStems = new T.InstancedMesh(reedGeo, green, 50), reedHeads = new T.InstancedMesh(new T.CapsuleGeometry(.025, .13, 3, 5), stone, 50), dummy = new T.Object3D();
  root.add(reedStems, reedHeads);
  for (let i = 0; i < 50; i++) {
    const a = i * 2.399, x = 5 + Math.cos(a) * 8.1, z = 1 + Math.sin(a) * 10.1;
    if (nearestRoute(x, z).distance < 2) continue;
    reeds.push({x,z});
  }
  reedStems.count=reedHeads.count=reeds.length;
  const bottom = new T.Mesh(new T.CircleGeometry(1, 64), new T.MeshStandardMaterial({color: '#344e40', roughness: 1}));
  bottom.rotation.x = -Math.PI / 2; bottom.scale.set(8, 10, 1); bottom.position.set(5, -.85, 1); root.add(bottom);

  // The stream stays clear of the existing walking loop and descends into the pond.
  const streamRoute = new T.CatmullRomCurve3([[20, 12], [18, 11], [18, 8.5], [15, 8], [11, 7]].map(([x, z], i) => new T.Vector3(x, i === 4 ? -.17 : terrainHeight(x, z) + .12, z)));
  const vertices = [], uv = [], indices = [], obstacles = [];
  const bankRocks = new T.InstancedMesh(new T.IcosahedronGeometry(.24, 1), stone, 42);let rockCount=0;root.add(bankRocks);
  for (let i = 0; i <= 80; i++) {
    const t = i / 80, p = streamRoute.getPoint(t), tangent = streamRoute.getTangent(t);
    for (const side of [-1, 1]) { vertices.push(p.x - tangent.z * .42 * side, p.y, p.z + tangent.x * .42 * side); uv.push(side === -1 ? 0 : 1, t * 12); }
    if (i) { const k = i * 2; indices.push(k - 2, k - 1, k, k, k - 1, k + 1); }
    if (i % 4 === 0) {
      obstacles.push({x: p.x, z: p.z, r: .4});
      for (const side of [-1, 1]) {
        dummy.position.set(p.x - tangent.z * .52 * side, p.y - .05, p.z + tangent.x * .52 * side);
        dummy.rotation.set(0, i, 0);dummy.scale.set(1.1,.6,.9);dummy.updateMatrix();bankRocks.setMatrixAt(rockCount++,dummy.matrix);
      }
    }
  }
  const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const streamMaterial = new T.ShaderMaterial({side: T.DoubleSide, uniforms: {time: {value: 0}, light: {value: 1}},
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 vUv;uniform float time;uniform float light;void main(){float flow=pow(max(0.,sin(vUv.y*14.-time*2.4+sin(vUv.x*12.))),14.);float edge=smoothstep(0.,.2,vUv.x)*smoothstep(0.,.2,1.-vUv.x);vec3 c=mix(vec3(.22,.34,.29),vec3(.39,.55,.49),edge)+flow*.12;gl_FragColor=vec4(c*light,1.);}' });
  const stream = new T.Mesh(geometry, streamMaterial); stream.name = 'Flowing stream'; root.add(stream);
  return {obstacles, streamPosition: streamRoute.getPoint(.55),
    update(time, season, daylight, waveHeight=()=>0) {
      streamMaterial.uniforms.time.value = time; streamMaterial.uniforms.light.value = 1 - daylight * .22;
      green.color.set(season === 'autumn' ? '#a58343' : '#7d8645');
      fish.forEach(({g, tail, phase}) => {
        const a = time * .07 + phase, x = 5 + Math.sin(a) * 4.4, z = 2 + Math.sin(a * .7) * 4.7;
        g.visible = season !== 'winter'; g.position.set(x, -.40 + Math.sin(a * 2) * .025, z);
        g.rotation.y = Math.atan2(Math.cos(a) * 4.4, Math.cos(a * .7) * 3.29); tail.rotation.z = Math.sin(time * 3 + phase) * .13;
      });
      leaves.forEach((leaf, i) => { const a = time * .012 + i * 2.399; leaf.visible = season !== 'winter'; leaf.position.set(5 + Math.sin(a) * (2 + i % 4), -.163, 1 + Math.cos(a) * (3 + i % 4)); leaf.position.y+=waveHeight(leaf.position.x,leaf.position.z);leaf.rotation.z = a; });
      reeds.forEach((reed, i) => {
        const angle=Math.sin(time*.7+i)*.035;dummy.rotation.set(0,0,angle);dummy.scale.set(1,1.1,1);
        dummy.position.set(reed.x-Math.sin(angle)*.55,-.2+Math.cos(angle)*.55,reed.z);dummy.updateMatrix();reedStems.setMatrixAt(i,dummy.matrix);
        dummy.scale.set(1,1,1);dummy.position.set(reed.x-Math.sin(angle)*1.12,-.2+Math.cos(angle)*1.12,reed.z);dummy.updateMatrix();reedHeads.setMatrixAt(i,dummy.matrix);
      });reedStems.instanceMatrix.needsUpdate=reedHeads.instanceMatrix.needsUpdate=true;
    }
  };
}
