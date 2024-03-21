public class WB_AsynResultWrapper {
    public Boolean done;
    public String id;
    public String message;
    public String state;
    public String statusCode;
    
    public static WB_AsynResultWrapper parse(String json){
        return (WB_AsynResultWrapper) System.JSON.deserialize(json, WB_AsynResultWrapper.class);
    }
}