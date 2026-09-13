export const WEATHER_TYPES=['clear','cloud','rain','mist'];
export const WEATHER_LABELS={clear:'Clear skies',cloud:'Cloudy',rain:'Light rain',mist:'Mist'};
const PRESETS={clear:{cloud:0,rain:0,mist:0},cloud:{cloud:.82,rain:0,mist:0},rain:{cloud:1,rain:1,mist:.08},mist:{cloud:.28,rain:0,mist:1}};
const CYCLE=['clear','cloud','rain','cloud','mist'];
export const WEATHER_INTERVAL=120;
export const WEATHER_TRANSITION=8;
export function cleanWeather(value){return WEATHER_TYPES.includes(value)?value:'clear';}
// Active-time clock: background tabs, the welcome view and Still mode do not advance it.
export function weatherController(initial='clear',automatic=false){
 let selected=cleanWeather(initial),current={...PRESETS[selected]},from={...current},elapsed=WEATHER_TRANSITION,age=0,cycleIndex=CYCLE.indexOf(selected),auto=automatic===true;
 function choose(value,instant=false){selected=cleanWeather(value);from={...current};elapsed=instant?WEATHER_TRANSITION:0;age=0;cycleIndex=CYCLE.indexOf(selected);if(instant)current={...PRESETS[selected]};}
 function tick(dt,{still=false,active=true}={}){let changed=false;if(!still){const seconds=Number.isFinite(dt)?Math.max(0,dt):0;if(active&&auto){age+=seconds;if(age>=WEATHER_INTERVAL){cycleIndex=(cycleIndex+1)%CYCLE.length;const next=cycleIndex;choose(CYCLE[cycleIndex]);cycleIndex=next;changed=true;}}
  elapsed=Math.min(WEATHER_TRANSITION,elapsed+seconds);const x=elapsed/WEATHER_TRANSITION,e=x*x*(3-2*x);for(const key of Object.keys(current))current[key]=from[key]+(PRESETS[selected][key]-from[key])*e;
 }return {...current,selected,changed,transitioning:elapsed<WEATHER_TRANSITION};}
 return {choose,tick,setAutomatic(value){auto=value===true;age=0;},snapshot(){return {...current,selected,transitioning:elapsed<WEATHER_TRANSITION};}};
}
