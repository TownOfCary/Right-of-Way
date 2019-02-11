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
	},

	statusUpdate : function(component, status) {
		var event = component.getEvent("updateStatus");
		var saId = component.get("v.workWrapper").serviceAppointment.Id;

		event.setParams({
			"saId": saId,
			"status": status
		});

		event.fire();
	}

})