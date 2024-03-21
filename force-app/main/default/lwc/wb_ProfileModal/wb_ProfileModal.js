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
    @wire(CurrentPageReference) pageRef;

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