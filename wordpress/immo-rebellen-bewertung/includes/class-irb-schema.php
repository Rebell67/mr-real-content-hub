<?php
if (!defined('ABSPATH')) {
	exit;
}

/**
 * Formularstruktur (schema.json) inkl. Feature-Schaltern, Pfadlogik und Beschriftungen.
 */
final class IRB_Schema {

	private static $cache = null;

	const LABELS = [
		'objektart'      => 'Objektart',
		'unterart'       => 'Unterart',
		'anrede'         => 'Anrede',
		'vorname'        => 'Vorname',
		'nachname'       => 'Nachname',
		'email'          => 'E-Mail',
		'telefon'        => 'Telefon',
		'erreichbarkeit' => 'Am besten erreichbar',
		'nachricht'      => 'Nachricht',
		'strasse'        => 'Straße',
		'hausnummer'     => 'Hausnummer',
		'plz'            => 'PLZ',
		'ort'            => 'Ort',
	];

	const PRIORITIES = [
		'hoch'   => 'Hoch',
		'mittel' => 'Mittel',
		'normal' => 'Normal',
	];

	/** Vollständiges Schema, gefiltert nach aktivierten Features. */
	public static function get() {
		if (self::$cache !== null) {
			return self::$cache;
		}
		$s = json_decode((string) file_get_contents(IRB_DIR . '/schema.json'), true);
		$s['steps']['baujahr']['max'] = (int) wp_date('Y');

		$o = IRB_Plugin::options();
		foreach ($s['steps'] as $id => $step) {
			if (!empty($step['feature']) && empty($o['feature_' . $step['feature']])) {
				$s['disabled'][] = $id;
			}
		}
		$s['disabled'] = isset($s['disabled']) ? $s['disabled'] : [];

		/** Erlaubt Anpassungen (z. B. zusätzliche Unterarten) ohne Plugin-Änderung. */
		self::$cache = apply_filters('irb_schema', $s);
		return self::$cache;
	}

	public static function reset() {
		self::$cache = null;
	}

	public static function type_label($type) {
		$s = self::get();
		return isset($s['types'][$type]) ? $s['types'][$type] : (string) $type;
	}

	/** Optionen eines Auswahl-Schritts (ggf. abhängig von der Objektart). */
	public static function options_for($step_id, $type) {
		$s = self::get();
		if ($step_id === 'objektart') {
			return array_keys($s['types']);
		}
		if ($step_id === 'unterart') {
			return isset($s['subtypes'][$type]) ? $s['subtypes'][$type] : [];
		}
		$step = isset($s['steps'][$step_id]) ? $s['steps'][$step_id] : [];
		if (isset($step['options_by_type'])) {
			return isset($step['options_by_type'][$type]) ? $step['options_by_type'][$type] : [];
		}
		return isset($step['options']) ? $step['options'] : [];
	}

	/** Reihenfolge der Schritte für die gegebenen Antworten – identisch zur Logik in form.js. */
	public static function path(array $data) {
		$s = self::get();
		$type = isset($data['objektart']) ? $data['objektart'] : '';
		if (!isset($s['paths'][$type])) {
			return ['objektart'];
		}
		$path = array_merge(['objektart', 'unterart'], $s['paths'][$type], $s['common']);
		$out = [];
		foreach ($path as $id) {
			if (in_array($id, $s['disabled'], true)) {
				continue;
			}
			$step = $s['steps'][$id];
			if ($step['type'] === 'multi' && !self::options_for($id, $type)) {
				continue;
			}
			if (!empty($step['when'])) {
				foreach ($step['when'] as $field => $values) {
					if (!in_array(isset($data[$field]) ? $data[$field] : null, $values, true)) {
						continue 2;
					}
				}
			}
			$out[] = $id;
		}
		return $out;
	}

	public static function priority(array $d) {
		$anlass = isset($d['anlass']) ? $d['anlass'] : '';
		$zeit = isset($d['zeitraum']) ? $d['zeitraum'] : '';
		if ($anlass === 'Verkauf geplant') {
			return in_array($zeit, ['So bald wie möglich', 'In 3–6 Monaten'], true) ? 'hoch' : 'mittel';
		}
		return $anlass === 'Vermietung geplant' ? 'mittel' : 'normal';
	}

	/** Grobe Region aus der österreichischen PLZ (für Übersicht und Filter). */
	public static function region($plz) {
		$map = ['1' => 'Wien', '2' => 'Niederösterreich/Burgenland', '3' => 'Niederösterreich', '4' => 'Oberösterreich', '5' => 'Salzburg', '6' => 'Tirol/Vorarlberg', '7' => 'Burgenland', '8' => 'Steiermark', '9' => 'Kärnten/Osttirol'];
		$first = substr((string) $plz, 0, 1);
		if ($first === '1') {
			return 'Wien ' . (int) substr($plz, 1, 2) . '. Bezirk';
		}
		return isset($map[$first]) ? $map[$first] : '';
	}

	public static function format_number($value, $unit = '') {
		if ($value === '' || $value === null) {
			return '';
		}
		if (!is_numeric($value)) {
			return (string) $value;
		}
		$v = (float) $value;
		$out = floor($v) == $v
			? number_format($v, 0, ',', '.')
			: rtrim(rtrim(number_format($v, 2, ',', '.'), '0'), ',');
		return $unit ? $out . ' ' . $unit : $out;
	}

	/**
	 * Lesbare Zusammenfassung als Abschnitte [Titel => [[Label, Wert], …]].
	 * Funktioniert auch mit Anfragen aus Version 1.x.
	 */
	public static function summary(array $d) {
		$s = self::get();
		$type = isset($d['objektart']) ? $d['objektart'] : '';
		$object = [
			['Objektart', self::type_label($type)],
			['Unterart', isset($d['unterart']) ? $d['unterart'] : ''],
		];
		$keys = isset($s['paths'][$type]) ? $s['paths'][$type] : [];
		$keys = array_merge($keys, ['anlass', 'zeitraum']);
		foreach ($keys as $k) {
			if (!array_key_exists($k, $d) || !isset($s['steps'][$k])) {
				continue;
			}
			$step = $s['steps'][$k];
			$v = $d[$k];
			if (is_array($v)) {
				$v = implode(', ', $v);
			} elseif (in_array($step['type'], ['area', 'counter'], true)) {
				$v = self::format_number($v, $step['type'] === 'area' ? 'm²' : '');
			}
			$object[] = [isset($step['label']) ? $step['label'] : $k, $v === '' ? 'Nicht angegeben' : $v];
		}

		$address = trim((isset($d['strasse']) ? $d['strasse'] : '') . ' ' . (isset($d['hausnummer']) ? $d['hausnummer'] : ''));
		$city = trim((isset($d['plz']) ? $d['plz'] : '') . ' ' . (isset($d['ort']) ? $d['ort'] : ''));
		$location = [['Adresse', $address], ['Ort', $city]];
		$region = isset($d['plz']) ? self::region($d['plz']) : '';
		if ($region) {
			$location[] = ['Region', $region];
		}

		$name = trim((isset($d['anrede']) && !in_array($d['anrede'], ['Keine Angabe', 'Divers'], true) ? $d['anrede'] . ' ' : '') . (isset($d['vorname']) ? $d['vorname'] : '') . ' ' . (isset($d['nachname']) ? $d['nachname'] : ''));
		$contact = [['Name', $name], ['E-Mail', isset($d['email']) ? $d['email'] : ''], ['Telefon', isset($d['telefon']) ? $d['telefon'] : '']];
		foreach (['erreichbarkeit', 'nachricht'] as $k) {
			if (!empty($d[$k])) {
				$contact[] = [self::LABELS[$k], $d[$k]];
			}
		}

		$sections = ['Immobilie' => $object, 'Lage' => $location, 'Kontakt' => $contact];

		if (!empty($d['quelle']) && is_array($d['quelle'])) {
			$src = [];
			foreach (['utm_source' => 'Quelle', 'utm_medium' => 'Medium', 'utm_campaign' => 'Kampagne', 'referrer' => 'Verweis'] as $k => $label) {
				if (!empty($d['quelle'][$k])) {
					$src[] = [$label, $d['quelle'][$k]];
				}
			}
			if ($src) {
				$sections['Herkunft'] = $src;
			}
		}
		return $sections;
	}

	/** Klartext-Variante der Zusammenfassung (Mail-Fallback, CSV, Webhook). */
	public static function summary_text(array $d) {
		$lines = [];
		foreach (self::summary($d) as $title => $rows) {
			$lines[] = strtoupper($title);
			foreach ($rows as $row) {
				$lines[] = $row[0] . ': ' . $row[1];
			}
			$lines[] = '';
		}
		return trim(implode("\n", $lines));
	}
}
