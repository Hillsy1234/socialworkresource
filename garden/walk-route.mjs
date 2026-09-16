import {cleanImmersion} from './immersion-state.mjs';
import {cleanWeather} from './weather-state.mjs';
import {CatmullRomCurve3,Vector3} from 'three';
export const WALK_SAVE_KEY='quietGarden.walk.v1';
export const route=new CatmullRomCurve3([[0,30],[-5,20],[-12,12],[-14,1],[-10,-7],[-3,-4],[5,-4],[13,-4],[20,-11],[15,-23],[2,-29],[-12,-24],[-25,-29],[-34,-41],[-48,-42],[-54,-26],[-44,-13],[-40,2],[-45,18],[-31,27],[-14,24]].map(([x,z])=>new Vector3(x,0,z)),true,'centripetal');
export const ROUTE_LENGTH=route.getLength();
export const samples=Array.from({length:601},(_,i)=>route.getPointAt(i/600));
export const places=[
 {name:'The garden gate',description:'The beginning of a little time for yourself.',t:0,action:'Notice the flowers',note:'Look closely: no two petals are quite the same.',kind:'flower'},
 {name:'The wildflower border',description:'Daisies in the grass. A little room to breathe.',t:.15,action:'Let the flowers open',note:'A patch of flowers, opening to the light.',kind:'flower'},
 {name:'The water garden',description:'Pause on the bridge. Watch the light on the pond.',t:.305,action:'Make a gentle ripple',note:'Watch the circles widen, then settle.',kind:'water'},
 {name:'The silver birches',description:'Pale trunks, moving leaves and open sky.',t:.52,action:'Pause beneath the trees',note:'Notice the spaces between the leaves.',kind:'trees'},
 {name:'The woodland bench',description:'A sheltered place to sit for a moment.',t:.70,action:'Rest on the bench',note:'There is nothing you need to finish here.',kind:'bench'},
 {name:'The evening border',description:'Lanterns beside the path. A quiet way home.',t:.88,action:'Light the lanterns',note:'A little warmth along the way.',kind:'light'},
 {name:'The woodland trail',description:'A winding earth path under a canopy of trees.',t:0,action:'Listen to the woodland',note:'Leaves overhead. Birdsong between the branches.',kind:'trees'},
 {name:'The wildflower meadow',description:'Open sky, swaying grasses and butterflies.',t:0,action:'Pause in the meadow',note:'Let your gaze wander across the flowers.',kind:'flower'},
 {name:'The reading nook',description:'A timber shelter tucked into the woodland.',t:0,action:'Rest in the reading nook',note:'A quiet corner. Bring a thought, or simply sit.',kind:'bench'}
];
// Preserve the original stops by world position when the loop grows.
const stopPositions=[[0,30],[-13.887,5.773],[4.748,-3.998],[7.354,-27.81],[-48,-42],[-18.888,18.604],[-54,-26],[-45,18],[-34,-41]];
places.forEach((place,i)=>{place.t=nearestRoute(...stopPositions[i]).t;});
export const SEASONS=['spring','summer','autumn','winter'];
export function breakJourney(pace=1.3){const end=places[4].t;const speed=[.8,1.3,1.8].includes(pace)?pace:1.3;return {start:(end-speed*120/ROUTE_LENGTH+1)%1,end,speed,duration:120};}

export function nearestRoute(x,z){let best=Infinity,index=0;for(let i=0;i<samples.length;i++){const p=samples[i],d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;index=i;}}return {distance:Math.sqrt(best),t:index/600,point:samples[index]};}
export function inPond(x,z,padding=0){return ((x-5)/(8+padding))**2+((z-1)/(10+padding))**2<1;}
export function terrainHeight(x,z){return .08*Math.sin(x*.28)*Math.cos(z*.2)+Math.max(0,Math.hypot(x,z)-36)*.08 + Math.max(0,Math.min(1,(Math.hypot(x,z)-32)/18))*Math.pow(Math.sin(x*.055+z*.03),2)*3.8;}
export function groundHeight(x,z){const base=terrainHeight(x,z)+.04;if(inPond(x,z,1.55)){const n=nearestRoute(x,z);if(n.distance<1.65){const q=((x-5)/9.55)**2+((z-1)/11.55)**2;const v=Math.max(0,Math.min(1,(1-q)*2));return base+.68*v*v*(3-2*v);}}return base;}
export function canWalk(x,z,obstacles=[]){if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x,z)>70)return false;const near=nearestRoute(x,z);if(Math.hypot(x,z)>39&&near.distance>7)return false;if(inPond(x,z,.25)&&near.distance>1.08)return false;return !obstacles.some(o=>(x-o.x)**2+(z-o.z)**2<(o.r+.28)**2);}
export function cleanWalkSave(raw){const v=raw&&typeof raw==='object'?raw:{};return {...cleanImmersion(v,places.length),season:SEASONS.includes(v.season)?v.season:'summer',natureVolume:Number.isFinite(v.natureVolume)?Math.max(0,Math.min(1,v.natureVolume)):1,footstepsVolume:Number.isFinite(v.footstepsVolume)?Math.max(0,Math.min(1,v.footstepsVolume)):1,weather:cleanWeather(v.weather),weatherAuto:v.weatherAuto===true,theme:['day','sunset','night'].includes(v.theme)?v.theme:'sunset',still:v.still===true,pace:[.8,1.3,1.8].includes(v.pace)?v.pace:1.3,opened:Array.isArray(v.opened)?[...new Set(v.opened.filter(n=>Number.isInteger(n)&&n>=0&&n<places.length))]:[]};}
