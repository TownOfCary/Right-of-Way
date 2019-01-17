({
	initVariables : function(component) {
		var columns =
			[{
				type: 'text',
				fieldName: 'res',
				label: 'Resource'
			},
			{
				type: 'number',
				fieldName: 'dur',
				label: 'Duration'
			},
			{
				type: 'text',
				fieldName: 'status',
				label: 'Status'
			}];
		component.set('v.gridColumns', columns);
	}
})