public class WB_RenewToken extends WB_ServiceAdapter implements WB_ServiceRequest{
    private String clientId;
    private String clientSecret;
    private String refreshToken;
    private String endPointURL;
    
    protected override String setHttpMethod(){
        return 'POST';
    }
    protected override String setEndPointURL(){
        return this.endPointURL + '/services/oauth2/token';
    }
    protected override String setRequestBody(){
       String requestBody = 'grant_type=refresh_token&client_id={0}&client_secret={1}&refresh_token={2}';
       return String.format(requestBody, new String[]{encodingUtil.urlencode(this.clientId,'UTF-8'), encodingUtil.urlencode(this.clientSecret,'UTF-8'), encodingUtil.urlencode(this.refreshToken,'UTF-8')});
    }
    protected override Map<String,String> setHttpHeader(){        
        Map<String,String> headerValues = new Map<String,String>();           
        headerValues.put('Accept', '*/*');
        headerValues.put('Content-Type', 'application/x-www-form-urlencoded');
        headerValues.put('Authorization', 'Basic');
        return headerValues;
    }
    protected override Integer setHttpTimeOut(){
        return 120000; 
    }
    
    public Object executeService(Object instance, Map<String,String> params){
        WB_WorkbenchHubSetting__mdt wb = WB_WorkbenchHubSetting__mdt.getInstance(WB_ServiceAppConstant.WB_SETTING);
        WB_RenewToken service = (WB_RenewToken)instance;
        service.clientId = wb.WB_ConsumerKey__c;
        service.clientSecret = wb.WB_ConsumerSecret__c;
       	service.refreshToken = params.get(WB_ServiceAppConstant.REFRESH_TOKEN);
        service.endPointURL = params.get(WB_ServiceAppConstant.HOST_URL);
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        WB_RenewTokenWrapper resWrap = WB_RenewTokenWrapper.parse(res.getBody());
        if(resWrap.access_token?.length() > 0){
        	Id userId = (Id) resWrap.id.substringAfterLast('/');
            Map<String,String> sessionParams = new Map<String,String>{'access_token' => resWrap.access_token, 'userId' => userId};  
            createSession(sessionParams);
        	return resWrap.access_token;
        }
        return null;
    }
    public static void createSession(Map<String,String> sessionParams){
        WB_WorkbenchHubSession__c record = new WB_WorkbenchHubSession__c ();
        record.WB_AccessToken__c = sessionParams.get('access_token');
        record.WB_UserId__c = sessionParams.get('userId');
        Database.insert(record, true);   
    }
}