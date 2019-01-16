({
	getAppointments: function(component, event, helper) {
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

	getRes: function(component) {
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
			if(name == "SUCCESS") {
				if(response.getReturnValue() == false) {
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

				component.set('v.woliId', response.getReturnValue().saWOLI.Id);
				var allProdCons = response.getReturnValue().saWOLI.ProductsConsumed;
				// hoof this is ugly.
				if(response.getReturnValue().saWOLI.TimeSheetEntries != undefined){
					//console.log(response.getReturnValue().saWOLI.TimeSheetEntries);
					if(allProdCons) {
						var equipment = [];
						var products = [];

						for(var i = 0; i < allProdCons.length; i++) {
							if(allProdCons[i].Product2.QuantityUnitOfMeasure == 'Per Hour') {
								equipment.push(allProdCons[i]);
							} else if(allProdCons[i].Product2.QuantityUnitOfMeasure == 'Each') {
								products.push(allProdCons[i]);
							}
						}

						this.treeGridHelper(component, equipment, 'eqOnly');
						this.treeGridHelper(component, response.getReturnValue().saWOLI.TimeSheetEntries, 'srOnly');
						$A.util.removeClass(component.find('srOnly'), "slds-hide");
						$A.util.removeClass(component.find('eqOnly'), "slds-hide");
					} else {
						this.treeGridHelper(component, response.getReturnValue().saWOLI.TimeSheetEntries, 'srOnly');
						$A.util.removeClass(component.find('srOnly'), "slds-hide");
					}
					$A.util.removeClass(component.find('srOnly'), "slds-hide");
				} else if(response.getReturnValue().saWOLI.ProductsConsumed != undefined) {
					this.treeGridHelper(component, response.getReturnValue().saWOLI.ProductsConsumed, 'eqOnly');
					$A.util.removeClass(component.find('eqOnly'), "slds-hide");
				}

				this.getExistingPurch(component, response.getReturnValue().saWOLI.Id);
				this.getExistingProd(component, response.getReturnValue().saWOLI.Id);

			} else {
				alert('Issue in the getWOWrapper');
			}
		});

		$A.enqueueAction(action);
	},

	getExistingPurch: function(component, woli) {
		var action = component.get("c.getWOPurchs");
		action.setParams({
			"woli": woli
		});

		action.setCallback(this, function(response) {
			var name = response.getState();
			if(name == "SUCCESS") {
				component.set('v.existingPurchaseList', response.getReturnValue());
			}
		});

		$A.enqueueAction(action);
	},

	getExistingProd: function(component, woli) {
		var action = component.get("c.getWOProds");
		action.setParams({
			"woli": woli
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

	swa: function(component, event) {
		var modal;
		var typeStr;
		var duration;
		var displayName;
		var times;
		var action = component.get("c.getCrewTime");
		function getFirstPart(str) {
			var keyword = str.toString();
			var trackname = keyword.split(":");
			return trackname[0];
		}
		var idx = event.getSource().getLocalId();
		if(idx == 'saveCrewBtn') {
			times = component.get("v.srTimeChanges");
			modal = 'addCrewBtnModal';
			typeStr = 'crew';

		} else if(idx == 'saveTerBtn') {
			times = component.get("v.srTimeChanges");
			modal = 'addTerBtnModal';
			typeStr = 'ter';

		} else if(idx == 'saveEquipBtn') {
			times = component.get("v.eqTimeChanges");
			modal = 'addEquipBtnModal';
			typeStr = 'equip';
		} else if(idx == 'savePCBtn') {
			times = component.get("v.pcQuantChanges");
			modal = 'addProdBtnModal';
			typeStr = 'prod';
		} else {
			console.log('caught the flu');
		}
		var wo = component.get("v.wo");
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

	prodPurchRowHelper: function(component, event) {
		var wo = component.get("v.wo");
		var idx = event.target.id;
		console.log(idx);
		var createRecordEvent = $A.get("e.force:createRecord");
		var obj;
		var defaultVals = {};
		if(idx == 'prodBtn') {
			obj = "ProductConsumed";
			defaultVals['WorkOrderLineItemId'] = wo[0].saWOLI.Id;
			defaultVals['QuantityConsumed'] = '1';
			defaultVals['WorkOrderId'] = wo[0].saWOLI.WorkOrderId;
			// might need to have the person search for a product and get it's id from the correct pricebook in order to get this done.
			//defaultVals['PricebookEntryId'] = '01u2F000002sddTQAQ';

		} else if (idx == 'purchBtn') {
			obj = "Work_Order_Mater__c";
			defaultVals['Quantity__c'] = '1';
			defaultVals['WorkOrderLineItem__c'] = wo[0].saWOLI.Id;
			defaultVals['Transaction_Date__c'] = wo[0].saWOLI.WorkOrder.Due_Date__c;
		} else {
			alert('huh...what button did you press?');
		}


		createRecordEvent.setParams({
			"entityApiName": obj,
			"defaultFieldValues": defaultVals
		});

		createRecordEvent.fire();
	},

	checkForProd: function(component, event) {
		var action = component.get("c.searchProds");
		action.setParams({
			"saId": component.get("v.saId").toString(),
			"searchTerm": event.getSource().get("v.value")
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

	}
})