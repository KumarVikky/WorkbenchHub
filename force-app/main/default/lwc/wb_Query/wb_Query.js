import { LightningElement, api, track } from 'lwc';
import getSObjects from '@salesforce/apex/WB_WorkbenchHubController.getAllSObjects';
import getFields from '@salesforce/apex/WB_WorkbenchHubController.getAllFields';
import getRecords from '@salesforce/apex/WB_WorkbenchHubController.getAllRecords';
import getRecordsBatch from '@salesforce/apex/WB_WorkbenchHubController.getAllRecordsBatch';
import getListView from '@salesforce/apex/WB_WorkbenchHubController.getAllListViews';
import getListViewRecord from '@salesforce/apex/WB_WorkbenchHubController.getListViewRecords';
import getListViewRecordBatch from '@salesforce/apex/WB_WorkbenchHubController.getListViewRecordsBatch';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import advanceFilterModal from 'c/wb_AdvanceFilterModal';
import advanceSortModal from 'c/wb_AdvanceSortModal';

export default class Wb_Query extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    @track sObjectOptions;
    @track fieldOptions;
    @track filterByFieldOptions;
    @track sortByFieldOptions;
    @track supportedScopeOptions;
    @track listViewOptions;
    @track selectedFilterBy;
    @track selectedSortBy;
    @track recordList;
    @track recordColumns;
    @track interval;
    @track soqlHistoryOptions;
    previousSelectedMultiFilter;
    previousSelectedMultiSort;
    previousSelectedCondition;
    previousCustomConditionValue;
    queryString;
    multiFilterString;
    multiSortString;
    manualQueryString;
    queryStringURI;
    isLoading = false;
    selectedObjectName;
    selectedFieldName;
    recordKey;
    hasRecords = false;
    hasListViewDisable = true;
    hasListViewActive = false;
    maxRecordLimit = 200;
    objectNameFromQuery;
    fieldTypeMap;
    progressValue = 0;
    progressVariant = 'active-step';
    multiFilterIcon = 'utility:add';
    multiSortIcon = 'utility:add';
    selectedSupportedScope;
    selectedNullSequence = 'NULLS FIRST';
    selectedListView;
    showQueryHistory = false;
    showSoqlHistoryOpt = false;
    selectedSoqlHistory;
    _showDownloadBtn = false;
    fieldsPicklistOptionsMap;
    disableAbortBtn = true;
    hasProcessAborted = false;

    get totalRecords(){
        return this.recordList.length;
    }

    get disableDownloadBtn(){
        return (this.recordList && this.recordList.length > 0 && this._showDownloadBtn === false ? false : true);
    }
    set disableDownloadBtn(val){
        this._showDownloadBtn = val;
    }

    get disableFilterOpt(){
        return (this.selectedFieldName && this.selectedFieldName.length > 0 ? false : true);
    }
    
    get sortOptions() {
        return [
            { label: 'A to Z', value: 'ASC' },
            { label: 'Z to A', value: 'DESC' },
        ];
    }
    get filterByOptions() {
        return [
            { label: 'Equals', value: '=' },
            { label: 'Not Equals', value: '!=' },
            { label: 'Starts With', value: 'startsWith' },
            { label: 'Ends With', value: 'endsWith' },
            { label: 'Contains', value: 'contains' },
            { label: 'IN', value: 'in' },
            { label: 'NOT IN', value: 'not-in' },
            { label: 'Greater than', value: '>' },
            { label: 'Less than', value: '<' },
            { label: 'Greater than or equal to', value: '>=' },
            { label: 'Less than or equal to', value: '<=' }
        ];
    }
    get nullSequenceOptions(){
        return [
            { label: 'NULLS FIRST', value: 'NULLS FIRST' },
            { label: 'NULLS LAST', value: 'NULLS LAST' },
        ];
    }

    connectedCallback(){
        this.selectedFilterBy = {selectedField : '', selectedOperator : '=', selectedValue : '', hasPicklistValue: false, picklistOptions: []};
        this.selectedSortBy = {selectedField : '', selectedOperator : 'ASC'};
        this.fetchSObjects();
        this.soqlHistoryOptions = [];
    }
    disconnectedCallback() {
        clearInterval(this.interval);
    }

    handleSortByFields(event){
        this.selectedSortBy.selectedField = event.detail.value;
        this.previousSelectedMultiSort[0].selectedField = event.detail.value;
        this.generateQuery();
    }
    handleSortOrder(event) {
        this.selectedSortBy.selectedOperator = event.detail.value;
        this.previousSelectedMultiSort[0].selectedOperator = event.detail.value;
        this.generateQuery();
    }
    handleFilterByValue(event){
        this.selectedFilterBy.selectedValue = event.detail.value;
        this.previousSelectedMultiFilter[0].selectedValue = event.detail.value;
        this.generateQuery();
    }
    handleFilterByOption(event){
        this.selectedFilterBy.selectedOperator = event.detail.value;
        this.previousSelectedMultiFilter[0].selectedOperator = event.detail.value;
        this.generateQuery();
    }
    handleFilterByFields(event) {
        this.selectedFilterBy.selectedField = event.detail.value;
        if(this.fieldsPicklistOptionsMap.has(event.detail.value)){
            this.selectedFilterBy.hasPicklistValue = true;
            this.selectedFilterBy.picklistOptions = this.fieldsPicklistOptionsMap.get(event.detail.value);
        }else{
            this.selectedFilterBy.hasPicklistValue = false;
            this.selectedFilterBy.picklistOptions = [];
        }
        this.selectedFilterBy.selectedValue = '';
        this.previousSelectedMultiFilter[0].selectedField = this.selectedFilterBy.selectedField
        this.previousSelectedMultiFilter[0].hasPicklistValue = this.selectedFilterBy.hasPicklistValue;
        this.previousSelectedMultiFilter[0].picklistOptions = this.selectedFilterBy.picklistOptions;
        this.previousSelectedMultiFilter[0].selectedValue = this.selectedFilterBy.selectedValue;
        this.generateQuery();
    }
    handleMaxRecord(event) {
        this.maxRecordLimit = event.detail.value;
        this.generateQuery();
        this.generateScopeQuery();
    }
    handleObjectChange(event) {
        this.selectedObjectName = event.detail.value;
        this.fetchFields();
        this.queryString = '';
        this.manualQueryString = '';
        this.selectedFieldName = [];
        this.hasRecords = false;
        this.selectedFilterBy = {selectedField : '', selectedOperator : '=', selectedValue : '', hasPicklistValue: false, picklistOptions: []};
        this.selectedSortBy = {selectedField : '', selectedOperator : 'ASC'};
        this.previousSelectedMultiFilter = [{id: 1, selectedField : '', selectedOperator : '=', selectedValue : '', hasPicklistValue: false, picklistOptions: []}];
        this.previousSelectedMultiSort = [{id: 1, selectedField : '', selectedOperator : 'ASC'}];
        this.multiFilterIcon = 'utility:add';
        this.multiSortIcon = 'utility:add';
        this.multiSortString = undefined;
        this.multiFilterString = undefined;
        this.selectedSupportedScope = '';
    }
    handleFieldChange(event) {
        this.selectedFieldName = event.detail.value;
        this.generateQuery();
    }
    handleScopeChange(event){
        this.selectedSupportedScope = event.detail.value;
        this.generateScopeQuery();
    }
    handleNullSequence(event){
        this.selectedNullSequence = event.detail.value;
        this.generateQuery();
    }
    handleListViewChange(event){
        this.selectedListView = event.detail.value;
        this.fetchListViewRecords();
    }
    handleResetAllFilters(){
        this.selectedFilterBy = {selectedField : '', selectedOperator : '=', selectedValue : '', hasPicklistValue: false, picklistOptions: []};
        this.selectedSortBy = {selectedField : '', selectedOperator : 'ASC'};
        this.previousSelectedMultiFilter = [{id: 1, selectedField : '', selectedOperator : '=', selectedValue : '', hasPicklistValue: false, picklistOptions: []}];
        this.previousSelectedMultiSort = [{id: 1, selectedField : '', selectedOperator : 'ASC'}];
        this.previousSelectedCondition = '';
        this.previousCustomConditionValue = '';
        this.multiFilterIcon = 'utility:add';
        this.multiSortIcon = 'utility:add';
        this.multiSortString = undefined;
        this.multiFilterString = undefined;
        this.selectedSupportedScope = '';
        this.selectedListView = '';
        this.generateQuery();
    }
    async handleAdvanceFilter(){
        if(this.selectedFieldName  && this.selectedFieldName.length > 0){
            const result = await advanceFilterModal.open({
                size: 'medium',
                description: 'Multi-level filter modal',
                multiFilterByFieldOptions: this.filterByFieldOptions,
                multiFilterByOptions: this.filterByOptions,
                fieldTypeMap: this.fieldTypeMap,
                fieldsPicklistOptionsMap: this.fieldsPicklistOptionsMap,
                previousSelectedMultiFilter: this.previousSelectedMultiFilter,
                previousSelectedCondition: this.previousSelectedCondition,
                previousCustomConditionValue: this.previousCustomConditionValue
            });
            if(result && result.whereString && result.whereString !== ''){
                this.multiFilterString = result.whereString
                this.generateQuery();
            }
            if(result && result.allSelectedMultiFilter && result.allSelectedMultiFilter !== null){
                this.multiFilterIcon = 'utility:check';
                this.previousSelectedMultiFilter = result.allSelectedMultiFilter;  
                this.previousSelectedCondition = result.selectedCondition;
                this.previousCustomConditionValue = result.selectedConditionValue;
                this.selectedFilterBy.selectedField = this.previousSelectedMultiFilter[0].selectedField;
                this.selectedFilterBy.selectedOperator = this.previousSelectedMultiFilter[0].selectedOperator;
                this.selectedFilterBy.selectedValue = this.previousSelectedMultiFilter[0].selectedValue;
                this.selectedFilterBy.hasPicklistValue = this.previousSelectedMultiFilter[0].hasPicklistValue;
                this.selectedFilterBy.picklistOptions = this.previousSelectedMultiFilter[0].picklistOptions;
            }
        }else{
            this.showToastMessage('warning', 'Please select fields to apply.');
        }  
    }
    async handleAdvanceSort(){
        if(this.selectedFieldName  && this.selectedFieldName.length > 0){
            const result = await advanceSortModal.open({
                size: 'medium',
                description: 'Multi-level sort modal',
                multiSortByFieldOptions: this.sortByFieldOptions,
                multiSortByOptions: this.sortOptions,
                previousSelectedMultiSort: this.previousSelectedMultiSort,
            });
            if(result && result.whereString && result.whereString !== ''){
                this.multiSortString = result.whereString
                this.generateQuery();
            }
            if(result && result.allSelectedMultiSort && result.allSelectedMultiSort !== null){
                this.multiSortIcon = 'utility:check';
                this.previousSelectedMultiSort = result.allSelectedMultiSort;  
                this.selectedSortBy.selectedField =  this.previousSelectedMultiSort[0].selectedField;
                this.selectedSortBy.selectedOperator = this.previousSelectedMultiSort[0].selectedOperator;
            }
        }else{
            this.showToastMessage('warning', 'Please select fields to apply.');
        }
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
                this.fetchListView();
                let response = JSON.parse(result);
                this.fieldOptions = [];
                this.sortByFieldOptions = [];
                this.filterByFieldOptions = [];
                this.fieldsPicklistOptionsMap = new Map();
                this.fieldTypeMap = new Map();
                for(let item of response.fields){
                    this.fieldOptions.push({label: item.name, value: item.name});
                    if(item.sortable){
                        this.sortByFieldOptions.push({label: item.name, value: item.name});
                    }
                    if(item.filterable){
                        this.filterByFieldOptions.push({label: item.name, value: item.name});
                    }
                    if(item.picklistValues != null && item.picklistValues.length > 0){
                        this.getAllPicklistValues(item.name, item.picklistValues);
                    }
                    this.fieldTypeMap.set(item.name, item.type);
                }
                let supportedList = [];
                for(let item of response.supportedScopes){
                    supportedList.push({label: item.label, value: item.name});
                }
                this.supportedScopeOptions = supportedList;
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
    getAllPicklistValues(name, picklistValues){
        let picklistOption = [];
        for(let item of picklistValues){
            picklistOption.push({label: item.label, value: item.value});
        }
        this.fieldsPicklistOptionsMap.set(name, picklistOption);
    }
    handleManualQuery(event) {
        this.manualQueryString = event.detail.value;
        this.generateManualQuery();
    }
    handleQuery(){
        if(this.queryString && this.queryString !== ''){
            let queryString = this.queryString.toLowerCase();
            if(queryString.includes('from')){
                let objectName = 'Record';
                let afterFromChar = queryString.substring(queryString.indexOf("from") + 4).trimStart();
                if(afterFromChar.includes(' ')){
                    objectName = afterFromChar.split(' ').shift();
                }else{
                    objectName = afterFromChar;
                }
                this.objectNameFromQuery = this.generateCapitalizedText(objectName);
                this.fetchSOQLRecords();
            }
        }else{
            this.showToastMessage('warning', 'Please select fields or type query manually.');
        }
    }
    handleQueryHistory(){
        if(this.showSoqlHistoryOpt){
            this.showSoqlHistoryOpt = false;
        }else{
            this.showSoqlHistoryOpt = true;
        }
    }
    handleAbortProcess(){
        this.hasProcessAborted = true;
    }
    handleSoqlHistoryChange(event){
        this.selectedSoqlHistory = event.detail.value;
        this.showSoqlHistoryOpt = false;
        this.queryString = this.selectedSoqlHistory;
    }
    generateManualQuery() {
        if(this.manualQueryString && this.manualQueryString !== ''){
            let queryString = this.manualQueryString.toLowerCase();
            if(queryString.includes('select') && queryString.includes('from')){
                this.queryString = this.manualQueryString;
            }
        }else{
            this.showToastMessage('warning', 'Please select fields or type query manually.');
            this.queryString = '';
        }
    }
    generateQuery(){
        let fieldNames = this.selectedFieldName;
        let objectName = this.selectedObjectName;
        // eslint-disable-next-line no-useless-concat 
        this.queryString = 'SELECT' + ' ' + fieldNames.join(', ') + ' ' + 'FROM' + ' ' + objectName;
        if(this.selectedFilterBy.selectedField && this.selectedFilterBy.selectedOperator && this.selectedFilterBy.selectedValue && this.multiFilterString === undefined){
            this.queryString = this.generateFilterByQuery(this.selectedFilterBy, this.queryString);
        }
        if(this.multiFilterString && this.multiFilterString !== ''){
            // eslint-disable-next-line no-useless-concat
            this.queryString = this.queryString + ' ' + 'WHERE' + ' ' + this.multiFilterString;
        }
        if(this.selectedSortBy.selectedField && this.selectedSortBy.selectedOperator && this.multiSortString === undefined){
            // eslint-disable-next-line no-useless-concat
            this.queryString = this.queryString + ' ' + 'ORDER BY' + ' ' + this.selectedSortBy.selectedField + ' ' + this.selectedSortBy.selectedOperator + ' ' + this.selectedNullSequence;
        }
        if(this.multiSortString && this.multiSortString !== ''){
            // eslint-disable-next-line no-useless-concat
            this.queryString = this.queryString + ' ' + 'ORDER BY' + ' ' + this.multiSortString + ' ' + this.selectedNullSequence;
        }
        if(this.maxRecordLimit){
            // eslint-disable-next-line no-useless-concat 
            this.queryString =  this.queryString + ' ' + 'LIMIT' + ' ' + this.maxRecordLimit;
        }
        //console.log('queryString'+this.queryString);
    }
    generateScopeQuery(){
        let fieldNames = this.selectedFieldName;
        let objectName = this.selectedObjectName;
        if(this.selectedSupportedScope && this.selectedSupportedScope !== ''){
            // eslint-disable-next-line no-useless-concat 
            if(this.maxRecordLimit){
                // eslint-disable-next-line no-useless-concat
                this.queryString = 'SELECT' + ' ' + fieldNames.join(', ') + ' ' + 'FROM' + ' ' + objectName + ' ' + 'USING SCOPE' + ' ' + this.selectedSupportedScope + ' ' + 'LIMIT' + ' ' + this.maxRecordLimit; 
            }else{
                // eslint-disable-next-line no-useless-concat
                this.queryString = 'SELECT' + ' ' + fieldNames.join(', ') + ' ' + 'FROM' + ' ' + objectName + ' ' + 'USING SCOPE' + ' ' + this.selectedSupportedScope;
            }
        }
    }
    generateFilterByQuery(filterByObj, queryString){
        let fieldType = this.fieldTypeMap.get(filterByObj.selectedField);
        let withoutQuoteType = ['boolean','double','currency','int','date','datetime'];
        let tempQuery = queryString;

        if(filterByObj.selectedOperator === 'startsWith'){
            // eslint-disable-next-line no-useless-concat
            tempQuery = tempQuery + ' ' + 'WHERE' + ' ' + filterByObj.selectedField + ' ' + 'LIKE' + ' \'' + filterByObj.selectedValue + '%' + '\'';
        }else if(filterByObj.selectedOperator === 'endsWith'){
             // eslint-disable-next-line no-useless-concat
             tempQuery = tempQuery + ' ' + 'WHERE' + ' ' + filterByObj.selectedField + ' ' + 'LIKE' + ' \'' + '%' + filterByObj.selectedValue + '\'';
        }else if(filterByObj.selectedOperator === 'contains'){
            // eslint-disable-next-line no-useless-concat
            tempQuery = tempQuery + ' ' + 'WHERE' + ' ' + filterByObj.selectedField + ' ' + 'LIKE' + ' \'' + '%' + filterByObj.selectedValue + '%' + '\'';
        }else if(filterByObj.selectedOperator === 'in'){
            const valueInQuotes = filterByObj.selectedValue.split(',').map(i => "'" + i.trim() + "'").join(',');
            // eslint-disable-next-line no-useless-concat
            tempQuery = tempQuery + ' ' + 'WHERE' + ' ' + filterByObj.selectedField + ' ' + 'IN' + ' ' + '(' + valueInQuotes + ')';
        }else if(filterByObj.selectedOperator === 'not-in'){
            const valueInQuotes = filterByObj.selectedValue.split(',').map(i => "'" + i.trim() + "'").join(',');
            // eslint-disable-next-line no-useless-concat
            tempQuery = tempQuery + ' ' + 'WHERE' + ' ' + filterByObj.selectedField + ' ' + 'NOT IN' + ' ' + '(' + valueInQuotes + ')';
        }else{
            if(withoutQuoteType.includes(fieldType) || (filterByObj.selectedValue).toLowerCase().includes('null')){
                // eslint-disable-next-line no-useless-concat
                tempQuery = tempQuery + ' ' + 'WHERE' + ' ' + filterByObj.selectedField + ' ' + filterByObj.selectedOperator + ' ' + filterByObj.selectedValue; 
            }else{
                // eslint-disable-next-line no-useless-concat
                tempQuery = tempQuery + ' ' + 'WHERE' + ' ' + filterByObj.selectedField + ' ' + filterByObj.selectedOperator + ' \'' + filterByObj.selectedValue + '\'';
            }
        }
        return tempQuery;
    }
    genertareSOQLURI(queryString){
        let tempQueryString = queryString.replace(/\s/g, '+');
        if(tempQueryString.includes('%')){
            tempQueryString = tempQueryString.replaceAll('%', '%25');
        }
        return tempQueryString;
    }
    generateCapitalizedText(text){
        let item = text.trim();
        let firstLetter = item.charAt(0);
        let firstLetterCap = firstLetter.toUpperCase();
        let remainingLetters = item.slice(1).toLowerCase();
        let capitalizedName = firstLetterCap + remainingLetters;
        return capitalizedName;
    }
    fetchSOQLRecords() {
        if(this.queryString){
            if(this.queryString.includes('(') && this.queryString.includes(')')){
                let subQuery = this.queryString.substring(this.queryString.indexOf('(')+1, this.queryString.indexOf(')')).toLowerCase();
                if(subQuery.includes('select') && subQuery.includes('from')){
                    this.showToastMessage('warning', 'Parent-Child relationalship query is not allowed.');
                    return;
                }
            }
            this.queryStringURI = this.genertareSOQLURI(this.queryString);
            this.isLoading = true;
            this.toggleProgress(true,'active-step');
            getRecords({ userId: this.userId, queryString: this.queryStringURI, apiVersion: this.apiValue})
            .then(result => {
                //console.log('result',result);
                if(result){
                    let response = JSON.parse(result);
                    //console.log('response',response);
                    let uniqueKey = new Set();
                    if(response.records){
                        if(response.records.length > 0){
                            response.records.forEach(res => {
                                if('Id' in res){
                                    res.RedirectURL = this.customDomain + '/' + res.Id;
                                }
                                for(const key in res){
                                    if(key !== 'attributes'){
                                        if(res[key] !== null && typeof res[key] === 'object'){
                                            this.getKeyValue(res[key], key, res, uniqueKey, this);
                                            if(uniqueKey.has(key)){
                                                uniqueKey.delete(key);
                                            }
                                        }else{
                                            if(key !== 'RedirectURL'){
                                                uniqueKey.add(key);
                                            }
                                        }
                                    }
                                }
                            });
                            let columns = [];
                            for(let key of uniqueKey){
                                if(key !== 'attributes'){
                                    if(key === 'Id'){
                                        columns.push({label: key, fieldName: 'RedirectURL', type: 'url', typeAttributes: { label: { fieldName: key }, target: '_blank' }});
                                    }else{
                                        columns.push({label: key, fieldName: key, type: 'text'});
                                    }
                                }
                            }
                            this.recordColumns = columns;
                            this.recordKey = this.recordColumns[0].fieldName;
                            this.hasRecords = true;
                            this.recordList = response.records;
                            this.showToastMessage('success', 'Records retrieve successfully');
                            this.calculateHistory();
                        }else{
                            this.hasRecords = false;
                            this.showToastMessage('warning', 'No records found.');
                        }
                    }
                    if(!response.done && response.nextRecordsUrl){
                        this.disableAbortBtn = false;
                        this.fetchRemainingRecords(response.nextRecordsUrl);
                    }else{
                        this.toggleProgress(false, 'base-autocomplete');
                    }
                    this.isLoading = false;
                    if(Array.isArray(response) && response[0].errorCode && response[0].message){
                        this.toggleProgress(false, 'expired');
                        this.showToastMessage('error', response[0].errorCode + ':' + response[0].message);
                        this.hasRecords = false;
                    }
                }else{
                    this.showToastMessage('error', 'Some Error Occured.');
                    this.hasRecords = false;
                }
            })
            .catch(error => {
                this.isLoading = false;
                this.hasRecords = false;
                this.toggleProgress(false, 'expired');
                console.log('error',error);
                this.showToastMessage('error', error);
            })
        }
    }
    getKeyValue(jsonObj, ref, res, uniqueKey, that){
        for(const key in jsonObj){
            if(key !== 'attributes'){
                if(jsonObj[key] !== null && typeof jsonObj[key] === 'object'){
                    that.getKeyValue(jsonObj[key], `${ref}.${key}`, res, uniqueKey, that);
                }
                else{
                    if(key !== 'attributes'){
                        res[`${ref}.${key}`] = jsonObj[key];
                        uniqueKey.add(`${ref}.${key}`);
                    }
                }
            }
        }
    }
    fetchRemainingRecords(nextBatchURL) {
        if(this.hasProcessAborted){ 
            this.showToastMessage('success', 'Aborted successfully.'); 
            this.disableAbortBtn = true;
            return; 
        };
		getRecordsBatch({ userId: this.userId, nextQueryBatch: nextBatchURL})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                for(let item of response.records){
                    this.recordList.push(item);
                }
                if(!response.done && response.nextRecordsUrl){
                    this.fetchRemainingRecords(response.nextRecordsUrl);
                }else{
                    this.toggleProgress(false, 'base-autocomplete');
                }
            }
		})
		.catch(error => {
            this.showToastMessage('error', error);
            this.toggleProgress(false , 'expired');
			console.log('error',error);
		})
    }
    async calculateHistory(){
        let historyOption = [...this.soqlHistoryOptions];
        let searchObject = historyOption.find((ex) => ex.value === this.queryString);
        if(searchObject === undefined){
            historyOption.push({label: this.queryString, value: this.queryString});
            this.soqlHistoryOptions = historyOption;
        }
        if(this.soqlHistoryOptions.length >= 2){
            this.showQueryHistory = true;
            this.selectedSoqlHistory = this.queryString;
        }
    }
    fetchListView(){
		getListView({ userId: this.userId, objectName: this.selectedObjectName, apiVersion: this.apiValue})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                if(response.done){
                    this.hasListViewActive = true;
                    let listOptions = [];
                    for(let item of response.listviews){
                        if(item.soqlCompatible){
                            listOptions.push({label: item.label, value: item.developerName});
                        }
                    }
                    if(listOptions.length > 0){
                        this.listViewOptions = listOptions;
                        this.hasListViewDisable = false;
                    }else{
                        this.hasListViewDisable = true;
                    }
                }else{
                    this.showToastMessage('warning', 'List view is too large to retrieve.');
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
    fetchListViewRecords(){
        this.isLoading = true;
        this.toggleProgress(true,'active-step');
		getListViewRecord({ userId: this.userId, objectName: this.selectedObjectName, viewDeveloperName: this.selectedListView, apiVersion: this.apiValue})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                this.isLoading = false;
                let allRecords = [];
                let uniqueField = new Set();
                if(response.count > 0){
                    for(let item of response.records){
                        let allFieldKey = Object.keys(item.fields);
                        let allFieldValue = {};
                        allFieldKey.forEach((field) => {
                            if(typeof item.fields[field].value !== "object"){
                                if(field === 'Id'){
                                    allFieldValue.Id = item.fields[field].value;
                                    allFieldValue.RedirectURL = this.customDomain + '/' + item.fields[field].value;
                                }else{
                                    allFieldValue[field] = item.fields[field].value;
                                }
                                uniqueField.add(field);
                            }
                        })
                        allRecords.push(allFieldValue);
                    }
                    let recordColumn = [];
                    for (const field of uniqueField) {
                        if(field === 'Id'){
                            recordColumn.push({label: field, fieldName: 'RedirectURL', type: 'url', typeAttributes: { label: { fieldName: field }, target: '_blank' }});
                        }else{
                            recordColumn.push({label: field, fieldName: field, type: 'text'});
                        }
                    }
                    this.recordColumns = recordColumn;
                    this.recordKey = this.recordColumns[0].fieldName;
                    this.recordList = allRecords;
                    this.hasRecords = true;
                    if(response.nextPageUrl !== null){
                        this.disableAbortBtn = false;
                        this.fetchListViewRecordsBatch(response.nextPageUrl);
                    }else{
                        this.showToastMessage('success', 'Records retrieve successfully');
                        this.toggleProgress(false, 'base-autocomplete');
                    }
                }else{
                    this.hasRecords = false;
                    this.toggleProgress(false, 'base-autocomplete');
                    this.showToastMessage('warning', 'No records found.');
                }
            }
		})
		.catch(error => {
            this.isLoading = false;
            this.hasRecords = false;
            this.toggleProgress(false, 'base-expired');
			console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    fetchListViewRecordsBatch(nextPageUrl){
        if(this.hasProcessAborted){ 
            this.showToastMessage('success', 'Aborted successfully.'); 
            this.disableAbortBtn = true;
            return; 
        };
		getListViewRecordBatch({ userId: this.userId, nextViewBatch: nextPageUrl})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                if(response.count > 0){
                    for(let item of response.records){
                        let allFieldKey = Object.keys(item.fields);
                        let allFieldValue = {};
                        allFieldKey.forEach((field) => {
                            if(typeof item.fields[field].value !== "object"){
                                if(field === 'Id'){
                                    allFieldValue.Id = item.fields[field].value;
                                    allFieldValue.RedirectURL = this.customDomain + '/' + item.fields[field].value;
                                }else{
                                    allFieldValue[field] = item.fields[field].value;
                                }
                            }
                        })
                        this.recordList.push(allFieldValue);
                    }
                    if(response.nextPageToken !== null){
                        this.toggleProgress(false, 'warning');
                        this.showToastMessage('warning', 'Only 2000 records is able to retrieve. Please use soql builder to retrieve all records.');
                    }else{
                        this.showToastMessage('success', 'Records retrieve successfully');
                        this.toggleProgress(false, 'base-autocomplete');
                    }
                }
            }
		})
		.catch(error => {
            this.toggleProgress(false, 'base-expired');
			console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    downloadCSVFile() { 
        this.disableDownloadBtn = true; 
        this.downloadCSVFileAsync(this.recordList,this); 
    }
    downloadCSVFileAsync(recordList, that){
        return that.generateCSVFile(recordList)
        .then(function(csvData) {
            let downloadElement = document.createElement('a');
            downloadElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvData);
            downloadElement.target = '_self';
            let objectName = (that.objectNameFromQuery !== undefined && that.objectNameFromQuery !== '') ? that.objectNameFromQuery : that.selectedObjectName;
            downloadElement.download = objectName +' Data.csv';
            document.body.appendChild(downloadElement);
            downloadElement.click();
            that.disableDownloadBtn = false; 
        })
        .catch(error => {
            this.showToastMessage('error', error);
			console.log('error',error);
		})
    }
    generateCSVFile(recordList){
        return new Promise(function(resolve) {
            let data = recordList;
            let rowEnd = '\n';
            let csvString = '';
            let rowData = new Set();
            data.forEach(function (record) {
                Object.keys(record).forEach(function (key) {
                    if(key !== 'attributes' && key !== 'RedirectURL'){
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
    toggleProgress(isProgressing, variant) {
        let progressVal = (variant === 'base-autocomplete' || variant === 'warning' ? 100 : 50);
        if(isProgressing === true){
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.interval = setInterval(() => {
                this.progressValue = this.progressValue === 100 ? 0 : this.progressValue + 1;
            }, 10);
        }else{
            clearInterval(this.interval);
            this.progressVariant = variant;
            this.progressValue = progressVal;
        }
    }
}