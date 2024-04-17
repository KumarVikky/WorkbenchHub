import { LightningElement, api, track } from 'lwc';
import getDeploymentDetails from '@salesforce/apex/WB_WorkbenchHubController.retrieveDeploymentDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const columnData = [{label: 'Id', fieldName: 'id', type: 'text', editable: false},
                    {label: 'File Name', fieldName: 'fileName', type: 'text', editable: false},
                    {label: 'Component Type', fieldName: 'componentType', type: 'text',editable: false},
                    {label: 'File Path', fieldName: 'filePath', type: 'text', editable: false}];

const errorColumnData = [{label: 'Id', fieldName: 'id', type: 'text', editable: false},
                        {label: 'File Name', fieldName: 'fileName', type: 'text', editable: false},
                        {label: 'Component Type', fieldName: 'componentType', type: 'text',editable: false},
                        {label: 'Problem Type', fieldName: 'problemType', type: 'text', editable: false},
                        {label: 'Problem', fieldName: 'problem', type: 'text', editable: false},
                        {label: 'Line Number', fieldName: 'lineNumber', type: 'text', editable: false}];
export default class Wb_DeploymentDetails extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    @track componentData = [];
    @track deployRecord = {};
    @track componentErrorData = [];
    componentColumns = columnData;
    componentKey = 'Id';
    componentErrorKey = 'Id';
    componentErrorColumns = errorColumnData;
    isLoading = false;
    showChild = false;

    get hasErrorList(){
        return this.componentErrorData.length > 0 ? true : false;
    }

    @api
    fetchDeploymentDetails(deployReqId){
        this.showChild = true;
        this.isLoading = true;
		getDeploymentDetails({ userId: this.userId, apiVersion: this.apiValue, deployRequestId: deployReqId})
		.then(result => {
            if(result){
                this.isLoading = false;
                let response = JSON.parse(result);
                //console.log('response',response);
                if(response.deployResult.done){
                    let depStatus = '';
                    if(response.deployResult.checkOnly){
                        depStatus = 'Validate: '+response.deployResult.status;
                    }else{
                        depStatus = 'Deploy: '+response.deployResult.status;
                    }
                    let deployObj = {id: response.deployResult.id, status: depStatus, startDate: response.deployResult.startDate, completedDate: response.deployResult.completedDate, deployedBy: response.deployResult.createdByName};
                    this.deployRecord = deployObj;
                    let deployDetails = [];
                    let errorDetails = [];
                    for(let record of response.deployResult.details.allComponentMessages){
                        if(record.fullName !== 'package.xml'){
                            deployDetails.push({id: record.id, fileName: record.fullName, componentType: record.componentType, filePath: record.fileName});
                            if(!record.success){
                                errorDetails.push({id: record.id, fileName: record.fullName, componentType: record.componentType, problemType: record.problemType, problem: record.problem, lineNumber: record.lineNumber});
                            }
                        }
                    }
                    this.componentData = deployDetails;
                    this.componentErrorData = errorDetails;
                }
            }else{
                this.showToastMessage('error', 'Failed to fetch deployment details:'+result);
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    goToDeploymentStatus(event){
        event.preventDefault();
        this.showChild = false;
        this.dispatchEvent(new CustomEvent('showparent', {
            detail: {
                value: true
            }
        }));
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