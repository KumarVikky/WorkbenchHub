import { LightningElement, api, track } from 'lwc';
import getAllDeploymentStatus from '@salesforce/apex/WB_WorkbenchHubController.retrieveAllDeploymentStatus';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const columnData = [{type: "button", label: 'Action', initialWidth: 80, typeAttributes: {label: 'View',name: 'View',title: 'View',disabled: false,value: 'View',variant: 'base'}},
                    {label: 'Id', fieldName: 'Id', type: 'text', editable: false},
                    {label: 'Status', fieldName: 'Status', type: 'text', editable: false},
                    {label: 'Type', fieldName: 'Type', type: 'text', editable: false},
                    {label: 'Start Date', fieldName: 'StartDate', type: 'date', typeAttributes:{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}, editable: false},
                    {label: 'Completed Date', fieldName: 'CompletedDate', type: 'date', typeAttributes:{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}, editable: false},
                    {label: 'Created By', fieldName: 'CreatedBy', type: 'text', editable: false}];

export default class Wb_DeploymentStatus extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    isLoading = false;
    @track succeededRecordData = [];
    succeededRecordColumns = columnData;
    succeededRecordKey = 'Id';
    @track failedRecordData = [];
    failedRecordColumns = columnData;
    failedRecordKey = 'Id';
    showParent = true;
    successTotalRecords = 0;
    sucessPageSize = 10;
    successTotalPages = 0;
    succesPageNumber = 1;  
    @track successRecordsToDisplay = [];
    errorTotalRecords = 0;
    errorPageSize = 10;
    errorTotalPages = 0;
    errorPageNumber = 1;  
    @track errorRecordsToDisplay = [];

    get btnSuccessDisablePrevious() {
        return this.succesPageNumber == 1 ? true : false;
    }
    get btnSuccessDisableNext() {
        return this.succesPageNumber == this.successTotalPages ? true : false;
    }
    get btnErrorDisablePrevious() {
        return this.errorPageNumber == 1 ? true : false;
    }
    get btnErrorDisableNext() {
        return this.errorPageNumber == this.errorTotalPages ? true : false;
    }
    
    connectedCallback(){
        this.fetchDeploymentStatus();
    }

    fetchDeploymentStatus(){
        this.isLoading = true;
		getAllDeploymentStatus({ userId: this.userId, apiVersion: this.apiValue})
		.then(result => {
            if(result){
                this.isLoading = false;
                let response = JSON.parse(result);
                //console.log('response',response);
                if(response.done){
                    let failedRecData = [];
                    let succeededRecData = [];
                    for(let record of response.records){
                        if(record.Status === 'Failed'){
                            let recObj;
                            if(record.CheckOnly){
                                recObj=  {'Id': record.Id, 'Status': 'Validate: '+record.Status, 'Type': record.Type,
                                'StartDate': record.StartDate, 'CompletedDate': record.CompletedDate, 'CreatedBy': record.CreatedBy.Name};
                            }else{
                                recObj=  {'Id': record.Id, 'Status': 'Deploy: '+record.Status, 'Type': record.Type,
                                'StartDate': record.StartDate, 'CompletedDate': record.CompletedDate, 'CreatedBy': record.CreatedBy.Name}
                            }
                            failedRecData.push(recObj);
                        }else{
                            let recObj;
                            if(record.CheckOnly){
                                recObj=  {'Id': record.Id, 'Status': 'Validate: '+record.Status, 'Type': record.Type,
                                'StartDate': record.StartDate, 'CompletedDate': record.CompletedDate, 'CreatedBy': record.CreatedBy.Name};
                            }else{
                                recObj=  {'Id': record.Id, 'Status': 'Deploy: '+record.Status, 'Type': record.Type,
                                'StartDate': record.StartDate, 'CompletedDate': record.CompletedDate, 'CreatedBy': record.CreatedBy.Name}
                            }
                            succeededRecData.push(recObj);
                        }
                    }
                    this.failedRecordData = failedRecData;
                    this.succeededRecordData = succeededRecData;
                    this.successTotalRecords = succeededRecData.length;
                    this.successPaginationHelper();
                    this.errorTotalRecords = failedRecData.length;
                    this.errorPaginationHelper();
                }
            }else{
                this.showToastMessage('error', 'Failed to fetch deployment result:'+result);
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    handleRowAction(event){
        const deployReqId = event.detail.row.Id;
        const actionName = event.detail.action.name;
        if(actionName === 'View'){
            this.goToDeploymentDetails(deployReqId);
        }
    }
    goToDeploymentDetails(deployReqId){
        this.refs.deployDetailCmp.fetchDeploymentDetails(deployReqId);
        this.showParent = false;
    }
    showDeploymentStatus(event){
        this.showParent = event.detail.value;
    }
    handleRefresh(){
        this.fetchDeploymentStatus();
    }
    previousPageSuccess() {
        this.succesPageNumber = this.succesPageNumber - 1;
        this.successPaginationHelper();
    }
    nextPageSuccess() {
        this.succesPageNumber = this.succesPageNumber + 1;
        this.successPaginationHelper();
    }
    successPaginationHelper(){
        this.successRecordsToDisplay = [];
        this.successTotalPages = Math.ceil(this.successTotalRecords / this.sucessPageSize);
        if(this.succesPageNumber <= 1){
            this.succesPageNumber = 1;
        }else if(this.succesPageNumber >= this.successTotalPages){
            this.succesPageNumber = this.successTotalPages;
        }
     
        for(let i = ((this.succesPageNumber - 1) * this.sucessPageSize); i < (this.succesPageNumber * this.sucessPageSize); i++) {
            if(i === this.successTotalRecords){
                break;
            }
            this.successRecordsToDisplay.push(this.succeededRecordData[i]);
        }
    }
    previousPageError() {
        this.errorPageNumber = this.errorPageNumber - 1;
        this.errorPaginationHelper();
    }
    nextPageError() {
        this.errorPageNumber = this.errorPageNumber + 1;
        this.errorPaginationHelper();
    }
    errorPaginationHelper(){
        this.errorRecordsToDisplay = [];
        this.errorTotalPages = Math.ceil(this.errorTotalRecords / this.errorPageSize);
        if(this.errorPageNumber <= 1){
            this.errorPageNumber = 1;
        }else if(this.errorPageNumber >= this.errorTotalPages){
            this.errorPageNumber = this.errorTotalPages;
        }
     
        for(let i = ((this.errorPageNumber - 1) * this.errorPageSize); i < (this.errorPageNumber * this.errorPageSize); i++) {
            if(i === this.errorTotalRecords){
                break;
            }
            this.errorRecordsToDisplay.push(this.failedRecordData[i]);
        }
    }
    showToastMessage(variant, message){
        let title = (variant === 'error' ? 'Error:' : 'Success:');
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message : message,
                variant: variant,
                mode: 'dismissible'
            }),
        );
    }
}