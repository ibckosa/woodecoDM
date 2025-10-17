sap.ui.define([
    "sap/ui/model/resource/ResourceModel",
    "sap/dm/dme/podfoundation/control/PropertyEditor"
], function (ResourceModel, PropertyEditor) {
    "use strict";
    
    var oFormContainer;

    return PropertyEditor.extend( "ibc.dm.vPlgComponents.vPlgComponents.builder.PropertyEditor" ,{

		constructor: function(sId, mSettings){
			PropertyEditor.apply(this, arguments);
			
			this.setI18nKeyPrefix("customComponentListConfig.");
			this.setResourceBundleName("ibc.dm.vPlgComponents.vPlgComponents.i18n.builder");
			this.setPluginResourceBundleName("ibc.dm.vPlgComponents.vPlgComponents.i18n.i18n");
		},
		
		addPropertyEditorContent: function(oPropertyFormContainer){
			var oData = this.getPropertyData();
			
						
			this.addInputField(oPropertyFormContainer, "zweiURL", oData);
			this.addInputField(oPropertyFormContainer, "dummyOrder", oData);
			this.addInputField(oPropertyFormContainer, "dummySfc", oData);

            oFormContainer = oPropertyFormContainer;
		},
		
		getDefaultPropertyData: function(){
			return {
				
				"dummySfc": "",
				"dummyOrder": "",
                "zweiURL": ""
                
			};
		}

	});
});