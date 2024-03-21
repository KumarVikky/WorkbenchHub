import { api, track, wire } from 'lwc';
import LightningModal from 'lightning/modal';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/wb_PubSub';

export default class Wb_AdvanceSortModal extends LightningModal {
    @api multiSortByFieldOptions;
    @api multiSortByOptions;
    @api previousSelectedMultiSort;
    @track selectedMultiSortByList;
    @track hasErrorMsg = false;
    errorMsg;
    disableMultiSortOpt;
    @wire(CurrentPageReference) pageRef;

    connectedCallback(){
        if(this.previousSelectedMultiSort && this.previousSelectedMultiSort.length > 0){
            this.selectedMultiSortByList = JSON.parse(JSON.stringify(this.previousSelectedMultiSort));
        }else{
            this.selectedMultiSortByList = [{id: 1, selectedField : '', selectedOperator : 'ASC'}];
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
    handleMultiSortByFields(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let sortBy = this.selectedMultiSortByList.find(e => e.id === selectedId);
        sortBy.selectedField = event.detail.value;
        //console.log('sortByList',JSON.stringify(this.selectedMultiSortByList));
    }
    handleMultiSortByOption(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let sortBy = this.selectedMultiSortByList.find(e => e.id === selectedId);
        sortBy.selectedOperator = event.detail.value;
        //console.log('sortByList',JSON.stringify(this.selectedMultiSortByList));
    }
    handleAddRow(){
        let activeRowLen = this.selectedMultiSortByList.length;
        if(activeRowLen < 4){
            let sortBy = {id: activeRowLen+1, 'selectedField' : '', selectedOperator : '=', selectedValue : ''};
            this.selectedMultiSortByList.push(sortBy);
            this.hasErrorMsg = false;
        }else{
            this.errorMsg = 'No more sort allowed.';
            this.hasErrorMsg = true;
        }
    }
    handleRemoveRow(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let index = this.selectedMultiSortByList.findIndex(e => e.id === selectedId);
        this.selectedMultiSortByList.splice(index,1);
        this.handleReorderList();
        this.hasErrorMsg = false;
    }
    handleReorderList(){
        for(let item in this.selectedMultiSortByList){
            if(this.selectedMultiSortByList[item].id != null){
                this.selectedMultiSortByList[item].id = (Number(item)+1);
            }
        }
    }
    handleClose(){
        this.close('');
    }
    handleApply(){
        let validate = this.handleInputValidation(this.selectedMultiSortByList);
        //console.log('validate',validate);
        if(validate === true){
            this.hasErrorMsg = false;
            //console.log('whereString',this.generateSortString(this.selectedMultiSortByList));
            let response = {whereString: this.generateSortString(this.selectedMultiSortByList), allSelectedMultiSort: this.selectedMultiSortByList};
            this.close(response);
        }else{
            this.errorMsg = 'Please fill all details.';
            this.hasErrorMsg = true;
        }
    }
    generateSortString(sortList){
        let whereClause = '';
        if(sortList.length === 1){
            // eslint-disable-next-line no-useless-concat
            whereClause = whereClause + sortList[0].selectedField + ' ' + sortList[0].selectedOperator;
        }else{
            for(let item of sortList){
                whereClause = whereClause + item.selectedField + ' ' + item.selectedOperator;
                if(sortList[sortList.length - 1].id !== item.id){
                    // eslint-disable-next-line no-useless-concat
                    whereClause = whereClause + ',' + ' ';
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
            }),
        );
    }
    handleInputValidation(sortList){
        let validate = true;
        for(let item of sortList){
            if(item.selectedField === '' || item.selectedOperator === ''){
                validate = false;
                break;
            }
        }
        return validate;
    }
}