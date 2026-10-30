/* =========================================================
   بن السعودي: the Bean Stories flip book
   Desktop shows a two page spread; phones show one page at a time.
   Arabic books open the other way (spine on the right), so the
   page turn direction follows the language.
   ========================================================= */
(function () {
  'use strict';

  const stage = document.getElementById('bookStage');
  const bookEl = document.getElementById('book');
  const prevBtn = document.getElementById('bookPrev');
  const nextBtn = document.getElementById('bookNext');
  const countEl = document.getElementById('bookCount');
  const decor = document.getElementById('bookDecor');

  const TURN_MS = 900;
  const t = (k) => window.SOODY.t(k);
  const isRtl = () => document.documentElement.dir === 'rtl';
  const num = (n) => (window.SOODY.lang === 'ar' ? n.toLocaleString('ar-EG') : String(n));

  let mode = null;      // 'double' | 'single'
  let leaves = [];      // [frontHTML, backHTML]
  let cur = 0;          // leaves turned so far
  let curPage = 0;      // flat page index currently in view (survives rebuilds)
  let jumping = null;

  /* ---------------- page templates ---------------- */
  // flat page order: cover, intro, contents, then plate + story for every bean, then the end
  const plateIndex = (i) => 3 + i * 2;

  function roastLine(b) {
    if (!b.roasts.length) return `<span class="chip">${t('book.noRoast')}</span>`;
    return b.roasts.map((r) => `<span class="chip"><i class="dot dot--${r}"></i>${t('roast.' + r)}</span>`).join('');
  }

  function pages() {
    const L = window.SOODY.lang;
    const list = [];

    list.push(`
      <div class="pg pg--cover">
        <div class="cover__frame">
          <span class="cover__orn orn" aria-hidden="true"></span>
          <span class="logo-mark cover__logo" aria-hidden="true"></span>
          <h2 class="cover__title">${t('book.coverTitle')}</h2>
          <p class="cover__sub">${t('book.coverSub')}</p>
          <span class="cover__hint">${t('book.coverHint')}</span>
          <span class="cover__orn cover__orn--down orn" aria-hidden="true"></span>
        </div>
      </div>`);

    list.push(`
      <div class="pg pg--intro">
        <div class="pg__in">
          <h3 class="pg__h">${t('book.introTitle')}</h3>
          <p>${t('book.intro1')}</p>
          <p>${t('book.intro2')}</p>
          <div class="intro__art">${SoodyBeans.plateMarkup(BEANS[6])}</div>
          <p class="pg__sign">${t('book.intro3')}</p>
        </div>
        <span class="pg__num">${num(1)}</span>
      </div>`);

    list.push(`
      <div class="pg pg--toc">
        <div class="pg__in">
          <h3 class="pg__h">${t('book.tocTitle')}</h3>
          <ol class="toc">
            ${BEANS.map((b, i) => `
              <li><button type="button" data-goto="${plateIndex(i)}">
                <span class="toc__n">${num(i + 1)}</span>
                <span class="toc__name">${b[L].name}</span>
                <span class="toc__dots" aria-hidden="true"></span>
                <span class="toc__pg">${num(plateIndex(i))}</span>
              </button></li>`).join('')}
          </ol>
        </div>
        <span class="pg__num">${num(2)}</span>
      </div>`);

    BEANS.forEach((b, i) => {
      const c = b[L];
      list.push(`
        <div class="pg pg--plate" id="bean-${b.id}">
          <div class="pg__in">
            <p class="pg__eyebrow">${c.origin}</p>
            <h3 class="plate__name">${c.name}</h3>
            ${c.tag ? `<span class="plate__tag">${c.tag}</span>` : ''}
            <div class="plate__art">${SoodyBeans.plateMarkup(b)}</div>
            <dl class="plate__facts">
              <div><dt>${t('book.notes')}</dt><dd>${c.notes}</dd></div>
              <div><dt>${t('book.roast')}</dt><dd class="chips">${roastLine(b)}</dd></div>
            </dl>
          </div>
          <span class="pg__num">${num(plateIndex(i))}</span>
        </div>`);

      list.push(`
        <div class="pg pg--story">
          <div class="pg__in">
            <p class="pg__eyebrow">${t('book.storyLabel')}</p>
            <h3 class="story__name">${c.name}</h3>
            <div class="story__body">${c.story.map((p) => `<p>${p}</p>`).join('')}</div>
            ${c.pair ? `<p class="story__tip"><b>${t('book.tip')}</b>${c.pair}</p>` : ''}
          </div>
          <span class="pg__num">${num(plateIndex(i) + 1)}</span>
        </div>`);
    });

    list.push(`
      <div class="pg pg--end">
        <div class="pg__in">
          <span class="end__orn orn" aria-hidden="true"></span>
          <h3 class="pg__h">${t('book.endTitle')}</h3>
          <p>${t('book.endText')}</p>
          <a class="btn btn--primary" href="menu.html">${t('book.endCta')}</a>
        </div>
      </div>`);

    return list;
  }

  /* ---------------- build & layout ---------------- */
  function pickMode() {
    return stage.clientWidth >= 760 ? 'double' : 'single';
  }

  function build() {
    const ps = pages();
    mode = pickMode();
    const blank = '<div class="pg pg--blank"></div>';
    leaves = [];
    if (mode === 'double') {
      for (let i = 0; i < ps.length; i += 2) leaves.push([ps[i], ps[i + 1] || blank]);
    } else {
      ps.forEach((p) => leaves.push([p, blank]));
    }

    bookEl.className = 'book book--' + mode;
    bookEl.innerHTML = leaves.map((l, i) => `
      <div class="leaf" data-i="${i}">
        <div class="face face--front">${l[0]}</div>
        <div class="face face--back">${l[1]}</div>
      </div>`).join('');

    cur = mode === 'double' ? Math.ceil(curPage / 2) : curPage;
    size();
    update(false);
    drawDecor();
  }

  function size() {
    const pad = mode === 'double' ? 48 : 24;
    const w = stage.clientWidth - pad;
    const h = Math.max(440, window.innerHeight - 190);
    const ratio = 0.68;
    const pw = mode === 'double'
      ? Math.min(w / 2, h * ratio, 560)
      : Math.min(w, 520, (window.innerHeight - 150) * ratio);
    bookEl.style.setProperty('--pw', Math.floor(pw) + 'px');
    bookEl.style.setProperty('--ph', Math.floor(pw / ratio) + 'px');
  }

  function zFor(i) {
    return i < cur ? i + 1 : leaves.length - i;
  }

  function update(animate) {
    const N = leaves.length;
    [...bookEl.children].forEach((leaf, i) => {
      const flipped = i < cur;
      const changed = leaf.classList.contains('is-flipped') !== flipped;
      leaf.classList.toggle('is-flipped', flipped);
      if (animate && changed) {
        // keep the turning page on top for the whole turn, then settle it into the stack
        leaf.style.zIndex = 500;
        clearTimeout(leaf._z);
        leaf._z = setTimeout(() => { leaf.style.zIndex = zFor(i); leaf._z = null; }, TURN_MS);
      } else if (!leaf._z) {
        leaf.style.zIndex = zFor(i);
      }
      if (!animate) leaf.classList.add('no-anim');
      // only keep the pages next to the open spread on screen; the rest cost nothing to draw
      const near = mode === 'double' ? i >= cur - 2 && i <= cur + 1 : i >= cur - 1 && i <= cur + 1;
      leaf.style.display = near ? '' : 'none';
    });
    if (!animate) requestAnimationFrame(() => requestAnimationFrame(() => [...bookEl.children].forEach((l) => l.classList.remove('no-anim'))));

    bookEl.classList.toggle('is-closed-front', mode === 'double' && cur === 0);
    bookEl.classList.toggle('is-closed-back', mode === 'double' && cur === N);

    curPage = mode === 'double' ? Math.max(0, cur * 2 - 1) : cur;
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === maxCur();
    countEl.textContent = `${num(cur + 1)} / ${num(maxCur() + 1)}`;
  }

  /* ---------------- turning ---------------- */
  function maxCur() {
    return mode === 'double' ? leaves.length : leaves.length - 1;
  }

  function turn(step) {
    stopJump();
    const next = Math.min(maxCur(), Math.max(0, cur + step));
    if (next === cur) return;
    cur = next;
    update(true);
  }

  function stopJump() {
    if (jumping) { clearInterval(jumping); jumping = null; }
  }

  // flip through pages one by one to reach a flat page index
  function goToPage(p) {
    stopJump();
    const target = mode === 'double' ? Math.ceil(p / 2) : p;
    if (target === cur) return;
    const step = target > cur ? 1 : -1;
    jumping = setInterval(() => {
      cur += step;
      update(true);
      if (cur === target) stopJump();
    }, 140);
  }

  prevBtn.addEventListener('click', () => turn(-1));
  nextBtn.addEventListener('click', () => turn(1));

  bookEl.addEventListener('click', (e) => {
    const go = e.target.closest('[data-goto]');
    if (go) { goToPage(Number(go.dataset.goto)); return; }
    if (e.target.closest('a')) return;
    const r = bookEl.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    let forward;
    if (mode === 'double') forward = isRtl() ? x < 0.5 : x > 0.5;
    else forward = isRtl() ? x < 0.65 : x > 0.35;
    turn(forward ? 1 : -1);
  });

  let touchX = null;
  bookEl.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  bookEl.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) < 40) return;
    // swiping toward the spine side turns forward
    turn((dx < 0) !== isRtl() ? 1 : -1);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const forward = (e.key === 'ArrowRight') !== isRtl();
    turn(forward ? 1 : -1);
  });

  /* ---------------- loose beans on the table ---------------- */
  function drawDecor() {
    const spots = [
      [70, 120, 0.9, 20], [150, 470, 0.75, 120], [40, 300, 0.6, 75], [110, 560, 0.55, 200],
      [930, 90, 0.8, 160], [880, 520, 0.9, 40], [960, 330, 0.6, 250], [850, 260, 0.5, 95],
      [500, 575, 0.5, 15], [560, 30, 0.45, 300],
    ];
    const pick = [BEANS[1], BEANS[0], BEANS[9], BEANS[6]];
    decor.innerHTML = spots.slice(0, mode === 'double' ? spots.length : 5).map(([x, y, s, r], i) => SoodyBeans.bean(pick[i % pick.length].id, pick[i % pick.length].color, x, y, s, r)).join('');
  }

  /* ---------------- lifecycle ---------------- */
  document.addEventListener('soody:lang', build);

  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => (pickMode() !== mode ? build() : size()), 150);
  });

  // deep link: stories.html#habashi opens that bean's spread
  const linkedPage = () => {
    const i = BEANS.findIndex((b) => b.id === location.hash.slice(1));
    return i > -1 ? plateIndex(i) : null;
  };
  if (linkedPage() != null) curPage = linkedPage();
  window.addEventListener('hashchange', () => { if (linkedPage() != null) goToPage(linkedPage()); });

  SoodyBeans.ensureDefs();
  build();
})();
