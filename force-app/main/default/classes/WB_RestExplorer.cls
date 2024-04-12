public class WB_RestExplorer extends WB_ServiceAdapter implements WB_ServiceRequest{
	private WB_RestRequestWrapper restParams;
    private String currentAccessToken;
    
    
    protected override String setHttpMethod(){
        return restParams.httpMethod;
    }
    protected override String setEndPointURL(){
        return restParams.endPointURL;
    }
    protected override String setRequestBody(){
       return restParams.requestBody;
    }
    protected override Map<String,String> setHttpHeader(){
        List<WB_RestRequestWrapper.RestHeader> restHeaders = restParams.restHeaders;
        Map<String,String> headerValues = new Map<String,String>();
        for(WB_RestRequestWrapper.RestHeader header :restHeaders){
            if(header.key.contains('Authorization') && header.value.contains('{CurrentUserToken}')){
                String value = header.value.replace('{CurrentUserToken}',this.currentAccessToken);
                headerValues.put(header.key, value); 
            }else{
                headerValues.put(header.key, header.value); 
            }  
        }
        return headerValues;
    }
    protected override Integer setHttpTimeOut(){
        return 120000; 
    }
    
    public Object executeService(Object instance, Map<String,String> params){
        String json = params.get(WB_ServiceAppConstant.REQUESTBODY);
        WB_RestRequestWrapper restParams = WB_RestRequestWrapper.parse(json);
        WB_RestExplorer service = (WB_RestExplorer)instance;
        service.restParams = restParams;
        service.currentAccessToken = params.get(WB_ServiceAppConstant.ACCESS_TOKEN);
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        if(res.getBody().contains('Session expired')){
            WB_RenewToken renewServ = new WB_RenewToken();
            String newAccessToken = (String) renewServ.executeService(renewServ,params);
            String authorizationHeader = 'Bearer ' + newAccessToken;
            req.setHeader('Authorization', authorizationHeader);
            res = service.getResponse(req);
        }
        WB_RestResponseWrapper resWrap = new WB_RestResponseWrapper();
        resWrap.statusCode = res.getStatusCode();
        resWrap.status = res.getStatus();
        resWrap.body = res.getBody();
        return resWrap;
    }
}