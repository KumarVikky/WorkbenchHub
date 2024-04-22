public class WB_SessionTriggerHandler {
    public static void updateOldMatchedSession(Map<Id,WB_WorkbenchHubSession__c> sessionMap){
        Set<String> userIdSet = new Set<String>();
        for(WB_WorkbenchHubSession__c wbs : sessionMap.values()){
            if(wbs.WB_UserId__c != null){
                userIdSet.add(wbs.WB_UserId__c);
            }
        }
        Map<String,WB_WorkbenchHubSession__c> oldMatchedSessionMap = new Map<String,WB_WorkbenchHubSession__c>();
        List<WB_WorkbenchHubSession__c> sessionListToDelete = new List<WB_WorkbenchHubSession__c>();
        for(WB_WorkbenchHubSession__c wbs : [SELECT Id, WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c, WB_UserId__c, WB_OrganizationId__c, WB_HostURL__c FROM WB_WorkbenchHubSession__c WHERE WB_UserId__c IN :userIdSet AND Id NOT IN :sessionMap.keySet() ORDER BY CreatedDate ASC]){
            if(!oldMatchedSessionMap.containsKey(wbs.WB_UserId__c)){
                oldMatchedSessionMap.put(wbs.WB_UserId__c, wbs);
            }else{
                sessionListToDelete.add(wbs);
            }
        }
        List<WB_WorkbenchHubSession__c> sessionListToUpdate = new List<WB_WorkbenchHubSession__c>();
        for(WB_WorkbenchHubSession__c newSession : sessionMap.values()){
            if(newSession.WB_UserId__c != null && oldMatchedSessionMap.containsKey(newSession.WB_UserId__c)){
                WB_WorkbenchHubSession__c oldSession = new WB_WorkbenchHubSession__c();
                oldSession.Id = oldMatchedSessionMap.get(newSession.WB_UserId__c).Id;
                oldSession.WB_AccessToken__c = newSession.WB_AccessToken__c ?? oldMatchedSessionMap.get(newSession.WB_UserId__c).WB_AccessToken__c;
                oldSession.WB_RefreshToken__c = newSession.WB_RefreshToken__c ?? oldMatchedSessionMap.get(newSession.WB_UserId__c).WB_RefreshToken__c;
                oldSession.WB_DomainURL__c = newSession.WB_DomainURL__c ?? oldMatchedSessionMap.get(newSession.WB_UserId__c).WB_DomainURL__c;
                oldSession.WB_UserId__c = newSession.WB_UserId__c ?? oldMatchedSessionMap.get(newSession.WB_UserId__c).WB_UserId__c;
                oldSession.WB_OrganizationId__c = newSession.WB_OrganizationId__c ?? oldMatchedSessionMap.get(newSession.WB_UserId__c).WB_OrganizationId__c;
                oldSession.WB_HostURL__c = newSession.WB_HostURL__c ?? oldMatchedSessionMap.get(newSession.WB_UserId__c).WB_HostURL__c;
                sessionListToUpdate.add(oldSession);
                sessionListToDelete.add(new WB_WorkbenchHubSession__c(Id = newSession.Id));
            }
        }
        if(!sessionListToUpdate.isEmpty()){
            Database.update(sessionListToUpdate);
        }
        if(!sessionListToDelete.isEmpty()){
            Database.delete(sessionListToDelete);
        }
    }
}