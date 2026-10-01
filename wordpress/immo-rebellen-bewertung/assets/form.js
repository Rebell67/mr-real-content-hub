/*!
 * Immo Rebellen – Immobilienbewertung 2.0
 * Mehrstufiges Formular ohne Abhängigkeiten. Konfiguration: window.IRB_CONFIG (PHP).
 */
(() => {
'use strict';

const C = window.IRB_CONFIG;
if (!C) return;
const S = C.schema;

/* ---------------------------------------------------------------- Helfer */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const CONTACT_FIELDS = ['anrede', 'vorname', 'nachname', 'email', 'telefon', 'erreichbarkeit', 'nachricht', 'datenschutz'];
const ADDRESS_FIELDS = ['strasse', 'hausnummer', 'plz', 'ort'];
const DRAFT_KEY = 'irb-draft-v2';
const SOURCE_KEY = 'irb-source';

/** Deutsche Zahleneingabe: „85“, „85,5“, „1.200“, „1.200,5“ → Number | null */
function parseNumber(v) {
	v = String(v ?? '').trim().replace(/\s|m²|m2/gi, '');
	if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(v)) v = v.replace(/\./g, '');
	v = v.replace(',', '.');
	if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
	return Number(v);
}
const formatNumber = (n) => (n === '' || n == null ? '' : String(n).replace('.', ','));
const formatThousands = (n) => Number(n).toLocaleString('de-AT', { maximumFractionDigits: 2 });

function phoneOk(v) {
	const digits = v.replace(/\D/g, '').replace(/^00/, '');
	return /^(?:\+|0)[0-9\s()/.\-]+$/.test(v) && v.length <= 40 && digits.length >= 7 && digits.length <= 15 && !/^(\d)\1+$/.test(digits);
}

/** Logarithmischer Schieberegler: feine Schritte bei kleinen, grobe bei großen Flächen. */
const SLIDER_STEPS = 1000;
function sliderToValue(t, [lo, hi]) {
	const v = lo * Math.pow(hi / lo, t / SLIDER_STEPS);
	const step = v < 100 ? 1 : v < 1000 ? 5 : v < 5000 ? 50 : 100;
	return Math.round(v / step) * step;
}
function valueToSlider(v, [lo, hi]) {
	if (!v || v <= lo) return 0;
	if (v >= hi) return SLIDER_STEPS;
	return Math.round((SLIDER_STEPS * Math.log(v / lo)) / Math.log(hi / lo));
}

function storage(kind) {
	try { const s = window[kind]; const k = '__irb'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; }
}
const session = storage('sessionStorage');

/* ---------------------------------------------------------------- Tracking (unverändert zu 1.3) */

function track(name, params = {}) {
	if (C.tracking === 'off') return false;
	try {
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({ event: name, ...params });
		if (C.tracking === 'ga4' && /^G-[A-Z0-9]+$/.test(C.measurement || '') && typeof window.gtag === 'function') {
			const direct = { ...params, send_to: C.measurement };
			delete direct.eventCallback;
			delete direct.eventTimeout;
			window.gtag('event', name, direct);
		}
		return true;
	} catch (e) {
		return false;
	}
}

/** Herkunft einmal pro Sitzung merken (nur UTM-Parameter und externe Verweis-Domain). */
function source() {
	if (!C.storeSource) return null;
	try {
		const saved = session && session.getItem(SOURCE_KEY);
		if (saved) return JSON.parse(saved);
		const q = new URLSearchParams(location.search);
		const src = {};
		['utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => { if (q.get(k)) src[k] = q.get(k).slice(0, 100); });
		if (document.referrer) {
			const host = new URL(document.referrer).hostname;
			if (host && host !== location.hostname) src.referrer = host;
		}
		if (session) session.setItem(SOURCE_KEY, JSON.stringify(src));
		return src;
	} catch (e) {
		return null;
	}
}

/* ---------------------------------------------------------------- Instanz */

document.querySelectorAll('[data-irb-root]').forEach((root, instance) => {
	if (root.dataset.ready) return;
	root.dataset.ready = '1';

	const uid = 'irb-' + instance + '-';
	const requestKey = Array.from(crypto.getRandomValues(new Uint8Array(24)), (x) => x.toString(16).padStart(2, '0')).join('');
	const preset = root.dataset.preset || new URLSearchParams(location.search).get('objektart') || '';
	const src = source();

	let data = {};
	let index = 0;
	let direction = 1;
	let reviewReturn = false;
	let token = '', tokenAt = 0, tokenPromise = null;
	let busy = false, visible = false, started = false, completed = false;
	let attempted = false;
	const touched = new Set();

	/* ---------- Schema-Logik (identisch zu IRB_Schema::path in PHP) */

	function optionsFor(id) {
		if (id === 'objektart') return Object.entries(S.types);
		if (id === 'unterart') return (S.subtypes[data.objektart] || []).map((v) => [v, v]);
		const st = S.steps[id];
		const list = st.options_by_type ? st.options_by_type[data.objektart] || [] : st.options || [];
		return list.map((v) => [v, v]);
	}

	function path() {
		const t = data.objektart;
		if (!S.paths[t]) return ['objektart'];
		return ['objektart', 'unterart', ...S.paths[t], ...S.common].filter((id) => {
			if (S.disabled.includes(id)) return false;
			const st = S.steps[id];
			if (st.type === 'multi' && !optionsFor(id).length) return false;
			if (st.when) {
				for (const f in st.when) if (!st.when[f].includes(data[f])) return false;
			}
			return true;
		});
	}

	const stepId = () => path()[index];
	const step = () => ({ id: stepId(), ...S.steps[stepId()] });

	/** Fehlermeldung für einen Schritt – leer, wenn gültig. */
	function stepError(id) {
		const st = S.steps[id];
		const v = data[id];
		switch (st.type) {
			case 'choice':
				return optionsFor(id).some(([k]) => k === v) ? '' : 'Bitte wähle eine Option.';
			case 'multi':
				return '';
			case 'area':
			case 'counter': {
				if ((v === '' || v == null) && st.optional) return '';
				if (v === '' || v == null) return st.type === 'area' ? 'Bitte gib die Fläche in m² ein.' : 'Bitte gib die Anzahl der Zimmer ein.';
				const n = Number(v);
				if (!(n >= st.min && n <= st.max)) return 'Bitte gib einen Wert zwischen ' + formatThousands(st.min) + ' und ' + formatThousands(st.max) + ' ein.';
				if (st.type === 'counter' && !Number.isInteger(n)) return 'Bitte gib eine ganze Zahl ein.';
				return '';
			}
			case 'year':
				if (st.periods.includes(v)) return '';
				if (!/^\d{4}$/.test(v || '') || Number(v) < st.min || Number(v) > st.max) return 'Bitte gib ein Baujahr zwischen ' + st.min + ' und ' + st.max + ' ein oder wähle einen Zeitraum.';
				return '';
			case 'address':
				return ADDRESS_FIELDS.every((k) => fieldError(k) === '') ? '' : 'Bitte gib die vollständige Adresse an.';
			case 'contact':
				return ['vorname', 'nachname', 'email', 'telefon', 'datenschutz'].every((k) => fieldError(k) === '') ? '' : 'Bitte fülle alle Pflichtfelder korrekt aus.';
		}
		return '';
	}

	function fieldError(k) {
		const v = String(data[k] ?? '').trim();
		switch (k) {
			case 'strasse': return v ? '' : 'Bitte gib die Straße an.';
			case 'hausnummer': return v ? '' : 'Bitte gib die Hausnummer an.';
			case 'plz': return /^[1-9]\d{3}$/.test(v) ? '' : v ? 'Bitte gib eine vierstellige österreichische PLZ ein.' : 'Bitte gib die PLZ an.';
			case 'ort': return v ? '' : 'Bitte gib den Ort an.';
			case 'vorname': return v ? (/(https?:|www\.|@|[<>{}[\]]|\d{3,})/i.test(v) ? 'Bitte gib nur deinen Namen an.' : '') : 'Bitte gib deinen Vornamen an.';
			case 'nachname': return v ? (/(https?:|www\.|@|[<>{}[\]]|\d{3,})/i.test(v) ? 'Bitte gib nur deinen Namen an.' : '') : 'Bitte gib deinen Nachnamen an.';
			case 'email': return !v ? 'Bitte gib deine E-Mail-Adresse ein.' : EMAIL.test(v) ? '' : 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.at.';
			case 'telefon': return !v ? 'Bitte gib deine Telefonnummer ein.' : phoneOk(v) ? '' : 'Bitte gib eine plausible Telefonnummer mit Vorwahl ein, z. B. +43 660 1234567.';
			case 'datenschutz': return data.datenschutz === '1' ? '' : 'Bitte bestätige den Datenschutzhinweis.';
		}
		return '';
	}

	/* ---------- Entwurf (nur diese Browser-Sitzung) */

	function saveDraft() {
		if (!session || completed) return;
		try {
			const copy = { ...data };
			delete copy.datenschutz;
			session.setItem(DRAFT_KEY, JSON.stringify({ data: copy, index, at: Date.now() }));
		} catch (e) { /* Speicher voll oder gesperrt – egal */ }
	}
	function loadDraft() {
		try {
			const d = JSON.parse(session && session.getItem(DRAFT_KEY));
			if (!d || Date.now() - d.at > 864e5 || !d.data || typeof d.data !== 'object') return false;
			data = d.data;
			index = Math.max(0, Math.min(Number(d.index) || 0, path().length - 1));
			return index > 0;
		} catch (e) {
			return false;
		}
	}
	const clearDraft = () => { try { session && session.removeItem(DRAFT_KEY); } catch (e) { /* */ } };

	/* ---------- Token */

	async function getToken(force = false) {
		if (!force && token && Date.now() - tokenAt < 6900000) return token;
		if (tokenPromise) return tokenPromise;
		tokenPromise = (async () => {
			const r = await fetch(C.ajax, { method: 'POST', credentials: 'same-origin', body: new URLSearchParams({ action: 'irb_token' }), cache: 'no-store' });
			const j = await r.json();
			if (!r.ok || !j.success) throw Error('Die Verbindung konnte nicht hergestellt werden. Bitte versuche es erneut.');
			token = j.data.token;
			tokenAt = Date.now();
			return token;
		})().finally(() => { tokenPromise = null; });
		return tokenPromise;
	}

	/* ---------- Tracking-Aufrufe */

	function trackView() {
		if (completed || !visible) return;
		if (!started) {
			track('bewertung_start');
			started = true;
		}
		track('bewertung_schritt', { schritt: index + 1, schritt_name: stepId(), objektart: data.objektart || 'nicht_gewaehlt' });
	}

	/* ---------- Markup-Bausteine */

	const art = (k) => '<span class="irb-art" aria-hidden="true">' + (C.icons[k] || '') + '</span>';

	function input(k, label, type, attrs, opts = {}) {
		const req = !opts.optional;
		return '<label class="irb-field' + (opts.wide ? ' irb-wide' : '') + (opts.cls ? ' ' + opts.cls : '') + '" for="' + uid + k + '"><span>' + label +
			(req ? ' <span class="irb-required" aria-hidden="true">*</span>' : ' <small>(optional)</small>') + '</span>' +
			'<input id="' + uid + k + '" name="' + k + '" type="' + type + '" value="' + esc(data[k]) + '" ' + attrs + (req ? ' required aria-required="true"' : '') +
			' aria-describedby="' + uid + k + '-error"><span class="irb-field-error" id="' + uid + k + '-error"></span></label>';
	}

	function select(k, label, options) {
		return '<label class="irb-field" for="' + uid + k + '"><span>' + label + ' <small>(optional)</small></span><select id="' + uid + k + '" name="' + k + '">' +
			options.map((v) => '<option' + (data[k] === v ? ' selected' : '') + '>' + esc(v) + '</option>').join('') + '</select></label>';
	}

	function choiceBody(st) {
		const isType = st.id === 'objektart';
		const multi = st.type === 'multi';
		const selected = (v) => (multi ? (data[st.id] || []).includes(v) : data[st.id] === v);
		return '<div class="irb-choices' + (isType ? ' irb-types' : '') + (multi ? ' irb-multi' : '') + '" role="group" aria-label="' + esc(st.question) + '">' +
			optionsFor(st.id).map(([v, label]) =>
				'<button type="button" class="irb-choice' + (selected(v) ? ' is-selected' : '') + '" data-choice="' + esc(v) + '" aria-pressed="' + selected(v) + '">' +
				(isType ? art(v) : '<span class="irb-choice-mark" aria-hidden="true"></span>') +
				'<span class="irb-choice-label">' + esc(label) + '</span>' +
				(multi ? '' : '<span class="irb-choice-arrow" aria-hidden="true">↗</span>') + '</button>'
			).join('') + '</div>' + (st.hint ? '<p class="irb-hint">' + esc(st.hint) + '</p>' : '');
	}

	function numberBody(st) {
		const v = data[st.id];
		const counter = st.type === 'counter';
		let html = '<div class="irb-number-wrap">' +
			'<label for="' + uid + st.id + '" class="irb-sr">' + esc(st.question) + '</label>' +
			'<div class="irb-number-row">' +
			(counter ? '<button type="button" class="irb-counter" data-delta="-1" aria-label="Ein Zimmer weniger">−</button>' : '') +
			'<input class="irb-number" id="' + uid + st.id + '" name="' + st.id + '" type="text" inputmode="' + (counter ? 'numeric' : 'decimal') + '" autocomplete="off" placeholder="' + (counter ? '0' : 'Deine Angabe') + '" value="' + esc(formatNumber(v)) + '" aria-describedby="' + uid + 'step-error">' +
			'<span class="irb-unit">' + esc(st.unit) + '</span>' +
			(counter ? '<button type="button" class="irb-counter" data-delta="1" aria-label="Ein Zimmer mehr">+</button>' : '') +
			'</div>';
		if (st.slider) {
			const n = Number(v) || 0;
			html += '<input class="irb-range' + (n ? '' : ' is-empty') + '" type="range" min="0" max="' + SLIDER_STEPS + '" step="1" value="' + valueToSlider(n, st.slider) + '" aria-label="' + esc(st.question) + ' – Schieberegler" aria-valuetext="' + (n ? esc(formatThousands(n)) + ' Quadratmeter' : 'Noch keine Angabe') + '">' +
				'<div class="irb-range-scale" aria-hidden="true"><span>' + formatThousands(st.slider[0]) + ' m²</span><span>' + formatThousands(st.slider[1]) + '+ m²</span></div>' +
				'<p class="irb-hint">Fläche eintippen oder den Regler bewegen. Größere Flächen kannst du direkt eingeben.</p>';
		}
		if (st.quick) {
			html += '<div class="irb-chips" role="group" aria-label="Schnellauswahl">' + st.quick.map((q, i) =>
				'<button type="button" class="irb-chip' + (Number(v) === q ? ' is-selected' : '') + '" data-quick="' + q + '">' + q + (i === st.quick.length - 1 ? '+' : '') + '</button>').join('') + '</div>';
		}
		if (st.hint) html += '<p class="irb-hint">' + esc(st.hint) + '</p>';
		return html + '</div>';
	}

	function yearBody(st) {
		const v = data[st.id] || '';
		const isPeriod = st.periods.includes(v);
		return '<div class="irb-number-wrap">' +
			'<label for="' + uid + st.id + '" class="irb-sr">' + esc(st.question) + '</label>' +
			'<div class="irb-number-row"><input class="irb-number" id="' + uid + st.id + '" name="' + st.id + '" type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="z. B. 1990" value="' + esc(isPeriod ? '' : v) + '" aria-describedby="' + uid + 'step-error"></div>' +
			'<p class="irb-divider"><span>oder ungefähr</span></p>' +
			'<div class="irb-chips irb-chips-wide" role="group" aria-label="Zeitraum">' + st.periods.map((p) =>
				'<button type="button" class="irb-chip' + (v === p ? ' is-selected' : '') + '" data-period="' + esc(p) + '" aria-pressed="' + (v === p) + '">' + esc(p) + '</button>').join('') + '</div>' +
			'<p class="irb-hint">' + esc(st.hint) + '</p></div>';
	}

	function addressBody() {
		return '<div class="irb-fields irb-address">' +
			input('strasse', 'Straße', 'text', 'maxlength="120" autocomplete="address-line1"', { cls: 'irb-span-3' }) +
			input('hausnummer', 'Nr.', 'text', 'maxlength="30" autocomplete="address-line2"', { cls: 'irb-span-1' }) +
			input('plz', 'PLZ', 'text', 'inputmode="numeric" maxlength="4" autocomplete="postal-code"', { cls: 'irb-span-1' }) +
			input('ort', 'Ort', 'text', 'maxlength="100" autocomplete="address-level2"', { cls: 'irb-span-3' }) +
			'</div><p class="irb-hint">Für Immobilien in Österreich. Die genaue Adresse hilft uns, Lage und Umfeld bei der Bewertung zu berücksichtigen.</p>';
	}

	function reviewList() {
		const rows = [];
		path().forEach((id, i) => {
			const st = S.steps[id];
			if (st.type === 'contact') return;
			let v = data[id];
			if (id === 'objektart') v = S.types[v];
			else if (st.type === 'address') v = [data.strasse, data.hausnummer].filter(Boolean).join(' ') + ', ' + [data.plz, data.ort].filter(Boolean).join(' ');
			else if (Array.isArray(v)) v = v.join(', ');
			else if (st.type === 'area' && v !== '' && v != null) v = formatThousands(v) + ' m²';
			if (v === '' || v == null || (Array.isArray(data[id]) && !data[id].length)) v = 'Nicht angegeben';
			const label = st.label || (id === 'unterart' ? 'Unterart' : id === 'objektart' ? 'Objektart' : 'Adresse');
			rows.push('<li><span class="irb-review-label">' + esc(label) + '</span><span class="irb-review-value">' + esc(v) + '</span><button type="button" class="irb-edit" data-goto="' + i + '" aria-label="' + esc(label) + ' ändern">Ändern</button></li>');
		});
		return '<details class="irb-review"><summary>Deine Angaben prüfen <span>(' + rows.length + ')</span></summary><ul>' + rows.join('') + '</ul></details>';
	}

	function contactBody() {
		const nachrichtOpen = !!data.nachricht;
		return '<div class="irb-contact-grid"><div>' +
			'<p class="irb-required-note">* Pflichtfelder – E-Mail und Telefon brauchen wir für die Rückmeldung.</p>' +
			'<div class="irb-fields">' +
			select('anrede', 'Anrede', S.contact.anrede) +
			select('erreichbarkeit', 'Am besten erreichbar', S.contact.erreichbarkeit) +
			input('vorname', 'Vorname', 'text', 'maxlength="80" autocomplete="given-name"') +
			input('nachname', 'Nachname', 'text', 'maxlength="80" autocomplete="family-name"') +
			input('email', 'E-Mail', 'email', 'maxlength="180" autocomplete="email" spellcheck="false"') +
			input('telefon', 'Telefon', 'tel', 'maxlength="40" autocomplete="tel" placeholder="+43 …"') +
			'</div>' +
			'<details class="irb-message"' + (nachrichtOpen ? ' open' : '') + '><summary>Nachricht hinzufügen <small>(optional)</small></summary>' +
			'<label class="irb-field irb-wide" for="' + uid + 'nachricht"><span class="irb-sr">Nachricht</span><textarea id="' + uid + 'nachricht" name="nachricht" rows="3" maxlength="2000" placeholder="z. B. Besonderheiten, gewünschter Rückruftermin …">' + esc(data.nachricht) + '</textarea></label></details>' +
			'<label class="irb-consent"><input type="checkbox" name="datenschutz" value="1"' + (data.datenschutz === '1' ? ' checked' : '') + ' required aria-describedby="' + uid + 'datenschutz-error"><span>Ich habe die <a href="' + esc(C.privacy) + '" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Angaben zur Bearbeitung meiner Bewertungsanfrage zu. <span class="irb-required" aria-hidden="true">*</span></span></label>' +
			'<span class="irb-field-error" id="' + uid + 'datenschutz-error"></span>' +
			reviewList() +
			'</div><aside class="irb-person"><img src="' + esc(C.photo) + '" alt="' + esc(C.team) + ' von ' + esc(C.brand) + '" loading="lazy" width="480" height="320">' +
			'<span class="irb-eyebrow">PERSÖNLICH FÜR DICH DA</span><h3>' + esc(C.team) + '</h3>' +
			'<p>Du erhältst deine persönliche Ersteinschätzung innerhalb von <strong>' + esc(C.response) + '</strong>. Keine automatische Schätzung, sondern eine echte Bewertung mit Blick auf Lage, Zustand und aktuelle Vergleichsverkäufe.</p>' +
			'<ul class="irb-trust"><li>Kostenlos &amp; unverbindlich</li><li>Keine Weitergabe deiner Daten</li><li>Lokale Marktkenntnis</li></ul></aside></div>';
	}

	/* ---------- Rendern */

	function render(focus = false) {
		const st = step();
		const all = path();
		const total = data.objektart ? all.length : 12;
		const isLast = st.type === 'contact';
		let body;
		if (st.type === 'choice' || st.type === 'multi') body = choiceBody(st);
		else if (st.type === 'area' || st.type === 'counter') body = numberBody(st);
		else if (st.type === 'year') body = yearBody(st);
		else if (st.type === 'address') body = addressBody();
		else body = contactBody();

		const showNext = st.type !== 'choice';
		const pct = Math.round(((index + (isLast ? 0.85 : 0)) / Math.max(1, total - 1)) * 100);

		root.innerHTML =
			'<form class="irb-shell" novalidate>' +
			'<header class="irb-header"><span class="irb-eyebrow">' + esc(C.brand.toUpperCase()) + ' · IMMOBILIENBEWERTUNG</span>' +
			'<div class="irb-heading-row"><h2 tabindex="-1">' + esc(st.question) + '</h2>' +
			'<span class="irb-step">' + (data.objektart ? 'Schritt ' + (index + 1) + ' von ' + total : 'Schritt 1 · Objektart') + '</span></div>' +
			'<p class="irb-subtitle">' + (st.id === 'objektart' ? 'Was ist deine Immobilie wert? Finden wir es gemeinsam heraus.' : isLast ? 'Fast geschafft – nur noch deine Kontaktdaten.' : 'Kostenlos anfragen. Persönlich eingeschätzt.') + '</p></header>' +
			'<div class="irb-progress" role="progressbar" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.min(100, pct) + '"><span style="width:' + Math.max(4, Math.min(100, pct)) + '%"></span></div>' +
			'<div class="irb-body ' + (direction > 0 ? 'irb-forward' : 'irb-backward') + '">' + body +
			'<p class="irb-step-error" id="' + uid + 'step-error" aria-live="polite"></p>' +
			'<div class="irb-honeypot" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
			'<p class="irb-error" role="alert"></p></div>' +
			'<footer class="irb-footer">' +
			(index > 0 ? '<button type="button" class="irb-back"><span aria-hidden="true">←</span> Zurück</button>' : '<span class="irb-footer-note">Persönlich. Unverbindlich. Kostenlos.</span>') +
			'<div class="irb-actions">' +
			(st.optional && st.type !== 'multi' ? '<button type="button" class="irb-skip">Überspringen</button>' : '') +
			(showNext ? '<button type="submit" class="irb-primary">' + (isLast ? 'Bewertung anfordern' : reviewReturn ? 'Übernehmen' : 'Weiter') + ' <span aria-hidden="true">→</span></button>' : '') +
			'</div></footer>' +
			'<p class="irb-sr" aria-live="polite">' + esc((data.objektart ? 'Schritt ' + (index + 1) + ' von ' + total + ': ' : '') + st.question) + '</p>' +
			'</form>';

		bind(st);
		refreshFields();
		if (focus) {
			root.querySelector('h2').focus({ preventScroll: true });
			const r = root.getBoundingClientRect();
			if (r.top < 0 || r.top > window.innerHeight * 0.6) root.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
		}
		saveDraft();
	}

	/* ---------- Navigation */

	function go(to, dir) {
		direction = dir;
		index = Math.max(0, Math.min(to, path().length - 1));
		render(true);
		trackView();
	}

	function next() {
		const all = path();
		if (reviewReturn) {
			// Nach „Ändern“: zum nächsten offenen Schritt oder direkt zurück zur Übersicht.
			const open = all.findIndex((id, i) => i > index && stepError(id) !== '' && S.steps[id].type !== 'contact');
			reviewReturn = open !== -1 ? reviewReturn : false;
			go(open !== -1 ? open : all.indexOf('kontakt'), 1);
			if (open === -1) {
				const det = root.querySelector('.irb-review');
				if (det) det.open = true;
			}
			return;
		}
		go(index + 1, 1);
	}

	function choose(st, v) {
		if (st.id === 'objektart' && data.objektart !== v) {
			// Objektart gewechselt: objektspezifische Angaben verwerfen, Adresse/Kontakt behalten.
			const keep = {};
			[...ADDRESS_FIELDS, ...CONTACT_FIELDS, 'anlass', 'zeitraum'].forEach((k) => { if (data[k] !== undefined) keep[k] = data[k]; });
			data = keep;
			if (reviewReturn) reviewReturn = false;
		}
		data[st.id] = v;
		root.querySelectorAll('[data-choice]').forEach((b) => {
			const on = b.dataset.choice === v;
			b.classList.toggle('is-selected', on);
			b.setAttribute('aria-pressed', on);
		});
		busy = true;
		setTimeout(() => { busy = false; next(); }, reducedMotion() ? 0 : 160);
	}

	/* ---------- Ereignisse */

	function bind(st) {
		const form = root.querySelector('form');
		root.querySelector('.irb-person img')?.addEventListener('error', (e) => { e.target.hidden = true; });

		const choices = [...root.querySelectorAll('[data-choice]')];
		choices.forEach((b, i) => {
			b.addEventListener('click', () => {
				if (busy) return;
				const v = b.dataset.choice;
				if (st.type === 'multi') {
					const list = new Set(data[st.id] || []);
					list.has(v) ? list.delete(v) : list.add(v);
					data[st.id] = [...list];
					b.classList.toggle('is-selected', list.has(v));
					b.setAttribute('aria-pressed', list.has(v));
					saveDraft();
					return;
				}
				choose(st, v);
			});
			// Pfeiltasten bewegen den Fokus innerhalb der Auswahl.
			b.addEventListener('keydown', (e) => {
				const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
				if (!(e.key in map)) return;
				e.preventDefault();
				choices[(i + map[e.key] + choices.length) % choices.length].focus();
			});
		});

		root.querySelector('.irb-back')?.addEventListener('click', () => { if (!busy) { reviewReturn = false; go(index - 1, -1); } });
		root.querySelector('.irb-skip')?.addEventListener('click', () => { data[st.id] = ''; next(); });

		// Zahlen & Schieberegler
		const num = root.querySelector('.irb-number');
		const range = root.querySelector('.irb-range');
		const syncRange = () => {
			if (!range) return;
			const n = Number(data[st.id]) || 0;
			range.value = valueToSlider(n, st.slider);
			range.classList.toggle('is-empty', !n);
			range.setAttribute('aria-valuetext', n ? formatThousands(n) + ' Quadratmeter' : 'Noch keine Angabe');
		};
		if (num && (st.type === 'area' || st.type === 'counter')) {
			num.addEventListener('input', () => {
				const n = parseNumber(num.value);
				data[st.id] = num.value.trim() === '' ? '' : n === null ? num.value.trim() : n;
				syncRange();
				root.querySelectorAll('[data-quick]').forEach((c) => c.classList.toggle('is-selected', Number(c.dataset.quick) === Number(data[st.id])));
				clearStepError();
				saveDraft();
			});
		}
		range?.addEventListener('input', () => {
			const v = sliderToValue(Number(range.value), st.slider);
			data[st.id] = v;
			num.value = formatNumber(v);
			range.classList.remove('is-empty');
			range.setAttribute('aria-valuetext', formatThousands(v) + ' Quadratmeter');
			clearStepError();
		});
		range?.addEventListener('change', saveDraft);
		root.querySelectorAll('[data-delta]').forEach((b) => b.addEventListener('click', () => {
			const cur = Number(data[st.id]);
			const v = Number.isFinite(cur) && data[st.id] !== '' ? Math.max(st.min, Math.min(st.max, Math.round(cur) + Number(b.dataset.delta))) : st.min;
			num.value = v;
			num.dispatchEvent(new Event('input', { bubbles: true }));
		}));
		root.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => {
			num.value = b.dataset.quick;
			num.dispatchEvent(new Event('input', { bubbles: true }));
			if (b === root.querySelector('[data-quick]:last-child')) num.focus();
		}));

		// Baujahr
		if (st.type === 'year') {
			num.addEventListener('input', () => {
				num.value = num.value.replace(/\D/g, '').slice(0, 4);
				data[st.id] = num.value;
				root.querySelectorAll('[data-period]').forEach((c) => { c.classList.remove('is-selected'); c.setAttribute('aria-pressed', 'false'); });
				clearStepError();
				saveDraft();
			});
			root.querySelectorAll('[data-period]').forEach((b) => b.addEventListener('click', () => {
				if (busy) return;
				data[st.id] = b.dataset.period;
				num.value = '';
				root.querySelectorAll('[data-period]').forEach((c) => { const on = c === b; c.classList.toggle('is-selected', on); c.setAttribute('aria-pressed', on); });
				busy = true;
				setTimeout(() => { busy = false; next(); }, reducedMotion() ? 0 : 160);
			}));
		}

		// Adresse & Kontakt
		form.querySelectorAll('.irb-field input, .irb-field select, .irb-field textarea, .irb-consent input').forEach((el) => {
			const handler = () => {
				data[el.name] = el.type === 'checkbox' ? (el.checked ? '1' : '') : el.value;
				if (el.name === 'plz' && /^1\d{3}$/.test(el.value) && !data.ort) {
					data.ort = 'Wien';
					const ort = form.querySelector('[name=ort]');
					if (ort) ort.value = 'Wien';
				}
				refreshFields();
				saveDraft();
			};
			el.addEventListener('input', handler);
			el.addEventListener('change', handler);
			el.addEventListener('blur', () => {
				if (el.tagName === 'INPUT' && el.type !== 'checkbox') {
					el.value = el.value.trim();
					data[el.name] = el.value;
				}
				if (el.value) touched.add(el.name);
				refreshFields();
			});
		});

		root.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => {
			reviewReturn = true;
			go(Number(b.dataset.goto), -1);
		}));

		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			if (busy) return;
			if (st.type === 'contact') {
				attempted = true;
				refreshFields();
				const err = stepError('kontakt');
				if (err) {
					showError('Bitte fülle alle Pflichtfelder korrekt aus und bestätige den Datenschutzhinweis.');
					const first = root.querySelector('[aria-invalid="true"]');
					if (first) first.focus();
					return;
				}
				await submit();
				return;
			}
			if (st.type === 'address') {
				attempted = true;
				refreshFields();
			}
			const err = stepError(st.id);
			if (err) {
				if (st.type !== 'address') showStepError(err);
				const first = root.querySelector('[aria-invalid="true"], .irb-number');
				if (first) first.focus();
				return;
			}
			if (st.type === 'address' || st.type === 'contact') attempted = false;
			next();
		});
	}

	function showStepError(msg) {
		const el = root.querySelector('.irb-step-error');
		if (el) el.textContent = msg;
		root.querySelector('.irb-number')?.setAttribute('aria-invalid', 'true');
	}
	function clearStepError() {
		const el = root.querySelector('.irb-step-error');
		if (el) el.textContent = '';
		root.querySelector('.irb-number')?.setAttribute('aria-invalid', 'false');
	}
	function showError(text) {
		const el = root.querySelector('.irb-error');
		if (el) el.textContent = text;
	}

	/** Feldfehler anzeigen, sobald ein Feld berührt oder ein Absenden versucht wurde. */
	function refreshFields() {
		[...ADDRESS_FIELDS, 'vorname', 'nachname', 'email', 'telefon', 'datenschutz'].forEach((k) => {
			const el = root.querySelector('[name="' + k + '"]');
			const out = root.querySelector('#' + uid + k + '-error');
			if (!el || !out) return;
			const msg = fieldError(k);
			const show = !!msg && (attempted || touched.has(k));
			out.textContent = show ? msg : '';
			el.setAttribute('aria-invalid', show ? 'true' : 'false');
		});
		if (attempted && stepId() === 'kontakt' && !stepError('kontakt')) showError('');
	}

	/* ---------- Absenden */

	async function submit() {
		busy = true;
		root.setAttribute('aria-busy', 'true');
		root.querySelectorAll('button').forEach((b) => { b.disabled = true; });
		const btn = root.querySelector('[type="submit"]');
		btn.innerHTML = '<span class="irb-spinner" aria-hidden="true"></span> Wird übermittelt …';
		showError('');
		try {
			const payload = { ...data };
			if (src && Object.keys(src).length) payload.quelle = src;
			const t = await getToken();
			const body = new URLSearchParams({ action: 'irb_submit', token: t, request_key: requestKey, data: JSON.stringify(payload), website: root.querySelector('[name="website"]').value });
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), 30000);
			let response;
			try {
				response = await fetch(C.ajax, { method: 'POST', credentials: 'same-origin', body, signal: controller.signal });
			} finally {
				clearTimeout(timer);
			}
			let j = {};
			try { j = await response.json(); } catch (e) { /* kein JSON (z. B. Firewall-Seite) */ }
			if (!response.ok || !j.success) {
				if (response.status === 403) { token = ''; getToken(true).catch(() => {}); }
				const err = Error((j.data && j.data.message) || 'Die Anfrage konnte nicht gespeichert werden. Bitte versuche es erneut.');
				err.field = j.data && j.data.field;
				throw err;
			}
			if (!j.data || !j.data.saved) throw Error('Keine Speicherbestätigung erhalten. Bitte versuche es erneut.');

			completed = true;
			clearDraft();
			btn.textContent = 'Anfrage eingegangen ✓';
			let url = new URL(j.data.redirect, location.href);
			if (url.origin !== location.origin) url = new URL(C.thanks, location.href);
			let redirected = false;
			const redirect = () => { if (!redirected) { redirected = true; location.assign(url.href); } };
			track('bewertung_abschluss', { objektart: data.objektart, anlass: data.anlass, plz: data.plz, eventCallback: redirect, eventTimeout: 1000 });
			setTimeout(redirect, 1200);
		} catch (e) {
			busy = false;
			root.removeAttribute('aria-busy');
			// Serverfehler zu einem früheren Schritt: dorthin springen.
			const all = path();
			const target = e.field ? all.findIndex((id) => id === e.field || (S.steps[id].type === 'address' && ADDRESS_FIELDS.includes(e.field))) : -1;
			if (target !== -1 && all[target] !== 'kontakt') {
				reviewReturn = true;
				go(target, -1);
				if (S.steps[all[target]].type !== 'address') showStepError(e.message);
				else { attempted = true; refreshFields(); }
				return;
			}
			root.querySelectorAll('button').forEach((b) => { b.disabled = false; });
			btn.innerHTML = 'Bewertung anfordern <span aria-hidden="true">→</span>';
			showError(e.name === 'AbortError' ? 'Die Verbindung dauert zu lange. Bitte versuche es erneut. Deine Angaben bleiben erhalten.' : e.message || 'Verbindungsfehler. Bitte versuche es erneut.');
		}
	}

	/* ---------- Start */

	const restored = loadDraft();
	if (!restored && S.types[preset]) {
		data.objektart = preset;
		index = 1;
	}
	render();
	if (restored) {
		const note = document.createElement('p');
		note.className = 'irb-restored';
		note.innerHTML = 'Willkommen zurück – wir haben deine bisherigen Angaben behalten. <button type="button">Neu beginnen</button>';
		note.querySelector('button').addEventListener('click', () => { clearDraft(); data = {}; reviewReturn = false; go(0, -1); });
		root.querySelector('.irb-body').prepend(note);
	}
	getToken().catch(() => {});

	if ('IntersectionObserver' in window) {
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((e) => e.isIntersecting)) {
				visible = true;
				trackView();
				observer.disconnect();
			}
		}, { threshold: 0.15 });
		observer.observe(root);
	} else {
		visible = true;
		trackView();
	}

	window.addEventListener('pageshow', (e) => {
		if (e.persisted && completed) {
			root.innerHTML = '<div class="irb-shell irb-thanks-card"><h2>Deine Anfrage wurde bereits übermittelt.</h2><p>' + esc(C.teamOr) + ' meldet sich innerhalb von ' + esc(C.response) + ' bei dir.</p></div>';
		}
	});
});
})();
