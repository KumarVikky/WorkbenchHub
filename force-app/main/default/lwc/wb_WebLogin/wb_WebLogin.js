import { LightningElement, track} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getConsumerInfo from '@salesforce/apex/WB_WorkbenchController.getConsumerDetails';
import WORKBENCH from '@salesforce/resourceUrl/Workbench'
export default class Wb_WebLogin extends NavigationMixin(LightningElement) {
    @track envValue = 'Production';
    @track apiVersionValue = '60.0';
    @track isLoading = false;
    @track clientId;
    @track clientSecret;
    heartIcon = WORKBENCH + '/Workbench/heart.svg';

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
    connectedCallback(){
        this.fetchConsumerInfo();
    }
    fetchConsumerInfo(){
        this.isLoading = true;
		getConsumerInfo()
        .then(result => {
            this.isLoading = false;
            this.clientId = result.CLIENT_ID;
            this.clientSecret = result.CLIENT_SECRET;
        })
        .catch(error => {
            console.log('error',error);
            this.isLoading = false;
        })
	} 
    handleLogin(){
        let authURL = 'https://login.salesforce.com/services/oauth2/authorize';
        if(this.envValue === 'Sandbox'){
            authURL = 'https://test.salesforce.com/services/oauth2/authorize';
        }
        let responseTypeCode = 'code';
        let prompType = 'login';
        let envKey = (this.envValue === 'Production' ? 'P' : 'S');
        let redirectURI = 'https://salesarena-dev-ed.my.site.com/Workbench/s/weblogin/oauthrequest';
        let params = '?response_type=' + responseTypeCode +
            '&client_id=' + encodeURIComponent(this.clientId) +
            '&client_secret=' + encodeURIComponent(this.clientSecret) +
            '&prompt=' + prompType +
            '&redirect_uri=' + redirectURI + '&prompt=consent' +
            '&scope=' + encodeURIComponent('id profile email address phone api web sfap_api refresh_token') +
            '&state=' + encodeURIComponent(envKey+'_'+this.apiVersionValue);
       let url = authURL + params;
       let wbSessionKey = localStorage.getItem("WB_SESSIONKEY");
       if(wbSessionKey){
            localStorage.removeItem("WB_SESSIONKEY");
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
    
}