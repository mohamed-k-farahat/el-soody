/* =========================================================
   بن السعودي: realistic coffee beans drawn in SVG
   Shading, speckle, crease, shine and cast shadow are all plain
   gradients and patterns (no SVG filters), so phones stay smooth.
   ========================================================= */
const SoodyBeans = (() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  let defs = null;

  // a few fixed specks for the bean surface texture
  const SPECKS = [[2, 3, 0.45], [11, 1.5, 0.3], [6, 8, 0.55], [17, 6, 0.3], [3, 15, 0.4], [13, 13, 0.5], [21, 11, 0.25], [8, 19, 0.3], [19, 18, 0.4], [1, 9, 0.25]];

  // shared paint servers, created once per document
  function ensureDefs() {
    if (defs) return defs;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML = `
      <defs>
        <radialGradient id="beanShadowG" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#140a04" stop-opacity=".55"/>
          <stop offset=".6" stop-color="#140a04" stop-opacity=".25"/>
          <stop offset="1" stop-color="#140a04" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="beanRim" cx=".5" cy=".5" r=".5">
          <stop offset=".62" stop-color="#000" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity=".5"/>
        </radialGradient>
        <radialGradient id="beanShine" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#fff" stop-opacity=".42"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
        <pattern id="beanSpeckle" width="23" height="21" patternUnits="userSpaceOnUse" patternTransform="rotate(23)">
          ${SPECKS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1b0d05" opacity=".16"/>`).join('')}
        </pattern>
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
    return `
      <g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
        <ellipse cx="7" cy="12" rx="38" ry="50" fill="url(#beanShadowG)"/>
        <ellipse rx="31" ry="43" fill="url(#${gid})"/>
        <ellipse rx="31" ry="43" fill="url(#beanSpeckle)"/>
        <ellipse rx="31" ry="43" fill="url(#beanRim)"/>
        <path d="${CREASE}" fill="none" stroke="${shade(color, -0.6)}" stroke-width="6.5" stroke-linecap="round" opacity=".45"/>
        <path d="${CREASE}" fill="none" stroke="${shade(color, -0.78)}" stroke-width="2" stroke-linecap="round"/>
        <path d="${CREASE}" transform="translate(3.4 0)" fill="none" stroke="${shade(color, 0.55)}" stroke-width="1.3" stroke-linecap="round" opacity=".45"/>
        <ellipse cx="-13" cy="-18" rx="9" ry="20" transform="rotate(14 -13 -18)" fill="url(#beanShine)"/>
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
