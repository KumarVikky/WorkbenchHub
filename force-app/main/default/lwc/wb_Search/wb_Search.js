import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getSObjects from '@salesforce/apex/WB_WorkbenchHubController.getAllSObjects';
import searchAllRecords from '@salesforce/apex/WB_WorkbenchHubController.searchAllRecords';

export default class Wb_Search extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    @track searchQueryString;
    @track returningList;
    searchValue;
    selectSearchGroupValue = 'NAME FIELDS';
    searchLimitValue = 200;
    sObjectOptions;
    isLoading = false;
    totalRecords = 0;
    
    get searchGroupOptions() {
        return [
            { label: 'ALL FIELDS', value: 'ALL FIELDS' },
            { label: 'NAME FIELDS', value: 'NAME FIELDS' },
            { label: 'EMAIL FIELDS', value: 'EMAIL FIELDS' },
            { label: 'PHONE FIELDS', value: 'PHONE FIELDS' },
        ];
    }

    connectedCallback(){
        this.returningList = [{id: 1, selectedSObject: '', selectedFields: ''}];
        this.fetchSObjects();
    }

    handleInputChange(event){
        let tageName = event.target.name;
        let tagValue = event.target.value;
        if(tageName === 'SearchValue'){
            this.searchValue = tagValue;
        }
        else if(tageName === 'SearchLimit'){
            this.searchLimitValue = tagValue;
        }
        this.searchQueryString = this.generateSearchQuery();
    }
    handleAddRow(){
        let activeRowLen = this.returningList.length;
        if(activeRowLen < 6){
            let returningObj = {id: activeRowLen+1, selectedSObject: '', selectedFields: ''};
            this.returningList.push(returningObj);
        }else{
            this.showToastMessage('warning','No more row allowed.');
        }
    }
    handleRemoveRow(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let index = this.returningList.findIndex(e => e.id === selectedId);
        this.returningList.splice(index,1);
        this.handleReorderList();
        this.searchQueryString = this.generateSearchQuery();
    }
    handleReorderList(){
        for(let index in this.returningList){
            if(this.returningList[index].id != null){
                this.returningList[index].id = (Number(index)+1);
            }
        }
    }
    handleSObjectChange(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let returningObj = this.returningList.find(e => e.id === selectedId);
        returningObj.selectedSObject = event.detail.value;
        this.searchQueryString = this.generateSearchQuery();
    }
    handleFieldChange(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let returningObj = this.returningList.find(e => e.id === selectedId);
        returningObj.selectedFields = event.detail.value;
        this.searchQueryString = this.generateSearchQuery();
    }
    handleSearchGroupChange(event){
        this.selectSearchGroupValue = event.detail.value;
        this.searchQueryString = this.generateSearchQuery();
    }
    generateSearchQuery(){
        let tempQueryString = 'FIND ' + '{' + this.searchValue + '}' + ' IN ' + this.selectSearchGroupValue;
        let returningValues = this.returningList;
        for(let index in returningValues){
            if(returningValues[index].selectedSObject !== '' && returningValues[index].selectedFields !== ''){
                if(Number(index) === 0){
                    tempQueryString = tempQueryString + ' RETURNING ' + returningValues[index].selectedSObject + ' (' + returningValues[index].selectedFields + ')';
                }else{
                    tempQueryString = tempQueryString + ', ' + returningValues[index].selectedSObject + ' (' + returningValues[index].selectedFields + ')';
                }
            }
        }
        tempQueryString = tempQueryString + ' LIMIT ' + this.searchLimitValue;
        return tempQueryString;
    }
    handleManualSearchQuery(event){
        this.searchQueryString = event.detail.value;
    }
    handFetchRecords(){
        if(this.searchQueryString && this.searchQueryString !== ''){
            let searchString = this.searchQueryString.toLowerCase();
            if(searchString.includes('find') && searchString.includes('in')){
                this.fetchSearchRecords();
            }else{
                this.showToastMessage('warning', 'Please select object & fields or type search query manually.');
            }
        }else{
            this.showToastMessage('warning', 'Please type search text.');
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
    fetchSearchRecords(){
        this.isLoading = true;
		searchAllRecords({ userId: this.userId, searchString: this.searchQueryString, apiVersion: this.apiValue})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                let recordsMap = new Map();
                if(response.searchRecords && response.searchRecords.length > 0){
                    this.totalRecords = response.searchRecords.length;
                    for(let item of response.searchRecords){
                        let recordKey = new Set();
                        let recordObj = {};
                        for(const key in item){
                            if(key !== 'attributes'){
                                recordKey.add(key);
                                recordObj[key] = item[key];
                            }
                        }
                        if(recordsMap.has(item.attributes.type)){
                            let existingRecords = recordsMap.get(item.attributes.type).dataValues;
                            var newRecords = existingRecords.concat([recordObj]);
                            recordsMap.set(item.attributes.type, {dataKeys: Array.from(recordKey), dataValues: newRecords});
                        }else{
                            recordsMap.set(item.attributes.type, {dataKeys: Array.from(recordKey), dataValues: [recordObj]});
                        }
                    }
                    let dynamicTableContent = this.generateDynamicTable(recordsMap);
                    let dynamicTableDiv = this.template.querySelector('.dynamicTableDiv');
                    if(dynamicTableDiv){
                        dynamicTableDiv.innerHTML = dynamicTableContent;
                        dynamicTableDiv.classList.add('dynamicTableShow'); 
                        dynamicTableDiv.classList.remove('dynamicTableHide');
                    }
                    this.showToastMessage('success', 'Record found successfully.');
                }else{
                    let dynamicTableDiv = this.template.querySelector('.dynamicTableDiv');
                    if(dynamicTableDiv){
                        dynamicTableDiv.classList.add('dynamicTableHide'); 
                        dynamicTableDiv.classList.remove('dynamicTableShow');
                    }
                    this.showToastMessage('warning', 'No records found.');
                }
                this.isLoading = false;
            }else{
                this.showToastMessage('error', 'Failed to search: '+result);
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    generateDynamicTable(recordsMap){
        let htmlElement = '<h3>Total Records: ' + this.totalRecords + '</h3></br>';
        for (let [key, value] of recordsMap) {
            htmlElement += '<h3>' + key + ':' + '</h3>';
            let table = '<table>'; 
            table += '<tr>';
            for(let dataKey of value.dataKeys){
                table += '<th>' + dataKey + '</th>';
            }
            table += '</tr>';
            for(let dataValues of value.dataValues){
                table += '<tr>';
                for(const key in dataValues){  
                    table += '<td>' + dataValues[key] + '</td>';  
                } 
                table += '</tr>';
            }
            table += '</table>';  
            htmlElement += table + '</br>';
        }
        return htmlElement;
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

}