/* =========================================================
   بن السعودي: checkout
   ========================================================= */
(function () {
  'use strict';

  const form = document.getElementById('checkoutForm');
  if (!form) return;
  const cart = window.SoodyCart;
  const t = (k) => window.SOODY.t(k);
  const lang = window.SOODY.lang;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const value = (name) => (form.querySelector(`input[name="${name}"]:checked`) || {}).value;

  function showEmpty() {
    form.hidden = true;
    $('checkoutEmpty').hidden = false;
  }

  async function refresh() {
    const lines = cart.lines();
    if (!lines.length) { showEmpty(); return; }
    const fulfilment = value('fulfilment') || 'pickup';
    $('addressField').hidden = fulfilment !== 'delivery';
    try {
      const q = await cart.quote(lines, fulfilment);
      if (!q.lines.length) { showEmpty(); return; }
      $('summaryLines').innerHTML = q.lines.map((l) => `
        <div class="summary__line"><span><b>${l.qty} × ${esc(l.name)}</b><br>${esc([l.details, t('size.' + l.size)].filter(Boolean).join(lang === 'ar' ? '، ' : ', '))}</span><span>${esc(l.totalText)}</span></div>`).join('');
      $('feeLine').hidden = fulfilment !== 'delivery';
      $('feeText').textContent = q.deliveryFee ? q.deliveryFeeText : t('checkout.free');
      $('totalText').textContent = q.totalText;
    } catch {
      $('formErr').textContent = t('checkout.err.generic');
    }
  }

  function setError(field, message) {
    const input = $(field);
    const box = $(`err-${field}`);
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (box) box.textContent = message || '';
  }

  function validate() {
    let ok = true;
    const name = $('name').value.trim();
    const phone = $('phone').value.replace(/[^\d٠-٩+]/g, '');
    setError('name', name.length < 2 ? t('checkout.err.name') : '');
    setError('phone', phone.length < 10 ? t('checkout.err.phone') : '');
    const needsAddress = value('fulfilment') === 'delivery';
    setError('address', needsAddress && $('address').value.trim().length < 5 ? t('checkout.err.address') : '');
    for (const f of ['name', 'phone', 'address']) if ($(f).getAttribute('aria-invalid') === 'true') { if (ok) $(f).focus(); ok = false; }
    return ok;
  }

  form.addEventListener('change', (e) => { if (e.target.name === 'fulfilment') refresh(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    $('formErr').textContent = '';
    if (!validate()) return;

    const btn = $('placeBtn');
    btn.disabled = true;
    btn.textContent = t('checkout.placing');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lang,
          lines: cart.lines(),
          fulfilment: value('fulfilment'),
          payment: value('payment'),
          name: $('name').value,
          phone: $('phone').value,
          address: $('address').value,
          notes: $('notes').value,
        }),
      });
      const data = await res.json();
      if (res.ok || data.error === 'payment') {
        cart.clear();
        location.href = data.redirect;
        return;
      }
      if (data.field) { setError(data.field, t(`checkout.err.${data.error}`)); $(data.field).focus(); }
      else if (data.error === 'changed' || data.error === 'empty') { $('formErr').textContent = t('checkout.err.changed'); refresh(); }
      else if (data.error === 'closed') $('formErr').textContent = t('checkout.err.closed');
      else $('formErr').textContent = t('checkout.err.generic');
    } catch {
      $('formErr').textContent = t('checkout.err.generic');
    }
    btn.disabled = false;
    btn.textContent = t('checkout.place');
  });

  refresh();
})();
