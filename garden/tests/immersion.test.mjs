import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanImmersion, daylightController, shelterAmount, qualityController} from '../immersion-state.mjs';
import {cleanWalkSave} from '../walk-route.mjs';

test('Favourite places and independent audio levels survive saves without enabling sound', () => {
  const original = {favourite: {place: 8, season: 'autumn', weather: 'rain', theme: 'night', daylight: 1.8, sitting: true, birdsVolume: 0, rainVolume: .4}, birdsVolume: 0, lookSensitivity: .7};
  const saved = cleanWalkSave(JSON.parse(JSON.stringify(original)));
  assert.equal(saved.favourite.place, 8); assert.equal(saved.favourite.birdsVolume, 0);
  assert.equal(saved.favourite.daylight, 1.8); assert.equal(saved.favourite.rainVolume, .4);
  assert.equal(saved.birdsVolume, 0); assert.equal(saved.lookSensitivity, .7);
  assert.equal('sound' in saved, false); assert.equal('enabled' in saved.favourite, false);
  assert.equal(saved.daylightAuto, false);
});

test('Untrusted favourite, performance and sound preferences cannot escape their allowed values', () => {
  assert.equal(cleanImmersion({favourite: {place: 99}}).favourite, null);
  assert.equal(cleanImmersion({favourite: {place: '8'}}).favourite, null);
  const saved = cleanImmersion({favourite: {place: 8, weather: 'storm', season: '<script>', daylight: Infinity, birdsVolume: -20}, rainVolume: 20, windVolume: '0', quality: 'unlimited', lookSensitivity: 999});
  assert.equal(saved.favourite.weather, 'clear'); assert.equal(saved.favourite.season, 'summer');
  assert.equal(saved.favourite.daylight, 1); assert.equal(saved.favourite.birdsVolume, 0);
  assert.equal(saved.rainVolume, 1); assert.equal(saved.windVolume, 1);
  assert.equal(saved.quality, 'auto'); assert.equal(saved.lookSensitivity, 1.8);
});

test('Daylight advances only during an active moving view and rests at evening', () => {
  const clock = daylightController(0, true);
  assert.equal(clock.tick(360, {active: false}), 0);
  assert.equal(clock.tick(360, {still: true}), 0);
  assert.equal(clock.tick(180), .5);
  clock.setAutomatic(false); assert.equal(clock.tick(180), .5);
  clock.choose(1.25); clock.setAutomatic(true);
  assert.equal(clock.tick(360), 2); assert.equal(clock.tick(360), 2);
});

test('The shelter excludes its exterior and roof while softening its edge', () => {
  const roof = {x: 5, z: -10, roofY: 4, halfX: 1.65, halfZ: 1.35};
  assert.equal(shelterAmount({x: 5, y: 2, z: -10}, roof), 1);
  assert.equal(shelterAmount({x: 5, y: 5, z: -10}, roof), 0);
  assert.equal(shelterAmount({x: 7, y: 2, z: -10}, roof), 0);
  const edge = shelterAmount({x: 6.5, y: 2, z: -10}, roof);
  assert.ok(edge > 0 && edge < 1);
});

test('Adaptive quality responds to sustained load with bounded recovery', () => {
  const quality = qualityController('smooth'); assert.equal(quality.fps, 60);
  for (let i = 0; i < 44; i++) quality.sample(25, 50);
  assert.equal(quality.scale, 1); assert.equal(quality.sample(25, 50), true);
  assert.equal(quality.scale, .85);
  for (let i = 0; i < 1000; i++) quality.sample(40, 80);
  assert.equal(quality.scale, .55);
  for (let i = 0; i < 300; i++) quality.sample(2, 16.7);
  assert.ok(quality.scale > .55 && quality.scale < 1);
  quality.choose('battery'); assert.equal(quality.fps, 30); assert.ok(quality.pixelRatio(3) <= .85);
});
