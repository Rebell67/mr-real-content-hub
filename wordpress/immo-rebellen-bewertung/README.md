# Immo Rebellen – Immobilienbewertung 2.0.0

WordPress-Plugin für mehrstufige Bewertungsanfragen mit Lead-Verwaltung.
Kein automatischer Preisrechner: Das Formular sammelt Angaben für eure persönliche Ersteinschätzung.

Shortcode `[immo_bewertung]` · Block „Immobilienbewertung“ · Danke-Seite `/immobilienbewertung/danke/`

Voraussetzungen: WordPress 6.4+, PHP 7.4+ (geprüft mit PHPCompatibility 7.4–8.3 und WordPress 7.1).

---

## Update von 1.x (empfohlen: zuerst auf Staging)

1. WordPress → Plugins → Neues Plugin hinzufügen → Plugin hochladen → `immo-rebellen-bewertung.zip` → **„Aktuelle Version durch hochgeladene ersetzen“**. Nicht vorher deinstallieren.
2. Fertig. Tabelle und Einstellungen werden beim ersten Seitenaufruf automatisch erweitert. Alle bisherigen Anfragen bleiben erhalten und bekommen Status „Neu“, Priorität und Region.
3. Seiten-/Elementor-/CDN-Cache leeren.

Unverändert bleiben: Shortcode, Danke-URL, Tabelle `wp_irb_requests`, Option `irb_options`, die Tracking-Ereignisse samt Parametern (bestehende GTM-Trigger laufen weiter), Mailversand über `wp_mail()`.

## Was ist neu gegenüber 1.3.0

### Für Interessenten (Conversion)
- **Container-Layout**: Das Formular richtet sich nach der Breite der Elementor-Spalte statt nur nach dem Bildschirm. Behebt u. a. abgeschnittene Kacheln („Gewerbeimmobilie“) in schmalen Spalten.
- **Deutsche Zahleneingabe**: `85,5`, `1.200` und `1.200,5` werden korrekt verstanden; keine Browser-Spinner mehr.
- **Logarithmischer Flächen-Regler**: feine Schritte bei kleinen, grobe bei großen Flächen (Wohnung 15–500 m², Grundstück 100–10.000 m²).
- **Zimmer per Schnellauswahl** (1–6+), Plus/Minus bleibt.
- **Baujahr unbekannt?** Zeiträume wählbar (Altbau vor 1945, 1945–1980 …) – wichtig für Altbau/Richtwert.
- **Neuer optionaler Schritt „Ausstattung“** (Haus/Wohnung: Garten, Balkon, Lift, Garage …), abschaltbar.
- **Neuer Schritt „Verkaufszeitraum“** nur bei „Verkauf geplant“, abschaltbar.
- **„Deine Angaben prüfen“** vor dem Absenden mit „Ändern“-Links; nach der Korrektur geht es direkt zurück zur Übersicht.
- **Entwurf bleibt erhalten** bei Reload/Zurück-Navigation (nur in dieser Browser-Sitzung, ohne Datenschutzhaken; wird nach dem Absenden gelöscht).
- Kontakt: optionale **Erreichbarkeit** und **Nachricht**; PLZ 1xxx füllt „Wien“ vor; Vertrauenspunkte auf der Kontaktkarte.
- **Serverfehler springen zum betroffenen Schritt** (z. B. ungültige Fläche) statt einer allgemeinen Meldung.
- **Danke-Seite** mit Ablauf „Jetzt → innerhalb von 24 Stunden → Danach“, nennt die Objektart, funktioniert auch mit Block-Themes.
- Vorauswahl für Landingpages: `[immo_bewertung objektart="wohnung"]` oder Link `…/immobilienbewertung/?objektart=haus`.
- Barrierefreiheit: Pfeiltasten in Auswahlgruppen, Schrittansage für Screenreader, Fehler direkt am Feld, `prefers-reduced-motion`.

### Für euch (Lead-Verwaltung)
- **Menü „Bewertungen“** mit Zähler neuer Anfragen und Kennzahlen (Neu, 7 Tage, in Bearbeitung, Aufträge).
- **Liste** mit Suche, Filter (Status, Objektart, Priorität), Sortierung, Mehrfachaktionen (Status setzen, löschen).
- **Lead-Status**: Neu → Kontaktiert → Besichtigung vereinbart → Bewertung übermittelt → Auftrag erhalten / Kein Auftrag / Spam.
- **Interne Notizen** je Anfrage.
- **Priorität automatisch**: Hoch = Verkauf in den nächsten 6 Monaten, Mittel = Verkauf später/unklar oder Vermietung, sonst Normal. Hohe Priorität steht im Mail-Betreff.
- **Region** aus der PLZ (z. B. „Wien 7. Bezirk“).
- **Detailansicht** mit Anrufen-, E-Mail- und Karten-Button.
- **CSV-Export** (Excel-tauglich, berücksichtigt aktive Filter, geschützt gegen Formel-Injection).
- **Dashboard-Widget** mit den letzten Anfragen.
- **HTML-Mails** (intern und an Interessenten) mit Text-Fallback; interne Mail mit Buttons „Anrufen“, „Antworten“, „Auf Karte zeigen“, „In WordPress öffnen“. Weitere Empfänger (CC) möglich; Kundenbestätigung abschaltbar.
- **Mail-Versand nach der Antwort**: Bei PHP-FPM/LiteSpeed bekommt der Besucher die Bestätigung sofort; Mails werden danach versendet.
- **Testmail-Button** in den Einstellungen.
- **Webhook** (optional) an CRM, Zapier, Make, n8n – JSON, signiert per HMAC-SHA256 (`X-IRB-Signature: sha256=…`), mit Wiederholung.
- **Herkunft** (optional): UTM-Parameter und Verweis-Domain je Anfrage – ohne Cookies.
- **Texte & Team** einstellbar (Firmenname, „Phillip & Lucas“, Antwortzeit, Telefon, Foto), **Akzentfarbe** wählbar.

### Sicherheit & Datenschutz
- Wie bisher: signiertes Token, Mindestzeit, Honeypot, Herkunftsprüfung, Doppel-Absende-Schutz, Rate-Limit (IP nur gehasht).
- Neu: **IP-Ermittlung hinter Cloudflare/Proxy** einstellbar – sonst teilen sich alle Besucher dasselbe Limit.
- Neu: Honeypot-Treffer erhalten eine Schein-Bestätigung (Bots lernen nichts), es wird nichts gespeichert.
- Neu: **Namen mit Links/Adressen werden abgelehnt** – verhindert Missbrauch der Bestätigungsmail für Spam.
- Neu: Server prüft auch Pfadlogik (z. B. Verkaufszeitraum nur bei Verkauf) und verwirft unbekannte Felder.
- Neu: **Automatische Löschfrist** (Tage, 0 = aus) und optional **Daten beim Löschen des Plugins entfernen** (Standard: behalten).
- Neu: Datenbank-Migration auch bei Update per ZIP (ohne Reaktivierung).

## Einstellungen (Bewertungen → Einstellungen)

| Bereich | Wichtig |
| --- | --- |
| Kontakt & Team | Empfänger `office@immo-rebellen.at`, Telefon `+43 660 9251772`, Team, Antwortzeit, Foto |
| Links | Datenschutz `/datenschutz/`, Immobilien `/immobilien/` |
| Formular | Akzentfarbe, Schritte „Ausstattung“/„Verkaufszeitraum“, Kundenbestätigung |
| Tracking | `DataLayer` lassen (GTM über Site Kit vorhanden) |
| Integrationen | Webhook-URL + Schlüssel |
| Sicherheit & Datenschutz | IP-Header, Limit, Löschfrist, Daten bei Deinstallation |

Nach dem Update **Testmail senden** und eine echte Testanfrage je Objektart abschicken.

## Tracking (unverändert)

| Ereignis | Auslöser | Parameter |
| --- | --- | --- |
| `bewertung_start` | Formular erstmals sichtbar | – |
| `bewertung_schritt` | Erster sichtbarer Schritt bzw. Schrittwechsel | `schritt`, `schritt_name`, `objektart` |
| `bewertung_abschluss` | Server bestätigt Speicherung | `objektart`, `anlass`, `plz` |

Neue Schrittnamen: `ausstattung`, `zeitraum`. Für Funnels den Schrittnamen statt der Nummer verwenden (Zweige sind unterschiedlich lang). Keine Namen, E-Mails, Telefonnummern oder Straßen im DataLayer. Die Weiterleitung wartet per `eventCallback` auf GTM (Sicherheits-Timeout 1,2 s). Complianz entscheidet weiterhin über den Statistik-Consent.

## Datenschutzerklärung ergänzen

- Verarbeitung der Formularangaben zur Bearbeitung der Bewertungsanfrage (Art. 6 Abs. 1 lit. b DSGVO).
- Falls „Herkunft speichern“ aktiv: UTM-Parameter und Verweis-Domain werden zur Anfrage gespeichert.
- Falls Webhook aktiv: Weitergabe an den genannten Dienst (CRM/Automatisierung).
- Löschfrist nennen (Einstellung „Automatisch löschen nach“).

## Cache & Integration

- `/immobilienbewertung/danke/` vom Seiten- und CDN-Cache ausschließen.
- `wp-admin/admin-ajax.php` darf nicht von Firewall/Cache blockiert werden. Token werden frisch geladen – gecachte Seiten sind kein Problem.
- Bei „Delay JavaScript“ (WP Rocket, LiteSpeed …) `assets/form.js` ausnehmen.
- Keine feste Höhe für den Elementor-Container. Empfohlene maximale Breite: 1100 px.

## Für Entwickler

- Filter `irb_schema` – Schritte, Optionen, Unterarten anpassen.
- Filter `irb_before_save` – Daten vor dem Speichern ändern.
- Action `irb_request_saved( $id, $data )` – nach dem Speichern.
- Filter `irb_capability` – Berechtigung für das Backend (Standard `manage_options`).
- Struktur: `includes/` (Plugin, Schema, Validator, Security, Repository, Mailer, Frontend, Admin), `templates/` (Mail, Danke-Seite), `assets/` (Formular, Block, Admin-CSS), `schema.json`.

## Geprüft

Lokal mit echtem WordPress 7.1 (Block-Theme Twenty Twenty-Five) und Chromium:
Update von 1.3.0 mit vorhandenen Anfragen; alle vier Zweige inkl. optionaler/bedingter Schritte; Entwurf nach Reload; „Ändern“-Rücksprung; Vorauswahl per URL; Feldfehler; DataLayer-Ereignisse identisch zu 1.3; Danke-Seite mit/ohne gültigen Cookie; Desktop 1400 px und Mobil 390 px.
Server: Token zu früh/ungültig, fremde Herkunft, Honeypot, ungültige PLZ/Option, Link im Namen, fehlender Pflichtschritt, Doppel-Absendung, Rate-Limit, Mailausfall mit Wiederholung ohne Doppelversand, signierter Webhook, Löschfrist, Cron nach Update ohne Reaktivierung.
Admin: Liste, Suche, Filter, Status/Notizen, Mehrfachaktionen, CSV, Einstellungen, Testmail.

Nicht lokal prüfbar – bitte auf der Live-/Staging-Seite kontrollieren: echter Mail-Eingang (Absender/SPF), Elementor-Darstellung im echten Theme, GTM-Preview/GA4-DebugView, Complianz.
