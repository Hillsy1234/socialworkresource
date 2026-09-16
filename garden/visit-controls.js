import {SOUND_LAYERS, NOOK_READINGS} from './immersion-state.mjs';
import {places} from './walk-route.mjs';

export function visitControls({saved, save, announce, stopWalking, getView, restore, onQuality, prepareQuiet, isGuided, canMove}) {
  const $ = id => document.getElementById(id);
  let quiet = false, reading = 0;
  const gestures = new Map();
  const surfaces = [document.querySelector('header'), $('walkHud'), $('bottomDock')];
  function showControls() {
    if (!quiet) return false;
    quiet = false; gestures.clear(); document.body.classList.remove('quiet-view'); $('showControls').hidden = true;
    surfaces.forEach(node => { node.inert = false; node.removeAttribute('aria-hidden'); });
    const focusTarget=!$('zipRidePanel').hidden?($('pauseZip').disabled?$('finishZip'):$('pauseZip')):$('quietButton');
    focusTarget.focus({preventScroll: true});
    return true;
  }
  $('quietButton').onclick = () => {
    prepareQuiet(); quiet = true;
    announce(canMove() ? `${isGuided() ? 'Your walk continues. ' : ''}Hold the arrows or use W A S D to walk. Drag to look. Tap elsewhere for controls; Esc also pauses.` : isGuided() ? 'Your glide continues. Drag to look. Tap for controls; Esc also pauses.' : 'Controls hidden. Tap or press Esc to show them again.');
    for (const id of ['mapPanel', 'weatherPanel']) $(id).hidden = true;
    $('mapButton').setAttribute('aria-expanded', 'false'); $('weatherButton').setAttribute('aria-expanded', 'false');
    document.body.classList.add('quiet-view'); $('showControls').hidden = false; $('showControls').focus({preventScroll: true});
    surfaces.forEach(node => { node.inert = true; node.setAttribute('aria-hidden', 'true'); });
  };
  $('showControls').onclick = showControls;
  // Movement buttons keep working. A background tap restores the panels;
  // dragging the scene continues to use the normal look controls.
  document.addEventListener('pointerdown', event => {
    if (quiet && event.button === 0 && !event.target.closest('#quietWalk, #showControls'))
      gestures.set(event.pointerId, {x: event.clientX, y: event.clientY, distance: 0});
  }, true);
  document.addEventListener('pointermove', event => {
    const g = gestures.get(event.pointerId);
    if (g) { g.distance += Math.abs(event.clientX-g.x)+Math.abs(event.clientY-g.y); g.x=event.clientX; g.y=event.clientY; }
  }, true);
  document.addEventListener('pointerup', event => {
    const g = gestures.get(event.pointerId); gestures.delete(event.pointerId);
    if (quiet && g && g.distance + Math.abs(event.clientX-g.x)+Math.abs(event.clientY-g.y) < 6) {
      showControls(); event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('pointercancel', event => gestures.delete(event.pointerId), true);
  document.addEventListener('keydown', event => {
    if (quiet && event.code === 'Escape') { showControls(); stopWalking(); event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.addEventListener('blur', showControls);

  function summary() {
    const f = saved.favourite;
    $('favouriteSummary').textContent = f ? `Your quiet spot: ${places[f.place].name}. Its season, weather and sound balance are saved.` : 'Save a place, its season, weather and sound balance for next time.';
    $('goFavourite').disabled = $('clearFavourite').disabled = !f;
    $('favouriteEntry').hidden = !f;
    if (f) $('favouriteEntry').textContent = `Return to ${places[f.place].name.toLowerCase()} ↗`;
  }
  $('visitButton').onclick = () => { stopWalking(); summary(); $('visitStatus').textContent = ''; $('visitDialog').showModal(); };
  for (const id of ['closeVisit', 'doneVisit']) $(id).onclick = () => $('visitDialog').close();
  $('saveFavourite').onclick = () => {
    const previous = saved.favourite;
    saved.favourite = {...getView(), season: saved.season, weather: saved.weather, theme: saved.theme,
      natureVolume: saved.natureVolume, footstepsVolume: saved.footstepsVolume,
      ...Object.fromEntries(SOUND_LAYERS.map(key => [key, saved[key]]))};
    if (!save()) { saved.favourite = previous; $('visitStatus').textContent = 'Saving is unavailable in this browser. Your saved spot is unchanged.'; return; }
    summary(); $('visitStatus').textContent = 'Your quiet spot is saved for another visit.'; announce($('visitStatus').textContent);
  };
  const returnToFavourite = () => {
    if (!saved.favourite) return;
    $('visitDialog').close();
    if (!document.body.classList.contains('playing')) $('enterButton').click();
    restore(saved.favourite); announce(`Welcome back to ${places[saved.favourite.place].name.toLowerCase()}.`);
  };
  $('goFavourite').onclick = $('favouriteEntry').onclick = returnToFavourite;
  $('clearFavourite').onclick = () => {
    const previous = saved.favourite; saved.favourite = null;
    if (!save()) { saved.favourite = previous; $('visitStatus').textContent = 'Saving is unavailable in this browser. Your saved spot is unchanged.'; return; }
    summary(); $('visitStatus').textContent = 'Saved quiet spot cleared.'; announce($('visitStatus').textContent);
  };
  $('qualitySelect').value = saved.quality;
  $('qualitySelect').onchange = () => { saved.quality = $('qualitySelect').value; onQuality(); save(); };
  $('lookSensitivity').value = Math.round(saved.lookSensitivity * 100);
  const sensitivityLabel = () => { $('lookSensitivityValue').textContent = `${$('lookSensitivity').value}%`; };
  sensitivityLabel();
  $('lookSensitivity').oninput = () => { saved.lookSensitivity = Number($('lookSensitivity').value) / 100; sensitivityLabel(); };
  $('lookSensitivity').onchange = save;

  function page() { $('readingTitle').textContent = NOOK_READINGS[reading].title; $('readingText').textContent = NOOK_READINGS[reading].text; }
  $('readingButton').onclick = () => { stopWalking(); page(); $('readingDialog').showModal(); };
  $('nextReading').onclick = () => { reading = (reading + 1) % NOOK_READINGS.length; page(); };
  for (const id of ['closeReading', 'doneReading']) $(id).onclick = () => $('readingDialog').close();
  summary();
  return {showControls, update(place) { $('readingButton').hidden = place !== 8; }};
}
