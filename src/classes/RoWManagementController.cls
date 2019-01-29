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
				[SELECT Id, Status
				FROM ServiceAppointment
				WHERE Id = :saId];

		sa.Status = status;
		try {
			update sa;
		}
		catch (Exception e){
			System.debug('Error changing the status');
			System.debug(e);
			throw new AuraHandledException(e.getMessage());
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

		Id currUser = UserInfo.getUserId();
		List<ServiceResource> srId =
				[SELECT Id
				FROM ServiceResource
				WHERE RelatedRecordId = :currUser];

		Map<Id, ServiceCrew> scMap = new Map<Id, ServiceCrew>(
				[SELECT Id
				FROM ServiceCrew
				WHERE Id IN
					(SELECT ServiceCrewId
					FROM ServiceCrewMember
					WHERE isLeader = true AND ServiceResourceId = :srId AND StartDate <= TODAY AND EndDate >= TODAY)]
		);

		Map<Id, ServiceResource> crewList = new Map<Id, ServiceResource>(
				[SELECT Id, Name
				FROM ServiceResource
				WHERE Id IN
						(SELECT ServiceResourceId
						FROM ServiceCrewMember
						WHERE ServiceCrewId IN :scMap.keySet())
				ORDER BY Name ASC]
		);

		Map<Id, ServiceTerritory> territoryMap = new Map<Id, ServiceTerritory>(
				[SELECT Id
				FROM ServiceTerritory
				WHERE Id IN
						(SELECT ServiceTerritoryId
						FROM ServiceTerritoryMember
						WHERE ServiceResourceId = :srId[0].Id)]
		);

		List<ServiceResource> teritoryList =
				[SELECT Id, Name
				FROM ServiceResource
				WHERE Id NOT IN :crewList.keySet() AND Id IN
						(SELECT ServiceResourceId
						FROM ServiceTerritoryMember
						WHERE ServiceTerritoryId IN :territoryMap.keySet())
				ORDER BY Name ASC];

		tw.crewList = crewList.values();
		tw.trList = teritoryList;
		tw.territoryList = territoryMap.keySet();
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
				[SELECT Id, WorkOrderNumber, Priority, pwut_toc__Due_Date__c, Subject, Address, Status, WorkType.pwut_toc__Price_Book__c,
						(SELECT Id, Product2.Name, Product2.QuantityUnitOfMeasure, QuantityUnitOfMeasure, QuantityConsumed,
							pwut_toc__Total_Cost__c, UnitPrice
						FROM ProductsConsumed
						ORDER BY pwut_toc__Total_Cost__c),
						(SELECT Id, TimeSheet.Id, TimeSheet.ServiceResource.Name, Status, DurationInMinutes
						FROM TimeSheetEntries
						WHERE EndTime != null),
						(SELECT Id, pwut_toc__Cost__c, pwut_toc__Quantity__c, pwut_toc__Total_Cost__c, pwut_toc__Item_Description__c,
							pwut_toc__Transaction_Date__c
						FROM pwut_toc__Work_Order_Materials__r
						ORDER BY pwut_toc__Total_Cost__c)
				FROM WorkOrder
				WHERE Id = :ww.serviceAppointment.ParentRecordId Limit 1];

		System.debug(ww);
		return ww;
	}

	@AuraEnabled
	public static List<TreeGridWrapper> saveResourceTimes(Map<String, Object> times, ServiceAppointment sa) {
		List<TreeGridWrapper> tgwList = new List<TreeGridWrapper>();
		Datetime itsNow = System.now();
		Map<Id, ServiceResource> srMap = new Map<Id, ServiceResource>(
				[SELECT Id, Name,
						(SELECT Id
						FROM TimeSheets
						WHERE Status = 'Current')
				FROM ServiceResource
				WHERE Id IN :times.keySet()]
		);

		List<TimeSheetEntry> tseList = new List<TimeSheetEntry>();
		for (Id srId : times.keySet()) {
			// hate to hard code this... but...
			TreeGridWrapper tgw = new TreeGridWrapper();

			ServiceResource sr = srMap.get(srId);

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
				throw new AuraHandledException(e.getMessage());
			}
		}
		insert tseList;
		return tgwList;
	}

	@AuraEnabled
	public static List<TreeGridWrapper> saveProductsConsumed(List<ProductConsumed> productList, ServiceAppointment sa) {
		List<TreeGridWrapper> tgwList = new List<TreeGridWrapper>();
	 	system.debug(productList);
	 	system.debug(sa);

		Set<Id> pbeList = new Set<Id>();
		for(ProductConsumed pc : productList) {
			pc.WorkOrderId = sa.ParentRecordId;
			pbeList.add(pc.PricebookEntryId);
		}


		Map<Id, PricebookEntry> pbeMap = new Map<Id, PricebookEntry>(
				[SELECT Id, Name, UnitPrice, Product2.QuantityUnitOfMeasure
				FROM PricebookEntry
				WHERE Id IN :pbeList]
		);

		for (ProductConsumed pc : productList) {
			PriceBookEntry pbe = pbeMap.get(pc.PriceBookEntryId);

			try {
				TreeGridWrapper tgw = new TreeGridWrapper();
				Decimal quant = (Decimal) pc.QuantityConsumed;
				if (pbe.Product2.QuantityUnitOfMeasure == 'Per Hour') {
					quant = (quant / 60).setScale(2);
				}
				tgw.status = '$' + String.valueOf((quant * pbe.UnitPrice).setScale(2));

				pc.QuantityConsumed = quant;

				tgw.theId = pbe.Id;
				tgw.resource = pbe.Name;
				tgw.duration = pc.QuantityConsumed;

				tgwList.add(tgw);
			} catch (Exception e) {
				// returns an error message to alert the user so they can help us debug
				System.debug('caught the flu: ' + e);
				throw new AuraHandledException(e.getMessage());
			}
		}
		upsert productList;

		System.debug(tgwList);
		return tgwList;
	}

	@AuraEnabled
	public static List<pwut_toc__Work_Order_Material__c> saveWorkOrderMaterials(List<pwut_toc__Work_Order_Material__c> materialList, ServiceAppointment sa) {
		system.debug(materialList);
		for (pwut_toc__Work_Order_Material__c wom : materialList) {
			wom.pwut_toc__WorkOrder__c = sa.ParentRecordId;
		}
		upsert materialList;
		return materialList;
	}

	@AuraEnabled
	public static List<pwut_toc__Work_Order_Material__c> getWorkOrderMaterials(WorkWrapper workWrapper) {
		List<pwut_toc__Work_Order_Material__c> womList =
				[SELECT Id, pwut_toc__Cost__c, pwut_toc__Quantity__c, pwut_toc__Total_Cost__c, pwut_toc__Item_Description__c
				FROM pwut_toc__Work_Order_Material__c
				WHERE pwut_toc__WorkOrder__c = :workWrapper.saWorkOrder.Id
				ORDER BY pwut_toc__Total_Cost__c];

		return womList;
	}



	public class TreeGridWrapper {

		@AuraEnabled public String theId { get; set; }
		@AuraEnabled public String resource { get; set; }
		@AuraEnabled public Decimal duration { get; set; }
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