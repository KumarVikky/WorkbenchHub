public class WB_RevokeToken extends WB_ServiceAdapter implements WB_ServiceRequest{
    private String endPointUrl;    
    private String refreshToken;
    private String redirectURL;    
    
    protected override String setHttpMethod(){
        return 'POST';
    }
    protected override String setEndPointURL(){
        return this.endPointURL + '/services/oauth2/revoke';
    }
    protected override String setRequestBody(){
        return 'token=' + EncodingUtil.urlencode(this.refreshToken, 'UTF-8');
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
        WB_RevokeToken service = (WB_RevokeToken)instance;
        service.refreshToken = params.get(WB_ServiceAppConstant.REFRESH_TOKEN);
        service.endPointURL = params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        service.redirectURL = wb.WB_RedirectURL__c;
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        Object response = null;
        if(res.getstatusCode() == WB_ServiceAppConstant.STATUS_OK){
            response = 'Success';
        }else{
            response = 'Error';
        }
        return response;
    }
}