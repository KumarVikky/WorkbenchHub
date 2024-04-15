import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { IdleTimer } from './IdleTimer';
import LightningAlert from 'lightning/alert';
import getAccessToken from '@salesforce/apex/WB_WorkbenchController.getAccessToken';
import getUserInfo from '@salesforce/apex/WB_WorkbenchController.getUserDetails';
import revokeAccess from '@salesforce/apex/WB_WorkbenchController.revokeAccess';
import addRemoteSite from '@salesforce/apex/WB_WorkbenchController.addRemoteSite';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { fireEvent } from 'c/wb_PubSub';
import profileSection from 'c/wb_ProfileModal';

export default class Wb_Home extends NavigationMixin(LightningElement) {
    @track codeValue;
    @track envValue;
    @track apiValue;
    @track userId;
    @track customDomain;
    @track hasUserToken = false;
    @track isLoading = false;
    userName;
    userFullName;
    profileObj;
    _idletimer;
    @wire(CurrentPageReference) pageRef;

    connectedCallback(){
        const onTimeout = () => {
            if(this.pageRef){
                fireEvent(this.pageRef, 'closeAllModal', true);
            }
            this._idletimer.deactivate();
            this.logOutSession();
            localStorage.removeItem("WB_SESSIONKEY");
            this.alertHandler('Session has expired due to inactivity, please login again.');
            this.navigateToExperiencePage("WorkbenchLogin__c");
        };
        this._idletimer = new IdleTimer(onTimeout, 900000);//15 min of inactivity
        this._idletimer.activate(); 
        let wbSessionKey = localStorage.getItem("WB_SESSIONKEY");
        if(wbSessionKey){
            this.codeValue = wbSessionKey.substring(0, wbSessionKey.indexOf('&'));
            const state = wbSessionKey.slice(wbSessionKey.indexOf('&') + 1);
            this.envValue = state.substring(0, state.indexOf('_'));
            this.apiValue = state.slice(state.indexOf('_') + 1);
            this.fetchAccessToken();
        }else{
            this.navigateToExperiencePage("WorkbenchLogin__c");
        }
    }
    disconnectedCallback() {
        this._idletimer.deactivate();
        this.logOutSession();
    }
    fetchAccessToken(){
        this.isLoading = true;
        let endPointURL = (this.envValue === 'P' ? 'https://login.salesforce.com' : 'https://test.salesforce.com');
		getAccessToken({ codeValue: this.codeValue, endPointURL: endPointURL})
		.then(result => {
            if(result){
                this.userId = result;
                this.addURLToRemoteSiteSetting();
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
    addURLToRemoteSiteSetting(){
        addRemoteSite({userId: this.userId, name:'WB_InternalSite_', hostURL: ''})
        .then(result => {
            if(result){
                if(result.includes('success')){
                    this.hasUserToken = true;
                    this.fetchUserInfo();
                    this.isLoading = false;
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
    fetchUserInfo(){
		getUserInfo({ userId: this.userId})
		.then(result => {
            if(result){
                let response = JSON.parse(result);
                this.userName = response.preferred_username;
                this.customDomain = response.urls.custom_domain;
                this.userFullName = response.name;
                let initials = response.name.split(" ").map((n)=>n[0]).join("");
                let address = response.address.street_address + ' ' + response.address.country + '-' + response.address.postal_code;
                this.profileObj = {'nameInitials':initials, 'name':response.name, 'nickName':response.nickname, 'userName':response.preferred_username, 'emailId':response.email, 'phoneNumber':response.phone_number, 'userId':response.user_id, 'organizationId':response.organization_id, 'zoneInfo':response.zoneinfo,'locale':response.locale, 'language':response.language, 'address':address};
            }else{
                this.showToastMessage('error', 'Failed to retrieve user info.');
            }
		})
		.catch(error => {
            console.log('error',error);
            this.showToastMessage('error', error);
		})
	}
    navigateToExperiencePage(pageName) {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: pageName
            },
        });
    }
    async alertHandler(message) {
        await LightningAlert.open({
            message: message,
            theme: 'error',
            label: 'Error!', 
        });
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
    handleUserMenu(event){
        let menuItem = event.detail.value;
        if(menuItem === 'LogOut'){
            this.logOutSession();
        }
        if(menuItem === 'ProfileMenu'){
            this.showProfileDetails();
        }
    }
    logOutSession(){
        this.isLoading = true;
        revokeAccess({ userId: this.userId})
		.then(result => {
            if(result === 'Success'){
                this.showToastMessage('success', 'Logged out successfully.');
            }
            this.isLoading = false;
            localStorage.removeItem("WB_SESSIONKEY");
            this._idletimer.deactivate();
            this.navigateToExperiencePage("WorkbenchLogin__c");
		})
		.catch(error => {
            console.log('error',error);
            this.isLoading = false;
            this.showToastMessage('error', error);
		})
    }
    async showProfileDetails(){
        const result = await profileSection.open({
            size: 'medium',
            description: 'Profile modal',
            profileData:  this.profileObj,
        });
    }
    showNotification(event){
        let data = event.detail;
        if(data.message != null && data.type != null){
            this.template.querySelector("c-wb_-show-notifications").showNotification(data.type, data.message);
        }
    }
    hideNotification(event){
        let data = event.detail;
        if(data === 'close'){
            this.template.querySelector("c-wb_-show-notifications").hideNotification();
        }
    }
}