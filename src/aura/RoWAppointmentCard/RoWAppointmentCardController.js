({

	doInit : function(component, event, helper) {
		console.log('in the init event on the card');
		console.log(JSON.stringify(component.get('v.resource')));
	},

	fireEvent : function(component, event, helper) {
		helper.fireEvent(component);
	}

})