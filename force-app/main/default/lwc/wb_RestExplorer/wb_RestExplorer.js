import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import restRequest from '@salesforce/apex/WB_WorkbenchHubController.restRequest';
import addRemoteSite from '@salesforce/apex/WB_WorkbenchHubController.addRemoteSite';

export default class Wb_RestExplorer extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    @track headerList;
    @track paramList;
    httpMethodValue = 'GET'; 
    urlValue = '';
    responseBody = '';
    requestBodyValue = '';
    isLoading = false;
    showAddRemoteSiteBtn = false;
    remoteSiteSuccessList = [];
    disabledExecutionBtn = false;
    authorizationTypeValue = 'OAuth2';
    headerPrefixValue = 'Bearer';
    tokenValue = '{CurrentUserToken}';
    addAuthDataValue = 'RequestHeader';
    

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
    get authorizationTypeOptions() {
        return [
            { label: 'No Auth', value: 'NoAuth' },
            { label: 'OAuth 2.0', value: 'OAuth2' }
        ];
    }
    get addAuthDataOptions() {
        return [
            { label: 'Request Headers', value: 'RequestHeader' },
            { label: 'Request URL', value: 'RequestURL' }
        ];
    }
    get isAllowedCopy(){
        return this.responseBody === '' || this.responseBody === undefined ? false : true;
    }
    get hasOAuth2(){
        return this.authorizationTypeValue === 'OAuth2' ? true : false;
    }

    connectedCallback(){
        this.urlValue = this.customDomain + '/services/data/v' + this.apiValue + '/';
        this.headerList = [{id: 1, key: 'Authorization', value: 'Bearer {CurrentUserToken}'},
                          {id: 2, key: 'Content-Type', value: 'application/json'},
                          {id: 3, key: 'Accept', value: '*/*'}];
        this.paramList = [{id: 1, key: '', value: ''}];
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
    handleAuthorizationType(event){
        this.authorizationTypeValue = event.target.value;
        let index = this.headerList.findIndex(e => e.key === 'Authorization');
        if(this.authorizationTypeValue === 'NoAuth'){
            if(index !== -1){
                this.headerList.splice(index,1);
            }
        }else{
            if(index === -1){
                this.headerList.unshift({id: this.headerList.length + 1, key: 'Authorization', value: this.headerPrefixValue + ' ' + this.tokenValue});
            }
        }
    }
    handlecOAuth2(event){
        let tageName = event.target.name;
        let tagValue = event.target.value;
        if(tageName === 'Token'){
            this.tokenValue = tagValue;
        }else{
            this.headerPrefixValue = tagValue; 
        }
        let index = this.headerList.findIndex(e => e.key === 'Authorization');
        if(index !== -1){
            this.headerList[index].value = this.headerPrefixValue + ' ' + this.tokenValue;
        }else{
            this.headerList.unshift({id: this.headerList.length + 1, key: 'Authorization', value: this.headerPrefixValue + ' ' + this.tokenValue});
        }
    }
    handleAddAuthData(event){
        this.addAuthDataValue = event.target.value;
        let index = this.headerList.findIndex(e => e.key === 'Authorization');
        if(this.addAuthDataValue === 'RequestHeader'){
            if(index === -1){
                this.headerList.unshift({id: this.headerList.length + 1, key: 'Authorization', value: this.headerPrefixValue + ' ' + this.tokenValue});
            }
            if(this.urlValue.includes('?access_token=')){
                let tokenToRemoved = this.urlValue.substring(this.urlValue.indexOf('?access_token='), this.urlValue.length);
                this.urlValue = this.urlValue.replace(tokenToRemoved, '');
            }
            else if(this.urlValue.includes('access_token=')){
                let tokenToRemoved = this.urlValue.substring(this.urlValue.indexOf('access_token='), this.urlValue.length);
                this.urlValue = this.urlValue.replace(tokenToRemoved, '');
            }
        }else{
            if(index !== -1){
                this.headerList.splice(index,1);
            }
            if(this.urlValue.includes('?')){
                this.urlValue = this.urlValue + '&access_token=' + this.tokenValue;
            }else{
                this.urlValue = this.urlValue + '?access_token=' + this.tokenValue;
            }
        }
    }
    handleAddHeaders(){
        let activeRowLen = this.headerList.length;
        if(activeRowLen < 6){
            let headerObj = {id: activeRowLen + 1, key: '', value: ''};
            this.headerList.push(headerObj);
        }else{
            this.showToastMessage('warning', 'No more headers allowed.');
        }
    }
    handleAddParams(){
        let activeRowLen = this.paramList.length;
        if(activeRowLen < 6){
            let paramObj = {id: activeRowLen+1, key: '', value: ''};
            this.paramList.push(paramObj);
        }else{
            this.showToastMessage('warning', 'No more params allowed.');
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
    handleParamKeyChange(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let param = this.paramList.find(e => e.id === selectedId);
        param.key = event.detail.value;
        this.generateQueryParams();
    }
    handleParamValueChange(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let param = this.paramList.find(e => e.id === selectedId);
        param.value = event.detail.value;
        this.generateQueryParams();
    }
    handleRemoveHeaders(){
        let selectedLastRow = this.headerList.length;
        let index = this.headerList.findIndex(e => e.id === selectedLastRow && e.key !== 'Authorization');
        if(index !== -1){
            this.headerList.splice(index,1);
        }
    }
    handleRemoveParams(){
        let selectedLastRow = this.paramList.length;
        let index = this.paramList.findIndex(e => e.id === selectedLastRow);
        if(index !== -1){
            this.paramList.splice(index,1);
        }
        this.generateQueryParams();
    }
    handleResetHeaders(){
        this.urlValue = this.customDomain + '/services/data/v' + this.apiValue + '/';
        this.httpMethodValue = 'GET';
        this.headerList = [{id: 1, key: 'Authorization', value: 'Bearer {CurrentUserToken}'},
                          {id: 2, key: 'Content-Type', value: 'application/json'},
                          {id: 3, key: 'Accept', value: '*/*'}];
        this.authorizationTypeValue = 'OAuth2';
        this.headerPrefixValue = 'Bearer';
        this.tokenValue = '{CurrentUserToken}';
        this.addAuthDataValue === 'RequestHeader';             
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
    generateQueryParams(){
        let paramValues = '';
        let endPointURL = this.urlValue.substring(0, this.urlValue.lastIndexOf('/') + 1);
        for(let index in this.paramList){
            if(this.paramList[index].key !== '' && this.paramList[index].value !== ''){
                if(Number(index) === (this.paramList.length - 1)){
                    paramValues = paramValues + this.paramList[index].key + '=' + this.paramList[index].value;
                }else{
                    paramValues = paramValues + this.paramList[index].key + '=' + this.paramList[index].value + '&';
                }
            }
        }
        if(this.urlValue.includes('?access_token')){
            this.urlValue = endPointURL + '?' + paramValues + '&' + '?access_token=' + this.tokenValue;
        }else{
            this.urlValue = endPointURL + '?' + paramValues;
        }
        if(paramValues.slice(-1) === '='){
            paramValues.replace(paramValues.slice(-1), '');
        }
        if(paramValues.slice(-1) === '&'){
            paramValues.replace(paramValues.slice(-1), '');
        }
        if(this.paramList.length === 0){
            this.urlValue = endPointURL;
        }
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
                    this.showToastMessage('warning', 'Please add this domain to Remote Site Setting for Rest Callouts.');
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
                if(result.includes('success')){
                    this.remoteSiteSuccessList.push(hostURL);
                    this.showAddRemoteSiteBtn = false;
                    this.showToastMessage('success', 'Domain added successfully to Remote Site Setting.');
                }
            }else{
                this.isLoading = false;
                this.showToastMessage('error', 'Failed to add domain to Remote Site Setting: ' + result);
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