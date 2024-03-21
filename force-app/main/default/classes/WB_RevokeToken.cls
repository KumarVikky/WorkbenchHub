public class WB_RevokeToken extends WB_ServiceAdapter implements WB_ServiceRequest{
    public virtual class BaseException extends Exception {}
    public class AppException extends BaseException {}
    
    private String endPointUrl;    
    private String refreshToken;
    
    protected override String setHttpMethod(){
        return 'POST';
    }
    protected override String setEndPointURL(){
        return this.endPointURL+'/services/oauth2/revoke?token='+refreshToken;
    }
    protected override String setRequestBody(){
        return null;
    }
    protected override Map<String,String> setHttpHeader(){
        return null;
    }
    protected override Integer setHttpTimeOut(){
        return 120000; 
    }
    
    public Object executeService(Object instance, Map<String,String> params){
        WB_RevokeToken service = (WB_RevokeToken)instance;
        service.refreshToken = params.get(WB_ServiceAppConstant.REFRESH_TOKEN);
        service.endPointURL = params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        Object response = null;
        if(res.getstatusCode() == 200){
            //System.debug('WB_RevokeToken=>'+res.getBody());
            response = 'Success';
        }else{
            response = 'Error';
            WB_LogLevel.logException(new AppException(res.getBody()));
        }
        return response;
    }
}