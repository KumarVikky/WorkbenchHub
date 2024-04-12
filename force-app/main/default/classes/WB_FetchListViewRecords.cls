public class WB_FetchListViewRecords extends WB_ServiceAdapter implements WB_ServiceRequest {
    public virtual class BaseException extends Exception {}
    public class AppException extends BaseException {}
    
    private String endPointUrl;
    private String sObjectName;
    private String viewDeveloperName;
    private String accessToken;
    private String apiVersion;
    
    protected override String setHttpMethod(){
        return 'GET';
    }
    protected override String setEndPointURL(){
        return this.endPointURL + '/services/data/v'+apiVersion+'/ui-api/list-records/' + this.sObjectName + '/' + this.viewDeveloperName + '?pageSize=1000&pageToken=0';
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
        WB_FetchListViewRecords service = (WB_FetchListViewRecords)instance;
        service.accessToken = params.get(WB_ServiceAppConstant.ACCESS_TOKEN);
        service.endPointURL = params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        service.sObjectName = params.get(WB_ServiceAppConstant.SOBJECT_NAME);
        service.viewDeveloperName = params.get(WB_ServiceAppConstant.LISTVIEWNAME);
        service.apiVersion = params.get(WB_ServiceAppConstant.API_VERSION);
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