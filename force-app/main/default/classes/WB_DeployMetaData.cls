public class WB_DeployMetaData {
    public static MetadataService.AsyncResult deployZip(String ZipData,String endPoint, String sessionId, String apiVersion, WB_DeployOptionsWrapper optionsWrap){			
        MetadataService.MetadataPort service = createService(endPoint,sessionId, apiVersion);
        MetadataService.DeployOptions deployOptions = new MetadataService.DeployOptions();
        deployOptions.allowMissingFiles = false;
        deployOptions.autoUpdatePackage = false;
        deployOptions.checkOnly = optionsWrap.checkOnly;
        deployOptions.ignoreWarnings = optionsWrap.ignoreWarnings;
        deployOptions.performRetrieve = false;
        deployOptions.purgeOnDelete = false;
        deployOptions.rollbackOnError = optionsWrap.rollbackOnError;
        deployOptions.testLevel = optionsWrap.testLevel;
        deployOptions.singlePackage = optionsWrap.singlePackage;
        if(deployOptions.testLevel == 'RunSpecifiedTests'){
            String[] specifiedTests = optionsWrap.runTests.split(',');
            deployOptions.runTests = specifiedTests;
        }
        return service.deploy(ZipData, DeployOptions);
    }
    public static string checkAsyncRequest(MetadataService.AsyncResult result,String endPoint, String sessionId, String apiVersion){	
        string response = '';
        MetadataService.MetadataPort service = createService(endPoint,sessionId, apiVersion);
        MetadataService.DeployResult deployResult = service.checkDeployStatus(result.Id, true);
        if(deployResult.done){
            if(deployResult.details !=null && deployResult.details.componentFailures !=null){
                for(MetadataService.DeployMessage deployMessage : deployResult.details.componentFailures){
                    if(deployMessage.problem !=null){
                        response =  response+deployMessage.fileName+ '(Line: ' + deployMessage.lineNumber + ': Column:' + deployMessage.columnNumber + ') : ' + deployMessage.problem;
                    }
                }
            }
            if(response == ''){
                response = JSON.serialize(deployResult);
            }
        }
        return response;
    }
    public static String deployRecentValidationFile(String validationId, String endPoint, String sessionId, String apiVersion){
        MetadataService.MetadataPort service = createService(endPoint,sessionId, apiVersion);
        String quickDeployResponse = service.deployRecentValidation(validationId);
        return quickDeployResponse;
    }
    private static MetadataService.MetadataPort createService(string endPoint, string sessionId, String apiVersion){ 
        Double METADATA_API_VERSION = Double.valueOf(apiVersion);
        MetadataService.MetadataPort service = new MetadataService.MetadataPort();
        service.endpoint_x = endPoint+'/services/Soap/m/'+METADATA_API_VERSION;
        service.SessionHeader = new MetadataService.SessionHeader_element();
        if(sessionId != null)
            service.SessionHeader.sessionId = sessionId;
        return service;		
    }
}