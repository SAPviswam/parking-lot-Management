
sap.ui.define([
    "sap/ui/Device",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Popover",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format"

], function (Device, Controller, JSONModel, Popover, Button, library, MessageToast, MessageBox, exportLibrary, Spreadsheet, Filter, FilterOperator, ChartFormatter, Format) {
    "use strict";
    var EdmType = exportLibrary.EdmType;//Export table
    return Controller.extend("com.app.parkinglotmanagement.controller.Entrance", {

        onInit: function () {
            // var oModel = new JSONModel();
            
        },
        onSelectSlot: function (oEvent) {
            const oSelectedItem = oEvent.getSource().getSelectedItem();
            const oContext = oSelectedItem.getBindingContext().getObject();
            
            // Check if the slot status is "Occupied"
            if (oContext.status === "Occupied") {
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("Routslotdetails", {
                    slotassign: oContext.ID
                });
            } else {
                // Display an error message
                sap.m.MessageBox.error("Slot is not occupied. You can only view details of occupied slots.");
            }
        },
        

        onSelectItem: function (oEvent) {
            var oItem = oEvent.getParameter("item").getKey();
            var navContainer = this.getView().byId("pageContainer");

            switch (oItem) {
                case "AllSlots":
                    navContainer.to(this.getView().createId("Page1"));
                    break;
                case "AssignedSlots":
                    navContainer.to(this.getView().createId("Page2"));
                    break;
                case "Parking-lotAllocation":
                    navContainer.to(this.getView().createId("Page3"));
                    break;
                case "History":
                    navContainer.to(this.getView().createId("Page4"));
                    break;
                case "DataVisualization":
                    navContainer.to(this.getView().createId("Page5"));
                    break;
                case "Reservations":
                    navContainer.to(this.getView().createId("Page6"));
                    break;
            }
        },

        onSideNavButtonPress: function () {
            var oToolPage = this.byId("toolPage");
            var bSideExpanded = oToolPage.getSideExpanded();

            this._setToggleButtonTooltip(bSideExpanded);

            oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
        },

        _setToggleButtonTooltip: function (bLarge) {
            var oToggleButton = this.byId('sideNavigationToggleButton');
            if (bLarge) {
                oToggleButton.setTooltip('Large Size Navigation');
            } else {
                oToggleButton.setTooltip('Small Size Navigation');
            }
        },

        onSearch: function (oEvent) {
            // Get the search query
            var sQuery = oEvent.getParameter("query");
            // Get the ID of the search field that triggered the search
            var sSearchFieldId = oEvent.getSource().getId();

            // Determine the target table based on the search field ID
            var oTable;
            var aFilters = [];

            if (sSearchFieldId.includes("SearchField1")) {
                oTable = this.byId("allSlotsTable");
                // Build filters based on the search query for Parkingslots
                if (sQuery) {
                    aFilters.push(new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("slotno", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("type", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.Contains, sQuery),
                        ],
                        and: false
                    }));
                }
            } else if (sSearchFieldId.includes("SearchField2")) {
                oTable = this.byId("assignedSlotsTable");
                // Build filters based on the search query for Parkinglotassign
                if (sQuery) {
                    aFilters.push(new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("vehicleNo", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("driverName", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("phoneNo", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("truckType", sap.ui.model.FilterOperator.Contains, sQuery),
                            // new sap.ui.model.Filter("time", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("parkingslot_slotno", sap.ui.model.FilterOperator.Contains, sQuery)
                        ],
                        and: false
                    }));
                }
            }
            else if (sSearchFieldId.includes("SearchField3")) {
                oTable = this.byId("historyTable");
                // Build filters based on the search query for ParkingHistory
                if (sQuery) {
                    aFilters.push(new sap.ui.model.Filter({
                        filters: [
                            new sap.ui.model.Filter("parkingslot/slotno", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("parkingslot/type", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("parkingslot/status", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("parkinglotassign/vehicleNo", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("parkinglotassign/driverName", sap.ui.model.FilterOperator.Contains, sQuery),
                            new sap.ui.model.Filter("parkinglotassign/phoneNo", sap.ui.model.FilterOperator.Contains, sQuery),
                            // new sap.ui.model.Filter("parkinglotassign/time", sap.ui.model.FilterOperator.Contains, sQuery),
                            // new sap.ui.model.Filter("parkinglotunassign/time", sap.ui.model.FilterOperator.Contains, sQuery)
                        ],
                        and: false
                    }));
                }
            }


            // Get the binding of the target table and apply the filters
            if (oTable) {
                var oBinding = oTable.getBinding("items");
                oBinding.filter(aFilters);
            }
        },

        // onAddButtonPress: function(){
        //     if (!this.byId("addDialog")) {
        //         this.loadFragment({
        //             name: "com.app.yardmanagement.view.AddDialog"
        //         }).then(function (oDialog) {
        //             this.getView().addDependent(oDialog);
        //             oDialog.open();
        //         }.bind(this));
        //     } else {
        //         this.byId("addDialog").open();
        //     }
        // },
        // onCancelDialog: function () {
        //     this.byId("addDialog").close();
        // },
        onReserve: function(){
            if (!this.byId("reserveDialog")) {
                this.loadFragment({
                    name: "com.app.yardmanagement.view.ReserveDialog"
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this.byId("reserveDialog").open();
            }
        },

        onCancelReserve: function () {
            this.byId("reserveDialog").close();
            this.byId("inputReserveVehicleno").setValue("");
            this.byId("inputReserveDriverName").setValue("");
            this.byId("inputReservePhoneno").setValue("");
            this.byId("DTI1").setValue("");
            this.byId("_IDSlotReserveInput").setValue("");
            this.byId("_IDReserveInput").setValue("");
        },

        onSaveParkingSlot: async function () {

        },
        //Export Assigned Slots table as xl format
        createColumnConfig: function () {
            return [
                { label: 'Vehicle no', property: 'vehicleNo', type: EdmType.String },
                { label: 'Driver name', property: 'driverName', type: EdmType.String },
                { label: 'Phone no', property: 'phoneNo', type: EdmType.String },
                { label: 'Type (Inward / Outward)', property: 'truckType', type: EdmType.String },
                { label: 'Assign Time', property: 'time', type: EdmType.String },
                { label: 'Status', property: 'status', type: EdmType.String },
                { label: 'Slot no', property: 'parkingslot_slotno', type: EdmType.String }
            ];
        },
        onExport: function () {
            var aCols, oBinding, oSettings, oSheet, oTable;

            oTable = this.byId('assignedSlotsTable');
            oBinding = oTable.getBinding('items');
            aCols = this.createColumnConfig();

            oSettings = {
                workbook: { columns: aCols },
                dataSource: oBinding,
                fileName: 'Assigned Slots.xlsx'
            };
            oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .then(function () {
                    MessageToast.show('Spreadsheet export has finished');
                })
                .finally(function () {
                    oSheet.destroy();
                });
        },
        //Export History table as xl format
        createColumnConfig: function() {
            return [
                { label: 'Slot no', property: 'parkingslot/slotno', type: EdmType.String },
                { label: 'Type (Inward / Outward)', property: 'parkingslot/type', type: EdmType.String },
                { label: 'Vehicle no', property: 'parkinglotassign/vehicleNo', type: EdmType.String},
                { label: 'Driver name', property: 'parkinglotassign/driverName', type: EdmType.String },
                { label: 'Phone no', property: 'parkinglotassign/phoneNo', type: EdmType.String },
                { label: 'Status', property: 'parkingslot/status', type: EdmType.String },
                { label: 'Assigned (Date / Time)', property: 'parkinglotassign/time', type: EdmType.String },
                { label: 'Un-Assigned (Date / Time)', property: 'parkinglotunassign/time', type: EdmType.String },
            ];
        },
        onHistoryExport: function() {
            var aCols, oBinding, oSettings, oSheet, oTable;

            oTable = this.byId('historyTable');
            oBinding = oTable.getBinding('items');
            aCols = this.createColumnConfig();

            oSettings = {
                workbook: { columns: aCols },
                dataSource: oBinding,
                fileName: 'HIstory Slots.xlsx'
            };
         oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .then(function() {
                    MessageToast.show('Spreadsheet export has finished');
                })
                .finally(function() {
                    oSheet.destroy();
                });
        },
    });
});
