<?php
if (!defined('ABSPATH')) {
	exit;
}
if (!class_exists('WP_List_Table')) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

/**
 * Übersicht der Bewertungsanfragen mit Status-Ansichten, Filtern, Suche und Bulk-Aktionen.
 */
class IRB_List_Table extends WP_List_Table {

	public function __construct() {
		parent::__construct(['singular' => 'anfrage', 'plural' => 'anfragen', 'ajax' => false]);
	}

	/** Aktuelle Filter aus der URL – auch für den CSV-Export. */
	public static function filters() {
		return [
			'status'    => isset($_REQUEST['status']) ? sanitize_key($_REQUEST['status']) : '',
			'objektart' => isset($_REQUEST['objektart']) ? sanitize_key($_REQUEST['objektart']) : '',
			'priority'  => isset($_REQUEST['priority']) ? sanitize_key($_REQUEST['priority']) : '',
			'search'    => isset($_REQUEST['s']) ? sanitize_text_field(wp_unslash($_REQUEST['s'])) : '',
		];
	}

	public function get_columns() {
		return [
			'cb'       => '<input type="checkbox">',
			'id'       => 'Anfrage',
			'object'   => 'Immobilie',
			'location' => 'Lage',
			'contact'  => 'Kontakt',
			'priority' => 'Priorität',
			'status'   => 'Status',
			'mail'     => 'Zustellung',
		];
	}

	protected function get_sortable_columns() {
		return ['id' => ['id', true], 'priority' => ['priority', false], 'location' => ['plz', false], 'status' => ['status', false]];
	}

	protected function get_bulk_actions() {
		$actions = [];
		foreach (IRB_Repository::STATUSES as $k => $label) {
			$actions['status_' . $k] = 'Status: ' . $label;
		}
		$actions['delete'] = 'Endgültig löschen';
		return $actions;
	}

	protected function get_views() {
		$counts = IRB_Repository::status_counts();
		$current = self::filters()['status'];
		$base = admin_url('admin.php?page=irb-requests');
		$all = array_sum($counts) - $counts['spam'];
		$views = ['all' => sprintf('<a href="%s"%s>Alle <span class="count">(%d)</span></a>', esc_url($base), $current === '' ? ' class="current"' : '', $all)];
		foreach (IRB_Repository::STATUSES as $k => $label) {
			if (!$counts[$k] && $k !== 'neu') {
				continue;
			}
			$views[$k] = sprintf('<a href="%s"%s>%s <span class="count">(%d)</span></a>', esc_url(add_query_arg('status', $k, $base)), $current === $k ? ' class="current"' : '', esc_html($label), $counts[$k]);
		}
		return $views;
	}

	protected function extra_tablenav($which) {
		if ($which !== 'top') {
			return;
		}
		$f = self::filters();
		echo '<div class="alignleft actions">';
		echo '<select name="objektart"><option value="">Alle Objektarten</option>';
		foreach (IRB_Schema::get()['types'] as $k => $label) {
			echo '<option value="' . esc_attr($k) . '"' . selected($f['objektart'], $k, false) . '>' . esc_html($label) . '</option>';
		}
		echo '</select><select name="priority"><option value="">Alle Prioritäten</option>';
		foreach (IRB_Schema::PRIORITIES as $k => $label) {
			echo '<option value="' . esc_attr($k) . '"' . selected($f['priority'], $k, false) . '>' . esc_html($label) . '</option>';
		}
		echo '</select>';
		submit_button('Filtern', '', 'filter_action', false);
		$query = array_filter(['action' => 'irb_export', 'status' => $f['status'], 'objektart' => $f['objektart'], 'priority' => $f['priority'], 's' => $f['search']]);
		$export = wp_nonce_url(add_query_arg(array_map('rawurlencode', $query), admin_url('admin-post.php')), 'irb_export');
		echo ' <a class="button" href="' . esc_url($export) . '">CSV exportieren</a>';
		echo '</div>';
	}

	public function prepare_items() {
		$per_page = $this->get_items_per_page('irb_per_page', 25);
		$args = self::filters();
		$args['orderby'] = isset($_GET['orderby']) ? sanitize_key($_GET['orderby']) : 'id';
		$args['order'] = isset($_GET['order']) ? sanitize_key($_GET['order']) : 'desc';
		$args['per_page'] = $per_page;
		$args['offset'] = ($this->get_pagenum() - 1) * $per_page;

		$this->items = IRB_Repository::query($args);
		$total = IRB_Repository::count($args);
		$this->set_pagination_args(['total_items' => $total, 'per_page' => $per_page, 'total_pages' => (int) ceil($total / $per_page)]);
		$this->_column_headers = [$this->get_columns(), [], $this->get_sortable_columns(), 'id'];
	}

	public function no_items() {
		echo 'Keine Anfragen gefunden.';
	}

	protected function column_cb($r) {
		return '<input type="checkbox" name="ids[]" value="' . (int) $r->id . '">';
	}

	protected function column_id($r) {
		$url = admin_url('admin.php?page=irb-requests&request=' . (int) $r->id);
		$new = $r->status === 'neu' ? ' <span class="irb-badge irb-badge-new">Neu</span>' : '';
		return '<strong><a href="' . esc_url($url) . '">#' . (int) $r->id . '</a></strong>' . $new
			. '<br><span class="irb-muted">' . esc_html(mysql2date('d.m.Y, H:i', $r->created_at)) . '</span>'
			. $this->row_actions(['view' => '<a href="' . esc_url($url) . '">Öffnen</a>']);
	}

	protected function column_object($r) {
		$d = $r->data;
		$s = IRB_Schema::get();
		$area = '';
		foreach (['wohnflaeche', 'nutzflaeche', 'grundflaeche'] as $k) {
			if (!empty($d[$k])) {
				$area = IRB_Schema::format_number($d[$k], 'm²');
				break;
			}
		}
		return '<strong>' . esc_html(IRB_Schema::type_label($r->objektart)) . '</strong><br><span class="irb-muted">'
			. esc_html(implode(' · ', array_filter([isset($d['unterart']) ? $d['unterart'] : '', $area]))) . '</span>';
	}

	protected function column_location($r) {
		$d = $r->data;
		return esc_html(trim((isset($d['plz']) ? $d['plz'] : '') . ' ' . (isset($d['ort']) ? $d['ort'] : '')))
			. '<br><span class="irb-muted">' . esc_html(IRB_Schema::region($r->plz)) . '</span>';
	}

	protected function column_contact($r) {
		$d = $r->data;
		$tel = isset($d['telefon']) ? $d['telefon'] : '';
		$mail = isset($d['email']) ? $d['email'] : '';
		return esc_html(trim((isset($d['vorname']) ? $d['vorname'] : '') . ' ' . (isset($d['nachname']) ? $d['nachname'] : '')))
			. '<br><a href="tel:' . esc_attr(preg_replace('/[^+0-9]/', '', $tel)) . '">' . esc_html($tel) . '</a>'
			. ' · <a href="mailto:' . esc_attr($mail) . '">' . esc_html($mail) . '</a>';
	}

	protected function column_priority($r) {
		$d = $r->data;
		$label = isset(IRB_Schema::PRIORITIES[$r->priority]) ? IRB_Schema::PRIORITIES[$r->priority] : $r->priority;
		return '<span class="irb-prio irb-prio-' . esc_attr($r->priority) . '">' . esc_html($label) . '</span><br><span class="irb-muted">'
			. esc_html(implode(' · ', array_filter([isset($d['anlass']) ? $d['anlass'] : '', isset($d['zeitraum']) ? $d['zeitraum'] : '']))) . '</span>';
	}

	protected function column_status($r) {
		$label = isset(IRB_Repository::STATUSES[$r->status]) ? IRB_Repository::STATUSES[$r->status] : $r->status;
		return '<span class="irb-status irb-status-' . esc_attr($r->status) . '">' . esc_html($label) . '</span>'
			. ($r->notes ? '<br><span class="irb-muted" title="' . esc_attr($r->notes) . '">📝 Notiz</span>' : '');
	}

	protected function column_mail($r) {
		$icon = function ($state, $label) {
			$map = ['accepted' => ['✓', 'ok'], 'failed' => ['✕', 'fail'], 'pending' => ['…', 'wait'], 'disabled' => ['–', 'off'], 'none' => ['–', 'off']];
			$m = isset($map[$state]) ? $map[$state] : ['?', 'wait'];
			$text = isset(IRB_Mailer::STATUS_LABELS[$state]) ? IRB_Mailer::STATUS_LABELS[$state] : $state;
			return '<span class="irb-dot irb-dot-' . $m[1] . '" title="' . esc_attr($label . ': ' . $text) . '">' . $m[0] . ' ' . esc_html($label) . '</span>';
		};
		$out = $icon($r->admin_mail, 'Intern') . '<br>' . $icon($r->customer_mail, 'Kunde');
		if ($r->webhook !== 'none') {
			$out .= '<br>' . $icon($r->webhook, 'Webhook');
		}
		return $out;
	}
}
