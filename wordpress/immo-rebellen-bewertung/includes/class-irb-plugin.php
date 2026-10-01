<?php
if (!defined('ABSPATH')) {
	exit;
}

/**
 * Bootstrap: Optionen, Installation/Migration und Cron.
 */
final class IRB_Plugin {

	const OPTION = 'irb_options';

	public static function init() {
		add_action('plugins_loaded', [__CLASS__, 'maybe_upgrade']);
		add_action('init', [__CLASS__, 'ensure_cron']);
		add_action('irb_mail_queue', ['IRB_Mailer', 'process_queue']);
		add_action('irb_daily', [__CLASS__, 'apply_retention']);

		IRB_Frontend::init();
		if (is_admin()) {
			IRB_Admin::init();
		}
	}

	public static function defaults() {
		return [
			// Kontakt & Team
			'recipient'           => 'office@immo-rebellen.at',
			'cc'                  => '',
			'phone'               => '+43 660 9251772',
			'brand'               => 'Immo Rebellen',
			'team'                => 'Phillip & Lucas',
			'team_or'             => 'Phillip oder Lucas',
			'response_time'       => '24 Stunden',
			'photo'               => plugins_url('assets/kontakt.jpg', IRB_FILE),
			// Links
			'privacy'             => home_url('/datenschutz/'),
			'objects'             => home_url('/immobilien/'),
			// Formular
			'accent'              => '#3e5945',
			'feature_ausstattung' => 1,
			'feature_zeitraum'    => 1,
			'customer_mail'       => 1,
			// Tracking
			'tracking'            => 'datalayer',
			'measurement'         => '',
			'store_source'        => 1,
			// Integrationen
			'webhook_url'         => '',
			'webhook_secret'      => '',
			// Sicherheit & Datenschutz
			'ip_header'           => 'REMOTE_ADDR',
			'rate_limit'          => 10,
			'retention_days'      => 0,
			'delete_on_uninstall' => 0,
		];
	}

	public static function options() {
		$stored = get_option(self::OPTION, []);
		return wp_parse_args(is_array($stored) ? $stored : [], self::defaults());
	}

	public static function option($key) {
		$o = self::options();
		return isset($o[$key]) ? $o[$key] : null;
	}

	public static function activate() {
		self::install();
		self::ensure_cron();
	}

	public static function deactivate() {
		wp_clear_scheduled_hook('irb_mail_queue');
		wp_clear_scheduled_hook('irb_daily');
	}

	/**
	 * Updates per ZIP-Upload lösen keinen Aktivierungs-Hook aus –
	 * deshalb wird die DB-Version bei jedem Laden geprüft.
	 */
	public static function maybe_upgrade() {
		if ((int) get_option('irb_db_version', 0) < IRB_DB_VERSION) {
			self::install();
		}
	}

	public static function install() {
		IRB_Repository::create_table();
		IRB_Repository::backfill();

		$o = get_option(self::OPTION, []);
		if (!is_array($o)) {
			$o = [];
		}
		if (empty($o['webhook_secret'])) {
			$o['webhook_secret'] = wp_generate_password(32, false, false);
			update_option(self::OPTION, $o);
		}
		update_option('irb_db_version', IRB_DB_VERSION);
	}

	public static function ensure_cron() {
		if (!wp_next_scheduled('irb_mail_queue')) {
			wp_schedule_event(time() + 60, 'hourly', 'irb_mail_queue');
		}
		if (!wp_next_scheduled('irb_daily')) {
			wp_schedule_event(time() + 300, 'daily', 'irb_daily');
		}
	}

	/** DSGVO: Anfragen nach der eingestellten Frist automatisch löschen (0 = aus). */
	public static function apply_retention() {
		$days = (int) self::option('retention_days');
		if ($days > 0) {
			IRB_Repository::delete_older_than($days);
		}
	}
}
