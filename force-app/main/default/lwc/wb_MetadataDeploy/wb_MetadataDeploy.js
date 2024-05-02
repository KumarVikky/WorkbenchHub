import { LightningElement, api, track } from 'lwc';
import jszip from '@salesforce/resourceUrl/jszip';
import jszipmin from '@salesforce/resourceUrl/jszipmin';
import filesaver from '@salesforce/resourceUrl/filesaver';
import jquery from '@salesforce/resourceUrl/jquery';
import { loadScript } from 'lightning/platformResourceLoader';
import metadataDeployRequest from '@salesforce/apex/WB_WorkbenchHubController.metadataDeployRequest';
import checkAsyncDeployRequest from '@salesforce/apex/WB_WorkbenchHubController.checkAsyncDeployRequest';
import metadataQuickDeployRequest from '@salesforce/apex/WB_WorkbenchHubController.metadataQuickDeployRequest';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';

export default class Wb_MetadataDeploy extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    @track packageItemsData;
    fileData;
    packageItemsColumn;
    disableDeployPackageBtn = true;
    _progressInterval;
    isLoading = false;
    deployAsyncResult;
    deployOptionsObj;
    @track responseAsJson;
    showTestRun = false;
    showValidateBtn = false;
    disableQuickDeployBtn = true;
    disableValidatePackageBtn = true;
    validationId;

    get testLevelOptions() {
        return [
            { label: 'NoTestRun', value: 'NoTestRun' },
            { label: 'RunSpecifiedTests', value: 'RunSpecifiedTests' },
            { label: 'RunLocalTests', value: 'RunLocalTests' },
            { label: 'RunAllTestsInOrg', value: 'RunAllTestsInOrg' },
        ];
    }
    get isAllowedCopy(){
        return this.responseAsJson === '' || this.responseAsJson === undefined ? false : true;
    }

    connectedCallback(){
        Promise.all([
            loadScript(this, jszip),
            loadScript(this, jszipmin),
            loadScript(this, filesaver),
            loadScript(this, jquery)
        ]).then(() => console.log('Success: All Script Loaded.'))
        .catch(error => console.log('Error:',error));
        this.packageItemsColumn = [{label:'Name',fieldName:'itemName', type:'text'},
                                   {label:'Type',fieldName:'itemType', type:'text'}];
        this.packageItemsData = [];
        this.deployOptionsObj = {'checkOnly':true, 'ignoreWarnings':false, 'rollbackOnError':true, 'singlePackage':true, 'testLevel':'NoTestRun', 'runTests':''};
        if(this.deployOptionsObj.checkOnly){
            this.showValidateBtn = true;
        }else{
            this.showValidateBtn = false;
        }
    }

    handleTestLevelChange(event) {
        this.deployOptionsObj.testLevel = event.detail.value;
        if(this.deployOptionsObj.testLevel === 'RunSpecifiedTests'){
            this.showTestRun = true;
        }else{
            this.showTestRun = false;
        }
    }
    handleInputChange(event) {
        let tagName = event.currentTarget.name;
        if(tagName === 'CheckOnly'){
            this.deployOptionsObj.checkOnly = event.currentTarget.checked;
            if(this.deployOptionsObj.checkOnly){
                this.showValidateBtn = true;
            }else{
                this.showValidateBtn = false;
            }
        }
        if(tagName === 'IgnoreWarnings'){
            this.deployOptionsObj.ignoreWarnings = event.currentTarget.checked;
        }
        if(tagName === 'RollbackOnError'){
            this.deployOptionsObj.rollbackOnError = event.currentTarget.checked;
        }
        if(tagName === 'SinglePackage'){
            this.deployOptionsObj.singlePackage = event.currentTarget.checked;
        }
        if(tagName === 'RunTests'){
            this.deployOptionsObj.runTests = event.currentTarget.value;
        }
    }

    handleFilesChange(event){
        const file = event.target.files[0];
        let reader = new FileReader();
        reader.onload = () => {
            var base64 = reader.result.split(',')[1];
            this.fileData = {
                'filename': file.name,
                'base64': base64
            };
            this.isLoading = true;
            this.packageItemsData = [];
            this.readPackageXML(this.fileData,this);
        }
        reader.readAsDataURL(file);
    }
    readPackageXML(fileVal,that){
        const file = fileVal.base64;
        // eslint-disable-next-line no-undef
        JSZip.loadAsync(file, { base64: true }).then(function(zip) {
            zip.file("package.xml").async("string").then(function(data) {
                // eslint-disable-next-line no-undef
                let xmlDoc = jQuery.parseXML(data);
                that.createPackageItems(xmlDoc);
            })
        }).catch(function(err) {
            this.showToastMessage('error', 'Failed to read ZIP file.');
            console.error("Failed to open as ZIP file:", err);
            this.isLoading = false;
        })
    }
    createPackageItems(xmlDoc){
        let packageItems = [...this.packageItemsData];
        let x = xmlDoc.getElementsByTagName("types");
        for (let i = 0; i < x.length; i++) {
            let y = x[i].getElementsByTagName("name")[0].childNodes[0].nodeValue;
            for (let j = 0; j < x[i].getElementsByTagName("members").length; j++) {
                let z = x[i].getElementsByTagName("members")[j].childNodes[0].nodeValue;
                packageItems.push({itemName: z, itemType: y});
            }
        }
        this.packageItemsData = packageItems;
        this.isLoading = false;
        this.disableDeployPackageBtn = false;
        this.disableValidatePackageBtn = false;
        this.adjustDataPanel();
    }
    async handleDeployPackage(){
        let toastMessage = '';
        let alertMessage = '';
        if(this.deployOptionsObj.checkOnly){
            toastMessage = 'Validation request initiated, please wait!.';
            alertMessage = 'Do you want to validate these components?'
        }else{
            toastMessage = 'Deploy request initiated, please wait!.';
            alertMessage = 'Do you want to deploy these components?'
        }
        let hasConfirmed = await this.handleConfirmClick(alertMessage);
        if(hasConfirmed){
            this.showNotification('info', toastMessage);
            this.fetchMetadataDeployRequest();
        }
    }
    adjustDataPanel(){
        var divblock = this.template.querySelector('[data-id="datatable"]');
        if(divblock){
            this.template.querySelector('[data-id="datatable"]').classList.add('dataTablePanel', 'slds-border_top');
        }       
    }
    fetchMetadataDeployRequest(){
        this.isLoading = true;
        this.responseAsJson = '';
		metadataDeployRequest({ userId: this.userId, metadataZip: this.fileData.base64, apiVersion: this.apiValue, deployOptionsJson: JSON.stringify(this.deployOptionsObj)})
		.then(result => {
            this.isLoading = false;
            if(result){
                let response = JSON.parse(result);
                //console.log('response=>',response);
                if(response.id !== null){
                    this.deployAsyncResult = response;
                    this.disableDeployPackageBtn = true;
                    this.disableValidatePackageBtn = true;
                    this.disableQuickDeployBtn = true;
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this._serverInterval = setInterval(() => {
                        if(this.deployOptionsObj.checkOnly){
                            this.fetchValidateResult();
                        }else{
                            this.fetchDeployResult();
                        }
                    }, 10000);
                }else{
                    this.showToastMessage('error', 'Some Error Occured.');
                } 
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    fetchDeployResult(){
        this.showNotification('info', 'Fetching deployment response, please wait!.');
        checkAsyncDeployRequest({ userId: this.userId, deployAsyncResultJSON: JSON.stringify(this.deployAsyncResult), apiVersion: this.apiValue})
		.then(result => {
            //console.log('result=>',result);
            if(result !== '' && result !== null){
                if(this.isValidJson(result)){
                    let response = JSON.parse(result);
                    this.responseAsJson = JSON.stringify(response, null, 2);
                    if(response.errorMessage !== null){
                        clearInterval(this._serverInterval);
                        this.showToastMessage('error', 'Some Error Occured.');
                        this.disableDeployPackageBtn = false;
                        this.disableValidatePackageBtn = false;
                        this.disableQuickDeployBtn = true;
                        this.hideNotification();
                    }else{
                        clearInterval(this._serverInterval);
                        this.disableDeployPackageBtn = false;
                        this.disableValidatePackageBtn = false;
                        this.disableQuickDeployBtn = true;
                        this.showToastMessage('success', 'Selected packages deployed successfully.');
                        this.hideNotification();
                    }
                }else{
                    this.responseAsJson = result;
                    clearInterval(this._serverInterval);
                    this.showToastMessage('error', 'Some Error Occured.');
                    this.disableDeployPackageBtn = false;
                    this.disableValidatePackageBtn = false;
                    this.disableQuickDeployBtn = true;
                    this.hideNotification();
                }
            }else{
                this.disableDeployPackageBtn = false;
                this.disableValidatePackageBtn = false;
                this.disableQuickDeployBtn = true;
                clearInterval(this._serverInterval);
                this.hideNotification();
                this.showToastMessage('error', 'Some Error Occured.');
            }
		})
		.catch(error => {
			console.log('error',error);
            this.showToastMessage('error', error);
            clearInterval(this._serverInterval);
            this.hideNotification();
            this.disableDeployPackageBtn = false;
            this.disableValidatePackageBtn = false;
            this.disableQuickDeployBtn = true;
		})
    }
    fetchValidateResult(){
        this.showNotification('info', 'Fetching validate response, please wait!.');
        checkAsyncDeployRequest({ userId: this.userId, deployAsyncResultJSON: JSON.stringify(this.deployAsyncResult), apiVersion: this.apiValue})
		.then(result => {
            if(result !== '' && result !== null){
                //console.log('result=>',result);
                if(this.isValidJson(result)){
                    let response = JSON.parse(result);
                    this.responseAsJson = JSON.stringify(response, null, 2);
                    if(response.errorMessage !== null){
                        clearInterval(this._serverInterval);
                        this.disableDeployPackageBtn = false;
                        this.disableValidatePackageBtn = false;
                        this.disableQuickDeployBtn = true;
                        this.hideNotification();
                        this.showToastMessage('error', 'Some Error Occured.');
                    }else{
                        clearInterval(this._serverInterval);
                        this.hideNotification();
                        this.showToastMessage('success', 'Selected packages validated successfully.');
                        this.disableDeployPackageBtn = false;
                        this.disableQuickDeployBtn = false;
                        this.disableValidatePackageBtn = true;
                    }
                }else{
                    this.responseAsJson = result;
                    clearInterval(this._serverInterval);
                    this.showToastMessage('error', 'Some Error Occured.');
                    this.disableDeployPackageBtn = false;
                    this.disableValidatePackageBtn = false;
                    this.disableQuickDeployBtn = true;
                    this.hideNotification();
                }
            }else{
                clearInterval(this._serverInterval);
                this.hideNotification();
                this.showToastMessage('error', 'Some Error Occured.');
                this.disableDeployPackageBtn = false;
                this.disableValidatePackageBtn = false;
                this.disableQuickDeployBtn = true;
            }
		})
		.catch(error => {
			console.log('error',error);
            this.showToastMessage('error', error);
            clearInterval(this._serverInterval);
            this.hideNotification();
            this.disableDeployPackageBtn = false;
            this.disableValidatePackageBtn = false;
            this.disableQuickDeployBtn = true;
		})
    }
    async quickDeploy(){
        let hasConfirmed = await this.handleConfirmClick('Do you want to deploy these components?');
        if(hasConfirmed){
            this.showNotification('info', 'Deploy request initiated, please wait!.');
            this.quickDeployRequest();
        }
    }
    quickDeployRequest(){
        this.isLoading = true;
        this.responseAsJson = '';
        let quickDeployOption = JSON.parse(JSON.stringify(this.deployOptionsObj));
        quickDeployOption.checkOnly = false;
        metadataDeployRequest({ userId: this.userId, metadataZip: this.fileData.base64, apiVersion: this.apiValue, deployOptionsJson: JSON.stringify(quickDeployOption)})
		.then(result => {
            this.isLoading = false;
            if(result){
                let response = JSON.parse(result);
                //console.log('response=>',response);
                if(response.id !== null){
                    this.deployAsyncResult = response;
                    this.disableDeployPackageBtn = true;
                    this.disableValidatePackageBtn = true;
                    this.disableQuickDeployBtn = true;
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this._serverInterval = setInterval(() => {
                        this.fetchDeployResult();
                    }, 10000);
                }else{
                    this.showToastMessage('error', 'Some Error Occured.');
                }
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
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
    async handleConfirmClick(message) {
        const result = await LightningConfirm.open({
            message: message,
            variant: 'header',
            label: 'Confirmation',
            theme:'info',
        });
        return result;
    }
    handleCopyResponse(){
        let content = this.refs.jsonContent;
        if(content !== undefined){
            const el = document.createElement('textarea');
            el.value = content.innerHTML;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            alert('Response copied:  ' + el.value);
        }
    }
    isValidJson(content){
        try{
            JSON.parse(content);
        }catch(e){
            return false;
        }
        return true;
    }
    showNotification(type, message){
        let data = {'type':type, 'message':message};
        const eve = new CustomEvent('shownotification',{
            detail:data
        })
        this.dispatchEvent(eve);
    }
    hideNotification(){
        let data = 'close';
        const eve = new CustomEvent('hidenotification',{
            detail:data
        })
        this.dispatchEvent(eve);
    }
}