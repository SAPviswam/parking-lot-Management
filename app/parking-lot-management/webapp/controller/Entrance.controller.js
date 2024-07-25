sap.ui.define([
    "sap/ui/Device",
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/ui/core/Fragment",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/Popover"
],
    function (Device, Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, exportLibrary, Spreadsheet, Fragment, ODataMode, Popover) {
        "use strict";
        var EdmType = exportLibrary.EdmType;
        return Controller.extend("com.app.parkinglotmanagement.controller.Entrance", {

            onInit: function () {
                var oModelV2 = new sap.ui.model.odata.v2.ODataModel("/v2/odata/v4/parking-lot/");
                this.getView().setModel(oModelV2, "ModelV2");
                this._setParkingLotModel();
                //  // Bind ComboBox items
                //  this._bindComboBoxItems();

                var oPopover = this.byId("notifications");
                if (oPopover) {
                    oPopover.close(); // This hides the Popover
                }
                
                // Ensure the editing state is clear on initialization
                this._sEditingRecordID = null;
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
                    case "ReservationsRequest":
                        navContainer.to(this.getView().createId("Page6"));
                        this.onBeforeShowPage6();
                        break;
                    case "Reserved":
                        navContainer.to(this.getView().createId("Page7"));
                        this.onBeforeShowPage7();
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

            onBeforeShowPage6: function () {
                var oTable = this.byId("reservationsTable");
                if (oTable) {
                    var oBinding = oTable.getBinding("items");
                    if (oBinding) {
                        oBinding.refresh(); // Refresh the binding to reload data
                    }
                }
            },
            onBeforeShowPage7: function () {
                var oTable = this.byId("reservedTable");
                if (oTable) {
                    var oBinding = oTable.getBinding("items");
                    if (oBinding) {
                        oBinding.refresh(); // Refresh the binding to reload data
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
                var vehicleRegex = /^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/; // Regex for vehicle number
                if (!vehicleRegex.test(sVehicleNo)) {
                    sap.m.MessageBox.error("Vehicle number must be in format XXNNXXNNNN where X are letters and N are numbers. Example: AB01CD1234");
                    return;
                }

                // Validate phone number format
                var phoneRegex = /^[96]\d{9}$/; // Regex for phone number
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

                    // Update slot status to occupied
                    await this.updateSlotStatus(oModel, sParkinglotNo, "Occupied");

                    this.refreshSlotDetails(sParkinglotNo); // Refresh slot details on Page3
                    this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
                    this.updateAllSlotsTable(); // Update allSlotsTable to reflect updated status
                    this.updateParkingLotSelect(); // Refresh the parkingLotSelect dropdown
                    sap.m.MessageBox.success("Slot " + sParkinglotNo + " assigned to " + sVehicleNo);

                    // Clear input fields
                    this.byId("_IDGenInput1").setValue("");
                    this.byId("_IDGenInput2").setValue("");
                    this.byId("_IDGenInput3").setValue("");
                } catch (error) {
                    sap.m.MessageBox.error("Failed to assign parking lot: " + error.message);
                }
                // // Send SMS to driver
                // var DriverPhoneno = "+91" + sPhoneNo;
                //     // Replace with your actual Twilio Account SID and Auth Token
                //     const accountSid = 'AC5a7f5b49547b4f26bc2e12ed6ed1c1bb';
                //     const authToken = '8eec232f4c715bf4743c4a16f1532c05';

                // // Function to send SMS using Twili
                //     debugger
                //     const toNumber = DriverPhoneno; // Replace with recipient's phone number
                //     const fromNumber = '+12053796189'; // Replace with your Twilio phone number
                //     const messageBody = 'Hello ' + sDriverName + ', a slot is allocated to your vehicle number.\nVehicle no: ' + sVehicleNo + '\nSlot no: ' + sParkinglotNo + '\nHave a Great Day!!';

                //     // Twilio API endpoint for sending messages
                //     const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

                //     // Payload for the POST request
                //     const payload = {
                //         To: toNumber,
                //         From: fromNumber,
                //         Body: messageBody
                //     };

                //     // Send POST request to Twilio API using jQuery.ajax
                // $.ajax({
                //     url: url,
                //     type: 'POST',
                //     headers: {
                //         'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
                //     },
                //     data: payload,
                //     success: function (data) {
                //         console.log('SMS sent successfully:', data);
                //         // Handle success, e.g., show a success message
                //         // sap.m.MessageToast.show('SMS sent successfully!');
                //         sap.m.MessageBox.success("Slot " + sParkinglotNo + " assigned to " + sVehicleNo + '\nSMS sent successfully!');
                //     },
                //     error: function (xhr, status, error) {
                //         console.error('Error sending SMS:', error);
                //         // Handle error, e.g., show an error message
                //         sap.m.MessageToast.show('Failed to send SMS: ' + error);
                //     }
                // });
            },



            onUnAssign: async function () {
                const oView = this.getView();
                const oSelected = this.byId("assignedSlotsTable").getSelectedItem();

                if (!oSelected) {
                    sap.m.MessageToast.show("Please select a vehicle to unassign");
                    return;
                }

                const temp = oSelected.getBindingContext().getObject();

                temp.Available = "Available";
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
                        refreshAfterChange: "Available",
                        success: function (oSuccessData) {
                            resolve(oSuccessData);
                        },
                        error: function (oErrorData) {
                            reject(oErrorData);
                        }
                    });
                });
            },
            updateSlotStatus: function (oModel, sSlotNo, sStatus) {
                return new Promise((resolve, reject) => {
                    var oPayload = {
                        Available: sStatus // Set the status to the string value "Occupied"
                    };
                    oModel.update(`/Parkingslots('${sSlotNo}')`, oPayload, {
                        method: "MERGE",
                        success: function () {
                            resolve();
                        },
                        error: function (oError) {
                            reject(oError);
                        }
                    });
                });
            },

            refreshSlotDetails: function (sParkinglotNo) {
                var oModel = this.getView().getModel("ModelV2");
                oModel.refresh(true); // Ensure model is refreshed

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
            refreshComboBox: function () {
                var oTable = this.byId("assignedSlotsTable");
                var aItems = oTable.getItems();
            
                aItems.forEach(function (oItem) {
                    var oComboBox = oItem.getCells()[5].getItems()[1]; // Assuming the ComboBox is the second item in the first cell
                    if (oComboBox && oComboBox.getBinding("items")) {
                        oComboBox.getBinding("items").refresh(); // Refresh the ComboBox items binding
                    }
                });
            },
            _refreshParkingLotSelect: function () {
                    var oSelect = this.byId("_IDassignedSlotsInputparkingLotSelect");
                    var oModel = this.getOwnerComponent().getModel();
                    oSelect.setModel(oModel);
                    oSelect.bindAggregation("items", {
                        path: "/Parkingslots",
                        template: new sap.ui.core.Item({
                            key: "{slotno}",
                            text: "{slotno}"
                        }),
                        filters: [new sap.ui.model.Filter("Available", sap.ui.model.FilterOperator.EQ, "Available")]
                    });
                },
                       _revertUIChanges: function (oSelected) {
                var oCells = oSelected.getCells();
            
                // Revert visibility of Texts and Inputs
                oCells.forEach(function (oCell) {
                    var aItems = oCell.getItems();
                    aItems[0].setVisible(true); // Text element
                    if (aItems[1]) aItems[1].setVisible(false); // Input/Select element
                });
            
                // Hide Save button and make Edit button visible
                this.byId("assignedSlotscolumn7").setVisible(false);
                var oEditButton = this.byId("_IDGenButton3");
                oEditButton.setVisible(true);
                oEditButton.setText("Edit");
                oEditButton.setType("Emphasized");
                oEditButton.data("mode", "view");
            },
            

            onAddButton: function () {
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
                // Get input value and convert to uppercase
                var sSlotNo = this.byId("inputAddSlotno").getValue().toUpperCase();
            
                // Validate input
                if (!sSlotNo) {
                    MessageToast.show("Please fill all mandatory fields.");
                    return;
                }
            
                var slotNoRegex = /^PS\d{3}$/;
                if (!slotNoRegex.test(sSlotNo)) {
                    MessageToast.show("Slot number must start with 'PS' followed by three digits (e.g., PS123).");
                    return;
                }
            
                var oModelV2 = this.getView().getModel("ModelV2");
                var sPath = "/Parkingslots";
                var bSlotExists = false;
            
                // Check if the slot number already exists
                oModelV2.read(sPath, {
                    success: function (oData) {
                        // Check if slot exists in the response
                        bSlotExists = oData.results.some(function (oEntry) {
                            return oEntry.slotno === sSlotNo;
                        });
            
                        if (bSlotExists) {
                            MessageToast.show("Slot number already exists.");
                            return;
                        }
            
                        // Prepare the new entry data
                        var oNewEntry = {
                            slotno: sSlotNo,
                            Available: "Available" // Set availability field to "Available"
                        };
            
                        // Create the new entry in the OData model
                        oModelV2.create(sPath, oNewEntry, {
                            success: function () {
                                MessageToast.show("New entry added successfully.");
                                // Refresh the table bindings
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
                    }.bind(this),
                    error: function (oError) {
                        MessageBox.error("Error reading existing slots: " + oError.message);
                    }
                });
            },
             
            // onSaveAdd: function () {
            //     // Get input values
            //     var sSlotNo = this.byId("inputAddSlotno").getValue();

            //     // Validate input
            //     if (!sSlotNo) {
            //         MessageToast.show("Please fill all mandatory fields.");
            //         return;
            //     }

            //     var slotNoRegex = /^PS\d{3}$/;
            //     if (!slotNoRegex.test(sSlotNo)) {
            //         sap.m.MessageToast.show("Slot number must start with 'PS' followed by three digits (e.g., PS123).");
            //         return;
            //     }

            //     var oModelV2 = this.getView().getModel("ModelV2");
            //     var sPath = "/Parkingslots";
            //     var bSlotExists = false;

            //     // Check if the slot number already exists
            //     oModelV2.read(sPath, {
            //         success: function (oData) {
            //             // Check if slot exists in the response
            //             bSlotExists = oData.results.some(function (oEntry) {
            //                 return oEntry.slotno === sSlotNo;
            //             });

            //             if (bSlotExists) {
            //                 MessageToast.show("Slot number already exists.");
            //                 return;
            //             }

            //             // Prepare the new entry data
            //             var oNewEntry = {
            //                 slotno: sSlotNo,
            //                 Available: "Available" // Set availability field to "Available"
            //             };

            //             // Create the new entry in the OData model
            //             oModelV2.create(sPath, oNewEntry, {
            //                 success: function () {
            //                     MessageToast.show("New entry added successfully.");
            //                     // Refresh the table bindings
            //                     this.getView().byId("allSlotsTable").getBinding("items").refresh();
            //                     this.getView().byId("parkingLotSelect").getBinding("items").refresh();
            //                 }.bind(this),
            //                 error: function (oError) {
            //                     MessageBox.error("Error adding new entry: " + oError.message);
            //                 }
            //             });

            //             // Close the dialog
            //             this.byId("AddDialog").close();

            //             // Optionally, clear input fields
            //             this.byId("inputAddSlotno").setValue("");
            //         }.bind(this),
            //         error: function (oError) {
            //             MessageBox.error("Error reading existing slots: " + oError.message);
            //         }
            //     });
            // },


            onCancelAdd: function () {
                this.byId("AddDialog").close();
                this.byId("inputAddSlotno").setValue("");
            },


            // onEdit: function () {
            //     var oTable = this.byId("assignedSlotsTable");
            //     var aSelectedItems = oTable.getSelectedItems();
            //     var oEditButton = this.byId("_IDGenButton3");
            
            //     if (aSelectedItems.length === 0) {
            //         MessageToast.show("Please select at least one row to edit.");
            //         return;
            //     }
            
            //     if (aSelectedItems.length > 1) {
            //         MessageToast.show("Please select only one record to edit.");
            //         return;
            //     }
            
            //     if (oEditButton.data("mode") === "edit") {
            //         // Cancel the edit operation
            //         this.onCancelEdit();
            //     } else {
            //         // Change Edit button to Cancel
            //         oEditButton.setText("Cancel");
            //         oEditButton.setType("Reject");
            //         oEditButton.data("mode", "edit");
            
            //         aSelectedItems.forEach(function (oItem) {
            //             var aCells = oItem.getCells();
            
            //             aCells.forEach(function (oCell) {
            //                 var aVBoxItems = oCell.getItems();
            //                 aVBoxItems.forEach(function (oVBoxItem) {
            //                     if (oVBoxItem.isA("sap.m.Text")) {
            //                         oVBoxItem.setVisible(false);
            //                     } else if (oVBoxItem.isA("sap.m.Input") || oVBoxItem.isA("sap.m.Select")) {
            //                         oVBoxItem.setVisible(true);
            //                     }
            //                 });
            //             });
            
            //             // Show Save button
            //             var oSaveButton = aCells[aCells.length - 1].getItems()[0];
            //             oSaveButton.setVisible(true);
            //         });
            
            //         // Make the Actions column visible
            //         var oColumn = this.byId("assignedSlotscolumn7");
            //         oColumn.setVisible(true);
            
            //         // Refresh the parking lot select field with available slots
            //         this._refreshParkingLotSelect(); // Add this line
            //     }
            //     this.refreshComboBox();
            // },
            
            
            // // New function to refresh the parking lot select field
            // 
            
            // onCancelEdit: function () {
            //     var oTable = this.byId("assignedSlotsTable");
            //     var aSelectedItems = oTable.getSelectedItems();
            //     var oEditButton = this.byId("_IDGenButton3");

            //     // Change Cancel button back to Edit
            //     oEditButton.setText("Edit");
            //     oEditButton.setType("Emphasized");
            //     oEditButton.data("mode", "view");

            //     aSelectedItems.forEach(function (oItem) {
            //         var aCells = oItem.getCells();
            //         // Toggle visibility back to Text fields
            //         aCells.forEach(function (oCell) {
            //             var aVBoxItems = oCell.getItems();
            //             aVBoxItems.forEach(function (oVBoxItem) {
            //                 if (oVBoxItem.isA("sap.m.Text")) {
            //                     oVBoxItem.setVisible(true);
            //                 } else if (oVBoxItem.isA("sap.m.Input") || oVBoxItem.isA("sap.m.Select")) {
            //                     oVBoxItem.setVisible(false);
            //                 }
            //             });
            //         });

            //         // Hide Save button
            //         var oSaveButton = aCells[aCells.length - 1].getItems()[0];
            //         oSaveButton.setVisible(false);
            //     });

            //     // Optionally hide the Actions column if no rows are in edit mode
            //     var bShowActions = aSelectedItems.some(function (oItem) {
            //         return oItem.getCells()[6].getItems()[0].getVisible();
            //     });
            //     if (!bShowActions) {
            //         var oColumn = this.byId("assignedSlotscolumn7");
            //         oColumn.setVisible(false);
            //     }

            //     MessageToast.show("Edit operation cancelled.");
            // },
            onEdit: function () {
    var oTable = this.byId("assignedSlotsTable");
    var aSelectedItems = oTable.getSelectedItems();
    var oEditButton = this.byId("_IDGenButton3");

    if (aSelectedItems.length === 0) {
        MessageToast.show("Please select at least one row to edit.");
        return;
    }

    if (aSelectedItems.length > 1) {
        MessageToast.show("Please select only one record to edit.");
        return;
    }

    if (oEditButton.data("mode") === "edit") {
        // Cancel the edit operation
        this.onCancelEdit();
    } else {
        // Change Edit button to Cancel
        oEditButton.setText("Cancel");
        oEditButton.setType("Reject");
        oEditButton.data("mode", "edit");

        aSelectedItems.forEach(function (oItem) {
            var aCells = oItem.getCells();

            // Store original values
            oItem.data("originalValues", aCells.map(function (oCell) {
                return oCell.getItems().map(function (oVBoxItem) {
                    if (oVBoxItem.isA("sap.m.Text")) {
                        return oVBoxItem.getText();
                    }
                    if (oVBoxItem.isA("sap.m.Input")) {
                        return oVBoxItem.getValue();
                    }
                    if (oVBoxItem.isA("sap.m.Select")) {
                        return oVBoxItem.getSelectedKey();
                    }
                    return null;
                });
            }));

            aCells.forEach(function (oCell) {
                var aVBoxItems = oCell.getItems();
                aVBoxItems.forEach(function (oVBoxItem) {
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

        // Refresh the parking lot select field with available slots
        this._refreshParkingLotSelect();
    }
    this.refreshComboBox();
},
onCancelEdit: function () {
    var oTable = this.byId("assignedSlotsTable");
    var aSelectedItems = oTable.getSelectedItems();
    var oEditButton = this.byId("_IDGenButton3");

    // Change Cancel button back to Edit
    oEditButton.setText("Edit");
    oEditButton.setType("Emphasized");
    oEditButton.data("mode", "view");

    aSelectedItems.forEach(function (oItem) {
        var aCells = oItem.getCells();
        var aOriginalValues = oItem.data("originalValues");

        aCells.forEach(function (oCell, iCellIndex) {
            var aVBoxItems = oCell.getItems();
            var aOriginalCellValues = aOriginalValues[iCellIndex];

            aVBoxItems.forEach(function (oVBoxItem, iItemIndex) {
                if (oVBoxItem.isA("sap.m.Text")) {
                    oVBoxItem.setText(aOriginalCellValues[iItemIndex]);
                    oVBoxItem.setVisible(true);
                } else if (oVBoxItem.isA("sap.m.Input") || oVBoxItem.isA("sap.m.Select")) {
                    if (oVBoxItem.isA("sap.m.Input")) {
                        oVBoxItem.setValue(aOriginalCellValues[iItemIndex]);
                    } else if (oVBoxItem.isA("sap.m.Select")) {
                        oVBoxItem.setSelectedKey(aOriginalCellValues[iItemIndex]);
                    }
                    oVBoxItem.setVisible(false);
                }
            });
        });

        // Hide Save button
        var oSaveButton = aCells[aCells.length - 1].getItems()[0];
        oSaveButton.setVisible(false);
    });

    // Optionally hide the Actions column if no rows are in edit mode
    var bShowActions = aSelectedItems.some(function (oItem) {
        return oItem.getCells()[6].getItems()[0].getVisible();
    });
    if (!bShowActions) {
        var oColumn = this.byId("assignedSlotscolumn7");
        oColumn.setVisible(false);
    }

    MessageToast.show("Edit operation cancelled.");
},


  
            // onSaveEdit: function () {
            //     var oView = this.getView();
            //     var oTable = this.byId("assignedSlotsTable");
            //     var aSelectedItems = oTable.getSelectedItems();
            //     var oSelected = this.byId("assignedSlotsTable").getSelectedItem();


            //     if (oSelected.length === 0) {
            //         MessageToast.show("Please select a row to save.");
            //         return;
            //     }



            //     if (oSelected) {
            //         var oContext = oSelected.getBindingContext().getObject();
            //         var sVehicle = oContext.vehicleNo;
            //         var sDriverName = oContext.driverName;
            //         var sTypeofDelivery = oContext.truckType;
            //         var sDriverMobile = oContext.phoneNo;
            //         var sOldSlotNumber = oContext.parkingslot.slotno;
            //         var dID = oContext.ID;

            //         // To get the selected parking lot number from the Select element
            //         var oCells = oSelected.getCells();
            //         var oSelect = oCells[5].getItems()[1]; // Assuming the Select is in the second VBox of the sixth cell
            //         var sSlotNumber = oSelect.getSelectedKey();

            //         // create a record
            //         const oNewUpdate = new sap.ui.model.json.JSONModel({
            //             driverName: sDriverName,
            //             phoneNo: sDriverMobile,
            //             vehicleNo: sVehicle,
            //             truckType: sTypeofDelivery,
            //             assigntime: new Date(),
            //             ID: dID,
            //             parkingslot: {
            //                 slotno: sSlotNumber
            //             }
            //         })
            //         this.getView().setModel(oNewUpdate, "oNewUpdate");

            //         var oPayload = this.getView().getModel("oNewUpdate").getData();
            //         var oDataModel = this.getOwnerComponent().getModel("ModelV2");// Assuming this is your OData V2 model

            //         try {
            //             // Assuming your update method is provided by your OData V2 model
            //             oDataModel.update("/Parkinglotassigndetails(" + oPayload.ID + ")", oPayload, {
            //                 success: function () {
            //                     this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
            //                     this.updateParkingLotSelect(); // Refresh the parkingLotSelect dropdown
            //                     sap.m.MessageBox.success("Slot updated successfully");
            //                     this._revertUIChanges(oSelected);
            //                 }.bind(this),
            //                 error: function (oError) {
            //                     sap.m.MessageBox.error("Failed to update slot: " + oError.message);
            //                 }.bind(this)
            //             });
            //         } catch (error) {
            //             sap.m.MessageBox.error("Some technical Issue");
            //         }
            //     }
            //     const updatedParkingLot = {
            //         Available: "Occupied" // Assuming false represents empty parking
            //         // Add other properties if needed
            //     };
            //     oDataModel.update("/Parkingslots('" + sSlotNumber + "')", updatedParkingLot, {
            //         success: function () {
            //             this.getView().byId("allSlotsTable").getBinding("items").refresh();
            //         }.bind(this),
            //         error: function (oError) {
            //             sap.m.MessageBox.error("Failed to update: " + oError.message);
            //         }.bind(this)
            //     });
            //     const updatedParkingLotNumber = {
            //         Available: "Available" // Assuming false represents empty parking
            //         // Add other properties if needed
            //     };
            //     oDataModel.update("/Parkingslots('" + sOldSlotNumber + "')", updatedParkingLotNumber, {
            //         success: function () {
            //             this.getView().byId("allSlotsTable").getBinding("items").refresh();
            //         }.bind(this),
            //         error: function (oError) {
            //             sap.m.MessageBox.error("Failed to update: " + oError.message);
            //         }.bind(this)
            //     });

            // },

            // _revertUIChanges: function (oSelected) {
            //     var oCells = oSelected.getCells();
            
            //     // Revert visibility of Texts and Inputs
            //     oCells.forEach(function (oCell) {
            //         var aItems = oCell.getItems();
            //         aItems[0].setVisible(true); // Text element
            //         if (aItems[1]) aItems[1].setVisible(false); // Input/Select element
            //     });

            //     // Hide Save button and make Edit button visible
            //     this.byId("assignedSlotscolumn7").setVisible(false);
            //     var oEditButton = this.byId("_IDGenButton3");
            //     oEditButton.setVisible(true);
            //     oEditButton.setText("Edit");
            //     oEditButton.setType("Emphasized");
            //     oEditButton.data("mode", "view");
            // },

            // onSaveEdit: function () {
            //     var oView = this.getView();
            //     var oTable = this.byId("assignedSlotsTable");
            //     var aSelectedItems = oTable.getSelectedItems();
                
            //     // Check if more than one item is selected
            //     if (aSelectedItems.length !== 1) {
            //         MessageToast.show("Please select exactly one row to save.");
            //         return;
            //     }
            
            //     var oSelected = aSelectedItems[0]; // Only one item will be in the array now
            
            //     if (oSelected) {
            //         var oContext = oSelected.getBindingContext().getObject();
            //         var sVehicle = oContext.vehicleNo;
            //         var sDriverName = oContext.driverName;
            //         var sTypeofDelivery = oContext.truckType;
            //         var sDriverMobile = oContext.phoneNo;
            //         var sOldSlotNumber = oContext.parkingslot.slotno;
            //         var dID = oContext.ID;
            
            //         // Regular expression for vehicle number validation
            //         var vehicleNumberPattern = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;
            
            //         // To get the selected parking lot number from the Select element
            //         var oCells = oSelected.getCells();
            //         var oSelect = oCells[5].getItems()[1]; // Assuming the Select is in the second VBox of the sixth cell
            //         var sSlotNumber = oSelect.getSelectedKey();
            
            //         // Validate the vehicle number format
            //         if (!vehicleNumberPattern.test(sVehicle)) {
            //             MessageToast.show("Vehicle number must be in the format XXNNXXNNNN where X are letters and N are numbers. Example: AB01CD1234");
            //             return;
            //         }
            
            //         // Create a record
            //         const oNewUpdate = new sap.ui.model.json.JSONModel({
            //             driverName: sDriverName,
            //             phoneNo: sDriverMobile,
            //             vehicleNo: sVehicle,
            //             truckType: sTypeofDelivery,
            //             assigntime: new Date(),
            //             ID: dID,
            //             parkingslot: {
            //                 slotno: sSlotNumber
            //             }
            //         });
            //         this.getView().setModel(oNewUpdate, "oNewUpdate");
            
            //         var oPayload = this.getView().getModel("oNewUpdate").getData();
            //         var oDataModel = this.getOwnerComponent().getModel("ModelV2"); // Assuming this is your OData V2 model
            
            //         try {
            //             // Update Parkinglotassigndetails
            //             oDataModel.update("/Parkinglotassigndetails(" + oPayload.ID + ")", oPayload, {
            //                 success: function () {
            //                     this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
            //                     this.updateParkingLotSelect(); // Refresh the parkingLotSelect dropdown
            //                     sap.m.MessageBox.success("Slot updated successfully");
            //                     this._revertUIChanges(oSelected);
            //                 }.bind(this),
            //                 error: function (oError) {
            //                     sap.m.MessageBox.error("Failed to update slot: " + oError.message);
            //                 }.bind(this)
            //             });
            //         } catch (error) {
            //             sap.m.MessageBox.error("Some technical Issue");
            //         }
            
            //         // Update the selected parking slot to "Occupied"
            //         const updatedParkingLot = {
            //             Available: "Occupied" // Assuming false represents empty parking
            //             // Add other properties if needed
            //         };
            //         oDataModel.update("/Parkingslots('" + sSlotNumber + "')", updatedParkingLot, {
            //             success: function () {
            //                 this.getView().byId("allSlotsTable").getBinding("items").refresh();
            //             }.bind(this),
            //             error: function (oError) {
            //                 sap.m.MessageBox.error("Failed to update: " + oError.message);
            //             }.bind(this)
            //         });
            
            //         // Update the old parking slot to "Available"
            //         const updatedParkingLotNumber = {
            //             Available: "Available" // Assuming false represents empty parking
            //             // Add other properties if needed
            //         };
            //         oDataModel.update("/Parkingslots('" + sOldSlotNumber + "')", updatedParkingLotNumber, {
            //             success: function () {
            //                 this.getView().byId("allSlotsTable").getBinding("items").refresh();
            //             }.bind(this),
            //             error: function (oError) {
            //                 sap.m.MessageBox.error("Failed to update: " + oError.message);
            //             }.bind(this)
            //         });
            //     }
            // },
          onSaveEdit: function () {
    var oView = this.getView();
    var oTable = this.byId("assignedSlotsTable");
    var aSelectedItems = oTable.getSelectedItems();
    
    // Check if more than one item is selected
    if (aSelectedItems.length !== 1) {
        MessageToast.show("Please select exactly one row to save.");
        return;
    }

    var oSelected = aSelectedItems[0]; // Only one item will be in the array now

    if (oSelected) {
        var oContext = oSelected.getBindingContext().getObject();
        var sVehicle = oContext.vehicleNo;
        var sDriverName = oContext.driverName;
        var sTypeofDelivery = oContext.truckType;
        var sDriverMobile = oContext.phoneNo;
        var sOldSlotNumber = oContext.parkingslot.slotno;
        var dID = oContext.ID;

        // Regular expressions for validation
        var vehicleNumberPattern = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;
        var phoneNumberPattern = /^\d{10}$/;

        // To get the selected parking lot number from the Select element
        var oCells = oSelected.getCells();
        var oSelect = oCells[5].getItems()[1]; // Assuming the Select is in the second VBox of the sixth cell
        var sSlotNumber = oSelect.getSelectedKey();

        // Validate if any field is empty
        if (!sVehicle || !sDriverName || !sDriverMobile || !sSlotNumber) {
            MessageToast.show("Please fill all mandatory fields.");
            return;
        }

        // Validate the vehicle number format
        if (!vehicleNumberPattern.test(sVehicle)) {
            MessageToast.show("Vehicle number must be in the format XXNNXXNNNN where X are letters and N are numbers. Example: AB01CD1234");
            return;
        }

        // Validate the phone number
        if (!phoneNumberPattern.test(sDriverMobile)) {
            MessageToast.show("Phone number must be exactly 10 digits.");
            return;
        }

        // Validate the driver name (assuming it must be at least 2 characters long)
        if (sDriverName.length < 2) {
            MessageToast.show("Driver name must be at least 2 characters long.");
            return;
        }

        // Create a record
        const oNewUpdate = new sap.ui.model.json.JSONModel({
            driverName: sDriverName,
            phoneNo: sDriverMobile,
            vehicleNo: sVehicle,
            truckType: sTypeofDelivery,
            assigntime: new Date(),
            ID: dID,
            parkingslot: {
                slotno: sSlotNumber
            }
        });
        this.getView().setModel(oNewUpdate, "oNewUpdate");

        var oPayload = this.getView().getModel("oNewUpdate").getData();
        var oDataModel = this.getOwnerComponent().getModel("ModelV2"); // Assuming this is your OData V2 model

        try {
            // Update Parkinglotassigndetails
            oDataModel.update("/Parkinglotassigndetails(" + oPayload.ID + ")", oPayload, {
                success: function () {
                    this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
                    this.updateParkingLotSelect(); // Refresh the parkingLotSelect dropdown
                    sap.m.MessageBox.success("Slot updated successfully");
                    this._revertUIChanges(oSelected);
                }.bind(this),
                error: function (oError) {
                    sap.m.MessageBox.error("Failed to update slot: " + oError.message);
                }.bind(this)
            });
        } catch (error) {
            sap.m.MessageBox.error("Some technical Issue");
        }

        // Update the selected parking slot to "Occupied"
        const updatedParkingLot = {
            Available: "Occupied" // Assuming false represents empty parking
            // Add other properties if needed
        };
        oDataModel.update("/Parkingslots('" + sSlotNumber + "')", updatedParkingLot, {
            success: function () {
                this.getView().byId("allSlotsTable").getBinding("items").refresh();
            }.bind(this),
            error: function (oError) {
                sap.m.MessageBox.error("Failed to update: " + oError.message);
            }.bind(this)
        });

        // Update the old parking slot to "Available"
        const updatedParkingLotNumber = {
            Available: "Available" // Assuming false represents empty parking
            // Add other properties if needed
        };
        oDataModel.update("/Parkingslots('" + sOldSlotNumber + "')", updatedParkingLotNumber, {
            success: function () {
                this.getView().byId("allSlotsTable").getBinding("items").refresh();
            }.bind(this),
            error: function (oError) {
                sap.m.MessageBox.error("Failed to update: " + oError.message);
            }.bind(this)
        });
    }
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
                            new Filter("Available", FilterOperator.Contains, sQuery)
                        ];
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
                } else if (sSearchFieldId.includes("SearchField4")) {
                    oTable = this.byId("reservationsTable");
                    if (sQuery) {
                        var aStringFilters = [
                            new Filter("RVehicleno", FilterOperator.Contains, sQuery),
                            new Filter("RVenderName", FilterOperator.Contains, sQuery),
                            new Filter("RVenderMobileNo", FilterOperator.Contains, sQuery),
                            new Filter("RDriverName", FilterOperator.Contains, sQuery),
                            new Filter("RDriverMobileNo", FilterOperator.Contains, sQuery),
                            new Filter("RVehicleType", FilterOperator.Contains, sQuery),
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
                // Fetch data from OData service
                var oModel = this.getOwnerComponent().getModel("ModelV2");
                var that = this;

                oModel.read("/Parkingslots", {
                    success: function (oData) {
                        var aItems = oData.results;
                        var availableCount = aItems.filter(item => item.Available === "Available").length;
                        var occupiedCount = aItems.filter(item => item.Available === "Occupied").length;
                        var reservedCount = aItems.filter(item => item.Available === "Reserved").length;

                        var aChartData = {
                            Items: [
                                {
                                    Available: "Available",
                                    Count: availableCount,
                                    Name: "Available"
                                },
                                {
                                    Available: "Occupied",
                                    Count: occupiedCount,
                                    Name: "Occupied"
                                },
                                {
                                    Available: "Reserved",
                                    Count: reservedCount,
                                    Name: "Reserved"
                                }
                            ]
                        };
                        var oParkingLotModel = new JSONModel();
                        oParkingLotModel.setData(aChartData);
                        that.getView().setModel(oParkingLotModel, "ParkingLotModel");
                    },
                    error: function (oError) {
                        // Handle error
                        console.error(oError);
                    }
                });
            },
            _refreshPage5: function () {
                this._setParkingLotModel(); // Refresh data visualization related models or data
            },
            //  //  Parkinglot allocation slot dropdown logic
            // _bindComboBoxItems: function () {
            //     var oComboBox = this.byId("parkingLotSelect");
            //     oComboBox.bindItems({
            //         path: "/Parkingslots",
            //         filters: [new sap.ui.model.Filter("Available", sap.ui.model.FilterOperator.EQ, true)],
            //         template: new sap.ui.core.Item({
            //             key: "{slotno}",
            //             text: "{slotno}"
            //         })
            //     });
            // },
            onReserve: function () {
                this.byId("reserveDialog").open();
            },
            onCancelReserve: function () {

                this.byId("inputReserveVehicleno" && "inputReserveDName" && "inputReservePhoneno" && "DTI1").setValue(" ");

                this.byId("reserveDialog").close();

            },

            onSaveParkingSlot: async function () {

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

            createColumnConfig: function () {
                return [
                    { label: 'Slot no ', property: 'parkingslots/slotno', type: EdmType.String },
                    { label: 'Type (Inward / Outward)', property: 'vehicalType', type: EdmType.String },
                    { label: 'Vehicle NO ', property: 'vehicalNo', type: EdmType.String, scale: 0 },
                    { label: 'Driver name', property: 'driverName', type: EdmType.String },
                    { label: 'Phone no', property: 'phone', type: EdmType.String },
                    { label: 'Assign Date & Time', property: 'assignedDate', type: EdmType.Date, scale: 0 },
                    { label: 'UnAssign Date & Time', property: 'unassignedDate', type: EdmType.Date, scale: 0 }
                ];
            },
            onHistoryExport: function () {
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
                    .then(function () {
                        MessageToast.show('Spreadsheet export has finished');
                    })
                    .finally(function () {
                        oSheet.destroy();
                    });
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

            onNotificationPress: function () {
                var oNotification = this.byId("notifications");
                oNotification.setVisible(true);
                var oPopover = this.byId("notifications");
                if (oPopover.isOpen()) {
                    oPopover.close();
                } else {
                    oPopover.openBy(this.byId("idNotifications"));
                }
            },



            // OnPressAccept: async function () {
            //     var oTable = this.byId("reservationsTable");
            //     var oSelected = oTable.getSelectedItem();
            //     if (!oSelected) {
            //         sap.m.MessageToast.show("Please select a reservation.");
            //         return;
            //     }

            //     var oContext = oSelected.getBindingContext().getObject(),
            //         vendername = oContext.RVenderName,
            //         venderno = oContext.RVenderMobileNo,
            //         rDriverName = oContext.RDriverName,
            //         rDriverNo = oContext.RDriverMobileNo,
            //         rVehicleno = oContext.RVehicleno,
            //         RVehicleType = oContext.RVehicleType,
            //         RDat = oContext.ReservationTime,
            //         oSlotno = oSelected.getCells()[7].getSelectedKey();

            //     if (!oSlotno) {
            //         sap.m.MessageBox.error("Please select a slot number.");
            //         return;
            //     }

            //     var newReservation = {
            //         R1VenderName: vendername,
            //         R1VenderMobileNo: venderno,
            //         R1DriverName: rDriverName,
            //         R1DriverMobileNo: rDriverNo,
            //         ReservationTime1: RDat,
            //         R1Vehicleno: rVehicleno,
            //         R1VehicleType: RVehicleType,
            //         R1slotno_slotno: oSlotno
            //     };

            //     try {
            //         var modelR = this.getView().getModel("ModelV2");
            //         // Create the new reservation
            //         await modelR.create("/Reservered", newReservation);

            //         // Delete the selected reservation request
            //         await oSelected.getBindingContext().delete("$auto");

            //         // Update the slot status
            //         var aFilters = [new sap.ui.model.Filter("slotno", sap.ui.model.FilterOperator.EQ, oSlotno)];
            //         var aContexts = await modelR.read("/Parkingslots", { filters: aFilters });
            //         if (aContexts.results.length > 0) {
            //             var oParkingContext = aContexts.results[0];
            //             oParkingContext.Available = "Reserved"; // Ensure it's a string
            //             await modelR.update(oParkingContext.__metadata.uri, { Available: "Reserved" });
            //         }

            //         // Refresh the model to get the latest data
            //         modelR.refresh();

            //         // Update the allSlotsTable and other UI elements as needed
            //         this.updateAllSlotsTable();
            //         sap.m.MessageToast.show("Reservation accepted and slot status updated.");
            //     } catch (error) {
            //         sap.m.MessageBox.error("Failed to process reservation: " + error.message);
            //     }
            // },

            OnPressAccept: async function () {
                var oTable = this.byId("reservationsTable");
                var oSelected = oTable.getSelectedItem();
                if (!oSelected) {
                    sap.m.MessageToast.show("Please select a reservation.");
                    return;
                }

                var oContext = oSelected.getBindingContext().getObject();
                var vendername = oContext.RVenderName,
                    venderno = oContext.RVenderMobileNo,
                    rDriverName = oContext.RDriverName,
                    rDriverNo = oContext.RDriverMobileNo,
                    rVehicleno = oContext.RVehicleno,
                    RVehicleType = oContext.RVehicleType,
                    RDat = oContext.ReservationTime,
                    oSlotno = oSelected.getCells()[7].getSelectedKey();

                if (!oSlotno) {
                    sap.m.MessageBox.error("Please select a slot number.");
                    return;
                }

                var newReservation = {
                    R1VenderName: vendername,
                    R1VenderMobileNo: venderno,
                    R1DriverName: rDriverName,
                    R1DriverMobileNo: rDriverNo,
                    ReservationTime1: RDat,
                    R1Vehicleno: rVehicleno,
                    R1VehicleType: RVehicleType,
                    R1slotno_slotno: oSlotno
                };

                try {
                    var modelR = this.getView().getModel("ModelV2");

                    // Create the new reservation
                    await modelR.create("/Reservered", newReservation);

                    // Delete the selected reservation request
                    await oSelected.getBindingContext().delete("$auto");

                    // Update the slot status
                    var aFilters = [new sap.ui.model.Filter("slotno", sap.ui.model.FilterOperator.EQ, oSlotno)];
                    var aContexts = await modelR.read("/Parkingslots", { filters: aFilters });

                    if (aContexts && aContexts.results && aContexts.results.length > 0) {
                        var oParkingContext = aContexts.results[0];
                        oParkingContext.Available = "Reserved"; // Ensure it's a string
                        await modelR.update(oParkingContext.__metadata.uri, { Available: "Reserved" });
                    } else {
                        sap.m.MessageBox.error("Slot not found or unavailable.");
                    }

                    // Refresh the model to get the latest data
                    modelR.refresh();

                    // Update the allSlotsTable and other UI elements as needed
                    this.updateAllSlotsTable();
                    sap.m.MessageToast.show("Reservation accepted and slot status updated.");
                } catch (error) {
                    sap.m.MessageBox.error("Failed to process reservation: " + error.message);
                }
            }

        });
    });
