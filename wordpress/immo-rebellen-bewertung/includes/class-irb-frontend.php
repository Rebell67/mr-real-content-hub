<?php
if (!defined('ABSPATH')) {
	exit;
}

/**
 * Shortcode, Block, AJAX-Endpunkte und virtuelle Danke-Seite.
 */
final class IRB_Frontend {

	const THANKS_PATH = '/immobilienbewertung/danke/';

	public static function init() {
		add_shortcode('immo_bewertung', [__CLASS__, 'shortcode']);
		add_action('init', [__CLASS__, 'register_block']);
		foreach (['irb_token' => 'ajax_token', 'irb_submit' => 'ajax_submit'] as $action => $method) {
			add_action('wp_ajax_' . $action, [__CLASS__, $method]);
			add_action('wp_ajax_nopriv_' . $action, [__CLASS__, $method]);
		}
		add_action('template_redirect', [__CLASS__, 'thanks_page'], 0);
	}

	public static function thanks_url() {
		return home_url(self::THANKS_PATH);
	}

	/* ------------------------------------------------------------------ Ausgabe */

	public static function register_block() {
		if (!function_exists('register_block_type')) {
			return;
		}
		wp_register_script('irb-block', plugins_url('assets/block.js', IRB_FILE), ['wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components'], IRB_VERSION, true);
		register_block_type('immo-rebellen/bewertung', [
			'api_version'     => 2,
			'title'           => 'Immobilienbewertung',
			'category'        => 'widgets',
			'icon'            => 'building',
			'editor_script'   => 'irb-block',
			'attributes'      => ['objektart' => ['type' => 'string', 'default' => '']],
			'render_callback' => function ($attrs) {
				return self::shortcode(['objektart' => isset($attrs['objektart']) ? $attrs['objektart'] : '']);
			},
		]);
	}

	public static function shortcode($atts = []) {
		$atts = shortcode_atts(['objektart' => ''], $atts, 'immo_bewertung');
		$o = IRB_Plugin::options();
		$s = IRB_Schema::get();

		wp_enqueue_style('irb-form', plugins_url('assets/form.css', IRB_FILE), [], IRB_VERSION);
		wp_enqueue_script('irb-form', plugins_url('assets/form.js', IRB_FILE), [], IRB_VERSION, true);

		$icons = [];
		foreach (array_keys($s['types']) as $type) {
			$file = IRB_DIR . '/assets/icon-' . $type . '.svg';
			$icons[$type] = is_readable($file) ? (string) file_get_contents($file) : '';
		}

		wp_localize_script('irb-form', 'IRB_CONFIG', [
			'ajax'        => admin_url('admin-ajax.php'),
			'thanks'      => self::thanks_url(),
			'schema'      => $s,
			'icons'       => $icons,
			'photo'       => $o['photo'],
			'privacy'     => $o['privacy'],
			'phone'       => $o['phone'],
			'brand'       => $o['brand'],
			'team'        => $o['team'],
			'teamOr'      => $o['team_or'],
			'response'    => $o['response_time'],
			'tracking'    => $o['tracking'],
			'measurement' => $o['measurement'],
			'storeSource' => (bool) $o['store_source'],
		]);

		$preset = isset($s['types'][$atts['objektart']]) ? $atts['objektart'] : '';
		$accent = sanitize_hex_color($o['accent']);
		return '<div class="irb-form" data-irb-root' . ($preset ? ' data-preset="' . esc_attr($preset) . '"' : '') . ($accent ? ' style="--irb-accent:' . esc_attr($accent) . '"' : '') . '>'
			. '<noscript>Bitte aktiviere JavaScript für das Formular oder ruf uns an: <a href="tel:' . esc_attr(preg_replace('/[^+0-9]/', '', $o['phone'])) . '">' . esc_html($o['phone']) . '</a>.</noscript>'
			. '<p class="irb-loading">Dein Weg zur persönlichen Immobilienbewertung …</p></div>';
	}

	/* ------------------------------------------------------------------ AJAX */

	public static function ajax_token() {
		nocache_headers();
		wp_send_json_success(['token' => IRB_Security::issue_token()]);
	}

	private static function fail($message, $status = 400, $field = '') {
		wp_send_json_error(['message' => $message, 'field' => $field], $status);
	}

	public static function ajax_submit() {
		nocache_headers();
		if ((isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '') !== 'POST') {
			self::fail('Ungültige Anfrage.', 405);
		}
		if (!IRB_Security::same_origin()) {
			self::fail('Ungültige Herkunft.', 403);
		}
		$check = IRB_Security::check_token(sanitize_text_field(wp_unslash(isset($_POST['token']) ? $_POST['token'] : '')));
		if (is_wp_error($check)) {
			self::fail($check->get_error_message(), $check->get_error_data()['status']);
		}
		// Honeypot: Bots erhalten eine scheinbare Bestätigung, es wird nichts gespeichert.
		if (!empty($_POST['website'])) {
			wp_send_json_success(['saved' => true, 'redirect' => self::thanks_url()]);
		}
		$key = sanitize_text_field(wp_unslash(isset($_POST['request_key']) ? $_POST['request_key'] : ''));
		if (!preg_match('/^[a-f0-9-]{32,64}$/', $key)) {
			self::fail('Bitte lade das Formular neu.');
		}
		$raw = wp_unslash(isset($_POST['data']) ? $_POST['data'] : '');
		if (!is_string($raw) || strlen($raw) > 24000) {
			self::fail('Die Anfrage ist zu groß.');
		}
		$d = IRB_Validator::validate(json_decode($raw, true));
		if (is_wp_error($d)) {
			$data = $d->get_error_data();
			self::fail($d->get_error_message(), 400, isset($data['field']) ? $data['field'] : '');
		}

		// Gleiche Sitzung erneut gesendet (z. B. nach Verbindungsabbruch): keine Dublette.
		if (IRB_Repository::exists($key)) {
			self::respond($d['objektart']);
		}
		if (IRB_Security::rate_limited()) {
			self::fail('Zu viele Anfragen. Bitte versuche es in einer Stunde erneut oder ruf uns an.', 429);
		}

		$d = apply_filters('irb_before_save', $d);
		$id = IRB_Repository::insert($key, $d);
		if (!$id) {
			if (IRB_Repository::exists($key)) {
				self::respond($d['objektart']);
			}
			self::fail('Das Speichern ist fehlgeschlagen. Deine Eingaben bleiben erhalten. Bitte versuche es erneut.', 500);
		}
		do_action('irb_request_saved', $id, $d);
		self::respond($d['objektart'], $id);
	}

	/**
	 * Antwortet dem Browser sofort und verschickt Mails/Webhook danach,
	 * sofern der Server das unterstützt (PHP-FPM, LiteSpeed). Sonst vorher.
	 */
	private static function respond($type, $deliver_id = 0) {
		IRB_Security::set_receipt($type);
		$payload = ['success' => true, 'data' => ['saved' => true, 'redirect' => self::thanks_url()]];

		$finish = function_exists('fastcgi_finish_request') ? 'fastcgi_finish_request' : (function_exists('litespeed_finish_request') ? 'litespeed_finish_request' : '');
		if ($deliver_id && $finish) {
			ignore_user_abort(true);
			status_header(200);
			header('Content-Type: application/json; charset=' . get_option('blog_charset'));
			echo wp_json_encode($payload);
			$finish();
			IRB_Mailer::deliver($deliver_id);
			exit;
		}
		if ($deliver_id) {
			IRB_Mailer::deliver($deliver_id);
		}
		wp_send_json($payload);
	}

	/* ------------------------------------------------------------------ Danke-Seite */

	public static function thanks_page() {
		$path = untrailingslashit((string) wp_parse_url(isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '', PHP_URL_PATH));
		if ($path !== untrailingslashit((string) wp_parse_url(self::thanks_url(), PHP_URL_PATH))) {
			return;
		}
		if (!defined('DONOTCACHEPAGE')) {
			define('DONOTCACHEPAGE', true);
		}
		global $wp_query;
		if ($wp_query) {
			$wp_query->is_404 = false;
		}
		nocache_headers();
		status_header(200);
		header('X-Robots-Tag: noindex, follow', true);
		add_filter('pre_get_document_title', function () {
			return 'Immobilienbewertung – ' . IRB_Plugin::option('brand');
		});
		add_filter('wp_robots', function ($r) {
			$r['noindex'] = true;
			unset($r['index']);
			return $r;
		});
		wp_enqueue_style('irb-form', plugins_url('assets/form.css', IRB_FILE), [], IRB_VERSION);

		$type = IRB_Security::read_receipt();
		$o = IRB_Plugin::options();
		$accent = sanitize_hex_color($o['accent']);
		ob_start();
		include IRB_DIR . '/templates/thanks.php';
		$content = (string) ob_get_clean();

		if (function_exists('wp_is_block_theme') && wp_is_block_theme()) {
			self::render_block_theme($content);
		} else {
			get_header();
			echo $content; // phpcs:ignore -- Template escaped selbst
			get_footer();
		}
		exit;
	}

	private static function render_block_theme($content) {
		$header = do_blocks('<!-- wp:template-part {"slug":"header","tagName":"header"} /-->');
		$footer = do_blocks('<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->');
		?><!doctype html>
<html <?php language_attributes(); ?>>
<head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width, initial-scale=1"><?php wp_head(); ?></head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="wp-site-blocks"><?php echo $header . $content . $footer; // phpcs:ignore ?></div>
<?php wp_footer(); ?>
</body>
</html><?php
	}
}
