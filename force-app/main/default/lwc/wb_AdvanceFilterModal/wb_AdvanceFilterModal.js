import { api, track, wire } from 'lwc';
import LightningModal from 'lightning/modal';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { registerListener, unregisterAllListeners } from 'c/wb_PubSub';
import { CurrentPageReference } from 'lightning/navigation';

export default class Wb_AdvanceFilterModal extends LightningModal{
    @api multiFilterByFieldOptions;
    @api multiFilterByOptions;
    @api fieldTypeMap;
    @api previousSelectedMultiFilter;
    @api previousSelectedCondition;
    @api previousCustomConditionValue;
    @track selectedMultiFilterByList;
    @track hasErrorMsg = false;
    errorMsg;
    disableMultiFilterOpt;
    selectedFilterConditionValue;
    customConditionValue;
    hasCustomCondition = false;
    @wire(CurrentPageReference) pageRef;

    get filterConditionOption() {
        return [
            { label: 'AND', value: 'AND' },
            { label: 'OR', value: 'OR' },
            { label: 'Custom', value: 'Custom' }
        ];
    }

    connectedCallback(){
        if(this.previousSelectedMultiFilter && this.previousSelectedMultiFilter.length > 0){
            this.selectedMultiFilterByList = JSON.parse(JSON.stringify(this.previousSelectedMultiFilter));
        }else{
            this.selectedMultiFilterByList = [{id: 1, selectedField : '', selectedOperator : '=', selectedValue : ''}];
        }
        if(this.previousSelectedCondition && this.previousSelectedCondition !== ''){
            this.selectedFilterConditionValue = this.previousSelectedCondition;
            if(this.previousSelectedCondition === 'Custom' && this.previousCustomConditionValue !== ''){
                this.customConditionValue = this.previousCustomConditionValue;
                this.hasCustomCondition = true;
            }
        }else{
            this.selectedFilterConditionValue = 'AND';
        }
        if(this.pageRef){
            registerListener('closeAllModal', this.handleEvent, this);
        }
    }
    disconnectedCallback(){
        unregisterAllListeners(this);
    }
    handleEvent(param){
        //console.log('param',param);
        if(param === true){
            this.close('');
        }
    }
    handleMultiFilterByFields(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let filterBy = this.selectedMultiFilterByList.find(e => e.id === selectedId);
        filterBy.selectedField = event.detail.value;
        //console.log('filterByList',JSON.stringify(this.selectedMultiFilterByList));
    }
    handleMultiFilterByOption(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let filterBy = this.selectedMultiFilterByList.find(e => e.id === selectedId);
        filterBy.selectedOperator = event.detail.value;
        //console.log('filterByList',JSON.stringify(this.selectedMultiFilterByList));
    }
    handleMultiFilterByValue(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let filterBy = this.selectedMultiFilterByList.find(e => e.id === selectedId);
        filterBy.selectedValue = event.detail.value;
        //console.log('filterByList',JSON.stringify(this.selectedMultiFilterByList));
    }
    handleFilterCondition(event){
        this.selectedFilterConditionValue = event.target.value;
        if(event.target.value === 'Custom'){
            this.hasCustomCondition = true;
        }else{
            this.hasCustomCondition = false;
        }
    }
    handleAddRow(){
        let activeRowLen = this.selectedMultiFilterByList.length;
        if(activeRowLen < 6){
            let filterBy = {id: activeRowLen+1, 'selectedField' : '', selectedOperator : '=', selectedValue : ''};
            this.selectedMultiFilterByList.push(filterBy);
            this.hasErrorMsg = false;
        }else{
            this.errorMsg = 'No more filter allowed.';
            this.hasErrorMsg = true;
        }
    }
    handleRemoveRow(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let index = this.selectedMultiFilterByList.findIndex(e => e.id === selectedId);
        this.selectedMultiFilterByList.splice(index,1);
        this.handleReorderList();
        this.hasErrorMsg = false;
    }
    handleCustomCondition(event){
        this.customConditionValue = event.target.value;
    }
    handleReorderList(){
        for(let item in this.selectedMultiFilterByList){
            if(this.selectedMultiFilterByList[item].id != null){
                this.selectedMultiFilterByList[item].id = (Number(item)+1);
            }
        }
    }
    handleClose(){
        this.close('');
    }
    handleApply(){
        let validateInput = this.handleInputValidation(this.selectedMultiFilterByList);
        //console.log('validate',validate);
        if(validateInput === true){
            this.hasErrorMsg = false;
            //console.log('whereString',this.generateFilterString(this.selectedMultiFilterByList));
            if(this.selectedFilterConditionValue === 'Custom'){
                let validateCondition = this.validateCustomCondition(this.selectedMultiFilterByList, this.customConditionValue);
                if(!validateCondition){
                    this.errorMsg = 'Invalid condition, please correct!';
                    this.hasErrorMsg = true;
                    return;
                }
            }
            let response = {whereString: this.generateFilterString(this.selectedMultiFilterByList), allSelectedMultiFilter: this.selectedMultiFilterByList, selectedCondition: this.selectedFilterConditionValue, selectedConditionValue: this.customConditionValue};
            this.close(response);
        }else{
            this.errorMsg = 'Please complete all details.';
            this.hasErrorMsg = true;
        }
    }
    generateFilterString(filterList){
        let whereClause = '';
        let whereClauseTemp = '';
        let withoutQuoteType = ['boolean','double','currency','int','date','datetime'];
        let conditionValue = this.customConditionValue;
       
        if(filterList.length > 0){
            for(let item of filterList){
                let fieldType = this.fieldTypeMap.get(item.selectedField);
                if(item.selectedOperator === 'startsWith'){
                    // eslint-disable-next-line no-useless-concat
                    let filterVal = item.selectedField + ' ' + 'LIKE' + ' \'' + item.selectedValue + '%' + '\'';
                    whereClause = whereClause + filterVal;
                    whereClauseTemp = filterVal;
                }else if(item.selectedOperator === 'endsWith'){
                     // eslint-disable-next-line no-useless-concat
                     let filterVal = item.selectedField + ' ' + 'LIKE' + ' \'' + '%' + item.selectedValue + '\'';
                     whereClause = whereClause + filterVal;
                     whereClauseTemp = filterVal;
                }else if(item.selectedOperator === 'contains'){
                    // eslint-disable-next-line no-useless-concat
                    let filterVal = item.selectedField + ' ' + 'LIKE' + ' \'' + '%' + item.selectedValue + '%' + '\'';
                    whereClause = whereClause + filterVal;
                    whereClauseTemp = filterVal;
                }else if(item.selectedOperator === 'in'){
                    const valueInQuotes = item.selectedValue.split(',').map(i => "'" + i.trim() + "'").join(',');
                    // eslint-disable-next-line no-useless-concat
                    let filterVal = item.selectedField + ' ' + 'IN' + ' ' + '(' + valueInQuotes + ')';
                    whereClause = whereClause + filterVal;
                    whereClauseTemp = filterVal;
                }else if(item.selectedOperator === 'not-in'){
                    const valueInQuotes = item.selectedValue.split(',').map(i => "'" + i.trim() + "'").join(',');
                    let filterVal = item.selectedField + ' ' + 'NOT IN' + ' ' + '(' + valueInQuotes + ')';
                    // eslint-disable-next-line no-useless-concat
                    whereClause = whereClause + filterVal;
                    whereClauseTemp = filterVal;
                }else{
                    if(withoutQuoteType.includes(fieldType) || (item.selectedValue).toLowerCase().includes('null')){
                        // eslint-disable-next-line no-useless-concat
                        let filterVal = item.selectedField + ' ' + item.selectedOperator + ' ' + item.selectedValue; 
                        whereClause = whereClause + filterVal;
                        whereClauseTemp = filterVal;
                    }else{
                        // eslint-disable-next-line no-useless-concat
                        let filterVal = item.selectedField + ' ' + item.selectedOperator + ' \'' + item.selectedValue + '\'';
                        whereClause = whereClause + filterVal;
                        whereClauseTemp = filterVal;
                    }
                }
                if(filterList[filterList.length - 1].id !== item.id){
                    if(this.selectedFilterConditionValue === 'AND'){
                        // eslint-disable-next-line no-useless-concat
                        whereClause = whereClause + ' ' + 'AND' + ' ';
                    }
                    if(this.selectedFilterConditionValue === 'OR'){
                        // eslint-disable-next-line no-useless-concat
                        whereClause = whereClause + ' ' + 'OR' + ' ';
                    }
                }
                if(this.selectedFilterConditionValue === 'Custom' && conditionValue.includes(item.id)){
                    conditionValue = conditionValue.replace(item.id, whereClauseTemp);
                    whereClause = conditionValue.trim();
                }
            }
        }
        return whereClause;
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
    handleInputValidation(filterList){
        let validate = true;
        for(let item of filterList){
            if(item.selectedField === '' || item.selectedOperator === '' || item.selectedValue === ''){
                validate = false;
                break;
            }
        }
        return validate;
    }
    validateCustomCondition(filterList, conditionValue){
        let validate = true;
        if(conditionValue === undefined || conditionValue === ''){
            validate = false;
        }else{
            let itemsNumInFilterSet = new Set();
            for(let item of filterList){
                itemsNumInFilterSet.add((item.id).toString());
            }

            let itemNumInCondition = conditionValue.match(/\d/g) || [];
            let itemNumInConditionSet = new Set(itemNumInCondition);
            const areBothSetsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value));
            validate = areBothSetsEqual(itemsNumInFilterSet, itemNumInConditionSet);

            if(itemNumInCondition.length !== itemNumInConditionSet.size){
                validate = false;
            }
            if(conditionValue.charAt(conditionValue.length - 1) !== ')' && isNaN(conditionValue.charAt(conditionValue.length - 1))){
                validate = false;
            }
            let itemAlphaInCondition = (conditionValue.toUpperCase()).replace(/[^A-Za-z]/g, '');
            if(!itemAlphaInCondition.includes('OR') && !itemAlphaInCondition.includes('AND')){
                validate = false;
            }
        }
        return validate;
    }
}