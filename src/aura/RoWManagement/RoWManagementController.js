({
	/*
		Initializes the component with existing service appointments that the
		currently logged in user is an assigned resource on

		If "can assign work" is checked on the service resource - the Component
		activates as normal - if not, an error message is given to req permission

		Proactively gets the current user's crew and territory members
	*/
	doInit : function(component, event, helper) {
        console.log('initializing helper functions...');
		helper.canAssign(component);
	},

	afterJSLoaded : function(component, event, helper) {
		var today = moment().format('YYYY-MM-DD');
		component.set('v.today', today);
	},

	buildCards : function(component, event, helper) {
		console.log('filtered list changed');
		helper.buildCards(component);
	},

	/*
		Searches the service appointment list for day number or subject
	*/
	updateSelect : function(component, event, helper) {
		helper.updateSelect(component);
	},

	/*
		Builds a dynamic list of available statuses to change to
		ServiceAppointment.Status.getDescribe().getPicklistValues()
	*/
	handleStatusUpdate : function(component, event, helper) {
		component.set('v.doingWork', true);
		var saId = event.getParam('saId');
		var status = event.getParam('status');
		helper.handleStatusUpdate(component, saId, status);
	},

	/*
		Whichever SA the user taps, overwrites aura variable saId for consumption later.
	*/
	handleEditAppointment : function(component, event, helper) {
		console.log(component.get('v.assignedAppointments'));
		var idx = event.getParam('appointmentId');
		console.log(idx);

		$A.util.addClass(component.find("canAssign"), "slds-hide");
		$A.util.removeClass(component.find("woScreen"), "slds-hide");
		helper.getWOWrapper(component, idx);
	},

	/*
		Displays which modal
	*/
	addButton : function(component, event, helper) {
		var status = event.getSource().getLocalId();
		var name = status + "Modal";
		$A.util.addClass(component.find(name), "slds-fade-in-open");
		$A.util.toggleClass(component.find(name), "slds-hide");
	},

	showAppts : function(component, event, helper) {
		$A.util.toggleClass(component.find("canAssign"), "slds-hide");
		$A.util.toggleClass(component.find("woScreen"), "slds-hide");
	},

	/*
		Hides which modal (potential refactor)
	*/
	hideModal : function(component, event) {
		var modalVarName = event.getSource().getLocalId();
		component.set('v.' + modalVarName, false);
	},

	/*
		Listener for change on sliders
	*/
	itemsChange : function(component, event) {
		var srTimeChanges = component.get("v.srTimeChanges");
		if(srTimeChanges == ''){
			srTimeChanges = {};
		}
		var name = event.getSource().get("v.value");
		var slidVal = event.getParam("value");
		var sliderId = event.getSource().get("v.title");

		var srId = sliderId.split('_')[1];
		if(srTimeChanges[srId]) {
			srTimeChanges[srId] = slidVal;
		} else {
			srTimeChanges[srId] = slidVal;
			component.set('v.srTimeChanges', srTimeChanges);
		}
	},

	saveTimeChanges : function(component, event, helper) {
		console.log('saving times');
		component.set('v.doingWork', true);
		var type = event.getSource().getLocalId();
		helper.saveTimeChanges(component, type);
	},

	saveEquipment : function(component, event, helper) {
		console.log('saving equpiment');
		var equipment = component.get('v.equipmentList');
		var equipmentList = [];
		for (var key in equipment) {
          equipmentList.push(equipment[key]);
        }
		helper.saveAppointmentProducts(component, equipmentList);
	},

	addWorkOrderMaterial : function(component, event, helper) {
		var auraId = "workOrderMaterial" + Date.now();
		var attributes = {
			"auraId" : auraId,
			"aura:Id" : auraId
		};

		helper.createCmp(component, 'c:AddWorkOrderMaterial', attributes, 'v.workOrderMaterials');
	},

	addEquipment : function(component, event, helper) {
		console.log('creating equipment');
		var auraId = "equipment" + Date.now();
		var attributes = {
			"auraId" : auraId,
			"aura:Id" : auraId,
			"priceBook" : component.getReference("v.workWrapper.saWorkOrder.WorkType.pwut_toc__Price_Book__c")
		};

		helper.createCmp(component, 'c:AddEquipment', attributes, 'v.equipments');
	},

	createAddOn : function(component, event, helper) {
		console.log('NEW ADDON INCOMING');
		var newObject = event.getParam("newObject");
		console.log(JSON.stringify(newObject));
		var auraId = event.getParam("auraId");
		var type = event.getParam("type");
		helper.handleNewAddOn(component, newObject, auraId, type);
	},

	removeAddOn : function(component, event, helper) {
		var auraId = event.getParam("auraId");
		var type = event.getParam("type");
		helper.removeAddOn(component, auraId, type);
	},

	saveWorkOrderMats : function(component, event, helper) {
		var workOrderMaterials = component.get('v.workOrderMaterialList');
		var workOrderMaterialList = [];
		for (var key in workOrderMaterials) {
		  workOrderMaterialList.push(workOrderMaterials[key]);
		}

		helper.saveWorkOrderMats(component, workOrderMaterialList);
	}

})