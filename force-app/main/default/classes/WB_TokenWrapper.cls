public class WB_TokenWrapper {
    public String access_token;
    public String refresh_token;
    public String signature;
    public String scope;
    public String id_token;
    public String instance_url;
    public String id;
    public String token_type;
    public String issued_at;
   
    public static WB_TokenWrapper parse(String json){
        return (WB_TokenWrapper) System.JSON.deserialize(json, WB_TokenWrapper.class);
    }
}