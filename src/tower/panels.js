// Surowe panele tekstowe po prawej stronie: projekt, umiejętności, o mnie, kontakt.
// Wszystko z cienkich linii i etykiet — bez okien.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export class Panel {
  constructor(el) {
    this.el = el;
    this.cap = el.querySelector('.pn-cap');
    this.body = el.querySelector('.pn-body');
    this.onClose = null;
    el.querySelector('.pn-close').addEventListener('click', (e) => { e.stopPropagation(); this.close(); });
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
  }
  open(cap, html) {
    this.cap.textContent = cap;
    this.body.innerHTML = html;
    this.el.classList.add('open');
    this.body.scrollTop = 0;
  }
  close() {
    if (!this.el.classList.contains('open')) return;
    this.el.classList.remove('open');
    const cb = this.onClose; this.onClose = null;
    if (cb) cb();
  }
  get isOpen() { return this.el.classList.contains('open'); }
}

const field = (label, value) => `<div class="pf"><span class="pf-l">${label}</span><span class="pf-v">${value}</span></div>`;

export function projectHTML(p, i, n) {
  const imgs = p.images && p.images.length
    ? p.images.map((src, k) => `<figure class="plate"><img src="${esc(src)}" alt="${esc(p.title)} — rycina ${k + 1}" loading="lazy"><figcaption>RYCINA ${ROMAN[k] || k + 1}</figcaption></figure>`).join('')
    : [1, 2, 3].map((k) => `<figure class="plate empty"><div>tu wstaw render<br><small>assets/projects/…</small></div><figcaption>RYCINA ${ROMAN[k - 1]}</figcaption></figure>`).join('');
  return `
    <div class="p-num">OPUS ${ROMAN[i] || i + 1} / ${ROMAN[n - 1] || n}</div>
    <h2 class="p-title">${esc(p.title)}</h2>
    ${field('ANNUS', p.year)}
    ${field('GENUS', esc(p.genre))}
    ${field('INSTRUMENTA', p.tools.map(esc).join(' · '))}
    <p class="p-desc">${esc(p.desc)}</p>
    <div class="transmute">
      <div class="tm-head"><span>TRANSMUTATIO</span><span class="tm-hint">przesuń · klawisze 1 2 3</span></div>
      <input type="range" min="0" max="2" step="1" value="0" class="tm-range" aria-label="Transmutacja: drut, glina, dzieło">
      <div class="tm-stops"><span data-s="0">I. FILUM<small>drut</small></span><span data-s="1">II. LUTUM<small>glina</small></span><span data-s="2">III. OPUS<small>dzieło</small></span></div>
    </div>
    <div class="plates">${imgs}</div>
    <div class="p-nav">
      <button data-nav="-1">‹ POPRZEDNIE</button>
      ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">ARTSTATION ↗</a>` : '<span class="muted">link do ArtStation w config.js</span>'}
      <button data-nav="1">NASTĘPNE ›</button>
    </div>`;
}

export function skillsHTML(skills, caught) {
  return `
    <p class="p-desc">Zwoje schwytane: ${caught.size} / ${skills.length}</p>
    <div class="skills">${skills.map((s, i) => {
      const got = caught.has(i);
      const bar = '/'.repeat(s.level * 4) + '·'.repeat((5 - s.level) * 4);
      return `<div class="sk ${got ? 'got' : ''}">
        <div class="sk-top"><span class="sk-n">${got ? esc(s.name) : '⠿⠿⠿⠿⠿⠿⠿⠿'}</span><span class="sk-b">${got ? `[${bar}]` : '[····················]'}</span></div>
        <div class="sk-note">${got ? esc(s.note) : 'zapieczętowane'}</div>
      </div>`;
    }).join('')}</div>`;
}

export function aboutHTML(about, revealed) {
  return `<div class="about">${about.map((a, i) => revealed.has(i)
    ? `<div class="ab got"><div class="pf"><span class="pf-l">${esc(a.item)}</span><span class="pf-v">${esc(a.title)}</span></div><p>${esc(a.text)}</p></div>`
    : `<div class="ab"><div class="pf"><span class="pf-l">${esc(a.item)}</span><span class="pf-v">⠿⠿⠿⠿⠿⠿</span></div><p class="muted">Unieś ten przedmiot z biurka, by odczytać fragment.</p></div>`).join('')}</div>`;
}

export function contactHTML(c) {
  return `
    <p class="p-desc">Kruk czeka na list. Napisz — odpowiedź przyleci.</p>
    ${field('EPISTULA', `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`)}
    ${c.links.map((l) => field(esc(l.label).toUpperCase(), `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.url.replace(/^https?:\/\//, ''))} ↗</a>`)).join('')}
    <form class="letter">
      <label>OD KOGO<input name="from" autocomplete="name" placeholder="imię / studio"></label>
      <label>TREŚĆ LISTU<textarea name="body" rows="5" placeholder="W czym mogę pomóc?"></textarea></label>
      <button type="submit">[ WYŚLIJ KRUKA ]</button>
      <small class="muted">otworzy Twój program pocztowy</small>
    </form>`;
}
