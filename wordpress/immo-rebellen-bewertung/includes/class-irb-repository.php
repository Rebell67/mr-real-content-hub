<?php
if (!defined('ABSPATH')) {
	exit;
}

/**
 * Datenzugriff auf {prefix}irb_requests. Tabelle und Spalten aus 1.x bleiben erhalten.
 */
final class IRB_Repository {

	const STATUSES = [
		'neu'         => 'Neu',
		'kontaktiert' => 'Kontaktiert',
		'termin'      => 'Besichtigung vereinbart',
		'bewertet'    => 'Bewertung übermittelt',
		'auftrag'     => 'Auftrag erhalten',
		'verloren'    => 'Kein Auftrag',
		'spam'        => 'Spam',
	];

	public static function table() {
		global $wpdb;
		return $wpdb->prefix . 'irb_requests';
	}

	public static function create_table() {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$t = self::table();
		$c = $wpdb->get_charset_collate();
		dbDelta("CREATE TABLE $t (
 id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
 request_key varchar(64) NOT NULL,
 created_at datetime NOT NULL,
 updated_at datetime NULL,
 payload longtext NOT NULL,
 objektart varchar(20) NOT NULL DEFAULT '',
 plz varchar(10) NOT NULL DEFAULT '',
 priority varchar(10) NOT NULL DEFAULT 'normal',
 status varchar(20) NOT NULL DEFAULT 'neu',
 notes longtext NULL,
 admin_mail varchar(24) NOT NULL DEFAULT 'pending',
 customer_mail varchar(24) NOT NULL DEFAULT 'pending',
 webhook varchar(24) NOT NULL DEFAULT 'none',
 attempts int NOT NULL DEFAULT 0,
 PRIMARY KEY  (id),
 UNIQUE KEY request_key (request_key),
 KEY status (status),
 KEY created_at (created_at)
) $c;");
	}

	/** Füllt die neuen Filterspalten für Anfragen aus Version 1.x. */
	public static function backfill() {
		global $wpdb;
		$t = self::table();
		$rows = $wpdb->get_results("SELECT id, payload FROM $t WHERE objektart = '' LIMIT 5000");
		foreach ((array) $rows as $r) {
			$d = json_decode($r->payload, true);
			if (!is_array($d)) {
				continue;
			}
			$wpdb->update($t, [
				'objektart' => isset($d['objektart']) ? substr($d['objektart'], 0, 20) : '',
				'plz'       => isset($d['plz']) ? substr($d['plz'], 0, 10) : '',
				'priority'  => IRB_Schema::priority($d),
			], ['id' => (int) $r->id]);
		}
	}

	public static function exists($key) {
		global $wpdb;
		$t = self::table();
		return (int) $wpdb->get_var($wpdb->prepare("SELECT id FROM $t WHERE request_key = %s", $key));
	}

	/** @return int|false */
	public static function insert($key, array $d) {
		global $wpdb;
		$ok = $wpdb->insert(self::table(), [
			'request_key' => $key,
			'created_at'  => current_time('mysql'),
			'updated_at'  => current_time('mysql'),
			'payload'     => wp_json_encode($d, JSON_UNESCAPED_UNICODE),
			'objektart'   => $d['objektart'],
			'plz'         => isset($d['plz']) ? $d['plz'] : '',
			'priority'    => IRB_Schema::priority($d),
			'status'      => 'neu',
			'webhook'     => IRB_Plugin::option('webhook_url') ? 'pending' : 'none',
			'customer_mail' => IRB_Plugin::option('customer_mail') ? 'pending' : 'disabled',
		]);
		return $ok ? (int) $wpdb->insert_id : false;
	}

	public static function get($id) {
		global $wpdb;
		$t = self::table();
		$r = $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id = %d", $id));
		if ($r) {
			$r->data = json_decode($r->payload, true);
			if (!is_array($r->data)) {
				$r->data = [];
			}
		}
		return $r;
	}

	public static function update($id, array $fields) {
		global $wpdb;
		$fields['updated_at'] = current_time('mysql');
		return $wpdb->update(self::table(), $fields, ['id' => (int) $id]);
	}

	public static function delete(array $ids) {
		global $wpdb;
		$ids = array_filter(array_map('absint', $ids));
		if (!$ids) {
			return 0;
		}
		$t = self::table();
		return (int) $wpdb->query("DELETE FROM $t WHERE id IN (" . implode(',', $ids) . ')');
	}

	public static function delete_older_than($days) {
		global $wpdb;
		$t = self::table();
		$cutoff = wp_date('Y-m-d H:i:s', time() - DAY_IN_SECONDS * (int) $days);
		return (int) $wpdb->query($wpdb->prepare("DELETE FROM $t WHERE created_at < %s", $cutoff));
	}

	/** IDs mit offenen Zustellungen (max. 3 automatische Versuche). */
	public static function pending_ids($limit = 20) {
		global $wpdb;
		$t = self::table();
		return array_map('intval', (array) $wpdb->get_col($wpdb->prepare(
			"SELECT id FROM $t WHERE attempts < 3 AND (admin_mail IN ('pending','failed') OR customer_mail IN ('pending','failed') OR webhook IN ('pending','failed')) ORDER BY id ASC LIMIT %d",
			$limit
		)));
	}

	private static function where(array $args) {
		global $wpdb;
		$sql = ['1=1'];
		if (!empty($args['status']) && isset(self::STATUSES[$args['status']])) {
			$sql[] = $wpdb->prepare('status = %s', $args['status']);
		} elseif (empty($args['include_spam'])) {
			$sql[] = "status <> 'spam'";
		}
		if (!empty($args['objektart'])) {
			$sql[] = $wpdb->prepare('objektart = %s', $args['objektart']);
		}
		if (!empty($args['priority'])) {
			$sql[] = $wpdb->prepare('priority = %s', $args['priority']);
		}
		if (!empty($args['search'])) {
			$like = '%' . $wpdb->esc_like($args['search']) . '%';
			$sql[] = $wpdb->prepare('(payload LIKE %s OR notes LIKE %s OR plz LIKE %s)', $like, $like, $like);
		}
		return implode(' AND ', $sql);
	}

	public static function query(array $args) {
		global $wpdb;
		$t = self::table();
		$where = self::where($args);
		$orderby = in_array(isset($args['orderby']) ? $args['orderby'] : '', ['id', 'created_at', 'priority', 'status', 'plz'], true) ? $args['orderby'] : 'id';
		$order = isset($args['order']) && strtolower($args['order']) === 'asc' ? 'ASC' : 'DESC';
		$sql = "SELECT * FROM $t WHERE $where ORDER BY $orderby $order";
		if (!empty($args['per_page'])) {
			$sql .= $wpdb->prepare(' LIMIT %d OFFSET %d', (int) $args['per_page'], (int) (isset($args['offset']) ? $args['offset'] : 0));
		}
		$rows = (array) $wpdb->get_results($sql);
		foreach ($rows as $r) {
			$r->data = json_decode($r->payload, true);
			if (!is_array($r->data)) {
				$r->data = [];
			}
		}
		return $rows;
	}

	public static function count(array $args) {
		global $wpdb;
		$t = self::table();
		return (int) $wpdb->get_var("SELECT COUNT(*) FROM $t WHERE " . self::where($args));
	}

	public static function status_counts() {
		global $wpdb;
		$t = self::table();
		$out = array_fill_keys(array_keys(self::STATUSES), 0);
		foreach ((array) $wpdb->get_results("SELECT status, COUNT(*) AS n FROM $t GROUP BY status") as $r) {
			$out[$r->status] = (int) $r->n;
		}
		return $out;
	}

	public static function count_since($datetime) {
		global $wpdb;
		$t = self::table();
		return (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $t WHERE created_at >= %s AND status <> 'spam'", $datetime));
	}
}
