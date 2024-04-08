public class WB_WorkbenchController {
    @AuraEnabled(cacheable=true)
    public static Map<String,Object> getConsumerDetails(){
        WB_WorkbenchSetting__mdt wb = WB_WorkbenchSetting__mdt.getInstance(WB_ServiceAppConstant.WB_SETTING);
        Map<String,Object> response = new Map<String,Object>();
        response.put(WB_ServiceAppConstant.CLIENT_ID,wb.WB_ConsumerKey__c);
        response.put(WB_ServiceAppConstant.CLIENT_SECRET,wb.WB_ConsumerSecret__c);
        return response;
    }
    @AuraEnabled(cacheable=false)
    public static String getAccessToken(String codeValue, String endPointURL){
        String userId = null;
        try{
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.CODE,codeValue);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,endPointURL);
            Type classType = Type.forName('WB_FetchToken');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            userId = (String) request.executeService(instance,params);
            //System.debug('userId==>'+userId); 
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }    
        return userId;
    }
    @AuraEnabled(cacheable=false)
    public static String getAllSObjects(String userId, String apiVersion){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.API_VERSION,apiVersion);
            Type classType = Type.forName('WB_FetchSobjects');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String getAllFields(String userId, String objectName, String apiVersion){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.SOBJECT_NAME,objectName);
            params.put(WB_ServiceAppConstant.API_VERSION,apiVersion);
            Type classType = Type.forName('WB_DescribeSobject');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String getAllRecords(String userId, String queryString, String apiVersion){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.QUERY,queryString);
            params.put(WB_ServiceAppConstant.API_VERSION,apiVersion);
            Type classType = Type.forName('WB_FetchQuery');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String getAllRecordsBatch(String userId, String nextQueryBatch){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.QUERY,nextQueryBatch);
            Type classType = Type.forName('WB_FetchQueryBatch');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String getUserDetails(String userId){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            Type classType = Type.forName('WB_FetchUserInfo');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String revokeAccess(String userId){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            Type classType = Type.forName('WB_RevokeToken');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String getAllListViews(String userId, String objectName, String apiVersion){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.SOBJECT_NAME,objectName);
            params.put(WB_ServiceAppConstant.API_VERSION,apiVersion);
            Type classType = Type.forName('WB_FetchListView');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String getListViewRecords(String userId, String objectName, String viewDeveloperName, String apiVersion){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.SOBJECT_NAME,objectName);
            params.put(WB_ServiceAppConstant.LISTVIEWNAME,viewDeveloperName);
            params.put(WB_ServiceAppConstant.API_VERSION,apiVersion);
            Type classType = Type.forName('WB_FetchListViewRecords');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String getListViewRecordsBatch(String userId, String nextViewBatch){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.LISTVIEWNAME,nextViewBatch);
            Type classType = Type.forName('WB_FetchListViewRecordBatch');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String getMetadataTypes(String userId, String apiVersion){
        List<string> result = null;
        WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
        Map<String,String> params = new Map<String,String>();
        params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
        params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
        params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
        try{           
            result = WB_RetrieveMetaData.describeMetaData(wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
        }catch(CalloutException e){
            if(e.getMessage().contains('INVALID_SESSION_ID')){
                WB_RenewToken renewServ = new WB_RenewToken();
                String newAccessToken = (String) renewServ.executeService(renewServ,params);
                result = WB_RetrieveMetaData.describeMetaData(wbs.WB_DomainURL__c, newAccessToken, apiVersion);
            } 
        }
        result.sort();
 	 	return JSON.serialize(result);	
    }
    @AuraEnabled(cacheable=false)
    public static String getMetadataItems(String userId, String selectedMetadataType, String apiVersion){
        List<string> result = null;
        WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
        Map<String,String> params = new Map<String,String>();
        params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
        params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
        params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
        list<MetadataService.FileProperties> response = new list<MetadataService.FileProperties>();
        try{
            response =  WB_RetrieveMetaData.listMetaDataItem(selectedMetadataType, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
        }catch(CalloutException e){
            if(e.getMessage().contains('INVALID_SESSION_ID')){
                WB_RenewToken renewServ = new WB_RenewToken();
                String newAccessToken = (String) renewServ.executeService(renewServ,params);
                response = WB_RetrieveMetaData.listMetaDataItem(selectedMetadataType, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
            }
        }
        if(response!=null){
            result = new List<string>();
            for(MetadataService.FileProperties fileProperty : response){
                result.add(fileProperty.fullName);
            }   
            result.sort();
        }
        return JSON.serialize(result);
    }
    @AuraEnabled(cacheable=false)
    public static String metadataRetrieveRequest(String userId, String selectedPackageJSON, String apiVersion){
        List<WB_PackageWrapper> packageList = WB_PackageWrapper.parse(selectedPackageJSON);
        Map<String, Set<String>> packageFile = new Map<String, Set<String>>();
        for(WB_PackageWrapper packageWrap : packageList){
            if(packageFile.containsKey(packageWrap.itemType)){
                 packageFile.get(packageWrap.itemType).add(packageWrap.itemName);
            }else{
                packageFile.put(packageWrap.itemType, new Set<String>{packageWrap.itemName});
            }
        }
        WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
        Map<String,String> params = new Map<String,String>();
        params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
        params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
        params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
        MetadataService.AsyncResult response = new MetadataService.AsyncResult();
        try{
            response =  WB_RetrieveMetaData.retrieveMetadataItem(packageFile, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
        }catch(CalloutException e){
            if(e.getMessage().contains('INVALID_SESSION_ID')){
                WB_RenewToken renewServ = new WB_RenewToken();
                String newAccessToken = (String) renewServ.executeService(renewServ,params);
                response = WB_RetrieveMetaData.retrieveMetadataItem(packageFile, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
            }
        }
        return JSON.serialize(response);
    }
    @AuraEnabled(cacheable=false)
    public static String checkAsyncRetrieveRequest(String userId, String retrieveAsyncResultJSON, String apiVersion){
        MetadataService.AsyncResult  retrieveAsyncResult = (MetadataService.AsyncResult) System.JSON.deserialize(retrieveAsyncResultJSON, MetadataService.AsyncResult.class);
        WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
        Map<String,String> params = new Map<String,String>();
        params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
        params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
        params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
        String response = null;
        try{
            response = WB_RetrieveMetaData.checkRetrieveStatus(retrieveAsyncResult, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
        }catch(Exception e){
            if(e.getMessage().contains('INVALID_SESSION_ID')){
                WB_RenewToken renewServ = new WB_RenewToken();
                String newAccessToken = (String) renewServ.executeService(renewServ,params);
                response = WB_RetrieveMetaData.checkRetrieveStatus(retrieveAsyncResult, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
            }
        }                
        return response;  
    }
    @AuraEnabled(cacheable=false)
    public static String metadataDeployRequest(String userId, String metadataZip, String apiVersion, String deployOptionsJson){
        WB_DeployOptionsWrapper deployOptions = WB_DeployOptionsWrapper.parse(deployOptionsJson);
        WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
        Map<String,String> params = new Map<String,String>();
        params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
        params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
        params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
        MetadataService.AsyncResult response = new MetadataService.AsyncResult();
        try{
            response = WB_DeployMetaData.deployZip(metadataZip, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion, deployOptions);
        }catch(CalloutException e){
            if(e.getMessage().contains('INVALID_SESSION_ID')){
                WB_RenewToken renewServ = new WB_RenewToken();
                String newAccessToken = (String) renewServ.executeService(renewServ,params);
                response = WB_DeployMetaData.deployZip(metadataZip, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion, deployOptions);
            }
        }
        return JSON.serialize(response);
    }
    @AuraEnabled(cacheable=false)
    public static String checkAsyncDeployRequest(String userId, String deployAsyncResultJSON, String apiVersion){
        MetadataService.AsyncResult  deployAsyncResult = (MetadataService.AsyncResult) System.JSON.deserialize(deployAsyncResultJSON, MetadataService.AsyncResult.class);
        WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
        Map<String,String> params = new Map<String,String>();
        params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
        params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
        params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
        String response = null;
        try{
            response = WB_DeployMetaData.checkAsyncRequest(deployAsyncResult, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
 		}catch(Exception e){
            if(e.getMessage().contains('INVALID_SESSION_ID')){
                WB_RenewToken renewServ = new WB_RenewToken();
                String newAccessToken = (String) renewServ.executeService(renewServ,params);
                response = WB_DeployMetaData.checkAsyncRequest(deployAsyncResult, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
            }
        }                
        return response;  
    }
    @AuraEnabled(cacheable=false)
    public static String metadataQuickDeployRequest(String userId, String recentValidationId, String apiVersion){
        WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
        Map<String,String> params = new Map<String,String>();
        params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
        params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
        params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
        String response = null;
        try{
            response = WB_DeployMetaData.deployRecentValidationFile(recentValidationId, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
 		}catch(Exception e){
            if(e.getMessage().contains('INVALID_SESSION_ID')){
                WB_RenewToken renewServ = new WB_RenewToken();
                String newAccessToken = (String) renewServ.executeService(renewServ,params);
                response = WB_DeployMetaData.deployRecentValidationFile(recentValidationId, wbs.WB_DomainURL__c, wbs.WB_AccessToken__c, apiVersion);
            }
        }                
        return response;  
    }
    @AuraEnabled(cacheable=false)
    public static String createRecordRequest(String userId, String apiVersion, String jsonRequestBody){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.API_VERSION,apiVersion);
            params.put(WB_ServiceAppConstant.REQUESTBODY,jsonRequestBody);
            Type classType = Type.forName('WB_CreateRecords');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String updateRecordRequest(String userId, String apiVersion, String jsonRequestBody){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.API_VERSION,apiVersion);
            params.put(WB_ServiceAppConstant.REQUESTBODY,jsonRequestBody);
            Type classType = Type.forName('WB_UpdateRequest');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String deleteRecordRequest(String userId, String apiVersion, String jsonRequestBody){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.API_VERSION,apiVersion);
            params.put(WB_ServiceAppConstant.REQUESTBODY,jsonRequestBody);
            Type classType = Type.forName('WB_DeleteRequest');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String retrieveAllDeploymentStatus(String userId, String apiVersion){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.API_VERSION,apiVersion);
            String query = 'SELECT+Id,+Type,+CheckOnly,+Status,+StartDate,+CompletedDate,+CreatedBy.Name+FROM+DeployRequest+ORDER+BY+CompletedDate+DESC';
            params.put(WB_ServiceAppConstant.QUERY,query);
            Type classType = Type.forName('WB_DeploymentStatus');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
    @AuraEnabled(cacheable=false)
    public static String retrieveDeploymentDetails(String userId, String apiVersion, String deployRequestId){
        String result = null;
        try{
            WB_WorkbenchSession__c wbs = [SELECT WB_AccessToken__c, WB_RefreshToken__c, WB_DomainURL__c FROM WB_WorkbenchSession__c WHERE WB_UserId__c = :userId LIMIT 1];
            Map<String,String> params = new Map<String,String>();
            params.put(WB_ServiceAppConstant.ACCESS_TOKEN,wbs.WB_AccessToken__c);
            params.put(WB_ServiceAppConstant.REFRESH_TOKEN,wbs.WB_RefreshToken__c);
            params.put(WB_ServiceAppConstant.ENDPOINT_URL,wbs.WB_DomainURL__c);
            params.put(WB_ServiceAppConstant.API_VERSION,apiVersion);
            params.put(WB_ServiceAppConstant.REQUESTBODY,deployRequestId);
            Type classType = Type.forName('WB_DeploymentDetails');
            Object instance = classType.newInstance();
            WB_ServiceRequest request = (WB_ServiceRequest)instance;
            result = (String) request.executeService(instance,params);            
        }catch(Exception ex){
            WB_LogLevel.logException(ex);
            new AuraHandledException(ex.getMessage());
        }
        return result;
    }
}