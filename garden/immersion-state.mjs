export const SOUND_LAYERS = ['birdsVolume', 'windVolume', 'rainVolume', 'waterVolume'];
const unit = value => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
export const themeLight = theme => ({day: 0, sunset: 1, night: 2})[theme] ?? 1;

export function cleanImmersion(raw = {}, placeCount = 9) {
  const v = raw && typeof raw === 'object' ? raw : {};
  const layers = Object.fromEntries(SOUND_LAYERS.map(key => [key, unit(v[key])]));
  let favourite = null;
  if (Number.isInteger(v.favourite?.place) && v.favourite.place >= 0 && v.favourite.place < placeCount) {
    const f = v.favourite;
    favourite = {
      place: f.place,
      season: ['spring', 'summer', 'autumn', 'winter'].includes(f.season) ? f.season : 'summer',
      weather: ['clear', 'cloud', 'rain', 'mist'].includes(f.weather) ? f.weather : 'clear',
      theme: ['day', 'sunset', 'night'].includes(f.theme) ? f.theme : 'sunset',
      daylight: Number.isFinite(f.daylight) ? Math.max(0, Math.min(2, f.daylight)) : themeLight(f.theme),
      sitting: f.sitting === true,
      natureVolume: unit(f.natureVolume), footstepsVolume: unit(f.footstepsVolume),
      ...Object.fromEntries(SOUND_LAYERS.map(key => [key, unit(f[key])]))
    };
  }
  return {...layers, favourite, daylightAuto: v.daylightAuto === true,
    quality: ['auto', 'smooth', 'battery'].includes(v.quality) ? v.quality : 'auto',
    lookSensitivity: Number.isFinite(v.lookSensitivity) ? Math.max(.4, Math.min(1.8, v.lookSensitivity)) : 1};
}

// A visit can progress toward evening, but never jumps from night back to day.
export function daylightController(initial = 1, automatic = false) {
  let value = initial, auto = automatic;
  return {
    choose(next) { value = Math.max(0, Math.min(2, next)); },
    setAutomatic(next) { auto = next === true; },
    tick(seconds, {active = true, still = false} = {}) {
      if (auto && active && !still && Number.isFinite(seconds)) value = Math.min(2, value + Math.max(0, seconds) / 360);
      return value;
    },
    snapshot() { return value; }
  };
}

export function shelterAmount(position, shelter) {
  if (!shelter || position.y > shelter.roofY) return 0;
  const edge = Math.min(shelter.halfX - Math.abs(position.x - shelter.x), shelter.halfZ - Math.abs(position.z - shelter.z));
  return Math.max(0, Math.min(1, edge / .4));
}

// Adapt only after sustained load; do not oscillate quality on individual frames.
export function qualityController(mode = 'auto', mobile = false) {
  let scale = 1, slow = 0, fast = 0;
  return {
    get fps() { return mode === 'smooth' ? 60 : 30; },
    get scale() { return scale; },
    choose(next) { mode = next; scale = 1; slow = fast = 0; },
    sample(renderMs, elapsedMs) {
      const budget = 1000 / (mode === 'smooth' ? 60 : 30);
      if (renderMs > budget * .8 || elapsedMs > budget * 1.6) { slow++; fast = 0; }
      else if (renderMs < budget * .45 && elapsedMs < budget * 1.2) { fast++; slow = 0; }
      else { slow = Math.max(0, slow - 1); fast = 0; }
      const before = scale;
      if (slow >= 45) { scale = Math.max(.55, scale - .15); slow = 0; }
      if (fast >= 300 && mode !== 'battery') { scale = Math.min(1, scale + .1); fast = 0; }
      return before !== scale;
    },
    pixelRatio(deviceRatio = 1) { return Math.min(deviceRatio, mode === 'battery' ? .85 : mobile ? 1.25 : 1.5) * scale; }
  };
}

export const NOOK_READINGS = [
  {title: 'For a moment', text: 'The branch holds its place.\nThe water carries the light.\nFor a moment,\nyou can simply be here.'},
  {title: 'After the rain', text: 'A drop gathers on a leaf,\nwaits,\nthen falls.\nThe garden has time.'},
  {title: 'A little space', text: 'Between the trees, a patch of sky.\nBetween two tasks, a breath.\nThere is room\nfor a little space.'},
  {title: 'Notice the light', text: 'Choose one small patch of light. Notice its shape, the colour around it, and the shadows beside it. Stay as long as you like.'}
];
