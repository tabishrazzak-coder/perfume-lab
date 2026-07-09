window.perfumeState = {
  bottleSize: '100ml',
  bottleType: 'classic',
};

var _currentScreen = null;
var _screenHistory = [];
var _tabScreens = ['screen-mixing', 'screen-sticker', 'screen-pricing'];
var _noTabScreens = ['screen-loading', 'screen-welcome', 'screen-confirmation', 'screen-bottle'];

function showScreen(screenId, opts) {
  opts = opts || {};
  var target = document.getElementById(screenId);
  if (!target) return;

  var prev = _currentScreen ? document.getElementById(_currentScreen) : null;
  var isBack = opts.back || false;
  var skipAnim = opts.skipAnim || false;
  var isTab = _tabScreens.indexOf(screenId) !== -1;

  // determine direction
  var forward = true;
  if (isBack) {
    forward = false;
  } else if (_currentScreen && _tabScreens.indexOf(_currentScreen) !== -1 && isTab) {
    var fromIdx = _tabScreens.indexOf(_currentScreen);
    var toIdx = _tabScreens.indexOf(screenId);
    forward = toIdx >= fromIdx;
  }

  // hide all screens
  document.querySelectorAll('.screen').forEach(function (el) {
    el.style.display = 'none';
    el.classList.remove('screen-enter', 'screen-exit', 'screen-enter-back', 'screen-exit-back', 'screen-fade-in');
  });

  // show target
  if (skipAnim) {
    target.style.display = 'flex';
  } else {
    target.style.display = 'flex';
    target.classList.add(forward ? 'screen-enter' : 'screen-enter-back');
  }

  target.scrollTop = 0;
  _currentScreen = screenId;

  // track history
  if (!isBack && _screenHistory[_screenHistory.length - 1] !== screenId) {
    _screenHistory.push(screenId);
  }
  if (isBack) _screenHistory.pop();

  // update tab bar
  updateTabBar(screenId);

  // trigger mixing capacity update
  if (screenId === 'screen-mixing' && typeof updateMixingCapacity === 'function') {
    updateMixingCapacity();
  }
}

function goBack() {
  if (_screenHistory.length > 1) {
    _screenHistory.pop();
    var prev = _screenHistory[_screenHistory.length - 1];
    showScreen(prev, { back: true });
  } else {
    showScreen('screen-loading', { skipAnim: true });
  }
}

function updateTabBar(screenId) {
  var bar = document.getElementById('bottom-tab-bar');
  if (!bar) return;

  var showBar = _tabScreens.indexOf(screenId) !== -1;
  if (showBar) {
    bar.style.display = '';
    bar.classList.remove('hidden-bar');
  } else {
    bar.classList.add('hidden-bar');
    setTimeout(function () {
      if (bar.classList.contains('hidden-bar')) bar.style.display = 'none';
    }, 300);
  }

  // update active tab
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === screenId);
  });
}




function renderSummaryScreen() {
  var container = document.getElementById('pricing-content');
  if (!container) return;

  var state = window.perfumeState || {};
  var mix = state.mix || {};
  var size = state.bottleSize || '50ml';
  var thumb = state.stickerThumb || '';
  var price = typeof calculatePrice === 'function' ? calculatePrice() : { base: 0, oilsCost: 0, stickerFee: 0, total: 0, currency: '$' };

  /* Oil rows */
  var oilRows = '';
  var oilNames = {
    citrus: 'Citrus', vanilla: 'Vanilla', oud: 'Oud', rose: 'Rose',
    sandalwood: 'Sandalwood', lemon: 'Lemon', lavender: 'Lavender'
  };
  var oilColors = {
    citrus: '#F4D35E', vanilla: '#E8D3B9', oud: '#4A3728', rose: '#E8A0BF',
    sandalwood: '#C68642', lemon: '#F9E547', lavender: '#B497D6'
  };
  var totalMl = 0;

  for (var k in mix) {
    if (mix.hasOwnProperty(k) && k !== 'alcohol' && mix[k] > 0) {
      totalMl += mix[k];
      oilRows +=
        '<div class="flex items-center justify-between py-2 border-b border-cream/10">' +
          '<div class="flex items-center gap-3">' +
            '<span class="w-2.5 h-2.5 rounded-full" style="background:' + (oilColors[k] || '#999') + '"></span>' +
            '<span class="text-cream/80 text-sm">' + (oilNames[k] || k) + '</span>' +
          '</div>' +
          '<span class="text-cream/60 text-sm">' + mix[k] + ' ml</span>' +
        '</div>';
    }
  }

  if (!oilRows) {
    oilRows = '<p class="text-cream/30 text-sm py-2">No oils added</p>';
  }

  /* Thumbnail */
  var thumbHtml = thumb
    ? '<img src="' + thumb + '" alt="Sticker design" class="w-24 h-32 object-cover rounded-lg border border-cream/10">'
    : '<div class="w-24 h-32 rounded-lg border border-dashed border-cream/20 flex items-center justify-center text-cream/20 text-xs">No design</div>';

  container.innerHTML =
    '<div class="text-center mb-10 bottle-reveal">' +
      '<p class="text-gold tracking-[0.3em] uppercase text-sm mb-3">Summary</p>' +
      '<h2 class="text-3xl md:text-4xl font-light tracking-wide mb-2">Your Custom Perfume</h2>' +
      '<p id="summary-blend-name" class="text-cream/50 text-sm"></p>' +
    '</div>' +

    '<div class="flex flex-col md:flex-row gap-8 mb-10">' +

      /* Left — oil list + bottle info */
      '<div class="flex-1 space-y-6">' +

        /* Bottle info */
        '<div class="bg-cream/5 border border-cream/10 rounded-xl p-6">' +
          '<h3 class="text-gold tracking-[0.15em] uppercase text-xs mb-4">Bottle</h3>' +
          '<div class="flex justify-between text-sm mb-2">' +
            '<span class="text-cream/50">Size</span>' +
            '<span class="text-cream/80">' + size + '</span>' +
          '</div>' +
          '<div class="flex justify-between text-sm mb-2">' +
            '<span class="text-cream/50">Oils used</span>' +
            '<span class="text-cream/80">' + totalMl + ' ml</span>' +
          '</div>' +
          '<div class="flex justify-between text-sm">' +
            '<span class="text-cream/50">Alcohol</span>' +
            '<span class="text-cream/80">' + (mix.alcohol || 0) + ' ml</span>' +
          '</div>' +
        '</div>' +

        /* Oil breakdown */
        '<div class="bg-cream/5 border border-cream/10 rounded-xl p-6">' +
          '<h3 class="text-gold tracking-[0.15em] uppercase text-xs mb-4">Fragrance Blend</h3>' +
          oilRows +
        '</div>' +

        /* Name input */
        '<div class="bg-cream/5 border border-cream/10 rounded-xl p-6">' +
          '<h3 class="text-gold tracking-[0.15em] uppercase text-xs mb-3">Name Your Creation</h3>' +
          '<input id="blend-name-input" type="text" placeholder="My Signature Blend" ' +
            'class="w-full bg-transparent border border-cream/20 rounded-lg px-4 py-2.5 text-cream/80 text-sm placeholder-cream/30 focus:border-gold focus:outline-none transition-colors" ' +
            'oninput="updateBlendName()">' +
        '</div>' +

      '</div>' +

      /* Right — thumbnail + price */
      '<div class="w-full md:w-72 flex-shrink-0 space-y-6">' +

        /* Sticker preview */
        '<div class="bg-cream/5 border border-cream/10 rounded-xl p-6 flex flex-col items-center">' +
          '<h3 class="text-gold tracking-[0.15em] uppercase text-xs mb-4 self-start">Label Design</h3>' +
          thumbHtml +
        '</div>' +

        /* Price breakdown */
        '<div class="bg-cream/5 border border-cream/10 rounded-xl p-6">' +
          '<h3 class="text-gold tracking-[0.15em] uppercase text-xs mb-4">Price</h3>' +
          '<div class="space-y-2 text-sm">' +
            '<div class="flex justify-between">' +
              '<span class="text-cream/50">Base (' + size + ')</span>' +
              '<span class="text-cream/70">' + formatPrice(price.base) + '</span>' +
            '</div>' +
            '<div class="flex justify-between">' +
              '<span class="text-cream/50">Oils (' + price.oilsMl + ' ml)</span>' +
              '<span class="text-cream/70">' + formatPrice(price.oilsCost) + '</span>' +
            '</div>' +
            '<div class="flex justify-between">' +
              '<span class="text-cream/50">Custom label</span>' +
              '<span class="text-cream/70">' + (price.stickerFee > 0 ? formatPrice(price.stickerFee) : '—') + '</span>' +
            '</div>' +
            '<div class="border-t border-cream/15 pt-2 mt-2 flex justify-between">' +
              '<span class="text-gold font-medium">Total</span>' +
              '<span class="text-gold text-lg font-medium">' + formatPrice(price.total) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

      '</div>' +
    '</div>' +

    /* Order button */
    '<div class="text-center">' +
      '<button onclick="placeOrder()" class="bg-gold text-dark px-12 py-3.5 rounded-full tracking-widest uppercase text-sm font-medium hover:bg-gold/90 transition-all duration-300">' +
        'Order My Custom Bottle' +
      '</button>' +
    '</div>';
}

function updateBlendName() {
  var input = document.getElementById('blend-name-input');
  var label = document.getElementById('summary-blend-name');
  if (input && label) {
    var val = input.value.trim();
    label.textContent = val ? '"' + val + '"' : '';
    window.perfumeState.blendName = val || null;
  }
}

function placeOrder() {
  window.perfumeState.blendName = document.getElementById('blend-name-input').value.trim() || 'My Signature Blend';
  showScreen('screen-confirmation');
  renderConfirmation();
}

function renderConfirmation() {
  var el = document.getElementById('confirmation-content');
  if (!el) return;

  var name = window.perfumeState.blendName || 'My Signature Blend';
  var size = window.perfumeState.bottleSize || '50ml';
  var price = typeof calculatePrice === 'function' ? calculatePrice() : { total: 0, currency: '$' };

  el.innerHTML =
    '<div class="text-center bottle-reveal">' +
      '<div class="text-6xl mb-6">✓</div>' +
      '<p class="text-gold tracking-[0.3em] uppercase text-sm mb-4">Order Confirmed</p>' +
      '<h2 class="text-3xl md:text-4xl font-light tracking-wide mb-4">"' + name + '"</h2>' +
      '<p class="text-cream/50 mb-2">' + size + ' Custom Perfume</p>' +
      '<p class="text-cream/40 text-sm mb-10">Total: ' + formatPrice(price.total) + ' — Thank you!</p>' +
      '<button onclick="resetAndStart()" class="border border-gold text-gold px-10 py-3 rounded-full tracking-widest uppercase text-sm hover:bg-gold hover:text-dark transition-all duration-300">' +
        'Create Another' +
      '</button>' +
    '</div>';
}

function resetAndStart() {
  window.perfumeState = { bottleSize: '100ml', bottleType: 'classic' };
  _screenHistory = [];
  showLoading('screen-mixing', 1500);
}








function selectSize(el) {
  document.querySelectorAll('[data-size]').forEach(function(card) {
    card.style.borderColor = '#e5e5e5';
    card.querySelector('.size-dot').style.display = 'none';
  });
  el.style.borderColor = '#1a1a1a';
  el.querySelector('.size-dot').style.display = 'block';
  window.perfumeState.bottleSize = el.getAttribute('data-size');
}

function selectBottle(el) {
  document.querySelectorAll('[data-bottle]').forEach(function(card) {
    card.style.borderColor = '#e5e5e5';
    card.querySelector('.bottle-dot').style.display = 'none';
  });
  el.style.borderColor = '#1a1a1a';
  el.querySelector('.bottle-dot').style.display = 'block';
  window.perfumeState.bottleType = el.getAttribute('data-bottle');
}

document.addEventListener('DOMContentLoaded', function () {
  var observer = new MutationObserver(function () {
    var screen = document.getElementById('screen-pricing');
    if (screen && screen.style.display !== 'none') {
      renderSummaryScreen();
    }
  });

  var target = document.getElementById('screen-pricing');
  if (target) {
    observer.observe(target, { attributes: true, attributeFilter: ['style'] });
  }
});

/* =============================================
   Loading Screen
   ============================================= */

function showLoading(targetScreenId, duration) {
  duration = duration || 1800;
  var loading = document.getElementById('screen-loading');
  if (!loading) {
    showScreen(targetScreenId, { skipAnim: true });
    return;
  }

  document.querySelectorAll('.screen').forEach(function (el) {
    el.style.display = 'none';
  });
  loading.style.display = 'flex';

  setTimeout(function () {
    loading.classList.add('screen-loading-out');
    setTimeout(function () {
      loading.classList.remove('screen-loading-out');
      loading.style.display = 'none';
      showScreen(targetScreenId);
      _currentScreen = targetScreenId;
      _screenHistory = [targetScreenId];
    }, 400);
  }, duration);
}

document.addEventListener('DOMContentLoaded', function () {
  function setVH() {
    document.documentElement.style.setProperty('--real-vh', window.innerHeight + 'px');
  }
  setVH();
  window.addEventListener('resize', setVH);

  showLoading('screen-mixing', 2000);
});
