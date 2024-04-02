import { LightningElement, api } from 'lwc';
import getSObjects from '@salesforce/apex/WB_WorkbenchController.getAllSObjects';
import getFields from '@salesforce/apex/WB_WorkbenchController.getAllFields';
import createRecordRequest from '@salesforce/apex/WB_WorkbenchController.createRecordRequest';
import updateRecordRequest from '@salesforce/apex/WB_WorkbenchController.updateRecordRequest';
import deleteRecordRequest from '@salesforce/apex/WB_WorkbenchController.deleteRecordRequest';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import jszip from '@salesforce/resourceUrl/jszip';
import jszipmin from '@salesforce/resourceUrl/jszipmin';
import filesaver from '@salesforce/resourceUrl/filesaver';
import jquery from '@salesforce/resourceUrl/jquery';
import { loadScript } from 'lightning/platformResourceLoader';

export default class Wb_DataProcess extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    sObjectOptions;
    readColumns =[];
    recordData = [];
    recordKey;
    hasRecordLoaded = false;
    disableMapBtn = true;
    totalRecords = 0;
    selectedCrudValue = '';
    selectedObjectName = '';
    isLoading = false;
    fieldOptions;
    disableCrudActionBtn = false;
    selectedCrudValue = 'CREATE';
    successCount = 0;
    errorCount = 0;
    recordResponseData = [];
    disableDownloadResBtn = true;

    get crudOptions() {
        return [
            { label: 'Create', value: 'CREATE' },
            { label: 'Update', value: 'UPDATE' },
            { label: 'Delete', value: 'DELETE' },
        ];
    }
    get isCreatable(){
        return this.selectedCrudValue === 'CREATE' ? true : false;
    }
    get isUpdatable(){
        return this.selectedCrudValue === 'UPDATE' ? true : false;
    }

    connectedCallback(){
        this.fetchSObjects();
        Promise.all([
            loadScript(this, jszip),
            loadScript(this, jszipmin),
            loadScript(this, filesaver),
            loadScript(this, jquery)
        ]).then(() => console.log('Success: All Script Loaded.'))
        .catch(error => console.log('Error:',error));
    }
    handleActionChange(event){
        this.selectedCrudValue = event.target.value;
    }
    handleObjectChange(event) {
        this.selectedObjectName = event.detail.value;
        this.fetchFields();
    }
    handleCSVUpload(event){
        const files = event.detail.files;
        if (files.length > 0) {
            const file = files[0];
            this.read(file);
        }
    }
    async read(file){
        try {
            const result = await this.load(file);
            this.parseCSV(result);
        } catch (e) {
            this.error = e;
        }
    }
    async load(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.onerror = () => {
                reject(reader.error);
            };
            reader.readAsText(file);
        });
    }
    parseCSV(csv) {
        const lines = csv.split(/\r\n|\n/);
        const headers = lines[0].split(',');
        this.readColumns = headers.map((header) => {
            return { label: header, fieldName: header };
        });
        const data = [];
        lines.forEach((line, i) => {
            if (i === 0) return;
            const obj = {};
            const currentline = line.split(',');
            for (let j = 0; j < headers.length; j++) {
                if(currentline[j] !== '' && currentline[j] !== null && currentline[j] !== undefined){
                    obj[headers[j]] = currentline[j].replace(/["']/g, "");
                }
            }
            if(Object.keys(obj).length !== 0){
                data.push(obj);
            }
        });
        this.recordKey = this.readColumns[0].fieldName;
        this.recordData = data;
        this.hasRecordLoaded = true;
        this.disableMapBtn = false;
        this.totalRecords = this.recordData.length;
    }
    fetchSObjects(){
        this.isLoading = true;
		getSObjects({ userId: this.userId, apiVersion: this.apiValue})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                this.sObjectOptions = [];
                for(let item of response.sobjects){
                    if(item.queryable){
                        this.sObjectOptions.push({label: item.name, value: item.name});
                    }
                }
                this.isLoading = false;
            }else{
                this.showToastMessage('error', 'Failed to fetch sobjects:'+result);
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    fetchFields(){
        this.isLoading = true;
		getFields({ userId: this.userId, objectName: this.selectedObjectName, apiVersion: this.apiValue})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                this.fieldOptions = [];
                for(let item of response.fields){
                    this.fieldOptions.push({label: item.name, value: item.name});
                }
                this.isLoading = false;
            }else{
                this.showToastMessage('error', 'Failed to fetch fields:'+result);
            } 
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    generateRequestBody(objectName, recordData){
        let records = [];
        for(let record of recordData){
            let obj = {'attributes': {'type': objectName}};
            for (const [key, value] of Object.entries(record)) {
                obj[key] = value;
            }
            records.push(obj);
        }
        let requestBody = {'allOrNone': false, 'records': records};
        return requestBody;
    }
    performInsert(){
        this.showNotification('info','Insert request initiated, please wait!.');
        this.disableCrudActionBtn = true;
        let requestBody = this.generateRequestBody(this.selectedObjectName, this.recordData);
        this.recordResponseData = this.recordData;
        this.createRequest(requestBody);
    }
    createRequest(requestBody){
        createRecordRequest({ userId: this.userId, apiVersion: this.apiValue, jsonRequestBody: JSON.stringify(requestBody)})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                console.log('response',response);
                for(let index in response){
                    if(response[index].success){
                        this.recordResponseData[index]['Id'] = response[index].Id;
                        this.recordResponseData[index]['Sucess'] = response[index].success;
                        this.recordResponseData[index]['Error'] = '';
                        this.successCount ++;
                    }else{
                        let errorObj = response[index].errors[0];
                        this.recordResponseData[index]['Id'] = '';
                        this.recordResponseData[index]['Sucess'] = response[index].success;
                        this.recordResponseData[index]['Error'] = errorObj.message;
                        this.errorCount ++;
                    }
                }
                console.log('recordResponseData',this.recordResponseData);
                this.hideNotification();
                this.disableCrudActionBtn = false;
                this.disableDownloadResBtn = false;
            }else{
                this.showToastMessage('error', 'Failed to insert records:'+result);
            } 
		})
		.catch(error => {
			console.log('error',error);
            this.showToastMessage('error', error);
		})
    }
    performUpdate(){
        this.showNotification('info','Update request initiated, please wait!.');
        this.disableCrudActionBtn = true;
        let requestBody = this.generateRequestBody(this.selectedObjectName, this.recordData);
        this.recordResponseData = this.recordData;
        this.updateRequest(requestBody);
    }
    updateRequest(requestBody){
        updateRecordRequest({ userId: this.userId, apiVersion: this.apiValue, jsonRequestBody: JSON.stringify(requestBody)})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                console.log('response',response);
                for(let index in response){
                    if(response[index].success){
                        this.recordResponseData[index]['Sucess'] = response[index].success;
                        this.recordResponseData[index]['Error'] = '';
                        this.successCount ++;
                    }else{
                        let errorObj = response[index].errors[0];
                        this.recordResponseData[index]['Sucess'] = response[index].success;
                        this.recordResponseData[index]['Error'] = errorObj.message;
                        this.errorCount ++;
                    }
                }
                console.log('recordResponseData',this.recordResponseData);
                this.hideNotification();
                this.disableCrudActionBtn = false;
                this.disableDownloadResBtn = false;
            }else{
                this.showToastMessage('error', 'Failed to update records:'+result);
            } 
		})
		.catch(error => {
			console.log('error',error);
            this.showToastMessage('error', error);
		})
    }
    generateRequestIds(recordData){
        let ids = '';
        for(let index in recordData){
            ids = ids + recordData[index].Id;
            if(index == (recordData.length - 1)){ 
                ids =  ids + '&allOrNone=false';
            }else{
                ids = ids + ',';
            }
        }
        return ids;
    }
    performDelete(){
        this.showNotification('info','Delete request initiated, please wait!.');
        this.disableCrudActionBtn = true;
        let requestIds = this.generateRequestIds(this.recordData);
        this.recordResponseData = this.recordData;
        this.deleteRequest(requestIds);
    }
    deleteRequest(requestIds){
        deleteRecordRequest({ userId: this.userId, apiVersion: this.apiValue, jsonRequestBody: requestIds})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                console.log('response',response);
                for(let index in response){
                    if(response[index].success){
                        this.recordResponseData[index]['Sucess'] = response[index].success;
                        this.recordResponseData[index]['Error'] = '';
                        this.successCount ++;
                    }else{
                        let errorObj = response[index].errors[0];
                        this.recordResponseData[index]['Sucess'] = response[index].success;
                        this.recordResponseData[index]['Error'] = errorObj.message;
                        this.errorCount ++;
                    }
                }
                console.log('recordResponseData',this.recordResponseData);
                this.hideNotification();
                this.disableCrudActionBtn = false;
                this.disableDownloadResBtn = false;
            }else{
                this.showToastMessage('error', 'Failed to update records:'+result);
            } 
		})
		.catch(error => {
			console.log('error',error);
            this.showToastMessage('error', error);
		})
    }
    mapColumnHeader(){

    }
    handleDownloadResponse(){
        this.disableDownloadResBtn = true;
        this.downloadCSVFileAsync(this.recordResponseData, this);
    }
    downloadCSVFileAsync(recordList, that){
        return that.generateCSVFile(recordList)
        .then(function(csvData) {
            let downloadElement = document.createElement('a');
            downloadElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvData);
            downloadElement.target = '_self';
            downloadElement.download = 'Response.csv';
            document.body.appendChild(downloadElement);
            downloadElement.click();
            that.disableDownloadResBtn = false;  
            that.showToastMessage('success', 'CSV File generated.');
        });
    }
    generateCSVFile(recordList){
        return new Promise(function(resolve) {
            let data = recordList;
            let rowEnd = '\n';
            let csvString = '';

            let rowData = new Set();
            data.forEach(function (record) {
                Object.keys(record).forEach(function (key) {
                    rowData.add(key);
                });
            });
          
            rowData = Array.from(rowData);
            csvString += rowData.join(',');
            csvString += rowEnd;
          
            for(let i=0; i < data.length; i++){
                let colValue = 0;
                for(let key in rowData) {
                    // eslint-disable-next-line no-prototype-builtins
                    if(rowData.hasOwnProperty(key)) {
                        let rowKey = rowData[key];
                        if(colValue > 0){
                            csvString += ',';
                        }
                        let value = data[i][rowKey] === undefined ? '' : data[i][rowKey];
                        csvString += '"'+ value +'"';
                        colValue++;
                    }
                }
                csvString += rowEnd;
            }
            resolve(csvString);
        });
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