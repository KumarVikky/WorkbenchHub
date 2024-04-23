public class WB_FetchQuery extends WB_ServiceAdapter implements WB_ServiceRequest{
    private String endPointUrl;
    private String query;
    private String accessToken;
    private String apiVersion;
    
    protected override String setHttpMethod(){
        return 'GET';
    }
    protected override String setEndPointURL(){
        return this.endPointURL+'/services/data/v'+this.apiVersion+'/query/?q='+this.query;
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
        WB_FetchQuery service = (WB_FetchQuery)instance;
        service.accessToken = params.get(WB_ServiceAppConstant.ACCESS_TOKEN);
        service.endPointURL = params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        service.query = params.get(WB_ServiceAppConstant.QUERY);
        service.apiVersion = params.get(WB_ServiceAppConstant.API_VERSION);
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        if(res.getBody().contains('Session expired')){
            WB_RenewToken renewServ = new WB_RenewToken();
            String newAccessToken = (String) renewServ.executeService(renewServ,params);
            String authorizationHeader = 'Bearer ' + newAccessToken;
            req.setHeader('Authorization',authorizationHeader);
            res = service.getResponse(req);
        }
        return res.getBody();
    }
}