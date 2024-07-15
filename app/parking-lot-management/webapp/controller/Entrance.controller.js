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
],
function (Device, Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, exportLibrary, Spreadsheet, Fragment, ODataMode) {
    "use strict";

    return Controller.extend("com.app.parkinglotmanagement.controller.Entrance", {
        onInit: function () {
            var oModelV2 = new sap.ui.model.odata.v2.ODataModel("/v2/odata/v4/parking-lot/");
            this.getView().setModel(oModelV2, "ModelV2");
            this._setParkingLotModel();

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
                    this._refreshPage5();
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
            oToolPage.setSideExpanded(!bSideExpanded);

     
        },

        _setToggleButtonTooltip: function (bLarge) {
            var oToggleButton = this.byId('sideNavigationToggleButton');
            oToggleButton.setTooltip(bLarge ? 'Large Size Navigation' : 'Small Size Navigation');
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
                } catch (error) {
                    sap.m.MessageBox.error("Failed to assign parking lot: " + error.message);
                }
            },
            
            onUnAssign: async function () {
                const oView = this.getView();
                const oSelected = this.byId("assignedSlotsTable").getSelectedItem();
                
                if (!oSelected) {
                    sap.m.MessageToast.show("Please select a vehicle to unassign");
                    return;
                }
                
                const temp = oSelected.getBindingContext().getObject();
                
                temp.Available = true;
                const currentDate = new Date();
                
                if (oSelected) {
                    try {
                        // Create a record in history
                        const oNewHistory = {
                            vehicalNo: temp.vehicleNo,
                            driverName: temp.driverName,
                            phone: temp.phoneNo,
                            vehicalType: temp.truckType,
                            assignedDate: temp.assigntime,
                            unassignedDate: currentDate,
                            parkingslots: {
                                slotno: temp.parkingslot.slotno // Accessing slotno through association
                            }
                        };
                        
                        // Create history record
                        await this.createData(this.getView().getModel("ModelV2"), oNewHistory, "/ParkingHistory");

            
                        // Delete the assigned slot
                        await oSelected.getBindingContext().delete("$auto");
            
                        // Update parking slot availability
                        const updatedParkingLot = {
                            Available: temp.Available // Assuming true represents empty parking
                        };
                        await this.getView().getModel("ModelV2").update("/Parkingslots('" + temp.parkingslot.slotno + "')", updatedParkingLot);
            
                        // Refresh the assigned slots table
                        this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
                        
                        // Refresh the all slots table
                        this.updateAllSlotsTable();
            
                        // Refresh the parking lot select dropdown
                        this.updateParkingLotSelect();
            
                        // Refresh the history table toolbar
                        this.getView().byId("historyTable").getBinding("items").refresh();
                        sap.m.MessageToast.show("Unassigned successfully");

                        this.getView().byId("allSlotsTable").getBinding("items").refresh();
                    } catch (error) {
                        console.error("Error:", error);
                        sap.m.MessageToast.show("Failed to unassign vehicle: " + error.message);
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
            refreshSlotDetails: function(sParkinglotNo) {
                var oModel = this.getView().getModel("ModelV2");
                oModel.refresh(true); // Ensure model is refreshed
            
                // Check if the slot details are updated
                console.log("Refreshing slot details for: ", sParkinglotNo);
                // Add any additional logic if necessary
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
            
                // Validate input
                if (!sSlotNo) {
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
            },

            onEdit: function() {
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

            },
            
            onSearch: function (oEvent) {
                                var sQuery = oEvent.getParameter("query");
                                var sSearchFieldId = oEvent.getSource().getId();
                                var oTable, aFilters = [];
                    
                                if (sSearchFieldId.includes("SearchField1")) {
                                    oTable = this.byId("allSlotsTable");
                                    if (sQuery) {
                                        var aStringFilters = [
                                            new Filter("slotno", FilterOperator.Contains, sQuery)
                                        ];
                    
                                        if (sQuery.toLowerCase() === "yes") {
                                            aFilters.push(new Filter("Available", FilterOperator.EQ, true));
                                        } else if (sQuery.toLowerCase() === "no") {
                                            aFilters.push(new Filter("Available", FilterOperator.EQ, false));
                                        }
                                        aFilters.push(new Filter({ filters: aStringFilters, and: false }));
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
                                        aFilters.push(new Filter({ filters: aStringFilters, and: false }));
                                    }
                                } 
                                else if (sSearchFieldId.includes("SearchField3")) {
                                    oTable = this.byId("historyTable");
                                    if (sQuery) {
                                        var aStringFilters = [
                                            new Filter("vehicalNo", FilterOperator.Contains, sQuery),
                                            new Filter("driverName", FilterOperator.Contains, sQuery),
                                            new Filter("phone", FilterOperator.Contains, sQuery),
                                            new Filter("vehicalType", FilterOperator.Contains, sQuery),
                                            new Filter("parkingslots/slotno", FilterOperator.Contains, sQuery)
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
                            _setParkingLotModel: function () {
                                var oModel = this.getOwnerComponent().getModel("ModelV2");
                                if (!oModel) {
                                    console.error("Model 'ModelV2' not found.");
                                    return;
                                }
                            
                                var that = this;
                                oModel.read("/Parkingslots", {
                                    success: function (oData) {
                                        var aItems = oData.results;
                                        var availableCount = aItems.filter(item => item.Available === true).length;
                                        var occupiedCount = aItems.filter(item => item.Available === false).length;
                            
                                        var aChartData = {
                                            Items: [
                                                {
                                                    Available: true,
                                                    Count: availableCount,
                                                    Name: "Available"
                                                },
                                                {
                                                    Available: false,
                                                    Count: occupiedCount,
                                                    Name: "Occupied"
                                                }
                                            ]
                                        };
                            
                                        var oParkingLotModel = new sap.ui.model.json.JSONModel();
                                        oParkingLotModel.setData(aChartData);
                                        that.getView().setModel(oParkingLotModel, "ParkingLotModel");
                                    },
                                    error: function (oError) {
                                        console.error("Error fetching data:", oError);
                                        // Handle error
                                    }
                                });
                            },
                            
        _refreshPage5: function () {
            this._setParkingLotModel(); // Refresh data visualization related models or data
        },
    });
});
