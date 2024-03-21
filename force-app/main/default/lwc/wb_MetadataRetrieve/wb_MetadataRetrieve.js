import { LightningElement, api, track } from 'lwc';
import getMetadataType from '@salesforce/apex/WB_WorkbenchController.getMetadataTypes';
import getMetadataItems from '@salesforce/apex/WB_WorkbenchController.getMetadataItems';
import metadataRetrieveRequest from '@salesforce/apex/WB_WorkbenchController.metadataRetrieveRequest';
import checkAsyncRetrieveRequest from '@salesforce/apex/WB_WorkbenchController.checkAsyncRetrieveRequest';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import jszip from '@salesforce/resourceUrl/jszip';
import jszipmin from '@salesforce/resourceUrl/jszipmin';
import filesaver from '@salesforce/resourceUrl/filesaver';
import jquery from '@salesforce/resourceUrl/jquery';
import { loadScript } from 'lightning/platformResourceLoader';

export default class Wb_MetadataRetrieve extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    @track metadataTypeOptions;
    @track metadataItemsData;
    @track packageItemsData;
    @track selectedMetaItems;
    @track selectedPackageItems;
    @track interval;
    isLoading = false;
    selectedMetadataType;
    metadataItemsColumn;
    packageItemsColumn;
    disableAddPackageBtn = true;
    disableRemovePackageBtn = true;
    disableRetrievePackageBtn = true;
    retrieveAsyncResult;
    metaDataRetrieveZip;
    disableDownloadPackageBtn = true;
    progressVariant = 'active-step';
    progressValue = 0;
    showRingProgress = false;
    _progressInterval;
    _serverInterval;

    connectedCallback(){
        this.fetchMetadataTypes();
        this.metadataItemsColumn = [{label:'Name',fieldName:'itemName', type:'text'}];
        this.packageItemsColumn = [{label:'Name',fieldName:'itemName', type:'text'},
                                   {label:'Type',fieldName:'itemType', type:'text'}];
        this.packageItemsData = [];
        Promise.all([
            loadScript(this, jszip),
            loadScript(this, jszipmin),
            loadScript(this, filesaver),
            loadScript(this, jquery)
        ]).then(() => console.log('Success: All Script Loaded.'))
        .catch(error => console.log('Error:',error));
    }
    handleMetadataTypeChange(event) {
        this.selectedMetadataType = event.detail.value;
        this.metadataItemsData = [];
        this.fetchMetadataItems();
    }
    handleSelectedMetaItems(event){
        const selectedRows = event.detail.selectedRows;
        if(selectedRows.length > 0){
            this.selectedMetaItems = [];
            for(let item of selectedRows){
                this.selectedMetaItems.push(item);
            }
        }
    }
    handleSelectedPackageItems(event){
        const selectedRows = event.detail.selectedRows;
        if(selectedRows.length > 0){
            this.selectedPackageItems = [];
            for(let item of selectedRows){
                this.selectedPackageItems.push(item);
            }
        }
    }
    handleAddPackage(){
        let selectedRecords = this.selectedMetaItems; 
        if(selectedRecords.length > 0){
            let packageItems = [...this.packageItemsData];
            for(let item of selectedRecords){
                let searchObject = packageItems.find((ex) => ex.itemName === item.itemName && ex.itemType === this.selectedMetadataType);
                if(searchObject === undefined){
                    packageItems.push({itemName: item.itemName, itemType: this.selectedMetadataType});
                }
            }
            this.disableRemovePackageBtn = false;
            this.disableRetrievePackageBtn = false;
            this.packageItemsData = packageItems;
        }else{
            this.showToastMessage('warning', 'No item selected.');
        }
    }
    handleRemovePackage(){
        let selectedRecords = this.selectedPackageItems;
        if(selectedRecords.length > 0){
            let packageItems = [...this.packageItemsData];
            let tempRecords = packageItems.filter(ex => !selectedRecords.some(cr => ex.itemName === cr.itemName && ex.itemType === cr.itemType));
            this.packageItemsData = tempRecords;
        }else{
            this.showToastMessage('warning', 'No item selected.');
        }
    }
    handleRetrievePackage(){
        this.fetchMetadataRetrieveRequest();
    }
    handleDownloadPackage(){
        this.disableDownloadPackageBtn = true;
        this.downloadZipFile(this.metaDataRetrieveZip, this);
    }
    downloadZipFile(file, that) {
        // eslint-disable-next-line no-undef
        var zip = new JSZip();
        return that.loadZipFile(file, zip)
            .then(function(content) {
                // save file using FileSaver.js
                // eslint-disable-next-line no-undef
                saveAs(content, "Metadata Files.zip");
                that.disableDownloadPackageBtn = false;
                that.showToastMessage('success', 'Zip File generated.');
            });
    }
    loadZipFile(file, zip) {
        return new Promise(function(resolve) {
            zip.loadAsync(file, { base64: true })
            .then(function (zipFile) {
                // Create a blob from the data in the zip file
                zipFile.generateAsync({type:"blob"})
                .then(function(content) {
                    resolve(content);
                });
            });
        });
    }
    generateZipFile(){ // Currently Not in Use
        // eslint-disable-next-line no-undef
        var zip = new JSZip();
        zip.loadAsync(this.metaDataRetrieveZip, { base64: true })
        // eslint-disable-next-line no-shadow
        .then(function (zip) {
            // Create a blob from the data in the zip file
            zip.generateAsync({type:"blob"})
            .then(function(content) {
                // save file using FileSaver.js
                // eslint-disable-next-line no-undef
                saveAs(content, "Metadata.zip");
            });
        });
    }
    fetchMetadataTypes(){
        this.isLoading = true;
		getMetadataType({ userId: this.userId, apiVersion: this.apiValue})
		.then(result => {
            this.isLoading = false;
            if(result){
                let response = JSON.parse(result);
                if(response !== null){
                    this.metadataTypeOptions = [];
                    for(let item of response){
                        this.metadataTypeOptions.push({label: item, value: item});
                    }
                    this.showToastMessage('success', 'Metadata retrieve successfully');
                }else{
                    this.showToastMessage('warning', 'No Metadata found.');
                }
            }else{
                this.showToastMessage('error', 'Some Error Occured.');
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    fetchMetadataItems(){
        this.isLoading = true;
		getMetadataItems({ userId: this.userId, selectedMetadataType: this.selectedMetadataType, apiVersion: this.apiValue})
		.then(result => {
            this.isLoading = false;
            if(result){
                let response = JSON.parse(result);
                if(response !== null){
                    this.metadataItemsData = [];
                    for(let item of response){
                        this.metadataItemsData.push({itemName: item});
                    }
                    this.disableAddPackageBtn = false;
                    this.showToastMessage('success', 'Metadata Items retrieve successfully');
                }else{
                    this.showToastMessage('warning', 'No Metadata items found.');
                }
            }else{
                this.showToastMessage('error', 'Some Error Occured.');
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error.statusText);
		})
	}
    fetchMetadataRetrieveRequest(){
        this.isLoading = true;
		metadataRetrieveRequest({ userId: this.userId, selectedPackageJSON: JSON.stringify(this.packageItemsData), apiVersion: this.apiValue})
		.then(result => {
            this.isLoading = false;
            if(result){
                let response = JSON.parse(result);
                if(result !== null){
                    this.retrieveAsyncResult = response;
                    this.disableDownloadPackageBtn = true;
                    //this.fetchMetadataRetrieveResult();
                    this.disableRetrievePackageBtn = true;
                    this.toggleProgress(true,'active-step');
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    this._serverInterval = setInterval(() => {
                        this.fetchRetrieveResult();
                    }, 10000);
                }  
            }else{
                this.showToastMessage('error', 'Some Error Occured.');
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    fetchMetadataRetrieveResult(){ //Not in use now
        this.disableRetrievePackageBtn = true;
        this.toggleProgress(true,'active-step');
		checkAsyncRetrieveRequest({ userId: this.userId, retrieveAsyncResultJSON: JSON.stringify(this.retrieveAsyncResult), apiVersion: this.apiValue})
		.then(result => {
            //console.log('result=>',result);
            if(result === '' || result === null){
                this.fetchMetadataRetrieveResult();
                this.metaDataRetrieveZip = null;
            }else{
                if(result.includes('error')){
                    this.metaDataRetrieveZip = null;
                    this.toggleProgress(false,'expired');
                    this.showToastMessage('error', 'Some Error Occured.');
                    this.disableRetrievePackageBtn = false;
                }else{
                    this.metaDataRetrieveZip = result;
                    this.toggleProgress(false,'base-autocomplete');
                    this.disableDownloadPackageBtn = false;
                    this.disableRetrievePackageBtn = false;
                }
            }
		})
		.catch(error => {
			console.log('error',error);
            this.showToastMessage('error', error);
            this.toggleProgress(false,'expired');
            this.disableRetrievePackageBtn = false;
		})
	}
    fetchRetrieveResult(){
        checkAsyncRetrieveRequest({ userId: this.userId, retrieveAsyncResultJSON: JSON.stringify(this.retrieveAsyncResult), apiVersion: this.apiValue})
		.then(result => {
            if(result !== '' && result !== null){
                if(result.includes('error')){
                    this.metaDataRetrieveZip = null;
                    clearInterval(this._serverInterval);
                    this.toggleProgress(false,'expired');
                    this.showToastMessage('error', 'Some Error Occured.');
                    this.disableRetrievePackageBtn = false;
                }else{
                    clearInterval(this._serverInterval);
                    this.metaDataRetrieveZip = result;
                    this.toggleProgress(false,'base-autocomplete');
                    this.disableDownloadPackageBtn = false;
                    this.disableRetrievePackageBtn = false;
                    this.showToastMessage('success', 'Selected packages retrieved successfully.');
                }
            }else{
                this.disableDownloadPackageBtn = false;
                this.disableRetrievePackageBtn = false;
                clearInterval(this._serverInterval);
                this.toggleProgress(false,'expired');
                this.showToastMessage('error', 'Some Error Occured.');
            }
		})
		.catch(error => {
			console.log('error',error);
            this.showToastMessage('error', error);
            clearInterval(this._serverInterval);
            this.toggleProgress(false,'expired');
            this.disableRetrievePackageBtn = false;
		})
    }
    showToastMessage(variant, message){
        let title = (variant === 'error' ? 'Error:' : 'Success:');
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message : message,
                variant: variant,
            }),
        );
    }
    toggleProgress(isProgressing, variant) {
        let progressVal = (variant === 'base-autocomplete' || variant === 'warning' ? 100 : 50);
        if(isProgressing === true){
            this.showRingProgress = true;
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this._progressInterval = setInterval(() => {
                this.progressValue = this.progressValue === 100 ? 0 : this.progressValue + 1;
            }, 1000);
        }else{
            clearInterval(this._progressInterval);
            this.progressVariant = variant;
            this.progressValue = progressVal;
            this.showRingProgress = false;
        }
    }
}