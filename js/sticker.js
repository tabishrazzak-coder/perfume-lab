var stickerCanvas = null;
var stickerHistory = [];
var stickerHistoryIndex = -1;
var STICKER_COLORS = [
  '#FFFFFF', '#F5F0E8', '#C9A96E', '#0A0A0A', '#E8A0BF', '#4A3728',
  '#B497D6', '#F4D35E', '#C68642', '#1A1A1A', '#D4E6D4', '#E6D4D4'
];

function getCanvasSize() {
  var wrapper = document.getElementById('sticker-canvas-wrapper');
  if (!wrapper) return { w: 350, h: 350 };
  var w = wrapper.clientWidth - 4; // minus border
  w = Math.min(w, 480);
  w = Math.max(w, 200);
  return { w: w, h: w };
}

function initStickerCanvas(restoreJson) {
  if (stickerCanvas) {
    if (!restoreJson) restoreJson = JSON.stringify(stickerCanvas.toJSON());
    stickerCanvas.dispose();
  }

  var size = getCanvasSize();

  stickerCanvas = new fabric.Canvas('sticker-canvas', {
    width: size.w,
    height: size.h,
    backgroundColor: '#FFFFFF',
    selection: true,
    preserveObjectStacking: true,
  });

  var el = document.getElementById('sticker-canvas');
  if (el) {
    el.style.width = size.w + 'px';
    el.style.height = size.h + 'px';
  }

  stickerCanvas.on('selection:created', updateLayerPanel);
  stickerCanvas.on('selection:updated', updateLayerPanel);
  stickerCanvas.on('selection:cleared', updateLayerPanel);
  stickerCanvas.on('object:modified', saveStickerState);
  stickerCanvas.on('object:added', function () { saveStickerState(); updateUndoRedoButtons(); });
  stickerCanvas.on('object:removed', function () { saveStickerState(); updateUndoRedoButtons(); });

  if (restoreJson) {
    stickerCanvas.loadFromJSON(restoreJson, function () {
      stickerCanvas.renderAll();
      saveStickerState();
    });
  } else {
    saveStickerState();
  }
}

function saveStickerState() {
  if (!stickerCanvas) return;
  var json = JSON.stringify(stickerCanvas.toJSON());
  if (stickerHistoryIndex < stickerHistory.length - 1) {
    stickerHistory = stickerHistory.slice(0, stickerHistoryIndex + 1);
  }
  stickerHistory.push(json);
  if (stickerHistory.length > 40) stickerHistory.shift();
  stickerHistoryIndex = stickerHistory.length - 1;
  updateUndoRedoButtons();
}

function stickerUndo() {
  if (!stickerCanvas || stickerHistoryIndex <= 0) return;
  stickerHistoryIndex--;
  stickerCanvas.loadFromJSON(stickerHistory[stickerHistoryIndex], function () {
    stickerCanvas.renderAll();
    updateUndoRedoButtons();
    updateLayerPanel();
  });
}

function stickerRedo() {
  if (!stickerCanvas || stickerHistoryIndex >= stickerHistory.length - 1) return;
  stickerHistoryIndex++;
  stickerCanvas.loadFromJSON(stickerHistory[stickerHistoryIndex], function () {
    stickerCanvas.renderAll();
    updateUndoRedoButtons();
    updateLayerPanel();
  });
}

function updateUndoRedoButtons() {
  var undoBtn = document.getElementById('btn-undo');
  var redoBtn = document.getElementById('btn-redo');
  if (undoBtn) undoBtn.disabled = stickerHistoryIndex <= 0;
  if (redoBtn) redoBtn.disabled = stickerHistoryIndex >= stickerHistory.length - 1;
}

function updateLayerPanel() {
  if (!stickerCanvas) return;
  var list = document.getElementById('sticker-layer-list');
  if (!list) return;
  var objects = stickerCanvas.getObjects();
  if (objects.length === 0) {
    list.innerHTML = '<p class="text-xs text-gray-400 text-center py-2">No layers yet</p>';
    return;
  }
  var html = '';
  for (var i = objects.length - 1; i >= 0; i--) {
    var obj = objects[i];
    var label = obj.type === 'i-text' || obj.type === 'text' ? obj.text.substring(0, 18) : (obj.type || 'Object');
    var active = stickerCanvas.getActiveObject() === obj;
    html += '<button onclick="selectLayer(' + i + ')" class="w-full text-left px-2 py-1.5 rounded text-[11px] ' + (active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50') + ' truncate">' + label + '</button>';
  }
  list.innerHTML = html;
}

function selectLayer(index) {
  if (!stickerCanvas) return;
  var objects = stickerCanvas.getObjects();
  if (objects[index]) {
    stickerCanvas.setActiveObject(objects[index]);
    stickerCanvas.renderAll();
    updateLayerPanel();
  }
}

function toggleLayerPanel() {
  var panel = document.getElementById('sticker-layer-panel');
  if (panel) panel.classList.toggle('hidden');
}

function addStickerText() {
  if (!stickerCanvas) return;
  var text = new fabric.IText('My Scent', {
    left: 80,
    top: 150,
    fontFamily: 'Georgia, serif',
    fontSize: 26,
    fill: '#C9A96E',
    editable: true,
  });
  stickerCanvas.add(text);
  stickerCanvas.setActiveObject(text);
  stickerCanvas.renderAll();
}

function setStickerColor(color) {
  var obj = stickerCanvas.getActiveObject();
  if (obj && obj.type !== 'activeSelection') {
    obj.set('fill', color);
    stickerCanvas.renderAll();
  }
  var preview = document.getElementById('color-preview');
  if (preview) preview.style.background = color;
}

function showColorPicker() {
  var panel = document.getElementById('sticker-tools');
  if (!panel) return;
  var existing = document.getElementById('color-picker-panel');
  if (existing) { existing.remove(); return; }

  var picker = document.createElement('div');
  picker.id = 'color-picker-panel';
  picker.className = 'px-5 pb-4';
  picker.innerHTML =
    '<div class="flex flex-wrap gap-2 mb-3">' +
    STICKER_COLORS.map(function (c) {
      return '<button onclick="setStickerColor(\'' + c + '\')" class="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform" style="background:' + c + ';"></button>';
    }).join('') +
    '</div>' +
    '<div class="flex gap-2">' +
      '<input type="color" id="custom-color" value="#C9A96E" class="w-8 h-8 rounded cursor-pointer border-0 p-0">' +
      '<button onclick="setStickerColor(document.getElementById(\'custom-color\').value)" class="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50">Apply</button>' +
    '</div>';
  panel.appendChild(picker);
}

function showElementsPicker() {
  var panel = document.getElementById('sticker-tools');
  if (!panel) return;
  var existing = document.getElementById('elements-picker-panel');
  if (existing) { existing.remove(); return; }

  var picker = document.createElement('div');
  picker.id = 'elements-picker-panel';
  picker.className = 'px-5 pb-4';
  picker.innerHTML =
    '<div class="grid grid-cols-4 gap-2">' +
      '<button onclick="addShape(\'rect\')" class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:bg-gray-50"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="1" stroke="#1a1a1a" stroke-width="1.3"/></svg><span class="text-[10px] text-gray-500">Rect</span></button>' +
      '<button onclick="addShape(\'circle\')" class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:bg-gray-50"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#1a1a1a" stroke-width="1.3"/></svg><span class="text-[10px] text-gray-500">Circle</span></button>' +
      '<button onclick="addShape(\'triangle\')" class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:bg-gray-50"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="12,4 20,20 4,20" stroke="#1a1a1a" stroke-width="1.3" fill="none"/></svg><span class="text-[10px] text-gray-500">Triangle</span></button>' +
      '<button onclick="addShape(\'star\')" class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:bg-gray-50"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" stroke="#1a1a1a" stroke-width="1.3" fill="none"/></svg><span class="text-[10px] text-gray-500">Star</span></button>' +
      '<button onclick="addShape(\'line-h\')" class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:bg-gray-50"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="4" y1="12" x2="20" y2="12" stroke="#1a1a1a" stroke-width="1.3"/></svg><span class="text-[10px] text-gray-500">Line</span></button>' +
      '<button onclick="addShape(\'heart\')" class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:bg-gray-50"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14 12 21 12 21Z" stroke="#1a1a1a" stroke-width="1.3" fill="none"/></svg><span class="text-[10px] text-gray-500">Heart</span></button>' +
      '<button onclick="addShape(\'drop\')" class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:bg-gray-50"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 5 11 5 15C5 19 8.13 22 12 22C15.87 22 19 19 19 15C19 11 12 2 12 2Z" stroke="#1a1a1a" stroke-width="1.3" fill="none"/></svg><span class="text-[10px] text-gray-500">Drop</span></button>' +
      '<button onclick="addShape(\'diamond\')" class="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:bg-gray-50"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><polygon points="12,2 22,12 12,22 2,12" stroke="#1a1a1a" stroke-width="1.3" fill="none"/></svg><span class="text-[10px] text-gray-500">Diamond</span></button>' +
    '</div>';
  panel.appendChild(picker);
}

function showBorderPicker() {
  var panel = document.getElementById('sticker-tools');
  if (!panel) return;
  var existing = document.getElementById('border-picker-panel');
  if (existing) { existing.remove(); return; }

  var picker = document.createElement('div');
  picker.id = 'border-picker-panel';
  picker.className = 'px-5 pb-4';
  picker.innerHTML =
    '<div class="grid grid-cols-3 gap-2">' +
      '<button onclick="addBorder(\'none\')" class="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-center"><span class="text-[10px] text-gray-500">None</span></button>' +
      '<button onclick="addBorder(\'solid\')" class="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-center"><div class="w-full h-5 border-2 border-gray-900 rounded"></div></button>' +
      '<button onclick="addBorder(\'dashed\')" class="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-center"><div class="w-full h-5 border-2 border-dashed border-gray-900 rounded"></div></button>' +
      '<button onclick="addBorder(\'double\')" class="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-center"><div class="w-full h-5 border-4 border-double border-gray-900 rounded"></div></button>' +
      '<button onclick="addBorder(\'rounded\')" class="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-center"><div class="w-full h-5 border-2 border-gray-900 rounded-full"></div></button>' +
      '<button onclick="addBorder(\'dotted\')" class="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-center"><div class="w-full h-5 border-2 border-dotted border-gray-900 rounded"></div></button>' +
    '</div>';
  panel.appendChild(picker);
}

function addBorder(type) {
  if (!stickerCanvas) return;
  stickerCanvas.getObjects().forEach(function (o) {
    if (o._isBorder) stickerCanvas.remove(o);
  });
  if (type === 'none') { stickerCanvas.renderAll(); return; }

  var cw = stickerCanvas.width || 350;
  var ch = stickerCanvas.height || 350;
  var pad = Math.max(5, cw * 0.015);
  var w = cw - pad * 2;
  var h = ch - pad * 2;
  var opts = { left: pad, top: pad, width: w, height: h, fill: 'transparent', selectable: false, evented: false, _isBorder: true, rx: type === 'rounded' ? cw * 0.04 : 5, ry: type === 'rounded' ? ch * 0.04 : 5 };

  if (type === 'solid' || type === 'rounded' || type === 'double' || type === 'dotted') {
    opts.stroke = '#1a1a1a';
    opts.strokeWidth = 2;
  }
  if (type === 'dashed') {
    opts.stroke = '#1a1a1a';
    opts.strokeWidth = 2;
    opts.strokeDashArray = [8, 4];
  }
  if (type === 'dotted') {
    opts.strokeDashArray = [3, 3];
  }

  stickerCanvas.add(new fabric.Rect(opts));
  stickerCanvas.renderAll();
  saveStickerState();
}

function addShape(type) {
  if (!stickerCanvas) return;
  var obj;
  var opts = { left: 120, top: 130, fill: '#C9A96E', selectable: true, originX: 'center', originY: 'center' };
  var cx = 175, cy = 175;

  switch (type) {
    case 'rect': obj = new fabric.Rect(Object.assign({ width: 60, height: 40, rx: 4 }, opts)); break;
    case 'circle': obj = new fabric.Circle(Object.assign({ radius: 30 }, opts)); break;
    case 'triangle': obj = new fabric.Triangle(Object.assign({ width: 60, height: 52 }, opts)); break;
    case 'star':
      var pts = [], spikes = 5, oR = 28, iR = 12;
      for (var i = 0; i < spikes * 2; i++) {
        var r = i % 2 === 0 ? oR : iR;
        var a = (Math.PI / spikes) * i - Math.PI / 2;
        pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
      }
      obj = new fabric.Polygon(pts, opts); break;
    case 'line-h': obj = new fabric.Line([cx - 40, cy, cx + 40, cy], Object.assign({ stroke: '#C9A96E', strokeWidth: 2 }, { left: cx - 40, top: cy })); break;
    case 'heart': obj = new fabric.Path('M0 -10 C0 -20 -15 -25 -15 -12 C-15 0 0 15 0 20 C0 15 15 0 15 -12 C15 -25 0 -20 0 -10 Z', Object.assign({ scaleX: 2, scaleY: 2 }, opts)); break;
    case 'drop': obj = new fabric.Path('M0 -25 C-15 -5 -15 10 0 18 C15 10 15 -5 0 -25 Z', Object.assign({ scaleX: 1.5, scaleY: 1.5 }, opts)); break;
    case 'diamond': obj = new fabric.Polygon([{x:0,y:-28},{x:22,y:0},{x:0,y:28},{x:-22,y:0}], opts); break;
  }

  if (obj) {
    stickerCanvas.add(obj);
    stickerCanvas.setActiveObject(obj);
    stickerCanvas.renderAll();
  }
}

function uploadStickerImage() {
  if (!stickerCanvas) return;
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      fabric.Image.fromURL(ev.target.result, function (img) {
        var scale = Math.min(200 / img.width, 200 / img.height);
        img.set({ left: 175, top: 175, originX: 'center', originY: 'center', scaleX: scale, scaleY: scale });
        stickerCanvas.add(img);
        stickerCanvas.setActiveObject(img);
        stickerCanvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function clearSticker() {
  if (!stickerCanvas) return;
  stickerCanvas.clear();
  stickerCanvas.backgroundColor = '#FFFFFF';
  stickerCanvas.renderAll();
  saveStickerState();
}

function saveStickerDesign() {
  if (!stickerCanvas) return;
  var json = stickerCanvas.toJSON();
  var dataUrl = stickerCanvas.toDataURL({ format: 'png', multiplier: 2 });
  window.perfumeState.stickerDesign = json;
  window.perfumeState.stickerThumb = dataUrl;
}

function previewSticker() {
  if (!stickerCanvas) return;
  saveStickerDesign();
  showScreen('screen-pricing');
}

function setupStickerScreen() {
  setTimeout(function () {
    initStickerCanvas();
  }, 100);
}

var _stickerResizeTimer = null;
function handleStickerResize() {
  if (_stickerResizeTimer) clearTimeout(_stickerResizeTimer);
  _stickerResizeTimer = setTimeout(function () {
    var screen = document.getElementById('screen-sticker');
    if (screen && screen.style.display !== 'none') {
      initStickerCanvas();
    }
  }, 300);
}

document.addEventListener('DOMContentLoaded', function () {
  var target = document.getElementById('screen-sticker');
  if (!target) return;

  var observer = new MutationObserver(function () {
    if (target.style.display !== 'none' && target.style.display !== '') {
      setupStickerScreen();
    }
  });
  observer.observe(target, { attributes: true, attributeFilter: ['style'] });

  window.addEventListener('resize', handleStickerResize);
});
