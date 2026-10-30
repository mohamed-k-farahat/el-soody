/* =========================================================
   بن السعودي: realistic coffee beans drawn in SVG
   (radial shading + surface grain + crease + highlight + cast shadow)
   ========================================================= */
const SoodyBeans = (() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  let defs = null;

  // shared filters, created once per document
  function ensureDefs() {
    if (defs) return defs;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML = `
      <defs>
        <filter id="beanGrain" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n"/>
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.05" result="a"/>
          <feComposite in="SourceGraphic" in2="a" operator="in"/>
        </filter>
        <filter id="beanSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>
        <filter id="beanShadow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
        <radialGradient id="beanRim" cx=".5" cy=".5" r=".5">
          <stop offset=".62" stop-color="#000" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity=".5"/>
        </radialGradient>
      </defs>`;
    document.body.appendChild(svg);
    defs = svg.querySelector('defs');
    return defs;
  }

  // mix a hex color toward white (amt > 0) or black (amt < 0)
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const target = amt > 0 ? 255 : 0;
    const a = Math.abs(amt);
    const ch = (v) => Math.round(v + (target - v) * a);
    const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function ensureGradient(id, color) {
    const gid = 'bb' + id;
    if (document.getElementById(gid)) return gid;
    ensureDefs().insertAdjacentHTML('beforeend', `
      <radialGradient id="${gid}" cx=".36" cy=".3" r=".85">
        <stop offset="0" stop-color="${shade(color, 0.38)}"/>
        <stop offset=".45" stop-color="${color}"/>
        <stop offset="1" stop-color="${shade(color, -0.55)}"/>
      </radialGradient>`);
    return gid;
  }

  const CREASE = 'M2 -40 C -10 -22, 12 -8, -1 8 S -3 30, 1 40';

  // one bean, centered at (x, y)
  function bean(id, color, x, y, s = 1, rot = 0) {
    const gid = ensureGradient(id, color);
    const dark = shade(color, -0.62);
    const light = shade(color, 0.55);
    return `
      <g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
        <ellipse cx="6" cy="10" rx="31" ry="42" fill="#140a04" opacity=".5" filter="url(#beanShadow)"/>
        <ellipse rx="31" ry="43" fill="url(#${gid})"/>
        <ellipse rx="31" ry="43" fill="#1b0d05" opacity=".24" filter="url(#beanGrain)"/>
        <ellipse rx="31" ry="43" fill="url(#beanRim)"/>
        <path d="${CREASE}" fill="none" stroke="${dark}" stroke-width="6" stroke-linecap="round" filter="url(#beanSoft)" opacity=".9"/>
        <path d="${CREASE}" fill="none" stroke="${shade(color, -0.78)}" stroke-width="2" stroke-linecap="round"/>
        <path d="${CREASE}" transform="translate(3.4 0)" fill="none" stroke="${light}" stroke-width="1.3" stroke-linecap="round" opacity=".45"/>
        <ellipse cx="-13" cy="-18" rx="7" ry="17" transform="rotate(14 -13 -18)" fill="#fff" opacity=".26" filter="url(#beanSoft)"/>
      </g>`;
  }

  // a little flat lay of beans for one coffee (viewBox 0 0 300 260)
  function plateMarkup(b) {
    return `
      <svg class="beans-plate" viewBox="0 0 300 260" aria-hidden="true">
        ${bean(b.id, b.color, 232, 205, 0.62, 148)}
        ${bean(b.id, b.color, 62, 200, 0.58, 64)}
        ${bean(b.id, b.color, 108, 118, 1.35, -26)}
        ${bean(b.id, b.color, 200, 104, 1.15, 26)}
        ${bean(b.id, b.color, 158, 196, 1.0, 98)}
      </svg>`;
  }

  // draw a plate into an existing <svg>
  function plate(svgEl, b) {
    ensureDefs();
    svgEl.setAttribute('viewBox', '0 0 300 260');
    svgEl.innerHTML = plateMarkup(b).replace(/^\s*<svg[^>]*>|<\/svg>\s*$/g, '');
  }

  return { bean, plate, plateMarkup, ensureDefs };
})();
