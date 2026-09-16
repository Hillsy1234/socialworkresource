async browserPage => {
  const context = await browserPage.context().browser().newContext({viewport: {width: 1360, height: 900}});
  const checks = [], errors = [], requests = [];
  const assert = (ok, message) => { if (!ok) throw Error(message); checks.push(message); };
  try {
    // Observe the real renderer using Three.js's existing devtools hook. Nothing
    // is exposed by the application or added to the production bundle for tests.
    await context.addInitScript(() => {
      window.gardenInspect = {panners: [], gains: [], oscillators: 0};
      window.__THREE_DEVTOOLS__ = new EventTarget();
      __THREE_DEVTOOLS__.addEventListener('observe', event => {
        const value = event.detail;
        if (value.isScene) gardenInspect.scene = value;
        if (typeof value.render === 'function') {
          gardenInspect.renderer = value;
          const render = value.render.bind(value); let depth = 0;
          value.render = (scene, camera) => { if (!depth) gardenInspect.camera = camera; depth++; try { return render(scene, camera); } finally { depth--; } };
        }
      });
      const connect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (target, ...args) { (this.testOutputs ||= []).push(target); return connect.call(this, target, ...args); };
      for (const [method, list] of [['createGain', 'gains'], ['createPanner', 'panners']]) {
        const create = BaseAudioContext.prototype[method];
        BaseAudioContext.prototype[method] = function (...args) { const node = create.apply(this, args); gardenInspect[list].push(node); return node; };
      }
      const create = BaseAudioContext.prototype.createOscillator;
      BaseAudioContext.prototype.createOscillator = function (...args) { gardenInspect.oscillators++; return create.apply(this, args); };
    });
    const p = await context.newPage();
    p.on('pageerror', error => errors.push(error.message));
    p.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    p.on('request', request => requests.push(request.url()));
    const base = browserPage.url().split('/').slice(0, 3).join('/');
    const ready = () => p.waitForSelector('body[data-garden-ready=true]');
    await p.goto(`${base}/garden/`); await ready();
    assert(!requests.some(url => url.includes('/garden-audio/')), 'Garden remains silent without requesting audio before opt-in');
    await p.locator('#enterButton').click();
    const details = await p.evaluate(() => {
      const nodes = []; gardenInspect.scene.traverse(node => { if (node.name) nodes.push(node.name); });
      return nodes;
    });
    assert(details.filter(name => name === 'Pond fish').length === 5 && details.includes('Flowing stream'), 'The built scene contains pond fish and the feeder stream');
    await p.locator('#quietButton').click();
    assert(await p.locator('body').evaluate(node => node.classList.contains('quiet-view')), 'Quiet view clears the interface');
    assert(await p.locator('#walkHud').evaluate(node => node.inert), 'Hidden controls cannot retain keyboard focus');
    await p.keyboard.press('Escape');
    assert(!await p.locator('#walkHud').evaluate(node => node.inert), 'Escape restores accessible controls');
    await p.locator('#quietButton').click(); await p.mouse.click(700, 450);
    assert(!await p.locator('body').evaluate(node => node.classList.contains('quiet-view')), 'A tap restores controls without triggering an interaction');
    await p.locator('#mapButton').click(); await p.locator('[data-place="8"]').click(); await p.locator('#interactButton').click();
    assert(await p.locator('#sitButton').getAttribute('aria-pressed') === 'true', 'Reading nook seats the visitor beneath its roof');
    await p.locator('#readingButton').click(); const firstReading = await p.locator('#readingText').innerText();
    await p.locator('#nextReading').click(); assert(await p.locator('#readingText').innerText() !== firstReading, 'Reading nook offers different original readings');
    await p.keyboard.press('Escape');
    await p.locator('#soundButton').click();
    await p.locator('#soundMixButton').click();
    for (const [key, value] of [['birdsVolume', 35], ['windVolume', 20], ['rainVolume', 55], ['waterVolume', 0]]) {
      await p.locator(`#${key}`).fill(String(value));
      await p.locator(`#${key}`).dispatchEvent('change');
    }
    await p.locator('#doneSound').click();
    assert(await p.evaluate(() => JSON.parse(localStorage.getItem('quietGarden.walk.v1')).waterVolume === 0), 'Independent sound layers retain zero-volume settings');
    await p.locator('#motionButton').click();
    await p.locator('#weatherButton').click(); await p.locator('[data-weather=rain]').click(); await p.locator('#seasonSelect').selectOption('autumn'); await p.locator('#closeWeather').click();
    await p.waitForTimeout(1200);
    const shelter = await p.evaluate(() => {
      const rain = gardenInspect.scene.children.find(node => node.isLineSegments);
      const roof = rain.material.uniforms.roof.value, roofY = rain.material.uniforms.roofY.value, camera = gardenInspect.camera;
      const pan = gardenInspect.panners.find(node => Math.abs(node.positionX.value - roof.x) < .1 && Math.abs(node.positionZ.value - roof.y) < .1);
      const gain = gardenInspect.gains.find(node => node.testOutputs?.includes(pan));
      return {inside: Math.abs(camera.position.x - roof.x) < roof.z && Math.abs(camera.position.z - roof.y) < roof.w && camera.position.y < roofY,
        clips: rain.material.fragmentShader.includes('discard'), roofGain: gain?.gain.value};
    });
    assert(shelter.inside && shelter.clips, 'The seated camera is inside the actual rain-exclusion volume');
    assert(shelter.roofGain > .6, 'Roof patter rises under the shelter during rain');
    await p.screenshot({path: 'output/playwright/immersion-rain-nook.png'});
    await p.locator('#visitButton').click(); await p.locator('#saveFavourite').click();
    assert((await p.locator('#favouriteSummary').innerText()).includes('reading nook'), 'Favourite captures the chosen resting place');
    await p.locator('#qualitySelect').selectOption('smooth'); await p.locator('#lookSensitivity').fill('70'); await p.locator('#lookSensitivity').dispatchEvent('change'); await p.locator('#doneVisit').click();
    await p.reload(); await ready();
    assert(await p.locator('#soundButton').getAttribute('aria-pressed') === 'false', 'Returning to a favourite never autoplays audio');
    await p.locator('#favouriteEntry').click();
    assert(await p.locator('#placeName').innerText() === 'The reading nook' && await p.locator('#sitButton').getAttribute('aria-pressed') === 'true', 'Favourite returns to the saved seat after a reload');
    assert(await p.locator('#waterVolume').inputValue() === '0' && await p.locator('#seasonSelect').inputValue() === 'autumn', 'Favourite restores the saved sound balance and season');
    const frame1 = await p.locator('#world canvas').screenshot(); await p.waitForTimeout(500); const frame2 = await p.locator('#world canvas').screenshot();
    assert(frame1.equals(frame2), 'Still mode freezes new water, wildlife, clouds and rain');
    await p.locator('#weatherButton').click(); assert(await p.locator('#daylightAuto').isDisabled(), 'Still mode prevents automatic daylight changes');
    await p.locator('[data-weather=clear]').click(); await p.locator('#closeWeather').click();
    await p.locator('[data-theme=night]').click();
    assert(await p.evaluate(() => gardenInspect.scene.getObjectByName('Evening stars').visible && gardenInspect.scene.getObjectByName('Evening moon').visible), 'Clear evening reveals the moon and stars');
    await p.screenshot({path: 'output/playwright/immersion-evening.png'});
    await p.locator('[data-theme=day]').click(); await p.locator('#motionButton').click();
    await p.locator('#weatherButton').click(); await p.locator('#daylightAuto').check(); await p.locator('#closeWeather').click();
    const light = () => p.evaluate(() => gardenInspect.scene.children.find(node => node.isDirectionalLight).color.g);
    const before = await light(); await p.waitForTimeout(1000); assert(await light() !== before, 'Automatic daylight changes the rendered lighting');
    await p.locator('#mapButton').click(); await p.locator('[data-place="2"]').click();
    await p.waitForTimeout(250);
    const target = await p.evaluate(() => {
      const {camera} = gardenInspect;
      const surface = gardenInspect.scene.children.find(node => node.userData.placeIndex === 2);
      const point = surface.position.clone().set(7, -.186, 4); const screen = point.clone().project(camera);
      return {x: (screen.x + 1) / 2 * innerWidth, y: (1 - screen.y) / 2 * innerHeight};
    });
    await p.locator('#quietButton').click(); await p.keyboard.press('Escape');
    if (target.x > 0 && target.x < 1360 && target.y > 0 && target.y < 900) {
      await p.mouse.click(target.x, target.y);
      assert(await p.evaluate(() => gardenInspect.scene.children.some(node => node.name === 'Touch ripple' && Math.abs(node.userData.origin.x - 7) < .3 && Math.abs(node.userData.origin.z - 4) < .3)), 'Touching the pond places the ripple at the selected water position');
    } else throw Error('Pond interaction point is not visible: '+JSON.stringify(target));
    await p.locator('#soundButton').click();
    await p.waitForFunction(() => gardenInspect.oscillators > 0, {}, {timeout: 35000});
    assert(await p.evaluate(() => gardenInspect.panners.some(node => node.panningModel === 'HRTF')), 'Visible wildlife emits spatial bird calls');
    await p.locator('#visitButton').click(); await p.locator('#clearFavourite').click(); assert(await p.locator('#goFavourite').isDisabled(), 'Saved favourite can be removed'); await p.locator('#doneVisit').click();
    assert(errors.length === 0, `No runtime or shader errors: ${errors.join('; ')}`);
    return {passed: checks.length, checks};
  } finally { await context.close(); }
}
