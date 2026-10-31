/* =========================================================
   بن السعودي: browser script for every page
   nav, scroll reveal, and the cart (kept in this browser; prices always come from the server)
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const t = (k) => window.SOODY.t(k);
  const lang = window.SOODY.lang;

  /* ---------------- nav ---------------- */
  const nav = $('#siteNav');
  const menuBtn = $('#menuBtn');
  const links = $('#navLinks');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('menu-open', open);
    links.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  /* ---------------- reveal on scroll ---------------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('is-in'));
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('video[autoplay]').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
  }

  /* ---------------- cart ---------------- */
  const KEY = 'soody-cart';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = (lines) => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage blocked */ }
    paintCount(lines);
    document.dispatchEvent(new CustomEvent('soody:cart', { detail: lines }));
  };
  const lineKey = (l) => `${l.item}|${l.size}|${l.roast || ''}|${l.grind || 0}|${l.spice || 0}`;

  function paintCount(lines = read()) {
    const n = lines.reduce((s, l) => s + (l.qty || 0), 0);
    const badge = $('#cartCount');
    badge.textContent = lang === 'ar' ? n.toLocaleString('ar-EG') : n;
    badge.hidden = n === 0;
  }

  /** ask the server for names and prices; drops lines that are no longer valid */
  // extra: { phone, address, promo } from the checkout page, so offers can be priced too
  async function quote(lines, fulfilment = 'pickup', extra = {}) {
    const res = await fetch('/api/cart/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lines, fulfilment, lang, ...extra }),
    });
    if (!res.ok) throw new Error('quote failed');
    const data = await res.json();
    if (data.problems?.length) {
      const bad = new Set(data.problems.map((p) => p.key));
      write(read().filter((l) => !bad.has(lineKey(l))));
    }
    return data;
  }

  const cart = {
    lines: read,
    add(line) {
      const lines = read();
      const existing = lines.find((l) => lineKey(l) === lineKey(line));
      if (existing) existing.qty = Math.min(50, existing.qty + line.qty);
      else lines.push(line);
      write(lines);
    },
    setQty(key, qty) {
      write(read().map((l) => (lineKey(l) === key ? { ...l, qty } : l)).filter((l) => l.qty > 0));
    },
    clear() { write([]); },
    quote,
    key: lineKey,
  };
  window.SoodyCart = cart;

  /* ---------------- drawer ---------------- */
  const drawer = $('#cartDrawer');
  const body = $('#cartLines');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function renderDrawer() {
    const lines = read();
    if (!lines.length) {
      body.innerHTML = `<div class="cart-empty"><p>${esc(t('cart.empty'))}</p><a class="btn btn--primary" href="${window.SOODY.storeHref}">${esc(t('cart.browse'))}</a></div>`;
      $('#cartFoot').hidden = true;
      return;
    }
    body.classList.add('is-loading');
    try {
      const q = await quote(lines);
      body.innerHTML = q.lines.map((l) => `
        <div class="cart-line" data-key="${esc(l.key)}">
          <img class="cart-line__img" src="${esc(l.image || '/media/bags.jpg')}" alt="" loading="lazy">
          <div class="cart-line__info">
            <strong>${esc(l.name)}</strong>
            <span>${esc(l.details)}</span>
            <span>${esc(t('size.' + l.size))}</span>
            <div class="qty">
              <button type="button" data-qty="-1" aria-label="${esc(t('cart.less'))}">−</button>
              <output>${l.qty}</output>
              <button type="button" data-qty="1" aria-label="${esc(t('cart.more'))}">+</button>
            </div>
          </div>
          <div class="cart-line__end">
            <span class="cart-line__price">${esc(l.totalText)}</span>
            <button type="button" class="cart-line__remove" data-remove>${esc(t('cart.remove'))}</button>
          </div>
        </div>`).join('') || `<div class="cart-empty"><p>${esc(t('cart.empty'))}</p></div>`;
      $('#cartSubtotal').textContent = q.subtotalText;
      $('#cartFoot').hidden = !q.lines.length;
    } catch {
      body.innerHTML = `<p class="cart-error">${esc(t('checkout.err.generic'))}</p>`;
    } finally {
      body.classList.remove('is-loading');
    }
  }

  function openDrawer() {
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    document.documentElement.classList.add('no-scroll');
    renderDrawer();
    $('.cart-drawer__close').focus();
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    document.documentElement.classList.remove('no-scroll');
    setTimeout(() => { drawer.hidden = true; }, 250);
    $('#cartBtn').focus();
  }
  cart.open = openDrawer;

  $('#cartBtn').addEventListener('click', openDrawer);
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-close]')) { closeDrawer(); return; }
    const row = e.target.closest('.cart-line');
    if (!row) return;
    const key = row.dataset.key;
    const line = read().find((l) => lineKey(l) === key);
    if (!line) return;
    if (e.target.closest('[data-remove]')) cart.setQty(key, 0);
    const step = e.target.closest('[data-qty]');
    if (step) cart.setQty(key, Math.min(50, line.qty + Number(step.dataset.qty)));
    renderDrawer();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });

  paintCount();
})();
