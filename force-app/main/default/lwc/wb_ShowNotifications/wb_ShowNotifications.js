import { LightningElement, api, track } from 'lwc';

export default class Wb_ShowNotifications extends LightningElement {
    hasNotify = false;
    @track type;
    @track message;
    
    get getIconName() {
        return 'utility:' + this.type;
    }

    get innerClass() {
        return 'slds-icon_container slds-icon-utility-' + this.type + ' slds-icon-utility-success slds-var-m-right_small slds-no-flex slds-align-top';
    }

    get outerClass() {
        return 'slds-notify slds-notify_toast slds-theme_' + this.type;
    }

    @api
    showNotification(type, message){
        this.type = type;
        this.message = message;
        this.hasNotify = true;
    }
    @api
    hideNotification(){
       this.closeModel();
    }

    closeModel() {
        this.type = '';
        this.message = '';
        this.hasNotify = false;
	}
}