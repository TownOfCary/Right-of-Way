({

	fireEvent : function(component) {
		var appointmentId = component.get('v.resource').ServiceAppointment.Id;
		console.log(appointmentId);
		var event = component.getEvent('editAppointment');
		event.setParams({
			'appointmentId' : appointmentId
		});
		event.fire();
	}

})