import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import restRequest from '@salesforce/apex/WB_WorkbenchController.restRequest';
import addRemoteSite from '@salesforce/apex/WB_WorkbenchController.addRemoteSite';

export default class Wb_RestExplorer extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    @track headerList;
    httpMethodValue = 'GET'; 
    urlValue = '';
    responseBody = '';
    requestBodyValue = '';
    isLoading = false;
    showAddRemoteSiteBtn = false;
    remoteSiteSuccessList = [];
    disabledExecutionBtn = false;

    get httpMethodOptions() {
        return [
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'PATCH', value: 'PATCH' },
            { label: 'DELETE', value: 'DELETE' },
            { label: 'HEAD', value: 'HEAD' }
        ];
    }
    get isAllowedCopy(){
        return this.responseBody === '' || this.responseBody === undefined ? false : true;
    }
    get showRequestBody(){
        return this.httpMethodValue === 'GET' ? false : true;
    }

    connectedCallback(){
        this.urlValue = this.customDomain + '/services/data/v' + this.apiValue + '/';
        this.headerList = [{id: 1, key: 'Authorization', value: 'Bearer {CurrentUserToken}'},
                            {id: 2, key: 'Accept', value: '*/*'},
                            {id: 3, key: 'Content-Type', value: 'application/json'}];
    }

    handleUrlChange(event){
        this.urlValue = event.target.value;
    }
    handleRequestBodyChange(event){
        this.requestBodyValue = event.target.value;
    }
    handleMethodChange(event){
        this.httpMethodValue = event.target.value;
    }
    handleAddHeaders(){
        let activeRowLen = this.headerList.length;
        if(activeRowLen < 6){
            let headerObj = {id: activeRowLen+1, key: '', value: ''};
            this.headerList.push(headerObj);
        }else{
            this.showToastMessage('warning', 'No more headers allowed.');
        }
    }
    handleHeaderKeyChange(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let header = this.headerList.find(e => e.id === selectedId);
        header.key = event.detail.value;
    }
    handleHeaderValueChange(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let header = this.headerList.find(e => e.id === selectedId);
        header.value = event.detail.value;
    }
    handleRemoveHeaders(){
        let selectedLastRow = this.headerList.length;
        let index = this.headerList.findIndex(e => e.id === selectedLastRow);
        this.headerList.splice(index,1);
    }
    handleReset(){
        this.urlValue = this.customDomain + '/services/data/v' + this.apiValue + '/';
        this.httpMethodValue = 'GET';
        this.headerList = [];
        let headers = [{id: 1, key: 'Authorization', value: 'Bearer {CurrentUserToken}'},
                        {id: 2, key: 'Accept', value: '*/*'},
                        {id: 3, key: 'Content-Type', value: 'application/json'}];
        this.headerList = headers;                
    }
    generateRestParams(){
        let headerValues = [];
        for(let header of this.headerList){
            headerValues.push({key: header.key, value: header.value});
        }
        this.urlValue = this.urlValue.replace("\n","");
        this.urlValue = this.urlValue.replace("\t","");
        let restParams = {httpMethod: this.httpMethodValue, endPointURL: this.urlValue, restHeaders: headerValues, requestBody: this.requestBodyValue};
        return restParams;
    }
    handleRestRequest(){
        let params = this.generateRestParams();
        let validate = this.handleHeadersValidation(this.headerList);
        if(validate){
            if(this.urlValue.includes(this.customDomain)){
                this.executeRestRequest(params);
            }else{
                let aTag = document.createElement('a');
                aTag.href = this.urlValue;
                let hostURL = 'https://' + aTag.hostname;
                if(!this.remoteSiteSuccessList.includes(hostURL)){
                    this.showToastMessage('warning', 'Please add this hostname to Remote Site Setting for rest callout.');
                    this.showAddRemoteSiteBtn = true;
                    this.removeCurrentToken();
                }else{
                    this.showAddRemoteSiteBtn = false;
                    this.executeRestRequest(params);
                }
            }
        }else{
            this.showToastMessage('warning', 'Headers can not have blank key or values.');
        }
    }
    handleRemoteSite(){
        let aTag = document.createElement('a');
        aTag.href = this.urlValue;
        let hostURL = 'https://' + aTag.hostname;
        this.addURLToRemoteSiteSetting(hostURL);
    }
    addURLToRemoteSiteSetting(hostURL){
        this.isLoading = true;
        addRemoteSite({userId: this.userId, name:'WB_ExternalSite_', hostURL: hostURL})
        .then(result => {
            if(result){
                this.isLoading = false;
                if(result === 'success'){
                    this.remoteSiteSuccessList.push(hostURL);
                    this.showAddRemoteSiteBtn = false;
                    this.showToastMessage('success', 'Sucessfully added to Remote Site Setting.');
                }
            }else{
                this.isLoading = false;
                this.showToastMessage('error', 'Failed to add to Remote Site Setting:'+result);
            }
        })
        .catch(error => {
            this.isLoading = false;
            console.log('error',error);
            this.showToastMessage('error', error);
        })
    }
    executeRestRequest(restParams){
        this.isLoading = true;
        restRequest({userId: this.userId, restParamsJson: JSON.stringify(restParams)})
		.then(result => {
            if(result){
                this.isLoading = false;
                let response = JSON.parse(result);
                let responseBodyTemp;
                if(this.isValidJson(response.body)){
                    responseBodyTemp = {status: response.status, statusCode: response.statusCode, body: JSON.parse(response.body)};
                }else{
                    responseBodyTemp = response;
                }
                this.responseBody = JSON.stringify(responseBodyTemp, null, 4);
            }else{
                this.isLoading = false;
                this.showToastMessage('error', 'Failed to execute rest request:'+result);
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
    }
    removeCurrentToken(){
        for(let item of this.headerList){
            if(item.value.includes('{CurrentUserToken}')){
                item.value = 'token_removed';
            }
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
    handleCopyResponse(){
        let content = this.refs.responseContent;
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
    handleHeadersValidation(headerList){
        let validate = true;
        for(let item of headerList){
            if(item.key === '' || item.value === ''){
                validate = false;
                break;
            }
        }
        return validate;
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