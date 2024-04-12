public class WB_RestResponseWrapper {
    public String status;
    public Integer statusCode;
    public Object body;
    
    public static WB_RestResponseWrapper parse(String json){
        return (WB_RestResponseWrapper) System.JSON.deserialize(json, WB_RestResponseWrapper.class);
    }
}