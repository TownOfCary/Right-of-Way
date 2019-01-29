({

	handleChange : function(component, event, helper) {
		console.log('Resource EVENT SHOULD BE FIRING');
		helper.fireEquipmentChange(component);
	},

	removeEquipment : function(component, event, helper) {
		helper.removeEquipment(component);
	}

})