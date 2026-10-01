<?php
if (!defined('ABSPATH')) {
	exit;
}

/**
 * Interne Benachrichtigung, Kundenbestätigung (HTML + Text) und optionaler Webhook.
 * Versand über wp_mail() – Absender/SMTP der Website bleiben unverändert.
 */
final class IRB_Mailer {

	const STATUS_LABELS = [
		'accepted' => 'An Versand übergeben',
		'failed'   => 'Fehlgeschlagen',
		'pending'  => 'Ausstehend',
		'disabled' => 'Deaktiviert',
		'none'     => '–',
	];

	public static function process_queue() {
		foreach (IRB_Repository::pending_ids() as $id) {
			self::deliver($id);
		}
	}

	/**
	 * Stellt alle noch offenen Nachrichten einer Anfrage zu. Bereits erfolgreiche
	 * Zustellungen werden nie wiederholt. Ein atomarer Lock verhindert parallelen
	 * Versand durch Cron und Admin-Wiederholung.
	 */
	public static function deliver($id) {
		$lock = 'irb_mail_lock_' . (int) $id;
		if (!add_option($lock, time(), '', 'no')) {
			if (time() - (int) get_option($lock) < 600) {
				return;
			}
			delete_option($lock);
			if (!add_option($lock, time(), '', 'no')) {
				return;
			}
		}
		try {
			$r = IRB_Repository::get($id);
			if (!$r || $r->status === 'spam') {
				return;
			}
			$status = ['attempts' => (int) $r->attempts + 1];
			if (in_array($r->admin_mail, ['pending', 'failed'], true)) {
				$status['admin_mail'] = self::send_admin($r) ? 'accepted' : 'failed';
			}
			if (in_array($r->customer_mail, ['pending', 'failed'], true)) {
				$status['customer_mail'] = self::send_customer($r) ? 'accepted' : 'failed';
			}
			if (in_array($r->webhook, ['pending', 'failed'], true)) {
				$status['webhook'] = self::send_webhook($r) ? 'accepted' : 'failed';
			}
			IRB_Repository::update($id, $status);
		} finally {
			delete_option($lock);
		}
	}

	private static function send_admin($r) {
		$d = $r->data;
		$o = IRB_Plugin::options();
		$prio = IRB_Schema::priority($d);

		$subject = ($prio === 'hoch' ? '[Priorität hoch] ' : '')
			. 'Neue Bewertungsanfrage: ' . IRB_Schema::type_label($d['objektart'])
			. ', ' . $d['plz'] . ' ' . $d['ort'] . ', ' . $d['anlass'];

		$name = trim($d['vorname'] . ' ' . $d['nachname']);
		$maps = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($d['strasse'] . ' ' . $d['hausnummer'] . ', ' . $d['plz'] . ' ' . $d['ort'] . ', Österreich');
		$buttons = [
			['Anrufen', 'tel:' . preg_replace('/[^+0-9]/', '', $d['telefon'])],
			['Antworten', 'mailto:' . $d['email'] . '?subject=' . rawurlencode('Deine Immobilienbewertung – ' . $o['brand'])],
			['Auf Karte zeigen', $maps],
			['In WordPress öffnen', admin_url('admin.php?page=irb-requests&request=' . (int) $r->id)],
		];
		$intro = '<strong>' . esc_html($name) . '</strong> möchte eine Bewertung für '
			. esc_html(($d['unterart'] ?: IRB_Schema::type_label($d['objektart'])) . ' in ' . $d['plz'] . ' ' . $d['ort'])
			. '. Priorität: <strong>' . esc_html(IRB_Schema::PRIORITIES[$prio]) . '</strong>.';
		if (!empty($d['erreichbarkeit'])) {
			$intro .= ' Am besten erreichbar: ' . esc_html($d['erreichbarkeit']) . '.';
		}

		$html = self::render([
			'title'    => 'Neue Bewertungsanfrage #' . (int) $r->id,
			'intro'    => $intro,
			'sections' => IRB_Schema::summary($d),
			'buttons'  => $buttons,
			'footer'   => 'Antworten geht direkt an ' . esc_html($d['email']) . '.',
		]);
		$text = "Neue Bewertungsanfrage #" . (int) $r->id . "\n\n" . IRB_Schema::summary_text($d) . "\n\nIn WordPress öffnen: " . admin_url('admin.php?page=irb-requests&request=' . (int) $r->id);

		$to = array_filter(array_merge([$o['recipient']], array_map('trim', explode(',', (string) $o['cc']))), 'is_email');
		$reply_name = preg_replace('/[^\p{L}\p{M} .\'-]/u', '', $name);
		return self::send($to, $subject, $html, $text, ['Reply-To: ' . ($reply_name ? '"' . $reply_name . '" ' : '') . '<' . $d['email'] . '>']);
	}

	private static function send_customer($r) {
		$d = $r->data;
		$o = IRB_Plugin::options();
		$intro = 'Hallo ' . esc_html($d['vorname']) . ',<br><br>vielen Dank! Deine Bewertungsanfrage ist bei uns eingegangen. '
			. 'Du erhältst deine persönliche Ersteinschätzung innerhalb von <strong>' . esc_html($o['response_time']) . '</strong> von ' . esc_html($o['team_or']) . '.<br><br>'
			. 'Keine automatische Schätzung, sondern eine echte Bewertung mit Blick auf Lage, Zustand und aktuelle Vergleichsverkäufe.';
		$sections = IRB_Schema::summary($d);
		unset($sections['Herkunft']);

		$html = self::render([
			'title'    => 'Deine Anfrage ist eingegangen',
			'intro'    => $intro,
			'sections' => $sections,
			'buttons'  => [['Anrufen: ' . $o['phone'], 'tel:' . preg_replace('/[^+0-9]/', '', $o['phone'])]],
			'footer'   => 'Liebe Grüße<br>' . esc_html($o['team']) . '<br>' . esc_html($o['brand']) . ' · <a href="' . esc_url(home_url('/')) . '" style="color:inherit">' . esc_html(wp_parse_url(home_url(), PHP_URL_HOST)) . '</a>'
				. '<br><br><span style="font-size:11px">Informationen zur Verarbeitung deiner Daten: <a href="' . esc_url($o['privacy']) . '" style="color:inherit">Datenschutzerklärung</a></span>',
		]);
		$text = "Hallo " . $d['vorname'] . ",\n\nvielen Dank! Deine Bewertungsanfrage ist bei uns eingegangen.\n\nDu erhältst deine persönliche Ersteinschätzung innerhalb von " . $o['response_time'] . " von " . $o['team_or'] . ".\n\n"
			. "Deine Angaben:\n" . IRB_Schema::summary_text(array_diff_key($d, ['quelle' => 1])) . "\n\nFür dringende Fragen: " . $o['phone'] . "\n\nLiebe Grüße\n" . $o['team'] . "\n" . $o['brand'] . "\n" . home_url('/');

		return self::send([$d['email']], 'Deine Immobilienbewertung – ' . $o['brand'], $html, $text, ['Reply-To: ' . $o['recipient']]);
	}

	private static function send_webhook($r) {
		$o = IRB_Plugin::options();
		if (!$o['webhook_url']) {
			return true;
		}
		$body = wp_json_encode([
			'event'      => 'bewertung.created',
			'id'         => (int) $r->id,
			'created_at' => mysql2date('c', $r->created_at),
			'priority'   => $r->priority,
			'site'       => home_url('/'),
			'admin_url'  => admin_url('admin.php?page=irb-requests&request=' . (int) $r->id),
			'data'       => $r->data,
			'summary'    => IRB_Schema::summary_text($r->data),
		], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		$res = wp_remote_post($o['webhook_url'], [
			'timeout' => 8,
			'headers' => [
				'Content-Type'    => 'application/json; charset=utf-8',
				'X-IRB-Signature' => 'sha256=' . hash_hmac('sha256', $body, (string) $o['webhook_secret']),
			],
			'body'    => $body,
		]);
		$code = is_wp_error($res) ? 0 : (int) wp_remote_retrieve_response_code($res);
		return $code >= 200 && $code < 300;
	}

	private static function send(array $to, $subject, $html, $text, array $headers) {
		if (!$to) {
			return false;
		}
		$alt = function ($mailer) use ($text) {
			$mailer->AltBody = $text;
		};
		add_action('phpmailer_init', $alt);
		try {
			$ok = wp_mail($to, $subject, $html, array_merge(['Content-Type: text/html; charset=UTF-8'], $headers));
		} catch (Throwable $e) {
			$ok = false;
		}
		remove_action('phpmailer_init', $alt);
		return (bool) $ok;
	}

	public static function render(array $args) {
		$o = IRB_Plugin::options();
		$accent = sanitize_hex_color($o['accent']) ?: '#3e5945';
		$brand = $o['brand'];
		extract($args, EXTR_SKIP); // title, intro, sections, buttons, footer
		ob_start();
		include IRB_DIR . '/templates/mail.php';
		return (string) ob_get_clean();
	}
}
