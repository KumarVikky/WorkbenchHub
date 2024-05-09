public class WB_SalesforceMaintenance extends WB_ServiceAdapter implements WB_ServiceRequest{
    private String endPointUrl;
   
    protected override String setHttpMethod(){
        return 'GET';
    }
    protected override String setEndPointURL(){
        return this.endPointUrl;
    }
    protected override String setRequestBody(){
        return null;
    }
    protected override Map<String,String> setHttpHeader(){
        Map<String,String> headerValues = new Map<String,String>();           
        headerValues.put('Accept', '*/*');
        headerValues.put('Content-Type', 'application/json');
        return headerValues;
    }
    protected override Integer setHttpTimeOut(){
        return 120000; 
    }
    
    public Object executeService(Object instance, Map<String,String> params){
        WB_SalesforceMaintenance service = (WB_SalesforceMaintenance)instance;
        service.endPointURL = 'https://api.status.salesforce.com/v1/instances/AP59/status?childProducts=false';
        HttpRequest req = service.getRequest();
        HttpResponse res = service.getResponse(req);
        return res.getBody();
    }
}