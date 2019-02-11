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
	},

	/*
		Builds a dynamic list of available statuses to change to
		ServiceAppointment.Status.getDescribe().getPicklistValues()
	*/
	statusUpdate : function(component, event, helper) {
		var status = event.getSource().getLocalId();
		if (status == 'inProg') {
			status = 'In Progress';
		} else if (status == 'complete') {
			status = 'Site Checkout';
		} else if (status == 'onHold') {
			status = 'On Hold';
		} else {
			alert('Problem with the status');
		}
		helper.statusUpdate(component, status);
	},

	/*
		Displays which modal
	*/
	modalButton : function(component, event, helper) {
		var modalVarName = event.getSource().getLocalId();
		component.set('v.' + modalVarName, true);
	},
  
})