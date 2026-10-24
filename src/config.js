// ============================================================
//  KONFIGURACJA — tu zmieniasz swoje dane i "pokrętła" sceny
// ============================================================
export const CONFIG = {
  // Twoje dane (pojawią się pod napisem PORTFOLIO)
  name: 'Artur Jędrzejczyk',
  role: '3D GENERALIST',
  artstation: 'https://arturjedrzejczyk.artstation.com/',

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
      title: 'Iron Lily',
      year: 2025,
      genre: 'Hard Surface',
      tools: ['Blender', 'Substance Painter'],
      desc: 'Mój największy i najambitniejszy projekt osobisty: autorski motocykl infiltracyjny przyszłości, zaprojektowany i wymodelowany od zera. Wydłużone podwozie inspirowane motocyklami bijącymi rekordy prędkości stawia na aerodynamikę w linii prostej. Najważniejszy element to ruchome górne owiewki: przy dużej prędkości zamykają się nad kierowcą jak płatki lilii, od której maszyna wzięła nazwę. Projekt opiera się na idei jinba ittai, jedności jeźdźca i maszyny. Główny napęd jest elektryczny: tylne koło bez piasty i trójkątne czujniki boczne działają jak odbiorniki indukcyjne, ładując motocykl z pól elektromagnetycznych autostrad przyszłości. Szczegółowy silnik spalinowy to zapas na strefy bez zasilania. Ogromne ćwiczenie z modelowania hard-surface, złożonych blockoutów mechanicznych i łączenia działającej inżynierii z opowieścią.',
      model: 'assets/projects/iron-lily.glb', placeholder: 'lantern',
      images: ['assets/projects/iron-lily-1.jpg', 'assets/projects/iron-lily-2.jpg', 'assets/projects/iron-lily-3.jpg'],
      link: 'https://arturjedrzejczyk.artstation.com/',
    },
    {
      title: 'Starożytne ruiny',
      year: 2024,
      genre: 'Environment · Low Poly',
      tools: ['Blender'],
      desc: 'Projekt na studia z projektowania otoczenia dla interfejsu gry: miniaturowa diorama-mapa, która służy jako ikona wyboru poziomu w menu głównym. Wybrałem motyw zrujnowanej greckiej świątyni w czystej, stylizowanej estetyce low poly. Ponieważ model ogląda się w menu, kluczowe były czytelność i mocny punkt skupienia. Scenę osadziłem w nocy, a głównym źródłem światła jest stylizowany ogień w centralnym palenisku. Ciepła, dramatyczna poświata na tle ciemności od razu przyciąga wzrok gracza i nadaje bryłę kanciastej, zrujnowanej architekturze.',
      model: 'assets/projects/ruiny.glb', placeholder: 'tower',
      images: ['assets/projects/ruiny-1.jpg', 'assets/projects/ruiny-2.jpg', 'assets/projects/ruiny-3.jpg'],
      link: 'https://arturjedrzejczyk.artstation.com/',
    },
    {
      title: 'KO! Rękawice bokserskie',
      year: 2024,
      genre: 'Product · Packaging',
      tools: ['Blender'],
      desc: 'Projekt na studia z projektowania opakowań produktu. Zamiast tradycyjnego kartonu czy siatki chciałem spróbować czegoś nietypowego: rękawic bokserskich szczelnie zapakowanych próżniowo w grubą folię. Rękawice wymodelowałem od zera i zaprojektowałem retro etykietę w stylu pixel art. Najciekawszym etapem było uzyskanie realistycznego efektu folii termokurczliwej: użyłem symulacji tkanin w Blenderze, tworząc cyfrową próżnię, która wysysa powietrze i obciska folię wokół złożonej geometrii rękawic. Świetne ćwiczenie z interakcji brył sztywnych i miękkich oraz zaawansowanych materiałów, zwłaszcza załamującej światło, pomarszczonej folii.',
      model: 'assets/projects/rekawice-ko.glb', placeholder: 'reliquary',
      images: ['assets/projects/rekawice-1.jpg', 'assets/projects/rekawice-2.jpg', 'assets/projects/rekawice-3.jpg'],
      link: 'https://arturjedrzejczyk.artstation.com/',
    },
    {
      title: 'Soul Chamber',
      year: 2024,
      genre: 'Prop · Sci-Fi',
      tools: ['Blender', 'Substance Painter'],
      desc: 'Odpowiedź na zadanie z zajęć: stworzyć pudełko z duszą w środku, nie pokazując samej duszy. Moja interpretacja to urządzenie ze świata cyberpunku do bezpiecznego transportu ludzkiej świadomości. Wytrzymała, szara obudowa ze stopu łączy industrialny charakter z zaawansowaną technologią, a jaskrawoczerwone akcenty, jak masywny uchwyt i pierścienie portów, ostrzegają przed ładunkiem najwyższej wagi. W przezroczystej komorze znajduje się gęsty, niebieski płyn bio-cyfrowy stabilizujący sygnał. Nie pokazuje duszy, ale tworzy środowisko, którego ona potrzebuje: świadomość to nie tylko dane, lecz złożony wzór impulsów nerwowych i emocji, wymagający wyjątkowego, schłodzonego nośnika.',
      model: 'assets/projects/soul-chamber.glb', placeholder: 'reliquary',
      images: ['assets/projects/soul-chamber-1.jpg', 'assets/projects/soul-chamber-2.jpg', 'assets/projects/soul-chamber-3.jpg'],
      link: 'https://arturjedrzejczyk.artstation.com/',
    },
    {
      title: 'Głowa smoka',
      year: 2024,
      genre: 'Sculpt',
      tools: ['Blender'],
      desc: 'Głowa smoka z rozbudowanym porożem, wyrzeźbiona na podstawie referencji aligatora. Łuski, fałdy skóry i uzębienie oparłem na anatomii prawdziwego gada, żeby fantastyczna forma była wiarygodna.',
      model: 'assets/projects/smok-glowa.glb', placeholder: 'golem',
      images: ['assets/projects/smok-1.jpg', 'assets/projects/smok-2.jpg', 'assets/projects/smok-3.jpg'],
      link: 'https://arturjedrzejczyk.artstation.com/', // podmień na link do tego projektu na ArtStation
      // kolor i połysk gotowego modelu (opcjonalne): color '#rrggbb', roughness 0 = lustro … 1 = mat
      color: '#2e2b2b', roughness: 0.45,
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
