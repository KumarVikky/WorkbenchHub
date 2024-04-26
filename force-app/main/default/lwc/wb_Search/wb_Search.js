import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getSObjects from '@salesforce/apex/WB_WorkbenchHubController.getAllSObjects';
import searchAllRecords from '@salesforce/apex/WB_WorkbenchHubController.searchAllRecords';
import xlsx from '@salesforce/resourceUrl/xlsx';
import { loadScript } from 'lightning/platformResourceLoader';

export default class Wb_Search extends LightningElement {
    @api userId;
    @api customDomain;
    @api apiValue;
    @track searchQueryString;
    @track returningList;
    @track recordsMapData;
    searchValue;
    selectSearchGroupValue = 'NAME FIELDS';
    searchLimitValue = 200;
    sObjectOptions;
    isLoading = false;
    totalRecords = 0;
    hasDownloadDisabled = true;
    
    get searchGroupOptions() {
        return [
            { label: 'ALL FIELDS', value: 'ALL FIELDS' },
            { label: 'NAME FIELDS', value: 'NAME FIELDS' },
            { label: 'EMAIL FIELDS', value: 'EMAIL FIELDS' },
            { label: 'PHONE FIELDS', value: 'PHONE FIELDS' },
        ];
    }
    get showResponseMenu(){
        return this.recordsMapData && this.recordsMapData.size > 0 ? true : false;
    }

    connectedCallback(){
        this.returningList = [{id: 1, selectedSObject: '', selectedFields: ''}];
        this.fetchSObjects();
        Promise.all([
            loadScript(this, xlsx)
        ]).then(() => console.log('Success: All Script Loaded.'))
        .catch(error => console.log('Error:',error));
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
            this.showToastMessage('warning', 'Please type text to be searched.');
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
                    this.recordsMapData = recordsMap;
                    this.totalRecords = response.searchRecords.length;
                    let dynamicTableContent = this.generateDynamicTable(recordsMap);
                    let dynamicTableDiv = this.template.querySelector('.dynamicTableDiv');
                    if(dynamicTableDiv){
                        dynamicTableDiv.innerHTML = dynamicTableContent;
                        dynamicTableDiv.classList.add('dynamicTableShow'); 
                        dynamicTableDiv.classList.remove('dynamicTableHide');
                    }
                    this.showToastMessage('success', 'Record found successfully.');
                    this.hasDownloadDisabled = false;
                }else{
                    let dynamicTableDiv = this.template.querySelector('.dynamicTableDiv');
                    if(dynamicTableDiv){
                        dynamicTableDiv.classList.add('dynamicTableHide'); 
                        dynamicTableDiv.classList.remove('dynamicTableShow');
                    }
                    this.showToastMessage('warning', 'No records found.');
                    this.hasDownloadDisabled = true;
                    this.totalRecords = 0;
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
        let htmlElement = '';
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
                    if(key === 'Id'){
                        table += '<td>' + '<a href="' + this.customDomain + '/' + dataValues[key] + '" target="_blank">' + dataValues[key] + '</a>' + '</td>';
                    }else{
                        table += '<td>' + dataValues[key] + '</td>';
                    }  
                } 
                table += '</tr>';
            }
            table += '</table>';  
            htmlElement += table + '</br>';
        }
        return htmlElement;
    }
    downloadExcelFile(){
        try{
            this.hasDownloadDisabled = true;
            const XLSX = window.XLSX;
            let wb = XLSX.utils.book_new();
            for (let [key, value] of this.recordsMapData) {
                let data = XLSX.utils.json_to_sheet(value.dataValues);
                XLSX.utils.book_append_sheet(wb, data, key);
            }
            XLSX.writeFile(wb, "Searched Records.xlsx");
            this.hasDownloadDisabled = false;
        }catch(error){
            this.showToastMessage('error occured while generating xlsx: ', error);
            console.log(error);
        }
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