public class WB_EncryptAndDecryptHelper {
    private Blob cryptoKey; 
    private String crypAlgorithm; 
    
    public WB_EncryptAndDecryptHelper(){
       WB_WorkbenchHubSetting__mdt wb = WB_WorkbenchHubSetting__mdt.getInstance(WB_ServiceAppConstant.WB_SETTING);
       cryptoKey = Crypto.generateAesKey(Integer.valueOf(wb.WB_CryptoKey__c));
       crypAlgorithm = wb.WB_CryptoAlgorithm__c; 
    }
    
    public String processEncryption(string jsonData){  
        Blob blobData = Blob.valueOf(jsonData); 
        Blob encryptedData = Crypto.encryptWithManagedIV(crypAlgorithm, cryptoKey, blobData); 
        string b64Data = EncodingUtil.base64Encode (encryptedData);  
        return b64Data;
    } 
    public String processDecryption(string encryptedData){ 
        String decryptedData = null; 
        Blob blobData = EncodingUtil.base64Decode(encryptedData); 
        Blob privateKey = EncodingUtil.base64Decode(EncodingUtil.base64Encode(cryptoKey));  
        try{ 
            Blob dataToDecrypt = Crypto.decryptWithManagedIV(crypAlgorithm, privateKey, blobData); 
            decryptedData = dataToDecrypt.toString(); 
        } 
        catch(Exception ex){ 
           WB_LogLevel.logException(ex); 
        } 
        return decryptedData;  
    } 
}