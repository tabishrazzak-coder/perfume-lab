var PRICING = {
  base: { '30ml': 25, '50ml': 40, '100ml': 65 },
  perMl: 1.2,
  stickerFee: 8,
  currency: '$',
};

function calculatePrice() {
  var state = window.perfumeState || {};
  var size = state.bottleSize || '50ml';
  var mix = state.mix || {};
  var hasSticker = !!state.stickerDesign;

  var base = PRICING.base[size] || 40;
  var oilTotal = 0;
  for (var k in mix) {
    if (mix.hasOwnProperty(k) && k !== 'alcohol') {
      oilTotal += mix[k] || 0;
    }
  }
  var oilsCost = oilTotal * PRICING.perMl;
  var sticker = hasSticker ? PRICING.stickerFee : 0;
  var total = base + oilsCost + sticker;

  return {
    base: base,
    oilsMl: oilTotal,
    oilsCost: oilsCost,
    stickerFee: sticker,
    total: total,
    currency: PRICING.currency,
  };
}

function formatPrice(n) {
  return PRICING.currency + n.toFixed(2);
}
