/*
 * -----------------------------------------------------------------------------
 * COPYRIGHT (C) 2018, FONTEVA, INC.
 * ALL RIGHTS RESERVED.
 *
 * ALL INFORMATION CONTAINED HEREIN IS, AND REMAINS THE PROPERTY OF FONTEVA
 * INCORPORATED AND ITS SUPPLIERS, IF ANY. THE INTELLECTUAL AND TECHNICAL
 * CONCEPTS CONTAINED HEREIN ARE PROPRIETARY TO FONTEVA INCORPORATED AND
 * ITS SUPPLIERS AND MAY BE COVERED BY U.S. AND FOREIGN PATENTS, PATENTS IN
 * PROCESS, AND ARE PROTECTED BY TRADE SECRET OR COPYRIGHT LAW. DISSEMINATION
 * OF THIS INFORMATION OR REPRODUCTION OF THIS MATERIAL IS STRICTLY FORBIDDEN
 * UNLESS PRIOR WRITTEN PERMISSION IS OBTAINED FROM FONTEVA, INC.
 * -----------------------------------------------------------------------------
 */

/**
 * @author Ulas Kutuk
 **/
global without sharing class PackageScripts implements InstallHandler, UninstallHandler {

    /**
     * Required for UninstallHandler interface implementation
     * ID organizationId();
     * ID uninstallerId();
     * @param  {InstallContext} context Object providing methods to retrieve
     *                                  organization Id and uninstalling user Id.
     */
     private String toAddress = 'package@townofcary.org'; //enter who should be messaged about installs here.
     private String replyTo = 'noreply@townofcary.org'; //enter who the email is from here

    global void onInstall(InstallContext context) {
        PackageScripts.install();


        String[] toAddresses = new String[]{toAddress};
        try {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(toAddresses);
            mail.setReplyTo(replyTo);
            mail.setSenderDisplayName('Town Of Cary ' + PackageUtils.namespace.toUppercase());
            String mailSubject = PackageUtils.namespace.toUppercase() + ' ';
            mailSubject += 'INSTALLED';
            mail.setSubject(mailSubject);
            //mail.setPlainTextBody(jsonData);
            Messaging.sendEmail(new Messaging.Email[] { mail });
        }
        catch (Exception ex) {
            Framework__System_Log__c log = new Framework__System_Log__c();
            log.Framework__Exception_Data__c = 'Exception Type: ' + ex.getTypeName() + '\nCaused By: ' + ex.getCause();
            log.Framework__Data__c = 'EXCEPTION: ' + ex.getMessage();
            insert log;
        }
    }

    /**
     * Required for UninstallHandler interface implementation
     * ID organizationId();
     * ID uninstallerId();
     * @param  {UninstallContext} context Object providing methods to retrieve
     *                                    organization Id and uninstalling user Id.
     */
    global void onUninstall(UninstallContext context) {
        User u = [Select Id, Username, FirstName, LastName, Title,
                CompanyName, Phone, Email, Street, City, State,
                PostalCode, Country from User where Id =: context.uninstallerId()];

        String eventDescriptor = 'Uninstall';
        String jsonData = '[{' +
                '"organization_id": "' + context.organizationId() + '",' +
                '"user_id": "' + context.uninstallerId() + '",' +
                '"username": "' + u.Username + '",' +
                '"first_name": "' + u.Phone + '",' +
                '"last_name": "' + u.LastName + '",' +
                '"phone": "' + u.Phone + '",' +
                '"email": "' + u.Email + '",' +
                '"company": "' + u.CompanyName +'",' +
                '"title": "' + u.Title + '",' +
                '"package": "' + PackageUtils.namespace + '",' +
                '"event": "' + eventDescriptor + '"' +
                '}]';

        String[] toAddresses = new String[]{toAddress};
        Messaging.SingleEmailMessage mail =
                new Messaging.SingleEmailMessage();
        mail.setToAddresses(toAddresses);
        mail.setReplyTo(replyTo);
        mail.setSenderDisplayName('FONTEVA ' + PackageUtils.namespace.toUppercase());
        mail.setSubject(PackageUtils.namespace.toUppercase() + ' UNINSTALLED');
        mail.setPlainTextBody(jsonData);
        Messaging.sendEmail(new Messaging.Email[] { mail });
    }

    /**
     * Execute the installation scripts for the OrderApi managed package
     */
    global static void install() {
        new Install().run();
    }

    /**
     * Runs all default installation scripts for the MANAGED PACKAGE
     *
     * @implements Framework.Scriptable
     * @author Ulas Kutuk
     * @since 1.0
     */
    global class Install implements Framework.Scriptable {
        global void run() {
            Framework.Log.push(PackageScripts.Install.class.getName(),'run');
            try {
                new Register().run();
                new Rollups().run();

                registerAppUpdates();
            }
            catch (Exception ex) {
                Framework.Log.debugException(ex);
            }
            Framework.Log.pop();
        }
    }

    global class Register implements Framework.Scriptable {
        global void run() {

            // R E G I S T E R I N G     T H E     A P P
            // Fill in Name and update description
            Framework.RegisteredApp toc = new Framework.RegisteredApp();
            toc.namespace = PackageUtils.namespace;
            toc.name = 'Right of Way';
            toc.description = 'Managed Package Developed by TOC';
            toc.isManaged = true;
            toc.isEnabled = true;
            toc.installClass = PackageScripts.Install.class.getName();
            Framework.Config.push(toc);


            // R E G I S T E R I N G    T H E     O B J E C T S
            Framework.RegisteredObject[] regObjects = new List<Framework.RegisteredObject>();

             //Asset ---------------------------------------------------------------------
            /* template For Registered Objects
            Framework.RegisteredObject obj1 = new Framework.RegisteredObject();
            obj1.sObjectName = Framework.SchemaService.getDescribe(Asset.SObjectType).getName();
            obj1.apexClass = Assets.class.getName();
            obj1.namespace = PackageUtils.namespace;
            obj1.isEnabled = true;
            obj1.isStandard = true;
            obj1.triggersEnabled = true;
            obj1.soqlLimit = String.valueOf(2000);
            obj1.soqlOrderBy = 'Name ASC';
            regObjects.add(obj1);
            */

            Framework.Config.push(regObjects);


            // R O U T I N G    R U L E S
            Framework.RoutingRule[] rules = new List<Framework.RoutingRule>();

            // Account ** Routing Rule Extension **
            // ---------------------------------------------------------------------
            /* TEMPLATE FROM ROUTING RULES
            Framework.RoutingRule objRule = new Framework.RoutingRule();
            objRule.apexClass = CLASSNAME.class.getName();
            objRule.namespace = PackageUtils.namespace;
            objRule.isEnabled = true;
            objRule.sObjectName = SObjectType.SOBJECTNAME.getName();
            objRule.executionOrder = 0;
            rules.add(objRule);
            */

            Framework.Config.push(rules);
        }
    }

    global class Rollups implements Framework.Scriptable {
        global void run() {
            Framework.Log.push(PackageScripts.class.getName(),'.createRollups');

            Framework.RollupSummaryField[] rsfs = new List<Framework.RollupSummaryField>();

            /**
             * OrderApi__Invoice__c.Amount_Paid__c (Sum)
             */
//            Framework.RollupSummaryField rsf = new Framework.RollupSummaryField();
//            rsf.namespace = PackageUtils.namespace;
//            rsf.childField = SObjectType.OrderApi__Receipt_Line__c.fields.OrderApi__Total__c.getName();
//            rsf.childSObject = SObjectType.OrderApi__Receipt_Line__c.getName();
//            rsf.filter = SObjectType.OrderApi__Receipt_Line__c.fields.OrderApi__Is_Refund__c.getName() + ' != true';
//            rsf.operation = Framework.RollupSummaryField.Operation.Sum.name();
//            rsf.parentField = Framework.SchemaService.getDescribe(OrderApi__Invoice__c.Amount_Paid__c).getName();
//            rsf.parentSObject = Framework.SchemaService.getDescribe(OrderApi__Invoice__c.SObjectType).getName();
//            rsf.relationshipField = Framework.SchemaService.getDescribe(OrderApi__Receipt_Line__c.Invoice__c).getName();
//            rsf.isEnabled = false;
//            rsfs.add(rsf);

            Framework.Config.push(rsfs);

            Framework.Log.pop();
        }
    }

    global class Jobs implements Framework.Scriptable {
        global void run() {
            //SubscriptionBatchable batchSubscriptions = new SubscriptionBatchable(true);
            //Database.executeBatch(batchSubscriptions,100);
        }
    }

    static void registerAppUpdates() {
        Framework.AppUpdate[] results = new List<Framework.AppUpdate>();

        Framework.AppUpdate appUpdateObj = Framework.AppUpdate.get('Contact Phone Update');

        /*if (appUpdateObj == null) {
            appUpdateObj = new Framework.AppUpdate();
            appUpdateObj.configId = 'Contact Phone Update';
            appUpdateObj.displayName = 'Enables Discounts during checkout';
            appUpdateObj.description = 'The ability to offer discount codes for customers during checkout.';
            appUpdateObj.isActivated = false;
            appUpdateObj.namespace = PackageUtils.namespace;
            results.add(appUpdateObj);
        }
        else if (String.isEmpty(appUpdateObj.namespace)) {
            appUpdateObj.description = 'The ability to offer discount codes for customers during checkout.';
            appUpdateObj.namespace = PackageUtils.namespace;
            results.add(appUpdateObj);
        }*/

        if (!results.isEmpty()) {
            Framework.Config.push(results);
        }
    }


}
