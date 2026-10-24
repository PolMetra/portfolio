// ============================================================
//  KONFIGURACJA — tu zmieniasz swoje dane i "pokrętła" sceny
// ============================================================
export const CONFIG = {
  // Twoje dane (pojawią się pod napisem PORTFOLIO)
  name: 'IMIĘ NAZWISKO',
  role: '3D ARTIST',
  artstation: 'https://www.artstation.com/',

  // Imię przewodnika
  wizardName: 'ARKANUS',

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
      desc: 'Mosiężna latarnia okrętowa. Ćwiczenie z hard-surface i szkła; wersja do gry 6k trójkątów.',
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
    { item: 'KSIĘGA', title: 'Początek', text: 'Tu napisz, jak zaczęła się Twoja przygoda z 3D — pierwszy program, pierwszy model, który Cię nie zawstydził.' },
    { item: 'KLEPSYDRA', title: 'Doświadczenie', text: 'Lata pracy, studia, kursy, studia gier lub freelance. Krótko: gdzie i nad czym.' },
    { item: 'FLAKON', title: 'Co mnie napędza', text: 'Style, gry, filmy i artyści, którzy Cię inspirują. Czego szukasz w każdej pracy.' },
    { item: 'ŚWIECA', title: 'Czego szukam', text: 'Jaką rolę chcesz objąć: environment, props, postacie? Stała praca, kontrakt, współpraca?' },
    { item: 'PIÓRO', title: 'Poza ekranem', text: 'Jedno lub dwa zdania o Tobie jako człowieku — to zostaje w pamięci rekruterów.' },
  ],

  // ==========================================================
  //  KONTAKT — Przywołanie (rozdział VI)
  // ==========================================================
  contact: {
    email: 'twoj@email.com',
    links: [
      { label: 'ArtStation', url: 'https://www.artstation.com/' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
      { label: 'Instagram', url: 'https://www.instagram.com/' },
    ],
  },
};
