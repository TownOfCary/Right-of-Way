({

	removeWorkOrderMaterial : function(component) {
		console.log('firing remove');
		var auraId = component.get('v.auraId');
		var action = component.getEvent('removeAddOn');
		action.setParams({
			"auraId" : auraId,
			"type" : "WORKORDERMATERIAL"
		});
		action.fire();
	},

	fireWorkOrderMaterialChange : function(component) {
		var auraId = component.get('v.auraId');
		var workOrderMaterial = component.get('v.workOrderMaterial');
		var action = component.getEvent('createAddOn');
		action.setParams({
			"newObject" : workOrderMaterial,
			"auraId" : auraId,
			"type" : "WORKORDERMATERIAL"
		});
		action.fire();
	}

})