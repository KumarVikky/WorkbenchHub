public class WB_SelfTokenRequest extends WB_ServiceAdapter implements WB_ServiceRequest {
    private String username;
    private String password;
    private String clientId;
    private String clientSecret; 
    
    protected override String setHttpMethod(){
        return 'POST';
    }
    protected override String setEndPointURL(){
        return 'https://login.salesforce.com/services/oauth2/token';
    }
    protected override String setRequestBody(){
        String body = 'grant_type=password' + 
            '&client_id=' + clientId + 
            '&client_secret=' + clientSecret + 
            '&username=' + username + 
            '&password=' + password;
        return body;
    }
    protected override Map<String,String> setHttpHeader(){
        Map<String,String> headerValues = new Map<String,String>();           
        headerValues.put('Accept', '*/*');
        headerValues.put('Content-Type','application/x-www-form-urlencoded');
        return headerValues;
    }
    protected override Integer setHttpTimeOut(){
        return 120000;
    }
    
    public Object executeService(Object instance, Map<String,String> params){
        WB_WorkbenchHubSetting__mdt wb = WB_WorkbenchHubSetting__mdt.getInstance(WB_ServiceAppConstant.WB_SETTING);
        WB_SelfTokenRequest service = (WB_SelfTokenRequest)instance;
        service.username = wb.WB_Username__c;
        service.password = wb.WB_Password__c;
        service.clientId = wb.WB_ConsumerKey__c;
        service.clientSecret = wb.WB_ConsumerSecret__c;
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        Map<String,Object> resultMap = (Map<String,Object>)JSON.deserializeUntyped(res.getBody());
        return (String)resultMap.get('access_token');
    }
}