sap.ui.define([
    "sap/ui/model/resource/ResourceModel",
    "sap/dm/dme/podfoundation/control/PropertyEditor"
], function (ResourceModel, PropertyEditor) {
    "use strict";
    
    var oFormContainer;

    return PropertyEditor.extend( "ibc.dm.vPlgReverse.vPlgReverse.builder.PropertyEditor" ,{

		constructor: function(sId, mSettings){
			PropertyEditor.apply(this, arguments);
			
			this.setI18nKeyPrefix("customComponentListConfig.");
			this.setResourceBundleName("ibc.dm.vPlgReverse.vPlgReverse.i18n.builder");
			this.setPluginResourceBundleName("ibc.dm.vPlgReverse.vPlgReverse.i18n.i18n");
		},
		
		addPropertyEditorContent: function(oPropertyFormContainer){
			var oData = this.getPropertyData();
			
			// this.addSwitch(oPropertyFormContainer, "backButtonVisible", oData);
			// this.addSwitch(oPropertyFormContainer, "closeButtonVisible", oData);
						
			this.addInputField(oPropertyFormContainer, "zweiURL", oData);
			this.addInputField(oPropertyFormContainer, "dummyOrder", oData);
			this.addInputField(oPropertyFormContainer, "dummySfc", oData);
			this.addInputField(oPropertyFormContainer, "stornoURL", oData);
			this.addInputField(oPropertyFormContainer, "title", oData);
			this.addSwitch(oPropertyFormContainer, "stornoButtonVisible", oData);
			//this.addInputField(oPropertyFormContainer, "text", oData);

		
			

            oFormContainer = oPropertyFormContainer;
		},
		
		getDefaultPropertyData: function(){
			return {
				
				// "backButtonVisible": true,
				// "closeButtonVisible": true,
                "title": "vPlgReverse",
				// "text": "vPlgReverse",
				"zweiURL": "",
				"dummyOrder": "",
				"dummySfc": "",
				"stornoURL": "",
				"stornoButtonVisible": true
                
			};
		}

	});
});