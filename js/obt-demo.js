/* Chalet Althéa : données de démonstration pour le panneau de réservation OBT.
 *
 * Le panneau est le vrai script de l'application (obt-gestion.com/blocks/obt-booking.js), le même que
 * sur le site de T'Nature. Le chalet n'a pas encore de compte dans l'application : ce fichier répond à
 * sa place, dans le navigateur, pour une adresse factice (DEMO_API). Rien n'est lu dans l'application
 * et rien n'y est écrit ; la demande finale n'est envoyée nulle part.
 *
 * Tarifs et règles : ceux du site actuel du chalet et de la fiche de l'office de tourisme (octobre 2026) :
 * à partir de 850 € la nuit, 3 nuits au moins ; à la semaine du samedi au samedi pendant les vacances
 * de Noël et d'hiver (9 900 € à 12 600 € la semaine) ; taxe de séjour 3,50 € par adulte et par nuit.
 * Simplification à valider avec le propriétaire : 12 600 € les semaines de Noël et du Nouvel An,
 * 9 900 € les semaines des vacances d'hiver. Les séjours déjà pris sont inventés, pour montrer le planning.
 */
(function () {
  "use strict";
  var DEMO_API = "https://demo-althea.obt.invalid";
  var DEMO_ENVOI = "https://demo-althea.obt.invalid/envoi";

  var JOUR = 86400000;
  var iso = function (d) { return d.toISOString().slice(0, 10); };
  var date = function (s) { return new Date(s + "T00:00:00Z"); };
  var auj = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  var plus = function (n) { return iso(new Date(auj.getTime() + n * JOUR)); };

  // Vacances scolaires, du samedi au samedi (dates arrondies aux samedis, toutes zones réunies)
  var SEMAINES = [
    { start: "2026-12-19", end: "2027-01-02", semaine: 1260000, nom: "Noël et Nouvel An" },
    { start: "2027-02-06", end: "2027-03-06", semaine: 990000, nom: "vacances d’hiver" },
    { start: "2027-12-18", end: "2028-01-01", semaine: 1260000, nom: "Noël et Nouvel An" },
    { start: "2028-02-05", end: "2028-03-04", semaine: 990000, nom: "vacances d’hiver" },
  ];
  var NUIT = 85000;
  var semaineDe = function (s) { return SEMAINES.filter(function (p) { return p.start <= s && s < p.end; })[0]; };

  var CHALET = { id: "chalet-althea", name: "Chalet Althéa", kind: "gite", capacity: 12,
    note: "4 chambres en suite, 210 m² sur trois niveaux, spa, sauna, cinéma", image: "images/chalet/facade-crepuscule.jpg", minNights: 3 };
  // Pendant les vacances, l'arrivée se fait le samedi pour une semaine au moins
  var MIN_SEJOURS = SEMAINES.map(function (p) { return { start: p.start, end: iso(new Date(date(p.end).getTime() - JOUR)), minNights: 7 }; });

  var OCCUPE = [
    { start: plus(8), end: plus(12) },
    { start: plus(20), end: plus(24) },
    { start: "2026-12-26", end: "2027-01-02" },
    { start: "2027-02-13", end: "2027-02-20" },
  ];

  var OPTIONS = [
    { id: "taxe", name: "Taxe de séjour (par adulte et par nuit)", priceCents: 350, unit: "personne_nuit", mandatory: true, adultsOnly: true },
    { id: "menage", name: "Ménage un jour sur deux (hors séjours de 3 nuits)", priceCents: 0, unit: "sejour", included: true },
    { id: "linge", name: "Linge de lit et de bain, changé chaque semaine", priceCents: 0, unit: "sejour", included: true },
    { id: "cave", name: "Cave à vin et spiritueux en libre accès", priceCents: 0, unit: "sejour", included: true },
    { id: "fin", name: "Ménage de fin de séjour, cheminée préparée", priceCents: 0, unit: "sejour", included: true },
  ].map(function (o) {
    return { id: o.id, name: o.name, priceCents: o.priceCents, unit: o.unit, logementIds: [], appliesTo: "all",
      minGuests: null, minNights: null, included: !!o.included, mandatory: !!o.mandatory, maxGuests: null, maxNights: null,
      periodStart: null, periodEnd: null, includedGuests: null, adultsOnly: !!o.adultsOnly };
  });

  var CONDITIONS = [
    { id: "sejours", title: "Durée des séjours", body: "Séjours à partir de 3 nuits. Pendant les vacances scolaires de Noël et d’hiver, location à la semaine, du samedi 16 h au samedi 10 h." },
    { id: "paiement", title: "Paiement", body: "40 % à la réservation, 30 % un mois avant l’arrivée, le solde 8 jours avant l’arrivée. Caution de 4 000 € avant l’arrivée, par virement bancaire uniquement, restituée dans les 15 jours qui suivent la fin du séjour." },
    { id: "annulation", title: "Annulation", body: "Plus de 2 mois avant l’arrivée : acompte intégralement remboursé.\nMoins de 2 mois : l’acompte de 40 % est conservé.\nMoins d’un mois : le second versement de 30 % est également conservé.\nMoins de 8 jours : la totalité du séjour est due." },
    { id: "animaux", title: "Animaux", body: "Les animaux ne sont pas admis au chalet." },
  ];
  var QUESTIONS = [
    { id: "conciergerie", label: "Souhaitez-vous un service de conciergerie (petit déjeuner, goûter, repas du soir, baby-sitter) ?" },
    { id: "literie", label: "Criou et Cascade : un grand lit de 180 cm ou deux lits de 90 cm ?" },
    { id: "venue", label: "Voulez-vous que nous organisions votre venue depuis la gare ou l’aéroport ?" },
  ];

  var nuits = function (a, b) { return Math.round((date(b) - date(a)) / JOUR); };
  var chevauche = function (a, b, r) { return a < r.end && r.start < b; };
  var libre = function (a, b) { return !OCCUPE.some(function (r) { return chevauche(a, b, r); }); };
  var minNuits = function (a) { var p = semaineDe(a); return p ? 7 : CHALET.minNights; };
  // Pendant les vacances : arrivée et départ le samedi
  var samediOk = function (a, b) {
    var touche = SEMAINES.some(function (p) { return a < p.end && p.start < b; });
    if (!touche) return true;
    return date(a).getUTCDay() === 6 && date(b).getUTCDay() === 6;
  };

  // Prix nuit par nuit : 850 € hors vacances, la semaine divisée en sept pendant les vacances
  function prixNuits(a, b) {
    var out = [];
    for (var i = 0, n = nuits(a, b); i < n; i++) {
      var d = iso(new Date(date(a).getTime() + i * JOUR)), p = semaineDe(d);
      out.push({ date: d, priceCents: p ? Math.round(p.semaine / 7) : NUIT });
    }
    // les arrondis d'une semaine retombent sur la dernière nuit, pour que 7 nuits = le prix de la semaine
    SEMAINES.forEach(function (p) {
      var dans = out.filter(function (x) { return p.start <= x.date && x.date < p.end; });
      for (var k = 0; k + 7 <= dans.length; k += 7) {
        var bloc = dans.slice(k, k + 7), s = bloc.reduce(function (t, x) { return t + x.priceCents; }, 0);
        bloc[6].priceCents += p.semaine - s;
      }
    });
    return out;
  }
  var somme = function (t) { return t.reduce(function (s, x) { return s + x.priceCents; }, 0); };
  var ouvert = function (a, b) { return libre(a, b) && nuits(a, b) >= minNuits(a) && samediOk(a, b); };
  var raison = function (a, b) { return !libre(a, b) ? "occupe" : nuits(a, b) < minNuits(a) || !samediOk(a, b) ? "nuits_minimum" : null; };

  function planning() {
    return { hidden: false, today: iso(auj), privacyUrl: null, questions: QUESTIONS, conditions: CONDITIONS, options: OPTIONS,
      logements: [{ id: CHALET.id, name: CHALET.name, kind: CHALET.kind, capacity: CHALET.capacity, note: CHALET.note,
        image: new URL(CHALET.image, location.href).href, minNights: CHALET.minNights, minStays: MIN_SEJOURS, contains: [], occupied: OCCUPE }] };
  }

  function disponibilites(p) {
    var a = p.get("start"), b = p.get("end"), g = +p.get("guests") || 1, ok = ouvert(a, b);
    return { hidden: false, nights: nuits(a, b), guests: g, logements: [{ id: CHALET.id, name: CHALET.name, kind: CHALET.kind,
      capacity: CHALET.capacity, note: CHALET.note, image: new URL(CHALET.image, location.href).href, fits: g <= CHALET.capacity,
      minNights: minNuits(a), available: ok, reason: ok && g > CHALET.capacity ? "places" : raison(a, b),
      accommodationCents: ok ? somme(prixNuits(a, b)) : null }] };
  }

  function devis(p) {
    var a = p.get("start"), b = p.get("end"), g = +p.get("guests") || 1, enfants = +p.get("children") || 0, n = nuits(a, b);
    var choisi = (p.get("logement") || "").split(",").indexOf(CHALET.id) >= 0;
    var t = prixNuits(a, b), hebergement = choisi ? somme(t) : 0;
    var adultes = Math.max(0, g - enfants);
    var extras = OPTIONS.filter(function (o) { return o.mandatory || o.included; }).map(function (o) {
      var q = o.unit === "personne_nuit" ? (o.adultsOnly ? adultes : g) * n : 1;
      var e = { id: o.id, name: o.name, unit: o.unit, quantity: q, unitPriceCents: o.priceCents, totalCents: o.priceCents * q };
      if (o.mandatory) e.mandatory = true;
      if (o.included) e.included = true;
      return e;
    });
    return { hidden: false, available: choisi && ouvert(a, b) && g <= CHALET.capacity, nights: n, guests: g, children: enfants,
      minNights: minNuits(a), capacity: CHALET.capacity, nightly: choisi ? t : [],
      lines: choisi ? [{ id: CHALET.id, name: CHALET.name, accommodationCents: hebergement }] : [], accommodationCents: hebergement, extras: extras,
      totalCents: hebergement + extras.reduce(function (s, e) { return s + e.totalCents; }, 0) };
  }

  var repondre = function (corps) {
    return Promise.resolve(new Response(JSON.stringify(corps), { status: 200, headers: { "Content-Type": "application/json" } }));
  };
  var vraiFetch = window.fetch.bind(window);
  window.fetch = function (entree, init) {
    var url = typeof entree === "string" ? entree : entree && entree.url;
    if (!url || url.indexOf(DEMO_API) !== 0) return vraiFetch(entree, init);
    var u = new URL(url);
    // La demande et l'e-mail ne partent nulle part : le visiteur voit simplement « Merci »
    if (url.indexOf(DEMO_ENVOI) === 0 || /\/requests$/.test(u.pathname)) return repondre({ success: true, demo: true });
    if (/\/image\//.test(u.pathname)) return vraiFetch(entree, init);
    if (/\/planning$/.test(u.pathname)) return repondre(planning());
    if (/\/availability$/.test(u.pathname)) return repondre(disponibilites(u.searchParams));
    if (/\/quote$/.test(u.pathname)) return repondre(devis(u.searchParams));
    return Promise.resolve(new Response("{}", { status: 404 }));
  };
})();
