import { wire, api } from 'lwc';
import LightningModal from 'lightning/modal';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/wb_PubSub';
import jszip from '@salesforce/resourceUrl/jszip';
import jszipmin from '@salesforce/resourceUrl/jszipmin';
import filesaver from '@salesforce/resourceUrl/filesaver';
import jquery from '@salesforce/resourceUrl/jquery';
import { loadScript } from 'lightning/platformResourceLoader';
import retrieveRawLog from '@salesforce/apex/WB_WorkbenchHubController.retrieveRawLog';


export default class Wb_ViewLog extends LightningModal {
    @api logId;
    @api userId;
    @api apiValue;
    rawLogValue;
    isLoading = false;

    @wire(CurrentPageReference) pageRef;

    get isAllowedCopy(){
        return this.rawLogValue === '' || this.rawLogValue === undefined ? false : true;
    }

    connectedCallback(){
        this.fetchRawLog(this.logId);
        if(this.pageRef){
            registerListener('closeAllModal', this.handleEvent, this);
        }
        Promise.all([
            loadScript(this, jszip),
            loadScript(this, jszipmin),
            loadScript(this, filesaver),
            loadScript(this, jquery)
        ]).then(() => console.log('Success: All Script Loaded.'))
        .catch(error => console.log('Error:',error));
    }
    disconnectedCallback(){
        unregisterAllListeners(this);
    }

    handleEvent(param){
        if(param === true){
            this.close('');
        }
    }
    handleClose(){
        this.close('');
    }
    handleDownload(){
        let content = this.refs.rawContent;
        if(content !== undefined){
            const link = document.createElement("a");
            const file = new Blob([content.innerHTML], { type: 'text/plain' });
            link.href = URL.createObjectURL(file);
            link.download = 'apex-' + this.logId + '.log';
            link.click();
            URL.revokeObjectURL(link.href);
        }
    }
    fetchRawLog(apexLogId){
        this.isLoading = true;
        retrieveRawLog({ userId: this.userId, apiVersion: this.apiValue, logId: apexLogId})
		.then(result => {
            if(result){
                this.isLoading = false;
                this.rawLogValue = result;
                console.log('result==',result);
            }else{
                this.showToastMessage('error', 'Failed to retrieve debug log:'+result);
            }
		})
		.catch(error => {
            this.isLoading = false;
			console.log('error',error);
            this.showToastMessage('error', error);
		})
    }
    
    handleCopyResponse(){
        let content = this.refs.rawContent;
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
    showToastMessage(variant, message){
        let title = (variant === 'error' ? 'Error:' : 'Success:');
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