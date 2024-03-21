public class WB_FetchQueryBatch extends WB_ServiceAdapter implements WB_ServiceRequest {
    public virtual class BaseException extends Exception {}
    public class AppException extends BaseException {}
    
    private String endPointUrl;
    private String nextQueryBatchUrl;
    private String accessToken;
    
    protected override String setHttpMethod(){
        return 'GET';
    }
    protected override String setEndPointURL(){
        return this.endPointURL + this.nextQueryBatchUrl;
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
        WB_FetchQueryBatch service = (WB_FetchQueryBatch)instance;
        service.accessToken = params.get(WB_ServiceAppConstant.ACCESS_TOKEN);
        service.endPointURL = params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        service.nextQueryBatchUrl = params.get(WB_ServiceAppConstant.QUERY);
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        if(res.getStatusCode() == WB_ServiceAppConstant.STATUS_OK){
            //System.debug('WB_FetchQueryBatchInitial=>'+res.getBody());
            if(res.getBody().contains('Session expired')){
                WB_RenewToken renewServ = new WB_RenewToken();
                String newAccessToken = (String) renewServ.executeService(renewServ,params);
                String authorizationHeader = 'Bearer ' + newAccessToken;
                req.setHeader('Authorization',authorizationHeader);
                res = service.getResponse(req);
            }
            //System.debug('WB_FetchQueryBatchFinal=>'+res.getBody());
        }else{
            WB_LogLevel.logException(new AppException(res.getBody()));
        }
        return res.getBody();
    }
}