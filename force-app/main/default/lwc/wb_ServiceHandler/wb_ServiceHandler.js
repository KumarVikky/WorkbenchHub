import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class Wb_ServiceHandler extends NavigationMixin(LightningElement) {
    connectedCallback(){
        let wbSessionKey = localStorage.getItem("WB_SESSIONKEY");
        //console.log('wbSessionKey',wbSessionKey);
        if(wbSessionKey){
            this.navigateToExperiencePage('WorkbenchHome__c');
        }else{
            this.navigateToExperiencePage('WorkbenchLogin__c');
        }
    }
    navigateToExperiencePage(pageName) {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: pageName
            },
        });
    }
}