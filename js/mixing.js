var OILS = [
  { id: 'bergamot', name: 'Bergamot', emoji: '🍊', keyword: 'Fresh', color: '#C9A96E' },
  { id: 'lavender', name: 'Lavender', emoji: '💜', keyword: 'Calming', color: '#C9A96E' },
  { id: 'rose', name: 'Rose', emoji: '🌹', keyword: 'Floral', color: '#C9A96E' },
  { id: 'sandalwood', name: 'Sandalwood', emoji: '🪵', keyword: 'Warm', color: '#C9A96E' },
  { id: 'jasmine', name: 'Jasmine', emoji: '🌸', keyword: 'Sweet', color: '#C9A96E' },
  { id: 'vanilla', name: 'Vanilla', emoji: '🍦', keyword: 'Sweet', color: '#C9A96E' },
];

function getCapacity() {
  var size = window.perfumeState && window.perfumeState.bottleSize;
  return size ? parseInt(size) : 50;
}

function getTotalMl() {
  var mix = window.perfumeState.mix || {};
  var total = 0;
  for (var key in mix) {
    if (mix.hasOwnProperty(key)) total += mix[key];
  }
  return total;
}

function updateTotalDisplay() {
  var ml = getTotalMl();
  var cap = getCapacity();
  var el = document.getElementById('total-mix-ml');
  if (el) el.textContent = ml + '/' + cap + ' ml';
}

function spawnDroplet(color) {
  var droplet = document.createElement('div');
  droplet.className = 'oil-droplet';
  droplet.style.backgroundColor = color;
  droplet.style.boxShadow = '0 2px 6px ' + color + '80';
  document.body.appendChild(droplet);

  var mixingScreen = document.getElementById('screen-mixing');
  var screenRect = mixingScreen.getBoundingClientRect();
  var startX = screenRect.left + screenRect.width / 2 - 8;
  var startY = screenRect.top + 80;
  droplet.style.left = startX + 'px';
  droplet.style.top = startY + 'px';

  var beakerEl = mixingScreen.querySelector('img[alt="Beaker"]');
  var endY;
  if (beakerEl) {
    var beakerRect = beakerEl.getBoundingClientRect();
    endY = beakerRect.top + beakerRect.height * 0.6 - startY;
  } else {
    endY = window.innerHeight * 0.45;
  }
  droplet.style.setProperty('--drop-distance', endY + 'px');

  setTimeout(function() { droplet.remove(); }, 500);
}

function changeOil(oilId, delta) {
  if (!window.perfumeState.mix) window.perfumeState.mix = {};
  var current = window.perfumeState.mix[oilId] || 0;
  var newVal = current + delta;
  if (newVal < 0) newVal = 0;
  var maxDrops = getCapacity();
  var otherTotal = getTotalMl() - current;
  if (otherTotal + newVal > maxDrops) newVal = maxDrops - otherTotal;
  if (newVal < 0) newVal = 0;
  window.perfumeState.mix[oilId] = newVal;

  var el = document.querySelector('.oil-amount[data-oil="' + oilId + '"]');
  if (el) el.textContent = newVal;

  if (delta > 0) {
    var oil = OILS.find(function(o) { return o.id === oilId; });
    if (oil) spawnDroplet(oil.color);
  }

  updateTotalDisplay();
  updateBeaker();
}

function resetMixing() {
  window.perfumeState.mix = {};
  document.querySelectorAll('.oil-amount').forEach(function(el) {
    el.textContent = '0';
  });
  updateTotalDisplay();
  updateBeaker();
}

var ethanolPouring = false;

function addEthanol() {
  if (ethanolPouring) return;
  var mix = window.perfumeState.mix || {};
  var oilDrops = getTotalMl() - (mix.alcohol || 0);
  if (oilDrops === 0) {
    alert('Please add some perfume oils first.');
    return;
  }
  var maxDrops = getCapacity();
  if (oilDrops >= maxDrops) {
    alert('Bottle is full.');
    return;
  }

  ethanolPouring = true;
  var startAlcohol = mix.alcohol || 0;
  var targetAlcohol = maxDrops - oilDrops;
  var need = targetAlcohol - startAlcohol;
  var duration = 1600;
  var startTime = performance.now();

  var pour = createWaterPour();
  var splashTimer = pour ? setInterval(function () { pour.splash(); }, 70) : null;

  function step(now) {
    var t = Math.min((now - startTime) / duration, 1);
    mix.alcohol = Math.round(startAlcohol + need * t);
    window.perfumeState.mix = mix;
    updateTotalDisplay();
    updateBeaker();
    if (pour) pour.follow();
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      mix.alcohol = targetAlcohol;
      window.perfumeState.mix = mix;
      updateTotalDisplay();
      updateBeaker();
      if (splashTimer) clearInterval(splashTimer);
      if (pour) pour.stop();
      ethanolPouring = false;
    }
  }
  requestAnimationFrame(step);
}

function createWaterPour() {
  var mixingScreen = document.getElementById('screen-mixing');
  if (!mixingScreen) return null;
  var screenRect = mixingScreen.getBoundingClientRect();
  var beakerEl = mixingScreen.querySelector('img[alt="Beaker"]');

  var cx = screenRect.left + screenRect.width / 2;
  var startY = screenRect.top + 80;
  var beakerRect, impactY;
  if (beakerEl) {
    beakerRect = beakerEl.getBoundingClientRect();
    impactY = beakerRect.top + beakerRect.height * 0.6;
  } else {
    impactY = startY + window.innerHeight * 0.4;
  }

  var layer = document.createElement('div');
  layer.className = 'pour-layer';
  document.body.appendChild(layer);

  var stream = document.createElement('div');
  stream.className = 'water-stream';
  stream.style.left = (cx - 4) + 'px';
  stream.style.top = startY + 'px';
  layer.appendChild(stream);

  var highlight = document.createElement('div');
  highlight.className = 'water-stream-shine';
  highlight.style.left = (cx - 1.5) + 'px';
  highlight.style.top = startY + 'px';
  layer.appendChild(highlight);

  function setHeight() {
    var beakerNow = beakerEl ? beakerEl.getBoundingClientRect() : null;
    var surfaceEl = document.getElementById('beaker-fill');
    var surfY = impactY;
    if (surfaceEl) {
      var sr = surfaceEl.getBoundingClientRect();
      if (sr.height > 0) surfY = sr.top;
    }
    if (beakerNow) surfY = Math.max(surfY, beakerNow.top + beakerNow.height * 0.35);
    var h = Math.max(surfY - startY, 0);
    stream.style.height = h + 'px';
    highlight.style.height = h + 'px';
    return { x: cx, y: startY + h };
  }
  var impact = setHeight();

  return {
    follow: function () { impact = setHeight(); },
    splash: function () {
      var ripple = document.createElement('div');
      ripple.className = 'water-ripple';
      ripple.style.left = impact.x + 'px';
      ripple.style.top = impact.y + 'px';
      layer.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 650);

      var n = 2 + Math.floor(Math.random() * 2);
      for (var i = 0; i < n; i++) {
        var p = document.createElement('div');
        p.className = 'splash-particle';
        var dir = (Math.random() < 0.5 ? -1 : 1);
        var dx = dir * (8 + Math.random() * 16);
        var dy = -(10 + Math.random() * 16);
        p.style.left = impact.x + 'px';
        p.style.top = impact.y + 'px';
        p.style.setProperty('--dx', dx + 'px');
        p.style.setProperty('--dy', dy + 'px');
        layer.appendChild(p);
        (function (el) { setTimeout(function () { el.remove(); }, 520); })(p);
      }
    },
    stop: function () {
      stream.style.transition = 'opacity 0.25s ease, height 0.25s ease';
      highlight.style.transition = 'opacity 0.25s ease';
      stream.style.opacity = '0';
      highlight.style.opacity = '0';
      setTimeout(function () { layer.remove(); }, 700);
    }
  };
}

function hexToRgb(hex) {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  return { r: r, g: g, b: b };
}

function rgbToHex(r, g, b) {
  return '#' +
    Math.round(r).toString(16).padStart(2, '0') +
    Math.round(g).toString(16).padStart(2, '0') +
    Math.round(b).toString(16).padStart(2, '0');
}

function blendColors() {
  var mix = window.perfumeState.mix || {};
  var totalR = 0, totalG = 0, totalB = 0, totalMl = 0;

  OILS.forEach(function (oil) {
    var ml = mix[oil.id] || 0;
    if (ml > 0) {
      var rgb = hexToRgb(oil.color);
      totalR += rgb.r * ml;
      totalG += rgb.g * ml;
      totalB += rgb.b * ml;
      totalMl += ml;
    }
  });

  if (totalMl === 0) return 'rgba(150,150,150,0.15)';

  var r = Math.round(totalR / totalMl);
  var g = Math.round(totalG / totalMl);
  var b = Math.round(totalB / totalMl);
  return rgbToHex(r, g, b);
}

function buildScentDescription() {
  var mix = window.perfumeState.mix || {};
  var keywords = [];

  OILS.forEach(function (oil) {
    if ((mix[oil.id] || 0) > 0) {
      keywords.push(oil.keyword);
    }
  });

  if (keywords.length === 0) return 'Add oils to see your scent...';
  return keywords.join(' + ');
}

function diluteColor(hex) {
  var rgb = hexToRgb(hex);
  var t = 0.45;
  var r = rgb.r + (255 - rgb.r) * t;
  var g = rgb.g + (255 - rgb.g) * t;
  var b = rgb.b + (255 - rgb.b) * t;
  return rgbToHex(r, g, b);
}

function hexAlpha(hex, a) {
  var r = parseInt(hex.slice(1,3), 16);
  var g = parseInt(hex.slice(3,5), 16);
  var b = parseInt(hex.slice(5,7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

function waveSVG(color, amp) {
  amp = amp || 10;
  var y1 = amp;
  var y2 = amp * 0.4;
  var y3 = amp * 1.6;
  var h = amp + 4;
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 ' + h + '" preserveAspectRatio="none">' +
    '<path d="M0 ' + y1 +
    ' C25 ' + y3 + ' 75 ' + y2 + ' 100 ' + y1 +
    ' C125 ' + y3 + ' 175 ' + y2 + ' 200 ' + y1 +
    ' L200 0 L0 0 Z" fill="' + color + '"/></svg>';
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}

function setBeakerLevel(total, capacity, color, opacity) {
  var fill = document.getElementById('beaker-fill');
  if (!fill) return;
  var fillRatio = Math.min(total / capacity, 1);
  var fillPct = fillRatio * 60;

  if (total === 0) {
    fill.style.height = '0%';
    fill.style.opacity = '1';
    return;
  }

  fill.style.height = fillPct + '%';
  fill.style.opacity = '1';

  // More rounded bottom at low fill levels (below ~3ml)
  if (total < 2) {
    fill.style.borderRadius = '0 0 50% 50% / 0 0 100% 100%';
    fill.style.left = '26.5%';
    fill.style.width = '44%';
  } else {
    fill.style.borderRadius = '0 0 22px 22px';
    fill.style.left = '24%';
    fill.style.width = '49%';
  }

  var light = lightenColor(color, 0.35);
  var dark = darkenColor(color, 0.25);

  // Liquid body gradient — increased contrast
  var body = document.getElementById('liquid-body');
  if (body) body.style.background = 'linear-gradient(to bottom, ' + light + ' 0%, ' + color + ' 35%, ' + dark + ' 100%)';

  // Wave layer 1 (main) — amplitude 10px
  var w1 = document.getElementById('wave-layer1');
  if (w1) {
    w1.style.background = waveSVG(color, 10);
    w1.style.backgroundSize = '200px ' + 16 + 'px';
    w1.style.backgroundRepeat = 'repeat-x';
    w1.style.animation = 'wave-drift 3s linear infinite';
  }

  // Wave layer 2 (secondary) — amplitude 7px, lighter, slower
  var w2 = document.getElementById('wave-layer2');
  if (w2) {
    w2.style.background = waveSVG(light, 7);
    w2.style.backgroundSize = '200px ' + 13 + 'px';
    w2.style.backgroundRepeat = 'repeat-x';
    w2.style.animation = 'wave-drift 4.5s linear infinite';
  }

  // Radial light overlay at top
  var rad = document.getElementById('liquid-radial');
  if (rad) rad.style.background = 'radial-gradient(ellipse at 50% 0%, ' + hexAlpha(light, 0.4) + ' 0%, transparent 70%)';

  // Main highlight — larger, more opaque diagonal band
  var h1 = document.getElementById('liquid-highlight1');
  if (h1) {
    h1.style.background = 'linear-gradient(25deg, transparent 15%, rgba(255,255,255,0.32) 35%, rgba(255,255,255,0.48) 50%, rgba(255,255,255,0.32) 65%, transparent 85%)';
    h1.style.top = '8%';
    h1.style.left = '8%';
    h1.style.width = '50%';
    h1.style.height = '80%';
    h1.style.filter = 'blur(6px)';
  }

  // Secondary highlight — smaller side reflection
  var h2 = document.getElementById('liquid-highlight2');
  if (h2) {
    h2.style.background = 'linear-gradient(25deg, transparent 25%, rgba(255,255,255,0.22) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.22) 55%, transparent 75%)';
    h2.style.filter = 'blur(5px)';
  }
}

function lightenColor(hex, amt) {
  var r = parseInt(hex.slice(1,3), 16);
  var g = parseInt(hex.slice(3,5), 16);
  var b = parseInt(hex.slice(5,7), 16);
  r = Math.min(255, Math.round(r + (255 - r) * amt));
  g = Math.min(255, Math.round(g + (255 - g) * amt));
  b = Math.min(255, Math.round(b + (255 - b) * amt));
  return '#' + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

function darkenColor(hex, amt) {
  var r = parseInt(hex.slice(1,3), 16);
  var g = parseInt(hex.slice(3,5), 16);
  var b = parseInt(hex.slice(5,7), 16);
  r = Math.max(0, Math.round(r * (1 - amt)));
  g = Math.max(0, Math.round(g * (1 - amt)));
  b = Math.max(0, Math.round(b * (1 - amt)));
  return '#' + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

function updateBeaker() {
  var total = getTotalMl();
  var capacity = getCapacity();
  setBeakerLevel(total === 0 ? 0 : total, capacity, total === 0 ? '' : blendColors(), total === 0 ? 1 : 0.85);
}

function addAlcohol() {
  var btn = document.getElementById('btn-alcohol');
  if (btn.disabled) return;

  var capacity = getCapacity();
  var oilTotal = getTotalMl();
  var remaining = capacity - oilTotal;

  window.perfumeState.mix.alcohol = remaining;

  btn.disabled = true;
  btn.classList.add('border-cream/20', 'text-cream/30', 'cursor-not-allowed');
  btn.classList.remove('border-gold', 'text-gold', 'hover:bg-gold', 'hover:text-dark', 'cursor-pointer');

  var stream = document.getElementById('pour-stream');
  stream.classList.remove('hidden');

  var oilColor = blendColors();
  var diluted = diluteColor(oilColor);
  var liquid = document.getElementById('beaker-liquid');
  liquid.classList.add('pour-fill');

  var flaskBottom = 243;
  var flaskHeight = 143;
  var oilRatio = oilTotal / capacity;
  var oilFillHeight = oilRatio * flaskHeight;
  var oilTop = flaskBottom - oilFillHeight;

  liquid.setAttribute('d',
    'M57 ' + oilTop +
    ' L57 220 Q57 243 80 243 L100 243 Q123 243 123 220 L123 ' + oilTop +
    ' Z');
  liquid.setAttribute('fill', oilColor);
  liquid.setAttribute('fill-opacity', '0.85');

  setTimeout(function () {
    setBeakerLevel(capacity, capacity, diluted, 0.55);
    liquid.classList.remove('pour-fill');

    document.getElementById('mix-total').textContent = capacity;
    document.getElementById('scent-description').textContent = buildScentDescription() + ' â€” Perfume Alcohol added';

    stream.classList.add('hidden');

    document.getElementById('btn-shake').classList.remove('hidden');
  }, 2300);
}

function buildFinishedDescription() {
  var mix = window.perfumeState.mix || {};
  var keywords = [];
  OILS.forEach(function (oil) {
    if ((mix[oil.id] || 0) > 0) keywords.push(oil.keyword);
  });
  if (keywords.length === 0) return 'Your Signature Scent';
  var joined = keywords.length <= 2 ? keywords.join(' & ') : keywords.slice(0, -1).join(', ') + ' & ' + keywords[keywords.length - 1];
  return 'Your Signature Scent: ' + joined;
}

function createBubbles() {
  var container = document.getElementById('bubble-container');
  if (!container) return;
  container.innerHTML = '';

  for (var i = 0; i < 12; i++) {
    var b = document.createElement('div');
    b.className = 'bubble';
    var size = 4 + Math.random() * 6;
    b.style.width = size + 'px';
    b.style.height = size + 'px';
    b.style.left = (8 + Math.random() * 54) + 'px';
    b.style.bottom = (5 + Math.random() * 30) + 'px';
    b.style.setProperty('--dur', (0.8 + Math.random() * 0.7) + 's');
    b.style.setProperty('--delay', (Math.random() * 0.8) + 's');
    container.appendChild(b);
  }
}

function shakeAndMix() {
  var btn = document.getElementById('btn-shake');
  btn.classList.add('hidden');
  btn.classList.remove('btn-glow');

  var flask = document.querySelector('.flask-svg');
  if (flask) {
    flask.classList.add('shake-full');
  }

  createBubbles();

  setTimeout(function () {
    if (flask) flask.classList.remove('shake-full');

    var container = document.getElementById('bubble-container');
    if (container) container.innerHTML = '';

    var descEl = document.getElementById('scent-description');
    descEl.textContent = buildFinishedDescription();
    descEl.classList.remove('text-cream/40', 'bg-cream/5', 'border-cream/10');
    descEl.classList.add('text-gold', 'text-base', 'font-light', 'border-gold/30', 'bg-gold/5');
    descEl.classList.add('result-fadein');

    document.getElementById('btn-bottle').classList.remove('hidden');
  }, 1600);
}

function renderMixingStation() {
  var container = document.getElementById('mixing-layout');
  if (!container) return;

  window.perfumeState.mix = {};
  OILS.forEach(function (oil) {
    window.perfumeState.mix[oil.id] = 0;
  });

  var oilsHtml = OILS.map(function (oil) {
    return (
      '<div class="flex items-center justify-between bg-cream/5 border border-cream/10 rounded-xl px-5 py-4">' +
        '<div class="flex items-center gap-3">' +
          '<span class="w-3 h-3 rounded-full" style="background:' + oil.color + '"></span>' +
          '<span class="text-cream/90 text-sm tracking-wide">' + oil.name + '</span>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<button onclick="changeOil(\'' + oil.id + '\', -1)" class="w-8 h-8 rounded-lg border border-cream/20 text-cream/50 flex items-center justify-center hover:border-gold hover:text-gold transition-colors text-sm">-</button>' +
          '<span id="ml-' + oil.id + '" class="w-10 text-center text-cream/70 text-sm">0</span>' +
          '<button onclick="changeOil(\'' + oil.id + '\', 1)" class="w-8 h-8 rounded-lg border border-cream/20 text-cream/50 flex items-center justify-center hover:border-gold hover:text-gold transition-colors text-sm">+</button>' +
          '<span class="text-cream/30 text-xs ml-1">ml</span>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML =
    '<div class="flex flex-col lg:flex-row gap-10">' +

      /* Left panel â€” oils */
      '<div class="lg:w-80 flex-shrink-0">' +
        '<h3 class="text-gold tracking-[0.2em] uppercase text-xs mb-4">Fragrance Oils</h3>' +
        '<div class="space-y-3">' + oilsHtml + '</div>' +
      '</div>' +

      /* Center â€” beaker + controls */
      '<div class="flex-1 flex flex-col items-center">' +

        /* Beaker SVG */
        '<div class="relative mb-8">' +
          /* Pour stream (hidden by default) */
          '<div id="pour-stream" class="hidden absolute left-1/2 -translate-x-1/2 top-0 z-10 pointer-events-none">' +
            '<svg width="12" height="40" viewBox="0 0 12 40">' +
              '<rect class="pour-stream" x="4" y="0" width="4" height="40" rx="2" fill="rgba(201,169,110,0.6)"/>' +
            '</svg>' +
          '</div>' +
          /* Bubble container (overlaid on flask body) */
          '<div id="bubble-container" class="absolute pointer-events-none" style="left:55px;top:100px;width:70px;height:143px;overflow:hidden;"></div>' +
          '<svg class="flask-svg" width="180" height="260" viewBox="0 0 180 260" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<defs>' +
              '<clipPath id="flask-clip">' +
                '<path d="M55 100 L55 220 Q55 245 80 245 L100 245 Q125 245 125 220 L125 100 Z"/>' +
              '</clipPath>' +
            '</defs>' +
            /* Flask body */
            '<path d="M55 100 L55 220 Q55 245 80 245 L100 245 Q125 245 125 220 L125 100" ' +
              'stroke="rgba(201,169,110,0.4)" stroke-width="2" fill="rgba(201,169,110,0.03)"/>' +
            /* Flask neck */
            '<path d="M70 100 L70 40 Q70 30 80 30 L100 30 Q110 30 110 40 L110 100" ' +
              'stroke="rgba(201,169,110,0.4)" stroke-width="2" fill="rgba(201,169,110,0.03)"/>' +
            /* Flask rim */
            '<ellipse cx="90" cy="30" rx="22" ry="6" ' +
              'stroke="rgba(201,169,110,0.5)" stroke-width="2" fill="none"/>' +
            /* Liquid (clipped to flask body) */
            '<g clip-path="url(#flask-clip)">' +
              '<path id="beaker-liquid" d="M57 243 Q57 243 80 243 L100 243 Q123 243 123 243 L123 243 L57 243 Z" ' +
                'fill="rgba(150,150,150,0.15)"/>' +
            '</g>' +
            /* Measurement lines */
            '<line x1="58" y1="140" x2="68" y2="140" stroke="rgba(201,169,110,0.2)" stroke-width="1"/>' +
            '<line x1="58" y1="180" x2="68" y2="180" stroke="rgba(201,169,110,0.2)" stroke-width="1"/>' +
            '<line x1="58" y1="220" x2="68" y2="220" stroke="rgba(201,169,110,0.2)" stroke-width="1"/>' +
            '<text x="70" y="143" fill="rgba(201,169,110,0.25)" font-size="9">25%</text>' +
            '<text x="70" y="183" fill="rgba(201,169,110,0.25)" font-size="9">50%</text>' +
            '<text x="70" y="223" fill="rgba(201,169,110,0.25)" font-size="9">75%</text>' +
          '</svg>' +
        '</div>' +

        /* Total counter + warning */
        '<div class="text-center mb-6">' +
          '<span id="mix-total" class="text-2xl font-light text-cream/80">0</span>' +
          '<span class="text-cream/40 text-sm"> / <span id="mix-capacity">50</span> ml</span>' +
          '<div id="mix-warning" class="hidden text-red-400 text-xs mt-1 tracking-wide">Bottle capacity exceeded</div>' +
        '</div>' +

        /* Scent description */
        '<div id="scent-description" class="w-full max-w-md bg-cream/5 border border-cream/10 rounded-xl px-6 py-4 text-center text-cream/40 text-sm mb-8 transition-colors">' +
          'Add oils to see your scent...' +
        '</div>' +

        /* Alcohol button */
        '<button id="btn-alcohol" onclick="addAlcohol()" disabled class="border border-cream/20 text-cream/30 px-8 py-3 rounded-full tracking-widest uppercase text-sm cursor-not-allowed transition-all duration-300">' +
          'Add Perfume Alcohol' +
        '</button>' +

        /* Shake & Mix button (hidden until alcohol added) */
        '<button id="btn-shake" onclick="shakeAndMix()" class="hidden mt-4 bg-gold text-dark px-8 py-3 rounded-full tracking-widest uppercase text-sm font-medium btn-glow transition-all duration-300">' +
          'Shake & Mix' +
        '</button>' +

        /* Bottle It button (hidden until shake complete) */
        '<button id="btn-bottle" onclick="bottleIt()" class="hidden mt-4 border border-gold text-gold px-8 py-3 rounded-full tracking-widest uppercase text-sm hover:bg-gold hover:text-dark transition-all duration-300">' +
          'Bottle It' +
        '</button>' +

      '</div>' +
    '</div>';
}

function bottleIt() {
  renderBottleScreen();
  showScreen('screen-bottle');
  setTimeout(fillBottle, 200);
}

function getBlendedColor() {
  return blendColors();
}

function getDilutedColor() {
  return diluteColor(blendColors());
}

function renderBottleScreen() {
  var container = document.getElementById('bottle-screen-content');
  if (!container) return;

  var color = getDilutedColor();
  var capacity = getCapacity();
  var scentText = buildFinishedDescription();

  container.innerHTML =
    '<div class="text-center bottle-reveal">' +
      '<p class="text-gold tracking-[0.3em] uppercase text-sm mb-4">Bottling</p>' +
      '<h2 class="text-3xl md:text-4xl font-light tracking-wide mb-10">Your Perfume</h2>' +

      /* Bottle SVG */
      '<div class="relative inline-block mb-10">' +
        '<svg width="160" height="280" viewBox="0 0 160 280" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          /* Cap */
          '<rect x="58" y="8" width="44" height="24" rx="4" stroke="rgba(201,169,110,0.5)" stroke-width="1.5" fill="rgba(201,169,110,0.08)"/>' +
          '<line x1="68" y1="12" x2="68" y2="28" stroke="rgba(201,169,110,0.15)" stroke-width="0.5"/>' +
          '<line x1="78" y1="12" x2="78" y2="28" stroke="rgba(201,169,110,0.15)" stroke-width="0.5"/>' +
          '<line x1="88" y1="12" x2="88" y2="28" stroke="rgba(201,169,110,0.15)" stroke-width="0.5"/>' +
          /* Neck */
          '<path d="M66 32 L66 56 Q66 60 70 60 L90 60 Q94 60 94 56 L94 32" ' +
            'stroke="rgba(201,169,110,0.4)" stroke-width="1.5" fill="rgba(201,169,110,0.03)"/>' +
          /* Shoulders */
          '<path d="M66 60 Q30 60 30 90 L30 90" ' +
            'stroke="rgba(201,169,110,0.4)" stroke-width="1.5" fill="none"/>' +
          '<path d="M94 60 Q130 60 130 90 L130 90" ' +
            'stroke="rgba(201,169,110,0.4)" stroke-width="1.5" fill="none"/>' +
          /* Body */
          '<rect x="30" y="90" width="100" height="160" rx="8" ' +
            'stroke="rgba(201,169,110,0.4)" stroke-width="1.5" fill="rgba(201,169,110,0.03)"/>' +
          /* Liquid area (clipped to body) */
          '<defs>' +
            '<clipPath id="bottle-body-clip">' +
              '<rect x="31" y="91" width="98" height="158" rx="7"/>' +
            '</clipPath>' +
          '</defs>' +
          '<g clip-path="url(#bottle-body-clip)">' +
            '<div id="bottle-liquid-el"></div>' +
            '<rect id="bottle-liquid" x="31" y="249" width="98" height="0" rx="0" fill="' + color + '" fill-opacity="0.6"/>' +
          '</g>' +
          /* Bottom edge */
          '<line x1="30" y1="250" x2="130" y2="250" stroke="rgba(201,169,110,0.25)" stroke-width="1"/>' +
          /* Shine overlay (applied via CSS) */
          '<rect id="bottle-shine-rect" x="31" y="91" width="98" height="158" rx="7" fill="url(#shine-grad)" opacity="0"/>' +
          '<defs>' +
            '<linearGradient id="shine-grad" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0%" stop-color="white" stop-opacity="0.3"/>' +
              '<stop offset="35%" stop-color="white" stop-opacity="0.08"/>' +
              '<stop offset="50%" stop-color="white" stop-opacity="0"/>' +
              '<stop offset="75%" stop-color="white" stop-opacity="0.04"/>' +
              '<stop offset="100%" stop-color="white" stop-opacity="0.18"/>' +
            '</linearGradient>' +
          '</defs>' +
        '</svg>' +
      '</div>' +

      /* Scent label */
      '<div id="bottle-scent-label" class="opacity-0 transition-opacity duration-700">' +
        '<p class="text-gold tracking-[0.2em] uppercase text-xs mb-2">Your Blend</p>' +
        '<p class="text-cream/80 text-lg font-light mb-1">' + scentText + '</p>' +
        '<p class="text-cream/40 text-sm">' + capacity + 'ml â€” Perfume Lab</p>' +
      '</div>' +

      /* Sticker button (hidden until fill complete) */
      '<div id="bottle-sticker-btn" class="mt-10 opacity-0 transition-opacity duration-500">' +
        '<button onclick="showScreen(\'screen-sticker\')" class="border border-gold text-gold px-10 py-3 rounded-full tracking-widest uppercase text-sm hover:bg-gold hover:text-dark transition-all duration-300">' +
          'Design Your Sticker' +
        '</button>' +
      '</div>' +
    '</div>';
}

function fillBottle() {
  var liquid = document.getElementById('bottle-liquid');
  var shine = document.getElementById('bottle-shine-rect');
  var label = document.getElementById('bottle-scent-label');
  var btn = document.getElementById('bottle-sticker-btn');
  if (!liquid) return;

  var capacity = getCapacity();
  var maxH = 158;
  var fillPct = Math.min(getTotalMl() / capacity, 1);
  var targetH = fillPct * maxH;
  var targetY = 249 - targetH;

  liquid.setAttribute('y', String(249));
  liquid.setAttribute('height', '0');

  requestAnimationFrame(function () {
    liquid.style.transition = 'y 1.8s cubic-bezier(0.4,0,0.2,1), height 1.8s cubic-bezier(0.4,0,0.2,1)';
    liquid.setAttribute('y', String(targetY));
    liquid.setAttribute('height', String(targetH));
  });

  setTimeout(function () {
    shine.setAttribute('opacity', '1');
    shine.style.transition = 'opacity 0.8s ease-in';

    label.classList.remove('opacity-0');
    label.classList.add('opacity-100');

    setTimeout(function () {
      btn.classList.remove('opacity-0');
      btn.classList.add('opacity-100');
    }, 400);
  }, 1900);
}

function updateMixingCapacity() {
  var el = document.getElementById('mix-capacity');
  if (el) el.textContent = getCapacity();
  updateTotalDisplay();
  updateBeaker();
}

document.addEventListener('DOMContentLoaded', function () {
  renderMixingStation();
  updateMixingCapacity();

  var oilList = document.getElementById('oil-list');
  if (!oilList) return;

  var isDragging = false;
  var startX = 0;
  var scrollLeftStart = 0;
  var moved = false;

  function onMouseDown(e) {
    isDragging = true;
    moved = false;
    startX = e.pageX;
    scrollLeftStart = oilList.scrollLeft;
    oilList.style.cursor = 'grabbing';
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    var dx = e.pageX - startX;
    if (!moved && Math.abs(dx) < 3) return;
    moved = true;
    oilList.scrollLeft = scrollLeftStart - dx;
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    oilList.style.cursor = 'grab';
  }

  function onTouchStart(e) {
    isDragging = true;
    moved = false;
    startX = e.touches[0].pageX;
    scrollLeftStart = oilList.scrollLeft;
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    var dx = e.touches[0].pageX - startX;
    if (!moved && Math.abs(dx) < 3) return;
    moved = true;
    oilList.scrollLeft = scrollLeftStart - dx;
  }

  function onTouchEnd() {
    isDragging = false;
  }

  oilList.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  oilList.addEventListener('touchstart', onTouchStart, { passive: true });
  oilList.addEventListener('touchmove', onTouchMove, { passive: true });
  oilList.addEventListener('touchend', onTouchEnd);
});
