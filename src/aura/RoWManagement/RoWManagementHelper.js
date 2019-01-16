({
	getAppointments: function(component) {
		var action = component.get("c.assignedResourceAppts");
		action.setCallback(this, function(response) {
			var name = response.getState();
			if(name == "SUCCESS") {
				component.set('v.assignedAppointments', response.getReturnValue());
				//console.log(response.getReturnValue());
			} else {
				alert('Issue getting appointments.');
			}
		});
		$A.enqueueAction(action);
	},

	getRes : function(component) {
		var action = component.get("c.getResources");
		action.setCallback(this, function(response) {
			var name = response.getState();
			if(name == "SUCCESS") {
				//console.log('response.getReturnValue()');
				//console.log(response.getReturnValue());
				component.set('v.crewMem', response.getReturnValue().crewList);
				component.set('v.terMem', response.getReturnValue().trList);
			}
		});
		$A.enqueueAction(action);
	},

	canAssign: function(component, event, helper) {
		var action = component.get("c.canAssign");
		action.setCallback(this, function(response) {
			var name = response.getState();
			if (name == "SUCCESS") {
				if (response.getReturnValue() == false) {
					$A.util.toggleClass(component.find("canAssign"), "slds-hide");
					$A.util.toggleClass(component.find("cannotAssign"), "slds-hide");
				} else {
					this.getAppointments(component);
					this.getRes(component);
				}
			} else {
				alert('Issue in the canAssign');
			}
		});

		$A.enqueueAction(action);

	},

	getAppResources: function(component, saId) {
		var resourceList = component.get("v.existingSAResources");
		component.set('v.saSpecificResources', resourceList[saId]);
	},

	getWOWrapper: function(component, saId) {
		$A.util.toggleClass(component.find("loadingSpinner"), "slds-hide");
		var action = component.get("c.getWODetail");
		action.setParams({
			"saId": saId
		});

		action.setCallback(this, function(response) {
			var name = response.getState();
			if(name == "SUCCESS") {
				//console.log('response.getReturnValue()');
				//console.log(response.getReturnValue());
				component.set('v.wo', response.getReturnValue());

				component.set('v.woId', response.getReturnValue().saWorkOrder.Id);
				var allProdCons = response.getReturnValue().saWorkOrder.ProductsConsumed;
				// hoof this is ugly.
				if (response.getReturnValue().saWorkOrder.TimeSheetEntries != undefined) {
					//console.log(response.getReturnValue().saWorkOrder.TimeSheetEntries);
					if (allProdCons) {
						var equipment = [];
						var products = [];

						for (var i = 0; i < allProdCons.length; i++) {
							if (allProdCons[i].Product2.QuantityUnitOfMeasure == 'Per Hour') {
								equipment.push(allProdCons[i]);
							} else if (allProdCons[i].Product2.QuantityUnitOfMeasure == 'Each') {
								products.push(allProdCons[i]);
							}
						}

						this.treeGridHelper(component, equipment, 'eqOnly');
						this.treeGridHelper(component, response.getReturnValue().saWorkOrder.TimeSheetEntries, 'srOnly');
						$A.util.removeClass(component.find('srOnly'), "slds-hide");
						$A.util.removeClass(component.find('eqOnly'), "slds-hide");
					} else {
						this.treeGridHelper(component, response.getReturnValue().saWorkOrder.TimeSheetEntries, 'srOnly');
						$A.util.removeClass(component.find('srOnly'), "slds-hide");
					}
					$A.util.removeClass(component.find('srOnly'), "slds-hide");
				} else if(response.getReturnValue().saWorkOrder.ProductsConsumed != undefined) {
					this.treeGridHelper(component, response.getReturnValue().saWorkOrder.ProductsConsumed, 'eqOnly');
					$A.util.removeClass(component.find('eqOnly'), "slds-hide");
				}

				this.getExistingPurch(component, response.getReturnValue().saWorkOrder.Id);
				this.getExistingProd(component, response.getReturnValue().saWorkOrder.Id);

			} else {
				alert('Issue in the getWOWrapper');
			}
		});

		$A.enqueueAction(action);
	},

	getExistingPurch: function(component, workOrderId) {
		var action = component.get("c.getWOPurchs");
		action.setParams({
			"workOrderId": workOrderId
		});

		action.setCallback(this, function(response) {
			var name = response.getState();
			if(name == "SUCCESS") {
				component.set('v.existingPurchaseList', response.getReturnValue());
			}
		});

		$A.enqueueAction(action);
	},

	getExistingProd: function(component, workOrderId) {
		var action = component.get("c.getWOProds");
		action.setParams({
			"workOrderId": workOrderId
		});

		action.setCallback(this, function(response) {
			var name = response.getState();
			if(name == "SUCCESS") {
				var prods = response.getReturnValue();
				var pcList = [];
				for(var i = 0; i < prods.length; i++) {
					if(prods[i].QuantityUnitOfMeasure == 'Each') {
						pcList.push(prods[i]);
					}
				}
				component.set('v.existingProductList', pcList);
			}
		});

		$A.enqueueAction(action);
	},

	showDetailPage: function(component, recordId) {
		$A.util.removeClass(component.find("viewRecordBtnModal"), "slds-hide");
	},

	saveWorkAssignments : function(component, idx) {
		var modal;
		var typeStr;
		var duration;
		var displayName;
		var times;
		var action = component.get("c.getCrewTime");

		if (idx === 'saveCrewBtn') {
			times = component.get("v.srTimeChanges");
			modal = 'addCrewBtnModal';
			typeStr = 'crew';
		} else if (idx === 'saveTerBtn') {
			times = component.get("v.srTimeChanges");
			modal = 'addTerBtnModal';
			typeStr = 'ter';
		} else if (idx === 'saveEquipBtn') {
			times = component.get("v.eqTimeChanges");
			modal = 'addEquipBtnModal';
			typeStr = 'equip';
		} else if (idx === 'savePCBtn') {
			times = component.get("v.pcQuantChanges");
			modal = 'addProdBtnModal';
			typeStr = 'prod';
		} else {
			console.log('caught the flu');
		}
		var wo = component.get("v.workWrapperList");
		action.setParams({
			"times": times,
			"saId": component.get("v.saId").toString(),
			"saveType": idx,
			"wo": wo[0].saWOLI.WorkOrderId
		});
		console.log('TIMESTIMETSIMETISMETISEMTSIETMSET');
		console.log(times);
		action.setCallback(this, function(response) {
			var name = response.getState();
			if(name == "SUCCESS") {
				$A.util.addClass(component.find(modal), 'slds-hide');
				var objs = response.getReturnValue();
				this.treeGridHelper(component, objs, typeStr);
				$A.util.removeClass(component.find(typeStr + 'Tree'), "slds-hide");
				this.getRes(component);
			} else {
				alert('Issue in the swa');
				$A.util.removeClass(component.find(modal), "slds-hide");
			}
		});
		component.set("v.equipmentTable", '');
		component.set('v.srTimeChanges', '');
		component.set('v.eqTimeChanges', '');
		component.set('v.pcQuantChanges', '');
		$A.enqueueAction(action);
	},

	treeGridHelper: function(component, objs, typeStr) {
		var columns = [{
				type: 'text',
				fieldName: 'res',
				label: 'Resource'
			},
			{
				type: 'number',
				fieldName: 'dur',
				label: 'Duration'
			},
			{
				type: 'text',
				fieldName: 'status',
				label: 'Status'
		}];
		component.set('v.' + typeStr + 'GridColumns', columns);
		var nestedData = [];

		Object.keys(objs).forEach(function(key) {
			var obj = objs[key];

			if(typeStr == 'srOnly') {
				var nestedItem = {
					"name": obj.Id,
					"res": obj.TimeSheet.ServiceResource.Name,
					"dur": obj.DurationInMinutes,
					"status": obj.Status
				};
			} else if(typeStr == 'eqOnly') {
                var nestedItem = {
					"name": obj.Product2Id,
					"res": obj.Product2.Name,
					"dur": obj.QuantityConsumed * 60,
					"status": 'Submitted'
				};
			} else {
				if(obj.status.startsWith('Error')) {
					alert('You encountered a system error: ' + obj.status);
					return;
				}
				var nestedItem = {
					"name": obj.theId,
					"res": obj.resource,
					"dur": obj.duration,
					"status": obj.status
				};
			}
			nestedData.push(nestedItem);
		});

		component.set('v.' + typeStr + 'GridData', nestedData);
	},

	equipmentRowHelper: function(component, event) {
		var today = new Date();
		var monthDigit = today.getMonth() + 1;
		if (monthDigit <= 9) {
			monthDigit = '0' + monthDigit;
		}
		var itsNow = today.getFullYear() + "-" + monthDigit + "-" + today.getDate();

		$A.createComponents(
			[
			["tr", {
				"class": "slds-hint-parent"
			}],

			["ui:inputText",{
				"scope": "row",
				"role": "gridcell",
				"class": "slds-truncate",
				"change": component.getReference("c.setEquipName"),
				"width": "50%"
			}],
			["ui:button", {
				"scope": "row",
				"type": "button",
				"class": "slds-button slds-button_neutral findAssetBtn",
				"label": "Find",
				"role": "gridcell",
				"aura:id": "findAssetBtn",
				"press": component.getReference("c.searchAssets")
			}]
			],

			function(comps, status, errorMessage){
                if (status == "SUCCESS") {
                    var table = component.get("v.equipmentTable");
					comps.forEach(function(e) {
						table.push(e);
					});
                    $A.util.addClass(component.find("thankYouBtn"), "slds-hide");
                    component.set("v.equipmentTable", table);
                }
                else if (status == "INCOMPLETE") {
                    console.log("No response from server or client is offline.")
					alert('Incomplete Session - check connectivity.  If issue persists contact IT');
                    // Show offline error
                }
                else if (status == "ERROR") {
                    console.log("Error: " + errorMessage);
                    alert('Error in session. Contact IT.');
                }
            }
		);
	},

	prodPurchRowHelper : function(component, idx) {
		var workWrapperList = component.get("v.workWrapperList");
		var createRecordEvent = $A.get("e.force:createRecord");
		var obj;
		var defaultVals = {};
		if (idx == 'prodBtn') {
			obj = "ProductConsumed";
			defaultVals['QuantityConsumed'] = '1';
			defaultVals['WorkOrderId'] = wo[0].saWorkOrder.Id;
			// might need to have the person search for a product and get it's id from the correct pricebook in order to get this done.
			//defaultVals['PricebookEntryId'] = '01u2F000002sddTQAQ';

		} else if (idx == 'purchBtn') {
			obj = "pwut_toc__Work_Order_Material__c";
			defaultVals['pwut_toc__Quantity__c'] = '1';
			defaultVals['pwut_toc__WorkOrder__c'] = workWrapperList[0].saWorkOrder.Id;
			defaultVals['pwut_toc__Transaction_Date__c'] = workWrapperList[0].saWorkOrder.pwut_toc__Due_Date__c;
		} else {
			alert('huh...what button did you press?');
		}


		createRecordEvent.setParams({
			"entityApiName": obj,
			"defaultFieldValues": defaultVals
		});

		createRecordEvent.fire();
	},

	checkForProd: function(component, searchTerm) {
		var action = component.get("c.searchProds");
		action.setParams({
			"saId": component.get("v.saId").toString(),
			"searchTerm": searchTerm
		});

		action.setCallback(this, function(response) {
			var name = response.getState();
			if(name == "SUCCESS" && response.getReturnValue() != 'noProd') {
				var prod = response.getReturnValue();

				component.set('v.prodName', prod.Name);
				console.log('prod');
				console.log(prod);

				$A.createComponents(
					[
						["div", {
							"aura:id": "",
							"class": "slds-card"
						}],
						["div", {
							"aura:id": "prodQuantInput",
							"html": "Selected Product: ",
							"background-color": "grey;"
						}],
						["div", {
							"aura:id": prod.Id
						}],
						["ui:inputText", {
							"disabled": "true",
							"value": component.get("v.prodName"),
							"class": "slds-truncate"
						}],
						["ui:inputText",{
							"class": "slds-truncate",
							"change": component.getReference("c.setProdQuant"),
							"aura:id": prod.Id
						}],
						["br", {}]
					],
					function(comps, status, errorMessage){
						if (status == "SUCCESS") {
							console.log('comps');
							console.log(comps);
							var table = component.get("v.prodTable");
							$A.util.removeClass(component.find("prodForm"), "slds-hide");
							comps.forEach(function(e) {
								table.push(e);
							});

							//$A.util.addClass(component.find("thankYouBtn"), "slds-hide");
							component.set("v.prodTable", table);
						}
					}
				);


			}
		});

		$A.enqueueAction(action);
	},

	statusUpdate : function(component, status) {
		var action = component.get("c.availableStatuses");
		var saId = component.get("v.saId");

		console.log('hi mom');
		action.setParams({
			"saId": saId,
			"status": status
		});

		action.setCallback(this, function(response) {
			var name = response.getState();
			if(name == "SUCCESS") {
				console.log('status:');
				console.log(response.getReturnValue());
				$A.util.removeClass(component.find('statusAlert'), 'slds-hide');
			}
			$A.util.removeClass(component.find('statusAlert'), 'slds-hide');
		});
		$A.util.addClass(component.find('statusAlert'), 'slds-hide');
		$A.enqueueAction(action);
	},

	searchAssets : function(component) {
		var saId = component.get("v.saId");
		var equipmentName = component.get("v.equipName");

		var action = component.get("c.searchAssetsForProd");
		action.setParams({
			"searchTerm": equipmentName,
			"saId": saId
		});

		action.setCallback(this, function(response) {
			var name = response.getState();
			if(name == "SUCCESS") {
				//console.log('response.getReturnValue()');
				//console.log(response.getReturnValue());
				if(response.getReturnValue() == null) {
					alert('That piece of equipment is not assigned to the proper Pricebook.  Please use another Truck Type and/or let a PWUT Admin know.');
					return;
				}
				$A.createComponents(
					[
					["ui:inputText",{
						"class": "slds-truncate",
						"change": component.getReference("c.setEquipTime"),
						"aura:id": response.getReturnValue().Id,
					}]
					],

					function(comps, status, errorMessage){
						if (status == "SUCCESS") {
							var table = component.get("v.equipmentTable");
							//console.log(table);
							comps.forEach(function(e) {
								table.push(e);
							});

							component.set("v.equipmentTable", table);
							//console.log(table);
						}
					}
				);
				component.find("findAssetBtn").destroy();
			} else {
				console.log('womp searchassets');
				alert('That piece of equipment is not in the system. Please use another Truck and/or let a PWUT Admin know.');
			}
		});
		$A.util.removeClass(component.find("thankYouBtn"), "slds-hide");
		$A.enqueueAction(action);
	}

})