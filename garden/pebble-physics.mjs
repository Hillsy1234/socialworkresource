// World units are metres; flight is evaluated analytically, not per rendered frame.
export const GRAVITY = 9.81;
export const WATER_Y = -.186;
export const PEBBLE_RADIUS = .045;
export function insideWater(p, margin = 0) {
  return ((p.x - 5) / (8 - margin)) ** 2 + ((p.z - 1) / (10 - margin)) ** 2 < 1;
}
export function flightTo(origin, target) {
  const distance = Math.hypot(target.x - origin.x, target.z - origin.z);
  if (!insideWater(target, .25) || distance < .6 || distance > 14 || origin.y <= WATER_Y) return null;
  const duration = Math.max(.85, Math.min(1.65, .75 + distance * .055));
  const velocity = {x: (target.x-origin.x)/duration, y: (WATER_Y+PEBBLE_RADIUS-origin.y)/duration+GRAVITY*duration/2, z: (target.z-origin.z)/duration};
  if (Math.hypot(velocity.x,velocity.y,velocity.z)>12) return null;
  return {origin:{...origin}, velocity, duration};
}
export function flightPoint(flight, time) {
  const {origin:o,velocity:v}=flight;
  return {x:o.x+v.x*time,y:o.y+v.y*time-GRAVITY*time*time/2,z:o.z+v.z*time};
}
export function impactSpeed(flight) {return Math.hypot(flight.velocity.x,flight.velocity.y-GRAVITY*flight.duration,flight.velocity.z);}
// Sweep every small interval, including after a slow frame. A collider returns
// the earliest fraction in [0,1]. Water contact is solved at its exact time.
export function advanceFlight(flight, from, to, collision = () => null) {
  const end=Math.min(to,flight.duration);
  for(let t=from;t<end-1e-9;){
    const next=Math.min(end,t+1/120),a=flightPoint(flight,t),b=flightPoint(flight,next),fraction=collision(a,b);
    if(fraction!==null) {const at=t+(next-t)*fraction;return {kind:'solid',time:at,point:flightPoint(flight,at)};}
    t=next;
  }
  if(to>=flight.duration) return {kind:'water',time:flight.duration,point:{...flightPoint(flight,flight.duration),y:WATER_Y},speed:impactSpeed(flight)};
  return null;
}
