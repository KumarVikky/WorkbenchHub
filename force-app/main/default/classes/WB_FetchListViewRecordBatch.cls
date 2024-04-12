public class WB_FetchListViewRecordBatch extends WB_ServiceAdapter implements WB_ServiceRequest {
	public virtual class BaseException extends Exception {}
    public class AppException extends BaseException {}
    
    private String endPointUrl;
    private String nextViewBatchUrl;
    private String accessToken;
    
    protected override String setHttpMethod(){
        return 'GET';
    }
    protected override String setEndPointURL(){
        return this.endPointURL + this.nextViewBatchUrl;
    }
    protected override String setRequestBody(){
        return null;
    }
    protected override Map<String,String> setHttpHeader(){
        Map<String,String> headerValues = new Map<String,String>();
        String authorizationHeader = 'Bearer ' + this.accessToken;
        headerValues.put('Authorization', authorizationHeader);            
        headerValues.put('Accept', '*/*');
        headerValues.put('Content-Type', 'application/json');
        return headerValues;
    }
    protected override Integer setHttpTimeOut(){
        return 120000; 
    }
    
    public Object executeService(Object instance, Map<String,String> params){
        WB_FetchListViewRecordBatch service = (WB_FetchListViewRecordBatch)instance;
        service.accessToken = params.get(WB_ServiceAppConstant.ACCESS_TOKEN);
        service.endPointURL = params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        service.nextViewBatchUrl = params.get(WB_ServiceAppConstant.LISTVIEWNAME);
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        if(res.getStatusCode() == WB_ServiceAppConstant.STATUS_OK){
            if(res.getBody().contains('Session expired')){
                WB_RenewToken renewServ = new WB_RenewToken();
                String newAccessToken = (String) renewServ.executeService(renewServ,params);
                String authorizationHeader = 'Bearer ' + newAccessToken;
                req.setHeader('Authorization',authorizationHeader);
                res = service.getResponse(req);
            }
        }else{
            WB_LogLevel.logException(new AppException(res.getBody()));
        }
        return res.getBody();
    }
}