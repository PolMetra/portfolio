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
};
