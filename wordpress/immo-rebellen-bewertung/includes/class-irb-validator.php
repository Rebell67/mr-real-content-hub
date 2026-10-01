<?php
if (!defined('ABSPATH')) {
	exit;
}

/**
 * Serverseitige Prüfung. Übernimmt nur Felder, die im gewählten Pfad vorkommen.
 */
final class IRB_Validator {

	const EMAIL_PATTERN = '/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/';

	/** @return array|WP_Error */
	public static function validate($raw) {
		if (!is_array($raw)) {
			return self::error('Bitte prüfe deine Angaben.');
		}

		$d = [];
		foreach ($raw as $k => $v) {
			$k = (string) $k;
			if ($k === 'quelle') {
				continue;
			}
			if (is_array($v)) {
				$list = [];
				foreach (array_slice($v, 0, 20) as $item) {
					if (is_scalar($item)) {
						$list[] = sanitize_text_field((string) $item);
					}
				}
				$d[$k] = $list;
				continue;
			}
			if (!is_scalar($v) && $v !== null) {
				return self::error('Eine Eingabe ist ungültig.');
			}
			$v = (string) $v;
			$max = $k === 'nachricht' ? 2000 : 500;
			if (strlen($v) > $max) {
				return self::error('Eine Eingabe ist zu lang.');
			}
			$d[$k] = $k === 'nachricht' ? sanitize_textarea_field($v) : sanitize_text_field($v);
		}

		$s = IRB_Schema::get();
		$type = isset($d['objektart']) && is_string($d['objektart']) ? $d['objektart'] : '';
		if (!isset($s['paths'][$type])) {
			return self::error('Bitte wähle eine Objektart.');
		}

		$clean = [];
		foreach (IRB_Schema::path($d) as $id) {
			$step = $s['steps'][$id];
			$v = isset($d[$id]) ? $d[$id] : '';
			$fail = self::error('Bitte prüfe: ' . $step['question'], $id);

			switch ($step['type']) {
				case 'choice':
					if (!is_string($v) || !in_array($v, IRB_Schema::options_for($id, $type), true)) {
						return $fail;
					}
					$clean[$id] = $v;
					break;

				case 'multi':
					$v = is_array($v) ? array_values(array_unique($v)) : [];
					$allowed = IRB_Schema::options_for($id, $type);
					if (array_diff($v, $allowed)) {
						return $fail;
					}
					$clean[$id] = $v;
					break;

				case 'area':
				case 'counter':
					if ($v === '' && !empty($step['optional'])) {
						$clean[$id] = '';
						break;
					}
					$n = self::number($v);
					if ($n === null || $n < $step['min'] || $n > $step['max'] || ($step['type'] === 'counter' && floor($n) != $n)) {
						return $fail;
					}
					$clean[$id] = $step['type'] === 'counter' ? (string) (int) $n : (string) $n;
					break;

				case 'year':
					if (is_string($v) && in_array($v, $step['periods'], true)) {
						$clean[$id] = $v;
						break;
					}
					if (!is_string($v) || !preg_match('/^\d{4}$/', $v) || (int) $v < $step['min'] || (int) $v > $step['max']) {
						return self::error('Bitte gib ein Baujahr zwischen ' . $step['min'] . ' und ' . $step['max'] . ' an oder wähle einen Zeitraum.', $id);
					}
					$clean[$id] = $v;
					break;

				case 'address':
					foreach (['strasse' => 120, 'hausnummer' => 30, 'plz' => 4, 'ort' => 100] as $k => $len) {
						$val = isset($d[$k]) && is_string($d[$k]) ? trim($d[$k]) : '';
						if ($val === '' || mb_strlen($val) > $len) {
							return self::error('Bitte gib die vollständige Adresse der Immobilie an.', $k);
						}
						$clean[$k] = $val;
					}
					if (!preg_match('/^[1-9]\d{3}$/', $clean['plz'])) {
						return self::error('Bitte gib eine vierstellige österreichische PLZ ein.', 'plz');
					}
					break;

				case 'contact':
					$contact = self::contact($d, $s);
					if (is_wp_error($contact)) {
						return $contact;
					}
					$clean = array_merge($clean, $contact);
					break;
			}
		}

		$clean['quelle'] = self::source(isset($raw['quelle']) ? $raw['quelle'] : null);
		if (!$clean['quelle']) {
			unset($clean['quelle']);
		}
		return $clean;
	}

	private static function contact(array $d, array $s) {
		$c = [];
		foreach (['vorname' => 80, 'nachname' => 80] as $k => $len) {
			$v = isset($d[$k]) && is_string($d[$k]) ? trim($d[$k]) : '';
			if ($v === '' || mb_strlen($v) > $len) {
				return self::error('Bitte gib deinen Vor- und Nachnamen an.', $k);
			}
			// Schutz vor Missbrauch der Bestätigungsmail: keine Links/Adressen im Namen.
			if (preg_match('~(https?:|www\.|@|\.[a-z]{2,}/|[<>{}\[\]]|\d{3,})~i', $v)) {
				return self::error('Bitte gib deinen Namen ohne Links oder Sonderzeichen an.', $k);
			}
			$c[$k] = $v;
		}

		$email = isset($d['email']) && is_string($d['email']) ? trim($d['email']) : '';
		if (!is_email($email) || !preg_match(self::EMAIL_PATTERN, $email) || strlen($email) > 180) {
			return self::error('Bitte prüfe deine E-Mail-Adresse.', 'email');
		}
		$c['email'] = $email;

		$phone = isset($d['telefon']) && is_string($d['telefon']) ? trim($d['telefon']) : '';
		if (!self::phone_ok($phone)) {
			return self::error('Bitte gib eine plausible Telefonnummer mit Vorwahl ein, z. B. +43 660 1234567.', 'telefon');
		}
		$c['telefon'] = $phone;

		$anrede = isset($d['anrede']) ? $d['anrede'] : '';
		$c['anrede'] = in_array($anrede, $s['contact']['anrede'], true) ? $anrede : 'Keine Angabe';

		$erreichbar = isset($d['erreichbarkeit']) ? $d['erreichbarkeit'] : '';
		if (in_array($erreichbar, $s['contact']['erreichbarkeit'], true) && $erreichbar !== 'Jederzeit') {
			$c['erreichbarkeit'] = $erreichbar;
		}

		$msg = isset($d['nachricht']) && is_string($d['nachricht']) ? trim($d['nachricht']) : '';
		if ($msg !== '') {
			$c['nachricht'] = mb_substr($msg, 0, 2000);
		}

		if ((isset($d['datenschutz']) ? $d['datenschutz'] : '') !== '1') {
			return self::error('Bitte bestätige den Datenschutzhinweis.', 'datenschutz');
		}
		$c['datenschutz'] = 'Bestätigt';
		return $c;
	}

	public static function phone_ok($phone) {
		$digits = preg_replace('/^00/', '', preg_replace('/\D/', '', $phone));
		return (bool) preg_match('/^(?:\+|0)[0-9\s()\/.\-]+$/', $phone)
			&& strlen($phone) <= 40
			&& strlen($digits) >= 7
			&& strlen($digits) <= 15
			&& !preg_match('/^(\d)\1+$/', $digits);
	}

	/** Akzeptiert „85“, „85,5“, „1.200“ und „1.200,5“. */
	public static function number($v) {
		if (!is_string($v) && !is_numeric($v)) {
			return null;
		}
		$v = trim((string) $v);
		if (preg_match('/^\d{1,3}(\.\d{3})+(,\d+)?$/', $v)) {
			$v = str_replace('.', '', $v);
		}
		$v = str_replace(',', '.', $v);
		if (!preg_match('/^\d+(\.\d{1,2})?$/', $v)) {
			return null;
		}
		return (float) $v;
	}

	/** Herkunft (UTM + Verweis-Domain) – nur wenn in den Einstellungen aktiviert. */
	private static function source($raw) {
		if (!IRB_Plugin::option('store_source') || !is_array($raw)) {
			return [];
		}
		$out = [];
		foreach (['utm_source', 'utm_medium', 'utm_campaign', 'referrer'] as $k) {
			if (!empty($raw[$k]) && is_scalar($raw[$k])) {
				$out[$k] = mb_substr(sanitize_text_field((string) $raw[$k]), 0, 100);
			}
		}
		return $out;
	}

	private static function error($message, $field = '') {
		return new WP_Error('input', $message, ['field' => $field]);
	}
}
