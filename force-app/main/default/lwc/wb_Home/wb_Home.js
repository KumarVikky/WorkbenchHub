import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { IdleTimer } from './IdleTimer';
import LightningAlert from 'lightning/alert';
import addRemoteSite from '@salesforce/apex/WB_WorkbenchHubController.addRemoteSite';
import getUserInfo from '@salesforce/apex/WB_WorkbenchHubController.getUserDetails';
import revokeAccess from '@salesforce/apex/WB_WorkbenchHubController.revokeAccess';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { fireEvent } from 'c/wb_PubSub';
import profileSection from 'c/wb_ProfileModal';

export default class Wb_Home extends NavigationMixin(LightningElement) {
    @track apiValue;
    @track userId;
    @track customDomain;
    @track hasUserToken = false;
    @track isLoading = false;
    userName;
    userFullName;
    profileObj;
    _idletimer;
    hasContinuation = false;
    hasSessionWarning = false;
    timeLeft;
    hasInitiateOnce= false;
    @wire(CurrentPageReference) pageRef;

    get sessionWarningMessage(){
        return `Hey ${this.userFullName}, session will expire in next ${this.timeLeft} seconds due to inactivity, click ok to continue.`;
    }

    connectedCallback(){
        let wbSessionKey = sessionStorage.getItem("WB_SESSIONKEY");
        if(wbSessionKey){
            this.userId = wbSessionKey.substring(0, 18);
            this.apiValue = wbSessionKey.substring(18, wbSessionKey.length);
            this.addURLToRemoteSiteSetting();
            this.handleIdleTime();
            this.hasUserToken = true;
        }else{
            this.navigateToExperiencePage("WorkbenchLogin__c");
        }
    }
    renderedCallback(){
        if(!this.hasInitiateOnce){
            this.initiateSubscribe();
            this.hasInitiateOnce = true;
        }
    }
    disconnectedCallback() {
        this._idletimer.deactivate();
        this.logOutSession();
    }
    addURLToRemoteSiteSetting(){
        this.isLoading = true;
        addRemoteSite({userId: this.userId, name:'WB_InternalSite_', hostURL: ''})
        .then(result => {
            if(result){
                if(result.includes('success')){
                    this.fetchUserInfo();
                }else{
                    this.showToastMessage('error', 'Failed to add domain to Remote Site Setting: ' + result);
                    this.navigateToExperiencePage("WorkbenchLogin__c");
                }
                this.isLoading = false;
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
    handleContinueSession(){
        this.hasContinuation = true;
    }
    async alertHandler(message) {
        await LightningAlert.open({
            message: message,
            theme: 'error',
            label: 'Session Expired!'
        });
    }
    handleIdleTime(){
        const onTimeout = () => {
            this._idletimer.deactivate();
            this.handleSessionCountdown();
        };
        this._idletimer = new IdleTimer(onTimeout, 15*60*1000);// 15 minutes of inactivity.
        this._idletimer.activate();
    }
    destroySession(){
        if(this.pageRef){
            fireEvent(this.pageRef, 'closeAllModal', true);
        }
        this.logOutSession();
        sessionStorage.removeItem("WB_SESSIONKEY");
        this.alertHandler('Session has expired due to inactivity, please login again.');
        this.navigateToExperiencePage("WorkbenchLogin__c");
    }
    handleSessionCountdown(){
        this.timeLeft = 30;
        this.hasSessionWarning = true;
        if(!this.hasMobileDevice()){
            this.notifyUser();
        }
        const timerId = setInterval(() => {
            if(this.timeLeft === 0){
                clearInterval(timerId);
                this.hasSessionWarning = false;
                this.destroySession();
            }else{
                if(this.hasContinuation === true){
                    clearInterval(timerId);
                    this.hasSessionWarning = false;
                    this.hasContinuation = false;
                    this.handleIdleTime();
                }
                this.timeLeft --;
            }
        }, 1000);
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
    initiateSubscribe(){
        this.template.querySelector('[data-id="Notify_Btn"]').click();
    }
    subscribeNotification(){
        if(("Notification" in window) && !this.hasMobileDevice()){
            Notification.requestPermission(); 
        }
    }
    notifyUser(){
        let message = `Hey ${this.userFullName}, are you still there? WorkbenchHub session will expire soon due to inactivity.`;
        if(("Notification" in window)){
            if(Notification.permission === "granted"){
                const notification = new Notification(message);
            }
        }
    }
    hasMobileDevice(){
        return (document.documentElement.clientWidth <= 768);
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
            sessionStorage.removeItem("WB_SESSIONKEY");
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