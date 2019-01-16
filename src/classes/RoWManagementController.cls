/*
 * Created by byarsawi on 1/16/2019.
 */
public class RoWManagementController {

	@AuraEnabled
	public static Boolean canAssign() {
		Id currUser = UserInfo.getUserId();
		System.debug('currUser: ' + currUser);
		List<ServiceResource> sr =
				[SELECT Id, pwut_toc__Can_Assign_Work__c
				FROM ServiceResource
				WHERE RelatedRecordId = :currUser];

		if (sr.size() == 1 && sr[0].pwut_toc__Can_Assign_Work__c == true) {
			return true;
		} else {
			return false;
		}
	}

	@AuraEnabled
	public static String availableStatuses(String saId, String status){
		System.debug(saId);
		ServiceAppointment sa =
				[SELECT Status
				FROM ServiceAppointment
				WHERE Id = :saId];

		if (status == 'inProg') {
			sa.Status = 'In Progress';
		} else if (status == 'complete') {
			sa.Status = 'Site Checkout';
		} else if (status == 'onHold') {
			sa.Status = 'On Hold';
		} else {
			System.debug('problem');
		}
		try {
			update sa;
		}
		catch (Exception e){
			return String.valueOf(e);
		}
		return sa.Status;
	}

	@AuraEnabled
	public static List<AssignedResource> assignedResourceAppts() {
		Date td = Date.today();
		Date weekStart = td.toStartOfWeek();
		Date weekEnd = weekStart.addDays(7);
		Id uId = UserInfo.getUserId();
		Id srId =
				[SELECT Id
				FROM ServiceResource
				WHERE RelatedRecordId = :uId LIMIT 1].Id;

		System.debug('srId: ' + srId);

		// maybe restrict to RoW stuff here for security and validation?
		List<AssignedResource> saList =
				[SELECT ServiceAppointmentId, ServiceAppointment.AppointmentNumber, ServiceAppointment.Subject,
					ServiceAppointment.DueDate, ServiceAppointment.Status, ServiceAppointment.Duration,
					ServiceAppointment.Street, ServiceAppointment.SchedStartTime
				FROM AssignedResource
				WHERE (ServiceResourceId = :srId AND (ServiceAppointment.Status = 'On Hold' OR ServiceAppointment.Status = 'In Progress'))
		OR (ServiceResourceId = :srId AND ServiceAppointment.SchedStartTime >= :weekStart AND ServiceAppointment.SchedStartTime <= :weekEnd)
		ORDER BY ServiceAppointment.SchedStartTime ASC
		LIMIT 100];

		System.debug('saList: ' + saList);
		return saList;
	}

	@AuraEnabled
	public static TerritoryWrapper getResources() {
		TerritoryWrapper tw = new TerritoryWrapper();

		Map<String, List<ServiceResource>> resMap = new Map<String, List<ServiceResource>> ();

		Id currUser = UserInfo.getUserId();
		List<ServiceResource> srId =
				[SELECT Id
				FROM ServiceResource
				WHERE RelatedRecordId = :currUser];

		Datetime now = Datetime.now();
		List<ServiceCrew> scList =
				[SELECT Id
				FROM ServiceCrew
				WHERE Id IN
					(SELECT ServiceCrewId
					FROM ServiceCrewMember
					WHERE isLeader = true AND ServiceResourceId = :srId AND EndDate > :now)];

		System.debug(scList);

		List<ServiceTerritoryMember> stmStart =
				[SELECT Id, ServiceTerritoryId, TerritoryType
				FROM ServiceTerritoryMember
				WHERE ServiceResourceId = :srId[0].Id AND ServiceTerritoryId IN
						(SELECT Id
						FROM ServiceTerritory)];

		System.debug('stmStart: ' + stmStart);
		Set<Id> stIdSet = new Set<Id> ();
		for (ServiceTerritoryMember stm : stmStart) {
			System.debug(stm);
			stIdSet.add(stm.ServiceTerritoryId);
		}
		system.debug(stIdSet);

		List<ServiceResource> srList =
				[SELECT Id, Name
				FROM ServiceResource
				WHERE Id IN
						(SELECT ServiceResourceId
						FROM ServiceCrewMember
						WHERE ServiceCrewId = :scList[0].Id)];

		List<ServiceTerritoryMember> stmList =
				[SELECT Id, ServiceTerritoryId, TerritoryType, ServiceResource.Name
				FROM ServiceTerritoryMember
				WHERE ServiceTerritoryId in :stIdSet];

		System.debug('stmlist: ' + stmList);
		List<ServiceResource> trList = new List<ServiceResource> ();
		for (ServiceTerritoryMember stm : stmList) {
			System.debug(stm);
			if (!trList.contains(stm.ServiceResource) && !srList.contains(stm.ServiceResource)) {
				trList.add(stm.ServiceResource);
			} else {
				System.debug('womp womp');
			}
		}
		srList.sort();
		trList.sort();
		tw.crewList = srList;
		tw.trList = trList;
		tw.territoryList = stIdSet;
		System.debug(tw);
		return tw;
	}

	@AuraEnabled
	public static WorkWrapper getWODetail(Id saId) {
		WorkWrapper ww = new WorkWrapper();
		ww.serviceAppointment =
				[SELECT Id, ParentRecordId, AppointmentNumber, Subject, Address, Status, SchedStartTime
				FROM ServiceAppointment
				WHERE Id = :saId Limit 1];

		ww.saWorkOrder =
				[SELECT Id, WorkOrderNumber, Priority, pwut_toc__Due_Date__c, Subject, Address, Status,
						(SELECT Id, Product2.Name, Product2.QuantityUnitOfMeasure, QuantityConsumed, pwut_toc__Total_Cost__c
						FROM ProductsConsumed),
						(SELECT Id, TimeSheet.Id, TimeSheet.ServiceResource.Name, Status, DurationInMinutes
						FROM TimeSheetEntries
						WHERE EndTime != null)
				FROM WorkOrder
				WHERE Id = :ww.serviceAppointment.ParentRecordId Limit 1];

		System.debug(ww);
		return ww;
	}

	@AuraEnabled
	public static List<pwut_toc__Work_Order_Material__c> getWOPurchs(String workOrderId) {
		List<pwut_toc__Work_Order_Material__c> womList =
				[SELECT Id, pwut_toc__Cost__c, pwut_toc__Quantity__c, pwut_toc__Total_Cost__c, pwut_toc__Item_Description__c, pwut_toc__Transaction_Date__c
				FROM pwut_toc__Work_Order_Material__c
				WHERE pwut_toc__WorkOrder__c = :workOrderId
				ORDER BY pwut_toc__Total_Cost__c];
		return womList;
	}

	@AuraEnabled
	public static List<ProductConsumed> getWOProds(String workOrderId) {
		List<ProductConsumed> pcList =
				[SELECT Id, Product2.Name, QuantityConsumed, QuantityUnitOfMeasure, pwut_toc__Total_Cost__c, UnitPrice
				FROM ProductConsumed
				WHERE WorkOrderId = :workOrderId
				ORDER BY pwut_toc__Total_Cost__c];

		System.debug(pcList);
		return pcList;
	}

	@AuraEnabled
	public static List<TreeGridWrapper> getCrewTime(Map<String, Object> times, String saId, String saveType) {
		List<TreeGridWrapper> tgwList = new List<TreeGridWrapper>();

		Datetime itsNow = System.now();
		System.debug(times);
		System.debug(saId);
		ServiceAppointment sa =
				[SELECT Id, Status, StatusCategory, ParentRecordId
				FROM ServiceAppointment
				WHERE Id = :saId];

		if (sa.StatusCategory != 'Completed') {
			sa.Status = 'Scheduled';
		}

		if (saveType == 'saveCrewBtn' || saveType == 'saveTerBtn') {
			List<TimeSheetEntry> tseList = new List<TimeSheetEntry>();
			for (Id srId : times.keySet()) {
				// hate to hard code this... but...
				TreeGridWrapper tgw = new TreeGridWrapper();

				ServiceResource sr =
						[SELECT Id, Name,
								(SELECT Id
								FROM TimeSheets
								WHERE Status = 'Current')
						FROM ServiceResource
						WHERE Id = :srId LIMIT 1];

				try {
					TimeSheetEntry tse = new TimeSheetEntry(
							TimeSheetId = sr.TimeSheets[0].Id,
							Subject = sr.Name + ': RoW Crew Management TSE.',
							WorkOrderId = sa.ParentRecordId,
							Description = 'Auto Generated Entry based on Crew Leader assignment.',
							StartTime = itsNow.addMinutes((Integer.valueOf(times.get(srId))) * -1),
							EndTime = itsNow,
							Status = 'Submitted'
					);
					tseList.add(tse);
					tgw.theId = sr.Id;
					tgw.resource = sr.Name;
					tgw.duration = Integer.valueOf(times.get(srId));
					tgw.status = tse.Status;
					tgw.start = String.valueOf(tse.StartTime);
					tgw.endt = String.valueOf(tse.EndTime);
					tgwList.add(tgw);
				} catch (Exception e) {
					System.debug('caught the flu: ' + e);
				}
			}
			insert tseList;

		} else if (saveType == 'saveEquipBtn' || saveType == 'savePCBtn') {
			List<ProductConsumed> pcList = new List<ProductConsumed>();
			for (Id eqId : times.keySet()) {
				System.debug(eqId);
				PricebookEntry pr =
						[SELECT Id, Name, UnitPrice
						FROM PricebookEntry
						WHERE Id = :eqId];

				try {
					TreeGridWrapper tgw = new TreeGridWrapper();
					if (saveType == 'saveEquipBtn') {
						String s = times.get(eqId) + '.0';
						Decimal d = Decimal.valueOf(s).setScale(2);
						system.debug(d);
						ProductConsumed pc = new ProductConsumed(
								WorkOrderId = sa.ParentRecordId,
								PricebookEntryId = eqId,
								QuantityConsumed = d / 60
						);
						tgw.status = '$' + String.valueOf(((d / 60) * pr.UnitPrice).setScale(2));
						pcList.add(pc);
					} else {
						Integer q = Integer.valueOf(times.get(eqId));
						ProductConsumed pc = new ProductConsumed(
								WorkOrderId = sa.ParentRecordId,
								PricebookEntryId = eqId,
								QuantityConsumed = q
						);
						tgw.status = 'hi mom';
						pcList.add(pc);
					}


					tgw.theId = pr.Id;
					tgw.resource = pr.Name;
					tgw.duration = Integer.valueOf(times.get(eqId));

					tgwList.add(tgw);
				} catch (Exception e) {
					// returns an error message to alert the user so they can help us debug
					System.debug('caught the flu: ' + e);
					TreeGridWrapper tgw = new TreeGridWrapper();
					tgw.status = 'Error: ' + e;
					tgwList.clear();
					tgwList.add(tgw);
				}
			}
			insert pcList;

		} else if (saveType == 'savePCBtn') {
			System.debug(times);

		}
		System.debug(tgwList);
		return tgwList;
	}

	@AuraEnabled
	public static PricebookEntry searchProds(String saId, String searchTerm) {
		Id pricebookId =
				[SELECT Id, WorkType.pwut_toc__Price_Book__c
				FROM ServiceAppointment
				WHERE Id = :saId].WorkType.pwut_toc__Price_Book__c;
		PricebookEntry pbe = Database.query(
				'SELECT Id, Name, Product2Id, UnitPrice ' +
				'FROM PriceBookEntry ' +
				'WHERE Name LIKE \'%' + String.escapeSingleQuotes(searchTerm) + '%\' ' +
				'AND PriceBook2Id = :pricebookId ' +
				'LIMIT 1');
		system.debug(pbe);
		return pbe;
	}

	@AuraEnabled
	public static PricebookEntry searchAssetsForProd(String searchTerm, String saId) {
		ServiceAppointment sa =
				[SELECT WorkType.pwut_toc__Price_Book__c
				FROM ServiceAppointment
				WHERE Id = :saId];

		Asset a = Database.query(
				'SELECT Product2Id ' +
				'FROM Asset ' +
				'WHERE Name LIKE\'%' + searchTerm + '%\' LIMIT 1');

		system.debug(a);
		PricebookEntry prod;
		try {
			prod =
					[SELECT Name
					FROM PricebookEntry
					WHERE Product2Id = :a.Product2Id AND PriceBook2Id = :sa.WorkType.pwut_toc__Price_Book__c];

		} catch(Exception e) {
			system.debug(e);
		}
		System.debug(prod);
		return prod;
	}



	public class TreeGridWrapper {

		@AuraEnabled public String theId { get; set; }
		@AuraEnabled public String resource { get; set; }
		@AuraEnabled public Integer duration { get; set; }
		@AuraEnabled public String status { get; set; }
		@AuraEnabled public String start { get; set; }
		@AuraEnabled public String endt { get; set; }

		public TreeGridWrapper(){}

	}

	public class TerritoryWrapper {

		@AuraEnabled public List<ServiceResource> crewList { get; set; }
		@AuraEnabled public List<ServiceResource> trList { get; set; }
		@AuraEnabled public Set<Id> territoryList { get; set; }

		public TerritoryWrapper() {}

	}

	public class WorkWrapper {

		@AuraEnabled public ServiceAppointment serviceAppointment { get; set; }
		@AuraEnabled public WorkOrder saWorkOrder { get; set; }

		public WorkWrapper() {}

	}

}