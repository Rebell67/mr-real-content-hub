<?php
/**
 * Danke-Seite. Ohne gültigen Bestätigungs-Cookie (Reload nach Ablauf, Direktaufruf)
 * erscheint ein neutraler Verweis zum Formular – keine Conversion, keine Daten.
 *
 * @var string|false $type   Objektart aus dem signierten Cookie.
 * @var array        $o      Plugin-Optionen.
 * @var string|null  $accent
 */
if (!defined('ABSPATH')) {
	exit;
}
$ok = $type !== false;
$tel = preg_replace('/[^+0-9]/', '', $o['phone']);
$labels = ['haus' => 'dein Haus', 'wohnung' => 'deine Wohnung', 'grundstueck' => 'dein Grundstück', 'gewerbe' => 'deine Gewerbeimmobilie'];
$object = $ok && isset($labels[$type]) ? $labels[$type] : 'deine Immobilie';
?>
<main class="irb-form irb-thanks"<?php echo $accent ? ' style="--irb-accent:' . esc_attr($accent) . '"' : ''; ?>>
	<div class="irb-shell irb-thanks-card">
		<span class="irb-eyebrow"><?php echo esc_html(strtoupper($o['brand'])); ?></span>
		<?php if ($ok) : ?>
			<span class="irb-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
			<h1>Vielen Dank für deine Anfrage!</h1>
			<p class="irb-lead">Wir haben alle Angaben für <?php echo esc_html($object); ?> erhalten. Eine Bestätigung ist per E-Mail unterwegs.</p>
			<ol class="irb-timeline">
				<li><strong>Jetzt</strong><span>Wir prüfen deine Angaben und aktuelle Vergleichsverkäufe in der Umgebung.</span></li>
				<li><strong>Innerhalb von <?php echo esc_html($o['response_time']); ?></strong><span><?php echo esc_html($o['team_or']); ?> meldet sich persönlich bei dir – auch am Wochenende.</span></li>
				<li><strong>Danach</strong><span>Du erhältst deine Ersteinschätzung. Auf Wunsch schauen wir uns die Immobilie gemeinsam vor Ort an.</span></li>
			</ol>
		<?php else : ?>
			<h1>Deine persönliche Immobilienbewertung</h1>
			<p class="irb-lead">Lass uns deine Immobilie kennenlernen. Über unser Formular kannst du eine persönliche Ersteinschätzung anfordern.</p>
		<?php endif; ?>
		<p>Für dringende Fragen: <a href="tel:<?php echo esc_attr($tel); ?>"><?php echo esc_html($o['phone']); ?></a></p>
		<div class="irb-thanks-actions">
			<a class="irb-primary" href="<?php echo esc_url($ok ? $o['objects'] : home_url('/immobilienbewertung/')); ?>"><?php echo $ok ? 'Unsere Immobilien entdecken' : 'Zur Immobilienbewertung'; ?> <span aria-hidden="true">→</span></a>
			<?php if ($ok) : ?><a class="irb-secondary" href="<?php echo esc_url(home_url('/')); ?>">Zur Startseite</a><?php endif; ?>
		</div>
	</div>
</main>
