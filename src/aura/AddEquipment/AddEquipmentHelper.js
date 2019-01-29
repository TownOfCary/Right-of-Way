({

	removeEquipment : function(component) {
		console.log('firing remove');
		var auraId = component.get('v.auraId');
		var action = component.getEvent('removeAddOn');
		action.setParams({
			"auraId" : auraId,
			"type" : "EQUIPMENT"
		});
		action.fire();
	},

	fireEquipmentChange : function(component) {
		var auraId = component.get('v.auraId');
		var equip = component.get('v.prodConsumed');
		var action = component.getEvent('createAddOn');
		action.setParams({
			"newObject" : equip,
			"auraId" : auraId,
			"type" : "EQUIPMENT"
		});
		action.fire();
	}

})