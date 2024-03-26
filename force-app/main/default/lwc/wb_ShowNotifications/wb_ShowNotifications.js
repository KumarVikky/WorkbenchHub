import { LightningElement, api, track } from 'lwc';

export default class Wb_ShowNotifications extends LightningElement {
    hasNotify = false;
    @track notification;
    @api
    showNotification(type, message){
        let toast = {
            type: type,
            headerMessage: type,
            message: message,
            iconName: "utility:" + type,
            headerClass: "slds-notify slds-notify_toast slds-theme_" + type
          };
          this.notification = toast;
          this.hasNotify = true;
    }
    @api
    hideNotification(){
        this.hasNotify = false;
    }
}