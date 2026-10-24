import * as THREE from 'three';
import { buildRoom } from './room.js';
import { ProjectModel } from './projects.js';
import { Panel, projectHTML, skillsHTML, aboutHTML, contactHTML } from './panels.js';
import { MultiplyGame } from './multiply.js';
import { Raven } from './raven.js';
import { Dialog } from '../ui/dialog.js';

const CANCEL = Dialog.CANCEL;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
const PROGRESS = 'arkanus.tower';

// ============================================================
//  WNĘTRZE WIEŻY — księga czarów i rozdziały II–VI
// ============================================================
export class Tower {
  constructor({ renderer, post, dialog, wizard, hud, audio, config, onExit }) {
    Object.assign(this, { renderer, post, dialog, wizard, hud, audio, config, onExit });
    this.active = false;
    this.mobile = matchMedia('(max-width: 760px)').matches;
    addEventListener('resize', () => { this.mobile = matchMedia('(max-width: 760px)').matches; });

    this.room = buildRoom();
    this.scene = this.room.scene;
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.3, 200);
    addEventListener('resize', () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); });

    // stacje kamery
    this.stations = {
      door:   { pos: V(0, 10, 26), look: V(0, 9, 0) },
      hub:    { pos: V(11, 12.5, 21), look: V(-2, 9.5, 0) },
      ball:   { pos: V(0, 10.4, 8.6), look: V(0, 9.4, 0) },
      view:   { pos: V(2.6, 14.4, 10.5), look: V(2.6, 13.9, 0) },
      desk:   { pos: V(-6.5, 10.5, 3.5), look: V(-15, 5.2, -6) },
      window: { pos: V(0, 14, -8), look: V(0, 15, -25) },
      // ciemna ściana komnaty — tło, na którym kruk ASCII jest dobrze widoczny
      wall:   { pos: V(-2, 13, 6), look: V(16, 14, -14) },
    };
    this.camPos = this.stations.door.pos.clone();
    this.camLook = this.stations.door.look.clone();
    this.goal = this.stations.door;

    // projekty w kuli
    this.models = config.projects.map((p) => new ProjectModel(p));
    this.holder = new THREE.Group();
    this.scene.add(this.holder);
    this.models.forEach((m) => { m.root.visible = false; this.holder.add(m.root); });
    this.current = 0;
    this.viewing = false;
    this.holderGoal = { y: this.room.BALL_Y, s: 1.45 };
    this.trueGoal = 0;
    this.showProject(0);

    // DOM
    this.panel = new Panel(document.getElementById('panel'));
    this.book = document.getElementById('book');
    this.ballnav = document.getElementById('ballnav');
    this.tip = document.getElementById('tip');
    this.layer = document.getElementById('game');
    this.raven = new Raven(document.getElementById('raven'), renderer);
    // kruk lata po wolnej części ekranu: między czarodziejem a panelem (na telefonie nad panelem)
    this.raven.bounds = () => {
      if (this.mobile) return { left: 0, right: innerWidth, top: 150, bottom: innerHeight * 0.5 };
      const wiz = document.getElementById('wizard').getBoundingClientRect();
      return { left: wiz.right, right: this.panel.el.getBoundingClientRect().left, top: 60, bottom: innerHeight * 0.62 };
    };
    this.game = new MultiplyGame(this.layer, {
      count: config.skills.length,
      onCatch: (i) => this.onScroll(i),
      onDone: () => this.onScrollsDone(),
    });
    // zwoje nie wlatują pod panel z umiejętnościami
    this.game.rightBound = () => (this.mobile ? innerWidth : this.panel.el.getBoundingClientRect().left);
    this.bindDom();

    // postęp
    this.progress = this.load();
    this.caught = new Set(this.progress.caught || []);
    this.revealed = new Set(this.progress.revealed || []);

    // wejście
    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.hold = null;
    this.mode = 'idle';
    this.flash = 0;
    this.nextFlash = 3;
    this.bindPointer();
  }

  // ---------- zapis postępu ----------
  load() {
    try { return JSON.parse(localStorage.getItem(PROGRESS)) || {}; } catch { return {}; }
  }
  save() {
    this.progress.caught = [...this.caught];
    this.progress.revealed = [...this.revealed];
    try { localStorage.setItem(PROGRESS, JSON.stringify(this.progress)); } catch { /* brak */ }
  }

  // ---------- rozdziały w księdze ----------
  spells() {
    const p = this.progress;
    return [
      { id: 'fulmen', num: 'I', name: 'Fulmen', pl: 'Błyskawica · wynurzenie wieży', open: true, done: true },
      { id: 'visio', num: 'II', name: 'Visio', pl: 'Jasnowidzenie · projekty', open: true, done: !!p.visio },
      { id: 'transmutatio', num: 'III', name: 'Transmutatio', pl: 'Przemiana · drut, glina, dzieło', open: !!p.visio, done: !!p.transm },
      { id: 'multiplicatio', num: 'IV', name: 'Multiplicatio', pl: 'Mnożenie · umiejętności', open: !!p.transm, done: !!p.multi },
      { id: 'levitatio', num: 'V', name: 'Levitatio', pl: 'Lewitacja · o mnie', open: !!p.multi, done: !!p.levit },
      { id: 'evocatio', num: 'VI', name: 'Evocatio', pl: 'Przywołanie · kontakt', open: !!p.levit, done: !!p.evoc },
    ];
  }

  renderBook() {
    const list = this.book.querySelector('.spells');
    list.innerHTML = this.spells().map((s) => `
      <li class="spell ${s.open ? '' : 'sealed'} ${s.done ? 'done' : ''}" data-id="${s.id}" ${s.open ? 'tabindex="0" role="button"' : 'aria-disabled="true"'}>
        <span class="sp-num">${s.num}.</span>
        <span class="sp-name">${s.name}</span>
        <span class="sp-dots"></span>
        <span class="sp-pl">${s.open ? s.pl : '⠿⠿⠿ zapieczętowane'}</span>
        <span class="sp-mark">${s.done ? '✓' : s.open ? '›' : '✠'}</span>
      </li>`).join('');
    const all = this.spells().every((s) => s.open && s.done);
    this.book.querySelector('[data-act="unseal"]').style.display = all ? 'none' : '';
  }

  bindDom() {
    this.book.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.book.addEventListener('click', (e) => {
      const li = e.target.closest('.spell');
      if (li && !li.classList.contains('sealed')) { this.audio.blip(1.6); this.chapter(li.dataset.id); }
      const act = e.target.closest('[data-act]');
      if (act?.dataset.act === 'sea') this.exit();
      if (act?.dataset.act === 'unseal') this.unsealAll();
    });
    this.book.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('spell')) { e.preventDefault(); e.target.click(); }
    });

    this.ballnav.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.ballnav.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.b === 'prev') this.showProject(this.current - 1);
      if (b.dataset.b === 'next') this.showProject(this.current + 1);
      if (b.dataset.b === 'gaze') this.view(this.current);
      if (b.dataset.b === 'book') this.openBook();
      this.audio.blip(1.3);
    });

    addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (this.mode === 'ball') {
        if (e.key === 'ArrowLeft') this.showProject(this.current - 1);
        if (e.key === 'ArrowRight') this.showProject(this.current + 1);
      }
      if (this.mode === 'view') {
        if (['1', '2', '3'].includes(e.key)) this.setStage(+e.key - 1);
        if (e.key === 'ArrowLeft') this.view(this.current - 1);
        if (e.key === 'ArrowRight') this.view(this.current + 1);
      }
      if (e.key === 'Escape' && this.mode !== 'book' && this.mode !== 'idle') this.openBook();
    });
  }

  // ---------- wejście / wyjście ----------
  async enter() {
    this.active = true;
    this.camPos.copy(this.stations.door.pos);
    this.camLook.copy(this.stations.door.look);
    this.goal = this.stations.hub;
    document.body.classList.add('in-tower');
    this.hud.setChapter('CAP. II — TURRIS INTUS');
    this.hud.log('INTRAS TURRIM — WNĘTRZE WIEŻY');
    this.dialog.cancel();
    await wait(1.4);
    if (!this.active) return;
    if (this.progress.met) { this.openBook(); return; }
    this.progress.met = true; this.save();
    const v = await this.dialog.say([
      { text: 'Witaj w mojej pracowni. Uważaj na świece — pamiętają jeszcze poprzedniego ucznia.', mood: 'point' },
      { text: 'Wszystkie dzieła mistrza zapisano w Księdze Czarów. Każdy czar otwiera kolejną stronę… ale strony są zapieczętowane.', mood: 'idle' },
      { text: 'Chcesz zdejmować pieczęcie po kolei, czy spieszysz się, wędrowcze?', choices: [
        { label: 'I.    POKAŻ MI KSIĘGĘ', value: 'book' },
        { label: 'II.   SPIESZĘ SIĘ — ZDEJMIJ WSZYSTKIE PIECZĘCIE', value: 'unseal' },
      ] },
    ]);
    if (v === CANCEL) return;
    if (v === 'unseal') this.unsealAll(); else this.openBook();
  }

  exit() {
    this.dialog.cancel();
    this.closeAll();
    this.active = false;
    document.body.classList.remove('in-tower');
    this.post.ps2.uniforms.uTrue.value = 0;
    this.onExit();
  }

  closeAll() {
    this.book.classList.remove('open');
    this.ballnav.classList.remove('open');
    this.panel.onClose = null; this.panel.close();
    this.game.stop();
    this.raven.hide();
    document.body.classList.remove('no-cursor');
    this.tip.classList.remove('show');
    this.viewing = false;
    this.trueGoal = 0;
    this.holderGoal = { y: this.room.BALL_Y, s: 1.45 };
  }

  openBook() {
    this.dialog.cancel();
    this.closeAll();
    this.mode = 'book';
    this.goal = this.stations.hub;
    this.renderBook();
    this.book.classList.add('open');
    this.hud.setChapter('CAP. II — LIBER INCANTATIONUM');
    this.dialog.line({ text: 'Wybierz czar z księgi. Zapieczętowane strony otworzą się, gdy opanujesz poprzednie.', hold: true, mood: 'idle' });
  }

  unsealAll() {
    Object.assign(this.progress, { visio: true, transm: true, multi: true, levit: true, evoc: true, met: true });
    this.config.skills.forEach((_, i) => this.caught.add(i));
    this.config.about.forEach((_, i) => this.revealed.add(i));
    this.save();
    this.audio.chime();
    this.flash = 0.6;
    this.hud.log('SIGILLA FRACTA — PIECZĘCIE ZDJĘTE');
    this.openBook();
    this.dialog.line({ text: 'Puff! Wszystkie pieczęcie zdjęte. Każda strona księgi otworzy się od razu.', hold: true, mood: 'cast' });
  }

  chapter(id) {
    this.dialog.cancel();
    this.closeAll();
    if (id === 'fulmen') return this.exit();
    if (id === 'visio') return this.visio();
    if (id === 'transmutatio') return this.view(this.current, true);
    if (id === 'multiplicatio') return this.multiplicatio();
    if (id === 'levitatio') return this.levitatio();
    if (id === 'evocatio') return this.evocatio();
  }

  // ============================================================
  //  II. VISIO — kryształowa kula
  // ============================================================
  showProject(i) {
    const n = this.models.length;
    this.current = ((i % n) + n) % n;
    this.models.forEach((m, k) => { m.root.visible = k === this.current; });
    this.room.ballMat.uniforms.uGlow.value = 0.6;
    const p = this.config.projects[this.current];
    if (this.active && this.mode === 'ball') {
      this.ballnav.querySelector('.bn-title').textContent = `${this.roman(this.current + 1)}. ${p.title}`;
    }
  }

  roman(n) { return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 1] || n; }

  visio() {
    this.mode = 'ball';
    this.goal = this.mobile ? { pos: V(0, 10.6, 15), look: V(0, 9.6, 0) } : this.stations.ball;
    this.hud.setChapter('CAP. II — VISIO');
    this.ballnav.classList.add('open');
    this.showProject(this.current);
    const first = !this.progress.visio;
    this.dialog.line({
      text: first
        ? 'Kryształowa kula pokazuje dzieła mistrza. Strzałki ‹ › przewracają wizje. Kliknij kulę, by się w nią wpatrzyć.'
        : 'Kula pamięta wszystkie wizje. Wpatrz się w którąś.',
      hold: true, mood: 'point',
    });
  }

  async view(i, fromBook = false) {
    this.dialog.cancel();
    this.ballnav.classList.remove('open');
    this.mode = 'view';
    this.viewing = true;
    this.goal = this.mobile ? { pos: V(0, 15, 14), look: V(0, 11.2, 0) } : this.stations.view;
    this.showProject(i);
    const model = this.models[this.current];
    const p = this.config.projects[this.current];
    this.holderGoal = { y: this.room.BALL_Y + 4.9, s: 2.3 };
    this.hud.setChapter('CAP. III — TRANSMUTATIO');
    this.hud.log(`VISIO: ${p.title.toUpperCase()}`);

    this.panel.open('OPUS · VISIO', projectHTML(p, this.current, this.models.length));
    this.panel.onClose = () => { if (this.mode === 'view') this.backToBall(); };
    const range = this.panel.body.querySelector('.tm-range');
    range.addEventListener('input', () => this.setStage(+range.value));
    this.panel.body.querySelectorAll('[data-s]').forEach((el) => el.addEventListener('click', () => this.setStage(+el.dataset.s)));
    this.panel.body.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => this.view(this.current + +b.dataset.nav)));

    const firstTime = !this.progress.transm;
    // pierwszy raz (albo z rozdziału Transmutatio) zaczynamy od drutu, potem od razu od dzieła
    this.setStage(firstTime || fromBook ? 0 : 2, true);

    if (!this.progress.visio) { this.progress.visio = true; this.save(); this.hud.log('PAGINA III APERTA'); }
    if (firstTime) {
      await this.dialog.say([{ text: 'Widzisz? Na razie to sam drut — szkielet dzieła. Przesuń suwak TRANSMUTATIO, a zobaczysz, jak powstawało.', hold: true, mood: 'cast' }]);
    } else {
      this.dialog.line({ text: 'Suwak TRANSMUTATIO pokazuje drogę dzieła: od siatki, przez glinę, do gotowej formy.', hold: true, mood: 'idle' });
    }
  }

  setStage(s, silent = false) {
    if (this.mode !== 'view') return;
    const model = this.models[this.current];
    model.setStage(s);
    const range = this.panel.body.querySelector('.tm-range');
    if (range) range.value = s;
    this.panel.body.querySelectorAll('[data-s]').forEach((el) => el.classList.toggle('on', +el.dataset.s === s));
    this.trueGoal = s === 2 ? 1 : 0;
    if (silent) return;
    this.audio.blip(1 + s * 0.4);
    this.flash = Math.max(this.flash, 0.4);
    if (s === 2 && !this.progress.transm) {
      this.progress.transm = true; this.save();
      this.audio.chime();
      this.hud.log('PAGINA IV APERTA — MULTIPLICATIO');
      this.dialog.say([
        { text: 'Prawdziwe barwy! Transmutacja zdejmuje kobaltowy czar z dzieła.', mood: 'happy' },
        { text: 'W księdze odpieczętowała się nowa strona: Multiplicatio. Obejrzyj resztę wizji albo wróć do księgi.', hold: true, mood: 'point' },
      ]);
    }
  }

  backToBall() {
    this.viewing = false;
    this.trueGoal = 0;
    this.holderGoal = { y: this.room.BALL_Y, s: 1.45 };
    this.visio();
  }

  // ============================================================
  //  IV. MULTIPLICATIO — klony kursora łapią zwoje z umiejętnościami
  // ============================================================
  async multiplicatio() {
    this.mode = 'multi';
    this.goal = this.stations.hub;
    this.hud.setChapter('CAP. IV — MULTIPLICATIO');
    const refresh = () => this.panel.open('ARTES · UMIEJĘTNOŚCI', skillsHTML(this.config.skills, this.caught));
    refresh();
    this.panel.onClose = () => { if (this.mode === 'multi') this.openBook(); };
    this.refreshSkills = refresh;
    if (this.caught.size >= this.config.skills.length) {
      this.dialog.line({ text: 'Wszystkie zwoje już schwytane. Oto, co potrafi mistrz.', hold: true, mood: 'point' });
      return;
    }
    const r = await this.dialog.say([
      { text: 'Zwoje z wiedzą mistrza są płochliwe — uciekają przed każdą ręką.', mood: 'idle' },
      { text: 'Rzucę na ciebie Multiplicatio. Twoja ręka się rozmnoży… ale zwoje boją się tylko tej prawdziwej. Łap je klonami!', mood: 'cast' },
    ]);
    if (r === CANCEL || this.mode !== 'multi') return;
    this.audio.thunder(0.5);
    this.flash = 0.8;
    document.body.classList.add('no-cursor');
    this.game.start(this.caught);
    this.dialog.line({ text: 'MULTIPLICATIO! Prowadź prawdziwy kursor tak, by klony zagoniły zwoje.', hold: true, mood: 'cast' });
  }

  onScroll(i) {
    this.caught.add(i); this.save();
    this.audio.blip(2.2);
    this.hud.log(`ZWÓJ: ${this.config.skills[i].name.toUpperCase()}`);
    this.refreshSkills?.();
  }

  onScrollsDone() {
    document.body.classList.remove('no-cursor');
    this.progress.multi = true; this.save();
    this.audio.chime();
    this.hud.log('PAGINA V APERTA — LEVITATIO');
    this.refreshSkills?.();
    this.dialog.say([
      { text: 'Wszystkie zwoje! Klony znikają… i dobrze, jeden ciebie w zupełności wystarczy.', mood: 'happy' },
      { text: 'Otworzyła się strona Levitatio. Na moim biurku leżą przedmioty, które opowiedzą ci o mistrzu.', hold: true, mood: 'point' },
    ]);
  }

  // ============================================================
  //  V. LEVITATIO — unoszenie przedmiotów z biurka
  // ============================================================
  levitatio() {
    this.mode = 'levit';
    this.goal = this.stations.desk;
    this.hud.setChapter('CAP. V — LEVITATIO');
    this.refreshAbout();
    this.panel.onClose = () => { if (this.mode === 'levit') this.openBook(); };
    const all = this.revealed.size >= this.config.about.length;
    this.dialog.line({
      text: all ? 'Przedmioty opowiedziały już swoje historie. Możesz je unosić dalej, jeśli lubisz.'
        : `${this.mobile ? 'Przytrzymaj palec' : 'Przytrzymaj przycisk myszy'} na przedmiocie, a uniesie się i zdradzi fragment historii mistrza.`,
      hold: true, mood: 'point',
    });
  }

  refreshAbout() { this.panel.open('DE MAGISTRO · O MNIE', aboutHTML(this.config.about, this.revealed)); }

  revealItem(obj) {
    const idx = this.config.about.findIndex((a) => a.item === obj.userData.name);
    if (idx < 0 || this.revealed.has(idx)) return;
    this.revealed.add(idx); this.save();
    this.audio.blip(1.9);
    this.hud.log(`LEVITATIO: ${obj.userData.name}`);
    this.refreshAbout();
    if (this.revealed.size >= this.config.about.length && !this.progress.levit) {
      this.progress.levit = true; this.save();
      this.audio.chime();
      this.hud.log('PAGINA VI APERTA — EVOCATIO');
      this.dialog.say([
        { text: 'Teraz wiesz o mistrzu więcej niż jego własna matka. No, prawie.', mood: 'happy' },
        { text: 'Została ostatnia strona: Evocatio. Przywołamy kruka, który zaniesie twój list.', hold: true, mood: 'point' },
      ]);
    }
  }

  // ============================================================
  //  VI. EVOCATIO — krąg przywołania i kruk
  // ============================================================
  async evocatio() {
    this.mode = 'evoc';
    this.goal = this.stations.wall;
    this.hud.setChapter('CAP. VI — EVOCATIO');
    const first = !this.progress.evoc;
    const r = await this.dialog.say([
      first
        ? { text: 'Ostatni czar. Przywołam posłańca, który zaniesie twój list do mistrza.', mood: 'idle' }
        : { text: 'Kruk znowu? Dobrze, dobrze — zawsze jest głodny listów.', mood: 'idle' },
      { text: 'EVOCATIO CORVI!', mood: 'cast' },
    ]);
    if (r === CANCEL || this.mode !== 'evoc') return;
    this.audio.thunder(0.7);
    this.flash = 0.5;
    this.hud.log('EVOCATIO — KRUK PRZYWOŁANY');
    this.raven.summon();
    this.progress.evoc = true; this.save();
    this.openContact();
    this.dialog.line({ text: 'Kruk będzie krążył, dopóki nie dasz mu listu. Napisz kilka słów i wyślij — poleci prosto do mistrza.', hold: true, mood: 'point' });
  }

  openContact() {
    this.panel.open('EVOCATIO · KONTAKT', contactHTML(this.config.contact));
    this.panel.onClose = () => { if (this.mode === 'evoc') this.openBook(); };
    const form = this.panel.body.querySelector('.letter');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const subject = encodeURIComponent('List z Wieży Portfolio');
      const body = encodeURIComponent(`${f.get('body') || ''}\n\n— ${f.get('from') || ''}`);
      const url = `mailto:${this.config.contact.email}?subject=${subject}&body=${body}`;
      form.querySelector('button').disabled = true;
      this.hud.log('EPISTULA MISSA — LIST WYSŁANY');
      this.audio.blip(2);
      this.dialog.line({ text: 'Leć, przyjacielu! …A ty sprawdź swoją skrzynkę pocztową — list czeka tam na ostatni podpis.', hold: true, mood: 'happy' });
      await this.raven.depart();
      location.href = url;
      form.querySelector('button').disabled = false;
    });
  }

  // ============================================================
  //  WSKAŹNIK: kula i przedmioty
  // ============================================================
  pick(e, objects) {
    this.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    return this.ray.intersectObjects(objects, true)[0];
  }

  itemOf(hit) {
    let o = hit?.object;
    while (o && !this.room.items.includes(o)) o = o.parent;
    return o || null;
  }

  bindPointer() {
    const c = this.renderer.domElement;
    c.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      if (this.mode === 'ball' && this.pick(e, [this.room.ball])) { this.audio.blip(1.5); this.view(this.current); return; }
      if (this.mode === 'levit') {
        const it = this.itemOf(this.pick(e, this.room.items));
        if (it) { this.hold = { obj: it, t: 0 }; this.audio.crackle(true); setTimeout(() => this.audio.crackle(false), 120); }
      }
      if (this.mode === 'book' || this.mode === 'idle') this.dialog.advance();
    });
    const up = () => { this.hold = null; };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('pointermove', (e) => {
      if (!this.active) return;
      let label = null;
      if (this.mode === 'ball' && this.pick(e, [this.room.ball])) label = 'WPATRZ SIĘ';
      if (this.mode === 'levit') { const it = this.itemOf(this.pick(e, this.room.items)); if (it) label = it.userData.name; }
      c.style.cursor = label ? 'pointer' : '';
      this.tip.classList.toggle('show', !!label);
      if (label) {
        this.tip.textContent = `[ ${label} ]`;
        this.tip.style.transform = `translate(${e.clientX + 16}px, ${e.clientY - 26}px)`;
      }
    });
  }

  // ============================================================
  //  PĘTLA
  // ============================================================
  update(dt, t) {
    const R = this.room;
    // kamera płynie do stacji
    const k = 1 - Math.exp(-dt * 2.2);
    this.camPos.lerp(this.goal.pos, k);
    this.camLook.lerp(this.goal.look, k);
    this.camera.position.copy(this.camPos);
    this.camera.position.y += Math.sin(t * 0.6) * 0.08;
    this.camera.lookAt(this.camLook);

    // model projektu: w kuli albo wyniesiony do oglądania
    const h = this.holder, g = this.holderGoal;
    h.position.y += (g.y - h.position.y) * k;
    const s = h.scale.x + (g.s - h.scale.x) * k;
    h.scale.setScalar(s);
    h.rotation.y += dt * (this.viewing ? 0.35 : 0.6);
    h.position.y += Math.sin(t * 1.2) * 0.003;
    R.ballMat.uniforms.uTime.value = t;
    R.ballMat.uniforms.uGlow.value *= Math.exp(-dt * 2.5);

    // prawdziwe kolory (Transmutacja → OPUS)
    const u = this.post.ps2.uniforms.uTrue;
    u.value += (this.trueGoal - u.value) * (1 - Math.exp(-dt * 3));

    // świece
    R.flames.forEach((f, i) => { f.scale.y = 1 + Math.sin(t * 13 + i * 7) * 0.15 + Math.random() * 0.1; });
    R.candleLight.intensity = 2.2 + Math.sin(t * 11) * 0.25 + Math.random() * 0.2;
    R.deskLight.intensity = 1.6 + Math.sin(t * 9 + 2) * 0.2;

    // burza za oknem
    this.nextFlash -= dt;
    if (this.nextFlash < 0) {
      this.nextFlash = 3 + Math.random() * 7;
      this.flash = Math.max(this.flash, 0.6 + Math.random() * 0.5);
      this.audio.thunder(0.25 + Math.random() * 0.2, 0.6 + Math.random());
    }
    this.flash *= Math.exp(-dt * 4);
    R.winLight.intensity = this.flash * 3;
    // przy oglądaniu dzieła okno przygasa, żeby model nie był sylwetką
    this.dim = (this.dim ?? 1) + ((this.viewing ? 0.25 : 1) - (this.dim ?? 1)) * k;
    const sk = (0.35 + this.flash * 1.2) * this.dim;
    R.skyMat.color.setRGB(sk, sk * 1.15, sk * 2.4);
    this.wizard.flash = Math.max(this.wizard.flash, this.flash * 0.4);

    // lewitacja
    if (this.hold) {
      this.hold.t += dt;
      if (this.hold.t > 0.8) this.revealItem(this.hold.obj);
    }
    let haloOn = false;
    R.items.forEach((o, i) => {
      const lifted = this.hold && this.hold.obj === o;
      o.userData.lift += ((lifted ? 1 : 0) - o.userData.lift) * (1 - Math.exp(-dt * (lifted ? 3 : 2)));
      const L = o.userData.lift;
      o.position.y = o.userData.baseY + L * 2.6 + L * Math.sin(t * 2 + i) * 0.15;
      o.rotation.y = L * Math.sin(t * 0.9 + i) * 1.2;
      o.rotation.z = L * Math.sin(t * 1.3 + i) * 0.15;
      if (lifted) { haloOn = true; o.getWorldPosition(R.itemHalo.position); }
    });
    R.itemHalo.intensity += ((haloOn ? 3 : 0) - R.itemHalo.intensity) * 0.1;
    R.showLight.intensity += ((this.viewing ? 3.2 : this.mode === 'ball' ? 2.0 : 0) - R.showLight.intensity) * k;
    R.showRim.intensity += ((this.viewing ? 2.0 : 0) - R.showRim.intensity) * k;
    // tło wizji: pełne przy drucie i glinie, lżejsze przy gotowym dziele (widać komnatę w barwach)
    const voidGoal = this.viewing ? (this.trueGoal ? 0.75 : 0.985) : 0;
    R.voidMat.opacity += (voidGoal - R.voidMat.opacity) * (1 - Math.exp(-dt * 4));
    // kula oddaje dzieło i chowa się, żeby nie zasłaniać jego podstawy
    R.ball.visible = !this.viewing;
    R.voidSphere.visible = R.voidMat.opacity > 0.01;
    // mniej poświaty przy oglądaniu, żeby siatka nie rozlewała się w plamę
    this.post.bloom.strength += ((this.viewing ? 0.35 : 1.0) - this.post.bloom.strength) * k;

    // pył
    const dp = R.dust.geometry.attributes.position;
    for (let i = 0; i < dp.count; i++) {
      let y = dp.getY(i) + dt * 0.3;
      if (y > 30) y = 0;
      dp.setY(i, y);
    }
    dp.needsUpdate = true;

    this.game.update(dt, t);
    this.raven.update(dt, t);
  }
}
