public class WB_PackageWrapper {
    public String itemName;
    public String itemType;
    
    public static List<WB_PackageWrapper> parse(String json){
        return (List<WB_PackageWrapper>) System.JSON.deserialize(json, List<WB_PackageWrapper>.class);
    }
}