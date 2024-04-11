public class WB_AnonymousService{
    public static ApexService.ExecuteAnonymousResult executeCode(String codeSnippet, String endPoint, String sessionId, String apiVersion){
        ApexService.Apex service = createService(endPoint,sessionId, apiVersion);
        service.DebuggingHeader = new ApexService.DebuggingHeader_element();
        service.DebuggingHeader.debugLevel = 'DETAIL';        
        service.DebuggingHeader.categories = new ApexService.LogInfo[0];
        service.DebuggingHeader.categories.add(new ApexService.LogInfo());
        service.DebuggingHeader.categories[0].category = 'Apex_code';
        service.DebuggingHeader.categories[0].level = 'FINEST';
        ApexService.ExecuteAnonymousResult result = service.executeAnonymous(codeSnippet);
        return result;
    }
    private static ApexService.Apex createService(string endPoint, string sessionId, String apiVersion){ 
        Double METADATA_API_VERSION = Double.valueOf(apiVersion);
        ApexService.Apex service = new ApexService.Apex();
        service.endpoint_x = endPoint+'/services/Soap/s/'+METADATA_API_VERSION;
        service.SessionHeader = new ApexService.SessionHeader_element();
        if(sessionId != null){
            service.SessionHeader.sessionId = sessionId;
        }
        return service;		
    }
}