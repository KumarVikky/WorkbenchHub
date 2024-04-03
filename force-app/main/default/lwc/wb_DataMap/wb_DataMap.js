import { wire, api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/wb_PubSub';

export default class Wb_DataMap extends LightningModal {
    @api fieldOptions;
    @api recordList;
    @api previousRecordList;
    @api recordResponseList;
    @api fieldList;
    @track columnMapData;
    recordColumn;
    hasErrorMsg = false;
    errorMsg;
    disableFieldOpt;
    @wire(CurrentPageReference) pageRef;

    connectedCallback(){
        if(this.previousRecordList && this.previousRecordList.length > 0){
            this.recordColumn = JSON.parse(JSON.stringify(this.previousRecordList));
        }else{
            if(this.recordList && this.recordList.length > 0){
                this.recordColumn = JSON.parse(JSON.stringify(this.recordList));
            }
        }
        this.columnMapData = this.generateDataMap(this.recordColumn);
        if(this.pageRef){
            registerListener('closeAllModal', this.handleEvent, this);
        }
    }
    disconnectedCallback(){
        unregisterAllListeners(this);
    }

    handleEvent(param){
        if(param === true){
            this.close('');
        }
    }
    handleFieldColumMap(event){
        let selectedId = Number(event.currentTarget.dataset.id);
        let data = this.columnMapData.find(e => e.id == selectedId);
        data.toColumn = event.detail.value;
    }
    generateDataMap(recordList){
        let dataMap = [];
        let allFields = this.fieldList;
        for(let index in recordList){
            if(allFields.includes(recordList[index].fieldName)){
                dataMap.push({id: Number(index)+1, fromColumn: recordList[index].fieldName, toColumn: recordList[index].fieldName});
            }else{
                dataMap.push({id: Number(index)+1, fromColumn: recordList[index].fieldName, toColumn:''});
            }
        }
        return dataMap;
    }
    mapFieldList(columnList, responseList){
        let columnMap = new Map();
        let finalMappedDataList = [];
        for(let column of columnList){
            let toColumn = column.toColumn;
            let fromColumn = column.fromColumn;
            columnMap.set(fromColumn,toColumn);
        }
        let uniqueKey = 1;
        for(let record of responseList){
            let obj = {'uniqueKey': uniqueKey};
            for (const [key, value] of Object.entries(record)) {
                if(columnMap.has(key)){
                    obj[columnMap.get(key)] = value;
                }
            }
            finalMappedDataList.push(obj);
            uniqueKey ++;
        }
        return finalMappedDataList;
    }
    generateColumn(recordList){
        let renamededRecordColumn = [];
        for (const [key, value] of Object.entries(recordList[0])) {
            if(key !== 'uniqueKey'){
                let obj = {'label': key, 'fieldName': key, 'type': 'text', 'editable': true};
                renamededRecordColumn.push(obj);
            }
        }
        return renamededRecordColumn;
    }
    handleClose(){
        this.close('');
    }
    handleApply(){
        let finalMappedDataList = this.mapFieldList(this.columnMapData, this.recordResponseList);
        let finalRecordColumn = this.generateColumn(finalMappedDataList);
        let response = {'finalMappedDataList': finalMappedDataList, 'previousRecordList': finalRecordColumn};
        this.close(response);
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