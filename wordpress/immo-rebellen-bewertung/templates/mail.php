<?php
/**
 * HTML-Mail (tabellenbasiert, Inline-Styles für Outlook & Co.).
 *
 * @var string $title
 * @var string $intro    Bereits escaped (HTML erlaubt).
 * @var array  $sections [Titel => [[Label, Wert], …]]
 * @var array  $buttons  [[Text, URL], …]
 * @var string $footer   Bereits escaped (HTML erlaubt).
 * @var string $accent
 * @var string $brand
 */
if (!defined('ABSPATH')) {
	exit;
}
$font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
?><!doctype html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title><?php echo esc_html($title); ?></title></head>
<body style="margin:0;padding:0;background:#f3f4f0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f0;padding:24px 12px;font-family:<?php echo $font; ?>;color:#212221;">
<tr><td align="center">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;border:1px solid #e6e7e3;">
		<tr><td style="padding:28px 32px 8px;">
			<div style="font-size:11px;letter-spacing:2px;font-weight:600;color:#727570;text-transform:uppercase;"><?php echo esc_html($brand); ?> · Immobilienbewertung</div>
			<h1 style="font-size:22px;line-height:1.3;font-weight:600;margin:14px 0 0;color:#212221;"><?php echo esc_html($title); ?></h1>
		</td></tr>
		<tr><td style="padding:12px 32px 4px;font-size:15px;line-height:1.6;color:#3a3d39;"><?php echo $intro; // phpcs:ignore -- vorab escaped ?></td></tr>
		<?php if (!empty($buttons)) : ?>
		<tr><td style="padding:18px 32px 6px;">
			<?php foreach ($buttons as $i => $b) : ?>
				<a href="<?php echo esc_url($b[1], ['http', 'https', 'mailto', 'tel']); ?>" style="display:inline-block;margin:0 6px 8px 0;padding:10px 16px;border-radius:7px;font-size:13px;font-weight:600;text-decoration:none;<?php echo $i === 0 ? 'background:' . esc_attr($accent) . ';color:#ffffff;' : 'background:#f0f3eb;color:' . esc_attr($accent) . ';'; ?>"><?php echo esc_html($b[0]); ?></a>
			<?php endforeach; ?>
		</td></tr>
		<?php endif; ?>
		<?php foreach ($sections as $section => $rows) : ?>
		<tr><td style="padding:18px 32px 0;">
			<div style="font-size:11px;letter-spacing:1.5px;font-weight:600;color:<?php echo esc_attr($accent); ?>;text-transform:uppercase;margin-bottom:6px;"><?php echo esc_html($section); ?></div>
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5;">
				<?php foreach ($rows as $row) : ?>
				<tr>
					<td style="padding:7px 12px 7px 0;border-bottom:1px solid #f0f0ec;color:#727570;width:42%;vertical-align:top;"><?php echo esc_html($row[0]); ?></td>
					<td style="padding:7px 0;border-bottom:1px solid #f0f0ec;color:#212221;vertical-align:top;"><?php echo nl2br(esc_html($row[1])); ?></td>
				</tr>
				<?php endforeach; ?>
			</table>
		</td></tr>
		<?php endforeach; ?>
		<tr><td style="padding:24px 32px 28px;font-size:13px;line-height:1.6;color:#727570;"><?php echo $footer; // phpcs:ignore -- vorab escaped ?></td></tr>
	</table>
</td></tr>
</table>
</body>
</html>
