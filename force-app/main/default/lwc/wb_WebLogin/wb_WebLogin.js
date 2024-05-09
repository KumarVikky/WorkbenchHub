import { LightningElement, track} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getConsumerInfo from '@salesforce/apex/WB_WorkbenchHubController.getConsumerDetails';
import getMaintenanceWindow from '@salesforce/apex/WB_WorkbenchHubController.fetchMaintenanceWindow';
import WORKBENCH from '@salesforce/resourceUrl/Workbench'
export default class Wb_WebLogin extends NavigationMixin(LightningElement) {
    @track envValue = 'Production';
    @track apiVersionValue = '60.0';
    @track isLoading = false;
    clientId;
    clientSecret;
    prodAuthURL;
    sandboxAuthURL;
    redirectURL;
    collapsible = true;
	expanded = false;
    heartIcon = WORKBENCH + '/Workbench/heart.svg';
    @track maintenanceItems = [];

    get envOptions() {
        return [
            { label: 'Production', value: 'Production' },
            { label: 'Sandbox', value: 'Sandbox' },
        ];
    }
    get apiVersionOptions() {
        return [
            { label: '60.0', value: '60.0' },
            { label: '59.0', value: '59.0' },
            { label: '58.0', value: '58.0' },
            { label: '57.0', value: '57.0' },
            { label: '56.0', value: '56.0' },
            { label: '55.0', value: '55.0' },
            { label: '54.0', value: '54.0' },
            { label: '53.0', value: '53.0' },
            { label: '52.0', value: '52.0' },
            { label: '51.0', value: '51.0' },
            { label: '50.0', value: '50.0' },
        ];
    }
    get hasMaintenance(){
        return this.maintenanceItems.length > 0 ? true : false;
    }

    connectedCallback(){
        this.fetchConsumerInfo();
        this.fetchMaintenanceWindow();
    }
    handleExpansion(){
        this.expanded = !this.expanded;
    }
    fetchConsumerInfo(){
        this.isLoading = true;
		getConsumerInfo()
        .then(result => {
            this.isLoading = false;
            this.clientId = result.CLIENT_ID;
            this.clientSecret = result.CLIENT_SECRET;
            this.prodAuthURL = result.PROD_AUTH_URL;
            this.sandboxAuthURL = result.SANDBOX_AUTH_URL;
            this.redirectURL = result.REDIRECT_URL;
        })
        .catch(error => {
            console.log('error',error);
            this.isLoading = false;
        })
	} 
    fetchMaintenanceWindow(){
		getMaintenanceWindow()
        .then(result => {
            let response = JSON.parse(result);
            let labelHeader = 'Upcoming Events: ';
            if(response.Maintenances){
                for(let main of response.Maintenances){
                    if(main.message && main.message.maintenanceType && main.message.eventStatus === "confirmed"){
                        let plannedStartDateTime = new Date(main.plannedStartTime);
                        let plannedEndDateTime = new Date(main.plannedEndTime);
                        let currentDateTime = new Date();
                        if(main.message.maintenanceType === 'scheduledMaintenance'){
                            if(plannedEndDateTime >= currentDateTime){
                                let label = 'Scheduled maintenance for the ' + main.name + ' on ' + plannedStartDateTime.toUTCString() + ' – ' + plannedEndDateTime.toUTCString();
                                let notification = { type: 'icon', label: labelHeader + label, name: 'Schedule', iconName: 'utility:info_alt', alternativeText: 'Maintenance Events'};
                                this.maintenanceItems.push(notification);
                            }
                        }
                        if(main.message.maintenanceType === 'release'){
                            if(plannedEndDateTime >= currentDateTime){
                                let label = 'Schedule release of the ' + main.name + ' on ' + plannedStartDateTime.toUTCString() + ' – ' + plannedEndDateTime.toUTCString();
                                let notification = { type: 'icon', label: labelHeader + label, name: 'Schedule', iconName: 'utility:info_alt', alternativeText: 'Release Events'};
                                this.maintenanceItems.push(notification);
                            }
                        }
                    }
                }
            }
        })
        .catch(error => {
            console.log('error',error);
            this.isLoading = false;
        })
	} 
    handleLogin(){
        let authURL = this.prodAuthURL;
        if(this.envValue === 'Sandbox'){
            authURL = this.sandboxAuthURL;
        }
        let responseTypeCode = 'code';
        let prompType = 'login';
        let envKey = (this.envValue === 'Production' ? 'p' : 's');
        let redirectURI = this.redirectURL;
        let params = '?response_type=' + responseTypeCode +
            '&client_id=' + encodeURIComponent(this.clientId) +
            '&client_secret=' + encodeURIComponent(this.clientSecret) +
            '&prompt=' + prompType +
            '&redirect_uri=' + redirectURI + '&prompt=consent' +
            '&scope=' + encodeURIComponent('id profile email address phone api web sfap_api refresh_token') +
            '&state=' + encodeURIComponent(envKey + this.apiVersionValue);
       let url = authURL + params;
       let wbSessionKey = sessionStorage.getItem("WB_SESSIONKEY");
       if(wbSessionKey){
            sessionStorage.removeItem("WB_SESSIONKEY");
       }
       this.navigateToWebPage(url);
    }
    navigateToWebPage(url) {
        this[NavigationMixin.Navigate]({
            "type": "standard__webPage",
            "attributes": {
                "url": url
            }
        });
    }
    handleEnvChange(event) {
        this.envValue = event.detail.value;
    }
    handleApiChange(event) {
        this.apiVersionValue = event.detail.value;
    }
    handleItemRemove(event) {
        const index = event.detail.index;
        this.maintenanceItems.splice(index, 1);
    }
}