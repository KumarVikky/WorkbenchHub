public class WB_DeployOptionsWrapper {
    public Boolean checkOnly;
    public Boolean ignoreWarnings;
    public Boolean rollbackOnError;
    public Boolean singlePackage;
    public String testLevel;
    public String runTests;
    
    public static WB_DeployOptionsWrapper parse(String json){
        return (WB_DeployOptionsWrapper) System.JSON.deserialize(json, WB_DeployOptionsWrapper.class);
    }
}