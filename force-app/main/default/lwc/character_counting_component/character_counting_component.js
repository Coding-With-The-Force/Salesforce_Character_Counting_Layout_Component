/**
 * Created by gerry on 4/30/2022.
 */

import {LightningElement, api, track} from 'lwc';
import {loadStyle} from "lightning/platformResourceLoader";
import {NavigationMixin} from "lightning/navigation";
import characterCountingComponentStyle from '@salesforce/resourceUrl/character_counter_css';
import getFieldsToDisplayController from '@salesforce/apex/Character_Counting_Component_Controller.getFieldsToDisplay';
import canUserEditRecordController from '@salesforce/apex/Character_Counting_Component_Controller.canUserEditRecord';
import {ShowToastEvent} from "lightning/platformShowToastEvent";


export default class CharacterCountingComponent extends NavigationMixin(LightningElement) {
	@api recordId;
	@api objectApiName;
	@api sectionHeader;
	@api fieldSetName;
	@api renderEditButton = false;
	@api renderSaveButton = false;
	@api displayAsFieldSection = false;
	@api displayAsIndependentSection = false;
	@api fieldColumns = 1;
	@api characterWarningThreshold = 25;
	@api iconName = "";

	@track fieldData;
	errorMsg;
	@track activeSections = [];
	userEditing = false;
	dataRetrieved = false;
	userCreatingRecord = false;

	@api saveData(){
		this.template.querySelector('c-character_counter_record_view_form').saveData();
	}

	async connectedCallback() {
		await this.prepComponent();
	}

	async prepComponent(){
		await loadStyle(this, characterCountingComponentStyle);
		this.setActiveSections();
		if(this.recordId) {
			this.canUserEditRecord();
		}
		else{
			console.log('Got into the creation block :::');
			this.userCreatingRecord = true;
		}
		this.getFieldsToDisplay();
	}

	setActiveSections(){
		this.activeSections = [this.sectionHeader];
	}

	canUserEditRecord(){
		canUserEditRecordController({recordId: this.recordId}).then(canUserEdit =>{
			if(canUserEdit === false && this.renderEditButton === true) {
				this.renderEditButton = canUserEdit;
			}
		}).catch(error =>{
			this.displayErrors(error);
		});
	}


	getFieldsToDisplay(){
		getFieldsToDisplayController({fieldSetName: this.fieldSetName, objectApiName: this.objectApiName,
			recordId: this.recordId, characterWarningThreshold: this.characterWarningThreshold}).then(fieldInfo =>{
				console.log('This is the field data ::: ' + JSON.stringify(fieldInfo));
			this.fieldData = fieldInfo;
			this.dataRetrieved = true;
		}).catch(error =>{
			this.displayErrors(error);
		})
	}

	enableEditing(){
		this.userEditing = true;
	}

	disableEditing(){
		if(this.recordId) {
			this.userEditing = false;
		}
		else{
			this.navigateToObjectHomePage();
		}
	}

	navigateToObjectHomePage(){
		this[NavigationMixin.Navigate]({
			type: 'standard__objectPage',
			attributes: {
				objectApiName: this.objectApiName,
				actionName: 'home'
			}
		});
	}

	updateFieldData(event){
		this.fieldData = event.detail.fielddata;
		this.disableEditing();
	}

	displayErrors(error){
		this.handleErrors(error);
		this.dispatchEvent(this.showToast('Error', this.errorMsg, 'error', 'sticky'));
	}

	handleErrors(err){
		if (Array.isArray(err.body)) {
			this.errorMsg = err.body.map(e => e.message).join(', ');
		} else if (typeof err.body.message === 'string') {
			this.errorMsg = err.body.message;
		}
	}

	showToast(toastTitle, toastMessage, toastVariant, toastMode) {
		const evt = new ShowToastEvent({
			title: toastTitle,
			message: toastMessage,
			variant: toastVariant,
			mode: toastMode
		});
		return evt;
	}

	get notEditingAndDataRetrieved(){
		if(this.userEditing === false && this.userCreatingRecord === false && this.dataRetrieved === true){
			return true;
		}
	}

	get userEditingOrCreating(){
		if((this.userEditing === true || this.userCreatingRecord === true) && this.dataRetrieved === true){
			return true;
		}
	}
}