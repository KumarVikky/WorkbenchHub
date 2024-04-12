public class WB_FetchToken extends WB_ServiceAdapter implements WB_ServiceRequest{
    public virtual class BaseException extends Exception {}
    public class AppException extends BaseException {}
    
    private String clientId;
    private String clientSecret;
    private String code;
    private String redirectURL;
    private String endPointURL;
    
    protected override String setHttpMethod(){
        return 'POST';
    }
    protected override String setEndPointURL(){
        return this.endPointURL + '/services/oauth2/token'+'?code=' + encodingUtil.urlencode(this.code,'UTF-8') +
            '&grant_type=authorization_code' + '&client_id=' + encodingUtil.urlencode(this.clientId,'UTF-8') +
            '&client_secret=' + this.clientSecret + '&redirect_uri='+this.redirectURL;
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
        WB_WorkbenchSetting__mdt wb = WB_WorkbenchSetting__mdt.getInstance(WB_ServiceAppConstant.WB_SETTING);
        WB_FetchToken service = (WB_FetchToken)instance;
        service.clientId = wb.WB_ConsumerKey__c;
        service.clientSecret = wb.WB_ConsumerSecret__c;
        service.code = params.get(WB_ServiceAppConstant.CODE);
        service.endPointURL =  params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        service.redirectURL = WB_ServiceAppConstant.REDIRECT_URL;
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        Object response = null;
        if(res.getStatusCode() == WB_ServiceAppConstant.STATUS_OK){
            WB_TokenWrapper resWrap = WB_TokenWrapper.parse(res.getBody());
            Id userId = (Id) resWrap.id.substringAfterLast('/');
            Id orgId = (Id) resWrap.id.substringBetween('id/','/');
            String orgURL = resWrap.instance_url;
            Map<String,String> sessionParams = new Map<String,String>{'access_token' => resWrap.access_token,'refresh_token' => resWrap.refresh_token, 'orgURL' => orgURL, 'userId' => userId, 'orgId' => orgId};  
            createSession(sessionParams);
            response = userId;
        }else{
            WB_LogLevel.logException(new AppException(res.getBody()));
        }
        return response;
    }
    
    public static void createSession(Map<String,String> sessionParams){
        WB_WorkbenchSession__c record = new WB_WorkbenchSession__c ();
        record.WB_AccessToken__c = sessionParams.get('access_token');
        record.WB_RefreshToken__c = sessionParams.get('refresh_token');
        record.WB_DomainURL__c = sessionParams.get('orgURL');
        record.WB_UserId__c = sessionParams.get('userId');
        record.WB_OrganizationId__c = sessionParams.get('orgId');
        Database.insert(record, true);   
    }
    
}