public class WB_FetchDebugLog extends WB_ServiceAdapter implements WB_ServiceRequest{
	private String endPointUrl;
    private String accessToken;
    private String apiVersion;
    private String userId;
    
    protected override String setHttpMethod(){
        return 'POST';
    }
    protected override String setEndPointURL(){
        return this.endPointURL+'/services/data/v'+this.apiVersion+'/composite';
    }
    protected override String setRequestBody(){
        String requestType ='API';
        String location = 'Monitoring';
        CompositeSubRequest queryLog = new CompositeSubRequest();
        queryLog.method = 'GET';
        queryLog.url = '/services/data/v'+this.apiVersion+'/query/?q=SELECT+Id,+Request,+Operation,+Status,+DurationMilliseconds,+LogLength,+StartTime+FROM+ApexLog+WHERE+Location+=+\''+location+ '\'+AND+Request+=+\''+requestType+'\'+AND+LogUserId+=+\''+userId+'\'+ORDER+BY+StartTime+DESC+LIMIT+10';
        queryLog.referenceId = 'refApexLog';
        queryLog.body = null;
        queryLog.httpHeaders = null;
        CompositeRequest request = new CompositeRequest();
        request.compositeRequest = new List<CompositeSubRequest>{queryLog};
        return JSON.serialize(request);
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
        WB_FetchDebugLog service = (WB_FetchDebugLog)instance;
        service.accessToken = params.get(WB_ServiceAppConstant.ACCESS_TOKEN);
        service.endPointURL = params.get(WB_ServiceAppConstant.ENDPOINT_URL);
        service.apiVersion = params.get(WB_ServiceAppConstant.API_VERSION);
        service.userId = params.get(WB_ServiceAppConstant.REQUESTBODY);
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
    
    public class CompositeRequest{
        public CompositeSubRequest[] compositeRequest;
    }
    public class CompositeSubRequest{
        public String method;
        public String url;
        public Map<String,String> httpHeaders;
        public String referenceId;
        public Object body;
    }
}