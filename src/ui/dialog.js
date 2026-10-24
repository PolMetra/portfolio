import { Audio } from '../audio.js';

// Okno dialogowe: maszyna pisząca z blipami, przewijanie kliknięciem/spacją,
// wybory jako lista "> OPCJA" sterowana myszą lub strzałkami.

export class Dialog {
  static CANCEL = '__cancel';

  constructor(root, wizard) {
    this.root = root;
    this.wizard = wizard;
    this.textEl = root.querySelector('.dlg-text');
    this.nextEl = root.querySelector('.dlg-next');
    this.choicesEl = root.querySelector('.dlg-choices');
    this.extraEl = root.querySelector('.dlg-extra');
    this.idxEl = root.querySelector('.dlg-idx');
    this.count = 0;
    this.full = '';
    this.shown = 0;
    this.typing = false;
    this.waiting = null;   // resolve dla bieżącej linii
    this.choiceSel = 0;
    this.choices = null;
    this.acc = 0;
    this.speed = 38;       // znaków na sekundę

    root.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (!e.target.closest('.dlg-choice')) this.advance();
    });
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      if (this.choices && !this.typing) {
        if (e.key === 'ArrowDown' || e.key === 's') { this.select(this.choiceSel + 1); e.preventDefault(); }
        if (e.key === 'ArrowUp' || e.key === 'w') { this.select(this.choiceSel - 1); e.preventDefault(); }
        if (e.key === 'Enter' || e.key === ' ') { this.pick(this.choiceSel); e.preventDefault(); }
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') { this.advance(); e.preventDefault(); }
    });
  }

  isOpen() { return this.root.classList.contains('open'); }
  open() { this.root.classList.add('open'); }
  close() { this.root.classList.remove('open'); this.wizard.talking = false; }

  // jedna linia: { text, mood, choices:[{label, value}], hold:true (bez ▼, czeka na release()) }
  line(spec) {
    if (typeof spec === 'string') spec = { text: spec };
    this.open();
    this.full = spec.text;
    this.shown = 0;
    this.acc = 0;
    this.typing = true;
    this.hold = !!spec.hold;
    this.pendingChoices = spec.choices || null;
    this.choices = null;
    this.choicesEl.innerHTML = '';
    this.nextEl.style.visibility = 'hidden';
    this.textEl.textContent = '';
    this.count++;
    if (this.idxEl) this.idxEl.textContent = String(this.count).padStart(3, '0');
    this.wizard.set(spec.mood || 'idle');
    this.wizard.talking = true;
    return new Promise((res) => { this.waiting = res; });
  }

  async say(lines) {
    const gen = this.gen = (this.gen || 0);
    let result;
    for (const l of lines) {
      result = await this.line(l);
      if (gen !== this.gen) return Dialog.CANCEL;
    }
    return result;
  }

  // przerywa bieżącą rozmowę (np. "pomiń intro")
  cancel() {
    this.gen = (this.gen || 0) + 1;
    this.choices = null;
    this.choicesEl.innerHTML = '';
    this.release(Dialog.CANCEL);
  }

  release(v) { if (this.waiting) { const r = this.waiting; this.waiting = null; r(v); } }

  finishTyping() {
    this.shown = this.full.length;
    this.textEl.textContent = this.full;
    this.typing = false;
    this.wizard.talking = false;
    if (this.pendingChoices) this.showChoices(this.pendingChoices);
    else if (!this.hold) this.nextEl.style.visibility = 'visible';
  }

  advance() {
    if (!this.waiting) return;
    if (this.typing) { this.finishTyping(); return; }
    if (this.choices || this.hold) return;
    Audio.blip(1.4);
    this.release();
  }

  showChoices(list) {
    this.choices = list;
    this.choicesEl.innerHTML = '';
    list.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'dlg-choice';
      b.textContent = c.label;
      b.addEventListener('pointerenter', () => this.select(i));
      b.addEventListener('click', (e) => { e.stopPropagation(); this.pick(i); });
      this.choicesEl.appendChild(b);
    });
    this.select(0);
  }

  select(i) {
    if (!this.choices) return;
    const n = this.choices.length;
    this.choiceSel = (i + n) % n;
    [...this.choicesEl.children].forEach((b, k) => b.classList.toggle('sel', k === this.choiceSel));
  }

  pick(i) {
    if (!this.choices) return;
    const c = this.choices[i];
    Audio.blip(1.8);
    this.choices = null;
    this.choicesEl.innerHTML = '';
    this.release(c.value);
  }

  setExtra(html) { this.extraEl.innerHTML = html || ''; }

  update(dt) {
    if (!this.typing) return;
    this.acc += dt * this.speed;
    let added = false;
    while (this.acc >= 1 && this.shown < this.full.length) {
      this.acc -= 1;
      const ch = this.full[this.shown++];
      if (ch !== ' ' && !added && this.shown % 2 === 0) { Audio.blip(); added = true; }
      if (',.!?…'.includes(ch)) { this.acc -= 4; } // pauza na interpunkcji
    }
    this.textEl.textContent = this.full.slice(0, this.shown);
    if (this.shown >= this.full.length) this.finishTyping();
  }
}
