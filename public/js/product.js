/* =========================================================
   بن السعودي: product page picker
   Style (plain / spiced) and roast or flavor pick one row of the menu;
   that row decides which sizes exist and what they cost.
   ========================================================= */
(function () {
  'use strict';

  const form = document.getElementById('buyForm');
  if (!form) return;

  const data = JSON.parse(form.dataset.product);
  const t = (k) => window.SOODY.t(k);
  const lang = window.SOODY.lang;
  const $ = (sel) => form.querySelector(sel);
  const $$ = (sel) => [...form.querySelectorAll(sel)];
  const money = (piasters) => {
    const n = piasters / 100;
    const s = Number.isInteger(n) ? String(n) : n.toFixed(2);
    return lang === 'ar' ? `${s} ج.م` : `EGP ${s}`;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const value = (name) => ($(`input[name="${name}"]:checked`) || {}).value;
  const section = () => value('section') || data.sections[0];
  const inSection = () => data.items.filter((i) => i.section === section());

  function currentItem() {
    const list = inSection();
    if (list[0].label) return list.find((i) => String(i.id) === value('choice')) || list[0];
    if (list[0].roasts.length) return list.find((i) => i.roasts.includes(value('roast'))) || list[0];
    return list[0];
  }

  function render() {
    const list = inSection();

    // flavors / named rows (French coffee)
    const choiceBox = document.getElementById('pickChoice');
    choiceBox.hidden = !list[0].label;
    if (list[0].label) {
      const keep = value('choice');
      document.getElementById('choiceOpts').innerHTML = list.map((i, n) => `
        <label><input type="radio" name="choice" value="${i.id}" ${String(i.id) === keep || (!keep && n === 0) ? 'checked' : ''}><span>${esc(i.label)}</span></label>`).join('');
    }

    // roasts that exist in this style
    const roastBox = document.getElementById('pickRoast');
    const roasts = new Set(list.flatMap((i) => i.roasts));
    roastBox.hidden = roasts.size === 0;
    $$('input[name="roast"]').forEach((r) => { r.closest('label').hidden = !roasts.has(r.value); });
    if (roasts.size && !roasts.has(value('roast'))) {
      const firstRoast = $$('input[name="roast"]').find((r) => roasts.has(r.value));
      if (firstRoast) firstRoast.checked = true;
    }

    // spice blend add-on: plain coffee only
    const spiceBox = document.getElementById('pickSpice');
    if (spiceBox) {
      spiceBox.hidden = section() !== 'plain';
      if (spiceBox.hidden) { const none = $('input[name="spice"][value="0"]'); if (none) none.checked = true; }
    }

    // sizes and prices of the chosen row
    const item = currentItem();
    $$('input[name="size"]').forEach((s) => {
      const price = item.prices[s.value];
      s.disabled = price == null;
      s.nextElementSibling.querySelector('small').textContent = price == null ? '' : item.priceText[s.value];
    });
    if (!$('input[name="size"]:checked:not(:disabled)')) {
      const firstSize = $('input[name="size"]:not(:disabled)');
      if (firstSize) firstSize.checked = true;
    }
    paintPrice();
  }

  function qty() {
    const q = Math.floor(Number($('#qty').value));
    return Math.min(50, Math.max(1, Number.isFinite(q) ? q : 1));
  }

  const spice = () => (section() === 'plain' ? Number(value('spice') || 0) : 0);

  function paintPrice() {
    const item = currentItem();
    const unit = item.prices[value('size')];
    document.getElementById('buyPrice').textContent = unit == null ? '' : money((unit + spice()) * qty());
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'qty') { $('#qty').value = qty(); paintPrice(); return; }
    render();
  });
  $('#qty').addEventListener('input', paintPrice);
  form.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (!step) return;
    $('#qty').value = Math.min(50, Math.max(1, qty() + Number(step.dataset.step)));
    paintPrice();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const item = currentItem();
    const size = Number(value('size'));
    if (!size) return;
    window.SoodyCart.add({
      item: item.id,
      size,
      roast: item.roasts.length ? value('roast') : '',
      grind: Number($('#grind')?.value || 0),
      spice: spice(),
      qty: qty(),
    });
    const msg = document.getElementById('buyMsg');
    msg.textContent = t('product.added');
    const badge = document.getElementById('cartCount');
    badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
    window.SoodyCart.open();
  });

  render();
})();
