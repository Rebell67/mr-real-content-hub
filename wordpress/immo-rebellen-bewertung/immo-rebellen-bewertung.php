<?php
/**
 * Plugin Name:       Immo Rebellen Immobilienbewertung
 * Plugin URI:        https://immo-rebellen.at/immobilienbewertung/
 * Description:       Mehrstufige Bewertungsanfragen mit Lead-Verwaltung, HTML-Mails, Webhook und DataLayer-Tracking. Shortcode: [immo_bewertung] · Block: „Immobilienbewertung“.
 * Version:           2.0.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            Immo Rebellen
 * License:           GPL-2.0-or-later
 * Text Domain:       immo-rebellen-bewertung
 */

if (!defined('ABSPATH')) {
	exit;
}

define('IRB_VERSION', '2.0.0');
define('IRB_DB_VERSION', 2);
define('IRB_FILE', __FILE__);
define('IRB_DIR', __DIR__);

require_once IRB_DIR . '/includes/class-irb-plugin.php';
require_once IRB_DIR . '/includes/class-irb-schema.php';
require_once IRB_DIR . '/includes/class-irb-validator.php';
require_once IRB_DIR . '/includes/class-irb-security.php';
require_once IRB_DIR . '/includes/class-irb-repository.php';
require_once IRB_DIR . '/includes/class-irb-mailer.php';
require_once IRB_DIR . '/includes/class-irb-frontend.php';

if (is_admin()) {
	require_once IRB_DIR . '/includes/class-irb-admin.php';
}

register_activation_hook(__FILE__, ['IRB_Plugin', 'activate']);
register_deactivation_hook(__FILE__, ['IRB_Plugin', 'deactivate']);

IRB_Plugin::init();
