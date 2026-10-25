// Solar-system self-test for index.html, loaded only for ?solarTest=1 (see the end of index.html's script).
// Classic script, not a module: it shares the page's top-level globals and drives the real code paths.
  function runSolarSelfTests() {
    var failures = [];
    function statusText() {
      var L = (typeof beaconLang === 'string' && ['en', 'hans', 'hant', 'ja', 'ko'].indexOf(beaconLang) !== -1) ? beaconLang : 'en';
      var text = {
        en: ['solar self-tests passed', 'solar self-tests failed'], hans: ['太阳系自检通过', '太阳系自检失败'],
        hant: ['太陽系自檢通過', '太陽系自檢失敗'], ja: ['太陽系セルフテストに合格しました', '太陽系セルフテストに失敗しました'],
        ko: ['태양계 자체 검사를 통과했습니다', '태양계 자체 검사에 실패했습니다']
      }[L];
      return failures.length ? text[1] : text[0];
    }
    function check(name, fn) { try { fn(); } catch (e) { failures.push(name + ': ' + e.message); } }
    function ok(v, msg) { if (!v) throw new Error(msg); }
    var runMotionOverride = solarMotionOverride; solarMotionOverride = false; // clock checks must not depend on the tester's OS reduce-motion setting; checks that need it set it themselves
    check('data', function () { ok(assertSolarData(), 'assertSolarData did not return true'); });
    check('beacon-data', function () { ok(assertBeaconInfo(), 'assertBeaconInfo did not return true'); }); // every card, every language
    check('zodiac-data', function () { ok(assertZodiacData(), 'assertZodiacData did not return true'); });
    check('body-count', function () { ok(SOLAR_BODIES.length === 18, 'expected 18 selectable bodies'); });
    check('parents', function () {
      ['moon','io','europa','ganymede','callisto','titan','triton'].forEach(function (id) {
        ok(SOLAR_BY_ID[id] && SOLAR_BY_ID[SOLAR_BY_ID[id].parent], id + ' parent missing');
      });
    });
    check('scale-order', function () {
      ok(solarOrbitRadius(0.39) < solarOrbitRadius(30.1), 'orbit mapping is not monotonic');
      ok(solarDisplayRadius(4879) < solarDisplayRadius(139820), 'body mapping is not monotonic');
    });
    check('localized-cards', function () {
      var fields = ['distance', 'diameter', 'orbit', 'rotation', 'temperature', 'moons', 'catalog'];
      SOLAR_BODIES.forEach(function (b) {
        SOLAR_LANGS.forEach(function (L) {
          if (L === 'en') return;
          fields.forEach(function (f) { ok(b.info[L][f] !== b.info.en[f], b.id + ' ' + f + ' is not localized for ' + L); });
          ok(b.info[L].facts[1][1] !== b.info.en.facts[1][1], b.id + ' feature fact is not localized for ' + L);
          ok(b.info[L].facts[1][1] !== b.info[L].desc, b.id + ' feature fact duplicates the description for ' + L);
        });
      });
    });
    check('curated-cards', function () {
      var sunBodies = { en: 'Planets / dwarf planets: 8 / 5', hans: '行星 / 矮行星：8 / 5', hant: '行星 / 矮行星：8 / 5', ja: '惑星 / 準惑星：8 / 5', ko: '행성 / 왜행성: 8 / 5' };
      var jupiterFeatures = { en: 'Great Red Spot storm', hans: '大红斑风暴', hant: '大紅斑風暴', ja: '大赤斑の嵐', ko: '대적점 폭풍' };
      SOLAR_LANGS.forEach(function (L) {
        ok(SOLAR_BY_ID.sun.info[L].moons === sunBodies[L], 'sun body count is not curated for ' + L);
        ok(SOLAR_BY_ID.sun.info[L].catalog.indexOf('Sol / G2V') !== -1, 'sun catalog is not preserved for ' + L);
        ok(SOLAR_BY_ID.jupiter.info[L].facts[1][1] === jupiterFeatures[L], 'jupiter feature is not curated for ' + L);
      });
    });
    check('solar-entry', function () {
      ok(typeof enterSolar === 'function', 'enterSolar missing');
      ok(typeof exitSolar === 'function', 'exitSolar missing');
    });
    check('solar-overlay', function () {
      ok(document.getElementById('solarlabels'), 'solarlabels missing');
      ok(document.getElementById('solarback'), 'solarback missing');
    });
    check('solar-card', function () {
      renderPanel(0, 'en');
      ok(document.getElementById('bp-solar-link'), 'bp-solar-link missing');
      ok(!document.getElementById('bp-' + 'zodiac-link'), 'legacy sky link must not appear on the Solar System card');
    });
    check('solar-card-rendering', function () {
      var fields = ['distance', 'diameter', 'orbit', 'rotation', 'temperature', 'moons'], expectedCardCredits = {
        sun: 'NASA/SDO (AIA)', mercury: 'NASA/JHU APL/Carnegie · MESSENGER', venus: 'NASA · Mariner 10', earth: 'NASA · Apollo 17', moon: 'NASA/GSFC/ASU · LRO', mars: 'NASA/JPL-Caltech/USGS · Viking', ceres: 'NASA/JPL-Caltech · Dawn', jupiter: 'NASA/JPL/SSI · Cassini', io: 'NASA/JPL/Univ. Arizona · Galileo', europa: 'NASA/JPL/DLR · Galileo', ganymede: 'NASA/JPL · Galileo', callisto: 'NASA/JPL/DLR · Galileo', saturn: 'NASA/JPL/SSI · Cassini', titan: 'NASA/JPL-Caltech/SSI · Cassini', uranus: 'NASA/JPL-Caltech · Voyager 2', neptune: 'NASA · Voyager 2', triton: 'NASA/JPL/USGS · Voyager 2', pluto: 'NASA/JHU APL/SwRI · New Horizons'
      };
      ok(Object.keys(expectedCardCredits).length === SOLAR_BODIES.length, 'card credit map is incomplete');
      SOLAR_BODIES.forEach(function (body) {
        ok(typeof body.cardCredit === 'string' && body.cardCredit.length > 0, body.id + ' card credit missing');
        ok(body.cardCredit === expectedCardCredits[body.id], body.id + ' card credit does not match the required credit');
        ok(body.cardImage === 'images/solar-system/cards/' + body.id + '.jpg', body.id + ' card image is not the unified NASA photo');
        renderSolarPanel(body.id, 'en');
        var image = document.getElementById('bp-img'), credit = document.getElementById('bp-credit');
        ok(image && credit, body.id + ' card image structure missing');
        ok(image.getAttribute('alt') === body.info.en.name, body.id + ' card image alt is not localized');
        ok(credit.textContent === body.cardCredit, body.id + ' card credit mismatch');
        ok(image.getAttribute('src') === body.cardImage, body.id + ' card image is not the unified NASA photo');
        ok(image.src.indexOf(location.origin + '/') === 0, body.id + ' card image is not local');
        SOLAR_LANGS.forEach(function (L) {
          var info = body.info[L];
          renderSolarPanel(body.id, L);
          ok(document.getElementById('bp-name').textContent === info.name, body.id + ' name did not render for ' + L);
          ok(document.getElementById('bp-type').textContent === info.type, body.id + ' type did not render for ' + L);
          ok(document.getElementById('bp-img').getAttribute('alt') === info.name, body.id + ' card image alt is not localized for ' + L);
          fields.forEach(function (field) {
            var row = bpBody.querySelector('[data-solar-field="' + field + '"]');
            ok(row && row.textContent.indexOf(info[field]) !== -1, body.id + ' ' + field + ' row missing for ' + L);
          });
          var factRows = bpBody.querySelectorAll('[data-solar-fact]');
          ok(factRows.length === info.facts.length, body.id + ' facts missing for ' + L);
          info.facts.forEach(function (fact, i) {
            ok(factRows[i].querySelector('.k').textContent === fact[0] && factRows[i].querySelector('.v').textContent === fact[1], body.id + ' fact pair missing for ' + L);
          });
          ok(document.getElementById('bp-desc').textContent === info.desc, body.id + ' description missing for ' + L);
          ok(document.getElementById('bp-cat').textContent === info.catalog, body.id + ' catalog missing for ' + L);
          ok(!!document.getElementById('bp-earth-sky-link') === (body.id === 'earth'), body.id + ' Earth sky link mismatch for ' + L);
        });
      });
      clearSolarCard();
    });
    check('solar-card-accent', function () {
      ok(typeof solarCardAccent === 'function', 'solarCardAccent missing');
      ok(solarCardAccent('#12aBcD') === '#12aBcD', 'valid Solar System accent changed');
      ok(solarCardAccent('red') === '#8fc2ff', 'invalid Solar System accent did not use the fallback');
      ok(solarCardAccent('#12345') === '#8fc2ff', 'short Solar System accent did not use the fallback');
    });
    check('earth-sky-return', function () {
      ok(typeof enterSkyFromEarth === 'function', 'enterSkyFromEarth missing');
      ok(typeof returnSkyToEarth === 'function', 'returnSkyToEarth missing');
      var oldView = viewMode, oldPosition = solarCamera.position.clone(), oldTarget = solarControls.target.clone();
      var oldNav = { level: solarNav.level, selectedId: solarNav.selectedId, parentId: solarNav.parentId, cameraStack: solarNav.cameraStack.slice(), galaxySnapshot: solarNav.galaxySnapshot, skySnapshot: solarNav.skySnapshot };
      var oldCardOpen = solarCardOpen, oldSkyReturn = skyReturnContext, oldPaused = solarPaused, oldSavedGalaxy = savedGalaxyView;
      var oldControls = { galaxy: controls.enabled, solar: solarControls.enabled, sky: skyControls.enabled, minDistance: solarControls.minDistance, maxDistance: solarControls.maxDistance };
      var oldTiming = { solarFrameLast: solarFrameLast, perfLast: perfLast };
      var oldPanel = { html: bpBody.innerHTML, open: bpEl.classList.contains('open') };
      var oldDisplay = { beacons: document.getElementById('beacons').style.display, skyLabels: document.getElementById('skylabels').style.display, skyBack: skybackEl.style.display, solarLabels: solarLabelsEl.style.display, solarBack: solarBackEl.style.display };
      try {
        if (viewMode !== 'solar') enterSolar();
        focusSolarBody('earth');
        var earthPosition = solarCamera.position.clone(), earthTarget = solarControls.target.clone();
        ok(enterSkyFromEarth(), 'Earth did not enter the sky view');
        ok(viewMode === 'sky' && skyReturnContext && skyReturnContext.solar.panelOpen, 'Earth sky context did not retain its open card');
        ok(returnSkyToEarth(), 'Earth sky return did not complete');
        ok(viewMode === 'solar' && solarNav.selectedId === 'earth' && solarNav.parentId === null, 'Earth selection did not return');
        ok(solarCamera.position.distanceTo(earthPosition) === 0 && solarControls.target.distanceTo(earthTarget) === 0, 'Earth camera did not return');
        ok(solarCardOpen && bpEl.classList.contains('open') && document.getElementById('bp-earth-sky-link'), 'Earth card did not return');
      } finally {
        if (viewMode === 'sky') exitSky();
        if (viewMode === 'solar' && oldView !== 'solar') exitSolar();
        solarCamera.position.copy(oldPosition); solarControls.target.copy(oldTarget); solarControls.update();
        solarNav.level = oldNav.level; solarNav.selectedId = oldNav.selectedId; solarNav.parentId = oldNav.parentId; solarNav.cameraStack = oldNav.cameraStack; solarNav.galaxySnapshot = oldNav.galaxySnapshot; solarNav.skySnapshot = oldNav.skySnapshot;
        savedGalaxyView = oldSavedGalaxy; solarCardOpen = oldCardOpen; skyReturnContext = oldSkyReturn; setSolarPaused(oldPaused); viewMode = oldView;
        controls.enabled = oldControls.galaxy; solarControls.enabled = oldControls.solar; skyControls.enabled = oldControls.sky; solarControls.minDistance = oldControls.minDistance; solarControls.maxDistance = oldControls.maxDistance;
        solarFrameLast = oldTiming.solarFrameLast; perfLast = oldTiming.perfLast;
        document.getElementById('beacons').style.display = oldDisplay.beacons; document.getElementById('skylabels').style.display = oldDisplay.skyLabels; skybackEl.style.display = oldDisplay.skyBack; solarLabelsEl.style.display = oldDisplay.solarLabels; solarBackEl.style.display = oldDisplay.solarBack;
        bpBody.innerHTML = oldPanel.html; bpEl.classList.toggle('open', oldPanel.open); updateSolarVisibility();
      }
    });
    check('solar-event-routes', function () {
      var oldView = viewMode, oldPosition = solarCamera.position.clone(), oldTarget = solarControls.target.clone();
      var oldNav = { level: solarNav.level, selectedId: solarNav.selectedId, parentId: solarNav.parentId, cameraStack: solarNav.cameraStack.slice(), galaxySnapshot: solarNav.galaxySnapshot, skySnapshot: solarNav.skySnapshot };
      var oldCardOpen = solarCardOpen, oldSkyReturn = skyReturnContext, oldPaused = solarPaused, oldSavedGalaxy = savedGalaxyView;
      var oldPanel = { html: bpBody.innerHTML, open: bpEl.classList.contains('open') };
      var oldControls = { galaxy: controls.enabled, solar: solarControls.enabled, sky: skyControls.enabled, minDistance: solarControls.minDistance, maxDistance: solarControls.maxDistance };
      var oldTiming = { solarFrameLast: solarFrameLast, perfLast: perfLast };
      var oldDisplay = { beacons: document.getElementById('beacons').style.display, skyLabels: document.getElementById('skylabels').style.display, skyBack: skybackEl.style.display, solarLabels: solarLabelsEl.style.display, solarBack: solarBackEl.style.display };
      var oldSkySelection = { constellation: window.skySelected, galaxy: window.skyGalSelected };
      try {
        if (viewMode !== 'solar') enterSolar();
        focusSolarBody('mars');
        ok(!document.getElementById('bp-earth-sky-link'), 'non-Earth card exposed a sky link');
        var forgedLink = document.createElement('button'); forgedLink.id = 'bp-earth-sky-link'; bpBody.appendChild(forgedLink);
        forgedLink.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        ok(viewMode === 'solar' && solarNav.selectedId === 'mars', 'non-Earth delegated click entered the sky');
        forgedLink.parentNode.removeChild(forgedLink);
        focusSolarBody('earth');
        var earthPosition = solarCamera.position.clone(), earthTarget = solarControls.target.clone();
        document.getElementById('bp-close').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        ok(!solarCardOpen && !bpEl.classList.contains('open'), 'Solar System close button did not close the card');
        ok(solarNav.selectedId === 'earth' && solarCamera.position.distanceTo(earthPosition) === 0 && solarControls.target.distanceTo(earthTarget) === 0, 'Solar System close button changed the Earth focus');
        renderSolarPanel('earth', beaconLang);
        document.getElementById('bp-earth-sky-link').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        ok(viewMode === 'sky' && skyReturnContext, 'Earth sky button click did not enter the sky');
        selectSky(0);
        ok(bpEl.classList.contains('open'), 'sky card did not open before Escape');
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        ok(viewMode === 'sky' && !bpEl.classList.contains('open'), 'first sky Escape did not close only the sky card');
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        ok(viewMode === 'solar' && solarNav.selectedId === 'earth' && solarCardOpen, 'second sky Escape did not restore Earth');
        ok(solarCamera.position.distanceTo(earthPosition) === 0 && solarControls.target.distanceTo(earthTarget) === 0, 'second sky Escape did not restore the Earth camera');
      } finally {
        if (viewMode === 'sky') exitSky();
        if (viewMode === 'solar' && oldView !== 'solar') exitSolar();
        solarCamera.position.copy(oldPosition); solarControls.target.copy(oldTarget); solarControls.update();
        solarNav.level = oldNav.level; solarNav.selectedId = oldNav.selectedId; solarNav.parentId = oldNav.parentId; solarNav.cameraStack = oldNav.cameraStack; solarNav.galaxySnapshot = oldNav.galaxySnapshot; solarNav.skySnapshot = oldNav.skySnapshot;
        savedGalaxyView = oldSavedGalaxy; solarCardOpen = oldCardOpen; skyReturnContext = oldSkyReturn; setSolarPaused(oldPaused); viewMode = oldView;
        controls.enabled = oldControls.galaxy; solarControls.enabled = oldControls.solar; skyControls.enabled = oldControls.sky; solarControls.minDistance = oldControls.minDistance; solarControls.maxDistance = oldControls.maxDistance;
        solarFrameLast = oldTiming.solarFrameLast; perfLast = oldTiming.perfLast;
        document.getElementById('beacons').style.display = oldDisplay.beacons; document.getElementById('skylabels').style.display = oldDisplay.skyLabels; skybackEl.style.display = oldDisplay.skyBack; solarLabelsEl.style.display = oldDisplay.solarLabels; solarBackEl.style.display = oldDisplay.solarBack;
        window.skySelected = oldSkySelection.constellation; window.skyGalSelected = oldSkySelection.galaxy;
        bpBody.innerHTML = oldPanel.html; bpEl.classList.toggle('open', oldPanel.open); updateSolarVisibility();
      }
    });
    check('solar-transition', function () {
      var startPosition = camera.position.clone(), startTarget = controls.target.clone(), oldFly = flyState;
      var hadReturn = !!returnBtn, oldReturnDisplay = hadReturn ? returnBtn.style.display : '';
      if (!returnBtn) showReturnBtn(true); else returnBtn.style.display = 'block';
      flyState = { active: true };
      try {
        enterSolar();
        ok(viewMode === 'solar', 'enterSolar did not switch viewMode');
        ok(!controls.enabled && !skyControls.enabled && solarControls.enabled, 'controls did not switch to solar');
        ok(flyState === null, 'enterSolar did not cancel the galaxy fly');
        ok(document.getElementById('beacons').style.display === 'none', 'beacons remain visible in solar view');
        ok(solarLabelsEl.style.display === '' && solarBackEl.style.display === 'block', 'solar overlays did not open');
        ok(returnBtn.style.display === 'none', 'galaxy return control remains visible in solar view');
        ok(savedGalaxyView && savedGalaxyView.position !== camera.position && savedGalaxyView.target !== controls.target, 'galaxy view was not cloned');
        camera.position.set(999, 888, 777); controls.target.set(66, 55, 44);
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        ok(viewMode === 'galaxy', 'Escape did not exit solar view');
        ok(controls.enabled && !skyControls.enabled && !solarControls.enabled, 'controls did not return to galaxy');
        ok(document.getElementById('beacons').style.display === '', 'beacons did not return');
        ok(solarLabelsEl.style.display === 'none' && solarBackEl.style.display === 'none', 'solar overlays did not close');
        ok(returnBtn.style.display === 'block', 'galaxy return control did not restore');
        ok(camera.position.distanceTo(startPosition) === 0 && controls.target.distanceTo(startTarget) === 0, 'galaxy camera was not restored exactly');
      } finally {
        if (viewMode === 'solar') exitSolar();
        camera.position.copy(startPosition); controls.target.copy(startTarget); controls.update();
        flyState = oldFly;
        if (hadReturn) returnBtn.style.display = oldReturnDisplay;
        else if (returnBtn) { returnBtn.parentNode.removeChild(returnBtn); returnBtn = null; }
      }
    });
    check('solar-resize', function () {
      camera.aspect = 1; skyCamera.aspect = 1; solarCamera.aspect = 1;
      window.dispatchEvent(new Event('resize'));
      ok(camera.aspect === window.innerWidth / window.innerHeight, 'resize did not update galaxy camera');
      ok(skyCamera.aspect === window.innerWidth / window.innerHeight, 'resize did not update sky camera');
      ok(solarCamera.aspect === window.innerWidth / window.innerHeight, 'resize did not update solar camera');
    });
    check('solar-adaptive-accessibility', function () {
      ok(typeof applySolarPerformanceTier === 'function', 'performance tier API missing');
      ok(typeof solarPerformanceStage === 'undefined', 'ambiguous performance stage converter remains public');
      ok(typeof sampleSolarPerformance === 'function', 'Solar frame watchdog missing');
      ok(typeof resetSolarPerformanceWatchdog === 'function', 'Solar watchdog reset missing');
      ok(typeof refreshSolarResponsiveState === 'function', 'responsive Solar refresh missing');
      ok(typeof solarReducedMotion === 'function', 'reduced-motion helper missing');
      ok(typeof frameSolarForViewport === 'function', 'viewport framing guard missing');
      ok(typeof routeSolarGestureZoom === 'function', 'Solar Safari pinch routing helper missing');
      ['solarback', 'skyback', 'bp-close'].forEach(function (id) {
        var control = document.getElementById(id);
        ok(control && control.tagName === 'BUTTON', id + ' is not a button');
        ok(control.getAttribute('aria-label'), id + ' has no accessible name');
      });
      var oldView = viewMode, oldNav = { level: solarNav.level, selectedId: solarNav.selectedId, parentId: solarNav.parentId, cameraStack: solarNav.cameraStack.slice(), galaxySnapshot: solarNav.galaxySnapshot, skySnapshot: solarNav.skySnapshot }, oldCard = solarCardOpen, oldScale = perfScale, oldMotionOverride = solarMotionOverride, oldCompactOverride = solarCompactOverride, oldPaused = solarPaused;
      var oldPosition = solarCamera.position.clone(), oldTarget = solarControls.target.clone(), oldGestureDist = gestureDist, oldPerf = { stage: solarPerf.stage, epoch: solarPerf.epoch, beltFraction: solarPerf.beltFraction, backgroundFraction: solarPerf.backgroundFraction, backgroundEvery: solarPerf.backgroundEvery, labelEvery: solarPerf.labelEvery };
      var oldControls = { galaxy: controls.enabled, solar: solarControls.enabled, sky: skyControls.enabled, skyAuto: skyControls.autoRotate }, oldPanel = { html: bpBody.innerHTML, open: bpEl.classList.contains('open') };
      try {
        solarMotionOverride = true;
        solarCompactOverride = true;
        renderPanel(0, beaconLang);
        ok(document.getElementById('bp-solar-link').getAttribute('aria-label'), 'Solar entry has no accessible name');
        SOLAR_LANGS.forEach(function (L) {
          renderPanel(0, L);
          ok(document.getElementById('bp-solar-link').getAttribute('aria-label') === { en: 'Explore the Solar System →', hans: '探索太阳系 →', hant: '探索太陽系 →', ja: '太陽系を探索する →', ko: '태양계 탐험하기 →' }[L], 'Solar entry is not localized for ' + L);
          renderSolarPanel('earth', L);
          ok(document.getElementById('bp-earth-sky-link').getAttribute('aria-label') === document.getElementById('bp-earth-sky-link').textContent, 'Earth sky entry is not localized for ' + L);
        });
        if (viewMode !== 'solar') enterSolar();
        updateSolarLabels();
        Object.keys(solarLabelButtons).forEach(function (id) {
          var label = solarLabelButtons[id];
          ok(label.tagName === 'BUTTON' && label.getAttribute('aria-label'), id + ' label is not an accessible button');
        });
        focusSolarBody('earth');
        var earth = SOLAR_OBJECTS.earth, cardWasOpen = solarCardOpen;
        ok(document.getElementById('bp-earth-sky-link').getAttribute('aria-label'), 'Earth sky entry has no accessible name');
        var reducedElapsed = solarElapsed, reducedSpin = earth.spinNode.rotation.y;
        setSolarPaused(false); updateSolarMotion(0.1);
        ok(solarElapsed === reducedElapsed && earth.spinNode.rotation.y === reducedSpin, 'reduced motion left decorative Solar rotation running');
        var targetBeforeRefresh = solarControls.target.clone();
        refreshSolarResponsiveState();
        ok(frameSolarForViewport() === false && solarControls.target.distanceTo(targetBeforeRefresh) === 0, 'compact drawer reframed the selected body');
        gestureDist = solarCamera.position.distanceTo(solarControls.target);
        var pinchDistance = gestureDist;
        ok(routeSolarGestureZoom(2), 'Solar pinch was not routed to the Solar camera');
        ok(solarCamera.position.distanceTo(solarControls.target) < pinchDistance, 'Solar pinch did not zoom the Solar camera');
        applySolarPerformanceTier(3);
        ok(earth.lodGroup.visible && earth.hitProxy.visible && earth.hitProxy.userData.solarActive, 'lowest tier hid the selected Earth or its proxy');
        ok(solarCardOpen === cardWasOpen, 'lowest tier closed the selected card');
        ok(solarAsteroidBelt.geometry.drawRange.count < solarAsteroidBelt.geometry.attributes.position.count, 'lowest tier did not reduce asteroid draw range');
        [1, 2, 3].forEach(function (stage) {
          applySolarPerformanceTier(stage);
          ok(solarPerf.stage === stage, 'performance stage did not apply in order');
        });
        ok(earth.specialty.clouds.visible && earth.specialty.atmosphere.visible, 'lowest stage removed selected Earth detail');
        applySolarPerformanceTier(0);
        ok(solarPerf.stage === 0, 'performance recovery was not reversible');
        resetSolarPerformanceWatchdog(0); solarPerfEMA = 45; solarPerfNextCheck = 0; sampleSolarPerformance(1);
        ok(solarPerf.stage === 1, 'Solar watchdog did not advance only the next degradation stage');
      } finally {
        solarMotionOverride = oldMotionOverride;
        solarCompactOverride = oldCompactOverride;
        applySolarPerformanceTier(oldPerf.stage);
        solarPerf.stage = oldPerf.stage; solarPerf.epoch = oldPerf.epoch; solarPerf.beltFraction = oldPerf.beltFraction; solarPerf.backgroundFraction = oldPerf.backgroundFraction; solarPerf.backgroundEvery = oldPerf.backgroundEvery; solarPerf.labelEvery = oldPerf.labelEvery;
        if (viewMode === 'solar' && oldView !== 'solar') exitSolar();
        solarNav.level = oldNav.level; solarNav.selectedId = oldNav.selectedId; solarNav.parentId = oldNav.parentId; solarNav.cameraStack = oldNav.cameraStack; solarNav.galaxySnapshot = oldNav.galaxySnapshot; solarNav.skySnapshot = oldNav.skySnapshot;
        solarCardOpen = oldCard; setSolarPaused(oldPaused);
        solarCamera.position.copy(oldPosition); solarControls.target.copy(oldTarget); solarControls.update(); gestureDist = oldGestureDist;
        controls.enabled = oldControls.galaxy; solarControls.enabled = oldControls.solar; skyControls.enabled = oldControls.sky; skyControls.autoRotate = oldControls.skyAuto;
        bpBody.innerHTML = oldPanel.html; bpEl.classList.toggle('open', oldPanel.open);
        viewMode = oldView;
      }
    });
    check('solar-performance-regression', function () {
      function own(object) { var copy = {}; Object.keys(object).forEach(function (key) { copy[key] = object[key]; }); return copy; }
      function entries(object) { var copy = {}; Object.keys(object || {}).forEach(function (key) { copy[key] = object[key]; }); return copy; }
      function restoreEntries(object, copy) { Object.keys(object).forEach(function (key) { delete object[key]; }); Object.keys(copy).forEach(function (key) { object[key] = copy[key]; }); }
      function materialState(material) { return material ? { opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite, uniformOpacity: material.uniforms && material.uniforms.uOpacity ? material.uniforms.uOpacity.value : null, fade: material.userData.solarFadeState } : null; }
      function restoreMaterial(material, state) { if (!material || !state) return; material.opacity = state.opacity; material.transparent = state.transparent; material.depthWrite = state.depthWrite; if (material.uniforms && material.uniforms.uOpacity && state.uniformOpacity != null) material.uniforms.uOpacity.value = state.uniformOpacity; if (state.fade) material.userData.solarFadeState = state.fade; else delete material.userData.solarFadeState; }
      var oldView = viewMode, oldCompact = solarCompactOverride, oldSavedGalaxy = savedGalaxyView, oldPanel = { html: bpBody.innerHTML, open: bpEl.classList.contains('open') }, oldDisplays = { beacons: document.getElementById('beacons').style.display, labels: solarLabelsEl.style.display, back: solarBackEl.style.display };
      var oldControls = { galaxy: controls.enabled, solar: solarControls.enabled, sky: skyControls.enabled, min: solarControls.minDistance, max: solarControls.maxDistance };
      var oldPerf = own(solarPerf), oldTransient = { card: solarCardOpen, paused: solarPaused, skyReturn: skyReturnContext, fly: flyState, selectedBeacon: selectedBeacon, ringVisible: beaconRing.visible, ringOpacity: beaconRing.material.opacity, solarFrameLast: solarFrameLast, returnDisplay: returnBtn && returnBtn.style.display };
      var oldContainers = { pending: entries(solarTextures.pending), cache: entries(solarTextures.cache), warned: entries(solarTextures.warned) };
      var oldBelt = solarAsteroidBelt.geometry.drawRange.count, oldBackdrop = solarBackdrop.geometry.drawRange.count, oldLabels = solarPerf.labelEvery, oldWatch = [solarPerfEMA, solarPerfLast, solarPerfNextCheck];
      var oldNav = { selectedId: solarNav.selectedId, level: solarNav.level, parentId: solarNav.parentId, cameraStack: solarNav.cameraStack.slice(), galaxySnapshot: solarNav.galaxySnapshot, skySnapshot: solarNav.skySnapshot }, oldPosition = solarCamera.position.clone(), oldTarget = solarControls.target.clone();
      var objects = {};
      SOLAR_BODIES.forEach(function (body) { var o = SOLAR_OBJECTS[body.id]; objects[body.id] = { own: own(o), group: o.lodGroup.visible, orbit: o.orbitLine.visible, proxy: o.hitProxy.visible, active: o.hitProxy.userData.solarActive, proxyScale: o.hitProxy.scale.clone(), mesh: [o.mesh.visible, materialState(o.mesh.material)], special: Object.keys(o.specialty).map(function (k) { var m = o.specialty[k]; return [k, m.visible, materialState(m.material)]; }) }; });
      try {
        solarCompactOverride = true;
        if (viewMode !== 'solar') enterSolar();
        solarNav.selectedId = 'earth'; solarNav.level = 'focus'; solarNav.parentId = null; updateSolarVisibility();
        var earth = SOLAR_OBJECTS.earth, point = new THREE.Vector3(); earth.mesh.getWorldPosition(point);
        solarCamera.position.copy(point).add(new THREE.Vector3(0, earth.radius * 8, earth.radius * 14)); solarControls.target.copy(point); solarControls.update(); solarCamera.updateMatrixWorld();
        var targetBeforeRefresh = solarControls.target.clone(); refreshSolarResponsiveState();
        ok(frameSolarForViewport() === false && solarControls.target.distanceTo(targetBeforeRefresh) === 0, 'responsive refresh reframed Earth');
        applySolarPerformanceTier(0); var base = [solarAsteroidBelt.geometry.drawRange.count, solarBackdrop.geometry.drawRange.count, solarPerf.labelEvery];
        applySolarPerformanceTier(1); ok(solarAsteroidBelt.geometry.drawRange.count < base[0] && solarBackdrop.geometry.drawRange.count === base[1] && solarPerf.labelEvery === base[2], 'stage 1 changed more than asteroid range');
        applySolarPerformanceTier(2); ok(solarBackdrop.geometry.drawRange.count < base[1] && solarPerf.labelEvery === base[2], 'stage 2 did not add only backdrop degradation');
        applySolarPerformanceTier(3); ok(solarPerf.labelEvery > base[2], 'stage 3 did not add label cadence');
        var epoch = solarPerf.epoch; applySolarPerformanceTier(3); ok(solarPerf.epoch === epoch, 'repeated stage call was not idempotent');
        applySolarPerformanceTier(0); ok(solarAsteroidBelt.geometry.drawRange.count === base[0] && solarBackdrop.geometry.drawRange.count === base[1] && solarPerf.labelEvery === base[2], 'stage recovery did not restore fields');
        resetSolarPerformanceWatchdog(0); solarPerfEMA = 45; solarPerfNextCheck = 0; sampleSolarPerformance(1); ok(solarPerf.stage === 1 && solarPerfNextCheck === 10001, 'watchdog did not make the first 0-to-1 transition and reschedule');
      } finally {
        Object.keys(solarPerf).forEach(function (key) { if (!Object.prototype.hasOwnProperty.call(oldPerf, key)) delete solarPerf[key]; }); Object.keys(oldPerf).forEach(function (key) { solarPerf[key] = oldPerf[key]; });
        restoreEntries(solarTextures.pending, oldContainers.pending); restoreEntries(solarTextures.cache, oldContainers.cache); restoreEntries(solarTextures.warned, oldContainers.warned); solarAsteroidBelt.geometry.setDrawRange(0, oldBelt); solarBackdrop.geometry.setDrawRange(0, oldBackdrop);
        if (viewMode === 'solar' && oldView !== 'solar') exitSolar();
        solarNav.selectedId = oldNav.selectedId; solarNav.level = oldNav.level; solarNav.parentId = oldNav.parentId; solarNav.cameraStack = oldNav.cameraStack; solarNav.galaxySnapshot = oldNav.galaxySnapshot; solarNav.skySnapshot = oldNav.skySnapshot; solarCamera.position.copy(oldPosition); solarControls.target.copy(oldTarget); solarControls.update();
        SOLAR_BODIES.forEach(function (body) { var o = SOLAR_OBJECTS[body.id], s = objects[body.id]; Object.keys(s.own).forEach(function (key) { o[key] = s.own[key]; }); o.lodGroup.visible = s.group; o.orbitLine.visible = s.orbit; o.hitProxy.visible = s.proxy; o.hitProxy.userData.solarActive = s.active; o.hitProxy.scale.copy(s.proxyScale); o.mesh.visible = s.mesh[0]; restoreMaterial(o.mesh.material, s.mesh[1]); s.special.forEach(function (x) { var m = o.specialty[x[0]]; m.visible = x[1]; restoreMaterial(m.material, x[2]); }); });
        updateSolarVisibility(); // re-derive nav-dependent state (orbit-line fade) from the restored navigation
        solarCompactOverride = oldCompact; savedGalaxyView = oldSavedGalaxy; controls.enabled = oldControls.galaxy; solarControls.enabled = oldControls.solar; skyControls.enabled = oldControls.sky; solarControls.minDistance = oldControls.min; solarControls.maxDistance = oldControls.max; document.getElementById('beacons').style.display = oldDisplays.beacons; solarLabelsEl.style.display = oldDisplays.labels; solarBackEl.style.display = oldDisplays.back; bpBody.innerHTML = oldPanel.html; bpEl.classList.toggle('open', oldPanel.open); viewMode = oldView;
        solarCardOpen = oldTransient.card; solarPaused = oldTransient.paused; skyReturnContext = oldTransient.skyReturn; flyState = oldTransient.fly; selectedBeacon = oldTransient.selectedBeacon; beaconRing.visible = oldTransient.ringVisible; beaconRing.material.opacity = oldTransient.ringOpacity; solarFrameLast = oldTransient.solarFrameLast; if (returnBtn) returnBtn.style.display = oldTransient.returnDisplay;
        solarPerfEMA = oldWatch[0]; solarPerfLast = oldWatch[1]; solarPerfNextCheck = oldWatch[2];
        ok(viewMode === oldView && solarPerf.beltFraction === oldPerf.beltFraction && solarPerfEMA === oldWatch[0] && solarPerfLast === oldWatch[1] && solarPerfNextCheck === oldWatch[2], 'performance regression test did not restore its saved fixture state');
      }
    });
    check('solar-runtime-objects', function () {
      ok(typeof buildSolarBodies === 'function', 'buildSolarBodies missing');
      ok(SOLAR_OBJECTS && Object.keys(SOLAR_OBJECTS).length === SOLAR_BODIES.length, 'runtime body count is wrong');
      SOLAR_BODIES.forEach(function (b) {
        var o = SOLAR_OBJECTS[b.id];
        ok(o && o.orbitPivot && o.positionNode && o.tiltNode && o.spinNode && o.lodGroup && o.hitProxy && o.orbitLine, b.id + ' runtime chain missing');
        if (b.parent) ok(o.orbitPivot.parent === SOLAR_OBJECTS[b.parent].positionNode, b.id + ' is not attached to its parent');
      });
    });
    check('solar-2k-tier', function () {
      var oldCoarse = solarPointerCoarse;
      try {
        solarPointerCoarse = false;
        ok(solarTextureSource('images/solar-system/jupiter.jpg') === 'images/solar-system/jupiter.jpg', 'desktop lost 4k Jupiter');
        solarPointerCoarse = true;
        Object.keys(SOLAR_TEX_2K).forEach(function (url) {
          ok(url === 'images/solar-system/sun.jpg' || SOLAR_BODIES.some(function (b) { return Object.keys(b.maps).some(function (k) { return b.maps[k] === url; }); }), url + ' is not a solar map');
          ok(solarTextureSource(url) === (videoMode ? url : SOLAR_TEX_2K[url]), url + ' did not switch to 2k on touch');
        });
      } finally { solarPointerCoarse = oldCoarse; }
    });
    check('solar-sun-core-layers', function () {
      var oldMotionOverride = solarMotionOverride, oldShaderTime = solarShaderTime, oldPaused = solarPaused, oldScales;
      try {
        ok(Array.isArray(solarSunGlows) && solarSunGlows.length === 4, 'Sun does not have four galactic-core glow layers');
        ok(SOLAR_OBJECTS.sun.specialty.prominences && SOLAR_OBJECTS.sun.specialty.prominences.material.uniforms.uTime, 'Sun prominence shell missing or not animated');
        ok(SOLAR_OBJECTS.sun.specialty.prominenceFlow && SOLAR_OBJECTS.sun.specialty.prominenceFlow.geometry.attributes.position.count === 540 && SOLAR_OBJECTS.sun.specialty.prominenceFlow.material.vertexColors === true, 'Sun eruptive prominence particle flow missing');
        ok(SOLAR_OBJECTS.sun.specialty.cme && SOLAR_OBJECTS.sun.specialty.cme.geometry.attributes.position.count === 360, 'Sun CME particle burst missing');
        oldScales = solarSunGlows.map(function (layer) { return layer.sprite.scale.clone(); });
        solarShaderTime = 0; solarPaused = true;
        solarSunGlows.forEach(function (layer) { layer.sprite.scale.set(layer.baseScale, layer.baseScale, 1); });
        var colors = solarSunGlows.map(function (layer) { return layer.sprite.material.color.getHex(); });
        ok(colors.join(',') === [0xfffdf6, 0xfff3da, 0xffcf78, 0xff9b3f].join(','), 'Sun core glow palette is incorrect');
        ok(solarSunGlows.every(function (layer) { return layer.sprite.parent === SOLAR_OBJECTS.sun.lodGroup && layer.sprite.material.blending === THREE.AdditiveBlending; }), 'Sun core layers are not additive children of the Sun LOD group');
        var movingScale = solarSunGlows[0].sprite.scale.x;
        solarMotionOverride = false; updateSolarMotion(0.15);
        ok(solarSunGlows[0].sprite.scale.x !== movingScale, 'Sun core breathing did not advance');
        solarMotionOverride = true;
        var reducedScale = solarSunGlows[0].sprite.scale.x; updateSolarMotion(0.15);
        ok(solarSunGlows[0].sprite.scale.x === reducedScale, 'reduced motion did not freeze Sun breathing');
      } finally {
        solarMotionOverride = oldMotionOverride; solarPaused = oldPaused; solarShaderTime = oldShaderTime; solarCoronaMaterial.uniforms.uTime.value = oldShaderTime;
        if (oldScales && typeof solarSunGlows !== 'undefined') solarSunGlows.forEach(function (layer, index) { layer.sprite.scale.copy(oldScales[index]); });
      }
    });
    check('solar-asteroid-belt', function () {
      var points = 0;
      solarRoot.traverse(function (o) { if (o instanceof THREE.Points) points++; });
      ok(solarAsteroidBelt instanceof THREE.Points, 'asteroid belt is not points');
      ok(points === 5, 'expected the dust belt, the Trojan swarms, the Sun CME points, the prominence flow, and one comet tail');
      ok(solarAsteroidRocks && solarAsteroidRocks.children.length === 3 && solarAsteroidRocks.children.every(function (mesh) { return mesh.isInstancedMesh; }), 'asteroid rock layer must be three instanced meshes');
      var rockTotal = solarAsteroidRocks.children.reduce(function (sum, mesh) { return sum + mesh.count; }, 0);
      ok(rockTotal >= 300, 'asteroid rock layer is too sparse');
      var jupiterRadius = SOLAR_OBJECTS.jupiter.radius;
      ok(SOLAR_BODIES.filter(function (b) { return b.parent === 'jupiter'; }).every(function (b) { return SOLAR_OBJECTS[b.id].radius < jupiterRadius * 0.25; }), 'Galilean moons are out of proportion with Jupiter');
      ok(solarOrbitDistance(SOLAR_BY_ID.io) - solarOrbitDistance(SOLAR_BY_ID.europa) < 0 && solarOrbitDistance(SOLAR_BY_ID.europa) < solarOrbitDistance(SOLAR_BY_ID.ganymede) && solarOrbitDistance(SOLAR_BY_ID.ganymede) < solarOrbitDistance(SOLAR_BY_ID.callisto), 'moon orbits are not ordered');
      var first = solarAsteroidBelt.geometry.attributes.position.array.slice(0), oldBelt = solarAsteroidBelt;
      ok(first.length === 4500 * 3, 'asteroid belt must have 4,500 vertices');
      buildAsteroidBelt(4500);
      var second = solarAsteroidBelt.geometry.attributes.position.array;
      ok(first.length === second.length && first.every(function (v, i) { return v === second[i]; }), 'asteroid belt positions are not deterministic');
      ok(oldBelt.geometry.disposed && oldBelt.material.disposed, 'replaced belt resources were not disposed');
      var ceres = SOLAR_OBJECTS.ceres, angle = solarBeltCenterAngle(ceres.body, solarFutureAngle(ceres.body, ceres, solarElapsed)), gap = solarBeltClearance.angle;
      for (var i = 0; i < second.length; i += 3) {
        var x = second[i], z = second[i + 2], radius = Math.sqrt(x * x + z * z), beltAngle = Math.atan2(z, x) + solarAsteroidBelt.rotation.y;
        if (Math.abs(Math.atan2(Math.sin(beltAngle - angle), Math.cos(beltAngle - angle))) < gap) ok(radius < solarBeltClearance.inner || radius > solarBeltClearance.outer, 'belt point enters Ceres clearance');
      }
    });
    check('solar-orbit-forms', function () {
      var pluto = SOLAR_OBJECTS.pluto, peri = new THREE.Vector3(), apo = new THREE.Vector3();
      solarOrbitPoint(pluto.body, 0, peri); solarOrbitPoint(pluto.body, Math.PI, apo);
      ok(Math.abs(peri.x) !== Math.abs(apo.x), 'Pluto orbit is circular');
      ok(pluto.orbitPivot.rotation.x === pluto.body.inclinationDeg * Math.PI / 180, 'Pluto inclination is not applied');
      var geometries = {};
      SOLAR_BODIES.forEach(function (b) { geometries[SOLAR_OBJECTS[b.id].mesh.geometry.id] = true; });
      ok(Object.keys(geometries).length === 1, 'body spheres do not share the one high-detail geometry');
    });
    check('solar-pause-clock', function () {
      ok(typeof updateSolarMotion === 'function' && typeof setSolarPaused === 'function', 'solar motion API missing');
      ok(typeof SOLAR_ORBIT_RATE === 'number' && SOLAR_ORBIT_RATE === 0.18, 'Solar orbit presentation rate is missing');
      ok(typeof SOLAR_SPIN_RATE === 'number' && SOLAR_SPIN_RATE === 0.05, 'Solar spin presentation rate is missing');
      var elapsed = solarElapsed, shaderTime = solarShaderTime, paused = solarPaused, earth = SOLAR_OBJECTS.earth, x = earth.positionNode.position.x, z = earth.positionNode.position.z, spin = earth.spinNode.rotation.y;
      setSolarPaused(false); updateSolarMotion(0.25);
      ok(solarElapsed > elapsed, 'solar clock did not advance');
      elapsed = solarElapsed; shaderTime = solarShaderTime;
      setSolarPaused(true); updateSolarMotion(0.25);
      ok(solarElapsed === elapsed, 'paused solar clock advanced');
      ok(solarShaderTime > shaderTime, 'shader clock paused with solar clock');
      ok(earth.positionNode.position.x !== x || earth.positionNode.position.z !== z || earth.spinNode.rotation.y !== spin, 'running transform did not advance');
      x = earth.positionNode.position.x; z = earth.positionNode.position.z; spin = earth.spinNode.rotation.y;
      updateSolarMotion(0.15);
      ok(earth.positionNode.position.x === x && earth.positionNode.position.z === z && earth.spinNode.rotation.y === spin, 'paused transforms advanced');
      setSolarPaused(false); updateSolarMotion(0.15);
      var expected = new THREE.Vector3(); solarOrbitPoint(earth.body, solarFutureAngle(earth.body, earth, solarElapsed), expected);
      ok(earth.positionNode.position.x === expected.x && earth.positionNode.position.z === expected.z, 'resume transformed Earth with a clock jump');
      var oldMotion = solarMotionOverride;
      try { // reduced motion freezes the clock but must still place the bodies
        solarMotionOverride = true; elapsed = solarElapsed; earth.positionNode.position.set(0, 0, 0); updateSolarMotion(0.15);
        solarOrbitPoint(earth.body, solarFutureAngle(earth.body, earth, solarElapsed), expected);
        ok(solarElapsed === elapsed && earth.positionNode.position.equals(expected), 'reduced motion left Earth unplaced or advanced the clock');
      } finally { solarMotionOverride = oldMotion; }
      setSolarPaused(paused);
    });
    check('solar-navigation', function () {
      ok(typeof solarNav !== 'undefined', 'solarNav missing');
      ok(typeof selectSolarBody === 'function', 'selectSolarBody missing');
      ok(typeof focusSolarBody === 'function', 'focusSolarBody missing');
      ok(typeof leaveSolarLevel === 'function', 'leaveSolarLevel missing');
      ok(typeof clearSolarCard === 'function', 'clearSolarCard missing');
      ok(typeof enterSolarSky === 'function', 'enterSolarSky missing');
      ok(typeof solarActiveProxies === 'function', 'solarActiveProxies missing');
      var oldView = viewMode, oldNav = { level: solarNav.level, selectedId: solarNav.selectedId, parentId: solarNav.parentId, cameraStack: solarNav.cameraStack.slice(), galaxySnapshot: solarNav.galaxySnapshot, skySnapshot: solarNav.skySnapshot }, oldPaused = solarPaused, oldCardOpen = solarCardOpen, oldTimeScale = solarTimeScale, oldScaleBlend = solarScaleBlend;
      var oldPosition = solarCamera.position.clone(), oldTarget = solarControls.target.clone();
      var oldElapsed = solarElapsed, oldShader = solarShaderTime, oldBelt = solarAsteroidBelt && solarAsteroidBelt.rotation.y, oldGalaxyView = savedGalaxyView;
      var oldControls = { enabled: solarControls.enabled, minDistance: solarControls.minDistance, maxDistance: solarControls.maxDistance, frameLast: solarFrameLast, perfLast: perfLast };
      var oldObjects = {}, oldLabelButtons = solarLabelButtons, oldLabels = {}, oldSunGlowScales = solarSunGlows.map(function (layer) { return layer.sprite.scale.clone(); });
      SOLAR_BODIES.forEach(function (body) {
        var object = SOLAR_OBJECTS[body.id], label = solarLabelButtons[body.id];
        oldObjects[body.id] = { lodVisible: object.lodGroup.visible, orbitVisible: object.orbitLine.visible, proxyVisible: object.hitProxy.visible,
          proxyActive: object.hitProxy.userData.solarActive, proxyScale: object.hitProxy.scale.clone(), position: object.positionNode.position.clone(), spin: object.spinNode.rotation.y };
        oldLabels[body.id] = label ? { text: label.textContent, aria: label.getAttribute('aria-label'), display: label.style.display, left: label.style.left, top: label.style.top, selected: label.classList.contains('sel') } : null;
      });
      try {
        if (viewMode !== 'solar') enterSolar();
        solarTimeScale = 1; // motion assertions below assume real-time pacing
        solarScaleAnim = null; if (solarScaleBlend) solarApplyScaleBlend(0); // ...and the compressed layout
        updateSolarLabels();
        ok(Object.keys(solarLabelButtons).length === SOLAR_BODIES.length, 'not every solar body received a label');
        SOLAR_BODIES.forEach(function (body) {
          var text = (body.info[beaconLang] || body.info.en).name;
          ok(solarLabelButtons[body.id].textContent === text, body.id + ' label is not localized');
          ok(solarLabelButtons[body.id].getAttribute('aria-label') === text, body.id + ' label aria name is not localized');
        });
        var overviewProxies = solarActiveProxies();
        ok(overviewProxies.length && overviewProxies.every(function (proxy) { return proxy.userData.solarComet != null || (proxy.visible && proxy.userData.solarActive && !SOLAR_BY_ID[proxy.userData.solarId].parent); }), 'overview raycast includes an inactive proxy');
        var earthObject = SOLAR_OBJECTS.earth, earthPoint = new THREE.Vector3(); earthObject.mesh.getWorldPosition(earthPoint);
        var expectedProxyRadius = 2 * Math.tan(solarCamera.fov * Math.PI / 360) * solarCamera.position.distanceTo(earthPoint) / window.innerHeight * 16;
        ok(solarHitRadius(earthObject, earthPoint) >= expectedProxyRadius, 'Earth proxy is smaller than a 32 CSS-pixel target');
        ok(earthObject.hitProxy.scale.x >= expectedProxyRadius, 'Earth hit proxy did not receive its touch size');
        solarControls.minDistance = 3; solarControls.maxDistance = 333;
        var cameraBefore = { position: solarCamera.position.clone(), quaternion: solarCamera.quaternion.clone(), target: solarControls.target.clone(), min: solarControls.minDistance, max: solarControls.maxDistance };
        var elapsedBeforeSelection = solarElapsed;
        focusSolarBody('earth');
        ok(solarCardOpen && document.getElementById('bp-name').textContent === SOLAR_BY_ID.earth.info[beaconLang].name, 'Earth selection did not open its card immediately');
        var earthPositionDelta = solarCamera.position.distanceTo(cameraBefore.position), earthQuaternionDelta = solarCamera.quaternion.angleTo(cameraBefore.quaternion), earthTargetDelta = solarControls.target.distanceTo(cameraBefore.target);
        ok(earthPositionDelta === 0 && earthQuaternionDelta < 1e-7 && earthTargetDelta === 0, 'Earth selection changed the camera');
        ok(solarControls.minDistance === cameraBefore.min && solarControls.maxDistance === cameraBefore.max, 'Earth selection changed zoom bounds');
        updateSolarMotion(0.05);
        ok(solarElapsed > elapsedBeforeSelection && !solarPaused, 'Earth selection stopped Solar motion');
        ok(solarNav.selectedId === 'earth' && solarNav.parentId === null && solarNav.cameraStack.length === 1, 'Earth focus did not retain overview');
        ok(solarActiveProxies().every(function (proxy) { if (proxy.userData.solarComet != null) return true; var body = SOLAR_BY_ID[proxy.userData.solarId]; return !body.parent || body.parent === 'earth'; }), 'Earth focus raycast lost the planets or leaked foreign moons');
        ok(SOLAR_OBJECTS.mars.hitProxy.userData.solarActive, 'other planets went unselectable in Earth focus');
        focusSolarBody('moon');
        ok(solarCardOpen && document.getElementById('bp-name').textContent === SOLAR_BY_ID.moon.info[beaconLang].name, 'Moon selection did not open its card immediately');
        ok(solarCamera.position.distanceTo(cameraBefore.position) === 0 && solarCamera.quaternion.angleTo(cameraBefore.quaternion) < 1e-7 && solarControls.target.distanceTo(cameraBefore.target) === 0, 'Moon selection changed the camera');
        ok(solarControls.minDistance === cameraBefore.min && solarControls.maxDistance === cameraBefore.max, 'Moon selection changed zoom bounds');
        ok(solarNav.selectedId === 'moon' && solarNav.parentId === 'earth' && solarNav.cameraStack.length === 2 && !solarPaused, 'Moon focus did not retain Earth or continued motion');
        var oldLanguage = beaconLang;
        ['en', 'hans', 'hant', 'ja', 'ko'].forEach(function (language) {
          setBeaconLang(language);
          var parentName = (SOLAR_BY_ID.earth.info[language] || SOLAR_BY_ID.earth.info.en).name;
          ok(solarBackEl.textContent.indexOf(parentName) !== -1 && solarBackEl.getAttribute('aria-label') === solarBackEl.textContent, language + ' moon Back did not name its parent');
        });
        var moonLanguage = oldLanguage === 'ja' ? 'ko' : 'ja', moonPosition = solarCamera.position.clone(), moonTarget = solarControls.target.clone();
        setBeaconLang(moonLanguage);
        ok(solarNav.selectedId === 'moon' && solarNav.parentId === 'earth', 'language change changed the Moon focus');
        ok(solarCamera.position.distanceTo(moonPosition) === 0 && solarControls.target.distanceTo(moonTarget) === 0, 'language change moved the Moon camera');
        setBeaconLang(oldLanguage);
        leaveSolarLevel();
        ok(solarNav.selectedId === 'earth' && solarNav.parentId === null && solarNav.cameraStack.length === 1 && !solarPaused, 'Back did not restore Earth focus or continued motion');
        ok(solarControls.minDistance === cameraBefore.min && solarControls.maxDistance === cameraBefore.max, 'Back restored the Earth camera without its control bounds');
        leaveSolarLevel();
        ok(solarNav.level === 'overview' && solarNav.selectedId === null && solarNav.cameraStack.length === 0 && !solarPaused, 'Back did not restore overview or resume motion');
        ok(solarControls.minDistance === 3 && solarControls.maxDistance === 333, 'overview Back did not restore its control bounds');
        ok(!solarCardOpen && !bpEl.classList.contains('open') && bpBody.innerHTML === '', 'panelOpen=false left stale card DOM visible');
        var resumedElapsed = solarElapsed; updateSolarMotion(0.05); ok(solarElapsed > resumedElapsed, 'overview motion did not resume');
        focusSolarBody('earth');
        ok(enterSolarSky(), 'Earth sky transition did not start');
        leaveSolarLevel();
        ok(solarNav.selectedId === 'earth' && solarNav.parentId === null, 'Sky return did not retain Earth focus');
        focusSolarBody('earth');
        var focusDepth = solarNav.cameraStack.length;
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        ok(!solarCardOpen && solarNav.selectedId === 'earth' && solarNav.cameraStack.length === focusDepth, 'Escape did not close only the solar card');
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        ok(solarNav.level === 'overview' && solarNav.cameraStack.length === 0, 'second Escape did not leave one solar level');
        clearSolarCard();
        ok(solarNav.selectedId === null, 'closing a card changed the restored focus');
      } finally {
        if (viewMode === 'solar' && oldView !== 'solar') exitSolar();
        solarNav = oldNav; solarPaused = oldPaused; solarCardOpen = oldCardOpen; savedGalaxyView = oldGalaxyView; solarTimeScale = oldTimeScale;
        if (solarScaleBlend !== oldScaleBlend) solarApplyScaleBlend(oldScaleBlend);
        solarCamera.position.copy(oldPosition); solarControls.target.copy(oldTarget); solarControls.update();
        solarControls.enabled = oldControls.enabled; solarControls.minDistance = oldControls.minDistance; solarControls.maxDistance = oldControls.maxDistance;
        solarElapsed = oldElapsed; solarShaderTime = oldShader; solarCoronaMaterial.uniforms.uTime.value = oldShader;
        if (solarAsteroidBelt) solarAsteroidBelt.rotation.y = oldBelt;
        solarSunGlows.forEach(function (layer, index) { layer.sprite.scale.copy(oldSunGlowScales[index]); });
        solarFrameLast = oldControls.frameLast; perfLast = oldControls.perfLast; viewMode = oldView;
        SOLAR_BODIES.forEach(function (body) {
          var object = SOLAR_OBJECTS[body.id], oldObject = oldObjects[body.id];
          object.lodGroup.visible = oldObject.lodVisible; object.orbitLine.visible = oldObject.orbitVisible; object.hitProxy.visible = oldObject.proxyVisible;
          object.hitProxy.userData.solarActive = oldObject.proxyActive; object.hitProxy.scale.copy(oldObject.proxyScale); object.positionNode.position.copy(oldObject.position); object.spinNode.rotation.y = oldObject.spin;
          var oldLabel = oldLabels[body.id], label = solarLabelButtons[body.id];
          if (oldLabel && label) {
            label.textContent = oldLabel.text; label.setAttribute('aria-label', oldLabel.aria); label.style.display = oldLabel.display; label.style.left = oldLabel.left; label.style.top = oldLabel.top; label.classList.toggle('sel', oldLabel.selected);
          } else if (label) {
            solarLabelButtons[body.id].parentNode.removeChild(solarLabelButtons[body.id]); delete solarLabelButtons[body.id];
          }
        });
        solarLabelButtons = oldLabelButtons;
        updateSolarVisibility(); // re-derive nav-dependent state (orbit-line fade) from the restored navigation
      }
    });
    check('solar-free-selection', function () { // regression: selecting one body must never lock out the others
      var oldView = viewMode, oldNav = { level: solarNav.level, sel: solarNav.selectedId, parent: solarNav.parentId };
      var oldCard = solarCardOpen, oldHTML = bpBody.innerHTML, oldOpen = bpEl.classList.contains('open');
      try {
        if (viewMode !== 'solar') enterSolar();
        solarNav.level = 'overview'; solarNav.parentId = null; solarNav.selectedId = null; updateSolarVisibility();
        selectSolarBody('mercury');
        ok(solarNav.level === 'overview' && solarCardOpen, 'selection changed the navigation level');
        selectSolarBody('mars');
        ok(solarNav.selectedId === 'mars' && solarNav.level === 'overview', 'a second planet could not be selected after the first');
        ok(SOLAR_BODIES.filter(function (b) { return !b.parent; }).every(function (b) { return SOLAR_OBJECTS[b.id].hitProxy.userData.solarActive; }), 'a planet went inactive after selection');
        ok(!SOLAR_OBJECTS.moon.lodGroup.visible, 'moons appeared without flying in');
        ok(!!bpBody.querySelector('#bp-flyto'), 'card is missing the fly-to link');
      } finally {
        if (viewMode === 'solar' && oldView !== 'solar') exitSolar();
        solarNav.level = oldNav.level; solarNav.selectedId = oldNav.sel; solarNav.parentId = oldNav.parent;
        solarCardOpen = oldCard; bpBody.innerHTML = oldHTML; bpEl.classList.toggle('open', oldOpen);
        updateSolarVisibility();
      }
    });
    check('painted-galaxy', function () {
      ok(typeof paintedGalaxy === 'object' && paintedGalaxy && paintedGalaxy.disc && paintedGalaxy.layers.length === 3, 'painted galaxy missing');
      ok(typeof nebMat === 'undefined', 'old nebula shader still present');
      ok(DUST.count === 30000, 'dust count is not 30000');
      var map = paintedGalaxy.disc.material.uniforms.uMap.value;
      ok(map && map.image && (map.image.width === 1024 || map.image.width === (paintedGalaxy.touch ? 2048 : 4096)), 'painted disc texture has an unexpected size');
      ok(paintedGalaxy.layers.every(function (l) { return l.material.uniforms.uMap === paintedGalaxy.disc.material.uniforms.uMap; }), 'the edge-on copies do not share the painted texture');
    });
    check('painted-external', function () {
      paintFlush(); // analytic paintings bake now; photo-plate ones join the queue when their plate loads
      var want = { M31: 1 }, size = paintedGalaxy.touch ? 1024 : 2048;
      galaxyLODs.forEach(function (L) {
        if (!want[L.cat]) return;
        ok(L.paint && L.paint.length === want[L.cat], L.cat + ' has no painting');
        L.paint.forEach(function (P) {
          ok(P.mesh.parent === L.pts, L.cat + ' painting is not mounted on its stars');
          var m = P.mat.uniforms.uMap.value; ok(m && m.image.width === P.size && P.size <= size, L.cat + ' painting is not baked at its size');
          ok(!P.mat.uniforms.uSize && !P.mat.uniforms.uCap, L.cat + ' painting would be rescaled as a point layer');
        });
      });
      ok(typeof paintPending === 'function', 'paintPending missing');
    });
    solarMotionOverride = runMotionOverride;
    window.__solarTestResult = { passed: failures.length === 0, failures: failures };
    if (/[?&]solarTest=1/.test(location.search)) setMsg(failures.length ? failures.join(' | ') : statusText());
    return window.__solarTestResult;
  }
