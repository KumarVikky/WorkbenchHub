public class WB_RestRequestWrapper{
	public String httpMethod;
    public String endPointURL;
    public List<RestHeader> restHeaders;
    public String requestBody;
    
    public class RestHeader{
        public String key;
        public String value;
    }
    
    public static WB_RestRequestWrapper parse(String json){
        return (WB_RestRequestWrapper) System.JSON.deserialize(json, WB_RestRequestWrapper.class);
    }
}