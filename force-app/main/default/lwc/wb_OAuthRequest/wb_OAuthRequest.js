import { LightningElement, wire } from 'lwc';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';

export default class Wb_OAuthRequest extends NavigationMixin(LightningElement) {

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
       if (currentPageReference) {
          let codeVal = currentPageReference.state?.code;
          let stateVal = currentPageReference.state?.state;
          if(codeVal && stateVal){
            let sessionKey = codeVal+'&'+stateVal;
            localStorage.setItem("WB_SESSIONKEY",sessionKey);
            this.navigateToExperiencePage('WorkbenchHome__c');
          }
       }
    }

    navigateToExperiencePage(pageName) {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: pageName
            }
        });
    }
}