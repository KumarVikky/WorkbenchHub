import { LightningElement, api, track } from 'lwc';
import executeAnonymous from '@salesforce/apex/WB_WorkbenchController.executeAnonymous';
import setTraceFlag from '@salesforce/apex/WB_WorkbenchController.setTraceFlag';
import retrieveDebugLevels from '@salesforce/apex/WB_WorkbenchController.retrieveDebugLevels';
import retrieveDebugLog from '@salesforce/apex/WB_WorkbenchController.retrieveDebugLog';
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
        let logExpireDateTime = new Date(currentDateTime.getTime() + (20*60000));
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
    handleExecuteHighlighted(){
        let textArea = this.refs.textAreaRef;
        console.log('va',textArea);
        console.log('vaa',textArea.value);
        console.log('vaa',textArea.selectionStart);
        console.log('vaaa',textArea.selectionEnd);

    }
    handleTraceFlag(){
        this.generateTraceFlag();
    }
    handleRowAction(event){
        const logId = event.detail.row.Id;
        const actionName = event.detail.action.name;
        if(actionName === 'View'){
            this.selectedApexLogId = logId;
            console.log('logId',logId);
            this.viewDebugLog(this.selectedApexLogId);
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
                if(response.compiled && response.success){
                    this.fetchDebugLog();
                }else{
                    if(response.compileProblem){
                        this.showToastMessage('error', 'Compilation error: '+response.compileProblem);
                    }
                }
            }else{
                if(response.compileProblem){
                    this.showToastMessage('error', 'Failed to execute anonymous code:'+result);
                }
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
                console.log('response',response);
                if(response.success){
                    this.disabledLogLevelInputs = true;
                    this.traceFlagId = response.id;
                    this.showToastMessage('success', 'Trace Flag is created with Id: '+response.id);
                }else{
                    if(response.message){
                        this.showToastMessage('error', response.message);
                    }else{
                        this.showToastMessage('error', result);
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
        let title = (variant === 'error' ? 'Error:' : 'Success:');
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