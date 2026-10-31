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

  let promo = '';          // the code that's applied (valid at the last quote)
  let shownTotal = null;   // the total the customer is looking at

  // Prices the cart with everything that affects offers (phone and address decide the free first delivery)
  let seq = 0;
  async function refresh() {
    const lines = cart.lines();
    if (!lines.length) { showEmpty(); return null; }
    const fulfilment = value('fulfilment') || 'pickup';
    $('addressField').hidden = fulfilment !== 'delivery';
    if ($('branchPick')) $('branchPick').hidden = fulfilment !== 'pickup';
    const mine = ++seq;
    try {
      const q = await cart.quote(lines, fulfilment, { phone: $('phone').value, address: $('address').value, promo });
      if (mine !== seq) return q;   // a newer quote is on its way
      if (!q.lines.length) { showEmpty(); return null; }
      $('summaryLines').innerHTML = q.lines.map((l) => `
        <div class="summary__line"><span><b>${l.qty} × ${esc(l.name)}</b><br>${esc([l.details, t('size.' + l.size)].filter(Boolean).join(lang === 'ar' ? '، ' : ', '))}</span><span>${esc(l.totalText)}</span></div>`).join('');

      $('feeLine').hidden = fulfilment !== 'delivery';
      $('feeText').textContent = q.deliveryFee ? q.deliveryFeeText : t('checkout.free');
      const waived = q.deliveryFeeBefore > 0 && q.deliveryFee === 0;
      $('feeBefore').textContent = waived ? q.deliveryFeeBeforeText : '';
      $('feeNote').textContent = q.welcome ? t('checkout.welcomeOn') : '';

      $('discountLine').hidden = !q.discount;
      $('discountText').textContent = q.discountText;
      $('discountCode').textContent = q.promo ? q.promo.code : '';
      $('totalText').textContent = q.totalText;
      shownTotal = q.total;

      if (promo && q.promoError) {
        // code stopped applying (e.g. switched to pickup): drop it and say why
        promo = '';
        showPromo(null, q.promoErrorText);
        return refresh();
      }
      showPromo(q.promo, '');
      return q;
    } catch {
      $('formErr').textContent = t('checkout.err.generic');
      return null;
    }
  }

  function showPromo(applied, message) {
    $('promoEntry').hidden = !!applied;
    $('promoOn').hidden = !applied;
    $('promoChip').textContent = applied ? `✓ ${applied.code}` : '';
    $('promoMsg').textContent = message || '';
    $('promoMsg').classList.toggle('is-err', !!message);
  }

  async function applyPromo() {
    const code = $('promo').value.trim();
    if (!code) return;
    const btn = $('promoBtn');
    btn.disabled = true;
    try {
      const q = await cart.quote(cart.lines(), value('fulfilment') || 'pickup', { phone: $('phone').value, address: $('address').value, promo: code });
      if (q.promoError) showPromo(null, q.promoErrorText);
      else { promo = q.promo.code; await refresh(); }
    } catch {
      showPromo(null, t('checkout.err.generic'));
    }
    btn.disabled = false;
  }

  $('promoBtn').addEventListener('click', applyPromo);
  $('promo').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } });
  $('promoRemove').addEventListener('click', () => { promo = ''; $('promo').value = ''; showPromo(null, ''); refresh(); $('promo').focus(); });

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
    const needsBranch = value('fulfilment') === 'pickup' && $('branchPick');
    const branchMissing = needsBranch && !value('branch');
    $('err-branch') && ($('err-branch').textContent = branchMissing ? t('checkout.err.branch') : '');
    if (branchMissing) { $('branchPick').scrollIntoView({ behavior: 'smooth', block: 'center' }); ok = false; }
    for (const f of ['name', 'phone', 'address']) if ($(f).getAttribute('aria-invalid') === 'true') { if (ok) $(f).focus(); ok = false; }
    return ok;
  }

  form.addEventListener('change', (e) => {
    if (['fulfilment', 'phone', 'address'].includes(e.target.name)) refresh();
    if (e.target.name === 'branch') $('err-branch').textContent = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    $('formErr').textContent = '';
    if (!validate()) return;

    const btn = $('placeBtn');
    btn.disabled = true;
    btn.textContent = t('checkout.placing');
    const done = () => { btn.disabled = false; btn.textContent = t('checkout.place'); };

    // price once more with the final details; if the total went up, show it before ordering
    const before = shownTotal;
    const q = await refresh();
    if (!q) { done(); return; }
    if (before != null && q.total > before) { $('formErr').textContent = t('checkout.err.offer'); done(); return; }

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
          branch: value('branch') || '',
          promo,
          expectTotal: q.total,
        }),
      });
      const data = await res.json();
      if (res.ok || data.error === 'payment') {
        cart.clear();
        location.href = data.redirect;
        return;
      }
      if (data.field === 'branch') { $('err-branch').textContent = t('checkout.err.branch'); $('branchPick').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      else if (data.field) { setError(data.field, t(`checkout.err.${data.error}`)); $(data.field).focus(); }
      else if (data.error === 'changed' || data.error === 'empty') { $('formErr').textContent = t('checkout.err.changed'); refresh(); }
      else if (data.error === 'promo') { promo = ''; showPromo(null, data.text); $('formErr').textContent = t('checkout.err.promo'); refresh(); }
      else if (data.error === 'offer') { $('formErr').textContent = t('checkout.err.offer'); refresh(); }
      else if (data.error === 'closed') $('formErr').textContent = t('checkout.err.closed');
      else $('formErr').textContent = t('checkout.err.generic');
    } catch {
      $('formErr').textContent = t('checkout.err.generic');
    }
    done();
  });

  refresh();
})();
