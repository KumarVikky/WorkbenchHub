public class WB_OAuthWrapper {
    public String id;
    public String issued_at;
    public String instance_url;
    public String signature;
    public String access_token;    
    
    public static WB_OAuthWrapper parse(String json){
        return (WB_OAuthWrapper) System.JSON.deserialize(json, WB_OAuthWrapper.class);
    }
}