import { LightningElement, api, track } from 'lwc';
import executeAnonymous from '@salesforce/apex/WB_WorkbenchHubController.executeAnonymous';
import setTraceFlag from '@salesforce/apex/WB_WorkbenchHubController.setTraceFlag';
import retrieveDebugLevels from '@salesforce/apex/WB_WorkbenchHubController.retrieveDebugLevels';
import retrieveDebugLog from '@salesforce/apex/WB_WorkbenchHubController.retrieveDebugLog';
import viewLogModal from 'c/wb_ViewLog';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const columnData = [{type: "button", label: 'Action', initialWidth: 80, typeAttributes: {label: 'View',name: 'View',title: 'View',disabled: false,value: 'View',variant: 'base'}},
                    {label: 'Id', fieldName: 'Id', type: 'text', editable: false},
                    {label: 'Request Type', fieldName: 'Request', type: 'text', editable: false},
                    {label: 'Operation', fieldName: 'Operation', type: 'text', editable: false},
                    {label: 'Status', fieldName: 'Status', type: 'text', editable: false},
                    {label: 'Duration (ms)', fieldName: 'DurationMilliseconds', type: 'text', editable: false},
                    {label: 'Log Size (bytes)', fieldName: 'LogLength', type: 'text', editable: false},
                    {label: 'Start Time', fieldName: 'StartTime', type: 'Date', type: 'date', typeAttributes:{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}, editable: false}];

export default class Wb_ExecuteAnonymous extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    @api userDetails;
    @track debugLogsData = [];
    debugLogsColumn = columnData;
    codeSnippet = '';
    selectedStartDate;
    selectedExpirationDate;
    debugLevelOptions;
    selectedDebugLevel;
    disabledLogLevelInputs = false;
    traceFlagId;
    selectedApexLogId;
    isLoading = false;

    get disabledExecutionBtn(){
        return this.codeSnippet === undefined || this.codeSnippet === '' ? true : false;
    }
    get showDebugLog(){
        return this.debugLogsData !== undefined && this.debugLogsData.length > 0 ? true : false;
    }

    connectedCallback(){
        let currentDateTime = new Date();
        this.selectedStartDate = currentDateTime.toISOString();
        let logExpireDateTime = new Date(currentDateTime.getTime() + (5*60000));
        this.selectedExpirationDate = logExpireDateTime.toISOString();
        this.fetchDebugLevels();
    }

    handleInputChange(event){
        this.codeSnippet = event.target.value;
    }
    handleDateChange(event){
        let tagName = event.target.name;
        let value = event.target.value;
        if(value !== null && tagName === 'StartDate'){
            this.selectedStartDate = value;
        }
        else if(value !== null && tagName === 'ExpirationDate'){
            this.selectedExpirationDate = value;
        }
    }
    handleDebugLevelChange(event){
        this.selectedDebugLevel = event.target.value;
    }
    handleAnonymousExecute(){
        this.executeAnonymousRequest(this.codeSnippet);
    }
    handleTraceFlag(){
        this.generateTraceFlag();
    }
    handleRowAction(event){
        const logId = event.detail.row.Id;
        const actionName = event.detail.action.name;
        if(actionName === 'View'){
            this.selectedApexLogId = logId;
            this.viewDebugLog(this.selectedApexLogId);
        }
    }
    showTraceFlagBtn(){
        let expirationDateTime = new Date(this.selectedExpirationDate);
        let startDateTime = new Date(this.selectedStartDate);
        let timeDiff = expirationDateTime.getTime() - startDateTime.getTime();
        if(this.disabledLogLevelInputs){
            setTimeout(() => {
                this.disabledLogLevelInputs = false;
            }, timeDiff);
        }
    }
    fetchDebugLevels(){
        this.isLoading = true;
        retrieveDebugLevels({ userId: this.userId, apiVersion: this.apiValue})
		.then(result => {
            if(result){
                this.isLoading = false;
                let response = JSON.parse(result);
                if(response.done){
                    this.debugLevelOptions = [];
                    for(let rec of response.records){
                        this.debugLevelOptions.push({label: rec.DeveloperName, value: rec.Id});
                    }
                    this.selectedDebugLevel = this.debugLevelOptions[0].value;
                }  
            }else{
                this.showToastMessage('error', 'Failed to retrieve debug level:'+result);
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
    }
    executeAnonymousRequest(codeSnippetVal){
        this.isLoading = true;
        executeAnonymous({ userId: this.userId, apiVersion: this.apiValue, codeSnippet: codeSnippetVal})
		.then(result => {
            if(result){
                this.isLoading = false;
                let response = JSON.parse(result);
                if(!response.compiled && response.compileProblem){
                    this.showToastMessage('error', 'Compile error: '+response.compileProblem);
                }
                else if(!response.success && response.exceptionMessage){
                    this.showToastMessage('error', 'Exception: '+response.exceptionMessage);
                }
                this.fetchDebugLog();
            }else{
                this.showToastMessage('error', 'Failed to execute anonymous code:'+result);
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
    }
    generateTraceFlag(){
        this.isLoading = true;
        let currentDateTime = new Date(new Date(this.selectedStartDate).toString());
        let logExpireDateTime = new Date(new Date(this.selectedExpirationDate).toString());
        let traceOptions = {"ApexCode": "Finest", "ApexProfiling": "Error", "Callout": "Error", "Database": "Error",
                           "StartDate": currentDateTime, "ExpirationDate": logExpireDateTime, "TracedEntityId": this.userId, 
                           "LogType": "USER_DEBUG", "DebugLevelId": this.selectedDebugLevel, "Validation": "Error", "Visualforce": "Error", "Workflow": "Error", "System": "Error"};                 
        setTraceFlag({ userId: this.userId, apiVersion: this.apiValue, traceValue: JSON.stringify(traceOptions)})
		.then(result => {
            if(result){
                this.isLoading = false;
                let response = JSON.parse(result);
                if(response.success){
                    this.disabledLogLevelInputs = true;
                    this.traceFlagId = response.id;
                    let timeDiff = Math.abs(new Date(this.selectedExpirationDate) - new Date(this.selectedStartDate));
                    let diffInMint = Math.floor((timeDiff/1000)/60);
                    this.showToastMessage('success', 'Trace Flag is successfully set for ' + diffInMint + ' mintues');
                    this.showTraceFlagBtn();
                }else{
                    if(response[0].message){
                        this.showToastMessage('error', response[0].message);
                    }
                }
            }else{
                this.showToastMessage('error', 'Failed to execute anonymous code:'+result);
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
    }
    fetchDebugLog(){
        this.isLoading = true;
        retrieveDebugLog({ userId: this.userId, apiVersion: this.apiValue})
		.then(result => {
            if(result){
                this.isLoading = false;
                let response = JSON.parse(result);
                let debugLogs = [];
                for(let item of response.compositeResponse){
                    if(item.referenceId === 'refApexLog'){
                        for(let log of item.body.records){
                            debugLogs.push({Id: log.Id, Request: log.Request, Operation: log.Operation, Status: log.Status, DurationMilliseconds: log.DurationMilliseconds, LogLength: log.LogLength, StartTime: log.StartTime});
                        }
                    }
                }
                this.debugLogsData = debugLogs;
            }else{
                this.showToastMessage('error', 'Failed to retrieve debug log:'+result);
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
    }
    async viewDebugLog(apexLogId){
        if(apexLogId !== null){
            const result = await viewLogModal.open({
                size: 'medium',
                description: 'View Apex Log',
                logId: apexLogId,
                apiValue: this.apiValue,
                userId: this.userId
            });
            if(result && result !== ''){}
        }else{
            this.showToastMessage('warning', 'Blank LogId');
        }
    }
    showToastMessage(variant, message){
        let title = (variant === 'error' ? 'Error:' : variant === 'warning' ? 'Warning:' : 'Success:');
        let mode = (variant === 'error' ? 'sticky:' : 'dismissible:');
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message : message,
                variant: variant,
                mode: mode
            }),
        );
    }
}