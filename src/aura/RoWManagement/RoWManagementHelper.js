({

	canAssign: function(component, event, helper) {
		console.log('can we assign?');
		var action = component.get("c.canAssign");
		action.setCallback(this, function(response) {
			var state = response.getState();
			if (state === "SUCCESS") {
				console.log('yes we can');
				console.log(response.getReturnValue());
				if (response.getReturnValue() === false) {
					$A.util.toggleClass(component.find("canAssign"), "slds-hide");
					$A.util.toggleClass(component.find("cannotAssign"), "slds-hide");
				} else {
					this.getAppointments(component);
					this.getServiceResources(component);
				}
			} else {
				alert('Issue in the canAssign');
			}
		});

		$A.enqueueAction(action);

	},

	getAppointments: function(component) {
		var action = component.get("c.assignedResourceAppts");
		action.setCallback(this, function(response) {
			var state = response.getState();
			console.log(state);
			if(state === "SUCCESS") {
				console.log(response.getReturnValue());
				component.set('v.assignedAppointments', response.getReturnValue());
				component.set('v.filteredAppointments', response.getReturnValue());
			} else {
				alert('Issue getting appointments.');
			}
		});
		$A.enqueueAction(action);
	},

	getServiceResources : function(component) {
		var action = component.get("c.getResources");
		action.setCallback(this, function(response) {
			var state = response.getState();
			console.log(state);
			if(state === "SUCCESS") {
				//console.log('response.getReturnValue()');
				//console.log(response.getReturnValue());
				component.set('v.crewMem', response.getReturnValue().crewList);
				component.set('v.terMem', response.getReturnValue().trList);
			}
		});
		$A.enqueueAction(action);
	},

	buildCards : function(component) {
		var appointmentList = component.get('v.filteredAppointments');
		var cardList = [];
		appointmentList.forEach(function(appointment) {
			cardList.push([
				"c:RoWAppointmentCard", {
					 "resource": appointment,
				 }
			 ]);
		})
		console.log(cardList);
		$A.createComponents(
			cardList,
			function(comps, status, errorMessage){
				console.log(status);
				console.log(errorMessage);
				if (status === "SUCCESS") {
					console.log('comps');
					console.log(comps);
					var appointmentCards = []
					for (var j = 0; j < comps.length; j++) {
						appointmentCards.push(comps[j]);
					}
					component.set("v.appointmentCards", appointmentCards);
				} else if (status === "INCOMPLETE") {
					console.log("No response from server or client is offline.");
				} else if (status === "ERROR") {
					console.log("Error: " + errorMessage);
					console.log(errorMessage);
				}
			}
		);
	},

	updateSelect : function(component) {
		var searchTerm = component.find("searchTerm").get("v.value").toUpperCase();
		var appts = component.get("v.assignedAppointments");
		var filteredAppts = appts.filter( a => (a.ServiceAppointment.Street != undefined && a.ServiceAppointment.Street.toUpperCase().includes(searchTerm)) ||
				a.ServiceAppointment.Subject.toUpperCase().includes(searchTerm) || a.ServiceAppointment.SchedStartTime.includes(searchTerm));
		component.set('v.filteredAppointments', filteredAppts);
	},

	getWOWrapper: function(component, saId) {
//		$A.util.toggleClass(component.find("loadingSpinner"), "slds-hide");
		var action = component.get("c.getWODetail");
		action.setParams({
			"saId": saId
		});

		action.setCallback(this, function(response) {
			var state = response.getState();
			if(state === "SUCCESS") {
				console.log('response.getReturnValue()');
				console.log(response.getReturnValue());
				var workWrapper = response.getReturnValue();
				component.set('v.workWrapper', workWrapper);
				component.set('v.woId', workWrapper.saWorkOrder.Id);
				this.getExistingWorkOrderMaterials(component, workWrapper);

				var allProdCons = workWrapper.saWorkOrder.ProductsConsumed;
				var timeSheetEntries = workWrapper.saWorkOrder.TimeSheetEntries;

				var equipment = [];
				var serviceResources = [];
				var workOrderMaterials = !workWrapper.pwut_toc__Work_Order_Materials__r ? [] : workWrapper.pwut_toc__Work_Order_Materials__r;

				if (allProdCons) {
					allProdCons.forEach(function(pc){
						if (pc.Product2.QuantityUnitOfMeasure == 'Per Hour') {
							equipment.push({
								"name": pc.Product2Id,
								"res": pc.Product2.Name,
								"dur": pc.QuantityConsumed * 60,
								"status": pc.pwut_toc__Total_Cost__c
							});
						} else {
							equipment.push({
								"name": pc.Product2Id,
								"res": pc.Product2.Name,
								"dur": pc.QuantityConsumed,
								"status": pc.pwut_toc__Total_Cost__c
							});
						}
					});
				}

				if (timeSheetEntries) {
					timeSheetEntries.forEach(function(tse){
						serviceResources.push({
							"name": tse.Id,
							"res": tse.TimeSheet.ServiceResource.Name,
							"dur": tse.DurationInMinutes,
							"status": tse.Status
						});
					});
				}

				component.set('v.eqOnlyGridData', equipment);
				component.set('v.srOnlyGridData', serviceResources);
				component.set('v.existingPurchaseList', workOrderMaterials);

				$A.createComponent(
					'c:RoWEditAppointment', {
						'workWrapper' : workWrapper,
						'crewGridData' : component.getReference('v.crewGridData'),
						'terGridData' : component.getReference('v.terGridData'),
						'equipGridData' : component.getReference('v.equipGridData'),
						'eqOnlyGridData' : equipment,
						'srOnlyGridData' : serviceResources,
						'crewModal' : component.getReference('v.crewModal'),
						'territoryModal' : component.getReference('v.territoryModal'),
						'equipmentModal' : component.getReference('v.equipmentModal'),
						'consumableModal' : component.getReference('v.consumableModal')
					},
					function(cmp, status, errorMessage){
						console.log(status);
						console.log(errorMessage);
						if (status === "SUCCESS") {
							console.log('cmp');
							console.log(cmp);
							component.set("v.editWrapper", cmp);
						} else if (status === "INCOMPLETE") {
							console.log("No response from server or client is offline.");
						} else if (status === "ERROR") {
							console.log("Error: " + errorMessage);
							console.log(errorMessage);
						}
					}
				);
			} else {
				alert('Issue in the getWOWrapper');
			}
		});

		$A.enqueueAction(action);
	},

	handleStatusUpdate : function(component, saId, status) {
		var acsHelper = component.find('acsHelper');
		var action = component.get("c.availableStatuses");

		console.log('hi mom');
		action.setParams({
			"saId": saId,
			"status": status
		});

		action.setCallback(this, function(response) {
			var state = response.getState();
			if(state === "SUCCESS") {
				console.log('status:');
				console.log(response.getReturnValue());
				var workWrapper = component.get('v.workWrapper');
				workWrapper.serviceAppointment.Status = response.getReturnValue();
				component.set('v.workWrapper', workWrapper);
				acsHelper.showToast('success', 'Status Updated', 'The status was updated to ' + response.getReturnValue() + '.');
			} else if (name === 'ERROR') {
				console.log(response.errorMessage);
				acsHelper.showToast('error', 'Please Review Error', 'There was an error updating the status.');
			}
			component.set('v.doingWork', false);
		});

		$A.enqueueAction(action);
	},

	saveTimeChanges : function(component, type) {
		var acsHelper = component.find('acsHelper');
		var times = component.get('v.srTimeChanges');
		var workWrapper = component.get('v.workWrapper');
		var action = component.get("c.saveResourceTimes");
		action.setParams({
			"times": times,
			"sa": workWrapper.serviceAppointment
		});
		action.setCallback(this, function(response) {
			var state = response.getState();
			console.log(state);
			if (state === "SUCCESS") {
				var gridName;
				if (type === 'crew') {
					component.set('v.crewModal', false);
					gridName = 'crewGridData';
				} else if (type === 'territory') {
					component.set('v.territoryModal', false);
					gridName = 'terGridData';
				} else {
					component.set('v.doingWork', false);
					acsHelper.showToast('error', 'Please Review Error', 'How did you get here?');
					return;
				}

				var objs = response.getReturnValue();
				var gridData = [];
				objs.forEach(function(o){
					gridData.push({
						"name": o.theId,
						"res": o.resource,
						"dur": o.duration,
						"status": o.status
					});
				});
				component.set('v.' + gridName, gridData);
				component.set('v.srTimeChanges', '');
				this.getServiceResources(component);
			} else {
				console.log(response.errorMessage);
				acsHelper.showToast('error', 'Please Review Error', 'There was an error saving the service appointment changes.');
			}
			component.set('v.doingWork', false);
		});
		$A.enqueueAction(action);
	},

	saveAppointmentProducts : function(component, productList) {
		component.set('v.doingWork', true);
		var acsHelper = component.find('acsHelper');
		console.log(productList);
		var workWrapper = component.get('v.workWrapper');
		var action = component.get("c.saveProductsConsumed");
		action.setParams({
			"productList": productList,
			"sa": workWrapper.serviceAppointment
		});
		action.setCallback(this, function(response) {
			var state = response.getState();
			console.log(state);
			if (state === "SUCCESS") {
				component.set('v.equipmentModal', false);

				var objs = response.getReturnValue();
				var gridData = [];
				objs.forEach(function(o){
					gridData.push({
						"name": o.theId,
						"res": o.resource,
						"dur": o.duration,
						"status": o.status
					});
				});
				component.set('v.equipGridData', gridData);
				component.set('v.eqTimeChanges', '');
				component.set('v.pcQuantChanges', '');
				this.getServiceResources(component);
			} else {
				console.log(response.errorMessage);
				acsHelper.showToast('error', 'Please Review Error', 'There was an error saving the service appointment changes.');
			}
			component.set('v.doingWork', false);
		});
		$A.enqueueAction(action);
	},

	createCmp : function(component, cmp, attributes, varName) {
		$A.createComponent(cmp, attributes, function(newCmp, status, errorMessage){
			if (status === "SUCCESS") {
				var objList = component.get(varName);
				objList.push(newCmp);
				component.set(varName, objList);
			}
			else if (status === "INCOMPLETE") {
				console.log("No response from server or client is offline.")
				// Show offline error
			}
			else if (status === "ERROR") {
				console.log("Error: " + errorMessage);
				// Show error message
			}
		});
	},

	handleNewAddOn : function(component, newObject, auraId, type) {
		console.log('IN NEW ADDON HELPER FUNCTION');
		var objectList = this.getObjectList(component, type);
		objectList[auraId] = newObject;
		this.updateObject(component, objectList, type);
	},

	removeAddOn : function(component, auraId, type) {
		var objectList = this.getObjectList(component, type);
		delete objectList[auraId];
		this.updateObject(component, objectList, type);
		var compList = component.get('v.' + type.toLowerCase() + 's');
		if (compList.length === 1) {
			component.set('v.' + type.toLowerCase() + 's', []);
		} else {
			var index = compList.findIndex(cmp => cmp.get('v.auraId') == auraId);
			compList.splice(index, 1);
			component.set('v.' + type.toLowerCase() + 's', compList);
		}
	},

	getObjectList : function(component, type) {
		var result = null;
		if (type === 'WORKORDERMATERIAL') {
			result = component.get('v.workOrderMaterialList');
		} else if (type === 'EQUIPMENT') {
			result = component.get('v.equipmentList');
		}
		if (!result) {
			result = {};
		}
		return result;
	},

	updateObject : function(component, objectList, type) {
		if (type === 'WORKORDERMATERIAL') {
			component.set('v.workOrderMaterialList', objectList);
		} else if (type === 'EQUIPMENT') {
			component.set('v.equipmentList', objectList);
		}
	},

	saveWorkOrderMats : function(component, workOrderMaterialList) {
		component.set('v.doingWork', true);
		var acsHelper = component.find('acsHelper');
		console.log(workOrderMaterialList);
		var workWrapper = component.get('v.workWrapper');
		var action = component.get("c.saveWorkOrderMaterials");
		action.setParams({
			"materialList": workOrderMaterialList,
			"sa": workWrapper.serviceAppointment
		});
		action.setCallback(this, function(response) {
			var state = response.getState();
			console.log(state);
			if (state === "SUCCESS") {
				component.set('v.consumableModal', false);
				console.log(response.getReturnValue());
				this.getExistingWorkOrderMaterials(component, workWrapper);
			} else {
				console.log(response.errorMessage);
				acsHelper.showToast('error', 'Please Review Error', 'There was an error saving the service appointment changes.');
			}
			component.set('v.doingWork', false);
		});
		$A.enqueueAction(action);
	},

	getExistingWorkOrderMaterials : function(component, workWrapper) {
		component.set('v.workOrderMaterialList', []);
		component.set('v.workOrderMaterials', {});
		var self = this;
		var action = component.get("c.getWorkOrderMaterials");
		action.setParams({
			"workWrapper": workWrapper
		});

		action.setCallback(this, function(response) {
			var state = response.getState();
			console.log(state);
			if (state == "SUCCESS") {
				var materialsList = response.getReturnValue();
				console.log(materialList);
				materialList.forEach(function(mat) {
					console.log(mat);
					var auraId = "workOrderMaterial" + Date.now();
					var attributes = {
						"auraId" : auraId,
						"aura:Id" : auraId
					};
					self.createCmp(component, 'c:AddWorkOrderMaterial', attributes, 'v.workOrderMaterials');
				});
			}
		});

		$A.enqueueAction(action);
	}

})