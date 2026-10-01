<?php
/**
 * Anfragen bleiben standardmäßig erhalten (Schutz vor unbeabsichtigtem Datenverlust).
 * Nur wenn in den Einstellungen ausdrücklich aktiviert, wird alles entfernt.
 */
if (!defined('WP_UNINSTALL_PLUGIN')) {
	exit;
}
$o = get_option('irb_options', []);
if (is_array($o) && !empty($o['delete_on_uninstall'])) {
	global $wpdb;
	$wpdb->query('DROP TABLE IF EXISTS ' . $wpdb->prefix . 'irb_requests');
	delete_option('irb_options');
	delete_option('irb_db_version');
}
wp_clear_scheduled_hook('irb_mail_queue');
wp_clear_scheduled_hook('irb_daily');
