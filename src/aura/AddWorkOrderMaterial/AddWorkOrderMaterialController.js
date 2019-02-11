({

	handleChange : function(component, event, helper) {
		helper.fireWorkOrderMaterialChange(component);
	},

	removeWorkOrderMaterial : function(component, event, helper) {
		helper.removeWorkOrderMaterial(component);
	}

})