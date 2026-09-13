// KLARTEXT-Mentoring Karten – PWA app logic (kein Framework, kein Build-Schritt)

const screenDecks = document.getElementById('screen-decks');
const screenCards = document.getElementById('screen-cards');
const deckCategories = document.getElementById('deckCategories');
const backBtn = document.getElementById('backBtn');

// Kategorie-Reihenfolge + Überschriften, angelehnt an die Struktur der Shop-Übersichtsseite
// (klartext-shop/KLARTEXT_Shop_Uebersicht.html) — damit App und Website gleich sortiert wirken.
const KATEGORIEN = {
  zielgruppe: { titel: 'Kartendecks nach Zielgruppe', sub: 'Eigene Zielgruppe, eigene Impulse, dieselbe systemische Grundhaltung.' },
  handlung:   { titel: 'Handlungskarten & Spezialdecks', sub: 'Konkrete Handlungsanleitungen statt offener Coaching-Impulse.' },
  material:   { titel: 'Material-Pakete für Zuhause & Klassenzimmer', sub: 'Raumzonen-Konzepte statt Gesprächskarten.' },
};
const KATEGORIE_ORDER = ['zielgruppe', 'handlung', 'material'];
const progressEl = document.getElementById('progress');

const flashcard = document.getElementById('flashcard');
const cardImg = document.getElementById('cardImg');
const frontImgWrap = document.getElementById('frontImgWrap');
const frontIconWrap = document.getElementById('frontIconWrap');
const frontIcon = document.getElementById('frontIcon');
const cardBadge = document.getElementById('cardBadge');
const cardTitelFront = document.getElementById('cardTitelFront');
const cardTitelBack = document.getElementById('cardTitelBack');
const impulsBack = document.getElementById('impulsBack');
const cardAnleitung = document.getElementById('cardAnleitung');
const cardFragen = document.getElementById('cardFragen');
const fragenWrap = document.getElementById('fragenWrap');
const cardHinweis = document.getElementById('cardHinweis');
const hinweisWrap = document.getElementById('hinweisWrap');
const systemfrageWrap = document.getElementById('systemfrageWrap');
const systemfrageLabel = document.getElementById('systemfrageLabel');
const cardSystemfrage = document.getElementById('cardSystemfrage');

// Jahreskarten-Serie: eigenes Kartenlayout, 1:1 wie die echte gedruckte PDF-Karte
// (Terrakotta-Kopfstand-Vorderseite / grüne Schlaufuchs-Rückseite).
const jkFront = document.getElementById('jkFront');
const jkBack = document.getElementById('jkBack');
const genericBackScroll = document.getElementById('genericBackScroll');
const jkWmFront = document.getElementById('jkWmFront');
const jkWmBack = document.getElementById('jkWmBack');
const jkSubtitleFront = document.getElementById('jkSubtitleFront');
const jkSubtitleBack = document.getElementById('jkSubtitleBack');
const jkPillFront = document.getElementById('jkPillFront');
const jkPillBack = document.getElementById('jkPillBack');
const jkIconFront = document.getElementById('jkIconFront');
const jkIconBack = document.getElementById('jkIconBack');
const jkLabelFront = document.getElementById('jkLabelFront');
const jkLabelBack = document.getElementById('jkLabelBack');
const jkTitelFront = document.getElementById('jkTitelFront');
const jkTitelBack = document.getElementById('jkTitelBack');
const jkFrageFront = document.getElementById('jkFrageFront');
const jkFrageBack = document.getElementById('jkFrageBack');
const jkMottoFront = document.getElementById('jkMottoFront');
const jkMottoBack = document.getElementById('jkMottoBack');
const jkMottoImgFront = document.getElementById('jkMottoImgFront');
const jkMottoImgBack = document.getElementById('jkMottoImgBack');
const jkFussFront = document.getElementById('jkFussFront');
const jkFussBack = document.getElementById('jkFussBack');


const handlungBack = document.getElementById('handlungBack');
const introWrap = document.getElementById('introWrap');
const introLabel = document.getElementById('introLabel');
const cardIntro = document.getElementById('cardIntro');
const schritteLabel = document.getElementById('schritteLabel');
const cardSchritte = document.getElementById('cardSchritte');
const abgrenzungWrap = document.getElementById('abgrenzungWrap');
const cardAbgrenzung = document.getElementById('cardAbgrenzung');
const notizWrap = document.getElementById('notizWrap');
const notizLabel = document.getElementById('notizLabel');
const cardNotiz = document.getElementById('cardNotiz');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');

const appleTouchIcon = document.getElementById('appleTouchIcon');
const DEFAULT_TITLE = document.title;
const DEFAULT_ICON = 'icons/icon-192.png';

const pwOverlay = document.getElementById('pwOverlay');
const pwDeckTitel = document.getElementById('pwDeckTitel');
const pwInput = document.getElementById('pwInput');
const pwError = document.getElementById('pwError');
const pwCancel = document.getElementById('pwCancel');
const pwSubmit = document.getElementById('pwSubmit');

let currentDeck = null;
let currentIndex = 0;
let allDecks = [];
let accessMap = {};

function lastIndexKey(deckId) { return `klartext_last_${deckId}`; }
function unlockedKey(deckId) { return `klartext_unlocked_${deckId}`; }
function isDeckUnlocked(deckId) { return localStorage.getItem(unlockedKey(deckId)) === '1'; }

async function loadAccess() {
  try {
    const res = await fetch('data/access.json');
    accessMap = await res.json();
  } catch (e) {
    accessMap = {};
  }
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Passwort pro Deck: Hash-Vergleich, damit der Klartext-Code nicht 1:1 im Code steht.
// Kein Ersatz für echten Login/Backend (die App bleibt eine rein statische Seite) — reicht
// aber als Zugriffsschranke gegen zufälliges/beiläufiges Mitlesen fremder, nicht gekaufter Decks.
// Löst die frühere seitenweite Passwortsperre (ein Passwort für alle 24 Decks) ab.
async function checkPassword(deckId, pw) {
  const expected = accessMap[deckId];
  if (!expected) return false;
  const hash = await sha256Hex(`${deckId}:${pw.trim().toLowerCase()}`);
  return hash === expected;
}

function askForPassword(deckId, deckTitel) {
  return new Promise((resolve) => {
    pwDeckTitel.textContent = deckTitel;
    pwInput.value = '';
    pwError.hidden = true;
    pwOverlay.hidden = false;
    pwInput.focus();

    function cleanup() {
      pwOverlay.hidden = true;
      pwSubmit.removeEventListener('click', onSubmit);
      pwCancel.removeEventListener('click', onCancel);
      pwInput.removeEventListener('keydown', onKeydown);
    }
    async function onSubmit() {
      const ok = await checkPassword(deckId, pwInput.value);
      if (ok) {
        localStorage.setItem(unlockedKey(deckId), '1');
        cleanup();
        resolve(true);
      } else {
        pwError.hidden = false;
        pwInput.value = '';
        pwInput.focus();
      }
    }
    function onCancel() {
      cleanup();
      resolve(false);
    }
    function onKeydown(e) {
      if (e.key === 'Enter') { e.preventDefault(); onSubmit(); }
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
    }
    pwSubmit.addEventListener('click', onSubmit);
    pwCancel.addEventListener('click', onCancel);
    pwInput.addEventListener('keydown', onKeydown);
  });
}

// ---------- Suche ----------
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
let searchIndexPromise = null;
let searchDebounceTimer = null;

function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch('data/search-index.json').then(r => r.json());
  }
  return searchIndexPromise;
}

function norm(str) {
  return (str || '').toLowerCase()
    .replaceAll('ä', 'a').replaceAll('ö', 'o').replaceAll('ü', 'u').replaceAll('ß', 'ss');
}

function renderSearchResults(matches, query) {
  if (!matches.length) {
    searchResults.innerHTML = `<div class="searchempty">Keine Treffer für „${query}“.</div>`;
    searchResults.hidden = false;
    return;
  }
  searchResults.innerHTML = matches.slice(0, 30).map(m => `
    <button type="button" class="searchresult" data-deck="${m.deckId}" data-nr="${m.nr}">
      <span class="sr-code" style="background:${m.farbe};">${m.code}</span>
      <span class="sr-body">
        <span class="sr-titel">${m.titel}</span>
        <span class="sr-deck">${m.deckTitel} · Karte ${String(m.nr).padStart(2, '0')}</span>
      </span>
    </button>
  `).join('');
  searchResults.hidden = false;
  searchResults.querySelectorAll('.searchresult').forEach(btn => {
    btn.addEventListener('click', () => {
      const deckId = btn.getAttribute('data-deck');
      const nr = parseInt(btn.getAttribute('data-nr'), 10);
      clearSearch();
      openDeck(deckId, { targetNr: nr });
    });
  });
}

function clearSearch() {
  searchInput.value = '';
  searchResults.hidden = true;
  searchResults.innerHTML = '';
}

function runSearch(rawQuery) {
  const query = rawQuery.trim();
  if (query.length < 2) {
    searchResults.hidden = true;
    searchResults.innerHTML = '';
    return;
  }
  loadSearchIndex().then(index => {
    const q = norm(query);
    const matches = index.filter(entry => norm(entry.titel).includes(q) || norm(entry.text).includes(q));
    renderSearchResults(matches, query);
  });
}

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchDebounceTimer);
  const val = e.target.value;
  searchDebounceTimer = setTimeout(() => runSearch(val), 150);
});
searchInput.addEventListener('focus', () => loadSearchIndex());
document.addEventListener('click', (e) => {
  if (!searchResults.hidden && !e.target.closest('.searchwrap')) {
    searchResults.hidden = true;
  }
});

// Setzt Titel + apple-touch-icon passend zum offenen Deck, damit "Zum Home-Bildschirm
// hinzufügen" (während das Deck offen ist) ein eigenes, unterscheidbares Icon + einen
// eigenen Namen für genau dieses Deck übernimmt.
function setAppIdentity(deckOrNull) {
  if (!deckOrNull) {
    document.title = DEFAULT_TITLE;
    appleTouchIcon.setAttribute('href', DEFAULT_ICON);
    return;
  }
  document.title = `KLARTEXT – ${deckOrNull.titel}`;
  const deckIconUrl = `icons/deck-${deckOrNull.id}.png`;
  // Existenz-Check: falls für ein Deck noch kein eigenes Icon erzeugt wurde (z.B. neu
  // hinzugefügtes Deck), auf das allgemeine App-Icon zurückfallen statt ein kaputtes Bild.
  const probe = new Image();
  probe.onload = () => appleTouchIcon.setAttribute('href', deckIconUrl);
  probe.onerror = () => appleTouchIcon.setAttribute('href', DEFAULT_ICON);
  probe.src = deckIconUrl;
}

async function loadDecks() {
  const res = await fetch('data/decks.json');
  const decks = await res.json();
  allDecks = decks;
  deckCategories.innerHTML = '';

  KATEGORIE_ORDER.forEach(katId => {
    const inKat = decks.filter(d => d.kategorie === katId);
    if (!inKat.length) return;
    const kat = KATEGORIEN[katId];

    const block = document.createElement('section');
    block.className = 'katblock';
    block.innerHTML = `
      <h2 class="kattitel">${kat.titel}</h2>
      <p class="katsub">${kat.sub}</p>
    `;
    const grid = document.createElement('div');
    grid.className = 'deckgrid';

    inKat.forEach(d => {
      const btn = document.createElement('button');
      btn.className = 'decktile';
      btn.innerHTML = `
        <div class="dt-kopf" style="background:${d.farbe};">
          <span class="dt-code">${d.code}</span>
          <span class="dt-count">${d.anzahl} Karten</span>
        </div>
        <div class="dt-body">
          <div class="dt-titel">${d.titel}</div>
          <div class="dt-sub">${d.untertitel}</div>
        </div>
      `;
      btn.addEventListener('click', () => openDeck(d.id));
      grid.appendChild(btn);
    });

    block.appendChild(grid);
    deckCategories.appendChild(block);
  });
}

async function openDeck(deckId, opts = {}) {
  const { pushState = true, targetNr = null } = opts;

  if (accessMap[deckId] && !isDeckUnlocked(deckId)) {
    const meta = allDecks.find(d => d.id === deckId);
    const ok = await askForPassword(deckId, meta ? meta.titel : 'dieses Deck');
    if (!ok) {
      // Abgebrochen: bei Deep-Link (?deck=...) oder Sprung aus der Suche URL bereinigen,
      // sonst einfach auf der Übersicht bleiben (Kachel-Klick hat noch keine URL geändert).
      if (!pushState) closeDeck({ pushState: true });
      return;
    }
  }

  let res;
  try {
    res = await fetch(`data/${deckId}.json`);
    if (!res.ok) throw new Error('not found');
  } catch (e) {
    return; // unbekannte/veraltete Deck-ID im Link – still zurück zur Übersicht
  }
  currentDeck = await res.json();

  document.documentElement.style.setProperty('--deck-color', currentDeck.farbe);
  document.documentElement.style.setProperty('--deck-light', currentDeck.farbe_hell);
  document.documentElement.style.setProperty('--deck-border', currentDeck.farbe_rand);

  if (targetNr !== null) {
    // Direktsprung aus der Suche: Karte mit passender Nummer suchen, sonst erste Karte.
    const foundIdx = currentDeck.karten.findIndex(k => k.nr === targetNr);
    currentIndex = foundIdx >= 0 ? foundIdx : 0;
  } else {
    const saved = parseInt(localStorage.getItem(lastIndexKey(deckId)), 10);
    currentIndex = (!isNaN(saved) && saved >= 0 && saved < currentDeck.karten.length) ? saved : 0;
  }

  screenDecks.hidden = true;
  screenCards.hidden = false;
  backBtn.hidden = false;
  renderCard();
  window.scrollTo(0, 0);
  setAppIdentity(currentDeck);
  if (pushState) history.pushState({ deck: deckId }, '', `?deck=${deckId}`);
}

function closeDeck(opts = {}) {
  const { pushState = true } = opts;
  currentDeck = null;
  screenCards.hidden = true;
  screenDecks.hidden = false;
  backBtn.hidden = true;
  progressEl.textContent = '';
  window.scrollTo(0, 0);
  setAppIdentity(null);
  if (pushState) history.pushState({}, '', './');
}

function renderJahreskarte(karte) {
  const deck = currentDeck;
  cardBadge.hidden = true;
  frontImgWrap.hidden = true;
  frontIconWrap.hidden = true;
  cardTitelFront.hidden = true;
  genericBackScroll.hidden = true;
  jkFront.hidden = false;
  jkBack.hidden = false;

  const brainy = !!deck.brainy;
  jkWmFront.hidden = !brainy;
  jkWmBack.hidden = !brainy;
  if (brainy) {
    jkWmFront.src = 'images/jahreskarten/brainy-kopfstand.png';
    jkWmBack.src = 'images/jahreskarten/brainy-lupe.png';
  }

  jkSubtitleFront.textContent = deck.subtitle || deck.titel;
  jkSubtitleBack.textContent = deck.subtitle || deck.titel;
  jkPillFront.textContent = karte.pill || '';
  jkPillBack.textContent = karte.pill || '';
  jkIconFront.textContent = karte.icon_front || '';
  jkIconBack.textContent = deck.icon_back || '';
  jkLabelFront.textContent = deck.label_front || '';
  jkLabelBack.textContent = deck.label_back || '';
  jkTitelFront.textContent = karte.title_front || '';
  jkTitelBack.textContent = deck.label_back || '';
  jkFrageFront.textContent = karte.frage || karte.titel || '';
  jkFrageBack.textContent = karte.loesung || karte.hinweis || '';
  jkMottoImgFront.hidden = true;
  jkMottoImgBack.hidden = true;
  jkMottoFront.textContent = karte.front_line || '';
  jkMottoBack.textContent = deck.back_line || '';
  const fussTag = karte.pill || '';
  jkFussFront.textContent = fussTag ? `${fussTag} · Vorderseite` : 'Vorderseite';
  jkFussBack.textContent = fussTag ? `${fussTag} · Rückseite` : 'Rückseite';
}

function renderCard() {
  if (!currentDeck) return;
  const karte = currentDeck.karten[currentIndex];
  flashcard.classList.remove('flipped');

  if (karte.jahreskarte) {
    renderJahreskarte(karte);
    progressEl.textContent = `${karte.nr}/${currentDeck.karten.length}`;
    localStorage.setItem(lastIndexKey(currentDeck.id), String(currentIndex));
    return;
  }
  jkFront.hidden = true;
  jkBack.hidden = true;
  cardBadge.hidden = false;
  cardTitelFront.hidden = false;
  genericBackScroll.hidden = false;

  // Zusatzblock-Karten (z.B. EL-AT, LK-R-PF) tragen ihr eigenes Badge aus der Quelldatei -
  // das zeigt gleich an, dass es sich um einen Zusatzblock handelt, nicht nur die Kartennummer.
  cardBadge.textContent = karte.badge
    ? `${karte.badge} · ${String(karte.nr).padStart(2, '0')}/${currentDeck.karten.length}`
    : `${currentDeck.titel.toUpperCase()} · ${String(karte.nr).padStart(2, '0')}/${currentDeck.karten.length}`;
  cardTitelFront.textContent = karte.titel;
  cardTitelBack.textContent = karte.titel;

  // Kartenvorderseite: Foto (Standard-Impulskarten, TK-Deck) ODER Icon (Krisendeck/Werkzeug/mb,
  // die kein eigenes Foto haben, sondern ein Font-Awesome-Symbol als Erkennungszeichen).
  flashcard.classList.remove('textcard', 'has-watermark');
  if (karte.icon) {
    frontImgWrap.hidden = true;
    frontIconWrap.hidden = false;
    frontIcon.className = `fa-solid fa-${karte.icon}`;
  } else {
    frontIconWrap.hidden = true;
    frontImgWrap.hidden = false;
    cardImg.src = karte.bild;
    cardImg.alt = karte.titel;
  }

  // Kartenrückseite: zwei grundverschiedene Inhaltsformen. Standard-Impulskarten haben
  // "fragen" (Anleitung + offene Fragen zum Reflektieren). Handlungskarten (TK-Deck,
  // Krisendeck, Werkzeugkarten, Mobbing-Materialien) haben stattdessen "schritte"
  // (konkrete Handlungsanleitung) und optional eine Tun/Nicht-tun-Tabelle.
  const istHandlungskarte = Array.isArray(karte.schritte);

  if (istHandlungskarte) {
    impulsBack.hidden = true;
    handlungBack.hidden = false;

    if (karte.situation) {
      introWrap.hidden = false;
      introLabel.textContent = karte.intro_label || 'SITUATION';
      cardIntro.textContent = karte.situation;
    } else {
      introWrap.hidden = true;
    }

    schritteLabel.textContent = karte.schritte_label || 'SCHRITTE';
    cardSchritte.innerHTML = '';
    karte.schritte.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      cardSchritte.appendChild(li);
    });

    if (karte.abgrenzung && (karte.abgrenzung.tun || karte.abgrenzung.nicht_tun)) {
      abgrenzungWrap.hidden = false;
      const tun = karte.abgrenzung.tun || [];
      const nicht = karte.abgrenzung.nicht_tun || [];
      const rows = Math.max(tun.length, nicht.length);
      let html = '<tr><th class="th-tun">TUN</th><th class="th-nicht">NICHT TUN</th></tr>';
      for (let i = 0; i < rows; i++) {
        html += `<tr><td class="td-tun">${tun[i] || ''}</td><td class="td-nicht">${nicht[i] || ''}</td></tr>`;
      }
      cardAbgrenzung.innerHTML = html;
    } else {
      abgrenzungWrap.hidden = true;
    }

    const notiz = karte.tipp || karte.merksatz || karte.verweis || karte.nutzen || karte.quelle;
    if (notiz) {
      notizWrap.hidden = false;
      notizLabel.textContent = karte.tipp ? 'TIPP FÜR DICH' : karte.merksatz ? 'MERKSATZ' : karte.verweis ? 'HINWEIS' : karte.nutzen ? 'NUTZEN' : 'QUELLE';
      cardNotiz.textContent = notiz;
    } else {
      notizWrap.hidden = true;
    }
  } else {
    handlungBack.hidden = true;
    impulsBack.hidden = false;

    cardAnleitung.textContent = karte.anleitung;

    cardFragen.innerHTML = '';
    (karte.fragen || []).forEach(f => {
      const box = document.createElement('div');
      box.className = 'frage-box';
      box.textContent = f;
      cardFragen.appendChild(box);
    });
    fragenWrap.hidden = !(karte.fragen && karte.fragen.length);

    if (karte.systemfrage) {
      systemfrageWrap.hidden = false;
      systemfrageLabel.textContent = karte.systemfrage_label || 'SYSTEMISCH GEDACHT';
      cardSystemfrage.textContent = karte.systemfrage;
    } else {
      systemfrageWrap.hidden = true;
    }

    if (karte.hinweis) {
      hinweisWrap.hidden = false;
      cardHinweis.textContent = karte.hinweis;
    } else {
      hinweisWrap.hidden = true;
    }
  }

  progressEl.textContent = `${karte.nr}/${currentDeck.karten.length}`;
  localStorage.setItem(lastIndexKey(currentDeck.id), String(currentIndex));
}

function flip() {
  flashcard.classList.toggle('flipped');
}

function goNext() {
  if (!currentDeck) return;
  currentIndex = (currentIndex + 1) % currentDeck.karten.length;
  renderCard();
}

function goPrev() {
  if (!currentDeck) return;
  currentIndex = (currentIndex - 1 + currentDeck.karten.length) % currentDeck.karten.length;
  renderCard();
}

function goRandom() {
  if (!currentDeck || currentDeck.karten.length < 2) return;
  let next;
  do { next = Math.floor(Math.random() * currentDeck.karten.length); } while (next === currentIndex);
  currentIndex = next;
  renderCard();
}

flashcard.addEventListener('click', flip);
flashcard.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
});
prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goPrev(); });
nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goNext(); });
shuffleBtn.addEventListener('click', (e) => { e.stopPropagation(); goRandom(); });
backBtn.addEventListener('click', closeDeck);

// Einfaches Swipe-Gestensteuerung
let touchStartX = null;
flashcard.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
flashcard.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) {
    dx < 0 ? goNext() : goPrev();
  }
  touchStartX = null;
}, { passive: true });

// Tastatur (Desktop-Test)
document.addEventListener('keydown', (e) => {
  if (screenCards.hidden) return;
  if (e.key === 'ArrowRight') goNext();
  if (e.key === 'ArrowLeft') goPrev();
  if (e.key === ' ') { e.preventDefault(); flip(); }
});

// Zurück/Vor-Buttons des Browsers respektieren (falls genutzt), ohne neuen History-Eintrag
window.addEventListener('popstate', () => {
  const deckId = new URLSearchParams(location.search).get('deck');
  if (deckId) openDeck(deckId, { pushState: false });
  else closeDeck({ pushState: false });
});

// Deep-Link beim Start: ?deck=<id> öffnet direkt dieses Deck (z.B. eigenes Home-Bildschirm-Icon
// pro Deck) — fragt dabei automatisch den Zugangscode ab (über openDeck), falls das Deck auf
// diesem Gerät noch nicht freigeschaltet ist.
Promise.all([loadDecks(), loadAccess()]).then(() => {
  const deckId = new URLSearchParams(location.search).get('deck');
  if (deckId) openDeck(deckId, { pushState: false });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
