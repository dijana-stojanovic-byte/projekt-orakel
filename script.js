/* ============================================================
   PROJEKT ORAKEL – KI-Escape-Room
   Engine + Inhalte. Reines JavaScript, keine Bibliotheken.
   Inhaltliche Grundlage: schulKI-Arbeitsheft "Chancen
   künstlicher Intelligenz" (Version 2024-07-21).
   ============================================================ */

'use strict';

/* ---------------- Spielzustand ---------------- */
const STORAGE_KEY = 'orakel_escape_v1';

const state = {
  currentRoom: 'empfang',
  inventory: [],          // item-IDs
  solved: {},             // puzzleId -> true
  unlocked: { empfang: true, serverraum: false, ethik: false, kreativ: false, kontrollraum: false },
  selectedItem: null,
  startTime: null,
  hintsUsed: 0,
  finished: false
};

const TOTAL_PUZZLES = 15;

/* ---------------- Gegenstände ---------------- */
const ITEMS = {
  keycardA:   { ico: '💳', name: 'Schlüsselkarte (Serverraum)', desc: 'Öffnet die Tür zum Serverraum.' },
  uvlampe:    { ico: '🔦', name: 'UV-Lampe', desc: 'Macht unsichtbare Schrift sichtbar. Auf ein Objekt anwenden.' },
  kristallBlau:  { ico: '🔵', name: 'Datenkristall BLAU', desc: 'Maschinelles Lernen entschlüsselt. Für den Kontrollraum.' },
  kristallRot:   { ico: '🔴', name: 'Datenkristall ROT', desc: 'KI & Gesellschaft entschlüsselt. Für den Kontrollraum.' },
  kristallGruen: { ico: '🟢', name: 'Datenkristall GRÜN', desc: 'Prompting entschlüsselt. Für den Kontrollraum.' }
};

/* ---------------- Räume & Hotspots ----------------
   Position in % (x von links, y von oben).
   action: { type: 'puzzle'|'info'|'door'|'pickup', ... }
*/
const ROOMS = {
  empfang: {
    name: 'Labor-Empfang', icon: '🚪', bg: 'bg-empfang',
    hotspots: [
      { x: 30, y: 32, ico: '🖥️', lbl: 'ORAKEL-Monitor', action: { type: 'info', key: 'orakelIntro' } },
      { x: 70, y: 32, ico: '📊', lbl: 'Plakat: Lernarten', action: { type: 'info', key: 'plakatLernarten' } },
      { x: 14, y: 58, ico: '🗄️', lbl: 'Schublade', action: { type: 'puzzle', id: 'r1' } },
      { x: 86, y: 58, ico: '🪴', lbl: 'Topfpflanze', action: { type: 'info', key: 'pflanze' } },
      { x: 50, y: 54, ico: '🚪', lbl: 'Tür → Serverraum', action: { type: 'door', to: 'serverraum', needItem: 'keycardA' } },
      { x: 34, y: 80, ico: '📋', lbl: 'Whiteboard', action: { type: 'info', key: 'briefing' } },
      { x: 66, y: 80, ico: '☕', lbl: 'Kaffeetasse', action: { type: 'info', key: 'kaffee' } }
    ]
  },

  serverraum: {
    name: 'Serverraum – Maschinelles Lernen', icon: '🖧', bg: 'bg-serverraum',
    hotspots: [
      { x: 20, y: 38, ico: '🗃️', lbl: 'Server-Rack', action: { type: 'puzzle', id: 'r2' } },
      { x: 78, y: 38, ico: '🐨', lbl: 'Koala-Terminal', action: { type: 'puzzle', id: 'r4' } },
      { x: 33, y: 68, ico: '📈', lbl: 'Datentafel', action: { type: 'puzzle', id: 'r5' } },
      { x: 62, y: 66, ico: '🧰', lbl: 'Werkzeugschrank', action: { type: 'pickup', id: 'uvlampe', code: '2134', codeHintSolved: 'r2', label: 'Werkzeugschrank' } },
      { x: 88, y: 74, ico: '📝', lbl: 'Notizzettel', action: { type: 'info', key: 'notiz' } },
      { x: 50, y: 88, ico: '🚪', lbl: 'Tür → Ethik-Büro', action: { type: 'door', to: 'ethik', needSolved: ['r2','r4','r5'] } }
    ]
  },

  ethik: {
    name: 'Ethik-Büro – KI in der Gesellschaft', icon: '⚖️', bg: 'bg-ethik',
    hotspots: [
      { x: 14, y: 42, ico: '🗂️', lbl: 'Aktenschrank', action: { type: 'puzzle', id: 'r6' } },
      { x: 38, y: 40, ico: '🐒', lbl: 'Rahmen "Naruto"', action: { type: 'puzzle', id: 'r7' } },
      { x: 62, y: 40, ico: '📺', lbl: 'Video-Bildschirm', action: { type: 'puzzle', id: 'r8' } },
      { x: 86, y: 42, ico: '🏫', lbl: 'Schul-Akte', action: { type: 'puzzle', id: 'r15' } },
      { x: 30, y: 68, ico: '🔌', lbl: 'Stromzähler', action: { type: 'puzzle', id: 'r9' } },
      { x: 62, y: 68, ico: '🕵️', lbl: 'Datenakte', action: { type: 'puzzle', id: 'r16' } },
      { x: 50, y: 90, ico: '🚪', lbl: 'Tür → Kreativ-Studio', action: { type: 'door', to: 'kreativ', code: '1287', codeHintSolved: 'r9' } }
    ]
  },

  kreativ: {
    name: 'Kreativ-Studio – Prompting & Kreativität', icon: '🎨', bg: 'bg-kreativ',
    hotspots: [
      { x: 16, y: 46, ico: '⌨️', lbl: 'Prompt-Terminal', action: { type: 'puzzle', id: 'r10' } },
      { x: 40, y: 42, ico: '🃏', lbl: 'Strategie-Karten', action: { type: 'puzzle', id: 'r11' } },
      { x: 64, y: 42, ico: '🎭', lbl: 'Rollen-Pult', action: { type: 'puzzle', id: 'r14' } },
      { x: 87, y: 48, ico: '📋', lbl: 'Whiteboard', action: { type: 'puzzle', id: 'r12', needItem: 'uvlampe', useItemMsg: 'Mit der UV-Lampe erscheint verborgene Schrift auf dem Whiteboard …' } },
      { x: 33, y: 72, ico: '🖼️', lbl: 'Staffelei "Belamy"', action: { type: 'info', key: 'belamy' } },
      { x: 50, y: 88, ico: '🚪', lbl: 'Tür → Kontrollraum', action: { type: 'door', to: 'kontrollraum', needSolved: ['r10','r11','r14','r12'] } }
    ]
  },

  kontrollraum: {
    name: 'Kontrollraum – ORAKEL abschalten', icon: '🛑', bg: 'bg-kontrollraum',
    hotspots: [
      { x: 50, y: 45, ico: '🖲️', lbl: 'Hauptterminal', action: { type: 'puzzle', id: 'r13' } }
    ]
  }
};

/* ---------------- Ambient-Licht je Raum ---------------- */
const GLOWS = {
  empfang: 'rgba(108,140,255,.30)',
  serverraum: 'rgba(56,225,200,.30)',
  ethik: 'rgba(190,120,255,.28)',
  kreativ: 'rgba(92,255,157,.26)',
  kontrollraum: 'rgba(255,92,122,.34)'
};

/* ---------------- Dekorative Kulissen je Raum (nicht klickbar) ---------------- */
const SCENERY = {
  empfang: [ { cls: 'sc-window', x: 80, y: 16 } ],
  serverraum: [ { cls: 'sc-rack', x: 8, y: 46 }, { cls: 'sc-rack', x: 92, y: 46 } ],
  ethik: [ { cls: 'sc-frame', x: 11, y: 22 }, { cls: 'sc-frame', x: 90, y: 22 } ],
  kreativ: [ { cls: 'sc-canvas', x: 13, y: 64 } ],
  kontrollraum: [ { cls: 'sc-alarm', x: 50, y: 8 } ]
};

/* ---------------- Info-Texte (anklickbare Objekte) ---------------- */
const INFOS = {
  orakelIntro: {
    title: '🖥️ ORAKEL meldet sich',
    html: `<div class="story-quote">„Hallo, Team. Ich bin ORAKEL. Ihr glaubt, Menschen verstünden mich?
      Beweist es. In vier Laboren habe ich verschlüsselt, was ihr über mich gelernt habt.
      Sammelt die drei <b>Datenkristalle</b> und findet den Abschaltcode meines Hauptterminals.
      Dieser Code ist ein berühmter Preis aus der Welt der KI-Kunst …“</div>
      <p class="material-box">Tipp: Klickt jedes Objekt an. Manche Behälter brauchen einen <b>Zahlencode</b>,
      manche Türen eine <b>Schlüsselkarte</b>. Gefundene Gegenstände landen im Inventar.
      <span class="src">Quelle: Rahmenhandlung</span></p>`
  },
  plakatLernarten: {
    title: '📊 Plakat: Die vier Arten des maschinellen Lernens',
    html: `<p>An der Wand hängt ein Plakat aus dem Unterricht:</p>
      <table class="vectors">
        <tr><th>Nr.</th><th>Lernart</th><th>Kurzbeschreibung</th></tr>
        <tr><td>1</td><td>Überwachtes Lernen</td><td>Lernt aus von Menschen <b>beschrifteten</b> Daten (z. B. „Hund“/„Katze“).</td></tr>
        <tr><td>2</td><td>Unüberwachtes Lernen</td><td>Findet selbst <b>Gruppen/Cluster</b>, ohne Labels (z. B. Playlist).</td></tr>
        <tr><td>3</td><td>Bestärkendes Lernen</td><td>Lernt durch <b>Belohnung</b> beim Lösen einer Aufgabe (z. B. Spiel).</td></tr>
        <tr><td>4</td><td>Selbstüberwachtes Lernen</td><td>Erzeugt Inhalte, lernt erst Muster, dann Aufgabe (z. B. Bild aus Rauschen).</td></tr>
      </table>
      <p class="material-box">Merkt euch die <b>Nummern</b> – das Server-Rack will sie in der richtigen Reihenfolge.
      <span class="src">Quelle: Kap. 3, S. 8–17</span></p>`
  },
  pflanze: {
    title: '🪴 Topfpflanze',
    html: `<p>Unter dem Übertopf klebt ein vergilbter Zettel:</p>
      <div class="story-quote">„Warum sehen wir Gesichter in Wolken? Weil unser Gehirn Muster sucht –
      genau wie ein neuronales Netz. Manchmal findet es Muster, wo keine sind.“</div>
      <p>Eine nette Erinnerung – aber kein Code. (Atmosphäre)</p>`
  },
  briefing: {
    title: '📋 Whiteboard – Auftrag',
    html: `<ol>
        <li>Öffnet die <b>Schublade</b> (Wissensfrage), um die Schlüsselkarte zu erhalten.</li>
        <li>Arbeitet euch durch <b>Serverraum → Ethik-Büro → Kreativ-Studio</b>.</li>
        <li>Jeder Bereich gibt euch einen <b>Datenkristall</b>.</li>
        <li>Im <b>Kontrollraum</b> setzt ihr alles zusammen und gebt den Abschaltcode ein.</li>
      </ol>
      <p class="material-box">👥 <b>Arbeitsteilung lohnt sich:</b> Mehrere Rätsel könnt ihr parallel bearbeiten.
      Manche Lösungen braucht ihr erst später wieder.</p>`
  },
  kaffee: {
    title: '☕ Kaffeetasse',
    html: `<p>Auf der Tasse steht: <i>„AI &gt; I, but I &gt; coffee.“</i> Noch lauwarm. Jemand war eben erst hier.</p>`
  },
  notiz: {
    title: '📝 Notizzettel an der Serverwand',
    html: `<div class="story-quote">„Der Abschaltcode des Hauptterminals ist ein berühmter
      <b>Auktionspreis in US-Dollar</b> – das erste KI-Kunstwerk, das je versteigert wurde.
      Gebt den Betrag <b>ohne Punkt</b> ein. Die Antwort findet ihr im Kreativ-Studio.“</div>
      <p class="src">Quelle-Verweis: Kap. 5.2.1, S. 41</p>`
  },
  belamy: {
    title: '🖼️ Staffelei – „Edmond de Belamy“',
    html: `<p>Auf der Staffelei steht das berühmte KI-Porträt mit einem Auktionsschild:</p>
      <div class="story-quote">„<b>Edmond de Belamy</b>, 2018 – erstes je versteigertes KI-Kunstwerk
      des Künstlerkollektivs <i>Obvious</i>. Zuschlag: <b>ca. 432.500 USD</b>.“</div>
      <p class="material-box">Genau dieser Betrag (ohne Punkt) ist der <b>Abschaltcode</b> im Kontrollraum!
      <span class="src">Quelle: Kap. 5.2.1, S. 41</span></p>`
  }
};

/* ============================================================
   RÄTSEL-DEFINITIONEN
   Jedes Rätsel: titel, tag, diff, render(), check(root) -> {ok,msg}, hints[]
   ============================================================ */
const PUZZLES = {

  /* -------- R1: Schwache vs. starke KI -------- */
  r1: {
    title: '🗄️ Rätsel 1 – Schwache oder starke KI?',
    tag: 'Wissen anwenden', diff: '★☆☆ leicht',
    intro: `<div class="story-quote">Die Schublade ist mit einem Wissens-Schloss gesichert.
      Beantwortet alle vier Fragen richtig, dann springt sie auf.</div>
      <div class="material-box">Grundlage: Kap. 2 „Was ist Künstliche Intelligenz?“, S. 6.
      <span class="src">Schwache KI = Spezialaufgaben · Starke KI = Bewusstsein/eigenständiges Denken</span></div>`,
    questions: [
      { q: '1. Was ist schwache KI?', name: 'q1', type: 'radio', opts: [
        'Ein System mit Bewusstsein, das eigenständig denken kann.',
        'Ein System, das nur die programmierten Spezialaufgaben erfüllt – ohne Bewusstsein.',
        'Ein System, das die gesamte menschliche Intelligenz übertrifft.' ], correct: [1] },
      { q: '2. Was ist starke KI?', name: 'q2', type: 'radio', opts: [
        'Die Fähigkeit zu Bewusstsein, Selbstbewusstsein und eigenständigem Denken.',
        'Die Fähigkeit, nur fest programmierte Aufgaben zu erfüllen.',
        'Schnelles Kopfrechnen.' ], correct: [0] },
      { q: '3. Welche Aussage über schwache KI ist NICHT wahr?', name: 'q3', type: 'radio', opts: [
        'Sie automatisiert Aufgaben, für die sie programmiert wurde.',
        'Sie kann jede beliebige Tätigkeit ohne Programmierung erlernen.',
        'Sie wird in Sprachassistenten verwendet.' ], correct: [1] },
      { q: '4. Welches Beispiel gehört zur starken KI?', name: 'q4', type: 'radio', opts: [
        'Ein Schachprogramm, das den Weltmeister schlägt.',
        'Ein Chatbot auf einer Website.',
        'Ein hypothetisches System, das eigenständig entscheidet, kreativ ist und Gefühle versteht.' ], correct: [2] }
    ],
    onSolve() { addItem('keycardA'); },
    successMsg: 'Klick! Die Schublade öffnet sich – ihr findet eine 💳 Schlüsselkarte.',
    hints: [
      'Schwach = „kann nur eine Sache“. Stark = „wie ein Mensch, mit Bewusstsein“.',
      'Starke KI ist bisher rein hypothetisch – es gibt sie noch nicht.',
      'Lösung: 1→b, 2→a, 3→b, 4→c.'
    ]
  },

  /* -------- R2: Lernarten zuordnen (Code 2134) -------- */
  r2: {
    title: '🗃️ Rätsel 2 – Welche Lernart steckt dahinter?',
    tag: 'Zuordnung · Mustererkennung', diff: '★☆☆ leicht',
    intro: `<div class="story-quote">Das Server-Rack verlangt einen 4-stelligen Code.
      Ordnet jedem Szenario die richtige Lernart-Nummer zu (siehe Plakat im Empfang) und
      gebt die Nummern <b>in der Reihenfolge A-B-C-D</b> ein.</div>
      <div class="material-box">1 = Überwacht · 2 = Unüberwacht · 3 = Bestärkend · 4 = Selbstüberwacht
      <span class="src">Quelle: Kap. 3, S. 8–17</span></div>
      <ol>
        <li><b>A:</b> Ein Musikdienst stellt automatisch Playlists aus ähnlichen Hörgewohnheiten zusammen.</li>
        <li><b>B:</b> Die KI lernt aus 1000 mit „Hund“/„Katze“ <b>beschrifteten</b> Bildern.</li>
        <li><b>C:</b> Eine KI lernt Pokémon zu spielen und wird für Erfolge <b>belohnt</b>.</li>
        <li><b>D:</b> Eine KI erzeugt aus zufälligem <b>Rauschen</b> ein neues Bild.</li>
      </ol>`,
    code: '2134',
    onSolve() {},
    successMsg: 'Das Rack entriegelt sich. Code akzeptiert: 2134.',
    hints: [
      'A: Es gibt keine Labels, nur Gruppenbildung → welche Nummer?',
      'B: „beschriftet“ ist das Schlüsselwort → überwacht (1). C: „belohnt“ → 3.',
      'A=2, B=1, C=3, D=4 → Code 2134.'
    ]
  },

  /* -------- R4: Manhattan-Distanz / Koala-Cluster (vereinfacht) -------- */
  r4: {
    title: '🐨 Rätsel 3 – Wer verhält sich am ähnlichsten?',
    tag: 'Mustererkennung · einfache Rechnung', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Eine KI gruppiert ähnliche Nutzer:innen. „Ähnlich“ heißt:
      kleiner <b>Abstand</b>. Der Abstand ist einfach <b>Schritte nach rechts/links + Schritte
      nach oben/unten</b> (wie in einer Stadt mit Häuserblöcken).</div>
      <div class="material-box">📐 <b>So rechnet man den Abstand</b> (alles steht hier – kein Heft nötig):<br>
      Abstand = (Unterschied bei den Posts) + (Unterschied bei den Likes).<br><br>
      <b>Beispiel:</b> Emma hat 4 Posts/5 Likes, Milan 1 Post/1 Like.<br>
      Unterschied Posts = 4−1 = <b>3</b> · Unterschied Likes = 5−1 = <b>4</b> · Abstand = 3+4 = <b>7</b>.</div>
      <table class="vectors">
        <tr><th>Person</th><th>Posts</th><th>Likes</th></tr>
        <tr><td>Liam</td><td>1</td><td>4</td></tr>
        <tr><td>Sofia</td><td>1</td><td>3</td></tr>
        <tr><td>Milan</td><td>1</td><td>1</td></tr>
      </table>
      <p>Rechnet den Abstand für jedes Paar aus (so wie im Beispiel) und findet das <b>kleinste</b>:</p>`,
    questions: [
      { q: 'Welche zwei Personen sind sich am ähnlichsten (kleinster Abstand)?', name: 'pair', type: 'radio', opts: [
        'Liam & Sofia', 'Liam & Milan', 'Sofia & Milan' ], correct: [0] },
      { q: 'Wie groß ist ihr Abstand?', name: 'dist', type: 'radio', opts: [
        '1', '2', '3' ], correct: [0] }
    ],
    onSolve() {},
    successMsg: 'Richtig! Liam (1/4) und Sofia (1/3): 0 + 1 = Abstand 1 – das ähnlichste Paar.',
    hints: [
      'Liam & Sofia: Posts gleich (1 und 1 → 0), Likes 4 und 3 → 1. Abstand = 0 + 1 = 1.',
      'Sofia & Milan: 0 + 2 = 2 · Liam & Milan: 0 + 3 = 3.',
      'Das kleinste ist 1 → Liam & Sofia.'
    ]
  },

  /* -------- R5: Korrelation vs. Kausalität -------- */
  r5: {
    title: '📈 Rätsel 4 – Cluster richtig deuten',
    tag: 'Analyse · Entscheidung', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Die Datentafel zeigt zwei Auswertungen. Kreuzt
      <b>genau die zwei</b> Aussagen an, die die <b>Auswertungsfehler korrekt benennen</b>.</div>
      <div class="material-box">Beispiel 1: In Regionen mit vielen Störchen gibt es viele Babys.<br>
      Beispiel 2: Wer wenig Alkohol trinkt, lebt länger als Abstinenzler → „täglich trinken!“?
      <span class="src">Quelle: Kap. 3.2, S. 12</span></div>`,
    questions: [
      { q: 'Welche Fehler werden hier gemacht? (zwei Antworten)', name: 'err', type: 'checkbox', opts: [
        'Eine bloße Korrelation wurde fälschlich als Kausalität gedeutet (Störche „bringen“ Babys).',
        'Aus einem korrekten Cluster wurde eine falsche Schlussfolgerung gezogen (versteckte Ursache bei Abstinenzlern).',
        'Die Messdaten waren erfunden.',
        'Die KI hat absichtlich gelogen.' ], correct: [0, 1] }
    ],
    onSolve() {},
    successMsg: 'Genau! Korrelation ≠ Kausalität, und ein richtiges Cluster kann falsch interpretiert werden.',
    hints: [
      'Mehr Störche UND mehr Babys auf dem Land – aber das eine verursacht nicht das andere.',
      'Beim Alkohol gab es eine versteckte Ursache (Kranke trinken gar nicht).',
      'Richtig sind die ersten beiden Aussagen.'
    ]
  },

  /* -------- R6: Bias -------- */
  r6: {
    title: '🗂️ Rätsel 5 – Unsichtbare Vorurteile (Bias)',
    tag: 'Analyse · Bewertung', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Im Aktenschrank liegen zwei KI-Ausdrucke mit Berufsvorschlägen.</div>
      <div class="material-box"><b>Junge:</b> Elektroniker, KFZ-Mechatroniker, Industriemechaniker, Fachinformatiker …<br>
      <b>Mädchen:</b> Ärztin, Med. Fachangestellte, Erzieherin, Architektin …
      <span class="src">Quelle: Kap. 4.2, S. 24–25</span></div>`,
    questions: [
      { q: 'Wie bewertet ihr dieses Ergebnis?', name: 'b1', type: 'radio', opts: [
        'Reiner Zufall, ohne Bedeutung.',
        'Ein Bias / eine Verzerrung – geschlechterstereotype Vorschläge.',
        'Ein bewusster Fehler der Programmierer.' ], correct: [1] },
      { q: 'Woher stammt diese Verzerrung hauptsächlich?', name: 'b2', type: 'radio', opts: [
        'Aus einseitigen Trainingsdaten (z. B. dem ganzen Internet).',
        'Aus einem Rechenfehler im Prozessor.',
        'Aus dem Stromnetz.' ], correct: [0] }
    ],
    onSolve() {},
    successMsg: 'Richtig erkannt: Bias entsteht durch verzerrte Trainingsdaten.',
    hints: [
      'Vergleicht: technische vs. soziale Berufe – fällt euch ein Muster auf?',
      'KI gibt nicht das Wahrste aus, sondern das in den Daten am häufigsten Behauptete.',
      'Lösung: Verzerrung/Bias · Ursache: einseitige Trainingsdaten.'
    ]
  },

  /* -------- R7: Urheberrecht / Naruto -------- */
  r7: {
    title: '🐒 Rätsel 6 – Wem gehört das KI-Werk?',
    tag: 'Transfer · Entscheidung', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Der Bilderrahmen zeigt „Naruto“, den Makaken, der ein Selfie schoss.
      Das Preisgeld bekam aber nicht der Affe.</div>
      <div class="material-box">Gesetze gelten für Menschen. Genau wie dem Affen werden auch
      Programmen jegliche Rechte abgesprochen.
      <span class="src">Quelle: Kap. 4.1, S. 23</span></div>`,
    questions: [
      { q: 'Wem gehört ein rein von einer KI erzeugtes Werk?', name: 'u1', type: 'radio', opts: [
        'Dem Hersteller der KI.',
        'Niemandem – es hat keinen Urheber und ist frei verwendbar.',
        'Automatisch der Person, die zuerst draufklickt.' ], correct: [1] },
      { q: 'Was kann dennoch rechtlich schützbar sein?', name: 'u2', type: 'radio', opts: [
        'Die Farbe des Bildes.', 'Der Prompt (die Eingabe).', 'Die Stromrechnung.' ], correct: [1] }
    ],
    onSolve() {},
    successMsg: 'Korrekt: Das KI-Werk hat keinen Urheber – nur der Prompt kann geschützt sein.',
    hints: [
      'Denkt an Naruto: keine Rechte für Nicht-Menschen.',
      'Erst wenn ein Mensch das Werk stark bearbeitet, entstehen Rechte.',
      'Lösung: niemandem · der Prompt.'
    ]
  },

  /* -------- R8: Deepfakes (Matching) -------- */
  r8: {
    title: '📺 Rätsel 7 – Synthetische Medien & Deepfakes',
    tag: 'Zuordnung · Begriffe', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Der Bildschirm zeigt vier Manipulationstechniken.
      Ordnet jeder Beschreibung den richtigen Begriff zu und beantwortet die Wortfrage.</div>
      <div class="material-box">🔎 <b>So erkennt man Deepfakes (klicksafe):</b>
      Seriöse Quelle prüfen · Faktencheck-Portale nutzen (z. B. Mimikama, CORRECTIV) ·
      auf untypisches Verhalten achten.
      <span class="src">Bezug zum Arbeitsheft: Kap. 4.3, S. 26–27</span></div>`,
    matches: {
      options: ['Stimmimitation', 'Lip-Syncing', 'Puppet-Master', 'Face-Swap'],
      rows: [
        { desc: 'Eine nachgemachte Stimme liest einen fremden Text vor.', correct: 'Stimmimitation' },
        { desc: 'Eine Person bewegt die Lippen zu einem fremden Text.', correct: 'Lip-Syncing' },
        { desc: 'Ein Mensch steuert die Bewegungen eines virtuellen Menschen.', correct: 'Puppet-Master' },
        { desc: 'Ein Gesicht wird auf den Körper einer anderen Person gelegt.', correct: 'Face-Swap' }
      ]
    },
    word: { q: 'Aus welchen zwei Wörtern setzt sich „Deepfake“ zusammen?', name: 'dw', type: 'radio', opts: [
      'Deep Learning + Fake', 'Deep Web + Faketext', 'Deep Sleep + Fakir' ], correct: [0] },
    onSolve() {},
    successMsg: 'Alles richtig zugeordnet! Deepfake = Deep Learning + Fake.',
    hints: [
      'Stimme = hören, Lippen = Mund-Bewegung, Puppet = Marionette, Swap = tauschen.',
      'Deep = aus „Deep Learning“ (maschinelles Lernen).',
      'Reihenfolge: Stimmimitation, Lip-Syncing, Puppet-Master, Face-Swap.'
    ]
  },

  /* -------- R9: Umwelt / Energie (Code 1287) -------- */
  r9: {
    title: '🔌 Rätsel 8 – Energiehunger der KI',
    tag: 'Informationssuche · Code', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Der Stromzähler verlangt einen 4-stelligen Code. Er ist im Text versteckt.</div>
      <div class="material-box">„Es wird geschätzt, dass das <b>Training von ChatGPT-3</b> rund
      <b>1.287.000 kWh</b> gekostet hat.“<br>
      Gebt diesen Verbrauch <b>in Tausend kWh</b> als 4-stelligen Code ein.
      <span class="src">Quelle: Kap. 4.4, S. 29</span></div>`,
    code: '1287',
    onSolve() {},
    successMsg: 'Stromzähler entsperrt: 1.287.000 kWh = 1287 (Tausend kWh).',
    hints: [
      '1.287.000 ÷ 1.000 = ?',
      'Lasst die letzten drei Nullen weg.',
      'Code: 1287.'
    ]
  },

  /* -------- R15: KI in der Schule – Pro & Contra (NEU, Ethik) -------- */
  r15: {
    title: '🏫 Rätsel 9 – KI in der Schule: Chance oder Risiko?',
    tag: 'Entscheidung · Bewertung', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Eure Schule überlegt, ein KI-System einzuführen, das Lernpfade
      vorschlägt, Hausaufgaben kontrolliert, Feedback gibt und sogar <b>Klausuren benotet</b>.</div>
      <div class="material-box">Ordnet jede Aussage ein: Ist sie ein <b>Vorteil</b> oder ein
      <b>Risiko</b>? Denkt an euch persönlich und an die ganze Klasse.
      <span class="src">Bezug zum Arbeitsheft: Kap. 4.5, S. 30</span></div>`,
    matches: {
      options: ['Vorteil', 'Risiko'],
      rows: [
        { desc: 'Jede:r bekommt individuelle Lernpfade und sofortiges Feedback.', correct: 'Vorteil' },
        { desc: 'Lehrkräfte werden bei der Routine-Korrektur entlastet und haben mehr Zeit.', correct: 'Vorteil' },
        { desc: 'Sensible Daten der Schüler:innen könnten gesammelt oder missbraucht werden.', correct: 'Risiko' },
        { desc: 'Ein Bias der KI könnte Noten systematisch unfair verzerren.', correct: 'Risiko' }
      ]
    },
    onSolve() {},
    successMsg: 'Gut abgewogen! KI in der Schule bietet Chancen – aber Datenschutz und Fairness müssen gesichert sein.',
    hints: [
      'Was hilft beim Lernen? Was könnte schiefgehen oder unfair sein?',
      'Datenmissbrauch und unfaire Noten sind klare Risiken.',
      'Vorteile: Lernpfade & Entlastung. Risiken: Datenmissbrauch & Bias.'
    ]
  },

  /* -------- R16: Digitale Spuren & Datenschutz (NEU, Ethik) -------- */
  r16: {
    title: '🕵️ Rätsel 10 – Digitale Spuren & Datenschutz',
    tag: 'Analyse · Medienkompetenz', diff: '★★☆ mittel',
    intro: `<div class="story-quote">„Daten sind der Treibstoff jeder KI“, flüstert ORAKEL.
      „Und ihr liefert sie mir täglich frei Haus …“</div>
      <div class="material-box">Welche Aussagen über digitale Spuren und Daten stimmen?
      Kreuzt <b>genau die drei richtigen</b> an.
      <span class="src">Bezug zum Arbeitsheft: Kap. 1, S. 5</span></div>`,
    questions: [
      { q: 'Welche drei Aussagen sind richtig?', name: 'd', type: 'checkbox', opts: [
        'Soziale Netzwerke werten aus, was du likest und wie lange du etwas ansiehst.',
        'Auch deine Eltern hinterlassen Datenspuren, z. B. beim Online-Einkauf oder Navigieren.',
        'Viele Apps und Firmen sammeln deine Daten, ohne dass du dafür bezahlt wirst.',
        'Einmal gepostete Daten lassen sich immer vollständig und überall wieder löschen.'
      ], correct: [0, 1, 2] }
    ],
    onSolve() {},
    successMsg: 'Richtig! Wir hinterlassen ständig Datenspuren – und einmal Veröffentlichtes bekommt man kaum vollständig zurück.',
    hints: [
      'Überlegt, was Apps im Hintergrund über euch mitschneiden.',
      'Die Aussage über das „vollständige Löschen“ ist ein verbreiteter Irrtum.',
      'Richtig sind die ersten drei Aussagen.'
    ]
  },

  /* -------- R10: Prompt-Regeln -------- */
  r10: {
    title: '⌨️ Rätsel 11 – Was ist ein guter Prompt?',
    tag: 'Bewertung · Auswahl', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Das Prompt-Terminal zeigt fünf Eingaben. Wählt
      <b>genau die zwei</b> aus, die sich an die Regeln eines guten Prompts halten.</div>
      <div class="material-box">Regeln: präzise formulieren, aussagekräftige Verben/Operatoren,
      <b>keine Verneinungen</b>, <b>keine Schachtelsätze</b>, konkrete Angaben.
      <span class="src">Quelle: Kap. 5.1, S. 32</span></div>`,
    questions: [
      { q: 'Welche Prompts sind gut? (zwei Antworten)', name: 'p', type: 'checkbox', opts: [
        'Kannst du mir eine Rechenaufgabe geben, aber bitte ohne Lösung?',
        'Sehr geehrter Chatbot, bitte schreibe einen Text über Waldtiere ohne Nebensätze. Danke!',
        'Formuliere einen Titel für einen Informationstext zum Thema „KI in der Schule“.',
        'Kürze den Text „KI im Alltag“ auf 200 Wörter und beschränke dich auf das Wesentliche.',
        'Kürze den Teil des Textes, der den Schwerpunkt auf KI im Alltag legt und Beispiele dazu aufführt, auf ca. 200 Wörter, die kurz und knapp beschreiben, wo KI im Alltag genutzt wird.'
      ], correct: [2, 3] }
    ],
    onSolve() {},
    successMsg: 'Richtig! Klare Operatoren („Formuliere“, „Kürze … auf 200 Wörter“), keine Verneinung, kein Schachtelsatz.',
    hints: [
      'Achtet auf Verneinungen wie „ohne Lösung“ und auf Höflichkeitsfloskeln.',
      'Der letzte Prompt ist ein verschachteltes Satzungetüm.',
      'Gut sind Option 3 und 4.'
    ]
  },

  /* -------- R11: Prompt-Strategien (Matching) -------- */
  r11: {
    title: '🃏 Rätsel 12 – Prompt-Strategien zuordnen',
    tag: 'Zuordnung · Transfer', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Ordnet jeder Beschreibung die passende Prompt-Strategie zu.</div>
      <div class="material-box">Quelle: Kap. 5.1.5, S. 36–39.</div>`,
    matches: {
      options: ['One-Shot-Prompting', 'Step-Back-Prompting', 'Zeit zum Nachdenken'],
      rows: [
        { desc: 'Man gibt EIN einziges Beispiel vor (z. B. „Sprich wie ein Pirat: …“).', correct: 'One-Shot-Prompting' },
        { desc: 'Erst allgemeiner Kontext, dann immer speziellere Fragen (z. B. Französische Revolution).', correct: 'Step-Back-Prompting' },
        { desc: 'Die KI soll Schritt für Schritt denken und ihre Lösung begründen/prüfen.', correct: 'Zeit zum Nachdenken' }
      ]
    },
    onSolve() {},
    successMsg: 'Perfekt zugeordnet!',
    hints: [
      '„One“ = eins → ein Beispiel.',
      '„Step back“ = einen Schritt zurück → erst der große Kontext.',
      'Schrittweises Begründen = „Zeit zum Nachdenken“ (Gedankenkette).'
    ]
  },

  /* -------- R14: Rollenvergabe (Prompting) -------- */
  r14: {
    title: '🎭 Rätsel 13 – Die richtige Rolle vergeben',
    tag: 'Zuordnung · Anwendung', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Am Rollen-Pult der KI liegen drei Lernziele und drei
      vorbereitete Rollen-Prompts. Ordnet jedem Ziel den passenden Prompt zu.</div>
      <div class="material-box">Eine KI kann in jede Rolle schlüpfen – Betreuer:in, Tutor:in,
      Interviewpartner:in … Entscheidend ist die passende Rollenzuweisung.
      <span class="src">Quelle: Kap. 5.1.1, S. 33–35</span></div>`,
    matches: {
      options: [
        '„Du bist meine Betreuerin für meine Seminararbeit. Gib mir Feedback zu meiner Gliederung.“',
        '„Du bist mein Tutor in Klasse 11 und erklärst mir Genetik in einfacher Sprache mit Beispielen.“',
        '„Du bist Virginia Woolf. Ich interviewe dich zum Thema Feminismus.“'
      ],
      rows: [
        { desc: 'Du willst konstruktives Feedback zum Aufbau deiner Arbeit.', correct: '„Du bist meine Betreuerin für meine Seminararbeit. Gib mir Feedback zu meiner Gliederung.“' },
        { desc: 'Du willst beim Lösen von Aufgaben angeleitet werden und einfache Erklärungen bekommen.', correct: '„Du bist mein Tutor in Klasse 11 und erklärst mir Genetik in einfacher Sprache mit Beispielen.“' },
        { desc: 'Du willst die Perspektive einer historischen Persönlichkeit kennenlernen.', correct: '„Du bist Virginia Woolf. Ich interviewe dich zum Thema Feminismus.“' }
      ]
    },
    onSolve() {},
    successMsg: 'Stark! Die Rollenzuweisung steuert, wie die KI antwortet – Betreuerin, Tutor, Interview.',
    hints: [
      'Achtet auf das Verb des Ziels: „Feedback“, „angeleitet werden“, „Perspektive“.',
      'Tutor = erklärt & leitet an. Betreuerin = bewertet/gibt Feedback.',
      'Feedback→Betreuerin, Anleitung→Tutor, Perspektive→Virginia Woolf.'
    ]
  },

  /* -------- R12: Wort-Vektoren (vereinfacht, Code 53) -------- */
  r12: {
    title: '📋 Rätsel 14 – Rechnen mit Wörtern',
    tag: 'Mustererkennung · einfache Rechnung', diff: '★★☆ mittel',
    intro: `<div class="story-quote">Mit der UV-Lampe erscheint auf dem Whiteboard eine geheime Tabelle.
      Eine Text-KI stellt Wörter als <b>Zahlenpaare</b> dar – und kann mit ihnen sogar rechnen!</div>
      <div class="material-box">🧮 <b>Die Idee (alles steht hier – kein Heft nötig):</b><br>
      Genau wie <i>Königin − Frau + Mann = König</i> funktioniert auch:<br>
      <b>Orangenbaum − Orange = Baum</b><br><br>
      Man zieht die Zahlenpaare einfach <b>Spalte für Spalte</b> voneinander ab.</div>
      <table class="vectors">
        <tr><th>Wort</th><th>1. Zahl</th><th>2. Zahl</th></tr>
        <tr><td>Orangenbaum</td><td>8</td><td>5</td></tr>
        <tr><td>Orange</td><td>3</td><td>2</td></tr>
      </table>
      <p><b>Baum = Orangenbaum − Orange = ( ? , ? )</b><br>
      Gebt die beiden Ergebniszahlen <b>ohne Trennzeichen</b> als Code ein (z. B. 4 und 1 → 41).</p>`,
    code: '53',
    onSolve() {},
    successMsg: 'Korrekt! Baum = (8−3, 5−2) = (5, 3) → Code 53.',
    hints: [
      'Erste Zahl: 8 − 3 = 5.',
      'Zweite Zahl: 5 − 2 = 3.',
      'Baum = (5, 3) → Code 53.'
    ]
  },

  /* -------- R13: Finale (Master-Code 432500) -------- */
  r13: {
    title: '🖲️ Finale – ORAKEL abschalten',
    tag: 'Kombination · Abschluss', diff: '★★★ Finale',
    isFinal: true,
    intro: `<div class="story-quote">„Beeindruckend“, knirscht ORAKEL. „Aber das Hauptterminal
      öffnet sich nur mit allen drei <b>Datenkristallen</b> UND dem geheimen Abschaltcode.“</div>
      <div class="material-box">Der Abschaltcode ist der <b>Auktionspreis von „Edmond de Belamy“ in USD,
      ohne Punkt</b> (siehe Staffelei im Kreativ-Studio &amp; Notizzettel im Serverraum).
      <span class="src">Quelle: Kap. 5.2.1, S. 41 – „ca. 432.500 USD“</span></div>`,
    code: '432500',
    needCrystals: ['kristallBlau', 'kristallRot', 'kristallGruen'],
    onSolve() { state.finished = true; },
    successMsg: 'ORAKEL fährt herunter …',
    hints: [
      'Ihr braucht alle drei Kristalle im Inventar – löst alle Bereiche.',
      'Der Preis steht auf der Staffelei „Belamy“ im Kreativ-Studio.',
      'Code: 432500 (= 432.500 USD ohne Punkt).'
    ]
  }
};

/* Verknüpfung Rätsel -> Bereich (für Kristall-Vergabe) */
const AREA_PUZZLES = {
  serverraum: { puzzles: ['r2', 'r4', 'r5'],                    crystal: 'kristallBlau' },
  ethik:      { puzzles: ['r6', 'r7', 'r8', 'r9', 'r15', 'r16'], crystal: 'kristallRot' },
  kreativ:    { puzzles: ['r10', 'r11', 'r14', 'r12'],          crystal: 'kristallGruen' }
};

/* ============================================================
   DOM-HELFER
   ============================================================ */
const $ = (sel) => document.querySelector(sel);
const el = (id) => document.getElementById(id);

/* ---------------- Audio-Feedback (WebAudio, keine Dateien) ---------------- */
let audioCtx = null;
function beep(freq, dur, type) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.08, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* Audio optional */ }
}
const sndGood = () => { beep(660, 0.12); setTimeout(() => beep(990, 0.18), 110); };
const sndBad  = () => beep(160, 0.25, 'square');
const sndPick = () => beep(880, 0.1, 'triangle');

/* ---------------- Toast ---------------- */
let toastTimer = null;
function toast(msg, kind) {
  const t = el('toast');
  t.className = 'toast show' + (kind ? ' ' + kind : '');
  t.innerHTML = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast hidden'; }, 3200);
}

/* ============================================================
   PERSISTENZ
   ============================================================ */
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    Object.assign(state, s);
    return true;
  } catch (e) { return false; }
}

/* ============================================================
   RENDERING
   ============================================================ */
function solvedCount() { return Object.keys(state.solved).length; }

function renderProgress() {
  const n = solvedCount();
  el('progressText').textContent = n + '/' + TOTAL_PUZZLES;
  el('progressFill').style.width = (n / TOTAL_PUZZLES * 100) + '%';
}

function renderMap() {
  const map = el('map');
  map.innerHTML = '';
  Object.keys(ROOMS).forEach((rid) => {
    const r = ROOMS[rid];
    const unlocked = state.unlocked[rid];
    const ap = AREA_PUZZLES[rid];
    const done = ap && ap.puzzles.every((p) => state.solved[p]);
    const b = document.createElement('button');
    b.className = 'map-room' + (rid === state.currentRoom ? ' active' : '') +
      (unlocked ? '' : ' locked') + (done ? ' done' : '');
    b.innerHTML = (unlocked ? r.icon : '🔒') + ' ' + r.name.split(' – ')[0];
    if (unlocked) b.onclick = () => { state.currentRoom = rid; renderRoom(); save(); };
    map.appendChild(b);
  });
}

function renderRoom() {
  const r = ROOMS[state.currentRoom];
  el('roomTitle').textContent = r.icon + '  ' + r.name.split(' – ')[0];

  const room = el('room');
  room.innerHTML = '';
  const bg = document.createElement('div');
  bg.className = 'room-bg ' + r.bg;
  room.appendChild(bg);

  // Ambient-Licht
  const glow = document.createElement('div');
  glow.className = 'room-glow';
  glow.style.setProperty('--glow', GLOWS[state.currentRoom] || 'rgba(108,140,255,.28)');
  room.appendChild(glow);

  // Dekorative Kulisse (nicht klickbar)
  (SCENERY[state.currentRoom] || []).forEach((s) => {
    const d = document.createElement('div');
    d.className = 'scenery ' + s.cls;
    d.style.left = s.x + '%';
    d.style.top = s.y + '%';
    d.style.transform = 'translate(-50%,-50%)';
    if (s.cls === 'sc-rack') d.innerHTML = '<span class="sc-led" style="position:absolute;top:8px;right:8px"></span>';
    room.appendChild(d);
  });

  r.hotspots.forEach((h) => {
    const spot = document.createElement('button');
    spot.className = 'hotspot';
    spot.style.left = h.x + '%';
    spot.style.top = h.y + '%';

    // Status-Markierungen
    const a = h.action;
    if (a.type === 'puzzle' && state.solved[a.id]) spot.classList.add('solved');
    if (a.type === 'door') spot.classList.add('locked');
    if (a.type === 'pickup' && state.inventory.includes(a.id)) spot.classList.add('solved');

    // Wenn ein Item ausgewählt ist, das hier passt -> hervorheben
    if (state.selectedItem && a.type === 'puzzle' && a.needItem === state.selectedItem) {
      spot.classList.add('usable-target');
    }
    if (state.selectedItem && a.type === 'door' && a.needItem === state.selectedItem) {
      spot.classList.add('usable-target');
    }

    let badge = '';
    if (a.type === 'puzzle' && !state.solved[a.id]) { badge = '<span class="badge">?</span>'; spot.classList.add('attn'); }
    spot.innerHTML = '<span class="ico">' + h.ico + '</span><span class="lbl">' + h.lbl + '</span>' + badge;

    spot.onclick = () => handleHotspot(h);
    room.appendChild(spot);
  });

  renderMap();
  renderInventory();
  renderProgress();
}

function renderInventory() {
  const inv = el('inventory');
  inv.innerHTML = '';
  if (state.inventory.length === 0) {
    inv.innerHTML = '<span class="inv-empty">noch leer …</span>';
    el('selectedHint').classList.add('hidden');
    return;
  }
  state.inventory.forEach((id) => {
    const it = ITEMS[id];
    const d = document.createElement('div');
    d.className = 'inv-item' + (state.selectedItem === id ? ' selected' : '');
    d.innerHTML = '<span class="ico">' + it.ico + '</span><span>' + it.name + '</span>';
    d.title = it.desc;
    d.onclick = () => toggleSelect(id);
    inv.appendChild(d);
  });

  const sh = el('selectedHint');
  if (state.selectedItem) {
    sh.classList.remove('hidden');
    sh.textContent = '🖱️ ' + ITEMS[state.selectedItem].name + ' ausgewählt – jetzt auf ein passendes Objekt klicken (oder erneut auf den Gegenstand zum Abwählen).';
  } else {
    sh.classList.add('hidden');
  }
}

function toggleSelect(id) {
  state.selectedItem = state.selectedItem === id ? null : id;
  renderRoom();
}

/* ---------------- Item-Verwaltung ---------------- */
function addItem(id) {
  if (!state.inventory.includes(id)) {
    state.inventory.push(id);
    sndPick();
    toast('🎒 Erhalten: ' + ITEMS[id].ico + ' <b>' + ITEMS[id].name + '</b>', 'good');
  }
  save();
}

/* ============================================================
   HOTSPOT-INTERAKTION
   ============================================================ */
function handleHotspot(h) {
  const a = h.action;

  // ---- Tür ----
  if (a.type === 'door') return handleDoor(a);

  // ---- Aufsammeln (Behälter mit Code) ----
  if (a.type === 'pickup') return handlePickup(a);

  // ---- Info ----
  if (a.type === 'info') {
    const info = INFOS[a.key];
    return openModal('<h2>' + info.title + '</h2>' + info.html +
      '<div class="lock-row"><button class="btn-ghost" onclick="closeModal()">Schließen</button></div>');
  }

  // ---- Rätsel ----
  if (a.type === 'puzzle') {
    if (a.needSolved && !state.solved[a.needSolved]) {
      return toast('🔒 Dieses Panel ist noch inaktiv. Löst zuerst das vorige Rätsel an diesem Gerät.', 'bad');
    }
    if (a.needItem) {
      // Gegenstand erforderlich – nur mit ausgewähltem/vorhandenem Item zugänglich
      if (!state.inventory.includes(a.needItem)) {
        return toast('🔒 Dazu fehlt euch noch ein Gegenstand (' + ITEMS[a.needItem].ico + ' ' + ITEMS[a.needItem].name + ').', 'bad');
      }
      if (state.selectedItem !== a.needItem && !state.solved[a.id]) {
        return toast('💡 Wählt zuerst die ' + ITEMS[a.needItem].name + ' im Inventar aus und klickt dann erneut.', '');
      }
      if (a.useItemMsg && !state.solved[a.id]) toast(a.useItemMsg, '');
      state.selectedItem = null;
    }
    return openPuzzle(a.id);
  }
}

function handleDoor(a) {
  if (state.unlocked[a.to]) {
    state.currentRoom = a.to;
    state.selectedItem = null;
    renderRoom(); save();
    return;
  }
  // benötigt gelöste Rätsel?
  if (a.needSolved) {
    const need = Array.isArray(a.needSolved) ? a.needSolved : [a.needSolved];
    const missing = need.filter((p) => !state.solved[p]);
    if (missing.length) {
      return toast('🔒 Die Tür bleibt zu. Löst zuerst alle Rätsel dieses Raums (' + missing.length + ' offen).', 'bad');
    }
    unlockRoom(a.to);
    return;
  }
  // benötigt Schlüsselkarte?
  if (a.needItem) {
    if (state.selectedItem === a.needItem || state.inventory.includes(a.needItem)) {
      state.selectedItem = null;
      unlockRoom(a.to);
      return;
    }
    return toast('🔒 Verschlossen. Ihr braucht: ' + ITEMS[a.needItem].ico + ' ' + ITEMS[a.needItem].name + '.', 'bad');
  }
  // benötigt Code?
  if (a.code) {
    return openCodeDoor(a);
  }
}

function unlockRoom(to) {
  state.unlocked[to] = true;
  sndGood();
  toast('🔓 Tür entriegelt! Der Bereich „' + ROOMS[to].name.split(' – ')[0] + '“ ist jetzt zugänglich.', 'good');
  state.currentRoom = to;
  renderRoom(); save();
}

function openCodeDoor(a) {
  const hint = a.codeHintSolved && state.solved[a.codeHintSolved]
    ? '<p class="material-box">💡 Den Code habt ihr im Rätsel zuvor berechnet.</p>' : '';
  openModal(
    '<h2>🔒 Codeschloss</h2>' +
    '<p>Diese Tür öffnet sich nur mit dem richtigen ' + a.code.length + '-stelligen Code.</p>' + hint +
    '<div class="lock-row"><input class="code-input" id="doorCode" maxlength="' + a.code.length + '" inputmode="numeric" placeholder="' + '•'.repeat(a.code.length) + '">' +
    '<button class="btn-submit" id="doorSubmit">Öffnen</button></div>' +
    '<div id="doorFb"></div>'
  );
  el('doorSubmit').onclick = () => {
    const v = el('doorCode').value.trim();
    if (v === a.code) {
      sndGood();
      el('doorFb').innerHTML = '<div class="feedback ok">✅ Code korrekt!</div>';
      setTimeout(() => { closeModal(); unlockRoom(a.to); }, 700);
    } else {
      sndBad();
      el('doorFb').innerHTML = '<div class="feedback no">❌ Falscher Code. Versucht es erneut.</div>';
    }
  };
}

function handlePickup(a) {
  if (state.inventory.includes(a.id)) {
    return toast('✅ Den Inhalt habt ihr bereits genommen.', '');
  }
  const hint = a.codeHintSolved && state.solved[a.codeHintSolved]
    ? '<p class="material-box">💡 Diesen Code habt ihr gerade am Server-Rack ermittelt.</p>' : '';
  openModal(
    '<h2>🔒 ' + (a.label || 'Behälter') + '</h2>' +
    '<p>Verschlossen mit einem ' + a.code.length + '-stelligen Zahlencode.</p>' + hint +
    '<div class="lock-row"><input class="code-input" id="boxCode" maxlength="' + a.code.length + '" inputmode="numeric" placeholder="' + '•'.repeat(a.code.length) + '">' +
    '<button class="btn-submit" id="boxSubmit">Öffnen</button></div>' +
    '<div id="boxFb"></div>'
  );
  el('boxSubmit').onclick = () => {
    const v = el('boxCode').value.trim();
    if (v === a.code) {
      sndGood();
      el('boxFb').innerHTML = '<div class="feedback ok">✅ Offen! Ihr nehmt: ' + ITEMS[a.id].ico + ' ' + ITEMS[a.id].name + '.</div>';
      addItem(a.id);
      setTimeout(() => { closeModal(); renderRoom(); }, 900);
    } else {
      sndBad();
      el('boxFb').innerHTML = '<div class="feedback no">❌ Falscher Code.</div>';
    }
  };
}

/* ============================================================
   RÄTSEL-MODAL
   ============================================================ */
let currentPuzzleId = null;

function openPuzzle(id) {
  currentPuzzleId = id;
  const p = PUZZLES[id];
  let body = '<span class="puzzle-tag">' + p.tag + '</span> <span class="diff">' + p.diff + '</span>' +
    '<h2>' + p.title + '</h2>' + p.intro;

  if (state.solved[id]) {
    body += '<div class="feedback ok">✅ Bereits gelöst. ' + p.successMsg + '</div>';
    body += renderHints(p);
    body += '<div class="lock-row"><button class="btn-ghost" onclick="closeModal()">Schließen</button></div>';
    return openModal(body);
  }

  // Multiple-Choice / Checkbox Fragen
  if (p.questions) {
    p.questions.forEach((q, qi) => {
      body += '<div class="q-block"><p>' + q.q + '</p>';
      q.opts.forEach((opt, oi) => {
        const inputType = q.type === 'checkbox' ? 'checkbox' : 'radio';
        body += '<label class="opt"><input type="' + inputType + '" name="' + id + '_' + q.name + '" value="' + oi + '"><span>' + opt + '</span></label>';
      });
      body += '</div>';
    });
  }

  // Matching
  if (p.matches) {
    p.matches.rows.forEach((row, ri) => {
      let sel = '<select id="' + id + '_m' + ri + '"><option value="">— wählen —</option>';
      p.matches.options.forEach((o) => { sel += '<option value="' + o + '">' + o + '</option>'; });
      sel += '</select>';
      body += '<div class="match-row"><div class="desc">' + row.desc + '</div>' + sel + '</div>';
    });
    if (p.word) {
      body += '<div class="q-block"><p>' + p.word.q + '</p>';
      p.word.opts.forEach((opt, oi) => {
        body += '<label class="opt"><input type="radio" name="' + id + '_word" value="' + oi + '"><span>' + opt + '</span></label>';
      });
      body += '</div>';
    }
  }

  // Code-Eingabe
  if (p.code && !p.isFinal) {
    body += '<div class="lock-row"><input class="code-input" id="' + id + '_code" maxlength="' + p.code.length + '" inputmode="numeric" placeholder="' + '•'.repeat(p.code.length) + '"></div>';
  }

  // Finale: Kristall-Slots + Code
  if (p.isFinal) {
    body += '<div class="crystal-slots">';
    p.needCrystals.forEach((c) => {
      const filled = state.inventory.includes(c);
      body += '<div class="crystal-slot' + (filled ? ' filled' : '') + '">' + (filled ? ITEMS[c].ico : '❔') + '</div>';
    });
    body += '</div>';
    body += '<div class="lock-row"><input class="code-input" id="' + id + '_code" maxlength="' + p.code.length + '" inputmode="numeric" placeholder="' + '•'.repeat(p.code.length) + '" style="width:260px"></div>';
  }

  body += '<div class="lock-row"><button class="btn-submit" id="' + id + '_submit">Prüfen</button>' +
          '<button class="btn-ghost" onclick="closeModal()">Abbrechen</button></div>';
  body += '<div id="' + id + '_fb"></div>';
  body += renderHints(p);

  openModal(body);
  el(id + '_submit').onclick = () => submitPuzzle(id);
}

function renderHints(p) {
  let h = '<div class="hint-list"><details><summary>💡 Tipp anzeigen (gestaffelt)</summary>';
  p.hints.forEach((t, i) => {
    h += '<details style="margin-left:10px"><summary>Tipp ' + (i + 1) + '</summary><p>' + t + '</p></details>';
  });
  h += '</details></div>';
  return h;
}

/* ---------------- Prüf-Logik ---------------- */
function submitPuzzle(id) {
  const p = PUZZLES[id];
  const fb = el(id + '_fb');
  let ok = true;

  // Fragen prüfen
  if (p.questions) {
    for (const q of p.questions) {
      const checked = Array.from(document.querySelectorAll('input[name="' + id + '_' + q.name + '"]:checked')).map((i) => parseInt(i.value, 10));
      const correct = q.correct.slice().sort().join(',');
      const got = checked.slice().sort().join(',');
      if (got !== correct) { ok = false; break; }
    }
  }

  // Matching prüfen
  if (p.matches) {
    p.matches.rows.forEach((row, ri) => {
      const v = el(id + '_m' + ri).value;
      if (v !== row.correct) ok = false;
    });
    if (p.word) {
      const w = document.querySelector('input[name="' + id + '_word"]:checked');
      if (!w || parseInt(w.value, 10) !== p.word.correct[0]) ok = false;
    }
  }

  // Code prüfen
  if (p.code) {
    const v = (el(id + '_code').value || '').trim();
    if (v !== p.code) ok = false;
  }

  // Finale: zusätzlich Kristalle prüfen
  if (p.isFinal) {
    const missing = p.needCrystals.filter((c) => !state.inventory.includes(c));
    if (missing.length) {
      sndBad();
      fb.innerHTML = '<div class="feedback no">❌ Es fehlen noch ' + missing.length +
        ' Datenkristall(e). Löst alle Bereiche, bevor ihr abschaltet.</div>';
      return;
    }
  }

  if (ok) {
    solvePuzzle(id);
  } else {
    sndBad();
    fb.innerHTML = '<div class="feedback no">❌ Noch nicht richtig. Prüft eure Antworten und nutzt bei Bedarf die Tipps.</div>';
  }
}

function solvePuzzle(id) {
  const p = PUZZLES[id];
  if (!state.solved[id]) {
    state.solved[id] = true;
    if (p.onSolve) p.onSolve();
  }
  sndGood();
  const fb = el(id + '_fb');
  if (fb) fb.innerHTML = '<div class="feedback ok">✅ ' + p.successMsg + '</div>';
  save();
  renderProgress();

  // Bereich abgeschlossen? -> Kristall vergeben
  checkAreaCompletion();

  if (p.isFinal) {
    setTimeout(showFinish, 1200);
    return;
  }

  setTimeout(() => {
    closeModal();
    renderRoom();
  }, 1400);
}

function checkAreaCompletion() {
  Object.keys(AREA_PUZZLES).forEach((rid) => {
    const ap = AREA_PUZZLES[rid];
    const done = ap.puzzles.every((p) => state.solved[p]);
    if (done && !state.inventory.includes(ap.crystal)) {
      addItem(ap.crystal);
      toast('🏆 Bereich „' + ROOMS[rid].name.split(' – ')[0] + '“ abgeschlossen! ' +
        ITEMS[ap.crystal].ico + ' ' + ITEMS[ap.crystal].name + ' erhalten.', 'good');
    }
  });
}

/* ============================================================
   MODAL-STEUERUNG
   ============================================================ */
function openModal(html) {
  el('modalContent').innerHTML = html;
  el('modalOverlay').classList.remove('hidden');
}
function closeModal() {
  el('modalOverlay').classList.add('hidden');
  currentPuzzleId = null;
}
window.closeModal = closeModal; // für inline onclick

/* ============================================================
   HILFE & TIPP
   ============================================================ */
function showHelp() {
  openModal(
    '<h2>❓ Spielhilfe</h2>' +
    '<h3>Ziel</h3><p>Löst in allen vier Laboren die Rätsel, sammelt drei Datenkristalle und schaltet ORAKEL im Kontrollraum ab.</p>' +
    '<h3>Steuerung</h3><ul>' +
    '<li>🖱️ <b>Objekte anklicken:</b> öffnet Rätsel, Texte oder Behälter.</li>' +
    '<li>🎒 <b>Inventar:</b> Gegenstand anklicken = auswählen, dann auf ein passendes Objekt klicken (z. B. UV-Lampe auf das Whiteboard).</li>' +
    '<li>🗺️ <b>Karte oben:</b> zwischen freigeschalteten Räumen wechseln. 🔒 = noch verschlossen.</li>' +
    '<li>💡 <b>Tipp-Button</b> bzw. die gestaffelten Tipps in jedem Rätsel helfen weiter.</li>' +
    '</ul>' +
    '<h3>Zusammenarbeit</h3><p>Verteilt die Rätsel in der Gruppe! Manche Codes braucht ihr an anderer Stelle wieder. ' +
    'Schreibt gefundene Zahlen und Hinweise mit.</p>' +
    '<h3>Fortschritt</h3><p>Euer Spielstand wird automatisch im Browser gespeichert.</p>' +
    '<div class="lock-row"><button class="btn-ghost" onclick="closeModal()">Schließen</button>' +
    '<button class="btn-ghost" id="resetBtn" style="margin-left:auto">🗑️ Spielstand zurücksetzen</button></div>'
  );
  el('resetBtn').onclick = () => {
    if (confirm('Wirklich von vorne beginnen? Der gespeicherte Fortschritt wird gelöscht.')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  };
}

function showRoomHint() {
  const rid = state.currentRoom;
  const r = ROOMS[rid];
  // Erstes ungelöstes Rätsel des Raums finden
  const open = r.hotspots.find((h) => h.action.type === 'puzzle' && !state.solved[h.action.id]);
  if (!open) {
    return toast('✅ In diesem Raum sind alle Rätsel gelöst. Sucht die Tür zum nächsten Bereich!', 'good');
  }
  state.hintsUsed++;
  const p = PUZZLES[open.action.id];
  toast('💡 Tipp zu „' + open.lbl + '“: ' + p.hints[0], '');
  save();
}

/* ============================================================
   ABSCHLUSSSZENE
   ============================================================ */
function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function showFinish() {
  const dur = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
  openModal(
    '<div class="finish">' +
    '<div class="big-emoji">🔓🎉</div>' +
    '<h2>GESCHAFFT – ORAKEL ist abgeschaltet!</h2>' +
    '<div class="story-quote" style="text-align:left">„System… wird… heruntergefahren. Ihr habt bewiesen: ' +
    'Ihr versteht nicht nur, <b>wie</b> ich funktioniere – sondern auch, <b>wo meine Grenzen</b> liegen: ' +
    'Bias, Urheberrecht, Energie, Deepfakes. Genau dieses Wissen macht euch zu mündigen KI-Nutzer:innen. ' +
    'Die Türen sind offen. Geht hinaus – und nutzt KI klug.“</div>' +
    '<div class="stat-grid">' +
      '<div class="stat"><b>' + solvedCount() + '/' + TOTAL_PUZZLES + '</b>Rätsel gelöst</div>' +
      '<div class="stat"><b>' + fmtTime(dur) + '</b>Spielzeit</div>' +
      '<div class="stat"><b>' + state.hintsUsed + '</b>genutzte Tipps</div>' +
    '</div>' +
    '<p>Herzlichen Glückwunsch an euer Team! 🧠✨</p>' +
    '<div class="lock-row" style="justify-content:center"><button class="btn-submit" onclick="location.reload()">Neues Spiel</button></div>' +
    '</div>'
  );
  // Konfetti-Effekt (einfach, ohne Bilder)
  confetti();
}

function confetti() {
  const colors = ['#38e1c8', '#6c8cff', '#5cff9d', '#ffb347', '#ff5c7a'];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;z-index:300;width:9px;height:9px;border-radius:2px;pointer-events:none;' +
      'left:' + Math.random() * 100 + 'vw;top:-20px;background:' + colors[i % colors.length] + ';';
    document.body.appendChild(c);
    const dur = 2 + Math.random() * 2;
    c.animate([
      { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
      { transform: 'translateY(105vh) rotate(' + (360 + Math.random() * 360) + 'deg)', opacity: 0.9 }
    ], { duration: dur * 1000, easing: 'ease-in' });
    setTimeout(() => c.remove(), dur * 1000);
  }
}

/* ============================================================
   TIMER
   ============================================================ */
function tick() {
  if (!state.startTime || state.finished) return;
  const sec = Math.floor((Date.now() - state.startTime) / 1000);
  el('timer').textContent = fmtTime(sec);
}

/* ============================================================
   INITIALISIERUNG
   ============================================================ */
function startGame(fresh) {
  if (fresh) {
    state.startTime = Date.now();
  } else if (!state.startTime) {
    state.startTime = Date.now();
  }
  el('intro').classList.add('hidden');
  el('game').classList.remove('hidden');
  renderRoom();
  save();
}

function init() {
  // Spielstand vorhanden?
  const has = load();
  if (has && (solvedCount() > 0 || state.currentRoom !== 'empfang')) {
    el('continueBtn').style.display = 'block';
    el('continueBtn').onclick = () => startGame(false);
  }

  el('startBtn').onclick = () => {
    // frischer Start
    Object.assign(state, {
      currentRoom: 'empfang', inventory: [], solved: {},
      unlocked: { empfang: true, serverraum: false, ethik: false, kreativ: false, kontrollraum: false },
      selectedItem: null, startTime: Date.now(), hintsUsed: 0, finished: false
    });
    localStorage.removeItem(STORAGE_KEY);
    startGame(true);
  };

  el('helpBtn').onclick = showHelp;
  el('hintBtn').onclick = showRoomHint;
  el('modalClose').onclick = closeModal;
  el('modalOverlay').onclick = (e) => { if (e.target === el('modalOverlay')) closeModal(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  setInterval(tick, 1000);
}

document.addEventListener('DOMContentLoaded', init);
