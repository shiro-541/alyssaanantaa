(() => {
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const here = location.pathname.split('/').pop() || 'index.html';
/* penyimpanan lintas halaman lewat window.name (tetap ada walau localStorage tidak dibagi antar file) */
const wn = {
  get(k) { const m = (window.name || '').match(new RegExp('(?:^|;)' + k + ':([^;]*)')); return m ? decodeURIComponent(m[1]) : null; },
  set(k, v) { const rest = (window.name || '').split(';').filter(x => x && !x.startsWith(k + ':')); if (v != null) rest.push(k + ':' + encodeURIComponent(v)); window.name = rest.join(';'); }
};
const label = wn.get('ptl');

/* ===== tema terang / gelap ===== */
const root0 = document.documentElement;
let tema = (location.hash.match(/tema-(dark|light)/) || [])[1] || wn.get('tema'); if (!tema) { try { tema = localStorage.getItem('tema'); } catch (_) {} } if (tema !== 'dark') tema = 'light';
const pasangTema = t => {
  root0.dataset.theme = t;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#0e0c13' : '#f3eee4');
  wn.set('tema', t);
  /* bawa tema lewat alamat (#tema-...) supaya selalu ikut ke halaman lain, apa pun browsernya */
  document.querySelectorAll('a[href]').forEach(a => {
    const h = a.getAttribute('href'), base = h.split('#')[0];
    if (/^(https?:|mailto:|tel:|#)/.test(h) || !base.endsWith('.html')) return;
    a.setAttribute('href', base + '#tema-' + t);
  });
  try { history.replaceState(null, '', location.pathname + location.search + '#tema-' + t); } catch (_) {}
  try { localStorage.setItem('tema', t); } catch (_) {}
};
pasangTema(tema);
const navb = document.getElementById('navbar');
if (navb) {
  const tb = document.createElement('button'); tb.className = 'theme-toggle'; tb.setAttribute('aria-label', 'Ganti tema terang/gelap');
  tb.innerHTML = '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg><svg class="moon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';
  navb.insertBefore(tb, navb.querySelector('.menu-toggle'));
  tb.addEventListener('click', () => {
    const next = root0.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduce) return pasangTema(next);
    const r = tb.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => pasangTema(next));
    vt.ready.then(() => root0.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
      { duration: 800, easing: 'cubic-bezier(.76,0,.24,1)', pseudoElement: '::view-transition-new(root)' }));
  });
}

/* ===== preloader: kalau datang dari transisi, tampilkan nama halaman & buka cepat ===== */
const pre = document.getElementById('preloader');
if (pre && label) {
  const t = pre.querySelector('.preloader-text'); if (t) t.textContent = label;
  wn.set('ptl', null);
  const open = () => setTimeout(() => pre.classList.add('hidden'), 450);
  document.readyState === 'complete' ? open() : addEventListener('load', open);
}
const introDelay = label ? 1000 : 1500;

/* ===== aurora ===== */
if (!document.querySelector('.aurora')) {
  const a = document.createElement('div'); a.className = 'aurora'; a.setAttribute('aria-hidden', 'true');
  a.innerHTML = '<span></span><span></span><span></span>'; document.body.prepend(a);
}

/* ===== nav ===== */
const nm = document.getElementById('navMenu');
if (nm) {
  new MutationObserver(() => { document.body.style.overflow = nm.classList.contains('active') ? 'hidden' : ''; })
    .observe(nm, { attributes: true, attributeFilter: ['class'] });
  $$('li', nm).forEach((li, i) => li.firstElementChild.style.setProperty('--n', i));
  addEventListener('resize', () => { if (innerWidth > 1200) { nm.classList.remove('active'); document.getElementById('menuToggle')?.classList.remove('active'); } });
}
$$('#navMenu a').forEach(a => a.classList.toggle('active', a.getAttribute('href').split('#')[0] === here));

/* ===== split huruf ===== */
$$('.page-hero h1,.fav-hero h1,.bio-hero h1,.hero h1 .name,.hero h1 .surname').forEach(el => {
  const t = el.textContent.trim(); if (!t) return;
  el.textContent = ''; el.setAttribute('aria-label', t);
  [...t].forEach((c, i) => {
    const w = document.createElement('span'); w.className = 'clip';
    const s = document.createElement('span'); s.className = c === ' ' ? 'sp' : 'ch';
    s.style.setProperty('--i', i); s.textContent = c === ' ' ? '' : c;
    w.appendChild(s); el.appendChild(w);
  });
  setTimeout(() => el.classList.add('ch-on'), introDelay);
});

/* ===== scramble subtitle ===== */
const glyphs = '!<>-_/[]{}=+*^?#';
$$('.page-subtitle,.fav-subtitle,.bio-tagline,.hero-subtitle').forEach(el => {
  const end = el.textContent; let f = 0; if (reduce) return;
  el.style.minWidth = el.offsetWidth + 'px';
  setTimeout(() => {
    const id = setInterval(() => {
      el.textContent = [...end].map((c, i) => c === ' ' || i < f / 2 ? c : glyphs[Math.random() * glyphs.length | 0]).join('');
      if (++f > end.length * 2) { el.textContent = end; clearInterval(id); }
    }, 35);
  }, introDelay + 200);
});

/* ===== ticker ===== */
const first = document.querySelector('.hero,.page-hero,.fav-hero,.bio-hero');
if (first && !document.querySelector('.ticker')) {
  const row = ['ALYSSA ANANTA', 'CONTENT CREATOR', 'STREAMER', 'SINGER', 'DRIFTER'].map(w => `<span>${w}</span>`).join('');
  const t = document.createElement('div'); t.className = 'ticker';
  t.innerHTML = `<div class="ticker-in">${row}${row}${row}${row}</div>`; first.after(t);
}

/* ===== stiker dekorasi + lencana berputar ===== */
const star = c => `<svg width="86" height="86" viewBox="0 0 100 100"><path d="M50 3l11 27 29-5-19 22 19 22-29-5-11 27-11-27-29 5 19-22L10 25l29 5z" fill="${c}" stroke="#15131a" stroke-width="3" stroke-linejoin="round"/></svg>`;
const ring = c => `<svg width="70" height="70" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="#15131a" stroke-width="3"/><circle cx="50" cy="50" r="24" fill="${c}" stroke="#15131a" stroke-width="3"/></svg>`;
const plus = c => `<svg width="56" height="56" viewBox="0 0 100 100"><path d="M38 6h24v32h32v24H62v32H38V62H6V38h32z" fill="${c}" stroke="#15131a" stroke-width="3" stroke-linejoin="round"/></svg>`;
const addSticker = (host, html, pos, cls, depth) => {
  const d = document.createElement('div'); d.className = 'sticker ' + cls; d.dataset.d = depth;
  d.style.cssText = pos; d.innerHTML = html; host.appendChild(d);
};
const hero = document.querySelector('.hero');
if (hero) {
  addSticker(hero, star('#ffd84a'), 'top:15%;right:44%', 's1', 30);
  addSticker(hero, ring('#9fbaff'), 'bottom:12%;right:6%', 's2', -24);
  addSticker(hero, plus('#ff6a4d'), 'top:20%;right:5%', 's3', 40);
  const side = document.querySelector('.hero-photo-side');
  if (side) {
    side.insertAdjacentHTML('beforeend', `<svg class="badge-spin" viewBox="0 0 120 120"><defs><path id="bc" d="M60 60m-42 0a42 42 0 1 1 84 0a42 42 0 1 1-84 0"/></defs><circle cx="60" cy="60" r="58" fill="#ffd84a" stroke="#15131a" stroke-width="3"/><text font-family="DM Mono,monospace" font-size="10" font-weight="500" fill="#15131a"><textPath href="#bc" textLength="258" lengthAdjust="spacing">ALYSSA ANANTA • CREATOR • STREAMER • </textPath></text><path d="M60 40l5 15 15 5-15 5-5 15-5-15-15-5 15-5z" fill="#ff6a4d" stroke="#15131a" stroke-width="2.5" stroke-linejoin="round"/></svg>`);
  }
}
$$('.page-hero,.fav-hero,.bio-hero').forEach(h => {
  addSticker(h, star('#ff6a4d'), 'top:30%;left:7%', 's1', 26);
  addSticker(h, plus('#7be3b6'), 'top:46%;right:8%', 's3', -34);
});
if (fine) addEventListener('pointermove', e => {
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  $$('.sticker').forEach(s => { const d = +s.dataset.d; s.style.setProperty('--px', x * d + 'px'); s.style.setProperty('--py', y * d + 'px'); });
});

/* ===== reveal ===== */
const cardSel = '.quick-link,.pencapaian-card,.lagu-card,.timeline-content,.fav-item,.idola-card,.dream-card,.hobi-card,.fakta-card,.stat-box';
const targets = cardSel + ',.section-title,.bio-simple-card,.bio-quote,.fav-category-block,.pencapaian-group-title,.platform-section,.timeline-photo,.timeline-header,.hero-stats,.hero-desc,.hero-cta,.group-title,.quiz-box,.quick-nav a';
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target; el.classList.add('in'); io.unobserve(el);
  $$('[data-count]', el).concat(el.dataset.count ? [el] : []).forEach(count);
}), { threshold: .12 });
$$(targets).forEach(el => {
  el.classList.add('rv');
  const p = el.parentElement;
  el.style.setProperty('--d', ([...p.children].indexOf(el) % 6) * .08 + 's');
  const ti = el.closest('.timeline-item');
  if (ti && !el.matches('.timeline-header')) el.classList.add([...ti.parentElement.children].indexOf(ti) % 2 ? 'r' : 'l');
  io.observe(el);
});

/* ===== counter ===== */
function count(card) {
  $$('.num,.pencapaian-number', card).concat(card.matches('.num,.pencapaian-number') ? [card] : []).forEach(n => {
    if (n.dataset.done) return; n.dataset.done = 1;
    const m = n.textContent.trim().match(/^([\d.,]+)(.*)$/); if (!m) return;
    const target = parseFloat(m[1].replace(',', '.')), dec = (m[1].split(/[.,]/)[1] || '').length, t0 = performance.now();
    (function step(t) {
      const k = Math.min((t - t0) / 1400, 1);
      n.textContent = (target * (1 - Math.pow(1 - k, 4))).toFixed(dec) + m[2];
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  });
}
$$('.hero-stats,.pencapaian-card,.stat-box').forEach(c => { c.dataset.count = 1; });

/* ===== spotlight ===== */
addEventListener('pointermove', e => {
  const c = e.target.closest ? e.target.closest(cardSel) : null; if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
});

/* ===== ripple tombol ===== */
document.addEventListener('click', e => {
  const b = e.target.closest('.btn,.platform-cta,.lagu-btn'); if (!b) return;
  const r = b.getBoundingClientRect(), d = document.createElement('i'); d.className = 'rip';
  d.style.left = (e.clientX - r.left) + 'px'; d.style.top = (e.clientY - r.top) + 'px';
  b.appendChild(d); setTimeout(() => d.remove(), 700);
});

/* ===== konfeti bentuk ===== */
const cols = ['#ffd84a', '#ff6a4d', '#3b4cff', '#7be3b6', '#ffb0cb'];
document.addEventListener('click', e => {
  if (reduce || e.target.closest('input,textarea')) return;
  for (let i = 0; i < 12; i++) {
    const d = document.createElement('i'); d.className = 'burst';
    const a = Math.random() * Math.PI * 2, dist = 50 + Math.random() * 110, shape = i % 3;
    d.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;background:${cols[i % 5]};border-radius:${shape === 0 ? '50%' : shape === 1 ? '2px' : '50% 0'};transition:transform .9s cubic-bezier(.2,.8,.2,1),opacity .9s`;
    document.body.appendChild(d);
    requestAnimationFrame(() => {
      d.style.transform = `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist + 40}px) rotate(${Math.random() * 540}deg) scale(.4)`;
      d.style.opacity = '0';
    });
    setTimeout(() => d.remove(), 950);
  }
});

/* ===== transisi halaman: bilah naik berurutan + nama halaman ===== */
if (!document.querySelector('.curtain')) {
  const cu = document.createElement('div'); cu.className = 'curtain';
  cu.innerHTML = Array.from({ length: 6 }, (_, i) => `<div class="pt-bar" style="--i:${i}"></div>`).join('') + '<div class="pt-label"></div>';
  document.body.appendChild(cu);
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const h = a.getAttribute('href'), base = h ? h.split('#')[0] : '';
    if (!h || h[0] === '#' || !base.endsWith('.html') || base === here) return;
    e.preventDefault();
    const name = (a.querySelector('.quick-link-title')?.textContent || a.textContent).replace(/[→↗]/g, '').trim().split('\n')[0].trim() || 'Alyssa';
    cu.querySelector('.pt-label').textContent = name;
    wn.set('ptl', name);
    document.getElementById('navMenu')?.classList.remove('active');
    cu.classList.add('go'); setTimeout(() => location.href = h, 900);
  });
  addEventListener('pageshow', ev => { if (ev.persisted) cu.classList.remove('go'); });
}

/* ===== ke atas ===== */
const up = document.createElement('button'); up.className = 'to-top'; up.setAttribute('aria-label', 'Ke atas'); up.textContent = '↑';
up.onclick = () => scrollTo({ top: 0, behavior: 'smooth' }); document.body.appendChild(up);

/* ===== loop frame ===== */
let lastY = scrollY, sk = 0;
const tl = document.querySelector('.timeline'), heroH1 = document.querySelector('.page-hero h1,.fav-hero h1,.bio-hero h1');
(function loop() {
  const v = scrollY - lastY; lastY = scrollY;
  sk += (Math.max(-8, Math.min(8, v * .25)) - sk) * .1;
  $$('.ticker').forEach(t => t.style.setProperty('--sk', sk + 'deg'));
  up.classList.toggle('show', scrollY > 600);
  if (heroH1 && scrollY < 700) { heroH1.style.transform = `translateY(${scrollY * .25}px)`; heroH1.style.opacity = Math.max(0, 1 - scrollY / 600); }
  if (tl) { const r = tl.getBoundingClientRect(); tl.style.setProperty('--tl', Math.max(0, Math.min(1, (innerHeight * .6 - r.top) / r.height))); }
  requestAnimationFrame(loop);
})();

/* ===== lightbox foto karier ===== */
if (document.querySelector('.timeline-photo') && !document.getElementById('lightbox')) {
  const box = document.createElement('div'); box.className = 'lightbox'; box.id = 'lightbox';
  box.innerHTML = '<button class="lightbox-close" aria-label="Tutup">✕</button><img src="" alt="" id="lightboxImg">';
  document.body.appendChild(box);
  const lbi = document.getElementById('lightboxImg'), imgs = $$('.timeline-photo img');
  const close = () => { box.classList.remove('active'); document.body.style.overflow = ''; };
  box.addEventListener('click', e => { if (e.target === box || e.target.closest('.lightbox-close')) close(); });
  addEventListener('keydown', e => {
    if (!box.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const i = imgs.findIndex(x => x.src === lbi.src); if (i < 0) return;
      lbi.src = imgs[(i + (e.key === 'ArrowRight' ? 1 : -1) + imgs.length) % imgs.length].src;
    }
  });
  $$('.timeline-photo').forEach(p => {
    p.tabIndex = 0; p.setAttribute('role', 'button');
    const open = () => { const im = p.querySelector('img'); lbi.src = im.src; lbi.alt = im.alt; box.classList.add('active'); document.body.style.overflow = 'hidden'; };
    p.addEventListener('click', open); p.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
  });
}

/* ===== kursor baru: titik + cincin halus, selalu di atas semua lapisan ===== */
if (fine) {
  const root = document.documentElement;
  const dot = document.createElement('div'); dot.className = 'cur-dot';
  const ringEl = document.createElement('div'); ringEl.className = 'cur-ring'; ringEl.innerHTML = '<b></b>';
  document.body.append(ringEl, dot);
  const txt = ringEl.firstChild;
  let mx = -100, my = -100, rx = -100, ry = -100, seen = false;
  const kinds = [
    ['.timeline-photo,.photo', 'LIHAT'], ['.quick-link', 'BUKA'], ['.lagu-btn,.platform-cta', 'PUTAR'],
  ];
  const setState = t => {
    ringEl.classList.remove('link', 'label'); txt.textContent = '';
    if (!t || !t.closest) return;
    const bk = t.closest('.book');
    if (bk && !t.closest('.photo')) {
      const r = bk.getBoundingClientRect(), right = mx > r.left + r.width / 2;
      if (!document.getElementById(right ? 'next' : 'prev')?.disabled) { txt.textContent = right ? 'NEXT →' : '← PREV'; ringEl.classList.add('label'); }
      return;
    }
    for (const [sel, word] of kinds) if (t.closest(sel)) { txt.textContent = word; ringEl.classList.add('label'); return; }
    if (t.closest('a,button,.flip,.quiz-opt,[role=button],.cover-btn')) ringEl.classList.add('link');
  };
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; rx = mx; ry = my; root.classList.add('has-cur'); }
    root.classList.remove('cur-out');
    setState(e.target);
  }, { passive: true });
  document.addEventListener('mouseleave', () => root.classList.add('cur-out'));
  document.addEventListener('mouseenter', () => root.classList.remove('cur-out'));
  addEventListener('blur', () => root.classList.add('cur-out'));
  addEventListener('pointerdown', () => ringEl.classList.add('press'));
  addEventListener('pointerup', () => ringEl.classList.remove('press'));
  (function follow() {
    rx += (mx - rx) * .18; ry += (my - ry) * .18;
    dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    ringEl.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    requestAnimationFrame(follow);
  })();
}
})();
