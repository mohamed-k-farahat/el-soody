/* =========================================================
   بن السعودي: shared behaviour for every page
   (nav, footer, news ticker, language switch, menu board, visit info)
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const page = document.documentElement.dataset.page; // home | stories | menu | shop
  const beanById = Object.fromEntries(BEANS.map((b) => [b.id, b]));

  let lang = pickInitialLang();

  /* ---------------- language ---------------- */
  function pickInitialLang() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (fromUrl === 'ar' || fromUrl === 'en') return fromUrl;
    try {
      const saved = localStorage.getItem('soody-lang');
      if (saved === 'ar' || saved === 'en') return saved;
    } catch (e) { /* storage blocked: fall through */ }
    return 'ar';
  }

  const t = (key) => I18N[lang][key] ?? I18N.ar[key] ?? key;

  function applyLang() {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = t('meta.title.' + page);
    $('meta[name="description"]').setAttribute('content', t('meta.desc'));

    renderNav();
    renderFooter();
    renderTicker();

    $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-alt]').forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
    $$('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });

    if ($('#tablePlain')) renderMenu();
    if ($('#visitInfo')) renderVisit();

    // let page specific scripts (the book) re-render
    document.dispatchEvent(new CustomEvent('soody:lang', { detail: { lang } }));
  }

  function setLang(next) {
    lang = next;
    try { localStorage.setItem('soody-lang', lang); } catch (e) { /* ignore */ }
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
    applyLang();
  }

  window.SOODY = { t, get lang() { return lang; } };

  /* ---------------- nav ---------------- */
  const PAGES = [
    ['home', 'index.html'],
    ['stories', 'stories.html'],
    ['menu', 'menu.html'],
    ['shop', 'shop.html'],
  ];

  function renderNav() {
    const nav = $('#siteNav');
    const open = nav.classList.contains('menu-open');
    nav.innerHTML = `
      <div class="nav__inner container">
        <a href="index.html" class="nav__brand" aria-label="${t('brand')}">
          <span class="logo-mark" aria-hidden="true"></span>
          <span class="nav__name">${t('brand')}</span>
        </a>
        <nav class="nav__links${open ? ' is-open' : ''}" id="navLinks" aria-label="${t('nav.label')}">
          ${PAGES.map(([id, href]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}>${t('nav.' + id)}</a>`).join('')}
        </nav>
        <div class="nav__actions">
          <button class="lang-btn" id="langBtn" type="button" aria-label="${t('lang.switch')}" lang="${lang === 'ar' ? 'en' : 'ar'}">
            <span class="lang-btn__label">${t('lang.label')}</span>
          </button>
          <button class="menu-btn" id="menuBtn" type="button" aria-expanded="${open}" aria-controls="navLinks" aria-label="${t('nav.label')}">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>`;
  }

  // delegated, so it survives re-rendering
  document.addEventListener('click', (e) => {
    if (e.target.closest('#langBtn')) setLang(lang === 'ar' ? 'en' : 'ar');
    if (e.target.closest('#menuBtn')) setMenu(!$('#siteNav').classList.contains('menu-open'));
    if (e.target.closest('#navLinks a')) setMenu(false);
  });

  function setMenu(open) {
    const nav = $('#siteNav');
    nav.classList.toggle('menu-open', open);
    $('#navLinks').classList.toggle('is-open', open);
    $('#menuBtn').setAttribute('aria-expanded', String(open));
  }

  const onScroll = () => $('#siteNav').classList.toggle('is-scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- footer ---------------- */
  function renderFooter() {
    $('#siteFooter').innerHTML = `
      <div class="container footer__inner">
        <span class="logo-mark" aria-hidden="true"></span>
        <p class="footer__tag">${t('hero.tagline')}</p>
        <nav class="footer__links" aria-label="${t('nav.label')}">
          ${PAGES.map(([id, href]) => `<a href="${href}">${t('nav.' + id)}</a>`).join('')}
        </nav>
        <p class="footer__copy">© ${new Date().getFullYear()} ${t('brand')}</p>
      </div>`;
  }

  /* ---------------- news ticker ---------------- */
  function renderTicker() {
    const box = $('#ticker');
    if (!box) return;
    const items = NEWS[lang].map((n) => `<span class="ticker__item">${n}</span>`).join('');
    box.innerHTML = `
      <span class="ticker__label"><span>${t('ticker.label')}</span></span>
      <div class="ticker__view" aria-live="off">
        <div class="ticker__track">${items}${items.replace(/class="ticker__item"/g, 'class="ticker__item" aria-hidden="true"')}</div>
      </div>`;
  }

  /* ---------------- menu (laid out like the printed board) ---------------- */
  const roastText = (roasts) => roasts && roasts.length
    ? ` <span class="roast">( ${roasts.map((r) => t('roast.' + r)).join(lang === 'ar' ? '، ' : ', ')} )</span>`
    : '';

  function menuTable(items) {
    const price = (p) => `<td class="p">${p == null ? '' : p}</td>`;
    const rows = items.map((item) => {
      const name = item.name ? item.name[lang] : beanById[item.bean][lang].name;
      return `<tr><th scope="row">${name}${roastText(item.roasts)}</th>${item.prices.map(price).join('')}</tr>`;
    }).join('');
    return `
      <thead><tr>
        <td></td>
        <th scope="col">${t('menu.col.eighth')}</th>
        <th scope="col">${t('menu.col.quarter')}</th>
        <th scope="col">${t('menu.col.kilo')}</th>
      </tr></thead>
      <tbody>${rows}</tbody>`;
  }

  function renderMenu() {
    $('#tablePlain').innerHTML = menuTable(MENU.plain);
    $('#tableSpiced').innerHTML = menuTable(MENU.spiced);
    $('#tableFrench').innerHTML = menuTable(MENU.french);
  }

  /* ---------------- visit / socials (only what's filled in content.js) ---------------- */
  const ICONS = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.5-.3z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.2 1.7 3.8 4 4v3.2a7.6 7.6 0 0 1-4-1.2V15a6 6 0 1 1-6-6h.6v3.3H10a2.7 2.7 0 1 0 2.7 2.7V3H16z"/></svg>',
  };

  function renderVisit() {
    const info = [];
    if (SHOP.address[lang]) {
      const addr = SHOP.mapsUrl
        ? `<a href="${SHOP.mapsUrl}" target="_blank" rel="noopener">${SHOP.address[lang]}</a>`
        : SHOP.address[lang];
      info.push(['pin', t('visit.address'), addr]);
    } else if (SHOP.mapsUrl) {
      info.push(['pin', t('visit.address'), `<a href="${SHOP.mapsUrl}" target="_blank" rel="noopener">${t('visit.map')}</a>`]);
    }
    if (SHOP.hours[lang]) info.push(['clock', t('visit.hours'), SHOP.hours[lang]]);
    if (SHOP.phone) info.push(['phone', t('visit.phone'), `<a href="tel:${SHOP.phone.replace(/\s/g, '')}" dir="ltr">${SHOP.phone}</a>`]);

    $('#visitInfo').innerHTML = info
      .map(([ico, label, val]) => `<li><span class="ico">${ICONS[ico]}</span><span><b>${label}</b>${val}</span></li>`)
      .join('');

    const links = [
      ['whatsapp', SHOP.whatsapp && `https://wa.me/${SHOP.whatsapp}`, 'WhatsApp'],
      ['instagram', SHOP.instagram, 'Instagram'],
      ['facebook', SHOP.facebook, 'Facebook'],
      ['tiktok', SHOP.tiktok, 'TikTok'],
    ].filter(([, url]) => url);
    $('#socials').innerHTML = links
      .map(([ico, url, label]) => `<a href="${url}" target="_blank" rel="noopener" aria-label="${label}">${ICONS[ico]}</a>`)
      .join('');

    // nothing filled in yet: keep the section out of the page
    $('#visit').hidden = !info.length && !links.length;
  }

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

  /* respect reduced motion for autoplaying video */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('video[autoplay]').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
  }

  applyLang();
  onScroll();
})();
