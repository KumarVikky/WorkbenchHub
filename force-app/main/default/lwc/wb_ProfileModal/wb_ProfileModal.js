import { api, wire } from 'lwc';
import LightningModal from 'lightning/modal';
import { registerListener, unregisterAllListeners } from 'c/wb_PubSub';
import { CurrentPageReference } from 'lightning/navigation';

export default class Wb_ProfileModal extends LightningModal  {
    @api profileData;
    nameInitials;
    name;
    nickName;
    userName;
    emailId;
    phoneNumber;
    userId;
    organizationId;
    zoneInfo;
    locale;
    language;
    address;

    @wire(CurrentPageReference) pageRef;

    get headerLabel(){
        return this.name + ' (' + this.nameInitials + ')';
    }
    
    connectedCallback(){
        let proData = this.profileData;
        if(proData !== ''){
            this.nameInitials = proData.nameInitials;
            this.name = proData.name;
            this.nickName = proData.nickName;
            this.userName = proData.userName;
            this.emailId = proData.emailId;
            this.phoneNumber = proData.phoneNumber;
            this.userId = proData.userId;
            this.organizationId = proData.organizationId;
            this.zoneInfo = proData.zoneInfo;
            this.locale = proData.locale;
            this.language = proData.language;
            this.address = proData.address;
        }
        if(this.pageRef){
            registerListener('closeAllModal', this.handleEvent, this);
        }
    }
    disconnectedCallback(){
        unregisterAllListeners(this);
    }

    handleClose(){
        this.close('');
    }
    handleEvent(param){
        if(param === true){
            this.close('');
        }
    }
}