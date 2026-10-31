/* =========================================================
   بن السعودي: branches map (Leaflet + OpenStreetMap, tinted to the site colors in CSS)
   ========================================================= */
(function () {
  'use strict';

  const el = document.getElementById('branchMap');
  const data = document.getElementById('branchPins');
  if (!el || !data || !window.L) return;

  const pins = JSON.parse(data.textContent);
  const t = (k) => window.SOODY.t(k);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const map = L.map(el, { scrollWheelZoom: false, zoomControl: false, attributionControl: true });
  // zoom buttons at the bottom, out of the way of the pop up cards that open above the pins
  L.control.zoom({ position: 'bottomleft' }).addTo(map);
  map.attributionControl.setPrefix(false);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);

  const markers = {};
  const cards = {};
  document.querySelectorAll('.branch[data-branch]').forEach((c) => { cards[c.dataset.branch] = c; });

  function select(id, { fly = true, open = true } = {}) {
    Object.entries(cards).forEach(([k, c]) => c.classList.toggle('is-active', k === String(id)));
    Object.entries(markers).forEach(([k, m]) => m.getElement()?.classList.toggle('is-active', k === String(id)));
    const m = markers[id];
    if (!m) return;
    // put the pin below the middle so its card (which opens above it) fits inside the map
    if (fly) {
      const zoom = 16;
      const room = Math.min(90, el.clientHeight * 0.25);
      map.flyTo(map.unproject(map.project(m.getLatLng(), zoom).subtract([0, room]), zoom), zoom, { duration: 0.6 });
    }
    if (!open) return;
    if (!fly) { m.openPopup(); return; }
    let shown = false;
    const show = () => { if (!shown) { shown = true; m.openPopup(); } };
    map.once('moveend', show);
    setTimeout(show, 900);   // in case the map was already there and did not move
  }

  pins.forEach((p) => {
    const icon = L.divIcon({
      className: 'pin',
      html: `<span class="pin__dot"><b>${p.n}</b></span>`,
      iconSize: [38, 48],
      iconAnchor: [19, 46],
      popupAnchor: [0, -42],
    });
    const m = L.marker([p.lat, p.lng], { icon, title: p.name, riseOnHover: true }).addTo(map);
    m.bindPopup(`<b>${esc(p.name)}</b><span>${esc(p.address)}</span><a href="${esc(p.dir)}" target="_blank" rel="noopener">${esc(t('contact.directions'))}</a>`, {
      closeButton: false,
      maxWidth: 240,
      autoPanPaddingTopLeft: [16, 16],
      autoPanPaddingBottomRight: [16, 70],   // clear of the zoom buttons and the map credit
    });
    m.on('click', () => select(p.id, { fly: false, open: false }));
    markers[p.id] = m;
  });

  const all = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
  const fitAll = () => (pins.length > 1 ? map.fitBounds(all, { padding: [50, 50], maxZoom: 15 }) : map.setView(all.getCenter(), 16));
  fitAll();

  Object.entries(cards).forEach(([id, c]) => {
    if (!markers[id]) return;
    const go = (e) => {
      if (e.target.closest('a')) return;   // the buttons inside the card keep their own job
      select(id);
      if (window.matchMedia('(max-width: 860px)').matches) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    c.addEventListener('click', go);
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } });
  });

  // the map sits in a grid that can change size (fonts loading, phone rotating)
  new ResizeObserver(() => map.invalidateSize()).observe(el);
})();
