<?php
if (!defined('ABSPATH')) {
	exit;
}

/**
 * Signierte Formular-Token, Bestätigungs-Cookie, IP-Ermittlung und Rate-Limit.
 */
final class IRB_Security {

	const TOKEN_MAX_AGE = 7200;
	const TOKEN_MIN_AGE = 2;
	const RECEIPT_COOKIE = 'irb_receipt';
	const RECEIPT_TTL = 900;

	public static function sign($value) {
		return hash_hmac('sha256', (string) $value, wp_salt('auth'));
	}

	public static function issue_token() {
		$value = time() . '.' . wp_generate_password(24, false, false);
		return $value . '.' . self::sign($value);
	}

	/** @return true|WP_Error */
	public static function check_token($token) {
		$p = explode('.', (string) $token);
		if (count($p) !== 3 || !ctype_digit($p[0]) || !hash_equals(self::sign($p[0] . '.' . $p[1]), $p[2])) {
			return new WP_Error('token', 'Die Sitzung ist abgelaufen. Bitte versuche das Absenden erneut.', ['status' => 403]);
		}
		$age = time() - (int) $p[0];
		if ($age < 0 || $age > self::TOKEN_MAX_AGE) {
			return new WP_Error('token', 'Die Sitzung ist abgelaufen. Bitte versuche das Absenden erneut.', ['status' => 403]);
		}
		if ($age < self::TOKEN_MIN_AGE) {
			return new WP_Error('fast', 'Bitte warte kurz und versuche es erneut.', ['status' => 429]);
		}
		return true;
	}

	public static function same_origin() {
		$origin = isset($_SERVER['HTTP_ORIGIN']) ? (string) $_SERVER['HTTP_ORIGIN'] : '';
		if ($origin === '' || $origin === 'null') {
			return $origin === '';
		}
		$host = wp_parse_url($origin, PHP_URL_HOST);
		return in_array($host, [wp_parse_url(home_url(), PHP_URL_HOST), wp_parse_url(site_url(), PHP_URL_HOST)], true);
	}

	/**
	 * Hinter Cloudflare/Proxy liefert REMOTE_ADDR für alle Besucher dieselbe IP.
	 * Dann in den Einstellungen den passenden Header wählen (z. B. CF-Connecting-IP).
	 */
	public static function client_ip() {
		$header = IRB_Plugin::option('ip_header');
		$allowed = ['REMOTE_ADDR', 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP'];
		if (!in_array($header, $allowed, true)) {
			$header = 'REMOTE_ADDR';
		}
		$candidate = isset($_SERVER[$header]) ? (string) $_SERVER[$header] : '';
		if ($header === 'HTTP_X_FORWARDED_FOR') {
			$candidate = trim(explode(',', $candidate)[0]);
		}
		if (!filter_var($candidate, FILTER_VALIDATE_IP)) {
			$candidate = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
		}
		return $candidate;
	}

	/** Zählt nur akzeptierte neue Übermittlungen. IP wird ausschließlich gehasht verwendet. */
	public static function rate_limited() {
		$limit = max(1, (int) IRB_Plugin::option('rate_limit'));
		$key = 'irb_rate_' . substr(self::sign(self::client_ip()), 0, 32);
		$count = (int) get_transient($key);
		if ($count >= $limit) {
			return true;
		}
		set_transient($key, $count + 1, HOUR_IN_SECONDS);
		return false;
	}

	/** Kurzlebiger, signierter Cookie für die Danke-Seite. Enthält nur die Objektart. */
	public static function set_receipt($type) {
		$type = preg_replace('/[^a-z]/', '', (string) $type);
		$value = (time() + self::RECEIPT_TTL) . '.' . $type . '.' . wp_generate_password(16, false, false);
		setcookie(self::RECEIPT_COOKIE, $value . '.' . self::sign($value), [
			'expires'  => time() + self::RECEIPT_TTL,
			'path'     => '/',
			'secure'   => is_ssl(),
			'httponly' => true,
			'samesite' => 'Lax',
		]);
	}

	/** @return string|false Objektart bei gültigem Cookie, sonst false. */
	public static function read_receipt() {
		$p = explode('.', isset($_COOKIE[self::RECEIPT_COOKIE]) ? (string) $_COOKIE[self::RECEIPT_COOKIE] : '');
		if (count($p) !== 4 || !ctype_digit($p[0]) || (int) $p[0] < time()) {
			return false;
		}
		return hash_equals(self::sign($p[0] . '.' . $p[1] . '.' . $p[2]), $p[3]) ? $p[1] : false;
	}
}
