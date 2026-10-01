<?php
if (!defined('ABSPATH')) {
	exit;
}

require_once IRB_DIR . '/includes/class-irb-list-table.php';

/**
 * Backend: Anfragenliste, Detailansicht, Einstellungen, Export, Dashboard-Widget.
 * Alles nur für Administratoren (manage_options) – anpassbar über den Filter „irb_capability“.
 */
final class IRB_Admin {

	private static $list_hook = '';

	public static function cap() {
		return apply_filters('irb_capability', 'manage_options');
	}

	public static function init() {
		add_action('admin_menu', [__CLASS__, 'menu']);
		add_action('admin_init', [__CLASS__, 'register_settings']);
		add_action('admin_enqueue_scripts', [__CLASS__, 'assets']);
		add_action('wp_dashboard_setup', [__CLASS__, 'dashboard']);
		foreach (['irb_update', 'irb_retry', 'irb_delete', 'irb_export', 'irb_testmail'] as $a) {
			add_action('admin_post_' . $a, [__CLASS__, str_replace('irb_', 'action_', $a)]);
		}
		add_filter('plugin_action_links_' . plugin_basename(IRB_FILE), function ($links) {
			array_unshift($links, '<a href="' . esc_url(admin_url('admin.php?page=irb-settings')) . '">Einstellungen</a>');
			return $links;
		});
		add_filter('set-screen-option', function ($status, $option, $value) {
			return $option === 'irb_per_page' ? (int) $value : $status;
		}, 10, 3);
	}

	public static function menu() {
		$new = IRB_Repository::status_counts()['neu'];
		$bubble = $new ? ' <span class="awaiting-mod count-' . $new . '"><span class="pending-count">' . $new . '</span></span>' : '';
		self::$list_hook = add_menu_page('Bewertungsanfragen', 'Bewertungen' . $bubble, self::cap(), 'irb-requests', [__CLASS__, 'page_requests'], 'dashicons-building', 26);
		add_submenu_page('irb-requests', 'Bewertungsanfragen', 'Anfragen', self::cap(), 'irb-requests', [__CLASS__, 'page_requests']);
		add_submenu_page('irb-requests', 'Einstellungen', 'Einstellungen', self::cap(), 'irb-settings', [__CLASS__, 'page_settings']);
		add_action('load-' . self::$list_hook, [__CLASS__, 'load_requests']);
	}

	public static function assets($hook) {
		if (strpos((string) $hook, 'irb-') === false && $hook !== 'index.php') {
			return;
		}
		wp_enqueue_style('irb-admin', plugins_url('assets/admin.css', IRB_FILE), [], IRB_VERSION);
	}

	private static function redirect($args = []) {
		wp_safe_redirect(add_query_arg($args, admin_url('admin.php?page=irb-requests')));
		exit;
	}

	/* ------------------------------------------------------------------ Liste */

	public static function load_requests() {
		add_screen_option('per_page', ['label' => 'Anfragen pro Seite', 'default' => 25, 'option' => 'irb_per_page']);

		$table = new IRB_List_Table();
		$action = $table->current_action();
		if (!$action || empty($_REQUEST['ids'])) {
			return;
		}
		check_admin_referer('bulk-anfragen');
		if (!current_user_can(self::cap())) {
			wp_die('Keine Berechtigung.');
		}
		$ids = array_map('absint', (array) $_REQUEST['ids']);
		if ($action === 'delete') {
			$n = IRB_Repository::delete($ids);
			self::redirect(['irb_notice' => 'deleted', 'n' => $n]);
		}
		if (strpos($action, 'status_') === 0) {
			$status = substr($action, 7);
			if (isset(IRB_Repository::STATUSES[$status])) {
				foreach ($ids as $id) {
					IRB_Repository::update($id, ['status' => $status]);
				}
				self::redirect(['irb_notice' => 'status', 'n' => count($ids)]);
			}
		}
	}

	private static function notice() {
		$msgs = [
			'deleted' => '%d Anfrage(n) gelöscht.',
			'status'  => 'Status für %d Anfrage(n) geändert.',
			'saved'   => 'Änderungen gespeichert.',
			'retried' => 'Zustellung erneut versucht – Ergebnis siehe unten.',
			'test_ok' => 'Testmail wurde an den Versand übergeben. Bitte Posteingang (und Spam) prüfen.',
			'test_fail' => 'Testmail konnte nicht übergeben werden. Bitte SMTP-/Mail-Konfiguration der Website prüfen.',
		];
		$key = isset($_GET['irb_notice']) ? sanitize_key($_GET['irb_notice']) : '';
		if (isset($msgs[$key])) {
			$type = $key === 'test_fail' ? 'error' : 'success';
			printf('<div class="notice notice-%s is-dismissible"><p>%s</p></div>', $type, esc_html(sprintf($msgs[$key], isset($_GET['n']) ? (int) $_GET['n'] : 0)));
		}
	}

	public static function page_requests() {
		if (!current_user_can(self::cap())) {
			return;
		}
		$id = isset($_GET['request']) ? absint($_GET['request']) : 0;
		if ($id) {
			self::page_detail($id);
			return;
		}
		$table = new IRB_List_Table();
		$table->prepare_items();
		$week = IRB_Repository::count_since(wp_date('Y-m-d H:i:s', time() - WEEK_IN_SECONDS));
		$counts = IRB_Repository::status_counts();

		echo '<div class="wrap irb-admin"><h1 class="wp-heading-inline">Bewertungsanfragen</h1><hr class="wp-header-end">';
		self::notice();
		echo '<div class="irb-kpis">';
		self::kpi('Neu', $counts['neu'], 'warten auf Kontakt');
		self::kpi('Letzte 7 Tage', $week, 'neue Anfragen');
		self::kpi('In Bearbeitung', $counts['kontaktiert'] + $counts['termin'] + $counts['bewertet'], 'kontaktiert bis bewertet');
		self::kpi('Aufträge', $counts['auftrag'], 'gewonnen');
		echo '</div>';
		echo '<form method="get"><input type="hidden" name="page" value="irb-requests">';
		if (!empty($_GET['status'])) {
			echo '<input type="hidden" name="status" value="' . esc_attr(sanitize_key($_GET['status'])) . '">';
		}
		$table->views();
		$table->search_box('Suchen', 'irb-search');
		$table->display();
		echo '</form>';
		echo '<p class="irb-muted">„An Versand übergeben“ bestätigt die Übergabe an WordPress, nicht den Eingang im Postfach. Offene Zustellungen werden stündlich bis zu dreimal versucht. ';
		$days = (int) IRB_Plugin::option('retention_days');
		echo $days ? esc_html('Anfragen werden nach ' . $days . ' Tagen automatisch gelöscht.') : 'Automatisches Löschen ist ausgeschaltet – Löschfrist unter Einstellungen festlegen.';
		echo '</p></div>';
	}

	private static function kpi($label, $value, $sub) {
		printf('<div class="irb-kpi"><span>%s</span><strong>%d</strong><small>%s</small></div>', esc_html($label), (int) $value, esc_html($sub));
	}

	/* ------------------------------------------------------------------ Detail */

	private static function page_detail($id) {
		$r = IRB_Repository::get($id);
		echo '<div class="wrap irb-admin">';
		if (!$r) {
			echo '<h1>Anfrage nicht gefunden</h1><p><a href="' . esc_url(admin_url('admin.php?page=irb-requests')) . '">← Zurück zur Liste</a></p></div>';
			return;
		}
		$d = $r->data;
		$name = trim((isset($d['vorname']) ? $d['vorname'] : '') . ' ' . (isset($d['nachname']) ? $d['nachname'] : ''));
		$tel = isset($d['telefon']) ? $d['telefon'] : '';
		$mail = isset($d['email']) ? $d['email'] : '';
		$maps = 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode(trim((isset($d['strasse']) ? $d['strasse'] : '') . ' ' . (isset($d['hausnummer']) ? $d['hausnummer'] : '') . ', ' . (isset($d['plz']) ? $d['plz'] : '') . ' ' . (isset($d['ort']) ? $d['ort'] : '')) . ', Österreich');
		$prio = isset(IRB_Schema::PRIORITIES[$r->priority]) ? IRB_Schema::PRIORITIES[$r->priority] : $r->priority;

		echo '<p><a href="' . esc_url(admin_url('admin.php?page=irb-requests')) . '">← Alle Anfragen</a></p>';
		echo '<h1>Anfrage #' . (int) $r->id . ' · ' . esc_html($name) . '</h1>';
		self::notice();
		echo '<p class="irb-muted">Eingegangen am ' . esc_html(mysql2date('d.m.Y \u\m H:i', $r->created_at)) . ' · Priorität <span class="irb-prio irb-prio-' . esc_attr($r->priority) . '">' . esc_html($prio) . '</span></p>';

		echo '<div class="irb-detail"><div class="irb-detail-main">';
		echo '<div class="irb-quick">'
			. '<a class="button button-primary" href="tel:' . esc_attr(preg_replace('/[^+0-9]/', '', $tel)) . '">Anrufen ' . esc_html($tel) . '</a>'
			. '<a class="button" href="mailto:' . esc_attr($mail) . '?subject=' . rawurlencode('Deine Immobilienbewertung – ' . IRB_Plugin::option('brand')) . '">E-Mail schreiben</a>'
			. '<a class="button" target="_blank" rel="noopener" href="' . esc_url($maps) . '">Auf Karte zeigen</a></div>';

		foreach (IRB_Schema::summary($d) as $title => $rows) {
			echo '<div class="irb-card"><h2>' . esc_html($title) . '</h2><table class="irb-table">';
			foreach ($rows as $row) {
				echo '<tr><th>' . esc_html($row[0]) . '</th><td>' . nl2br(esc_html($row[1])) . '</td></tr>';
			}
			echo '</table></div>';
		}
		echo '</div><div class="irb-detail-side">';

		// Status & Notizen
		echo '<form class="irb-card" method="post" action="' . esc_url(admin_url('admin-post.php')) . '"><h2>Bearbeitung</h2>';
		wp_nonce_field('irb_update_' . $r->id);
		echo '<input type="hidden" name="action" value="irb_update"><input type="hidden" name="id" value="' . (int) $r->id . '">';
		echo '<p><label for="irb-status"><strong>Status</strong></label><br><select id="irb-status" name="status" class="widefat">';
		foreach (IRB_Repository::STATUSES as $k => $label) {
			echo '<option value="' . esc_attr($k) . '"' . selected($r->status, $k, false) . '>' . esc_html($label) . '</option>';
		}
		echo '</select></p><p><label for="irb-notes"><strong>Interne Notizen</strong></label><textarea id="irb-notes" name="notes" rows="6" class="widefat" placeholder="z. B. Rückruf vereinbart für Do., 10 Uhr">' . esc_textarea((string) $r->notes) . '</textarea></p>';
		submit_button('Speichern', 'primary', 'submit', false);
		if ($r->updated_at) {
			echo ' <span class="irb-muted">Zuletzt geändert ' . esc_html(mysql2date('d.m.Y, H:i', $r->updated_at)) . '</span>';
		}
		echo '</form>';

		// Zustellung
		echo '<div class="irb-card"><h2>Zustellung</h2><table class="irb-table">';
		foreach (['admin_mail' => 'Interne Mail', 'customer_mail' => 'Bestätigung an Kunde', 'webhook' => 'Webhook'] as $k => $label) {
			$st = $r->$k;
			echo '<tr><th>' . esc_html($label) . '</th><td>' . esc_html(isset(IRB_Mailer::STATUS_LABELS[$st]) ? IRB_Mailer::STATUS_LABELS[$st] : $st) . '</td></tr>';
		}
		echo '<tr><th>Versuche</th><td>' . (int) $r->attempts . '</td></tr></table>';
		if (in_array('failed', [$r->admin_mail, $r->customer_mail, $r->webhook], true) || in_array('pending', [$r->admin_mail, $r->customer_mail, $r->webhook], true)) {
			self::action_button('irb_retry', $r->id, 'Offene Zustellungen erneut versuchen', 'secondary');
		}
		echo '</div>';

		echo '<div class="irb-card irb-danger"><h2>Löschen</h2><p class="irb-muted">Entfernt die Anfrage endgültig (z. B. auf Wunsch der Person gemäß DSGVO).</p>';
		self::action_button('irb_delete', $r->id, 'Anfrage endgültig löschen', 'delete', "return confirm('Anfrage endgültig löschen?')");
		echo '</div></div></div></div>';
	}

	private static function action_button($action, $id, $label, $class, $onsubmit = '') {
		echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '"' . ($onsubmit ? ' onsubmit="' . esc_attr($onsubmit) . '"' : '') . '>';
		echo '<input type="hidden" name="action" value="' . esc_attr($action) . '"><input type="hidden" name="id" value="' . (int) $id . '">';
		wp_nonce_field($action . '_' . $id);
		submit_button($label, $class, 'submit', false);
		echo '</form>';
	}

	private static function guard($action) {
		if (!current_user_can(self::cap())) {
			wp_die('Keine Berechtigung.');
		}
		$id = isset($_POST['id']) ? absint($_POST['id']) : 0;
		check_admin_referer($action . '_' . $id);
		return $id;
	}

	public static function action_update() {
		$id = self::guard('irb_update');
		$status = isset($_POST['status']) ? sanitize_key($_POST['status']) : 'neu';
		IRB_Repository::update($id, [
			'status' => isset(IRB_Repository::STATUSES[$status]) ? $status : 'neu',
			'notes'  => sanitize_textarea_field(wp_unslash(isset($_POST['notes']) ? $_POST['notes'] : '')),
		]);
		self::redirect(['request' => $id, 'irb_notice' => 'saved']);
	}

	public static function action_retry() {
		$id = self::guard('irb_retry');
		IRB_Mailer::deliver($id);
		self::redirect(['request' => $id, 'irb_notice' => 'retried']);
	}

	public static function action_delete() {
		$id = self::guard('irb_delete');
		IRB_Repository::delete([$id]);
		self::redirect(['irb_notice' => 'deleted', 'n' => 1]);
	}

	/** CSV für Excel (UTF-8 mit BOM, Semikolon). Respektiert die aktiven Filter. */
	public static function action_export() {
		if (!current_user_can(self::cap())) {
			wp_die('Keine Berechtigung.');
		}
		check_admin_referer('irb_export');
		$rows = IRB_Repository::query(IRB_List_Table::filters());

		nocache_headers();
		header('Content-Type: text/csv; charset=utf-8');
		header('Content-Disposition: attachment; filename="bewertungsanfragen-' . wp_date('Y-m-d') . '.csv"');
		$out = fopen('php://output', 'w');
		fwrite($out, "\xEF\xBB\xBF");
		$fields = ['objektart', 'unterart', 'wohnflaeche', 'nutzflaeche', 'grundflaeche', 'grund_optional', 'zimmer', 'baujahr', 'zustand', 'ausstattung', 'nutzung', 'widmung', 'bebaut', 'anlass', 'zeitraum', 'strasse', 'hausnummer', 'plz', 'ort', 'anrede', 'vorname', 'nachname', 'email', 'telefon', 'erreichbarkeit', 'nachricht'];
		$steps = IRB_Schema::get()['steps'];
		$headers = array_map(function ($f) use ($steps) {
			if (isset(IRB_Schema::LABELS[$f])) {
				return IRB_Schema::LABELS[$f];
			}
			$label = isset($steps[$f]['label']) ? $steps[$f]['label'] : $f;
			return $f === 'grund_optional' ? 'Grundstück (Gewerbe)' : $label;
		}, $fields);
		fputcsv($out, array_merge(['ID', 'Datum', 'Status', 'Priorität'], $headers, ['Herkunft', 'Notizen']), ';');
		foreach ($rows as $r) {
			$line = [$r->id, mysql2date('d.m.Y H:i', $r->created_at), IRB_Repository::STATUSES[$r->status] ?? $r->status, $r->priority];
			foreach ($fields as $f) {
				$v = isset($r->data[$f]) ? $r->data[$f] : '';
				if ($f === 'objektart') {
					$v = IRB_Schema::type_label($v);
				}
				$line[] = self::csv_safe(is_array($v) ? implode(', ', $v) : $v);
			}
			$src = isset($r->data['quelle']) && is_array($r->data['quelle']) ? implode(' / ', $r->data['quelle']) : '';
			$line[] = self::csv_safe($src);
			$line[] = self::csv_safe((string) $r->notes);
			fputcsv($out, $line, ';');
		}
		fclose($out);
		exit;
	}

	/** Verhindert Formel-Injection beim Öffnen in Excel. */
	private static function csv_safe($v) {
		$v = (string) $v;
		return preg_match('/^[=+\-@\t\r]/', $v) && !preg_match('/^\+?\d[\d\s\/()-]*$/', $v) ? "'" . $v : $v;
	}

	public static function action_testmail() {
		if (!current_user_can(self::cap())) {
			wp_die('Keine Berechtigung.');
		}
		check_admin_referer('irb_testmail');
		$o = IRB_Plugin::options();
		$html = IRB_Mailer::render([
			'title'    => 'Testmail – Immobilienbewertung',
			'intro'    => 'Wenn du diese Nachricht siehst, funktioniert der Versand über WordPress. Die Bewertungsanfragen kommen genau so an.',
			'sections' => ['Beispiel' => [['Objektart', 'Wohnung'], ['Wohnfläche', '78 m²'], ['Ort', '1070 Wien']]],
			'buttons'  => [['Zu den Anfragen', admin_url('admin.php?page=irb-requests')]],
			'footer'   => 'Gesendet von ' . esc_html(home_url('/')),
		]);
		$ok = wp_mail($o['recipient'], 'Testmail: Immobilienbewertung', $html, ['Content-Type: text/html; charset=UTF-8']);
		wp_safe_redirect(admin_url('admin.php?page=irb-settings&irb_notice=' . ($ok ? 'test_ok' : 'test_fail')));
		exit;
	}

	/* ------------------------------------------------------------------ Dashboard */

	public static function dashboard() {
		if (!current_user_can(self::cap())) {
			return;
		}
		wp_add_dashboard_widget('irb_dashboard', 'Bewertungsanfragen', function () {
			$rows = IRB_Repository::query(['per_page' => 5]);
			$new = IRB_Repository::status_counts()['neu'];
			echo '<p><strong>' . (int) $new . '</strong> neue Anfrage(n) · <strong>' . (int) IRB_Repository::count_since(wp_date('Y-m-d H:i:s', time() - WEEK_IN_SECONDS)) . '</strong> in den letzten 7 Tagen</p>';
			if (!$rows) {
				echo '<p class="irb-muted">Noch keine Anfragen.</p>';
				return;
			}
			echo '<ul class="irb-dash">';
			foreach ($rows as $r) {
				$d = $r->data;
				echo '<li><a href="' . esc_url(admin_url('admin.php?page=irb-requests&request=' . (int) $r->id)) . '">'
					. esc_html(trim((isset($d['vorname']) ? $d['vorname'] : '') . ' ' . (isset($d['nachname']) ? $d['nachname'] : ''))) . '</a> · '
					. esc_html(IRB_Schema::type_label($r->objektart) . ', ' . $r->plz . ' ' . (isset($d['ort']) ? $d['ort'] : ''))
					. ' <span class="irb-status irb-status-' . esc_attr($r->status) . '">' . esc_html(IRB_Repository::STATUSES[$r->status] ?? $r->status) . '</span></li>';
			}
			echo '</ul><p><a class="button" href="' . esc_url(admin_url('admin.php?page=irb-requests')) . '">Alle Anfragen</a></p>';
		});
	}

	/* ------------------------------------------------------------------ Einstellungen */

	public static function register_settings() {
		register_setting('irb_settings', IRB_Plugin::OPTION, ['sanitize_callback' => [__CLASS__, 'sanitize']]);
	}

	private static function fields() {
		return [
			'Kontakt & Team' => [
				'recipient'     => ['Empfängeradresse', 'email', 'Erhält jede neue Anfrage. Antworten gehen direkt an den Interessenten.'],
				'cc'            => ['Weitere Empfänger', 'text', 'Optional, mehrere Adressen mit Komma trennen.'],
				'phone'         => ['Telefonnummer', 'text', 'Wird im Formular, auf der Danke-Seite und in der Bestätigung angezeigt.'],
				'brand'         => ['Firmenname', 'text', ''],
				'team'          => ['Team (Ansprache)', 'text', 'z. B. „Phillip & Lucas“ – erscheint auf der Kontaktkarte und in der Grußformel.'],
				'team_or'       => ['Team (Rückmeldung)', 'text', 'z. B. „Phillip oder Lucas“ – „… meldet sich persönlich bei dir“.'],
				'response_time' => ['Antwortzeit', 'text', 'z. B. „24 Stunden“.'],
				'photo'         => ['Foto-URL', 'url', 'Bild auf der Kontaktkarte. Am besten aus der Mediathek kopieren.'],
			],
			'Links' => [
				'privacy' => ['Datenschutzerklärung', 'url', ''],
				'objects' => ['Immobilien-Übersicht', 'url', 'Ziel des Buttons auf der Danke-Seite.'],
			],
			'Formular' => [
				'accent'              => ['Akzentfarbe', 'color', 'Fortschritt, Auswahl und Hover-Zustände.'],
				'feature_ausstattung' => ['Schritt „Ausstattung“', 'checkbox', 'Optionaler Schritt für Haus und Wohnung (Balkon, Garten, Lift …).'],
				'feature_zeitraum'    => ['Schritt „Verkaufszeitraum“', 'checkbox', 'Nur bei „Verkauf geplant“. Grundlage für die Lead-Priorität.'],
				'customer_mail'       => ['Bestätigung an Interessenten', 'checkbox', 'Automatische Eingangsbestätigung mit Zusammenfassung.'],
			],
			'Tracking' => [
				'tracking'     => ['Tracking', 'select', 'Ereignisse: bewertung_start, bewertung_schritt, bewertung_abschluss.', ['datalayer' => 'DataLayer – für Google Tag Manager (empfohlen)', 'ga4' => 'GA4 direkt – vorhandenes Google-Tag verwenden', 'off' => 'Aus']],
				'measurement'  => ['GA4-Mess-ID', 'text', 'Nur für „GA4 direkt“ (G-XXXXXXX). Bei GTM leer lassen.'],
				'store_source' => ['Herkunft speichern', 'checkbox', 'Speichert UTM-Parameter und Verweis-Domain zur Anfrage (keine Cookies). In der Datenschutzerklärung erwähnen.'],
			],
			'Integrationen' => [
				'webhook_url'    => ['Webhook-URL', 'url', 'Optional: Jede Anfrage zusätzlich als JSON an CRM, Zapier, Make oder n8n senden.'],
				'webhook_secret' => ['Webhook-Schlüssel', 'text', 'Signatur im Header X-IRB-Signature (HMAC-SHA256 des Bodys).'],
			],
			'Sicherheit & Datenschutz' => [
				'ip_header'           => ['IP-Ermittlung', 'select', 'Hinter Cloudflare oder einem Proxy den passenden Header wählen, sonst teilen sich alle Besucher das Limit.', ['REMOTE_ADDR' => 'Standard (REMOTE_ADDR)', 'HTTP_CF_CONNECTING_IP' => 'Cloudflare (CF-Connecting-IP)', 'HTTP_X_FORWARDED_FOR' => 'Proxy (X-Forwarded-For)', 'HTTP_X_REAL_IP' => 'Proxy (X-Real-IP)']],
				'rate_limit'          => ['Limit pro IP und Stunde', 'number', 'Neue Anfragen je IP-Adresse (gehasht) pro Stunde.'],
				'retention_days'      => ['Automatisch löschen nach', 'number', 'Tage. 0 = nie automatisch löschen. Empfehlung: 730 (2 Jahre) oder gemäß eurer Löschfrist.'],
				'delete_on_uninstall' => ['Beim Löschen des Plugins', 'checkbox', 'Alle Anfragen und Einstellungen entfernen, wenn das Plugin gelöscht wird.'],
			],
		];
	}

	public static function sanitize($raw) {
		$o = IRB_Plugin::options();
		// Nur Formular-Speicherungen prüfen; interne update_option-Aufrufe durchreichen.
		if (!is_array($raw) || empty($raw['_irb_form'])) {
			return is_array($raw) ? $raw : $o;
		}
		foreach (self::fields() as $fields) {
			foreach ($fields as $k => $f) {
				$v = isset($raw[$k]) ? wp_unslash($raw[$k]) : '';
				switch ($f[1]) {
					case 'email':
						if (is_email($v)) {
							$o[$k] = sanitize_email($v);
						} else {
							add_settings_error(IRB_Plugin::OPTION, $k, 'Bitte eine gültige Empfängeradresse eingeben.');
						}
						break;
					case 'url':
						$o[$k] = esc_url_raw(trim($v));
						if ($o[$k] === '' && in_array($k, ['privacy', 'objects', 'photo'], true)) {
							$o[$k] = IRB_Plugin::defaults()[$k];
						}
						break;
					case 'checkbox':
						$o[$k] = empty($raw[$k]) ? 0 : 1;
						break;
					case 'number':
						$o[$k] = max(0, min(100000, (int) $v));
						break;
					case 'color':
						$o[$k] = sanitize_hex_color($v) ?: IRB_Plugin::defaults()['accent'];
						break;
					case 'select':
						$o[$k] = isset($f[3][$v]) ? $v : array_keys($f[3])[0];
						break;
					default:
						$o[$k] = sanitize_text_field($v);
				}
			}
		}
		$o['rate_limit'] = max(1, (int) $o['rate_limit']);
		$o['cc'] = implode(', ', array_filter(array_map('trim', explode(',', $o['cc'])), 'is_email'));
		if (!preg_match('/^G-[A-Z0-9]+$/', $o['measurement'])) {
			$o['measurement'] = '';
		}
		if ($o['tracking'] === 'ga4' && !$o['measurement']) {
			add_settings_error(IRB_Plugin::OPTION, 'ga4', 'Für „GA4 direkt“ fehlt eine gültige Mess-ID (G-…). Es werden nur DataLayer-Ereignisse geschrieben.');
		}
		if (!$o['webhook_secret']) {
			$o['webhook_secret'] = wp_generate_password(32, false, false);
		}
		IRB_Schema::reset();
		return $o;
	}

	public static function page_settings() {
		if (!current_user_can(self::cap())) {
			return;
		}
		$o = IRB_Plugin::options();
		echo '<div class="wrap irb-admin"><h1>Immobilienbewertung – Einstellungen</h1>';
		self::notice();
		settings_errors(IRB_Plugin::OPTION);
		echo '<div class="irb-card irb-howto"><strong>Einbinden:</strong> Shortcode <code>[immo_bewertung]</code> (Elementor: Shortcode-Widget) oder Block „Immobilienbewertung“. '
			. 'Für Landingpages je Objektart: <code>[immo_bewertung objektart="wohnung"]</code> bzw. Link mit <code>?objektart=haus</code>. '
			. 'Danke-Seite: <code>' . esc_html(IRB_Frontend::THANKS_PATH) . '</code> (wird automatisch bereitgestellt, vom Cache ausnehmen).</div>';
		echo '<form method="post" action="options.php">';
		settings_fields('irb_settings');
		echo '<input type="hidden" name="' . esc_attr(IRB_Plugin::OPTION) . '[_irb_form]" value="1">';
		foreach (self::fields() as $section => $fields) {
			echo '<h2 class="title">' . esc_html($section) . '</h2><table class="form-table" role="presentation">';
			foreach ($fields as $k => $f) {
				$name = IRB_Plugin::OPTION . '[' . $k . ']';
				$id = 'irb-' . $k;
				echo '<tr><th scope="row"><label for="' . esc_attr($id) . '">' . esc_html($f[0]) . '</label></th><td>';
				switch ($f[1]) {
					case 'checkbox':
						echo '<label><input type="checkbox" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="1"' . checked(!empty($o[$k]), true, false) . '> Aktiv</label>';
						break;
					case 'select':
						echo '<select id="' . esc_attr($id) . '" name="' . esc_attr($name) . '">';
						foreach ($f[3] as $v => $l) {
							echo '<option value="' . esc_attr($v) . '"' . selected($o[$k], $v, false) . '>' . esc_html($l) . '</option>';
						}
						echo '</select>';
						break;
					case 'number':
						echo '<input type="number" min="0" class="small-text" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($o[$k]) . '">';
						break;
					case 'color':
						echo '<input type="color" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($o[$k]) . '">';
						break;
					default:
						echo '<input type="' . ($f[1] === 'email' ? 'email' : ($f[1] === 'url' ? 'url' : 'text')) . '" class="regular-text" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($o[$k]) . '">';
				}
				if ($f[2]) {
					echo '<p class="description">' . esc_html($f[2]) . '</p>';
				}
				echo '</td></tr>';
			}
			echo '</table>';
		}
		submit_button();
		echo '</form>';
		echo '<h2 class="title">Mailversand testen</h2><p>Sendet eine Beispiel-Mail an <strong>' . esc_html($o['recipient']) . '</strong> über die Mail-Konfiguration der Website.</p>';
		echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '"><input type="hidden" name="action" value="irb_testmail">';
		wp_nonce_field('irb_testmail');
		submit_button('Testmail senden', 'secondary', 'submit', false);
		echo '</form></div>';
	}
}
