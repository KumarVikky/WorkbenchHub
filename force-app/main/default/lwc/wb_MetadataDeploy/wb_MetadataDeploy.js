import { LightningElement, api, track } from 'lwc';
import jszip from '@salesforce/resourceUrl/jszip';
import jszipmin from '@salesforce/resourceUrl/jszipmin';
import filesaver from '@salesforce/resourceUrl/filesaver';
import jquery from '@salesforce/resourceUrl/jquery';
import { loadScript } from 'lightning/platformResourceLoader';
import metadataDeployRequest from '@salesforce/apex/WB_WorkbenchController.metadataDeployRequest';
import checkAsyncDeployRequest from '@salesforce/apex/WB_WorkbenchController.checkAsyncDeployRequest';
import metadataQuickDeployRequest from '@salesforce/apex/WB_WorkbenchController.metadataQuickDeployRequest';
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
    responseAsJson;
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
        //this.responseAsJson = JSON.stringify(this.blogdetail, null, 2);
        this.deployOptionsObj = {'checkOnly':false, 'ignoreWarnings':false, 'rollbackOnError':true, 'singlePackage':true, 'testLevel':'NoTestRun', 'runTests':''};
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
        //console.log('deployoption=',this.deployOptionsObj);
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
            console.error("Failed to open as ZIP file:", err);
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
    }
    handleDeployPackage(){
        this.handleConfirmClick();
    }
    fetchMetadataDeployRequest(){
        this.isLoading = true;
        //console.log('file=>',this.fileData.base64);
		metadataDeployRequest({ userId: this.userId, metadataZip: this.fileData.base64, apiVersion: this.apiValue, deployOptionsJson: JSON.stringify(this.deployOptionsObj)})
		.then(result => {
            this.isLoading = false;
            if(result){
                let response = JSON.parse(result);
                console.log('response=>',response);
                if(response.id !== null){
                    this.deployAsyncResult = response;
                    this.disableDeployPackageBtn = true;
                    this.disableValidatePackageBtn = true;
                    this.disableQuickDeployBtn = true;
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this._serverInterval = setInterval(() => {
                        if(this.deployOptionsObj.checkOnly){
                            this.showNotification('info', 'Deploy request initiated, please wait!.');
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
    quickDeployRequest(){
        this.isLoading = true;
        this.showNotification('info', 'Deploy request initiated, please wait!.');
        let quickDeployOption = JSON.parse(JSON.stringify(this.deployOptionsObj));
        quickDeployOption.checkOnly = false;
        metadataDeployRequest({ userId: this.userId, metadataZip: this.fileData.base64, apiVersion: this.apiValue, deployOptionsJson: JSON.stringify(quickDeployOption)})
		.then(result => {
            this.isLoading = false;
            if(result){
                let response = JSON.parse(result);
                console.log('response=>',response);
                if(response.id !== null){
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
    async handleConfirmClick() {
        const result = await LightningConfirm.open({
            message: 'Are you sure you want to deploy all packaged items?',
            variant: 'header',
            label: 'Confirmation',
            theme:'info',
        });
        if(result){
            if(this.deployOptionsObj.checkOnly){
                this.showNotification('info', 'Validation request initiated, please wait!.');
            }else{
                this.showNotification('info', 'Deploy request initiated, please wait!.');
            }
            this.fetchMetadataDeployRequest();
        }
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