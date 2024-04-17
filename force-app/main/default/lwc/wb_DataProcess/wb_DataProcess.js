import { LightningElement, api, track } from 'lwc';
import getSObjects from '@salesforce/apex/WB_WorkbenchHubController.getAllSObjects';
import getFields from '@salesforce/apex/WB_WorkbenchHubController.getAllFields';
import createRecordRequest from '@salesforce/apex/WB_WorkbenchHubController.createRecordRequest';
import updateRecordRequest from '@salesforce/apex/WB_WorkbenchHubController.updateRecordRequest';
import deleteRecordRequest from '@salesforce/apex/WB_WorkbenchHubController.deleteRecordRequest';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import jszip from '@salesforce/resourceUrl/jszip';
import jszipmin from '@salesforce/resourceUrl/jszipmin';
import filesaver from '@salesforce/resourceUrl/filesaver';
import jquery from '@salesforce/resourceUrl/jquery';
import { loadScript } from 'lightning/platformResourceLoader';
import dataMapModal from 'c/wb_DataMap';
import LightningConfirm from 'lightning/confirm';

export default class Wb_DataProcess extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    @track recordDataDraft;
    sObjectOptions;
    recordColumns =[];
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
    fieldList = [];
    previousRecordList =[];
    hasAdvanceEdit = false;
    fileData;
    maxBatchSize = 200;
    currentBatchSize = 0;
    disableAbortBtn = true;
    hasProcessAborted = false;

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
        this.disableDownloadResBtn = true;
    }
    handleObjectChange(event) {
        this.selectedObjectName = event.detail.value;
        this.fetchFields();
        this.disableDownloadResBtn = true;
    }
    handleCSVUpload(event){
        this.isLoading = true;
        const files = event.detail.files;
        if (files.length > 0) {
            const file = files[0];
            this.fileData = {
                'filename': file.name
            };
            this.read(file);
        }
    }
    handleInputChange(event) {
        let tagName = event.currentTarget.name;
        if(tagName === 'AdvanceEdit'){
            this.hasAdvanceEdit = event.currentTarget.checked;
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
        this.recordColumns = headers.map((header) => {
            return { label: header, fieldName: header, type: 'text', editable: true};
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
                obj['uniqueKey'] = Number(i);
                data.push(obj);
            }
        });
        //console.log('data',data);
        this.recordKey = 'uniqueKey';
        this.recordData = data;
        this.recordResponseData = this.recordData;
        this.hasRecordLoaded = true;
        this.disableMapBtn = false;
        this.disableCrudActionBtn = false;
        this.disableDownloadResBtn = true;
        this.totalRecords = this.recordData.length;
        this.previousRecordList = [];
        this.currentBatchSize = 0;
        this.isLoading = false;
    }
    async handleInLineSave(event){
        const records = event.detail.draftValues;
        let overrideMap = new Map();
        let appendMap = new Map();
        for(let item of records){
            let selectedId = Number(item.uniqueKey);
            let data = this.recordData.find(e => e.uniqueKey == selectedId);
            for (const [key, value] of Object.entries(data)) {
                if(key !== 'uniqueKey' && item.hasOwnProperty(key)){
                    data[key] = item[key];
                    if(this.hasAdvanceEdit && item[key].includes('*[') && item[key].includes(']*')){
                        if(item[key].indexOf('*[') === 0 && item[key].indexOf(']*') === item[key].length-2){
                            overrideMap.set(key,item[key].substring(item[key].indexOf('*[')+2, item[key].indexOf(']*')));
                        }else{
                            appendMap.set(key,item[key].substring(item[key].indexOf('*[')+2, item[key].indexOf(']*')));
                            data[key] = item[key].replace(item[key].substring(item[key].indexOf('*['), item[key].indexOf(']*')+2),'');
                        }
                    }
                }
            }
            if(overrideMap.size > 0){
                this.overrideRecord(overrideMap);
            }
            if(appendMap.size > 0){
                this.appendRecord(appendMap);
            }
        }
        this.recordDataDraft = [];
    }
    overrideRecord(overrideMap){
        let index = 0;
        for(let recObj of this.recordData){
            for (const [key, value] of Object.entries(recObj)) {
                if(overrideMap.has(key)){
                    let val = overrideMap.get(key);
                    if(val.includes('{') && val.includes('}')){
                        let num = Number(val.substring(val.indexOf('{')+1, val.indexOf('}')));
                        val = val.replace(val.substring(val.indexOf('{'), val.indexOf('}')+1), num+index);
                    }
                    recObj[key] = val;
                }
            }
            index ++;
        }
    }
    appendRecord(appendMap){
        let index = 0;
        let replaceMap = new Map();
        for(let recObj of this.recordData){
            for (const [key, value] of Object.entries(recObj)) {
                if(appendMap.has(key)){
                    let val = appendMap.get(key);
                    if(val.includes('{') && val.includes('}') && !(val.includes('(') && val.includes(',') && val.includes(')'))){
                        let num = Number(val.substring(val.indexOf('{')+1, val.indexOf('}')));
                        val = val.replace(val.substring(val.indexOf('{'), val.indexOf('}')+1), num+index);
                    }
                    recObj[key] = value + val;
                    if(val.includes('(') && val.includes(',') && val.includes(')')){
                        let repString = val.substring(val.indexOf('(')+1, val.indexOf(')'));
                        replaceMap.set(key, {searchValue: repString.substring(0, repString.indexOf(',')), newValue: repString.substring(repString.indexOf(',')+1, repString.length)});
                        recObj[key] = recObj[key].replace(recObj[key].substring(recObj[key].indexOf('('), recObj[key].indexOf(')')+1),'');
                    }
                }
            }
            index ++;
        }
        if(replaceMap.size > 0){
            this.replaceRecord(replaceMap);
        }
    }
    replaceRecord(replaceMap){
        let index = 0;
        for(let recObj of this.recordData){
            for (const [key, value] of Object.entries(recObj)) {
                if(replaceMap.has(key)){
                    let searchValue = replaceMap.get(key).searchValue;
                    let newValue = replaceMap.get(key).newValue;
                    recObj[key] = value.replaceAll(searchValue, newValue);
                    if(recObj[key].includes('{') && recObj[key].includes('}')){
                        let num = Number(recObj[key].substring(recObj[key].indexOf('{')+1, recObj[key].indexOf('}')));
                        recObj[key] = recObj[key].replace(recObj[key].substring(recObj[key].indexOf('{'), recObj[key].indexOf('}')+1), num+index);
                    }
                }
            }
            index ++;
        }
    }
    handleAbortProcess(){
        this.hasProcessAborted = true;
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
                    this.fieldList.push(item.name);
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
                if(key !== 'uniqueKey' && key !== 'Sucess' && key !== 'Error'){
                    obj[key] = value;
                }
            }
            records.push(obj);
        }
        let requestBody = {'allOrNone': false, 'records': records};
        return requestBody;
    }
    async performInsert(){
        let validate = this.dataValidation(this.selectedCrudValue, this.selectedObjectName, this.recordResponseData);
        if(validate.value){
            const hasConfirmed = await this.handleConfirmClick('Do you want to insert these records?');
            if(hasConfirmed){
                this.showNotification('info','Insert request initiated, please wait!.');
                this.disableCrudActionBtn = true;
                this.successCount = 0;
                this.errorCount = 0;
                this.createRequest();
            }
        }else{
            this.showToastMessage('warning', validate.message);
        }
    }
    createRequestBatch(requestBody){
        if(this.hasProcessAborted){ 
            this.showToastMessage('success', 'Aborted successfully.'); 
            this.disableAbortBtn = true;
            return; 
        };
        createRecordRequest({ userId: this.userId, apiVersion: this.apiValue, jsonRequestBody: JSON.stringify(requestBody)})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                //console.log('response',response);
                for(let index in response){
                    if(response[index].success){
                        this.recordResponseData[index]['Id'] = response[index].Id;
                        this.recordResponseData[index]['Sucess'] = response[index].success;
                        this.recordResponseData[index]['Error'] = '';
                        this.successCount ++;
                    }else{
                        let errorObj = response[index].errors[0];
                        if(!this.recordResponseData[index].hasOwnProperty('Id')){
                            this.recordResponseData[index]['Id'] = '';
                        }
                        this.recordResponseData[index]['Sucess'] = response[index].success;
                        this.recordResponseData[index]['Error'] = errorObj.message;
                        this.errorCount ++;
                    }
                }
                //console.log('recordResponseData',this.recordResponseData);
                if(this.recordResponseData.length > this.currentBatchSize){
                    this.createRequest();
                }else{
                    this.hideNotification();
                    this.disableCrudActionBtn = false;
                    this.disableDownloadResBtn = false;
                }
            }else{
                this.showToastMessage('error', 'Failed to insert records:'+result);
            } 
		})
		.catch(error => {
			console.log('error',error);
            this.showToastMessage('error', JSON.stringify(error));
		})
    }
    createRequest(){
        let recordChunks = [];
        for(let i = this.currentBatchSize; i < (this.maxBatchSize + this.currentBatchSize); i++){
            if(i === this.recordResponseData.length){
                break;
            }
            recordChunks.push(this.recordResponseData[i]);
            this.currentBatchSize = i + 1;
        }
        this.showNotification('info','Processing on '+ this.currentBatchSize + ' records of '+this.recordResponseData.length);
        let requestBody = this.generateRequestBody(this.selectedObjectName, recordChunks);
        this.disableAbortBtn = false;
        this.createRequestBatch(requestBody);
    }
    async performUpdate(){
        let validate = this.dataValidation(this.selectedCrudValue, this.selectedObjectName, this.recordResponseData);
        if(validate.value){
            let hasConfirmed = await this.handleConfirmClick('Do you want to update these records?');
            if(hasConfirmed){
                this.showNotification('info','Update request initiated, please wait!.');
                this.disableCrudActionBtn = true;
                this.successCount = 0;
                this.errorCount = 0;
                this.updateRequest();
            }
        }else{
            this.showToastMessage('warning', validate.message);
        }
    }
    updateRequestBatch(requestBody){
        if(this.hasProcessAborted){ 
            this.showToastMessage('success', 'Aborted successfully.'); 
            this.disableAbortBtn = true;
            return; 
        };
        updateRecordRequest({ userId: this.userId, apiVersion: this.apiValue, jsonRequestBody: JSON.stringify(requestBody)})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                //console.log('response',response);
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
                //console.log('recordResponseData',this.recordResponseData);
                if(this.recordResponseData.length > this.currentBatchSize){
                    this.updateRequest();
                }else{
                    this.hideNotification();
                    this.disableCrudActionBtn = false;
                    this.disableDownloadResBtn = false;
                }
            }else{
                this.showToastMessage('error', 'Failed to update records:'+result);
            } 
		})
		.catch(error => {
			console.log('error',error);
            this.showToastMessage('error', JSON.stringify(error));
		})
    }
    updateRequest(){
        let recordChunks = [];
        for(let i = this.currentBatchSize; i < (this.maxBatchSize + this.currentBatchSize); i++){
            if(i === this.recordResponseData.length){
                break;
            }
            recordChunks.push(this.recordResponseData[i]);
            this.currentBatchSize = i + 1;
        }
        this.showNotification('info','Processing on '+ this.currentBatchSize + ' records of '+this.recordResponseData.length);
        let requestBody = this.generateRequestBody(this.selectedObjectName, recordChunks);
        this.disableAbortBtn = false;
        this.updateRequestBatch(requestBody);
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
    async performDelete(){
        let validate = this.dataValidation(this.selectedCrudValue, this.selectedObjectName, this.recordResponseData);
        if(validate.value){
            let hasConfirmed = await this.handleConfirmClick('Do you want to delete these records?');
            if(hasConfirmed){
                this.showNotification('info','Delete request initiated, please wait!.');
                this.disableCrudActionBtn = true;
                this.successCount = 0;
                this.errorCount = 0;
                this.deleteRequest();
            }
        }else{
            this.showToastMessage('warning', validate.message);
        }
    }
    deleteRequestBatch(requestIds){
        if(this.hasProcessAborted){ 
            this.showToastMessage('success', 'Aborted successfully.'); 
            this.disableAbortBtn = true;
            return; 
        };
        deleteRecordRequest({ userId: this.userId, apiVersion: this.apiValue, jsonRequestBody: requestIds})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                //console.log('response',response);
                for(let index in response){
                    if(!response[index].hasOwnProperty('errorCode')){
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
                    }else{
                        this.showToastMessage('error', response[index].message);
                        break;
                    }
                }
                //console.log('recordResponseData',this.recordResponseData);
                if(this.recordResponseData.length > this.currentBatchSize){
                    this.deleteRequest();
                }else{
                    this.hideNotification();
                    this.disableCrudActionBtn = false;
                    this.disableDownloadResBtn = false;
                }
            }else{
                this.showToastMessage('error', 'Failed to delete records:'+result);
            } 
		})
		.catch(error => {
			console.log('error',error);
            this.showToastMessage('error', JSON.stringify(error));
		})
    }
    deleteRequest(){
        let recordChunks = [];
        for(let i = this.currentBatchSize; i < (this.maxBatchSize + this.currentBatchSize); i++){
            if(i === this.recordResponseData.length){
                break;
            }
            recordChunks.push(this.recordResponseData[i]);
            this.currentBatchSize = i + 1;
        }
        this.showNotification('info','Processing on '+ this.currentBatchSize + ' records of '+this.recordResponseData.length);
        let requestIds = this.generateRequestIds(recordChunks);
        this.disableAbortBtn = false;
        this.deleteRequestBatch(requestIds);
    }
    dataValidation(operationType, objectName, recordData){
        let validate = {value: true, message: ''};
        switch (operationType) {
            case 'CREATE': 
            case 'UPDATE':
                if(objectName === null || objectName === ''){
                    validate.value = false;
                    validate.message = 'Please select object.';
                }
                if(recordData === null || recordData.length === 0){
                    validate.value = false;
                    validate.message = 'Please upload csv file.';
                }
                break;
            case 'DELETE':
                if(recordData === null || recordData.length === 0){
                    validate.value = false;
                    validate.message = 'Please upload csv file.';
                }
                break;
            default: 
                validate.value = true;
                validate.message = '';
        }
        return validate;
    }
    
    async mapColumnHeader(){
        let validate = this.dataValidation(this.selectedCrudValue, this.selectedObjectName, this.recordResponseData);
        if(validate.value){
            const result = await dataMapModal.open({
                size: 'medium',
                description: 'Column Mapping',
                recordList: this.recordColumns,
                fieldList: this.fieldList,
                previousRecordList: this.previousRecordList,
                recordResponseList: this.recordResponseData,
                fieldOptions: this.fieldOptions,
            });
            if(result && result !== ''){
                this.recordResponseData = result.finalMappedDataList;
                this.previousRecordList = result.previousRecordList;
                this.recordData = this.recordResponseData;
                this.recordColumns = this.previousRecordList;
                //console.log('finalMappedDataList',result.finalMappedDataList);
                //console.log('previousRecordList',result.previousRecordList);
            }
        }else{
            this.showToastMessage('warning', validate.message);
        }
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
                    if(key !== 'uniqueKey'){
                        rowData.add(key);
                    }
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
    async handleConfirmClick(message) {
        const result = await LightningConfirm.open({
            message: message,
            variant: 'header',
            label: 'Confirmation',
            theme:'info',
        });
        return result;
    }
}