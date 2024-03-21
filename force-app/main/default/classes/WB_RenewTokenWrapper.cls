public class WB_RenewTokenWrapper{
    public String access_token;
    public String signature;
    public String scope;
    public String instance_url;
    public String id;
    public String token_type;
    public String issued_at;
    public static WB_RenewTokenWrapper parse(String json){
        return (WB_RenewTokenWrapper) System.JSON.deserialize(json, WB_RenewTokenWrapper.class);
    }
}