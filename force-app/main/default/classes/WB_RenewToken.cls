public class WB_RenewToken extends WB_ServiceAdapter implements WB_ServiceRequest{
    public virtual class BaseException extends Exception {}
    public class AppException extends BaseException {}
    
    private String clientId;
    private String clientSecret;
    private String refreshToken;
    private String endPointURL;
    
    protected override String setHttpMethod(){
        return 'POST';
    }
    protected override String setEndPointURL(){
        return this.endPointURL+'/services/oauth2/token';
    }
    protected override String setRequestBody(){
        String REQUEST_BODY = 'grant_type=refresh_token&client_id={0}&client_secret={1}&refresh_token={2}';
        return String.format(REQUEST_BODY ,new string[]{this.clientId,this.clientSecret,this.refreshToken});
    }
    protected override Map<String,String> setHttpHeader(){
        Map<String,String> headerValues = new Map<String,String>();
        headerValues.put('Authorization', 'Basic');            
        return headerValues;
    }
    protected override Integer setHttpTimeOut(){
        return 120000; 
    }
    
    public Object executeService(Object instance, Map<String,String> params){
        WB_WorkbenchSetting__mdt wb = WB_WorkbenchSetting__mdt.getInstance(WB_ServiceAppConstant.WB_SETTING);
        WB_RenewToken service = (WB_RenewToken)instance;
        service.clientId = wb.WB_ConsumerKey__c;
        service.clientSecret = wb.WB_ConsumerSecret__c;
        service.refreshToken = params.get(WB_ServiceAppConstant.REFRESH_TOKEN);
        service.endPointURL = params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        Object response = null;
        if(res.getStatusCode() == WB_ServiceAppConstant.STATUS_OK){
            WB_RenewTokenWrapper resWrap = WB_RenewTokenWrapper.parse(res.getBody());
            Id userId = (Id) resWrap.id.substringAfterLast('/');
            Id orgId = (Id) resWrap.id.substringBetween('id/','/');
            WB_WorkbenchSession__c record = new WB_WorkbenchSession__c ();
            record.WB_AccessToken__c = resWrap.access_token;
            record.WB_DomainURL__c = resWrap.instance_url;
            record.WB_UserId__c = userId;
            record.WB_OrganizationId__c = orgId;
            insert record;
            response = resWrap.access_token;
        }else{
            WB_LogLevel.logException(new AppException(res.getBody()));
        }
        return response;
    }
}