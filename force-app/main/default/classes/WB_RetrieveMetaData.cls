public class WB_RetrieveMetaData {
    public static list<string> describeMetaData(String endPoint, String sessionId, String apiVersion){
        Double METADATA_API_VERSION = Double.valueOf(apiVersion);
        MetadataService.MetadataPort service = createService(endPoint,sessionId,apiVersion);
        MetadataService.DescribeMetadataResult describeResult = service.describeMetadata(METADATA_API_VERSION);
        List<String> metadataTypeNames = new List<String>();
        if(describeResult != null){
            for(MetadataService.DescribeMetadataObject metadataObject : describeResult.metadataObjects){
                metadataTypeNames.add(metadataObject.xmlName);
                if(metadataObject.childXmlNames != null)
                    for(String childXmlName : metadataObject.childXmlNames){
                        if(childXmlName != null)
                            metadataTypeNames.add(childXmlName);
                    }
            }
            metadataTypeNames.sort();
        }
        return metadataTypeNames;
    }
    public static list<MetadataService.FileProperties> listMetaDataItem(string selectedMetaDataType,string endPoint, string sessionId, String apiVersion){
        Double METADATA_API_VERSION = Double.valueOf(apiVersion);
        MetadataService.MetadataPort service = createService(endPoint,sessionId,apiVersion);
        List<MetadataService.ListMetadataQuery> queries = new List<MetadataService.ListMetadataQuery>();		
        MetadataService.ListMetadataQuery queryLayout = new MetadataService.ListMetadataQuery();
        queryLayout.type_x = selectedMetaDataType;
        queries.add(queryLayout);
        MetadataService.FileProperties[] fileProperties = service.listMetadata(queries, METADATA_API_VERSION);
        return fileProperties;
    }
    public static MetadataService.AsyncResult retrieveMetadataItem(Map<string,Set<string>> packageFile,string endPoint,string sessionId, String apiVersion){
        Double METADATA_API_VERSION = Double.valueOf(apiVersion);
        MetadataService.MetadataPort service = createService(endPoint,sessionId,apiVersion);				
        MetadataService.RetrieveRequest retrieveRequest = new MetadataService.RetrieveRequest();
        retrieveRequest.apiVersion = METADATA_API_VERSION;
        retrieveRequest.packageNames = null;
        retrieveRequest.singlePackage = true;
        retrieveRequest.specificFiles = null;
        retrieveRequest.unpackaged = new MetadataService.Package_x();
        retrieveRequest.unpackaged.types = new List<MetadataService.PackageTypeMembers>();
        for(string packageReq : packageFile.keySet()){
            MetadataService.PackageTypeMembers packageType = new MetadataService.PackageTypeMembers();
            packageType.name = packageReq;
            packageType.members = new List<string>(packageFile.get(packageReq));
            retrieveRequest.unpackaged.types.add(packageType);
        }    
        return service.retrieve(retrieveRequest);
    }
    public static string checkRetrieveStatus(MetadataService.AsyncResult result,string endPoint,string sessionId, String apiVersion){
        String response = '';
        MetadataService.MetadataPort service = createService(endPoint,sessionId,apiVersion);
        MetadataService.RetrieveResult retrieveResult = service.checkRetrieveStatus(result.Id, true);
        if(retrieveResult.done){
            if(retrieveResult.status != 'Succeeded'){
                response = retrieveResult.errorMessage;				
            }else{
                response = retrieveResult.zipFile;
            }
        }	
        return response;
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