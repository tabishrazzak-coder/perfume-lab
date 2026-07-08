var stickerCanvas = null;
var STICKER_COLORS = [
  '#C9A96E', '#F5F0E8', '#0A0A0A', '#E8A0BF', '#4A3728',
  '#B497D6', '#F4D35E', '#C68642', '#FFFFFF', '#1A1A1A'
];

function initStickerCanvas() {
  if (stickerCanvas) {
    stickerCanvas.dispose();
  }

  stickerCanvas = new fabric.Canvas('sticker-fabric', {
    width: 240,
    height: 320,
    backgroundColor: 'rgba(245,240,232,0.05)',
    selection: true,
    preserveObjectStacking: true,
  });

  stickerCanvas.on('selection:created', updateColorPickerActive);
  stickerCanvas.on('selection:updated', updateColorPickerActive);
  stickerCanvas.on('selection:cleared', updateColorPickerActive);
}

function updateColorPickerActive() {
  var obj = stickerCanvas.getActiveObject();
  if (!obj) return;
  var fill = obj.fill || '#C9A96E';
  if (typeof fill !== 'string') return;
  document.querySelectorAll('.color-swatch').forEach(function (el) {
    el.classList.toggle('active', el.dataset.color === fill);
  });
}

function addStickerText() {
  if (!stickerCanvas) return;
  var text = new fabric.Text('My Scent', {
    left: 60,
    top: 130,
    fontFamily: 'Georgia, serif',
    fontSize: 22,
    fill: '#C9A96E',
    editable: true,
    selection: true,
  });
  stickerCanvas.add(text);
  stickerCanvas.setActiveObject(text);
  stickerCanvas.renderAll();
}

function setStickerColor(color) {
  var obj = stickerCanvas.getActiveObject();
  if (obj) {
    obj.set('fill', color);
    stickerCanvas.renderAll();
  }
  document.querySelectorAll('.color-swatch').forEach(function (el) {
    el.classList.toggle('active', el.dataset.color === color);
  });
}

function addStar() {
  if (!stickerCanvas) return;
  var points = [];
  var spikes = 5;
  var outerR = 18;
  var innerR = 8;
  for (var i = 0; i < spikes * 2; i++) {
    var r = i % 2 === 0 ? outerR : innerR;
    var angle = (Math.PI / spikes) * i - Math.PI / 2;
    points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  var star = new fabric.Polygon(points, {
    left: 100,
    top: 140,
    fill: '#C9A96E',
    selection: true,
  });
  stickerCanvas.add(star);
  stickerCanvas.setActiveObject(star);
  stickerCanvas.renderAll();
}

function addWave() {
  if (!stickerCanvas) return;
  var path = 'M 0 10 Q 15 0 30 10 Q 45 20 60 10 Q 75 0 90 10';
  var wave = new fabric.Path(path, {
    left: 75,
    top: 160,
    fill: '',
    stroke: '#C9A96E',
    strokeWidth: 2,
    selection: true,
  });
  stickerCanvas.add(wave);
  stickerCanvas.setActiveObject(wave);
  stickerCanvas.renderAll();
}

function addLine() {
  if (!stickerCanvas) return;
  var line = new fabric.Line([40, 0, 200, 0], {
    left: 20,
    top: 170,
    stroke: '#C9A96E',
    strokeWidth: 1.5,
    selection: true,
  });
  stickerCanvas.add(line);
  stickerCanvas.setActiveObject(line);
  stickerCanvas.renderAll();
}

function addBlob() {
  if (!stickerCanvas) return;
  var blob = new fabric.Path(
    'M 30 10 C 50 -5 75 5 80 25 C 85 45 70 65 45 60 C 20 55 5 40 10 25 C 15 10 10 25 30 10 Z',
    {
      left: 80,
      top: 120,
      fill: 'rgba(201,169,110,0.25)',
      stroke: '#C9A96E',
      strokeWidth: 1,
      selection: true,
    }
  );
  stickerCanvas.add(blob);
  stickerCanvas.setActiveObject(blob);
  stickerCanvas.renderAll();
}

function clearSticker() {
  if (!stickerCanvas) return;
  stickerCanvas.clear();
  stickerCanvas.backgroundColor = 'rgba(245,240,232,0.05)';
  stickerCanvas.renderAll();
  document.getElementById('btn-continue-summary').classList.add('hidden');
}

function saveStickerDesign() {
  if (!stickerCanvas) return;

  var json = stickerCanvas.toJSON();
  var dataUrl = stickerCanvas.toDataURL({ format: 'png', multiplier: 2 });

  window.perfumeState.stickerDesign = json;
  window.perfumeState.stickerThumb = dataUrl;

  document.getElementById('btn-continue-summary').classList.remove('hidden');
}

function renderStickerStudio() {
  var container = document.getElementById('sticker-layout');
  if (!container) return;

  var colorSwatches = STICKER_COLORS.map(function (c) {
    return '<div class="color-swatch" data-color="' + c + '" style="background:' + c + ';" onclick="setStickerColor(\'' + c + '\')"></div>';
  }).join('');

  container.innerHTML =
    '<div class="flex flex-col lg:flex-row gap-8 items-start">' +

      /* Sidebar */
      '<div class="lg:w-64 w-full flex-shrink-0 sticker-sidebar space-y-6">' +

        /* Text tool */
        '<div>' +
          '<h4 class="text-gold tracking-[0.15em] uppercase text-xs mb-3">Text</h4>' +
          '<button onclick="addStickerText()" class="w-full border border-cream/20 text-cream/70 rounded-lg px-4 py-2.5 text-sm hover:border-gold hover:text-gold transition-colors">' +
            '+ Add Text' +
          '</button>' +
        '</div>' +

        /* Color picker */
        '<div>' +
          '<h4 class="text-gold tracking-[0.15em] uppercase text-xs mb-3">Color</h4>' +
          '<div class="flex flex-wrap gap-2">' + colorSwatches + '</div>' +
        '</div>' +

        /* Shapes */
        '<div>' +
          '<h4 class="text-gold tracking-[0.15em] uppercase text-xs mb-3">Shapes</h4>' +
          '<div class="grid grid-cols-2 gap-2">' +
            '<button onclick="addStar()" class="shape-btn border border-cream/20 rounded-lg px-3 py-2 text-cream/60 text-xs text-center">★ Star</button>' +
            '<button onclick="addWave()" class="shape-btn border border-cream/20 rounded-lg px-3 py-2 text-cream/60 text-xs text-center">〰 Wave</button>' +
            '<button onclick="addLine()" class="shape-btn border border-cream/20 rounded-lg px-3 py-2 text-cream/60 text-xs text-center">— Line</button>' +
            '<button onclick="addBlob()" class="shape-btn border border-cream/20 rounded-lg px-3 py-2 text-cream/60 text-xs text-center">◉ Blob</button>' +
          '</div>' +
        '</div>' +

        /* Actions */
        '<div class="space-y-3 pt-2">' +
          '<button onclick="clearSticker()" class="w-full border border-cream/20 text-cream/50 rounded-lg px-4 py-2.5 text-sm hover:border-red-400 hover:text-red-400 transition-colors">' +
            'Clear Canvas' +
          '</button>' +
          '<button onclick="saveStickerDesign()" class="w-full bg-gold text-dark rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gold/90 transition-colors">' +
            'Save Design' +
          '</button>' +
          '<div id="btn-continue-summary" class="hidden">' +
            '<button onclick="showScreen(\'screen-pricing\')" class="w-full border border-gold text-gold rounded-lg px-4 py-2.5 text-sm hover:bg-gold hover:text-dark transition-colors">' +
              'Continue to Summary' +
            '</button>' +
          '</div>' +
        '</div>' +

      '</div>' +

      /* Canvas area with bottle backdrop */
      '<div class="flex-1 flex flex-col items-center">' +
        '<div class="sticker-canvas-wrap p-6 relative">' +
          /* Bottle backdrop SVG */
          '<svg class="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 240 320" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<rect x="88" y="8" width="64" height="32" rx="4" stroke="rgba(201,169,110,0.4)" stroke-width="1" fill="none"/>' +
            '<path d="M98 40 L98 60 Q98 68 104 68 L136 68 Q142 68 142 60 L142 40" stroke="rgba(201,169,110,0.3)" stroke-width="1" fill="none"/>' +
            '<path d="M98 68 Q60 68 60 95 L60 95" stroke="rgba(201,169,110,0.3)" stroke-width="1" fill="none"/>' +
            '<path d="M142 68 Q180 68 180 95 L180 95" stroke="rgba(201,169,110,0.3)" stroke-width="1" fill="none"/>' +
            '<rect x="60" y="95" width="120" height="190" rx="8" stroke="rgba(201,169,110,0.3)" stroke-width="1" fill="none"/>' +
          '</svg>' +
          /* Fabric.js canvas */
          '<canvas id="sticker-fabric"></canvas>' +
        '</div>' +
        '<p class="text-cream/30 text-xs mt-4 tracking-wide">Drag, resize, and rotate elements on the label</p>' +
      '</div>' +

    '</div>';
}

function setupStickerScreen() {
  renderStickerStudio();
  setTimeout(function () {
    initStickerCanvas();
  }, 50);
}

document.addEventListener('DOMContentLoaded', function () {
  var observer = new MutationObserver(function () {
    var screen = document.getElementById('screen-sticker');
    if (screen && !screen.classList.contains('hidden')) {
      if (!stickerCanvas || !stickerCanvas.lowerCanvasEl) {
        setupStickerScreen();
      }
    }
  });

  var target = document.getElementById('screen-sticker');
  if (target) {
    observer.observe(target, { attributes: true, attributeFilter: ['class'] });
  }
});
