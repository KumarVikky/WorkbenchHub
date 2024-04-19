public class WB_RenewToken extends WB_ServiceAdapter implements WB_ServiceRequest{
    private String clientId;
    private String clientSecret;
    private String refreshToken;
    private String endPointURL;
    
    protected override String setHttpMethod(){
        return 'POST';
    }
    protected override String setEndPointURL(){
        return this.endPointURL + '/services/oauth2/token?grant_type=refresh_token' + 
            '&client_id=' + encodingUtil.urlencode(this.clientId,'UTF-8') + 
            '&client_secret=' + encodingUtil.urlencode(this.clientSecret,'UTF-8') + 
            '&refresh_token=' + encodingUtil.urlencode(this.refreshToken,'UTF-8');
    }
    protected override String setRequestBody(){
       return null;
    }
    protected override Map<String,String> setHttpHeader(){        
        Map<String,String> headerValues = new Map<String,String>();           
        headerValues.put('Accept', '*/*');
        headerValues.put('Content-Type', 'application/json');
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
        service.endPointURL = params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        WB_RenewTokenWrapper resWrap = WB_RenewTokenWrapper.parse(res.getBody());
        if(resWrap.access_token?.length() > 0){
        	Id userId = (Id) resWrap.id.substringAfterLast('/');
        	Id orgId = (Id) resWrap.id.substringBetween('id/','/');
            String orgURL = resWrap.instance_url;
            Map<String,String> sessionParams = new Map<String,String>{'access_token' => resWrap.access_token, 'orgURL' => orgURL, 'userId' => userId, 'orgId' => orgId};  
            createSession(sessionParams);
        	return resWrap.access_token;
        }
        return null;
    }
    public static void createSession(Map<String,String> sessionParams){
        WB_WorkbenchHubSession__c record = new WB_WorkbenchHubSession__c ();
        record.WB_AccessToken__c = sessionParams.get('access_token');
        record.WB_DomainURL__c = sessionParams.get('orgURL');
        record.WB_UserId__c = sessionParams.get('userId');
        record.WB_OrganizationId__c = sessionParams.get('orgId');
        Database.insert(record, true);   
    }
}