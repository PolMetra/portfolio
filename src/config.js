// ============================================================
//  KONFIGURACJA — tu zmieniasz swoje dane i "pokrętła" sceny
// ============================================================
export const CONFIG = {
  // Twoje dane (pojawią się pod napisem PORTFOLIO)
  name: 'Artur Jędrzejczyk',
  role: '3D GENERALIST',
  artstation: 'https://www.artstation.com/',

  // Imię przewodnika
  wizardName: 'M3rlin',

  // Wygląd PS2: wysokość wewnętrznej rozdzielczości renderu (px).
  // Mniej = bardziej pikselowo. PS2 grało zwykle w ~448.
  renderHeight: 400,

  // Ile "energii burzy" (długość narysowanych błyskawic w jednostkach świata)
  // trzeba zebrać, żeby przywołać zamek.
  chargeNeeded: 450,

  // Jeśli masz własny model zamku: wstaw ścieżkę, np. 'assets/zamek.glb'.
  // Zostaw null, żeby użyć proceduralnego zamku-zastępcy.
  castleModel: null,
  castleModelScale: 10,

  // ==========================================================
  //  PROJEKTY — kryształowa kula (rozdział II) + Transmutacja
  // ==========================================================
  // model:   ścieżka do .glb (np. 'assets/projects/golem.glb') — pokaże się w kuli,
  //          a suwak Transmutacji przełączy go: drut → glina → dzieło.
  //          null = model-zastępca (placeholder: tower | golem | reliquary | lantern)
  // images:  rendery do galerii, np. ['assets/projects/golem-1.jpg', ...]
  projects: [
    {
      title: 'Strażnica Mgieł',
      year: 2025,
      genre: 'Environment',
      tools: ['Blender', 'Substance Painter', 'Unreal Engine 5'],
      desc: 'Samotna wieża sygnałowa na klifie. Modułowy kit kamienia, ręcznie malowane maski erozji, oświetlenie o świcie.',
      model: null, placeholder: 'tower', images: [], link: '',
    },
    {
      title: 'Golem z Torfowiska',
      year: 2025,
      genre: 'Character',
      tools: ['ZBrush', 'Blender', 'Marmoset Toolbag'],
      desc: 'Postać do gry: sculpt w ZBrushu, retopologia pod animację, mech i porosty jako osobne warstwy materiału.',
      model: null, placeholder: 'golem', images: [], link: '',
    },
    {
      title: 'Relikwiarz Zakonu',
      year: 2024,
      genre: 'Prop',
      tools: ['Blender', 'Substance Painter'],
      desc: 'Rekwizyt hero-prop: złocenia, emalia i wytarte krawędzie. Jeden zestaw tekstur 4K, trim sheet na ornamenty.',
      model: null, placeholder: 'reliquary', images: [], link: '',
    },
    {
      title: 'Latarnia Nawigatora',
      year: 2024,
      genre: 'Hard Surface',
      tools: ['Blender', 'Substance Painter', 'Photoshop'],
      desc: 'Mosiężna latarnia okrętowa. Ćwiczenie z hard-surface i szkła. Wersja do gry ma 6k trójkątów.',
      model: null, placeholder: 'lantern', images: [], link: '',
    },
  ],

  // ==========================================================
  //  UMIEJĘTNOŚCI — Multiplikacja (rozdział IV); level 1–5
  // ==========================================================
  skills: [
    { name: 'Blender', level: 5, note: 'modelowanie, sculpt, Cycles' },
    { name: 'ZBrush', level: 4, note: 'sculpt postaci i stworów' },
    { name: 'Substance Painter', level: 4, note: 'materiały PBR, maski' },
    { name: 'Substance Designer', level: 2, note: 'proceduralne materiały' },
    { name: 'Unreal Engine 5', level: 3, note: 'oświetlenie, Lumen, Nanite' },
    { name: 'Marmoset Toolbag', level: 3, note: 'prezentacja, bake' },
    { name: 'Retopologia i UV', level: 4, note: 'pod animację i gry' },
    { name: 'Photoshop', level: 3, note: 'concepty, paintover' },
  ],

  // ==========================================================
  //  O MNIE — Lewitacja (rozdział V); każdy przedmiot odsłania fragment
  // ==========================================================
  about: [
    { item: 'KSIĘGA', title: 'Początek',
      text: 'Do grafiki 3D przyprowadziły mnie gry i animacja. Od zawsze najbardziej fascynowała mnie możliwość budowania własnych światów, zaludniania ich bohaterami i opowiadania w nich historii.' },
    { item: 'KLEPSYDRA', title: 'Wykształcenie',
      text: 'Jestem magistrem sztuki. Ukończyłem grafikę na Akademii Śląskiej, ze specjalizacją Grafika multimedialna i animacja 3D.' },
    { item: 'FLAKON', title: 'Czym się zajmuję',
      text: 'Rozwijam się jako 3D generalist: modeluję, teksturuję, oświetlam i renderuję, świadomie próbując różnych obszarów grafiki, by znaleźć swoją specjalizację. Po godzinach buduję własne prototypy gier, żeby poznać pracę w silnikach od środka.' },
    { item: 'ŚWIECA', title: 'Czego szukam',
      text: 'Szukam pierwszego doświadczenia w branży: w studiu gier, animacji lub przy produkcji 3D, gdzie mogę się uczyć od lepszych i dokładać swoją cegiełkę do projektu. Równolegle rozwijam własne projekty gier.' },
    { item: 'PIÓRO', title: 'Poza ekranem',
      text: 'Tworzę też rękami: projektuję i maluję customowe kurtki jeansowe, a ostatnio zrealizowałem wielkoformatowy mural, który był tematem mojej pracy magisterskiej. Dzięki temu nie boję się skali ani pracy od szkicu do gotowego obiektu.' },
  ],


  // ==========================================================
  //  KONTAKT — Przywołanie (rozdział VI)
  // ==========================================================
  contact: {
    email: 'twoj@email.com',
    links: [
      { label: 'ArtStation', url: 'https://arturjedrzejczyk.artstation.com/' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/artur-jędrzejczyk-25a667335' },
      { label: 'Instagram', url: 'https://www.instagram.com/walty_customs/' },
    ],
  },
};
