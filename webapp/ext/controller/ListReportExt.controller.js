sap.ui.define([
    "sap/ui/model/Filter", 
    "sap/ui/comp/smartfilterbar/SmartFilterBar", 
    "sap/m/ComboBox",
    "sap/m/MultiComboBox",
    "sap/ui/model/FilterOperator"
], function (Filter, SmartFilterBar, MultiComboBox, ComboBox, FilterOperator) {
    "use strict";
    return {
        getCustomAppStateDataExtension: function (oCustomData) {
            //the content of the custom field will be stored in the app state, so that it can be restored later, for example after a back navigation.
            //The developer has to ensure that the content of the field is stored in the object that is passed to this method.
            if (oCustomData) {
                var oCustomField1 = this.oView.byId("idPernr");
                if (oCustomField1) {
                    oCustomData.Pernr = oCustomField1.getSelectedKeys()[0];
                }
            }
        },
        restoreCustomAppStateDataExtension: function (oCustomData) {
            //in order to restore the content of the custom field in the filter bar, for example after a back navigation,
            //an object with the content is handed over to this method. Now the developer has to ensure that the content of the custom filter is set to the control
            if (oCustomData) {
                if (oCustomData.Pernr) {
                    var oComboBox = this.oView.byId("idPernr");
                    oComboBox.setSelectedKey(
                        oCustomData.Pernr
                    );
                }
            }
        },
        onBeforeRebindTableExtension: function(oEvent) {
            var oBindingParams = oEvent.getParameter("bindingParams");
            oBindingParams.parameters = oBindingParams.parameters || {};

            var oSmartTable = oEvent.getSource();
            var oSmartFilterBar = this.byId(oSmartTable.getSmartFilterId());
            if (oSmartFilterBar instanceof SmartFilterBar) {
                var oCustomControl = oSmartFilterBar.getControlByKey("PERNR");
                if (oCustomControl) {
                    oCustomControl.getTokens().forEach(function (sKey) {
                        oBindingParams.filters.push(new Filter("Pernr", "EQ", sKey.getKey()));
                    });
                }
            }
        },

        onAfterRendering: function () {
            sap.ui.core.BusyIndicator.show()
            this._getPersonels();
        },

        onMultiInputValueHelpRequest: function (oEvent) {
            this._oInput = oEvent.oSource;
			if (!this._searchHelpDialog) {
				var that = this;
				this._searchHelpDialog = new sap.m.SelectDialog({
					growingThreshold: 9999,
					title: "Personel Arama Yardımı",
                    multiSelect: true,
					search: this.searchDialog = function(oEvent) {
						var sValue = oEvent.getParameter("value");
						var oFilter = new Filter([
							new Filter("Pernr", FilterOperator.Contains, sValue),
							new Filter("Ename", FilterOperator.Contains, sValue),
						], false);
						var oBinding = oEvent.getSource().getBinding("items");
						oBinding.filter([oFilter]);
					},
					liveChange: this.searchDialog,
					confirm: function(oEvent) {
						var oSelectedItems = oEvent.getParameter("selectedItems");
						oEvent.getSource().getBinding("items").filter([]);
						if (!oSelectedItems) {
							return;
						}
						for (let i in oSelectedItems) {
							that._oInput.addToken(new sap.m.Token({
								text: oSelectedItems[i].getTitle(),
                                key: oSelectedItems[i].getTitle()
							}));
						}
					}
				});
				this._searchHelpDialog.setModel(this.getView().getModel("jsonModel"));
				this._searchHelpDialog.bindAggregation("items", {
					path: "/PersonelSHSet",
					length: 1000,
					template: new sap.m.StandardListItem({
						title: "{Pernr}",
						description: "{Ename}"
					})
				});
			}
			this._searchHelpDialog.open();
        },

        onMultiInputChange: function (oEvent) {
            oEvent.oSource.addToken(new sap.m.Token({
                key: oEvent.getParameter("value"),
                text: oEvent.getParameter("value")
            }));

            oEvent.oSource.setValue("");
        },

        _getPersonels: function(){
            this.getView().getModel().read("/PersonelSHSet", {
                success: function(oData){
                    var oModel = new sap.ui.model.json.JSONModel({
                        PersonelSHSet: oData.results
                    });
                    this.getView().setModel(oModel, "jsonModel");
                    sap.ui.core.BusyIndicator.hide();
                }.bind(this),
            });
        }
    };

});