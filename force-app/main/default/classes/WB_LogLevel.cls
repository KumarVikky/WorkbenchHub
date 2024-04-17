public class WB_LogLevel {
    public static void logException(Exception ex){
        logException(ex, '');
    }
    public static void logException(Exception ex, String relatedToId){
        try{
            String stackTrace = ex.getStackTraceString().substringBefore('\n');
            String className = stackTrace.substringAfter('.').substringBefore('.');	
            String methodName = stackTrace.substringBefore(':').substringAfter(className).substringAfter('.');
                    
            String QueryLimit = '1. SOQL Queries used / SOQL Queries allowed: ' + Limits.getQueries() + '/' + Limits.getLimitQueries();
            String DMLimit = '2. Number of records queried so far /  Number allowed: ' + Limits.getDmlRows() + '/' + Limits.getLimitDmlRows();
            String DMLStat = '3. Number of DML statements used so far / Number allowed: ' +  Limits.getDmlStatements() + '/' + Limits.getLimitDmlStatements();   
            String CPUT = '4. Amount of CPU time (in ms) used so far / CPU usage time (in ms) allowed: ' + Limits.getCpuTime() + '/' + Limits.getLimitCpuTime();

            WB_WorkbenchHubLog__c log = new WB_WorkbenchHubLog__c();
            log.WB_ClassName__c = className;
            log.WB_MethodName__c = methodName;
            log.WB_LoggedBy__c = UserInfo.getUserId();
            log.WB_ErrorMessage__c = ex.getMessage();
            log.WB_ExceptionType__c = ex.getTypeName();
            log.WB_GovtLimit__c = String.format('{0}\n{1}\n{2}\n{3}',new List<string>{QueryLimit, DMLimit,DMLStat,CPUT});
            log.WB_RelatedToNumber__c = relatedToId;
            log.WB_StackTrace__c = ex.getStackTraceString();
            log.WB_LineNumber__c = ex.getLineNumber();
            Database.insert(log);
        }catch(Exception exc){
			System.debug('Exception occurred: '+ exc.getMessage());
        } 
    }
}