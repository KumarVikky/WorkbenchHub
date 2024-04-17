public abstract class WB_ServiceAdapter{
    protected abstract String setHttpMethod();
    protected abstract String setEndPointURL();
    protected abstract String setRequestBody();
    protected abstract Map<String,String> setHttpHeader();
    protected abstract Integer setHttpTimeOut();
    
    protected HttpRequest getRequest(){
        HttpRequest req = new HttpRequest();
        req.setEndpoint(this.setEndPointURL());
        req.setMethod(this.setHttpMethod());
        req.setTimeout(this.setHttpTimeOut());
        if(this.setHttpHeader()?.size() > 0){
            Map<String,String> headerValues = this.setHttpHeader();
            for(String header : headerValues.keySet()){
                req.setHeader(header, headerValues.get(header));
            }
        }
        if(this.setRequestBody()?.length() > 0){
            req.setBody(this.setRequestBody());
        }
        return req;
    }
    protected HttpResponse getResponse(HttpRequest req){
        Http http = new Http();
        HttpResponse res = new HttpResponse(); 
        try{
            res = http.send(req);
        }catch(CalloutException ex){
            res.setStatusCode(500);
            res.setStatus('server_error');
            res.setBody(ex.getMessage());
            WB_LogLevel.logException(ex);
        }
        return res;
    }
}