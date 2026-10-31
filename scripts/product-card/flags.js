// Small, accurate flag drawings (3:2) for the origin stamps on product images and book plates.
// Used by template.html and book-plate.html: FLAGS.brazil etc. are SVG strings.
(function () {
  // five pointed star centred at (cx, cy) with outer radius r
  const star = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.4 : r;
      pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
    }
    return pts.join(' ');
  };
  // Ashoka Chakra: navy wheel with 24 spokes
  const chakra = (cx, cy, r) => {
    let spokes = '';
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      spokes += `<line x1="${cx}" y1="${cy}" x2="${(cx + r * Math.cos(a)).toFixed(2)}" y2="${(cy + r * Math.sin(a)).toFixed(2)}"/>`;
    }
    return `<g stroke="#06038D" stroke-width=".45" fill="none"><circle cx="${cx}" cy="${cy}" r="${r}" stroke-width=".9"/>${spokes}</g><circle cx="${cx}" cy="${cy}" r=".9" fill="#06038D"/>`;
  };

  const svg = (body) => `<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">${body}</svg>`;

  window.FLAGS = {
    ethiopia: svg(`
      <rect width="60" height="13.34" fill="#078930"/><rect y="13.33" width="60" height="13.34" fill="#FCDD09"/><rect y="26.66" width="60" height="13.34" fill="#DA121A"/>
      <circle cx="30" cy="20" r="9.2" fill="#0F47AF"/>
      <polygon points="${star(30, 20.4, 7)}" fill="none" stroke="#FCDD09" stroke-width="1.1" stroke-linejoin="round"/>`),
    brazil: svg(`
      <rect width="60" height="40" fill="#009C3B"/>
      <polygon points="30,4.2 55.4,20 30,35.8 4.6,20" fill="#FFDF00"/>
      <circle cx="30" cy="20" r="8.8" fill="#002776"/>
      <path d="M21.4 18.4 Q30 15.6 38.7 21.2" stroke="#fff" stroke-width="1.6" fill="none"/>
      <g fill="#fff"><circle cx="26" cy="23" r=".45"/><circle cx="29" cy="25.2" r=".45"/><circle cx="32.5" cy="24" r=".45"/><circle cx="34.6" cy="26" r=".4"/><circle cx="28" cy="27.4" r=".4"/><circle cx="31" cy="21.6" r=".35"/></g>`),
    colombia: svg(`
      <rect width="60" height="20" fill="#FCD116"/><rect y="20" width="60" height="10" fill="#003893"/><rect y="30" width="60" height="10" fill="#CE1126"/>`),
    india: svg(`
      <rect width="60" height="13.34" fill="#FF9933"/><rect y="13.33" width="60" height="13.34" fill="#FFFFFF"/><rect y="26.66" width="60" height="13.34" fill="#138808"/>
      ${chakra(30, 20, 5.4)}`),
    italy: svg(`
      <rect width="20" height="40" fill="#009246"/><rect x="20" width="20" height="40" fill="#F1F2F1"/><rect x="40" width="20" height="40" fill="#CE2B37"/>`),
  };
})();
