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

	showSpinner : function (component, event, helper) {
        component.set("v.showSpinnerImage", true);
		$A.util.removeClass(component.find('loaderModal'), "slds-hide");
		$A.util.removeClass(component.find("loadModal"), "slds-hide");
    },

    hideSpinner : function (component, event, helper) {
        component.set("v.showSpinnerImage", false);
		$A.util.addClass(component.find('loaderModal'), "slds-hide");
		$A.util.addClass(component.find("loadModal"), "slds-hide");
    },

	/*
		Searches the service appointment list for day number or subject
	*/
	updateSelect : function(component, event, helper) {
		var searchTerm = component.find("searchTerm").get("v.value").toUpperCase();
		var appts = component.get("v.assignedAppointments");
		var filteredAppts = appts.filter( a => (a.ServiceAppointment.Street != undefined && a.ServiceAppointment.Street.toUpperCase().includes(searchTerm)) ||
				a.ServiceAppointment.Subject.toUpperCase().includes(searchTerm) || a.ServiceAppointment.SchedStartTime.includes(searchTerm));
		component.set('v.filteredAppointments', filteredAppts);
		if(filteredAppts != []) {
			$A.util.toggleClass(component.find("availableAppointments"), "slds-hide");
			$A.util.toggleClass(component.find("filteredAppointments"), "slds-hide");
		}
	},

	showAppts : function(component, event, helper) {
		$A.util.toggleClass(component.find("canAssign"), "slds-hide");
		$A.util.toggleClass(component.find("woScreen"), "slds-hide");
	},

	territoryMemSearch : function(component, event, helper) {
		var searchTerm = component.find("memSearch").get("v.value").toUpperCase();
		var territoryMembers = component.get("v.terMem");

		var memSearch = territoryMembers.filter(tm =>  tm.Name.toUpperCase().includes(searchTerm));

		component.set("v.memFiltered", true);
		component.set("v.filteredTerMem", memSearch);
	},

	/*
		Builds a dynamic list of available statuses to change to
		ServiceAppointment.Status.getDescribe().getPicklistValues()
	*/
	statusUpdate : function(component, event, helper) {
		var status = event.getSource().getLocalId();
		helper.statusUpdate(component, status);
	},

	/*
		Whichever SA the user taps, overwrites aura variable saId for consumption later.
	*/
	editAppointment : function(component, event, helper) {

		var idx = event.target.id;
		component.set('v.saId', idx);

		$A.util.addClass(component.find("canAssign"), "slds-hide");
		$A.util.removeClass(component.find("woScreen"), "slds-hide");
		helper.getWOWrapper(component, idx);
	},

	/*
		Future use function to do something on selecting a tree item
	*/
	onTreeItemSelected : function(component, event, helper) {
		console.log(event.getParam("name"));
		var recordId = event.getParam("name");
		if (recordId) {
			component.set("v.selectedRecord", recordId);
			console.log('hey ma: ' + recordId);
		}
	},

	/*
		Displays which modal
	*/
	addButton : function(component, event, helper) {
		var sa = component.get("v.saId");
		var status = event.getSource().getLocalId();
		var name = status + "Modal";
		$A.util.addClass(component.find(name), "slds-fade-in-open");
		$A.util.toggleClass(component.find(name), "slds-hide");
	},

	/*
		Hides which modal (potential refactor)
	*/
	hideModal : function(component, event) {
		var idx = event.target.id;
		var cmpTarget;
		console.log(idx);
		if(idx == 'cancelCrewBtn') {
			cmpTarget = component.find('addCrewBtnModal');
		} else if(idx == 'cancelTerBtn') {
			cmpTarget = component.find('addTerBtnModal');
		} else if(idx == 'cancelEquipBtn') {
			cmpTarget = component.find('addEquipBtnModal');
		} else if(idx == 'purchaseModal') {
			cmpTarget = component.find('addPurchaseBtnModal');
		} else if(idx == 'cancelRecordBtn') {
			cmpTarget = component.find('viewRecordBtnModal');
		} else if(idx == 'cancelProdBtn') {
			cmpTarget = component.find('addProdBtnModal');
		} //else if(idx == 'cancelPCBtn') {
			//cmpTarget = component.find('addProdBtnModal');
		//}
		$A.util.addClass(cmpTarget, 'slds-hide');
		component.set("v.srToAssign", '');
		component.set("v.srTimeChanges", '');
	},

	/*
		Not exactly used - want to have it here in case we need to
		add a specific select button on resources to add
	*/
	buildList : function(component, event, helper) {
		var srToAssign = component.get("v.srToAssign");
		var idx = event.target.id;
		if(srToAssign.indexOf(idx) > -1) {
			srToAssign.splice(srToAssign.indexOf(idx), 1);
		} else {
			srToAssign.push(idx);
		}
		var str = "slider_" + idx;
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
	/*
		disables pull down refresh
	*/
	handleTouchMove : function(component, event, helper) {
		event.stopPropagation();
	},

	/*
		Shows the WO WOLI or SA when pressed
	*/
	recordPreview : function(component, event, helper) {
		var recordId = event.getSource().get("v.name");
		if (recordId) {
			component.set("v.selectedRecord", recordId);
		}
		// this sucks, but force:recordView sucks worse
		window.setTimeout(
			$A.getCallback(function() {
				$A.util.removeClass(component.find("viewRecordBtnModal"), "slds-hide");
			}), 1500
		);
	},

	/*
		Call the swa helper function after checking which type - equip or resources
		- and saves the time sheet entries or products consumed
	*/
	saveWorkAssignments: function(component, event, helper) {
		//console.log(component.get("v.srTimeChanges"));
		if (component.get("v.srTimeChanges") != '') {
			//addCrewBtnModal
			$A.util.addClass(component.find("addCrewBtnModal"), "slds-hide");
			$A.util.addClass(component.find("addTerBtnModal"), "slds-hide");
			// if error - show modal again
			var idx = event.getSource().getLocalId();
			helper.saveWorkAssignments(component, idx);
		} else if (component.get("v.eqTimeChanges") != '') {
			//addEquipBtnModal
			$A.util.addClass(component.find("addEquipBtnModal"), "slds-hide");
			var idx = event.getSource().getLocalId();
			helper.saveWorkAssignments(component, idx);
		} else {
			alert('No changes have been made to entries');
		}
	},

	/*
		Adds a row for adding more equipment
	*/
	addModalRow: function(component, event, helper) {
		helper.equipmentRowHelper(component, event);
	},

	addPPRow: function(component, event, helper) {
		var idx = event.getSource().getLocalId();
		helper.prodPurchRowHelper(component, idx);
	},

	/*
		overwrites aura attr equipName with new equipment added
	*/
	setEquipName: function(component, event) {
		component.set("v.equipName", event.getSource().get("v.value"));
	},

	/*
		listens for change in product search
	*/
	searchProducts: function(component, event, helper) {
		var searchTerm =  event.getSource().get("v.value");
		helper.checkForProd(component, searchTerm);
	},

	/*
		Asks salesforce to find a product from the asset(equipment) number
		On success, creates an input text field for setting equipment time
		TODO: move to helper...
	*/
	searchAssets : function(component, event, helper) {
		//console.log('in search assets');
		helper.searchAssets(component);
	},

	/*
		Sets the time of the equipment
	*/
	setEquipTime: function(component, event) {
		//console.log('set equip time');
		var eqTimeChanges = component.get("v.eqTimeChanges");
		//console.log(eqTimeChanges);
		if(eqTimeChanges == ''){
			eqTimeChanges = {};
		}
		var minutes = event.getSource().get("v.value");
		var eqId = event.getSource().getLocalId();
		//console.log('min: ' + minutes);
		//console.log('id: ' + eqId);

		if(eqTimeChanges[eqId]) {
			eqTimeChanges[eqId] = minutes;
		} else {
			eqTimeChanges[eqId] = minutes;
			component.set('v.eqTimeChanges', eqTimeChanges);
		}
	},

	setProdQuant: function(component, event) {
		console.log('set pcQuantChanges');
		var prQuantChanges = component.get("v.pcQuantChanges");
		console.log(prQuantChanges);
		if(prQuantChanges == ''){
			prQuantChanges = {};
		}
		var minutes = event.getSource().get("v.value");
		var prId = event.getSource().getLocalId();
		console.log('min: ' + minutes);
		console.log('id: ' + prId);

		if(prQuantChanges[prId]) {
			prQuantChanges[prId] = minutes;
		} else {
			prQuantChanges[prId] = minutes;
			component.set('v.pcQuantChanges', prQuantChanges);
		}
		console.log('end');
		console.log(prQuantChanges['01u2F000003O0P1QAK']);
	},

	savePC: function(component, event, helper) {
		var idx = event.getSource().getLocalId();
		helper.saveWorkAssignments(component, idx);
	},

	/*
		Tree grid show/hide
	*/
	showExistEquip: function(component) {
		$A.util.toggleClass(component.find("existEquipTree"), "slds-hide");
	},
	showExistEntries: function(component) {
		$A.util.toggleClass(component.find("existEntryTree"), "slds-hide");
	},

	/*
		Will implement when SF fixes their $!%^.
	*/
	onTreeSelect: function(component, event, helper) {
		/*console.log('tree, reporting in!');
		var selRows = component.get("v.selectedSROnlyRows");

		var selectedRow = event.getParam('selectedRows');
		console.log('selectedRow');
		console.log(selectedRow);
		if(selectedRow[0] != undefined) {
			console.log('new');
			selRows.push(selectedRow[0].name);
		} else {
			console.log('dup?');
			//selRows.splice(selRows.indexOf());

		}
		component.set('v.selectedSROnlyRows', selRows);

		console.log('asdoifh');
		console.log(component.get("v.selectedSROnlyRows"));*/

	},

	modalTabSelect: function(component, event, helper) {
		console.log('event.getSource().getLocalId();');
		console.log(event.getSource().getLocalId());
		var idx = event.getSource().getLocalId();
		var notElement;
		var element;
		var notIdx;
		if(idx == 'addPurch') {
			element = 'purchaseTab';
			notElement = 'productTab';
			notIdx = 'addProd';
		} else {
			notElement = 'purchaseTab';
			element = 'productTab';
			notIdx = 'addPurch';
		}

		console.log(element);
		console.log(notElement);

		$A.util.removeClass(component.find(element), "slds-hide");
		$A.util.addClass(component.find(notElement), "slds-hide");
	},

	refreshProdPurch: function(component, event, helper) {
		var woli = component.get('v.woliId');
		helper.getExistingPurch(component, woli);
		helper.getExistingProd(component, woli);
	}

})