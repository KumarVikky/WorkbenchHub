public class WB_RemoteSiteSettingManager {
    public static Boolean createRemoteSiteSettings(String siteName, String siteUrl){
        Boolean isSucessfull=false;
        Map<String,String> RemoteSiteMap = new Map<String,String>();
        RemoteSiteMap.put(siteName,siteUrl);
        List<MetadataService.Metadata> allMetadataList = new List<MetadataService.Metadata>();
        for(string siteVal: RemoteSiteMap.keyset()){
            MetadataService.RemoteSiteSetting remoteSiteDetails = new MetadataService.RemoteSiteSetting();
            remoteSiteDetails.fullName = siteVal;
            remoteSiteDetails.description = siteVal;
            remoteSiteDetails.disableProtocolSecurity  = false;
            remoteSiteDetails.isActive  = true;
            remoteSiteDetails.url=RemoteSiteMap.get(siteVal);
            allMetadataList.add(remoteSiteDetails);
        }        
        if(allMetadataList.size()>0){
            MetadataService.MetadataPort service = createService();
            List<MetadataService.UpsertResult> results = service.upsertMetadata(allMetadataList);
            for(MetadataService.UpsertResult result: results){
                if(result.success){
                    system.debug('Success : Added remote site setting : '+result);
                    isSucessfull=true;
                }else{
                    system.debug('Error : While adding remote site settings : '+result.errors[0].message);
                }   
            } 
        }
        return isSucessfull;
    }   
    private static MetadataService.MetadataPort createService(){
        WB_SelfTokenRequest ser = new WB_SelfTokenRequest();
        String sessionId = (String) ser.executeService(ser, null);
        MetadataService.MetadataPort service = new MetadataService.MetadataPort();
        service.SessionHeader = new MetadataService.SessionHeader_element();
        service.SessionHeader.sessionId = sessionId;
        return service;     
    } 
}