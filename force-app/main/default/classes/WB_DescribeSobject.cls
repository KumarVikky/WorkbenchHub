public class WB_DescribeSobject extends WB_ServiceAdapter implements WB_ServiceRequest{
    private String endPointUrl;
    private String sObjectName;
    private String accessToken;
    private String apiVersion;
    
    protected override String setHttpMethod(){
        return 'GET';
    }
    protected override String setEndPointURL(){
        return this.endPointURL+'/services/data/v'+apiVersion+'/sobjects/'+sObjectName+'/describe/';
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
        WB_DescribeSobject service = (WB_DescribeSobject)instance;
        service.accessToken = params.get(WB_ServiceAppConstant.ACCESS_TOKEN);
        service.endPointURL = params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        service.sObjectName = params.get(WB_ServiceAppConstant.SOBJECT_NAME);
        service.apiVersion = params.get(WB_ServiceAppConstant.API_VERSION);
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        System.debug('WB_DescribeSobjectInitial=>'+res.getBody());
        if(res.getBody().contains('Session expired')){
            WB_RenewToken renewServ = new WB_RenewToken();
            String newAccessToken = (String) renewServ.executeService(renewServ,params);
            String authorizationHeader = 'Bearer ' + newAccessToken;
            req.setHeader('Authorization',authorizationHeader);
            res = service.getResponse(req);
        }
        System.debug('WB_DescribeSobjectFinal=>'+res.getBody());
        return res.getBody();
    }
}