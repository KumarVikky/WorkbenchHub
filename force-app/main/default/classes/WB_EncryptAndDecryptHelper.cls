public class WB_EncryptAndDecryptHelper {
    private Blob cryptoKey; 
    private String crypAlgorithm; 
    
    public WB_EncryptAndDecryptHelper(){
        cryptoKey = Crypto.generateAesKey(128);
        crypAlgorithm = 'AES128'; 
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
        catch(Exception e){ 
           System.debug('error=>'+e.getMessage());  
        } 
        return decryptedData;  
    } 
}