({
	doInit : function(component, event, helper) {
		console.log('Creating edit appointment');
		console.log(JSON.parse(JSON.stringify(component.get('v.workWrapper'))));
		helper.initVariables(component);
	},

	recordPreview : function(component, event, helper) {
		var recordId = event.getSource().get("v.name");
		console.log('open record modal');
		console.log(recordId);

		if (recordId) {
			component.set("v.selectedRecord", recordId);
			component.set('v.isOpen', true);
		}
	},

	hideModal : function(component, event) {
		component.set('v.isOpen', false);
	}
  
})