import * as T from 'three';

export function eveningSky(scene, mobile) {
  const positions = [];
  let seed = 947;
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < (mobile ? 220 : 450); i++) {
    const a = random() * Math.PI * 2, y = .2 + random() * .8, r = Math.sqrt(1 - y * y);
    positions.push(Math.cos(a) * r * 145, y * 145, Math.sin(a) * r * 145);
  }
  const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  const material = new T.PointsMaterial({color: '#e3e5df', size: .22, transparent: true, opacity: 0, depthWrite: false, fog: false});
  const stars = new T.Points(geometry, material); stars.name = 'Evening stars'; scene.add(stars);
  const moonMaterial = new T.ShaderMaterial({transparent: true, depthWrite: false, uniforms: {opacity: {value: 0}},
    vertexShader: 'varying vec3 n;void main(){n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 n;uniform float opacity;void main(){float shade=.26+.74*max(0.,dot(normalize(n),normalize(vec3(-.45,.3,1.))));float marks=sin(n.x*38.+n.y*17.)*sin(n.y*29.-n.z*20.);gl_FragColor=vec4(vec3(.91,.92,.82)*shade*(.93+marks*.05),opacity);}' });
  const moon = new T.Mesh(new T.SphereGeometry(2.1, 24, 16), moonMaterial); moon.position.set(-50, 65, -95); moon.name = 'Evening moon'; scene.add(moon);
  return {update(daylight, cloud, mist) {
    const night = T.MathUtils.smoothstep(daylight, 1.25, 2);
    material.opacity = night * (1 - cloud) * (1 - mist * .9) * .8;
    moonMaterial.uniforms.opacity.value = night * (1 - cloud * .93) * (1 - mist * .8);
    stars.visible = material.opacity > .002; moon.visible = moonMaterial.uniforms.opacity.value > .002;
  }};
}
