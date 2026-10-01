/* Block „Immobilienbewertung“ – Vorschau im Editor, Ausgabe serverseitig wie [immo_bewertung]. */
(function (wp) {
	var el = wp.element.createElement;
	var be = wp.blockEditor;
	var c = wp.components;
	var types = [
		{ label: 'Keine Vorauswahl', value: '' },
		{ label: 'Haus', value: 'haus' },
		{ label: 'Wohnung', value: 'wohnung' },
		{ label: 'Grundstück', value: 'grundstueck' },
		{ label: 'Gewerbeimmobilie', value: 'gewerbe' }
	];
	wp.blocks.registerBlockType('immo-rebellen/bewertung', {
		apiVersion: 2,
		title: 'Immobilienbewertung',
		description: 'Mehrstufiges Bewertungsformular von Immo Rebellen.',
		icon: 'building',
		category: 'widgets',
		attributes: { objektart: { type: 'string', default: '' } },
		edit: function (props) {
			var a = props.attributes;
			return el('div', be.useBlockProps({ style: { padding: '28px', border: '1px dashed #9cae8e', borderRadius: '14px', background: '#f6f7f3' } }),
				el(be.InspectorControls, null,
					el(c.PanelBody, { title: 'Einstellungen' },
						el(c.SelectControl, {
							label: 'Objektart vorauswählen',
							help: 'Für Landingpages je Objektart – der erste Schritt wird übersprungen.',
							value: a.objektart,
							options: types,
							onChange: function (v) { props.setAttributes({ objektart: v }); }
						})
					)
				),
				el('strong', null, 'Immobilienbewertung'),
				el('p', { style: { margin: '6px 0 0', color: '#62685e' } },
					'Das Formular wird auf der veröffentlichten Seite angezeigt' + (a.objektart ? ' (Vorauswahl: ' + a.objektart + ').' : '.'))
			);
		},
		save: function () { return null; }
	});
})(window.wp);
