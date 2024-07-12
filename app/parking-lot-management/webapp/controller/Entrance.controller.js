sap.ui.define([
    "sap/ui/Device",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/Fragment",
    "sap/ui/model/odata/v2/ODataModel",
], function (Device, Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, exportLibrary, Spreadsheet, Fragment, ODataModel) {
    "use strict";
    var EdmType = exportLibrary.EdmType;
    return Controller.extend("com.app.parkinglotmanagement.controller.Entrance", {
      
        onInit: function () {
            var oModelV2 = new sap.ui.model.odata.v2.ODataModel("/v2/odata/v4/parking-lot/");
            this.getView().setModel(oModelV2, "ModelV2");

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
            debugger
            var oToolPage = this.byId("toolPage");
            var bSideExpanded = oToolPage.getSideExpanded();

            this._setToggleButtonTooltip(bSideExpanded);
            oToolPage.setSideExpanded(!bSideExpanded);
        },

        _setToggleButtonTooltip: function (bLarge) {
            var oToggleButton = this.byId('sideNavigationToggleButton');
            oToggleButton.setTooltip(bLarge ? 'Large Size Navigation' : 'Small Size Navigation');
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var sSearchFieldId = oEvent.getSource().getId();
            var oTable, aFilters = [];

            if (sSearchFieldId.includes("SearchField1")) {
                oTable = this.byId("allSlotsTable");
                if (sQuery) {
                    var aStringFilters = [
                        new Filter("slotno", FilterOperator.Contains, sQuery),
                        new Filter("type", FilterOperator.Contains, sQuery)
                    ];
                    aFilters.push(new Filter({ filters: aStringFilters, and: false }));

                    if (sQuery.toLowerCase() === "yes") {
                        aFilters.push(new Filter("Available", FilterOperator.EQ, true));
                    } else if (sQuery.toLowerCase() === "no") {
                        aFilters.push(new Filter("Available", FilterOperator.EQ, false));
                    }
                }
            } else if (sSearchFieldId.includes("SearchField2")) {
                oTable = this.byId("assignedSlotsTable");
                if (sQuery) {
                    var aStringFilters = [
                        new Filter("vehicleNo", FilterOperator.Contains, sQuery),
                        new Filter("driverName", FilterOperator.Contains, sQuery),
                        new Filter("phoneNo", FilterOperator.Contains, sQuery),
                        new Filter("truckType", FilterOperator.Contains, sQuery),
                        new Filter("parkingslot_slotno", FilterOperator.Contains, sQuery)
                    ];
                    var oDate = new Date(sQuery);
                    if (!isNaN(oDate.getTime())) {
                        aStringFilters.push(new Filter("assigntime", FilterOperator.EQ, oDate));
                    }
                    aFilters.push(new Filter({ filters: aStringFilters, and: false }));
                }
            } else if (sSearchFieldId.includes("SearchField3")) {
                oTable = this.byId("historyTable");
                if (sQuery) {
                    var aStringFilters = [
                        new Filter("vehicalNo", FilterOperator.Contains, sQuery),
                        new Filter("driverName", FilterOperator.Contains, sQuery),
                        new Filter("phone", FilterOperator.Contains, sQuery),
                        new Filter("vehicalType", FilterOperator.Contains, sQuery),
                        new Filter("parkingslots_slotno", FilterOperator.Contains, sQuery)
                    ];
                    aFilters.push(new Filter({ filters: aStringFilters, and: false }));
                }
            }

            if (oTable) {
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.filter(aFilters);
                } else {
                    console.error("Binding not found for the table with ID: " + sSearchFieldId);
                }
            }
        },

        onSelectAssign: async function () {
            var sVehicleNo = this.byId("_IDGenInput1").getValue();
            var sDriverName = this.byId("_IDGenInput2").getValue();
            var sPhoneNo = this.byId("_IDGenInput3").getValue();
            var sTruckType = this.byId("_IDGenInput4").getSelectedKey();
            var sParkinglotNo = this.byId("parkingLotSelect").getSelectedKey();
        
            // Check if any of the required fields are empty
            if (!sVehicleNo || !sDriverName || !sPhoneNo || !sTruckType || !sParkinglotNo) {
                sap.m.MessageBox.error("Please fill all fields.");
                return;
            }
            
            // Validate vehicle number format
            var vehicleRegex = /^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/; // Regex for two letters, two digits, two letters, and four digits
            if (!vehicleRegex.test(sVehicleNo)) {
                sap.m.MessageBox.error("Vehicle number must be in format XXNNXXNNNN where X are letters and N are numbers. Example: AB01CD1234");
                return;
            }
        
            // Validate phone number format
            var phoneRegex = /^[96]\d{9}$/; // Regex for number starting with 9 or 6 and total length of 10
            if (!phoneRegex.test(sPhoneNo)) {
                sap.m.MessageBox.error("Phone number must start with 9 or 6 and be 10 digits long.");
                return;
            }
        
            // Check if the slot is already assigned
            var oModel = this.getView().getModel("ModelV2");
            var bSlotAlreadyAssigned = await this.isSlotAssigned(oModel, sParkinglotNo);
        
            if (bSlotAlreadyAssigned) {
                sap.m.MessageBox.error("This slot is already assigned. Please choose another slot.");
                return;
            }
        
            // Check if the vehicle number is already assigned
            var bVehicleAlreadyAssigned = await this.isVehicleAssigned(oModel, sVehicleNo);
        
            if (bVehicleAlreadyAssigned) {
                sap.m.MessageBox.error("This vehicle is already assigned to another slot.");
                return;
            }
        
            // Continue with assignment
            var oParkingModel = new sap.ui.model.json.JSONModel({
                vehicleNo: sVehicleNo,
                driverName: sDriverName,
                phoneNo: sPhoneNo,
                truckType: sTruckType,
                assigntime: new Date(),
                parkingslot: {
                    slotno: sParkinglotNo
                }
            });
        
            this.getView().setModel(oParkingModel, "parkingModel");
        
            var oPayload = oParkingModel.getProperty("/");
        
            try {
                await this.createData(oModel, oPayload, "/Parkinglotassigndetails");
                await this.updateSlotStatus(oModel, sParkinglotNo, true); // Update slot status to occupied
                this.refreshSlotDetails(sParkinglotNo); // Refresh slot details on Page3
                this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
                this.updateAllSlotsTable(); // Update allSlotsTable to reflect updated status
                this.updateParkingLotSelect(); // Refresh the parkingLotSelect dropdown
                sap.m.MessageBox.success("ParkingLot Assigned Successfully");
                this.byId("_IDGenInput1").setValue();
                this.byId("_IDGenInput2").setValue();
                this.byId("_IDGenInput3").setValue();
                this.byId("_IDGenInput4").setValue();
                this.byId("parkingLotSelect").setValue();
            } catch (error) {
                sap.m.MessageBox.error("Failed to assign parking lot: " + error.message);
            }
        },
        
        isVehicleAssigned: async function (oModel, sVehicleNo) {
            return new Promise((resolve, reject) => {
                oModel.read("/Parkinglotassigndetails", {
                    filters: [new sap.ui.model.Filter("vehicleNo", sap.ui.model.FilterOperator.EQ, sVehicleNo)],
                    success: function (oData, oResponse) {
                        resolve(oData.results.length > 0);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        
        updateSlotStatus: async function (oModel, sSlotNo, bAssigned) {
            return new Promise((resolve, reject) => {
                oModel.read("/Parkingslots('" + sSlotNo + "')", {
                    success: function (oData) {
                        oData.Available = !bAssigned; // Update availability status
                        oModel.update("/Parkingslots('" + sSlotNo + "')", oData, {
                            success: function () {
                                resolve();
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        
        refreshSlotDetails: function (sSlotNo) {
            var oPage3Model = this.getView().getModel("ModelV2");
            var oSlotDetailModel = this.getView().getModel("ModelV2"); 
        
            // Update or refresh slot details based on sSlotNo
            oPage3Model.read("/Parkingslots('" + sSlotNo + "')", {
                success: function (oData) {
                    oSlotDetailModel.setProperty("/", oData); // Update SlotDetailModel with new data
                },
                error: function (oError) {
                    sap.m.MessageBox.error("Failed to refresh slot details.");
                }
            });
        },
        
        updateAllSlotsTable: function () {
            var oTable = this.getView().byId("allSlotsTable");
            if (oTable) {
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            }
        },
        
        updateParkingLotSelect: function () {
            var oSelect = this.getView().byId("parkingLotSelect");
            if (oSelect) {
                var oBinding = oSelect.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            }
        },
        
        createData: async function (oModel, oPayload, sPath) {
            return new Promise((resolve, reject) => {
                oModel.create(sPath, oPayload, {
                    refreshAfterChange: true,
                    success: function (oSuccessData) {
                        resolve(oSuccessData);
                    },
                    error: function (oErrorData) {
                        reject(oErrorData);
                    }
                });
            });
        },
        
        isSlotAssigned: async function (oModel, sParkinglotNo) {
            return new Promise((resolve, reject) => {
                oModel.read("/Parkinglotassigndetails", {
                    filters: [new sap.ui.model.Filter("parkingslot_slotno", sap.ui.model.FilterOperator.EQ, sParkinglotNo)],
                    success: function (oData, oResponse) {
                        resolve(oData.results.length > 0);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                });
            });
        },
        
        
        
        createColumnConfig: function() {
            return [
                { label: 'Vehicle NO', property: 'vehicalNo', type: EdmType.String },
                { label: 'Driver name', property: 'driverName', type: EdmType.String },
                { label: 'Phone no', property: 'phoneNo', type: EdmType.Number, scale: 0 },
                { label: 'Type (Inward / Outward)', property: 'truckType', type: EdmType.String },
                { label: 'Assign Time', property: 'assigntime', type: EdmType.String },
                { label: 'Slot no', property: 'parkingslot_slotno', type: EdmType.Number, scale: 0 }
            ];
        },
        onExport: function() {
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
                .then(function() {
                    MessageToast.show('Spreadsheet export has finished');
                })
                .finally(function() {
                    oSheet.destroy();
                });
        },
        
        createColumnConfig: function() {
            return [
                { label: 'Slot no ', property: 'parkingslots_slotno', type: EdmType.String },
                { label: 'Type (Inward / Outward)', property: 'vehicalType', type: EdmType.String },
                { label: 'Vehicle NO ', property: 'vehicalNo', type: EdmType.String, scale: 0 },
                { label: 'Driver name', property: 'driverName', type: EdmType.String },
                { label: 'Phone no', property: 'phone', type: EdmType.String },
                { label: 'Assign Date & Time', property: 'assignedDate', type: EdmType.Date, scale: 0 },
                { label: 'UnAssign Date & Time', property: 'unassignedDate', type: EdmType.Date, scale: 0 }
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
                fileName: 'Slots History.xlsx'
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
   
        
        onUnAssign: async function () {
            debugger;
            const oView = this.getView();
            var oSelected = this.byId("assignedSlotsTable").getSelectedItem();
            if (!oSelected) {
                sap.m.MessageToast.show("Please select a vehicle to unassign");
                return;
            }
        
            var temp = this.byId("assignedSlotsTable").getSelectedItem().getBindingContext().getObject();
            temp.Available = true;
            var currentDate = new Date();
        
            if (oSelected) {
                // Create a record in history
                const oNewHistory = new sap.ui.model.json.JSONModel({
                    vehicalNo: temp.vehicleNo,
                    driverName: temp.driverName,
                    phone: temp.phoneNo,
                    vehicalType: temp.truckType,
                    assignedDate: temp.assigntime,
                    parkingslots_slotno: temp.parkingslot_slotno,
                    unassignedDate: currentDate
                });
                oView.setModel(oNewHistory, "oNewHistory");
        
                var oParkingslot = new sap.ui.model.json.JSONModel({
                    slotno: temp.parkingslot_slotno,
                    Available: temp.Available
                });
                oView.setModel(oParkingslot, "oParkingslot");
        
                try {
                    const oPayload = this.getView().getModel("oNewHistory").getProperty("/");
                    const oModel = this.getView().getModel("ModelV2");
        
                    // Create history record
                    await this.createData(oModel, oPayload, "/ParkingHistory");
        
                    // Delete the assigned slot
                    await oSelected.getBindingContext().delete("$auto");
        
                    // Update parking slot availability
                    const updatedParkingLot = {
                        Available: temp.Available // Assuming true represents empty parking
                    };
                    await oModel.update("/Parkingslots('" + temp.parkingslot_slotno + "')", updatedParkingLot);
        
                    // Refresh the assigned slots table
                    this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
        
                    // Refresh the all slots table
                    this.updateAllSlotsTable();
        
                    // Refresh the parking lot select dropdown
                    this.updateParkingLotSelect();
        
                    // Refresh the history table toolbar
                    this.getView().byId("historyTable").getBinding("items").refresh();
        
                    sap.m.MessageToast.show("Unassigned successfully");
                } catch (error) {
                    console.error("Error:", error);
                    sap.m.MessageToast.show("Failed to unassign vehicle: " + error.message);
                }
            }
        },
        
        updateAllSlotsTable: function () {
            var oTable = this.getView().byId("allSlotsTable");
            if (oTable) {
                var oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            }
        },
        
        updateParkingLotSelect: function () {
            var oSelect = this.getView().byId("parkingLotSelect");
            if (oSelect) {
                var oBinding = oSelect.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            }
        },
        
        createData: async function (oModel, oPayload, sPath) {
            return new Promise((resolve, reject) => {
                oModel.create(sPath, oPayload, {
                    refreshAfterChange: true,
                    success: function (oSuccessData) {
                        resolve(oSuccessData);
                    },
                    error: function (oErrorData) {
                        reject(oErrorData);
                    }
                });
            });
        },
        
        onEdit: function() {
            debugger
            var oTable = this.byId("assignedSlotsTable");
            var aSelectedItems = oTable.getSelectedItems();
            var oEditButton = this.byId("_IDGenButton3");

            if (aSelectedItems.length === 0) {
                MessageToast.show("Please select at least one row to edit.");
                return;
            }

            if (aSelectedItems.length > 1) {
                MessageToast.show("Please select only One record to Edit.");
                return;
            }

            // Check the button text and perform actions accordingly
            if (oEditButton.data("mode") === "edit") {
                // Cancel the edit operation
                this.onCancelEdit();
            } else {
                // Change Edit button to Cancel
                oEditButton.setText("Cancel");
                oEditButton.setType("Reject");
                oEditButton.data("mode", "edit");

                aSelectedItems.forEach(function(oItem) {
                    var aCells = oItem.getCells();
                    // Toggle visibility of Text and Input controls
                    aCells.forEach(function(oCell) {
                        var aVBoxItems = oCell.getItems();
                        aVBoxItems.forEach(function(oVBoxItem) {
                            if (oVBoxItem.isA("sap.m.Text")) {
                                oVBoxItem.setVisible(false);
                            } else if (oVBoxItem.isA("sap.m.Input") || oVBoxItem.isA("sap.m.Select")) {
                                oVBoxItem.setVisible(true);
                            }
                        });
                    });

                    // Show Save button
                    var oSaveButton = aCells[aCells.length - 1].getItems()[0];
                    oSaveButton.setVisible(true);
                });

                // Make the Actions column visible
                var oColumn = this.byId("assignedSlotscolumn7");
                oColumn.setVisible(true);
            }
        },

        onCancelEdit: function() {
            var oTable = this.byId("assignedSlotsTable");
            var aSelectedItems = oTable.getSelectedItems();
            var oEditButton = this.byId("_IDGenButton3");

            // Change Cancel button back to Edit
            oEditButton.setText("Edit");
            oEditButton.setType("Emphasized");
            oEditButton.data("mode", "view");

            aSelectedItems.forEach(function(oItem) {
                var aCells = oItem.getCells();
                // Toggle visibility back to Text fields
                aCells.forEach(function(oCell) {
                    var aVBoxItems = oCell.getItems();
                    aVBoxItems.forEach(function(oVBoxItem) {
                        if (oVBoxItem.isA("sap.m.Text")) {
                            oVBoxItem.setVisible(true);
                        } else if (oVBoxItem.isA("sap.m.Input") || oVBoxItem.isA("sap.m.Select")) {
                            oVBoxItem.setVisible(false);
                        }
                    });
                });

                // Hide Save button
                var oSaveButton = aCells[aCells.length - 1].getItems()[0];
                oSaveButton.setVisible(false);
            });

            // Optionally hide the Actions column if no rows are in edit mode
            var bShowActions = aSelectedItems.some(function(oItem) {
                return oItem.getCells()[6].getItems()[0].getVisible();
            });
            if (!bShowActions) {
                var oColumn = this.byId("assignedSlotscolumn7");
                oColumn.setVisible(false);
            }

            MessageToast.show("Edit operation cancelled.");
        },
        onSaveEdit:function () {
            const oTable = this.byId("assignedSlotsTable");
            const aSelectedItems = oTable.getSelectedItems();
       
              if (aSelectedItems.length === 1) { // Assuming you are editing only one item at a time
                const oSelectedItem = aSelectedItems[0];
                const oBindingContext = oSelectedItem.getBindingContext();
                const oEditedData = oBindingContext.getObject();
        
                // Example: Accessing selected slot number from the Select control
                const oSelect = oSelectedItem.getCells()[5].getItems()[0]; // Assuming the Select is the first item in the sixth cell (index 5)
                const sSelectedSlotNumber = oSelect.getSelectedKey();
        
                // Example: Accessing other edited fields
                const sEditedVehicleNo = oEditedData.vehicleNo;
                const sEditedDriverName = oEditedData.driverName;
                const sEditedPhoneNo = oEditedData.phoneNo;
                const sEditedTruckType = oEditedData.truckType;
                const sEditedAssignTime = oEditedData.assigntime;
        
                // Example: Log or use the selected slot number
                console.log("Selected Slot Number:", sSelectedSlotNumber);
       

              const oNewUpdate = new sap.ui.model.json.JSONModel({
                driverName: sDriverName,
                phoneNo: sDriverMobile,
                vehicleNo: sVehicle,
                truckType: sTypeofDelivery,
                assigntime: new Date(),
                // ID: dID,
                parkingslot: {
                    slotno: sSlotNumber
                }
              })
              this.getView().setModel(oNewUpdate, "oNewUpdate");
       
              var oPayload = this.getView().getModel("oNewUpdate").getData();
              var oDataModel = this.getOwnerComponent().getModel("ModelV2");// Assuming this is your OData V2 model
       
              try {
                // Assuming your update method is provided by your OData V2 model
                oDataModel.update("/Parkinglotassigndetails(" + oPayload.sVehicle + ")", oPayload, {
                  success: function () {
                    this.getView().byId("idSlotsTable").getBinding("items").refresh();
                    sap.m.MessageBox.success("Slot updated successfully");
                  }.bind(this),
                  error: function (oError) {
                    sap.m.MessageBox.error("Failed to update slot: " + oError.message);
                  }.bind(this)
                });
              } catch (error) {
                sap.m.MessageBox.error("Some technical Issue");
              }
            }
            const updatedParkingLot = {
              status: "Occupied" // Assuming false represents empty parking
              // Add other properties if needed
            };
            oDataModel.update("/Parkingslots('" + sSlotNumber + "')", updatedParkingLot, {
              success: function () {
              }.bind(this),
              error: function (oError) {
                sap.m.MessageBox.error("Failed to update: " + oError.message);
              }.bind(this)
            });
            const updatedParkingLotNumber = {
              status: "Available" // Assuming false represents empty parking
              // Add other properties if needed
            };
            oDataModel.update("/Parkingslots('" + sOldSlotNumber + "')", updatedParkingLotNumber, {
              success: function () {
              }.bind(this),
              error: function (oError) {
                sap.m.MessageBox.error("Failed to update: " + oError.message);
              }.bind(this)
            });
       
            aSelectedItems.forEach(function (oItem) {
              var aCells = oItem.getCells();
              aCells.forEach(function (oCell) {
                var aVBoxItems = oCell.getItems();
                aVBoxItems[0].setVisible(true); // Hide Text
                aVBoxItems[1].setVisible(false); // Show Input
              });
            });
            this.byId("editButton").setVisible(true);
            this.byId("saveButton").setVisible(false);
            this.byId("cancelButton").setVisible(false);
          },
        onPrint: function () {
            debugger;
            
            // Ensure jsPDF is available
            if (!window.jspdf || !window.jspdf.jsPDF) {
                MessageBox.error("jsPDF library is not loaded.");
                return;
            }
        
            // Access the jsPDF library
            const { jsPDF } = window.jspdf;
        
            // Ensure autoTable plugin is available
            if (!jsPDF.API.autoTable) {
                MessageBox.error("autoTable plugin is not loaded.");
                return;
            }
            // Get the reference to the assigned slots table by it's id
            var oTable = this.byId("assignedSlotsTable");
            var aItems = oTable.getItems();
            var doc = new jsPDF();
        
            // Table headers
            var headers = [["Vehicle No", "Driver Name", "Phone No", "Type", "Assign Time", "Slot No"]];
            var data = [];
        
            aItems.forEach(function (oItem) {
                var aCells = oItem.getCells();
                var aRowData = aCells.map(function (oCell) {
                    var aVBoxItems = oCell.getItems();
                    return aVBoxItems[0].getText();
                });
                data.push(aRowData);
            });
        
            doc.autoTable({
                head: headers,
                body: data
            });
        
            doc.save("AssignedSlots.pdf");
        },
        
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
 
        onAddButton: function(){
            if (!this.byId("AddDialog")) {
                this.loadFragment({
                    name: "com.app.yardmanagement.view.AddDialog"
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    oDialog.open();
                }.bind(this));
            } else {
                this.byId("AddDialog").open();
            }
        },  
        onSaveAdd: function () {
            // Get input values
            var sSlotNo = this.byId("inputAddSlotno").getValue();
            var sVehicleType = this.byId("_IDAddInput").getSelectedKey(); // Assuming key is "Inward" or "Outward"
        
            // Validate input
            if (!sSlotNo || !sVehicleType) {
                MessageToast.show("Please fill all mandatory fields.");
                return;
            }
        
            var slotNoRegex = /^PS\d{3}$/;
            if (!slotNoRegex.test(sSlotNo)) {
                sap.m.MessageToast.show("Slot number must start with 'PS' followed by three digits (e.g., PS123).");
                return;
            }
            
            var oModelV2 = this.getView().getModel("ModelV2");
            var sPath = "/Parkingslots";
            var bSlotExists = false;
        
            // Check if the slot number already exists
            oModelV2.read(sPath, {
                success: function (oData) {
                    oData.results.forEach(function (oEntry) {
                        if (oEntry.slotno === sSlotNo) {
                            bSlotExists = true;
                        }
                    });
        
                    if (bSlotExists) {
                        MessageToast.show("Slot number already exists.");
                    } else {
                        // Prepare the new entry data
                        var oNewEntry = {
                            slotno: sSlotNo,
                            type: sVehicleType,
                            Available: true // Example: Assuming all new entries are available initially
                        };
        
                        // Create the new entry in the OData model
                        oModelV2.create(sPath, oNewEntry, {
                            success: function () {
                                MessageToast.show("New entry added successfully.");
        
                                // Refresh the table
                                this.getView().byId("allSlotsTable").getBinding("items").refresh();
                                this.getView().byId("parkingLotSelect").getBinding("items").refresh();
                            }.bind(this),
                            error: function (oError) {
                                MessageBox.error("Error adding new entry: " + oError.message);
                            }
                        });
        
                        // Close the dialog
                        this.byId("AddDialog").close();
        
                        // Optionally, clear input fields
                        this.byId("inputAddSlotno").setValue("");
                        this.byId("_IDAddInput").setSelectedKey("");
                    }
                }.bind(this),
                error: function (oError) {
                    MessageBox.error("Error reading existing slots: " + oError.message);
                }
            });
        },
        
        onCancelAdd: function () {
            this.byId("AddDialog").close();
            this.byId("inputAddSlotno").setValue("");
            this.byId("_IDAddInput").setSelectedKey("");
        }
        
    });
});
