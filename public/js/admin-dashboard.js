// Admin dashboard: filters apply as soon as they change, and charts show details on hover or focus.
(() => {
  const form = document.getElementById('dfilters');
  if (form) {
    const custom = form.querySelectorAll('.dcustom');
    form.addEventListener('change', (e) => {
      if (e.target.name === 'range') {
        const on = e.target.value === 'custom';
        custom.forEach((el) => { el.hidden = !on; });
        if (on) return; // wait for the dates
      }
      // empty filters stay out of the address
      for (const el of form.elements) if (el.name && !el.value) el.disabled = true;
      document.body.classList.add('is-loading');
      form.submit();
    });
    // on phones the filters start folded
    if (matchMedia('(max-width: 700px)').matches && !document.querySelector('.chip')) form.closest('details')?.removeAttribute('open');
  }

  // one tooltip for every chart; text goes in with textContent
  const tip = document.getElementById('tip');
  if (!tip) return;
  const [title, body] = tip.children;
  let current = null;
  function place(x, y) {
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = `${Math.min(Math.max(8, x - w / 2), innerWidth - w - 8)}px`;
    tip.style.top = `${y - h - 14 < 8 ? y + 18 : y - h - 14}px`;
  }
  function show(el, x, y) {
    if (current !== el) {
      current?.classList.remove('is-hover');
      current = el;
      el.classList.add('is-hover');
      title.textContent = el.dataset.tipTitle || '';
      body.textContent = el.dataset.tip || '';
      tip.hidden = false;
    }
    place(x, y);
  }
  function hide() { current?.classList.remove('is-hover'); current = null; tip.hidden = true; }
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest?.('[data-tip]');
    if (el) show(el, e.clientX, e.clientY); else if (current) hide();
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('[data-tip]');
    if (!el) return hide();
    const r = el.getBoundingClientRect();
    show(el, r.left + r.width / 2, r.top);
  });
  document.addEventListener('scroll', hide, { passive: true });
})();
