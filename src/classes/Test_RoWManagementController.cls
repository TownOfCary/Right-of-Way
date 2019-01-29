/*
 * Created by byarsawi on 1/28/2019.
 */
@IsTest
private class Test_RoWManagementController {
	static Boolean isInstalled = false;

	private static void install() {
		if (!isInstalled) {
			Framework.Installer.install();
			base_toc.PackageScripts.install();
			pwut_toc.PackageScripts.install();
			PackageScripts.install();
			isInstalled = true;
		}
	}

	@TestSetup
	static void setupData() {
		Account a = new Account(
				Name = 'Asset Account'
		);
		insert a;

		Id priceBookId = Test.getStandardPricebookId();

		OperatingHours oh = new OperatingHours(
				Name = 'Test Hours',
				TimeZone = 'America/New_York'
		);
		insert oh;

		ServiceTerritory st = new ServiceTerritory(
				Name = 'Test Territory',
				OperatingHoursId = oh.id,
				IsActive = true
		);
		insert st;

		List<WorkType> wt = new List<WorkType>();
		wt.add(new WorkType(
				Name = 'Work Order',
				ShouldAutoCreateSvcAppt = true,
				RecordTypeId = base_toc.DescribeUtils.getRecordTypeId('WorkType', 'General Work Type'),
				EstimatedDuration = 1,
				DurationType = 'Hours',
				pwut_toc__Price_Book__c = priceBookId,
				pwut_toc__Inactive__c = false
		));
		wt.add(new WorkType(
				Name = 'Work Order',
				ShouldAutoCreateSvcAppt = true,
				RecordTypeId = base_toc.DescribeUtils.getRecordTypeId('WorkType', 'General Work Type'),
				EstimatedDuration = 1,
				DurationType = 'Hours',
				pwut_toc__Price_Book__c = priceBookId,
				pwut_toc__Inactive__c = false,
				FSL__Due_Date_Offset__c = 120
		));

		insert wt;

		String profileName = 'System Administrator';
		Profile pro =
				[SELECT Id
				FROM Profile
				WHERE Name = :profileName];

		List<User> newUsers = new List<User>();
		newUsers.add(new User(
				Alias = 'testUser',
				LastName = 'Testing',
				UserName = 'Test' + profileName.remove(' ') + '1@townofcary.com',
				ProfileId = pro.Id,
				Email = 'TestAssignedResources1@townofcary.com',
				EmailEncodingKey = 'UTF-8',
				LanguageLocaleKey = 'en_US',
				LocaleSidKey = 'en_US',
				TimeZoneSidKey = 'America/New_York'
		));
		newUsers.add(new User(
				Alias = 'testUser',
				LastName = 'Testing',
				UserName = 'Test' + profileName.remove(' ') + '2@townofcary.com',
				ProfileId = pro.Id,
				Email = 'TestAssignedResources1@townofcary.com',
				EmailEncodingKey = 'UTF-8',
				LanguageLocaleKey = 'en_US',
				LocaleSidKey = 'en_US',
				TimeZoneSidKey = 'America/New_York'
		));
		newUsers.add(new User(
				Alias = 'testUser',
				LastName = 'Testing',
				UserName = 'Test' + profileName.remove(' ') + '3@townofcary.com',
				ProfileId = pro.Id,
				Email = 'TestAssignedResources1@townofcary.com',
				EmailEncodingKey = 'UTF-8',
				LanguageLocaleKey = 'en_US',
				LocaleSidKey = 'en_US',
				TimeZoneSidKey = 'America/New_York'
		));
		newUsers.add(new User(
				Alias = 'testUser',
				LastName = 'Testing',
				UserName = 'Test' + profileName.remove(' ') + '4@townofcary.com',
				ProfileId = pro.Id,
				Email = 'TestAssignedResources1@townofcary.com',
				EmailEncodingKey = 'UTF-8',
				LanguageLocaleKey = 'en_US',
				LocaleSidKey = 'en_US',
				TimeZoneSidKey = 'America/New_York'
		));
		newUsers.add(new User(
				Alias = 'testUser',
				LastName = 'Testing',
				UserName = 'Test' + profileName.remove(' ') + '5@townofcary.com',
				ProfileId = pro.Id,
				Email = 'TestAssignedResources1@townofcary.com',
				EmailEncodingKey = 'UTF-8',
				LanguageLocaleKey = 'en_US',
				LocaleSidKey = 'en_US',
				TimeZoneSidKey = 'America/New_York'
		));

		User thisUser =
				[SELECT Id
				FROM User
				WHERE Id = :UserInfo.getUserId() ];

		System.runAs ( thisUser ) {
			insert newUsers;
		}

		List<ServiceResource> resourceList = new List<ServiceResource>();
		resourceList.add(new ServiceResource(
				pwut_toc__Can_Assign_Work__c = true,
				RelatedRecordId = UserInfo.getUserId(),
				IsActive = true,
				Name = 'Computer Wizard'
		));

		resourceList.add(new ServiceResource(
				pwut_toc__Can_Assign_Work__c = false,
				IsActive = true,
				RelatedRecordId = newUsers[0].Id,
				Name = 'Crew Member 1'
		));
		resourceList.add(new ServiceResource(
				pwut_toc__Can_Assign_Work__c = false,
				IsActive = true,
				RelatedRecordId = newUsers[1].Id,
				Name = 'Crew Member 2'
		));
		resourceList.add(new ServiceResource(
				pwut_toc__Can_Assign_Work__c = false,
				IsActive = true,
				RelatedRecordId = newUsers[2].Id,
				Name = 'Teritory Member 1'
		));
		resourceList.add(new ServiceResource(
				pwut_toc__Can_Assign_Work__c = false,
				IsActive = true,
				RelatedRecordId = newUsers[3].Id,
				Name = 'Teritory Member 2'
		));
		resourceList.add(new ServiceResource(
				pwut_toc__Can_Assign_Work__c = false,
				IsActive = true,
				RelatedRecordId = newUsers[4].Id,
				Name = 'Teritory Member 3'
		));

		insert resourceList;

		List<TimeSheet> timeSheetList = new List<TimeSheet>();
		timeSheetList.add(new TimeSheet(
				StartDate = Date.today().addDays(-10),
				EndDate = Date.today().addDays(10),
				ServiceResourceId = resourceList[0].Id,
				Status = 'Current'
		));
		timeSheetList.add(new TimeSheet(
				StartDate = Date.today().addDays(-10),
				EndDate = Date.today().addDays(10),
				ServiceResourceId = resourceList[1].Id,
				Status = 'Current'
		));
		timeSheetList.add(new TimeSheet(
				StartDate = Date.today().addDays(-10),
				EndDate = Date.today().addDays(10),
				ServiceResourceId = resourceList[2].Id,
				Status = 'Current'
		));
		timeSheetList.add(new TimeSheet(
				StartDate = Date.today().addDays(-10),
				EndDate = Date.today().addDays(10),
				ServiceResourceId = resourceList[3].Id,
				Status = 'Current'
		));
		timeSheetList.add(new TimeSheet(
				StartDate = Date.today().addDays(-10),
				EndDate = Date.today().addDays(10),
				ServiceResourceId = resourceList[4].Id,
				Status = 'Current'
		));
		timeSheetList.add(new TimeSheet(
				StartDate = Date.today().addDays(-10),
				EndDate = Date.today().addDays(10),
				ServiceResourceId = resourceList[5].Id,
				Status = 'Current'
		));
		insert timeSheetList;

		List<ServiceTerritoryMember> terriotryList = new List<ServiceTerritoryMember>();
		terriotryList.add(new ServiceTerritoryMember(
				ServiceTerritoryId = st.Id,
				ServiceResourceId = resourceList[0].Id,
				EffectiveStartDate = Datetime.now().addDays(-4),
				TerritoryType = 'P',
				OperatingHoursId = st.OperatingHoursId
		));
		terriotryList.add(new ServiceTerritoryMember(
				ServiceTerritoryId = st.Id,
				ServiceResourceId = resourceList[1].Id,
				EffectiveStartDate = Datetime.now().addDays(-4),
				TerritoryType = 'P',
				OperatingHoursId = st.OperatingHoursId
		));
		terriotryList.add(new ServiceTerritoryMember(
				ServiceTerritoryId = st.Id,
				ServiceResourceId = resourceList[2].Id,
				EffectiveStartDate = Datetime.now().addDays(-4),
				TerritoryType = 'P',
				OperatingHoursId = st.OperatingHoursId
		));
		terriotryList.add(new ServiceTerritoryMember(
				ServiceTerritoryId = st.Id,
				ServiceResourceId = resourceList[3].Id,
				EffectiveStartDate = Datetime.now().addDays(-4),
				TerritoryType = 'P',
				OperatingHoursId = st.OperatingHoursId
		));
		terriotryList.add(new ServiceTerritoryMember(
				ServiceTerritoryId = st.Id,
				ServiceResourceId = resourceList[4].Id,
				EffectiveStartDate = Datetime.now().addDays(-4),
				TerritoryType = 'P',
				OperatingHoursId = st.OperatingHoursId
		));
		terriotryList.add(new ServiceTerritoryMember(
				ServiceTerritoryId = st.Id,
				ServiceResourceId = resourceList[5].Id,
				EffectiveStartDate = Datetime.now().addDays(-4),
				TerritoryType = 'P',
				OperatingHoursId = st.OperatingHoursId
		));
		insert terriotryList;

		ServiceCrew crew = new ServiceCrew(
				Name = 'Crew 1',
				CrewSize = 3
		);
		insert crew;

		List<ServiceCrewMember> crewMemberList = new List<ServiceCrewMember>();
		crewMemberList.add(new ServiceCrewMember(
				ServiceResourceId = resourceList[0].Id,
				ServiceCrewId = crew.Id,
				StartDate = Datetime.now().addDays(-10),
				EndDate = Datetime.now().addYears(1),
				isLeader = true
		));
		crewMemberList.add(new ServiceCrewMember(
				ServiceResourceId = resourceList[1].Id,
				ServiceCrewId = crew.Id,
				StartDate = Datetime.now().addDays(-10),
				EndDate = Datetime.now().addYears(1),
				isLeader = false
		));
		crewMemberList.add(new ServiceCrewMember(
				ServiceResourceId = resourceList[2].Id,
				ServiceCrewId = crew.Id,
				StartDate = Datetime.now().addDays(-10),
				EndDate = Datetime.now().addYears(1),
				isLeader = false
		));

		insert crewMemberList;

	}

	@IsTest
	static void testCanAssign() {
		install();
		ServiceResource sr =
			[SELECT Id, pwut_toc__Can_Assign_Work__c, RelatedRecordId, IsActive, Name
			FROM ServiceResource
			WHERE RelatedRecordId = :UserInfo.getUserId()];

		Test.startTest();

		Boolean answer = RoWManagementController.canAssign();
		System.assertEquals(true, answer);

		sr.pwut_toc__Can_Assign_Work__c = false;
		update sr;

		answer = RoWManagementController.canAssign();
		System.assertEquals(false, answer);

		Test.stopTest();
	}

	@IsTest
	static void testAvailableStatuses() {
		install();
		List<WorkType> workTypes =
				[SELECT Id
				FROM WorkType];

		Id priceBookId = Test.getStandardPricebookId();

		WorkOrder wo = new WorkOrder(
				Subject = 'Test Work Order',
				Description = 'This Is a Test Work Order',
				WorkTypeId = workTypes[0].Id,
				Pricebook2Id = priceBookId
		);

		insert wo;

		ServiceAppointment sa =
				[SELECT Id, Status
				FROM ServiceAppointment
				WHERE ParentRecordId = :wo.Id];

		Test.startTest();
		String result = null;
		try {
			result = RoWManagementController.availableStatuses(sa.Id, 'TEST STATUS');
		} catch(Exception e) {
			System.assertEquals('System.AuraHandledException', e.getTypeName());
		}

		result = RoWManagementController.availableStatuses(sa.Id, 'Scheduled');

		Test.stopTest();

		sa =
				[SELECT Id, Status
				FROM ServiceAppointment
				WHERE Id = :sa.Id];

		System.assertEquals('Scheduled', result);
		System.assertEquals('Scheduled', sa.Status);
	}

	@IsTest
	static void testAssignedResourceAppts() {
		install();
		ServiceResource sr =
				[SELECT Id, pwut_toc__Can_Assign_Work__c, RelatedRecordId, IsActive, Name
				FROM ServiceResource
				WHERE RelatedRecordId = :UserInfo.getUserId()];

		List<WorkType> workTypes =
				[SELECT Id
				FROM WorkType];

		Id priceBookId = Test.getStandardPricebookId();

		List<WorkOrder> workOrders = new List<WorkOrder>();
		workOrders.add(new WorkOrder(
				Subject = 'Test Work Order',
				Description = 'This Is a Test Work Order',
				WorkTypeId = workTypes[0].Id,
				Pricebook2Id = priceBookId
		));

		workOrders.add(new WorkOrder(
				Subject = 'Test Work Order',
				Description = 'This Is a Test Work Order number 2',
				WorkTypeId = workTypes[0].Id,
				Pricebook2Id = priceBookId
		));

		workOrders.add(new WorkOrder(
				Subject = 'Test Work Order',
				Description = 'This Is a Test Work Order number 3',
				WorkTypeId = workTypes[1].Id,
				Pricebook2Id = priceBookId
		));

		insert workOrders;

		List<ServiceAppointment> saList =
				[SELECT Id, Status, SchedStartTime, SchedEndTime
				FROM ServiceAppointment];

		Test.startTest();

		List<AssignedResource> firstTestList = RoWManagementController.assignedResourceAppts();
		System.assertEquals(0, firstTestList.size());

		saList[0].Status = 'Scheduled';
		saList[0].SchedStartTime = Datetime.now();
		saList[0].SchedEndTime = Datetime.now().addHours(1);

		saList[1].Status = 'Scheduled';
		saList[1].SchedStartTime = Datetime.now();
		saList[1].SchedEndTime = Datetime.now().addHours(1);

		saList[2].Status = 'Scheduled';
		saList[2].SchedStartTime = Datetime.now();
		saList[2].SchedEndTime = Datetime.now().addHours(1);

		update saList;

		List<AssignedResource> arList = new List<AssignedResource>();
		arList.add(new AssignedResource(
				ServiceAppointmentId = saList[0].Id,
				ServiceResourceId = sr.Id
		));

		arList.add(new AssignedResource(
				ServiceAppointmentId = saList[1].Id,
				ServiceResourceId = sr.Id
		));

		arList.add(new AssignedResource(
				ServiceAppointmentId = saList[2].Id,
				ServiceResourceId = sr.Id
		));

		insert arList;

		List<AssignedResource> secondTestList = RoWManagementController.assignedResourceAppts();

		Test.stopTest();

		System.assertEquals(3, secondTestList.size());
	}

	@IsTest
	static void testGetResources() {
		install();
		Test.startTest();

		RoWManagementController.TerritoryWrapper terWrapper = RoWManagementController.getResources();

		Test.stopTest();

		System.assertEquals(3, terWrapper.crewList.size());
		System.assertEquals(3, terWrapper.trList.size());
		System.assertEquals(1, terWrapper.territoryList.size());

	}

	@IsTest
	static void testGetWODetail(){
		install();
		List<WorkType> workTypes =
				[SELECT Id
				FROM WorkType];

		Id priceBookId = Test.getStandardPricebookId();

		WorkOrder wo = new WorkOrder(
				Subject = 'Test Work Order',
				Description = 'This Is a Test Work Order',
				WorkTypeId = workTypes[0].Id,
				Pricebook2Id = priceBookId
		);

		insert wo;

		ServiceAppointment sa =
				[SELECT Id, Status
				FROM ServiceAppointment
				WHERE ParentRecordId = :wo.Id];

		Test.startTest();

		RoWManagementController.WorkWrapper work = RoWManagementController.getWODetail(sa.Id);

		Test.stopTest();

		System.assertEquals(sa.Id, work.serviceAppointment.Id);
		System.assertEquals(wo.Id, work.saWorkOrder.Id);
	}

	@IsTest
	static void testSaveResourceTimes(){
		install();
		List<WorkType> workTypes =
				[SELECT Id
				FROM WorkType];

		Id priceBookId = Test.getStandardPricebookId();

		WorkOrder wo = new WorkOrder(
				Subject = 'Test Work Order',
				Description = 'This Is a Test Work Order',
				WorkTypeId = workTypes[0].Id,
				Pricebook2Id = priceBookId
		);

		insert wo;

		ServiceAppointment sa =
				[SELECT Id, Status, SchedStartTime, SchedEndTime, ParentRecordId
				FROM ServiceAppointment
				WHERE ParentRecordId = :wo.Id];

		sa.SchedStartTime = Datetime.now();
		sa.SchedEndTime = Datetime.now().addHours(1);
		sa.Status = 'Scheduled';
		update sa;

		List<ServiceResource> srId =
				[SELECT Id
				FROM ServiceResource
				WHERE RelatedRecordId = :UserInfo.getUserId()];

		Map<Id, ServiceCrew> scMap = new Map<Id, ServiceCrew>(
				[SELECT Id
				FROM ServiceCrew
				WHERE Id IN
						(SELECT ServiceCrewId
						FROM ServiceCrewMember
						WHERE isLeader = true AND ServiceResourceId = :srId AND StartDate <= TODAY AND EndDate >= TODAY)]
		);

		List<ServiceResource> crewList =
				[SELECT Id, Name
				FROM ServiceResource
				WHERE Id IN
						(SELECT ServiceResourceId
						FROM ServiceCrewMember
						WHERE ServiceCrewId IN :scMap.keySet())
				ORDER BY Name ASC];

		List<AssignedResource> arList = new List<AssignedResource>();
		arList.add(new AssignedResource(
				ServiceAppointmentId = sa.Id,
				ServiceResourceId = crewList[0].Id
		));

		arList.add(new AssignedResource(
				ServiceAppointmentId = sa.Id,
				ServiceResourceId = crewList[1].Id
		));

		arList.add(new AssignedResource(
				ServiceAppointmentId = sa.Id,
				ServiceResourceId = crewList[2].Id
		));

		insert arList;

		Map<String, Integer> timeMap = new Map<String, Integer>();
		timeMap.put(crewList[0].Id, 120);
		timeMap.put(crewList[1].Id, 120);
		timeMap.put(crewList[2].Id, 80);

		Test.startTest();

		List<RoWManagementController.TreeGridWrapper> gridWrapper = RoWManagementController.saveResourceTimes(timeMap, sa);

		Test.stopTest();

		System.assertEquals(3, gridWrapper.size());
		System.assertEquals(120, gridWrapper[0].duration);
		System.assertEquals(80, gridWrapper[2].duration);
	}

	@IsTest
	static void testSaveProductsConsumed() {
		install();
		List<WorkType> workTypes =
				[SELECT Id
				FROM WorkType];

		Id priceBookId = Test.getStandardPricebookId();

		WorkOrder wo = new WorkOrder(
				Subject = 'Test Work Order',
				Description = 'This Is a Test Work Order',
				WorkTypeId = workTypes[0].Id,
				Pricebook2Id = priceBookId
		);

		insert wo;

		ServiceAppointment sa =
				[SELECT Id, Status, SchedStartTime, SchedEndTime, ParentRecordId
				FROM ServiceAppointment
				WHERE ParentRecordId = :wo.Id];

		List<Product2> products = new List<Product2>();
		products.add(new Product2(
				pwut_toc__Price__c = 10.00,
				Name = 'Each Prod',
				QuantityUnitOfMeasure = 'Each'
		));
		products.add(new Product2(
				pwut_toc__Price__c = 60.00,
				Name = 'Per Hour Prod',
				QuantityUnitOfMeasure = 'Per Hour'
		));

		insert products;

		List<PricebookEntry> pbeList = new List<PricebookEntry>();
		pbeList.add(new PricebookEntry(
				Pricebook2Id = priceBookId,
				Product2Id = products[0].Id,
				IsActive = true,
				UnitPrice = 10.00
		));
		pbeList.add(new PricebookEntry(
				Pricebook2Id = priceBookId,
				Product2Id = products[1].Id,
				IsActive = true,
				UnitPrice = 60.00
		));
		insert pbeList;

		List<ProductConsumed> consumedList = new List<ProductConsumed>();
		consumedList.add(new ProductConsumed(
				PricebookEntryId = pbeList[0].Id,
				QuantityConsumed = 4,
				UnitPrice = 10.00
		));
		consumedList.add(new ProductConsumed(
				PricebookEntryId = pbeList[1].Id,
				QuantityConsumed = 60,
				UnitPrice = 60.00
		));

		Test.startTest();

		List<RoWManagementController.TreeGridWrapper> gridWrapper = RoWManagementController.saveProductsConsumed(consumedList, sa);

		Test.stopTest();

		List<ProductConsumed> finishedProducts =
				[SELECT Id, WorkOrderId
				FROM ProductConsumed];

		for (ProductConsumed pc : finishedProducts) {
			System.assertEquals(wo.Id, pc.WorkOrderId);
		}

		System.assertEquals(2, gridWrapper.size());
		System.assertEquals('$40.00', gridWrapper[0].status);
		System.assertEquals('Each Prod', gridWrapper[0].resource);
		System.assertEquals('$60.00', gridWrapper[1].status);
		System.assertEquals('Per Hour Prod', gridWrapper[1].resource);
	}

	@IsTest
	static void testRoWWorkOrderMaterials() {
		install();
		List<WorkType> workTypes =
				[SELECT Id
				FROM WorkType];

		Id priceBookId = Test.getStandardPricebookId();

		WorkOrder wo = new WorkOrder(
				Subject = 'Test Work Order',
				Description = 'This Is a Test Work Order',
				WorkTypeId = workTypes[0].Id,
				Pricebook2Id = priceBookId
		);

		insert wo;

		ServiceAppointment sa =
				[SELECT Id, Status, SchedStartTime, SchedEndTime, ParentRecordId
				FROM ServiceAppointment
				WHERE ParentRecordId = :wo.Id];

		RoWManagementController.WorkWrapper work = new RoWManagementController.WorkWrapper();
		work.serviceAppointment = sa;
		work.saWorkOrder = wo;

		List<pwut_toc__Work_Order_Material__c> materials = new List<pwut_toc__Work_Order_Material__c>();
		materials.add(new pwut_toc__Work_Order_Material__c(
				pwut_toc__Item_Description__c = 'Test Item 1',
				pwut_toc__Cost__c = 12.00,
				pwut_toc__Quantity__c = 2
		));
		materials.add(new pwut_toc__Work_Order_Material__c(
				pwut_toc__Item_Description__c = 'Test Item 2',
				pwut_toc__Cost__c = 2.00,
				pwut_toc__Quantity__c = 5
		));
		materials.add(new pwut_toc__Work_Order_Material__c(
				pwut_toc__Item_Description__c = 'Test Item 3',
				pwut_toc__Cost__c = 6.00,
				pwut_toc__Quantity__c = 3
		));

		Test.startTest();

		List<pwut_toc__Work_Order_Material__c> insertedList = RoWManagementController.saveWorkOrderMaterials(materials, sa);
		System.assertEquals(3, insertedList.size());
		for (pwut_toc__Work_Order_Material__c wom : insertedList) {
			System.assertEquals(wo.Id, wom.pwut_toc__WorkOrder__c);
		}

		List<pwut_toc__Work_Order_Material__c> retrievedList = RoWManagementController.getWorkOrderMaterials(work);
		System.assertEquals(3, retrievedList.size());
		System.assertEquals(10, retrievedList[0].pwut_toc__Total_Cost__c);
		System.assertEquals(18, retrievedList[1].pwut_toc__Total_Cost__c);
		System.assertEquals(24, retrievedList[2].pwut_toc__Total_Cost__c);

		retrievedList[0].pwut_toc__Quantity__c = 4;
		List<pwut_toc__Work_Order_Material__c> upsertList = RoWManagementController.saveWorkOrderMaterials(retrievedList, sa);

		Test.stopTest();

		List<pwut_toc__Work_Order_Material__c> finalList =
				[SELECT Id, pwut_toc__Cost__c, pwut_toc__Quantity__c, pwut_toc__Total_Cost__c, pwut_toc__Item_Description__c
				FROM pwut_toc__Work_Order_Material__c
				ORDER BY pwut_toc__Total_Cost__c];
		System.assertEquals(8, finalList[0].pwut_toc__Total_Cost__c);
		System.assertEquals(18, finalList[1].pwut_toc__Total_Cost__c);
		System.assertEquals(24, finalList[2].pwut_toc__Total_Cost__c);
	}

}