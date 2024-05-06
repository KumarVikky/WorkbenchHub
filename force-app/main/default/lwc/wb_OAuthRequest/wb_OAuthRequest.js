import { LightningElement, wire } from 'lwc';
import getAccessToken from '@salesforce/apex/WB_WorkbenchHubController.getAccessToken';
import addRemoteSite from '@salesforce/apex/WB_WorkbenchHubController.addRemoteSite';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';

export default class Wb_OAuthRequest extends NavigationMixin(LightningElement) {
    _prodURL = 'https://login.salesforce.com';
    _sandboxURL = 'https://test.salesforce.com';
    _userId = '';
    apiValue = '';
    isLoading = false;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if(currentPageReference) {
            let codeVal = currentPageReference.state?.code;
            let stateVal = currentPageReference.state?.state;
            if(codeVal && stateVal){
                let crrUrl = window.location.href;
                let nextUrl = crrUrl.substring(0, crrUrl.indexOf('?'));
                window.history.pushState('', '', nextUrl);
                let envValue = stateVal.substring(0, 1);
                this.apiValue = stateVal.substring(1, stateVal.length);
                let endPointUrlVal = (envValue === 'p' ? this._prodURL : this._sandboxURL);
                this.fetchAccessToken(codeVal, endPointUrlVal);
            }
        }
    }

    connectedCallback(){
        if(this.apiValue === ''){
            this.navigateToExperiencePage("WorkbenchLogin__c");
        }
    }

    fetchAccessToken(codeVal, endPointUrlVal){
        this.isLoading = true;
		getAccessToken({ codeValue: codeVal, endPointURL: endPointUrlVal})
		.then(result => {
            if(result){
                this._userId = result;
                this.showToastMessage('success', 'Logged in successfully.');
                this.addURLToRemoteSiteSetting(this._userId);
            }else{
                this.showToastMessage('error', 'Session expired or invalid! please login again.');
                this.navigateToExperiencePage("WorkbenchLogin__c");
            }
		})
		.catch(error => {
            console.log('error',error);
            this.isLoading = false;
            this.showToastMessage('error', error);
		})
	}
    addURLToRemoteSiteSetting(userIdVal){
        addRemoteSite({userId: userIdVal, name:'WB_InternalSite_', hostURL: ''})
        .then(result => {
            if(result){
                if(result.includes('success')){
                    this.isLoading = false;
                    let sessionKey = this._userId + this.apiValue;
                    sessionStorage.setItem("WB_SESSIONKEY", sessionKey);
                    this.navigateToExperiencePage('WorkbenchHome__c');
                }else{
                    this.showToastMessage('error', 'Failed to add domain to Remote Site Setting: ' + result);
                    this.navigateToExperiencePage("WorkbenchLogin__c");
                }
            }
        })
        .catch(error => {
            this.isLoading = false;
            console.log('error',error);
            this.showToastMessage('error', error);
        })
    } 
    navigateToExperiencePage(pageName) {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: pageName
            }
        });
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