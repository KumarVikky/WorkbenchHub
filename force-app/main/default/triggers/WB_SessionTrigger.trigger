trigger WB_SessionTrigger on WB_WorkbenchHubSession__c (after insert) {
    if(Trigger.isAfter && Trigger.isInsert){
        WB_SessionTriggerHandler.updateOldMatchedSession(Trigger.newMap);
    }
}