public class WB_FetchToken extends WB_ServiceAdapter implements WB_ServiceRequest{
    private String clientId;
    private String clientSecret;
    private String code;
    private String redirectURL;
    private String endPointURL;
    
    protected override String setHttpMethod(){
        return 'POST';
    }
    protected override String setEndPointURL(){
        return this.endPointURL + '/services/oauth2/token?&grant_type=authorization_code' +
            '&client_id=' + EncodingUtil.urlencode(this.clientId,'UTF-8') +
            '&client_secret=' + EncodingUtil.urlencode(this.clientSecret,'UTF-8') + 
            '&code=' + EncodingUtil.urlencode(this.code,'UTF-8') +
            '&redirect_uri=' + this.redirectURL;
    }
    protected override String setRequestBody(){
        return null;
    }
    protected override Map<String,String> setHttpHeader(){
        Map<String,String> headerValues = new Map<String,String>();           
        headerValues.put('Accept', '*/*');
        headerValues.put('Content-Type', 'application/x-www-form-urlencoded');
        return headerValues;
    }
    protected override Integer setHttpTimeOut(){
        return 120000;
    }
    
    public Object executeService(Object instance, Map<String,String> params){
        WB_WorkbenchHubSetting__mdt wb = WB_WorkbenchHubSetting__mdt.getInstance(WB_ServiceAppConstant.WB_SETTING);
        WB_FetchToken service = (WB_FetchToken)instance;
        service.clientId = wb.WB_ConsumerKey__c;
        service.clientSecret = wb.WB_ConsumerSecret__c;
        service.code = params.get(WB_ServiceAppConstant.CODE);
        service.endPointURL =  params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        service.redirectURL = wb.WB_RedirectURL__c;
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        WB_TokenWrapper resWrap = WB_TokenWrapper.parse(res.getBody());
        if(resWrap.access_token?.length() > 0){
            Id userId = (Id) resWrap.id.substringAfterLast('/');
            Id orgId = (Id) resWrap.id.substringBetween('id/','/');
            String orgURL = resWrap.instance_url;
            String hostURL = resWrap.id.substringBefore('/id');
            Map<String,String> sessionParams = new Map<String,String>{'access_token' => resWrap.access_token,'refresh_token' => resWrap.refresh_token, 'orgURL' => orgURL, 'userId' => userId, 'orgId' => orgId, 'hostURL' => hostURL};  
            createSession(sessionParams);
            return userId;
        }
        return null;
    }
    public static void createSession(Map<String,String> sessionParams){
        WB_WorkbenchHubSession__c record = new WB_WorkbenchHubSession__c ();
        record.WB_AccessToken__c = sessionParams.get('access_token');
        record.WB_RefreshToken__c = sessionParams.get('refresh_token');
        record.WB_DomainURL__c = sessionParams.get('orgURL');
        record.WB_UserId__c = sessionParams.get('userId');
        record.WB_OrganizationId__c = sessionParams.get('orgId');
        record.WB_HostURL__c = sessionParams.get('hostURL');
        Database.insert(record, true);   
    }
    
}