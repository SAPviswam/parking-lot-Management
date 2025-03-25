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
    "sap/m/Popover",
    "sap/m/Text",
    "sap/m/Label",
],
    function (Device, Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, exportLibrary, Spreadsheet, Fragment, ODataMode, Popover, Text, Label) {
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

            onTruckTypeSelect: function(oEvent) {
                var oView = this.getView();
                var oOutboundCheckBox = oView.byId("_IDOutboundCheckBox");
                
                // Default truck type is "Inbound"
                var sSelectedTruckType = "Inbound";
                
                // If outbound checkbox is selected, update truck type to "Outbound"
                if (oOutboundCheckBox.getSelected()) {
                    sSelectedTruckType = "Outbound";
                }
            
                // Apply filters to the parking lot Select control
                this.sSelectedTruckType = sSelectedTruckType;
                var aFilters = [
                    new sap.ui.model.Filter("type", sap.ui.model.FilterOperator.EQ, sSelectedTruckType),
                    new sap.ui.model.Filter("Available", sap.ui.model.FilterOperator.EQ, "Available")
                ];
                var oSelect = oView.byId("parkingLotSelect");
                var oBinding = oSelect.getBinding("items");
                oBinding.filter(aFilters);
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
            statusColorFormatter: function (Available) {
                switch (Available) {
                    case "Occupied":
                        return "Error"; // Red
                    case "Available":
                        return "Success"; // Green
                    case "Reserved":
                        return "Information"; // Orange
                    default:
                        return "None"; // Default color
                }
            },

            // onSelectAssign: async function () {
            //     var sVehicleNo = this.byId("_IDGenInput1").getValue().toUpperCase();
            //     var sDriverName = this.byId("_IDGenInput2").getValue();
            //     var sPhoneNo = this.byId("_IDGenInput3").getValue();
                
            //     // Check if "Outbound" is selected; default to "Inbound" otherwise
            //     var sTruckType = this.byId("_IDOutboundCheckBox").getSelected() ? "Outbound" : "Inbound";
                
            //     var sParkinglotNo = this.byId("parkingLotSelect").getSelectedKey();
                
            //     // Transform driver name to have first character uppercase and remaining characters lowercase
            //     if (sDriverName) {
            //         sDriverName = sDriverName.charAt(0).toUpperCase() + sDriverName.slice(1).toLowerCase();
            //     }
                
            //     // Check if truck type is selected and validate input fields
            //     if (sTruckType === "Outbound") {
            //         if (!sVehicleNo || !sDriverName || !sPhoneNo || !sParkinglotNo) {
            //             sap.m.MessageBox.warning("For outbound slots, please fill all input fields.");
            //             return;
            //         }
            
            //         // Fetch available outbound slots
            //         var aOutboundSlots = this.getView().byId("allSlotsTable").getBinding("items").getContexts()
            //             .filter(context => context.getObject().type === "Outbound" && context.getObject().Available === "Available");
            
            //         // Check if there are any available outbound slots
            //         if (aOutboundSlots.length === 0) {
            //             sap.m.MessageBox.error("No available outbound slots. Please select an inbound slot or try again later.");
            //             return;
            //         }
            
            //         // Verify if the selected slot is an outbound slot
            //         var oSelectedSlot = aOutboundSlots.find(slot => slot.getObject().slotno === sParkinglotNo);
            //         if (!oSelectedSlot) {
            //             sap.m.MessageBox.error("Selected slot is not available for outbound trucks. Please choose a valid outbound slot.");
            //             return;
            //         }
            //     } else {
            //         // For inbound slots
            //         if (!sVehicleNo || !sDriverName || !sPhoneNo || !sParkinglotNo) {
            //             sap.m.MessageBox.warning("Please fill all input fields.");
            //             return;
            //         }
            
            //         // Fetch available inbound slots
            //         var aInboundSlots = this.getView().byId("allSlotsTable").getBinding("items").getContexts()
            //             .filter(context => context.getObject().type === "Inbound" && context.getObject().Available === "Available");
            
            //         // Check if there are any available inbound slots
            //         if (aInboundSlots.length === 0) {
            //             sap.m.MessageBox.error("No available inbound slots. Please select an outbound slot or try again later.");
            //             return;
            //         }
            
            //         // Verify if the selected slot is an inbound slot
            //         var oSelectedSlot = aInboundSlots.find(slot => slot.getObject().slotno === sParkinglotNo);
            //         if (!oSelectedSlot) {
            //             sap.m.MessageBox.error("Selected slot is not available for inbound trucks. Please choose a valid inbound slot.");
            //             return;
            //         }
            //     }
                
            //     // Validate vehicle number format
            //     var vehicleRegex = /^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/; // Regex for vehicle number
            //     if (!vehicleRegex.test(sVehicleNo)) {
            //         sap.m.MessageBox.error("Vehicle number must be in format XXNNXXNNNN where X are letters and N are numbers. Example: AB01CD1234");
            //         return;
            //     }
                
            //     // Validate phone number format
            //     var phoneRegex = /^\d{10}$/; // Regex for phone number
            //     if (!phoneRegex.test(sPhoneNo)) {
            //         sap.m.MessageBox.error("Phone number must be 10 digits long.");
            //         return;
            //     }
                
            //     // Check if the slot is already assigned
            //     var oModel = this.getView().getModel("ModelV2");
            //     var bSlotAlreadyAssigned = await this.isSlotAssigned(oModel, sParkinglotNo);
                
            //     if (bSlotAlreadyAssigned) {
            //         sap.m.MessageBox.error("This slot is already assigned. Please choose another slot.");
            //         return;
            //     }
                
            //     // Check if the vehicle number is already assigned
            //     var bVehicleAlreadyAssigned = await this.isVehicleAssigned(oModel, sVehicleNo);
                
            //     if (bVehicleAlreadyAssigned) {
            //         sap.m.MessageBox.error("This vehicle is already assigned to another slot.");
            //         return;
            //     }
                
            //     // Continue with assignment
            //     var oParkingModel = new sap.ui.model.json.JSONModel({
            //         vehicleNo: sVehicleNo,
            //         driverName: sDriverName,
            //         phoneNo: sPhoneNo,
            //         truckType: sTruckType, // Will be "Outbound" if checked, otherwise "Inbound"
            //         assigntime: new Date(),
            //         parkingslot: {
            //             slotno: sParkinglotNo
            //         }
            //     });
                
            //     this.getView().setModel(oParkingModel, "parkingModel");
                
            //     var oPayload = oParkingModel.getProperty("/");
                
            //     try {
            //         await this.createData(oModel, oPayload, "/Parkinglotassigndetails");
                    
            //         // Update slot status to occupied and type to "Inbound" or "Outbound"
            //         await this.updateSlotStatus(oModel, sParkinglotNo, "Occupied", sTruckType);
                    
            //         // Refresh slot details on Page3
            //         this.refreshSlotDetails(sParkinglotNo); 
            //         this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
                    
            //         // Update allSlotsTable to reflect updated status
            //         this.updateAllSlotsTable(); 
                    
            //         // Print the assignment details with QR code
            //         this.printAssignmentDetails(sVehicleNo, sDriverName, sPhoneNo, sTruckType, sParkinglotNo);
                    
            //         // Refresh the parkingLotSelect dropdown with available inbound slots
            //         await this.updateParkingLotSelect(); 
                    
            //         // Clear input fields
            //         this.byId("_IDGenInput1").setValue("");
            //         this.byId("_IDGenInput2").setValue("");
            //         this.byId("_IDGenInput3").setValue("");
            //         this.byId("_IDOutboundCheckBox").setSelected(false); // Reset checkbox for the next use
                    
            //         // Wait for the table to refresh and update the count
            //         setTimeout(() => {
            //             this.updateTableCount(); // Update the count after the table refresh
            //         }, 1000); 
                    
            //         // Send SMS to driver
            //         var DriverPhoneno = "+91" + sPhoneNo;
            //         const accountSid = 'AC5a7f5b49547b4f26bc2e12ed6ed1c1bb';
            //         const authToken = '7bdef40990b602b404438b9bbfac8a68';
                    
            //         // Function to send SMS using Twilio
            //         const toNumber = DriverPhoneno; // Replace with recipient's phone number
            //         const fromNumber = '+12053796189'; 
            //         const messageBody = 'Hello ' + sDriverName + ', a slot is allocated to your vehicle number.\nVehicle no: ' + sVehicleNo + '\nSlot no: ' + sParkinglotNo + '\nHave a Great Day!!';
                    
            //         // Twilio API endpoint for sending messages
            //         const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
                    
            //         // Payload for the POST request
            //         const payload = {
            //             To: toNumber,
            //             From: fromNumber,
            //             Body: messageBody
            //         };
                    
            //         // Send POST request to Twilio API using jQuery.ajax
            //         $.ajax({
            //             url: url,
            //             type: 'POST',
            //             headers: {
            //                 'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
            //             },
            //             data: payload,
            //             success: function (data) {
            //                 console.log('SMS sent successfully:', data);
            //             },
            //         });
                    
            //         // Show and animate the image
            //         var oTruckImage = this.getView().byId("truckImage");
            //         oTruckImage.removeStyleClass("truckpng");
            //         oTruckImage.addStyleClass("moveLeftToRight");
                    
            //         // Hide the image after the animation completes and display success message
            //         setTimeout(() => {
            //             oTruckImage.removeStyleClass("moveLeftToRight");
            //             oTruckImage.addStyleClass("truckpng");
            //             sap.m.MessageToast.show("Slot " + sParkinglotNo + " assigned to " + sVehicleNo + '\nSMS sent successfully!');
            //         }, 4000); // Duration should match the animation duration
                    
            //         // // Update available slots
            //         // this.updateAvailableSlots();
                    
            //     } catch (error) {
            //         sap.m.MessageBox.error("Failed to assign parking lot: " + error.message);
            //     }
            // },
            // onTruckTypeSelect: function (oEvent) {
            //     var bSelected = oEvent.getSource().getSelected();
            //     this.updateParkingLotSelect(bSelected);
            // },
            
            // updateParkingLotSelect: function (bOutbound) {
            //     var oSelect = this.byId("parkingLotSelect");
            //     var oBinding = oSelect.getBinding("items");
            
            //     var aFilters = [
            //         new sap.ui.model.Filter("Available", sap.ui.model.FilterOperator.EQ, "Available")
            //     ];
            
            //     if (bOutbound) {
            //         aFilters.push(new sap.ui.model.Filter("type", sap.ui.model.FilterOperator.EQ, "Outbound"));
            //     } else {
            //         aFilters.push(new sap.ui.model.Filter("type", sap.ui.model.FilterOperator.EQ, "Inbound"));
            //     }
            
            //     oBinding.filter(aFilters);
            // },
            
            
            // getAvailableOutboundSlots: function (oModel) {
            //     if (!oModel) {
            //         sap.m.MessageBox.error("OData model is not initialized.");
            //         return Promise.reject(new Error("OData model is not initialized."));
            //     }
            
            //     return new Promise((resolve, reject) => {
            //         oModel.read("/Parkingslots", {
            //             filters: [new sap.ui.model.Filter("type", sap.ui.model.FilterOperator.EQ, "Outbound"),
            //                       new sap.ui.model.Filter("Available", sap.ui.model.FilterOperator.EQ, "Available")],
            //             success: function (oData) {
            //                 resolve(oData.results);
            //             },
            //             error: function (oError) {
            //                 reject(oError);
            //             }
            //         });
            //     });
            // },
            
            // updateAvailableOutboundSlots: async function () {
            //     var oModel = this.getView().getModel("ModelV2");
            //     try {
            //         var aOutboundSlots = await this.getAvailableOutboundSlots(oModel);
            //         if (aOutboundSlots.length === 0) {
            //             sap.m.MessageBox.error("No available outbound slots.");
            //             return [];
            //         }
            //         return aOutboundSlots;
            //     } catch (error) {
            //         sap.m.MessageBox.error("Error fetching outbound slots: " + error.message);
            //         return [];
            //     }
            // },
            
            
            // updateAvailableInboundSlots: async function () {
            //     // Fetch available inbound slots
            //     var oModel = this.getView().getModel("ModelV2");
            //     var aInboundSlots = await this.getAvailableInboundSlots(oModel);
            
            //     // Assuming _IDOutboundCheckBox is a ComboBox or Select control
            //     var oComboBox = this.byId("_IDOutboundCheckBox");
            //     oComboBox.removeAllItems();
            
            //     aInboundSlots.forEach(slot => {
            //         oComboBox.addItem(new sap.ui.core.Item({
            //             key: slot.slotno,
            //             text: slot.slotno
            //         }));
            //     });
            // },
            
            onSelectAssign: async function () {
                var sVehicleNo = this.byId("_IDGenInput1").getValue().toUpperCase();
                var sDriverName = this.byId("_IDGenInput2").getValue();
                var sPhoneNo = this.byId("_IDGenInput3").getValue();
                
                // Check if "Outbound" is selected; default to "Inbound" otherwise
                var sTruckType = this.byId("_IDOutboundCheckBox").getSelected() ? "Outbound" : "Inbound";
                
                var sParkinglotNo = this.byId("parkingLotSelect").getSelectedKey();
                
                // Transform driver name to have first character uppercase and remaining characters lowercase
                if (sDriverName) {
                    sDriverName = sDriverName.charAt(0).toUpperCase() + sDriverName.slice(1).toLowerCase();
                }
                
                // Check if truck type is selected and validate input fields
                if (sTruckType === "Outbound") {
                    if (!sVehicleNo || !sDriverName || !sPhoneNo || !sParkinglotNo) {
                        sap.m.MessageBox.warning("For outbound slots, please fill all input fields.");
                        return;
                    }
                    
                    // Fetch available outbound slots
                    var aOutboundSlots = this.getView().byId("allSlotsTable").getBinding("items").getContexts()
                        .filter(context => context.getObject().type === "Outbound" && context.getObject().Available === "Available");
                    
                    // Check if there are any available outbound slots
                    if (aOutboundSlots.length === 0) {
                        sap.m.MessageBox.error("No available outbound slots. Please select an inbound slot or try again later.");
                        return;
                    }
                    
                    // Verify if the selected slot is an outbound slot
                    var oSelectedSlot = aOutboundSlots.find(slot => slot.getObject().slotno === sParkinglotNo);
                    if (!oSelectedSlot) {
                        sap.m.MessageBox.error("Selected slot is not available for outbound trucks. Please choose a valid outbound slot.");
                        return;
                    }
                } else {
                    // For inbound slots
                    if (!sVehicleNo || !sDriverName || !sPhoneNo || !sParkinglotNo) {
                        sap.m.MessageBox.warning("Please fill all input fields.");
                        return;
                    }
                    
                    // Fetch available inbound slots
                    var aInboundSlots = this.getView().byId("allSlotsTable").getBinding("items").getContexts()
                        .filter(context => context.getObject().type === "Inbound" && context.getObject().Available === "Available");
                    
                    // Check if there are any available inbound slots
                    if (aInboundSlots.length === 0) {
                        sap.m.MessageBox.error("No available inbound slots. Please select an outbound slot or try again later.");
                        return;
                    }
                    
                    // Verify if the selected slot is an inbound slot
                    var oSelectedSlot = aInboundSlots.find(slot => slot.getObject().slotno === sParkinglotNo);
                    if (!oSelectedSlot) {
                        sap.m.MessageBox.error("Selected slot is not available for inbound trucks. Please choose a valid inbound slot.");
                        return;
                    }
                }
                
                // Validate vehicle number format
                var vehicleRegex = /^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/; // Regex for vehicle number
                if (!vehicleRegex.test(sVehicleNo)) {
                    sap.m.MessageBox.error("Vehicle number must be in format XXNNXXNNNN where X are letters and N are numbers. Example: AB01CD1234");
                    return;
                }
                
                // Validate phone number format
                var phoneRegex = /^\d{10}$/; // Regex for phone number
                if (!phoneRegex.test(sPhoneNo)) {
                    sap.m.MessageBox.error("Phone number must be 10 digits long.");
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
                    truckType: sTruckType, // Will be "Outbound" if checked, otherwise "Inbound"
                    assigntime: new Date(),
                    parkingslot: {
                        slotno: sParkinglotNo
                    }
                });
                
                this.getView().setModel(oParkingModel, "parkingModel");
                
                var oPayload = oParkingModel.getProperty("/");
                
                try {
                    await this.createData(oModel, oPayload, "/Parkinglotassigndetails");
                    
                    // Update slot status to occupied and type to "Inbound" or "Outbound"
                    await this.updateSlotStatus(oModel, sParkinglotNo, "Occupied", sTruckType);
                    
                    // Refresh slot details on Page3
                    this.refreshSlotDetails(sParkinglotNo); 
                    this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
                    
                    // Update allSlotsTable to reflect updated status
                    this.updateAllSlotsTable(); 
                    
                    // Print the assignment details with QR code
                    this.printAssignmentDetails(sVehicleNo, sDriverName, sPhoneNo, sTruckType, sParkinglotNo);
                    
                    // Refresh the parkingLotSelect dropdown with available inbound slots
                    await this.updateParkingLotSelect(); 
                    
                    // Clear input fields
                    this.byId("_IDGenInput1").setValue("");
                    this.byId("_IDGenInput2").setValue("");
                    this.byId("_IDGenInput3").setValue("");
                    this.byId("_IDOutboundCheckBox").setSelected(false); // Reset checkbox for the next use
                    
                    // Wait for the table to refresh and update the count
                    setTimeout(() => {
                        this.updateTableCount(); // Update the count after the table refresh
                    }, 1000); 
                    
                    // Send SMS to driver
                    var DriverPhoneno = "+91" + sPhoneNo;
                    const accountSid = 'AC5a7f5b49547b4f26bc2e12ed6ed1c1bb';
                    const authToken = 'fc47ee051c5466790ca761f8d3b0a31c';
                    
                    // Function to send SMS using Twilio
                    const toNumber = DriverPhoneno; // Replace with recipient's phone number
                    const fromNumber = '+12315089152'; 
                    const messageBody = 'Hello ' + sDriverName + ', a slot is allocated to your vehicle number.\nVehicle no: ' + sVehicleNo + '\nSlot no: ' + sParkinglotNo + '\nHave a Great Day!!';
                    
                    // Twilio API endpoint for sending messages
                    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
                    
                    // Payload for the POST request
                    const payload = {
                        To: toNumber,
                        From: fromNumber,
                        Body: messageBody
                    };
                    
                    // Send POST request to Twilio API using jQuery.ajax
                    $.ajax({
                        url: url,
                        type: 'POST',
                        headers: {
                            'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
                        },
                        data: payload,
                        success: function (data) {
                            console.log('SMS sent successfully:', data);
                        },
                    });
                    
                    // Show and animate the image
                    var oTruckImage = this.getView().byId("truckImage");
                    oTruckImage.removeStyleClass("truckpng");
                    oTruckImage.addStyleClass("moveLeftToRight");
                    
                    // Hide the image after the animation completes and display success message
                    setTimeout(() => {
                        oTruckImage.removeStyleClass("moveLeftToRight");
                        oTruckImage.addStyleClass("truckpng");
                        sap.m.MessageToast.show("Slot " + sParkinglotNo + " assigned to " + sVehicleNo + '\nSMS sent successfully!');
                    }, 4000); // Duration should match the animation duration
                    
                    // // Update available slots
                    // this.updateAvailableSlots();
                    
                } catch (error) {
                    sap.m.MessageBox.error("Failed to assign parking lot: " + error.message);
                }
            },
            
            updateParkingLotSelect: async function () {
                var oModel = this.getView().getModel("ModelV2");
                
                try {
                    var aInboundSlots = await new Promise((resolve, reject) => {
                        oModel.read("/Parkingslots", {
                            filters: [
                                new sap.ui.model.Filter("type", sap.ui.model.FilterOperator.EQ, "Inbound"),
                                new sap.ui.model.Filter("Available", sap.ui.model.FilterOperator.EQ, "Available")
                            ],
                            success: function (oData) {
                                resolve(oData.results);
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                    
                    var oParkingLotSelect = this.byId("parkingLotSelect");
                    oParkingLotSelect.destroyItems();
                    
                    aInboundSlots.forEach(slot => {
                        oParkingLotSelect.addItem(new sap.ui.core.Item({
                            key: slot.slotno,
                            text: slot.slotno
                        }));
                    });
                } catch (error) {
                    sap.m.MessageBox.error("Failed to update parking lot select: " + error.message);
                }
            },
            
            
            

            // onSelectAssign: async function () {
            //     var sVehicleNo = this.byId("_IDGenInput1").getValue().toUpperCase();
            //     var sDriverName = this.byId("_IDGenInput2").getValue();
            //     var sPhoneNo = this.byId("_IDGenInput3").getValue();
            //     var sTruckType = this.byId("_IDGenInput4").getSelectedKey();
            //     var sParkinglotNo = this.byId("parkingLotSelect").getSelectedKey();
            
            //     // Transform driver name to have first character uppercase and remaining characters lowercase
            //     if (sDriverName) {
            //         sDriverName = sDriverName.charAt(0).toUpperCase() + sDriverName.slice(1).toLowerCase();
            //     }
            
            //     // Check if any of the required fields are empty
            //     if (!sVehicleNo || !sDriverName || !sPhoneNo || !sTruckType || !sParkinglotNo) {
            //         sap.m.MessageBox.warning("Please fill all input fields.");
            //         return;
            //     }
            
            //     // Validate vehicle number format
            //     var vehicleRegex = /^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/; // Regex for vehicle number
            //     if (!vehicleRegex.test(sVehicleNo)) {
            //         sap.m.MessageBox.error("Vehicle number must be in format XXNNXXNNNN where X are letters and N are numbers. Example: AB01CD1234");
            //         return;
            //     }
            
            //     // Validate phone number format
            //     var phoneRegex = /^\d{10}$/; // Regex for phone number
            //     if (!phoneRegex.test(sPhoneNo)) {
            //         sap.m.MessageBox.error("Phone number must be 10 digits long.");
            //         return;
            //     }
            
            //     // Check if the slot is already assigned
            //     var oModel = this.getView().getModel("ModelV2");
            //     var bSlotAlreadyAssigned = await this.isSlotAssigned(oModel, sParkinglotNo);
            
            //     if (bSlotAlreadyAssigned) {
            //         sap.m.MessageBox.error("This slot is already assigned. Please choose another slot.");
            //         return;
            //     }
            
            //     // Check if the vehicle number is already assigned
            //     var bVehicleAlreadyAssigned = await this.isVehicleAssigned(oModel, sVehicleNo);
            
            //     if (bVehicleAlreadyAssigned) {
            //         sap.m.MessageBox.error("This vehicle is already assigned to another slot.");
            //         return;
            //     }
            
            //     // Continue with assignment
            //     var oParkingModel = new sap.ui.model.json.JSONModel({
            //         vehicleNo: sVehicleNo,
            //         driverName: sDriverName,
            //         phoneNo: sPhoneNo,
            //         truckType: sTruckType,
            //         assigntime: new Date(),
            //         parkingslot: {
            //             slotno: sParkinglotNo
            //         }
            //     });
            
            //     this.getView().setModel(oParkingModel, "parkingModel");
            
            //     var oPayload = oParkingModel.getProperty("/");
            
            //     try {
            //         await this.createData(oModel, oPayload, "/Parkinglotassigndetails");
            
            //         // Update slot status to occupied
            //         await this.updateSlotStatus(oModel, sParkinglotNo, "Occupied");
                    
            //         // Refresh slot details on Page3
            //         this.refreshSlotDetails(sParkinglotNo); 
            //         this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
            
            //         // Update allSlotsTable to reflect updated status
            //         this.updateAllSlotsTable(); 
            
            //         // Print the assignment details with QR code
            //         this.printAssignmentDetails(sVehicleNo, sDriverName, sPhoneNo, sTruckType, sParkinglotNo);
                    
            //         // Refresh the parkingLotSelect dropdown
            //         this.updateParkingLotSelect(); 
            
            //         // Clear input fields
            //         this.byId("_IDGenInput1").setValue("");
            //         this.byId("_IDGenInput2").setValue("");
            //         this.byId("_IDGenInput3").setValue("");
            //         this.byId("_IDGenInput4").setSelectedKey("");
            
            //         // Wait for the table to refresh and update the count
            //         setTimeout(() => {
            //             this.updateTableCount(); // Update the count after the table refresh
            //         }, 1000); 
            
            //         // Send SMS to driver
            //         var DriverPhoneno = "+91" + sPhoneNo;
                        
            //             const accountSid = 'AC5a7f5b49547b4f26bc2e12ed6ed1c1bb';
            //             const authToken = '7bdef40990b602b404438b9bbfac8a68';
            
            //         // Function to send SMS using Twili
            //             debugger
            //             const toNumber = DriverPhoneno; // Replace with recipient's phone number
            //             const fromNumber = '+12053796189'; 
            //             const messageBody = 'Hello ' + sDriverName + ', a slot is allocated to your vehicle number.\nVehicle no: ' + sVehicleNo + '\nSlot no: ' + sParkinglotNo + '\nHave a Great Day!!';
            
            //             // Twilio API endpoint for sending messages
            //             const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            
            //             // Payload for the POST request
            //             const payload = {
            //                 To: toNumber,
            //                 From: fromNumber,
            //                 Body: messageBody
            //             };
            
            //             // Send POST request to Twilio API using jQuery.ajax
            //         $.ajax({
            //             url: url,
            //             type: 'POST',
            //             headers: {
            //                 'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
            //             },
            //             data: payload,
            //             success: function (data) {
            //                 console.log('SMS sent successfully:', data);
            //             },
            //         });
            
            //         // Show and animate the image
            //         var oTruckImage = this.getView().byId("truckImage");
            //         oTruckImage.removeStyleClass("truckpng");
            //         oTruckImage.addStyleClass("moveLeftToRight");
            
            //         // Hide the image after the animation completes and display success message
            //         setTimeout(() => {
            //             oTruckImage.removeStyleClass("moveLeftToRight");
            //             oTruckImage.addStyleClass("truckpng");
            //             sap.m.MessageBox.success("Slot " + sParkinglotNo + " assigned to " + sVehicleNo + '\nSMS sent successfully!');
            //         }, 4000); // Duration should match the animation duration
            
            //     } catch (error) {
            //         sap.m.MessageBox.error("Failed to assign parking lot: " + error.message);
            //     }
            // },
            // onSelectAssign: async function () {
            //     var oView = this.getView();

            //     // Get the values from the input fields
            //     var sVehicleNo = oView.byId("_IDGenInput1").getValue();
            //     var sDriverName = oView.byId("_IDGenInput2").getValue();
            //     var sPhoneNo = oView.byId("_IDGenInput3").getValue();
            //     var bInboundSelected = oView.byId("_IDInboundCheckBox").getSelected();
            //     var bOutboundSelected = oView.byId("_IDOutboundCheckBox").getSelected();
            //     var sTruckType = bInboundSelected ? "Inbound" : (bOutboundSelected ? "Outbound" : "");
            //     var sParkinglotNo = oView.byId("parkingLotSelect").getSelectedKey();
            
            //     // Check if any of the required fields are empty
            //     if (!sVehicleNo || !sDriverName || !sPhoneNo || !sTruckType || !sParkinglotNo) {
            //         sap.m.MessageBox.warning("Please fill all input fields.");
            //         return;
            //     }
            
            //     // Transform driver name to have the first character uppercase and remaining characters lowercase
            //     if (sDriverName) {
            //         sDriverName = sDriverName.charAt(0).toUpperCase() + sDriverName.slice(1).toLowerCase();
            //     }
            

            
            //     // Validate vehicle number format
            //     var vehicleRegex = /^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/; // Regex for vehicle number
            //     if (!vehicleRegex.test(sVehicleNo)) {
            //         sap.m.MessageBox.error("Vehicle number must be in format XXNNXXNNNN where X are letters and N are numbers. Example: AB01CD1234");
            //         return;
            //     }
            
            //     // Validate phone number format
            //     var phoneRegex = /^\d{10}$/; // Regex for phone number
            //     if (!phoneRegex.test(sPhoneNo)) {
            //         sap.m.MessageBox.error("Phone number must be 10 digits long.");
            //         return;
            //     }
            
            //     // Check if the slot is already assigned
            //     var oModel = this.getView().getModel("ModelV2");
            //     var bSlotAlreadyAssigned = await this.isSlotAssigned(oModel, sParkinglotNo);
            
            //     if (bSlotAlreadyAssigned) {
            //         sap.m.MessageBox.error("This slot is already assigned. Please choose another slot.");
            //         return;
            //     }
            
            //     // Check if the vehicle number is already assigned
            //     var bVehicleAlreadyAssigned = await this.isVehicleAssigned(oModel, sVehicleNo);
            
            //     if (bVehicleAlreadyAssigned) {
            //         sap.m.MessageBox.error("This vehicle is already assigned to another slot.");
            //         return;
            //     }
            
            //     // Continue with assignment
            //     var oParkingModel = new sap.ui.model.json.JSONModel({
            //         vehicleNo: sVehicleNo,
            //         driverName: sDriverName,
            //         phoneNo: sPhoneNo,
            //         truckType: sTruckType,
            //         assigntime: new Date(),
            //         parkingslot: {
            //             slotno: sParkinglotNo
            //         }
            //     });
            
            //     this.getView().setModel(oParkingModel, "parkingModel");
            
            //     var oPayload = oParkingModel.getProperty("/");
            
            //     try {
            //         await this.createData(oModel, oPayload, "/Parkinglotassigndetails");
            
            //         // Update slot status to occupied
            //         await this.updateSlotStatus(oModel, sParkinglotNo, "Occupied");
            
            //         // Refresh slot details on Page3
            //         this.refreshSlotDetails(sParkinglotNo); 
            //         this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
            
            //         // Update allSlotsTable to reflect updated status
            //         this.updateAllSlotsTable();
            
            //         // Print the assignment details with QR code
            //         this.printAssignmentDetails(sVehicleNo, sDriverName, sPhoneNo, sTruckType, sParkinglotNo);
            
            //         // Refresh the parkingLotSelect dropdown
            //         this.updateParkingLotSelect();
            
            //         // Clear input fields
            //         this.byId("_IDGenInput1").setValue("");
            //         this.byId("_IDGenInput2").setValue("");
            //         this.byId("_IDGenInput3").setValue("");
            //         this.byId("_IDInboundCheckBox").setSelected(false);
            //         this.byId("_IDOutboundCheckBox").setSelected(false);
            //         this.byId("parkingLotSelect").setSelectedKey("");
            
            //         // Wait for the table to refresh and update the count
            //         setTimeout(() => {
            //             this.updateTableCount(); // Update the count after the table refresh
            //         }, 1000);
            
            //         // Show and animate the image
            //         var oTruckImage = this.getView().byId("truckImage");
            //         oTruckImage.removeStyleClass("truckpng");
            //         oTruckImage.addStyleClass("moveLeftToRight");
            
            //         // Hide the image after the animation completes and display success message
            //         setTimeout(() => {
            //             oTruckImage.removeStyleClass("moveLeftToRight");
            //             oTruckImage.addStyleClass("truckpng");
            //             sap.m.MessageBox.success("Slot " + sParkinglotNo + " assigned to " + sVehicleNo + '\nSMS sent successfully!');
            //         }, 4000); // Duration should match the animation duration
            
            //     } catch (error) {
            //         sap.m.MessageBox.error("Failed to assign parking lot: " + error.message);
            //     }
            // },
            
            


           



            // onSelectAssign: async function () {
            //     var sVehicleNo = this.byId("_IDGenInput1").getValue().toUpperCase();
            //     var sDriverName = this.byId("_IDGenInput2").getValue();
            //     var sPhoneNo = this.byId("_IDGenInput3").getValue();
            //     var sTruckType = this.byId("_IDGenInput4").getSelectedKey();
            //     var sParkinglotNo = this.byId("parkingLotSelect").getSelectedKey();
            
            //     // Transform driver name to have first character uppercase and remaining characters lowercase
            //     if (sDriverName) {
            //         sDriverName = sDriverName.charAt(0).toUpperCase() + sDriverName.slice(1).toLowerCase();
            //     }
            
            //     // Check if any of the required fields are empty
            //     if (!sVehicleNo || !sDriverName || !sPhoneNo || !sTruckType || !sParkinglotNo) {
            //         sap.m.MessageBox.warning("Please fill all input fields.");
            //         return;
            //     }
            
            //     // Validate vehicle number format
            //     var vehicleRegex = /^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/; // Regex for vehicle number
            //     if (!vehicleRegex.test(sVehicleNo)) {
            //         sap.m.MessageBox.error("Vehicle number must be in format XXNNXXNNNN where X are letters and N are numbers. Example: AB01CD1234");
            //         return;
            //     }
            
            //     // Validate phone number format
            //     var phoneRegex = /^\d{10}$/; // Regex for phone number
            //     if (!phoneRegex.test(sPhoneNo)) {
            //         sap.m.MessageBox.error("Phone number must be 10 digits long.");
            //         return;
            //     }
            
            //     // Check if the slot is already assigned
            //     var oModel = this.getView().getModel("ModelV2");
            //     var bSlotAlreadyAssigned = await this.isSlotAssigned(oModel, sParkinglotNo);
            
            //     if (bSlotAlreadyAssigned) {
            //         sap.m.MessageBox.error("This slot is already assigned. Please choose another slot.");
            //         return;
            //     }
            
            //     // Check if the vehicle number is already assigned
            //     var bVehicleAlreadyAssigned = await this.isVehicleAssigned(oModel, sVehicleNo);
            
            //     if (bVehicleAlreadyAssigned) {
            //         sap.m.MessageBox.error("This vehicle is already assigned to another slot.");
            //         return;
            //     }
            
            //     // Continue with assignment
            //     var oParkingModel = new sap.ui.model.json.JSONModel({
            //         vehicleNo: sVehicleNo,
            //         driverName: sDriverName,
            //         phoneNo: sPhoneNo,
            //         truckType: sTruckType,
            //         assigntime: new Date(),
            //         parkingslot: {
            //             slotno: sParkinglotNo
            //         }
            //     });
            
            //     this.getView().setModel(oParkingModel, "parkingModel");
            
            //     var oPayload = oParkingModel.getProperty("/");
            
            //     try {
            //         await this.createData(oModel, oPayload, "/Parkinglotassigndetails");
            
            //         // Update slot status to occupied
            //         await this.updateSlotStatus(oModel, sParkinglotNo, "Occupied");
                    
            //         // Refresh slot details on Page3
            //         this.refreshSlotDetails(sParkinglotNo); 
            //         this.getView().byId("assignedSlotsTable").getBinding("items").refresh();

            //         // Update allSlotsTable to reflect updated status
            //         this.updateAllSlotsTable(); 
            
            //         // Print the assignment details with QR code
            //         this.printAssignmentDetails(sVehicleNo, sDriverName, sPhoneNo, sTruckType, sParkinglotNo);
                    
            //         // Refresh the parkingLotSelect dropdown
            //         this.updateParkingLotSelect(); 
            
            //         // Clear input fields
            //         this.byId("_IDGenInput1").setValue("");
            //         this.byId("_IDGenInput2").setValue("");
            //         this.byId("_IDGenInput3").setValue("");
            //         this.byId("_IDGenInput4").setSelectedKey("");
            
            //         // Wait for the table to refresh and update the count
            //         setTimeout(() => {
            //             this.updateTableCount(); // Update the count after the table refresh
            //         }, 1000); 

            //         // Send SMS to driver
            //         var DriverPhoneno = "+91" + sPhoneNo;
                        
            //             const accountSid = 'AC5a7f5b49547b4f26bc2e12ed6ed1c1bb';
            //             const authToken = '7bdef40990b602b404438b9bbfac8a68';

            //         // Function to send SMS using Twili
            //             debugger
            //             const toNumber = DriverPhoneno; // Replace with recipient's phone number
            //             const fromNumber = '+12053796189'; 
            //             const messageBody = 'Hello ' + sDriverName + ', a slot is allocated to your vehicle number.\nVehicle no: ' + sVehicleNo + '\nSlot no: ' + sParkinglotNo + '\nHave a Great Day!!';

            //             // Twilio API endpoint for sending messages
            //             const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

            //             // Payload for the POST request
            //             const payload = {
            //                 To: toNumber,
            //                 From: fromNumber,
            //                 Body: messageBody
            //             };

            //             // Send POST request to Twilio API using jQuery.ajax
            //         $.ajax({
            //             url: url,
            //             type: 'POST',
            //             headers: {
            //                 'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
            //             },
            //             data: payload,
            //             success: function (data) {
            //                 console.log('SMS sent successfully:', data);
            //                 sap.m.MessageBox.success("Slot " + sParkinglotNo + " assigned to " + sVehicleNo + '\nSMS sent successfully!');
            //             },
            //         });
            
            //     } catch (error) {
            //         sap.m.MessageBox.error("Failed to assign parking lot: " + error.message);
            //     }
            // },
            // onSelectAssign: async function () {
            //     var sPhoneNo = this.byId("_IDGenInput3").getValue();
            //     var sDriverName = this.byId("_IDGenInput2").getValue();
            //     var sVehicleNo = this.byId("_IDGenInput1").getValue().toUpperCase();
            //     var sParkinglotNo = this.byId("parkingLotSelect").getSelectedKey();
                
            //     // Send SMS to driver
            //     var DriverPhoneno = "+91" + sPhoneNo;
                    
            //     const accountSid = 'AC5a7f5b49547b4f26bc2e12ed6ed1c1bb'; // Twilio Account SID
            //     const authToken = '7bdef40990b602b404438b9bbfac8a68';    // Twilio Auth Token
            
            //     // Function to send SMS using Twilio
            //     const toNumber = DriverPhoneno; // Replace with recipient's phone number
            //     const fromNumber = '+12053796189'; 
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
            //     $.ajax({
            //         url: url,
            //         type: 'POST',
            //         headers: {
            //             'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
            //         },
            //         data: payload,
            //         success: function (data) {
            //             console.log('SMS sent successfully:', data);
            //             sap.m.MessageBox.success("SMS sent successfully to " + sDriverName + ".\nVehicle number " + sVehicleNo + " assigned to slot " + sParkinglotNo + ".");
            //         },
            //         error: function (error) {
            //             console.log('Failed to send SMS:', error);
            //             sap.m.MessageBox.error("Failed to send SMS: " + error.message);
            //         }
            //     });
            // },
            // printAssignmentDetails: function () {
            //     // Fetch values from the view
            //     var currentDateTime = new Date();
            //     var formattedDate = currentDateTime.toLocaleDateString();
            //     var formattedTime = currentDateTime.toLocaleTimeString();
            //     var vno1 = this.byId("_IDGenInput1").getValue();
            //     var Slotno = this.byId("parkingLotSelect").getSelectedItem().getText();
            //     var DriverPhone = this.byId("_IDGenInput3").getValue();
            //     var oDrivername = this.byId("_IDGenInput2").getValue();
            //     var Slottype = this.byId("_IDOutboundCheckBox").getSelected() ? "Outbound" : "Inbound"; // Adjust based on selected truck type
                
            //     // Create a new window for printing
            //     var printWindow = window.open('', '', 'height=600,width=800');
            
            //     // Write HTML content to the print window
            //     printWindow.document.write('<html><head><title>Print Receipt</title>');
            //     printWindow.document.write('<style>');
            //     printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
            //     printWindow.document.write('.details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }');
            //     printWindow.document.write('.details-table th, .details-table td { border: 1px solid #000; padding: 8px; text-align: left; }');
            //     printWindow.document.write('.details-table th { background-color: #f2f2f2; }');
            //     printWindow.document.write('.qr-code { text-align: center; margin-top: 20px; }');
            //     printWindow.document.write('.truck-image { text-align: center; margin-top: 20px; }');
            //     printWindow.document.write('</style>');
            //     printWindow.document.write('</head><body>');
            //     printWindow.document.write('<div class="print-container">');
            //     printWindow.document.write('<h1>Parking-Slot Assigned Details Slip:</h1>');
            //     printWindow.document.write('</div>');
            //     printWindow.document.write('<div class="date-time">');
            //     printWindow.document.write('<p><strong>Date:</strong> ' + formattedDate + '</p>');
            //     printWindow.document.write('<p><strong>Time:</strong> ' + formattedTime + '</p>');
            //     printWindow.document.write('</div>');
            //     printWindow.document.write('<table class="details-table">');
            //     printWindow.document.write('<tr><th>Property</th><th>Details</th><th>QR Code</th></tr>');
            //     printWindow.document.write('<tr><td>Vehicle Number</td><td>' + vno1 + '</td><td rowspan="5"><div id="qrcode"></div></td></tr>');
            //     printWindow.document.write('<tr><td>Parking Slot Number</td><td>' + Slotno + '</td></tr>');
            //     printWindow.document.write('<tr><td>Driver Name</td><td>' + oDrivername + '</td></tr>');
            //     printWindow.document.write('<tr><td>Driver Phone Number</td><td>' + DriverPhone + '</td></tr>');
            //     printWindow.document.write('<tr><td>Delivery Type</td><td>' + Slottype + '</td></tr>');
            //     printWindow.document.write('</table>');
            //     printWindow.document.write('<div class="truck-image">');
            //     printWindow.document.write('<img src="https://static.vecteezy.com/system/resources/previews/019/071/243/original/truck-isolated-on-transparent-background-3d-rendering-illustration-free-png.png" height="200"/>');
            //     printWindow.document.write('</div>');
            
            //     // Close document and initiate QR code generation
            //     printWindow.document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>');
            //     printWindow.document.write('<script>');
            //     printWindow.document.write('setTimeout(function() {');
            //     printWindow.document.write('new QRCode(document.getElementById("qrcode"), {');
            //     printWindow.document.write('text: "Vehicle Number: ' + vno1 + '\\nDriver Name: ' + oDrivername + '\\nSlot Number: ' + Slotno + '",');
            //     printWindow.document.write('width: 100,');
            //     printWindow.document.write('height: 100');
            //     printWindow.document.write('});');
            //     printWindow.document.write('}, 1000);'); // Adjust the timeout for QR code rendering
            //     printWindow.document.write('</script>');
            
            //     // Close document
            //     printWindow.document.write('</body></html>');
            //     printWindow.document.close();
            //     printWindow.focus();
            
            //     // Wait for QR code to be fully rendered before printing
            //     setTimeout(function() {
            //         printWindow.print();
            //     }, 500); // Timeout to ensure the QR code is rendered before printing
            // },
            
            printAssignmentDetails: function () {
                // Fetch values from the view
                var currentDateTime = new Date();
                var formattedDate = currentDateTime.toLocaleDateString();
                var formattedTime = currentDateTime.toLocaleTimeString();
                var vno1 = this.byId("_IDGenInput1").getValue().toUpperCase(); // Ensure vehicle number is in uppercase
                var Slotno = this.byId("parkingLotSelect").getSelectedItem().getText();
                var DriverPhone = this.byId("_IDGenInput3").getValue();
                var oDrivername = this.byId("_IDGenInput2").getValue();
                var Slottype = this.byId("_IDOutboundCheckBox").getSelected() ? "Outbound" : "Inbound"; // Adjust based on selected truck type
                
                // Transform driver name to have first character uppercase and remaining characters lowercase
                if (oDrivername) {
                    oDrivername = oDrivername.charAt(0).toUpperCase() + oDrivername.slice(1).toLowerCase();
                }
            
                // Create a new window for printing
                var printWindow = window.open('', '', 'height=600,width=800');
            
                // Write HTML content to the print window
                printWindow.document.write('<html><head><title>Print Receipt</title>');
                printWindow.document.write('<style>');
                printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
                printWindow.document.write('.details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }');
                printWindow.document.write('.details-table th, .details-table td { border: 1px solid #000; padding: 8px; text-align: left; }');
                printWindow.document.write('.details-table th { background-color: #f2f2f2; }');
                printWindow.document.write('.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }');
                printWindow.document.write('.date-time { flex-grow: 1; }');
                printWindow.document.write('.qr-code { margin-right: 50px; }');
                printWindow.document.write('.truck-image { text-align: center; margin-top: 20px; }');
                printWindow.document.write('.logo { position: absolute; top: 20px; right: 20px; }'); 
                printWindow.document.write('.Dummy { padding:1rem; }');
                printWindow.document.write('</style>');
                printWindow.document.write('</head><body>');
            
                // Add the logo to the top right corner
                printWindow.document.write('<div class="logo">');
                printWindow.document.write('<img src="https://artihcus.com/assets/img/AG-logo.png" height="50"/>'); // Reduced size
                printWindow.document.write('</div>');
                printWindow.document.write('<div class="Dummy">');
                printWindow.document.write('</div>');
            
                printWindow.document.write('<div class="title">');
                printWindow.document.write('<h1>Parking-Slot Assigned Details Slip:</h1>');
                printWindow.document.write('</div>');
                printWindow.document.write('<div class="header">');
                printWindow.document.write('<div class="date-time">');
                printWindow.document.write('<p><strong>Date:</strong> ' + formattedDate + '</p>');
                printWindow.document.write('<p><strong>Time:</strong> ' + formattedTime + '</p>');
                printWindow.document.write('</div>');
                printWindow.document.write('<div class="qr-code" id="qrcode"></div>');
                printWindow.document.write('</div>');
                printWindow.document.write('<table class="details-table">');
                printWindow.document.write('<tr><th>Property</th><th>Details</th></tr>');
                printWindow.document.write('<tr><td>Vehicle Number</td><td>' + vno1 + '</td></tr>');
                printWindow.document.write('<tr><td>Parking Slot Number</td><td>' + Slotno + '</td></tr>');
                printWindow.document.write('<tr><td>Driver Name</td><td>' + oDrivername + '</td></tr>');
                printWindow.document.write('<tr><td>Driver Phone Number</td><td>' + DriverPhone + '</td></tr>');
                printWindow.document.write('<tr><td>Delivery Type</td><td>' + Slottype + '</td></tr>');
                printWindow.document.write('</table>');
                printWindow.document.write('<div class="truck-image">');
                // printWindow.document.write('<img src="https://static.vecteezy.com/system/resources/previews/019/071/243/original/truck-isolated-on-transparent-background-3d-rendering-illustration-free-png.png" height="200"/>');
                printWindow.document.write('</div>');
                
                // Close document and initiate QR code generation
                printWindow.document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>');
                printWindow.document.write('<script>');
                printWindow.document.write('setTimeout(function() {');
                printWindow.document.write('new QRCode(document.getElementById("qrcode"), {');
                // printWindow.document.write('text: "Vehicle Number: ' + vno1 + '\\nDriver Name: ' + oDrivername + '\\nSlot Number: ' + Slotno + '",');
                printWindow.document.write('text: "' + vno1 + '",');
                printWindow.document.write('width: 100,');
                printWindow.document.write('height: 100');
                printWindow.document.write('});');
                printWindow.document.write('}, 1000);'); // Adjust the timeout for QR code rendering
                printWindow.document.write('</script>');
                
                // Close document
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                
                // Wait for QR code to be fully rendered before printing
                setTimeout(function() {
                    printWindow.print();
                }, 1500); // Timeout to ensure the QR code is rendered before printing
            },
            
            
            

            // printAssignmentDetails: function(sVehicleNo, sDriverName, sPhoneNo, sTruckType, sParkinglotNo) {
            //     var barcodeData = `Vehicle No: ${sVehicleNo}`;
            //     var currentDateTime = new Date();
            //     var formattedDate = currentDateTime.toLocaleDateString();
            //     var formattedTime = currentDateTime.toLocaleTimeString();
            
            //     // Create a new window for printing
            //     var printWindow = window.open('', '', 'height=600,width=800');
            
            //     printWindow.document.write('<html><head><title>Print Assigned Details</title>');
            //     printWindow.document.write('<style>');
            //     printWindow.document.write('body { font-family: Arial, sans-serif; }');
            //     printWindow.document.write('.print-container { padding: 20px; position: relative; }');
            //     printWindow.document.write('.header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }');
            //     printWindow.document.write('.barcode-container { flex-shrink: 0; }'); // Prevent shrinking of barcode container
            //     printWindow.document.write('.details-table { width: 100%; border-collapse: collapse; }');
            //     printWindow.document.write('.details-table th, .details-table td { border: 1px solid #000; padding: 8px; text-align: left; }');
            //     printWindow.document.write('.details-table th { background-color: #f2f2f2; }');
            //     printWindow.document.write('</style>');
            //     printWindow.document.write('</head><body>');
            //     printWindow.document.write('<div class="print-container">');
            //     printWindow.document.write('<h1>Parking-slot Assigned Details</h1>');
            //     printWindow.document.write('<div class="header-container">');
            //     printWindow.document.write('<div class="date-time">');
            //     printWindow.document.write('<p><strong>Date:</strong> ' + formattedDate + '</p>');
            //     printWindow.document.write('<p><strong>Time:</strong> ' + formattedTime + '</p>');
            //     printWindow.document.write('</div>');
            //     printWindow.document.write('<div class="barcode-container"><svg id="barcode"></svg></div>');
            //     printWindow.document.write('</div>');
            //     printWindow.document.write('<table class="details-table">');
            //     printWindow.document.write('<tr><th>Field</th><th>Details</th></tr>');
            //     printWindow.document.write('<tr><td>Vehicle No</td><td>' + sVehicleNo + '</td></tr>');
            //     printWindow.document.write('<tr><td>Driver Name</td><td>' + sDriverName + '</td></tr>');
            //     printWindow.document.write('<tr><td>Phone No</td><td>' + sPhoneNo + '</td></tr>');
            //     printWindow.document.write('<tr><td>Truck Type</td><td>' + sTruckType + '</td></tr>');
            //     printWindow.document.write('<tr><td>Parking Lot No</td><td>' + sParkinglotNo + '</td></tr>');
            //     printWindow.document.write('</table>');
            //     printWindow.document.write('<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>');
            //     printWindow.document.write('<script>document.addEventListener("DOMContentLoaded", function() { JsBarcode("#barcode", "' + barcodeData + '"); });</script>');
            //     printWindow.document.write('</div>');
            //     printWindow.document.write('</body></html>');
            //     printWindow.document.close();
            //     printWindow.focus();
            
            //     // Print the contents of the new window
            //     printWindow.print();
            // },
            
            
            updateTableCount: function() {
                const oTable = this.getView().byId("assignedSlotsTable");
                const oBinding = oTable.getBinding("items");
                if (oBinding) {
                    const iTableCount = oBinding.getLength();
                    this.getView().byId("assignedSlotstableTitle").setText(`Assigned Slots (${iTableCount})`);
                } else {
                    // Handle the case where the binding is not available
                    console.error("Binding not found for assignedSlotsTable.");
                }
            },

          
            



            onUnAssign: async function () {
                const oView = this.getView();
                const oSelected = this.byId("assignedSlotsTable").getSelectedItem();
            
                if (!oSelected) {
                    sap.m.MessageToast.show("Please select a vehicle to unassign.");
                    return;
                }
            
                const aSelectedItems = this.byId("assignedSlotsTable").getSelectedItems();
                if (aSelectedItems.length > 1) {
                    sap.m.MessageToast.show("Please select only one vehicle to unassign.");
                    return;
                }
            
                const temp = oSelected.getBindingContext().getObject();
            
                // Show confirmation dialog before unassigning
                sap.m.MessageBox.confirm(
                    "Are you sure you want to unassign the vehicle?",
                    {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL],
                        onClose: async (oAction) => {
                            if (oAction === sap.m.MessageBox.Action.YES) {
                                temp.Available = "Available";
                                const currentDate = new Date();
            
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
                                        Available: temp.Available
                                    };
                                    await this.getView().getModel("ModelV2").update("/Parkingslots('" + temp.parkingslot.slotno + "')", updatedParkingLot);
            
                                    // Refresh the assigned slots table
                                    const oAssignedSlotsTable = this.getView().byId("assignedSlotsTable");
                                    oAssignedSlotsTable.getBinding("items").refresh();
            
                                    // Refresh the all slots table
                                    this.updateAllSlotsTable();
            
                                    // Refresh the parking lot select dropdown
                                    this.updateParkingLotSelect();
            
                                    // Refresh the history table toolbar
                                    this.getView().byId("historyTable").getBinding("items").refresh();
                                    
                                    sap.m.MessageToast.show("Unassigned successfully.");
                                    setTimeout(() => {
                                        this.updateTableCount(); // Update the count after the table refresh
                                    }, 1000); 
                                   
                                } catch (error) {
                                    console.error("Error:", error);
                                    sap.m.MessageToast.show("Failed to unassign vehicle: " + error.message);
                                }
                            }
                        }
                    }
                );
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
                var oAllSlotsTable = this.byId("allSlotsTable");
                var oModel = this.getView().getModel("ModelV2");
                oAllSlotsTable.setModel(oModel);
                oAllSlotsTable.bindItems({
                    path: "/Parkingslots",
                    template: this.byId("allSlotscolumnListItem")
                });
            },
            // updateParkingLotSelect: function () {
            //     var oSelect = this.getView().byId("parkingLotSelect");
            //     if (oSelect) {
            //         var oBinding = oSelect.getBinding("items");
            //         if (oBinding) {
            //             oBinding.refresh();
            //         }
            //     }
            // },
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

            OnClickHandler: function (oEvent) {
                var oSelectedData = oEvent.getParameter("data")[0];
                var oContext = oSelectedData.data;
                var sSelectedSegment = oContext.Available;
                var sSelectedName = oContext.Available; // Adjust according to the actual property

                // If sSelectedName is undefined or not found, use a default value
                if (!sSelectedName) {
                    sSelectedName = "Unknown Segment";
                }

                // Get the chart and its position
                var oChart = this.byId("idpiechart");
                var oChartDomRef = oChart.getDomRef();

                // Extract the data for the selected segment
                var oModel = this.getView().getModel("ParkingLotModel");
                var aItems = oModel.getProperty("/Items");
                var oSelectedItem = aItems.find(item => item.Name === sSelectedSegment);
                var iCount = oSelectedItem ? oSelectedItem.Count : 0;

                // Create the popover if it doesn't already exist
                if (!this._oPopover) {
                    this._oPopover = new sap.m.Popover({
                        title: "Slot Details",
                        contentWidth: "150px",
                        contentHeight: "50px",
                        content: [
                            // new sap.m.Text({ text: `Segment: ${sSelectedName}`}),
                            // new sap.m.Text({ text: `Slots: ${iCount}`}),

                            new Text({ text: `Segment: ${sSelectedName}` }),
                            new Text({ text: `Slots: ${iCount}` }),
                        ],
                        placement: sap.m.PlacementType.VerticalPreferredBottom
                    });
                    this.getView().addDependent(this._oPopover);
                } else {
                    this._oPopover.getContent()[0].setText(`Segment: ${sSelectedName}`);
                    this._oPopover.getContent()[1].setText(`Slots: ${iCount}`);
                }

                // Calculate the position to place the popover near the selected segment
                var oSelectedSegmentCoordinates = oEvent.getParameter("data")[0].data;
                var iOffsetLeft = oChartDomRef.offsetLeft;
                var iOffsetTop = oChartDomRef.offsetTop;
                var iSegmentLeft = oSelectedSegmentCoordinates.left || 0;
                var iSegmentTop = oSelectedSegmentCoordinates.top || 0;

                // Open the popover at the calculated position
                this._oPopover.openBy(oChart);
                this._oPopover.setOffsetX(iSegmentLeft - iOffsetLeft);
                this._oPopover.setOffsetY(iSegmentTop - iOffsetTop);
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

            // onSaveAdd: function () {
            //     // Get input value and convert to uppercase
            //     var sSlotNo = this.byId("inputAddSlotno").getValue().toUpperCase();

            //     // Validate input
            //     if (!sSlotNo) {
            //         MessageToast.show("Please fill all mandatory fields.");
            //         return;
            //     }

            //     var slotNoRegex = /^PS\d{3}$/;
            //     if (!slotNoRegex.test(sSlotNo)) {
            //         MessageToast.show("Slot number must start with 'PS' followed by three digits (e.g., PS123).");
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

           
           
            // onSaveAdd: function () {
            //     var oModel = this.getView().getModel("ModelV2");
            //     var sNewSlotsCount = this.byId("inputAddSlotno").getValue();
            //     var iNewSlotsCount = parseInt(sNewSlotsCount, 10);

            //     if (isNaN(iNewSlotsCount) || iNewSlotsCount < 1 || iNewSlotsCount > 200) {
            //         sap.m.MessageToast.show("Please enter a valid number between 1 and 200.");
            //         return;
            //     }

            //     var that = this;

            //     // Fetch existing slots from the OData service
            //     oModel.read("/Parkingslots", {
            //         success: function (oData) {
            //             var aSlots = oData.results;
            //             var iMaxSlotNo = 0;

            //             // Find the highest existing slot number
            //             aSlots.forEach(function (slot) {
            //                 var iSlotNo = parseInt(slot.slotno.replace("PS", ""), 10);
            //                 if (iSlotNo > iMaxSlotNo) {
            //                     iMaxSlotNo = iSlotNo;
            //                 }
            //             });

            //             // Check if adding new slots exceeds PS200
            //             if (iMaxSlotNo + iNewSlotsCount > 200) {
            //                 sap.m.MessageToast.show("Cannot add slots. The maximum slot number 'PS200' would be exceeded.");
            //                 return;
            //             }

            //             // Generate new slots
            //             var aNewSlots = [];
            //             for (var i = 1; i <= iNewSlotsCount; i++) {
            //                 var sNewSlotNo = "PS" + String(iMaxSlotNo + i).padStart(3, '0');
            //                 aNewSlots.push({
            //                     slotno: sNewSlotNo,
            //                     Available: "Available" // or any default value you prefer
            //                 });
            //             }

            //             // Confirmation dialog before creating slots
            //             sap.m.MessageBox.confirm(
            //                 "Are you sure you want to add " + iNewSlotsCount + " new slots?",
            //                 {
            //                     actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
            //                     onClose: function (oAction) {
            //                         if (oAction === sap.m.MessageBox.Action.YES) {
            //                             // Create new entries 
            //                             var iCreatedSlots = 0;
            //                             aNewSlots.forEach(function (slot) {
            //                                 oModel.create("/Parkingslots", slot, {
            //                                     success: function () {
            //                                         iCreatedSlots++;
            //                                         sap.m.MessageToast.show("New slots added successfully Up to " + slot.slotno + ".");
            //                                         // Check if all slots are created
            //                                         if (iCreatedSlots === aNewSlots.length) {
            //                                             that.updateAllSlotsTable(); // Refresh the table
            //                                             that.updateParkingLotSelect();//Refresh the Slot details in Parkinglot allocation
                                                        
            //                                         }
            //                                     },
            //                                     error: function () {
            //                                         sap.m.MessageToast.show("Error adding slot " + slot.slotno);
            //                                     }
            //                                 });
            //                             });

            //                             // Close the dialog after creating the slots
            //                             that.byId("AddDialog").close();
            //                             that.byId("inputAddSlotno").setValue("");
            //                         }
            //                     }
            //                 }
            //             );
            //         },
            //         error: function () {
            //             sap.m.MessageToast.show("Error fetching existing slots.");
            //         }
            //     });
            // },


            // onCancelAdd: function () {
            //     this.byId("AddDialog").close();
            //     this.byId("inputAddSlotno").setValue("");
            // },

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
                var oModel = this.getView().getModel("ModelV2");
                var sNewSlotsCount = this.byId("inputAddSlotno").getValue();
                var iNewSlotsCount = parseInt(sNewSlotsCount, 10);
                var bInboundSelected = this.byId("inboundCheckBox").getSelected();
                var bOutboundSelected = this.byId("outboundCheckBox").getSelected();
            
                if (isNaN(iNewSlotsCount) || iNewSlotsCount < 1 || iNewSlotsCount > 200) {
                    sap.m.MessageToast.show("Please enter a valid number between 1 and 200.");
                    return;
                }
            
                if (!bInboundSelected && !bOutboundSelected) {
                    sap.m.MessageToast.show("Please select Inbound or Outbound.");
                    return;
                }
            
                if (bInboundSelected && bOutboundSelected) {
                    sap.m.MessageToast.show("Please select only one slot type.");
                    return;
                }
            
                var that = this;
            
                // Fetch existing slots from the OData service
                oModel.read("/Parkingslots", {
                    success: function (oData) {
                        var aSlots = oData.results;
                        var iMaxInboundSlotNo = 0;
                        var iMaxOutboundSlotNo = 0;
                        var iInboundCount = 0;
                        var iOutboundCount = 0;
            
                        // Find the highest existing slot number and count for each type
                        aSlots.forEach(function (slot) {
                            if (slot.type === "Inbound") {
                                var iSlotNo = parseInt(slot.slotno.replace("PSIN", ""), 10);
                                if (iSlotNo > iMaxInboundSlotNo) {
                                    iMaxInboundSlotNo = iSlotNo;
                                }
                                iInboundCount++;
                            } else if (slot.type === "Outbound") {
                                var iSlotNo = parseInt(slot.slotno.replace("PSOUT", ""), 10);
                                if (iSlotNo > iMaxOutboundSlotNo) {
                                    iMaxOutboundSlotNo = iSlotNo;
                                }
                                iOutboundCount++;
                            }
                        });
            
                        // Check if adding new slots exceeds the limits
                        if (bInboundSelected && (iInboundCount + iNewSlotsCount > 150)) {
                            sap.m.MessageBox.warning("Cannot add slots. The maximum 'Inbound' slot number 'PSI150' would be exceeded.");
                            return;
                        }
            
                        if (bOutboundSelected && (iOutboundCount + iNewSlotsCount > 50)) {
                            sap.m.MessageBox.warning("Cannot add slots. The maximum 'Outbound' slot number 'PSO50' would be exceeded.");
                            return;
                        }
            
                        // Generate new slots based on the selected type
                        var aNewSlots = [];
                        var sSlotTypeText = bInboundSelected ? "inbound" : "outbound";
                        var sSlotPrefix = bInboundSelected ? "PSIN" : "PSOUT";
                        var iMaxSlotNo = bInboundSelected ? iMaxInboundSlotNo : iMaxOutboundSlotNo;
            
                        for (var i = 1; i <= iNewSlotsCount; i++) {
                            var sNewSlotNo = sSlotPrefix + String(iMaxSlotNo + i).padStart(3, '0');
                            aNewSlots.push({
                                slotno: sNewSlotNo,
                                type: sSlotTypeText.charAt(0).toUpperCase() + sSlotTypeText.slice(1),
                                Available: "Available" // or any default value you prefer
                            });
                        }
            
                        // Confirmation dialog before creating slots
                        sap.m.MessageBox.confirm(
                            "Are you sure you want to add " + iNewSlotsCount + " new " + sSlotTypeText + " slots?",
                            {
                                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                                onClose: function (oAction) {
                                    if (oAction === sap.m.MessageBox.Action.YES) {
                                        // Create new entries 
                                        var iCreatedSlots = 0;
                                        aNewSlots.forEach(function (slot) {
                                            oModel.create("/Parkingslots", slot, {
                                                success: function () {
                                                    iCreatedSlots++;
                                                    // Check if all slots are created
                                                    if (iCreatedSlots === aNewSlots.length) {
                                                        sap.m.MessageToast.show("New " + sSlotTypeText + " slots added successfully up to " + slot.slotno + ".");
                                                        that.updateAllSlotsTable(); // Refresh the table
                                                        that.updateParkingLotSelect(); // Refresh the Slot details in Parkinglot allocation
                                                    }
                                                },
                                                error: function () {
                                                    sap.m.MessageToast.show("Error adding slot " + slot.slotno);
                                                }
                                            });
                                        });
            
                                        // Close the dialog after creating the slots
                                        that.byId("AddDialog").close();
                                        that.byId("inputAddSlotno").setValue("");
                                        that.byId("inboundCheckBox").setSelected(false);
                                        that.byId("outboundCheckBox").setSelected(false);
                                    }
                                }
                            }
                        );
                    },
                    error: function () {
                        sap.m.MessageToast.show("Error fetching existing slots.");
                    }
                });
            },
            
            onCancelAdd: function () {
                this.byId("AddDialog").close();
                this.byId("inputAddSlotno").setValue("");
                this.byId("inboundCheckBox").setSelected(false);
                this.byId("outboundCheckBox").setSelected(false);
            },
            
            


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
                                if (oVBoxItem.isA("sap.m.ComboBox")) {
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
                                } else if (oVBoxItem.isA("sap.m.Input") || oVBoxItem.isA("sap.m.ComboBox")) {
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
                            } else if (oVBoxItem.isA("sap.m.Input") || oVBoxItem.isA("sap.m.ComboBox")) {
                                if (oVBoxItem.isA("sap.m.Input")) {
                                    oVBoxItem.setValue(aOriginalCellValues[iItemIndex]);
                                } else if (oVBoxItem.isA("sap.m.ComboBox")) {
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

            //     // Check if exactly one item is selected
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

            //         // Regular expressions for validation
            //         var vehicleNumberPattern = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;
            //         var phoneNumberPattern = /^\d{10}$/;

            //         // To get the selected parking lot number from the Select element
            //         var oCells = oSelected.getCells();
            //         var oSelect = oCells[5].getItems()[1]; // Assuming the Select is in the second VBox of the sixth cell
            //         var sSlotNumber = oSelect.getSelectedKey();

            //         // Validate if any field is empty
            //         if (!sVehicle || !sDriverName || !sDriverMobile) {
            //             MessageToast.show("Please fill all mandatory fields.");
            //             return;
            //         }

            //         // Validate the vehicle number format
            //         if (!vehicleNumberPattern.test(sVehicle)) {
            //             MessageToast.show("Vehicle number must be in the format XXNNXXNNNN where X are letters and N are numbers. Example: AB01CD1234");
            //             return;
            //         }

            //         // Validate the phone number
            //         if (!phoneNumberPattern.test(sDriverMobile)) {
            //             MessageToast.show("Phone number must be exactly 10 digits.");
            //             return;
            //         }

            //         // Validate the driver name (assuming it must be at least 2 characters long)
            //         if (sDriverName.length < 2) {
            //             MessageToast.show("Driver name must be at least 2 characters long.");
            //             return;
            //         }

            //         // Create a record
            //         const oNewUpdate = {
            //             driverName: sDriverName,
            //             phoneNo: sDriverMobile,
            //             vehicleNo: sVehicle,
            //             truckType: sTypeofDelivery,
            //             assigntime: new Date(),
            //             ID: dID,
            //             parkingslot: {
            //                 slotno: sSlotNumber || sOldSlotNumber // Use the old slot number if no new slot is selected
            //             }
            //         };

            //         var oDataModel = this.getOwnerComponent().getModel("ModelV2"); // Assuming this is your OData V2 model

            //         try {
            //             // Update Parkinglotassigndetails
            //             oDataModel.update("/Parkinglotassigndetails(" + oNewUpdate.ID + ")", oNewUpdate, {
            //                 success: function () {
            //                     this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
            //                     this.updateParkingLotSelect(); // Refresh the parkingLotSelect dropdown

            //                     if (sSlotNumber && sSlotNumber !== sOldSlotNumber) {
            //                         sap.m.MessageBox.success("Slot details updated successfully");
            //                     } else {
            //                         sap.m.MessageBox.success("Details updated successfully");
            //                     }

            //                     this._revertUIChanges(oSelected);
            //                 }.bind(this),
            //                 error: function (oError) {
            //                     sap.m.MessageBox.error("Failed to update slot: " + oError.message);
            //                 }.bind(this)
            //             });

            //             // Update the selected parking slot to "Occupied" if it's changed
            //             if (sSlotNumber && sSlotNumber !== sOldSlotNumber) {
            //                 const updatedParkingLot = {
            //                     Available: "Occupied"
            //                 };
            //                 oDataModel.update("/Parkingslots('" + sSlotNumber + "')", updatedParkingLot, {
            //                     success: function () {
            //                         this.getView().byId("allSlotsTable").getBinding("items").refresh();
            //                     }.bind(this),
            //                     error: function (oError) {
            //                         sap.m.MessageBox.error("Failed to update: " + oError.message);
            //                     }.bind(this)
            //                 });

            //                 // Update the old parking slot to "Available"
            //                 const updatedParkingLotNumber = {
            //                     Available: "Available"
            //                 };
            //                 oDataModel.update("/Parkingslots('" + sOldSlotNumber + "')", updatedParkingLotNumber, {
            //                     success: function () {
            //                         this.getView().byId("allSlotsTable").getBinding("items").refresh();
            //                     }.bind(this),
            //                     error: function (oError) {
            //                         sap.m.MessageBox.error("Failed to update: " + oError.message);
            //                     }.bind(this)
            //                 });
            //             }
            //         } catch (error) {
            //             sap.m.MessageBox.error("Some technical Issue");
            //         }
            //     }
            // },
            getTruckTypeForSlot: function (sSlotNumber, oDataModel, successCallback, errorCallback) {
                oDataModel.read("/Parkingslots('" + sSlotNumber + "')", {
                    success: function (oData) {
                        if (successCallback) {
                            successCallback(oData.type); // Assuming 'type' is the field for truckType
                        }
                    },
                    error: function (oError) {
                        if (errorCallback) {
                            errorCallback(oError);
                        }
                    }
                });
            },
            onSaveEdit: function () {
                var oView = this.getView();
                var oTable = this.byId("assignedSlotsTable");
                var aSelectedItems = oTable.getSelectedItems();
            
                // Check if exactly one item is selected
                if (aSelectedItems.length !== 1) {
                    MessageToast.show("Please select exactly one row to save.");
                    return;
                }
            
                var oSelected = aSelectedItems[0];
                if (oSelected) {
                    var oContext = oSelected.getBindingContext().getObject();
                    var sVehicle = oContext.vehicleNo;
                    var sDriverName = oContext.driverName;
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
                    if (!sVehicle || !sDriverName || !sDriverMobile) {
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
            
                    // Get truckType based on new slot number
                    var oDataModel = this.getOwnerComponent().getModel("ModelV2"); // Assuming this is your OData V2 model
            
                    this.getTruckTypeForSlot(sSlotNumber, oDataModel, function (sTruckType) {
                        // Create a record
                        const oNewUpdate = {
                            driverName: sDriverName,
                            phoneNo: sDriverMobile,
                            vehicleNo: sVehicle,
                            truckType: sTruckType, // Use the truckType fetched from the new slot
                            assigntime: new Date(),
                            ID: dID,
                            parkingslot: {
                                slotno: sSlotNumber || sOldSlotNumber // Use the old slot number if no new slot is selected
                            }
                        };
            
                        try {
                            // Update Parkinglotassigndetails
                            oDataModel.update("/Parkinglotassigndetails(" + oNewUpdate.ID + ")", oNewUpdate, {
                                success: function () {
                                    this.getView().byId("assignedSlotsTable").getBinding("items").refresh();
                                    this.updateParkingLotSelect(); // Refresh the parkingLotSelect dropdown
            
                                    if (sSlotNumber && sSlotNumber !== sOldSlotNumber) {
                                        sap.m.MessageBox.success("Slot details updated successfully");
                                    } else {
                                        sap.m.MessageBox.success("Details updated successfully");
                                    }
            
                                    this._revertUIChanges(oSelected);
                                }.bind(this),
                                error: function (oError) {
                                    sap.m.MessageBox.error("Failed to update slot: " + oError.message);
                                }.bind(this)
                            });
            
                            // Update the selected parking slot to "Occupied" if it's changed
                            if (sSlotNumber && sSlotNumber !== sOldSlotNumber) {
                                const updatedParkingLot = {
                                    Available: "Occupied"
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
                                    Available: "Available"
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
                        } catch (error) {
                            sap.m.MessageBox.error("Some technical Issue");
                        }
                    }.bind(this), function (oError) {
                        MessageToast.show("Failed to fetch truck type for the new slot.");
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
                            new Filter("Available", FilterOperator.Contains, sQuery),
                            new Filter("type", FilterOperator.Contains, sQuery)
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
                            new Filter("parkingslots/slotno", FilterOperator.Contains, sQuery),
                            new Filter("assignedDate", FilterOperator.EQ, this.convertQueryToDate(sQuery)),
                            new Filter("unassignedDate", FilterOperator.EQ, this.convertQueryToDate(sQuery))
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
                else if (sSearchFieldId.includes("SearchField5")) {
                    oTable = this.byId("reservedTable");
                    if (sQuery) {
                        var aStringFilters = [
                            new Filter("R1Vehicleno", FilterOperator.Contains, sQuery),
                            new Filter("R1VenderName", FilterOperator.Contains, sQuery),
                            new Filter("R1VenderMobileNo", FilterOperator.Contains, sQuery),
                            new Filter("R1DriverName", FilterOperator.Contains, sQuery),
                            new Filter("R1DriverMobileNo", FilterOperator.Contains, sQuery),
                            new Filter("R1VehicleType", FilterOperator.Contains, sQuery),
                            new Filter("R1slotno/slotno", FilterOperator.Contains, sQuery),
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
            // Function to convert string query to Date format
            convertQueryToDate: function (sQuery) {
                var date = new Date(sQuery);
                return isNaN(date.getTime()) ? null : date.toISOString();
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
            createColumnConfigAssign: function () {
                return [
                    { label: 'Vehicle NO ', property: 'vehicleNo', type: EdmType.String, scale: 0 },
                    { label: 'Driver name', property: 'driverName', type: EdmType.String },
                    { label: 'Phone no', property: 'phoneNo', type: EdmType.String },
                    { label: 'Type (Inward / Outward)', property: 'truckType', type: EdmType.String },
                    { label: 'Assign Date & Time', property: 'assigntime', type: EdmType.Date, scale: 0 },
                    { label: 'Slot no ', property: 'parkingslot/slotno', type: EdmType.String },
                ];
            },
            onExport: function () {
                var aCols, oBinding, oSettings, oSheet, oTable;

                oTable = this.byId('assignedSlotsTable');
                oBinding = oTable.getBinding('items');
                aCols = this.createColumnConfigAssign();

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
                    { label: 'Slot no', property: 'parkingslots/slotno', type: EdmType.String },
                    { label: 'Type (Inward / Outward)', property: 'vehicalType', type: EdmType.String },
                    { label: 'Vehicle NO', property: 'vehicalNo', type: EdmType.String, scale: 0 },
                    { label: 'Driver name', property: 'driverName', type: EdmType.String },
                    { label: 'Phone no', property: 'phone', type: EdmType.String },
                    { label: 'Assign Date & Time', property: 'assignedDateFormatted', type: EdmType.String },
                    { label: 'UnAssign Date & Time', property: 'unassignedDateFormatted', type: EdmType.String }
                ];
            },

            formatDate: function (date) {
                if (!date) return "";
                var options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true };
                return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
            },

            onHistoryExport: function () {
                var aCols, oBinding, oSettings, oSheet, oTable, aData = [];

                oTable = this.byId('historyTable');
                oBinding = oTable.getBinding('items');
                aCols = this.createColumnConfig();

                oBinding.getContexts().forEach(function (oContext) {
                    var oData = oContext.getObject();
                    oData.assignedDateFormatted = this.formatDate(oData.assignedDate);
                    oData.unassignedDateFormatted = this.formatDate(oData.unassignedDate);
                    aData.push(oData);
                }, this);

                oSettings = {
                    workbook: {
                        columns: aCols,
                    },
                    dataSource: aData,
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


            onPressPdf: function () {
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


            onPressAccept: async function () {
                debugger
                var oTable = this.byId("reservationsTable");
                var oSelected = oTable.getSelectedItem();
                if (!oSelected) {
                    sap.m.MessageToast.show("Please select a reservation.");
                    return;
                }

                var oContext = oSelected.getBindingContext().getObject(),
                    vendername = oContext.RVenderName,
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
                    var oModel = this.getView().getModel("ModelV2");
                    await oModel.update(`/Parkingslots('${oSlotno}')`, { Available: "Reserved" });

                    await oModel.create('/Reservered', newReservation);

                    sap.m.MessageToast.show("Reservation accepted and slot updated successfully.");
                    this.refreshSlotDetails();
                    oSelected.getBindingContext().delete("$auto").then(function () {
                        this.updateAllSlotsTable();
                        this.updateParkingLotSelect();
                        this._refreshParkingLotSelect();

                        this.getView().byId("reservedTable").getBinding("items").refresh(); // Refresh parking lot select
                    }.bind(this));
                } catch (error) {
                    console.error("Error during the reservation process", error);
                }
            },

            onReserveAssign: async function () {
                // Get the reserved table and the selected items
                var oTable = this.byId("reservedTable");
                var oSelected = oTable.getSelectedItems();

                if (oSelected.length === 0) {
                    sap.m.MessageToast.show("Please select at least one reservation.");
                    return;
                }

                // Assume we're working with the first selected item
                var oSelectedItem = oSelected[0].getBindingContext().getObject();
                var oBindingContext = oSelected[0].getBindingContext();

                // Get the slot number from the selected item
                var oSlotno = oSelectedItem.R1slotno.slotno;

                // Prepare the data for Parkinglotassigndetails entity
                var assignTime = new Date().toISOString(); // Get the current time in ISO format
                var assignmentData = {
                    vehicleNo: oSelectedItem.R1Vehicleno,
                    driverName: oSelectedItem.R1DriverName,
                    phoneNo: oSelectedItem.R1DriverMobileNo,
                    truckType: oSelectedItem.R1VehicleType,
                    assigntime: assignTime,
                    parkingslot: {
                        slotno: oSlotno
                    }
                };

                try {
                    // Get the OData model
                    var oModel = this.getView().getModel("ModelV2");

                    // Update the Parkinglotassigndetails entity with the assignment data
                    await oModel.create('/Parkinglotassigndetails', assignmentData);

                    // Update the Parkingslots entity to set the slot as Occupied
                    await oModel.update(`/Parkingslots('${oSlotno}')`, { Available: "Occupied" });
                    this.updateAllSlotsTable();
                    this._refreshParkingLotSelect();
                    this.updateParkingLotSelect();

                    // Refresh the tables to show updated data
                    this.getView().byId("assignedSlotsTable").getBinding("items").refresh();

                    sap.m.MessageToast.show("Slot assigned successfully and status updated.");

                    // Delete the selected record from the reserved table
                    oBindingContext.delete("$auto").then(function () {
                        this.getView().byId("reservedTable").getBinding("items").refresh();
                    }.bind(this));

                } catch (error) {
                    console.error("Error during the assignment process", error);
                    sap.m.MessageBox.error("An error occurred while assigning the slot. Please try again.");
                }
            },
            // onScanSuccess: function (oEvent) {
            //     var sBarcodeValue = oEvent.getParameter("text");
            //     this._filterTableByBarcode(sBarcodeValue);
            // },
            
            // onScanError: function (oEvent) {
            //     var sError = oEvent.getParameter("message");
            //     sap.m.MessageToast.show("Scan failed: " + sError);
            // },
            
            // onScanLiveupdate: function (oEvent) {
            //     var sBarcodeValue = oEvent.getParameter("value");
            //     // Optional: Perform live updates or other actions while scanning
            // },
            
            // _filterTableByBarcode: function (sBarcodeValue) {
            //     var oTable = this.byId('assignedSlotsTable');
            //     var oBinding = oTable.getBinding('items');
            //     var aFilters = [];
            
            //     if (sBarcodeValue) {
            //         aFilters.push(new sap.ui.model.Filter('barcodeField', sap.ui.model.FilterOperator.Contains, sBarcodeValue));
            //     }
            
            //     oBinding.filter(aFilters);
            // },
            onScanSuccess: function (oEvent) {
                var sVehicleNo = oEvent.getParameter("text"); // Get the scanned vehicle number
                var oModel = this.getView().getModel("ModelV2"); // Get the OData model
            
                // Filter the Parkinglotassigndetails based on the scanned vehicle number
                var aFilters = [
                    new sap.ui.model.Filter("vehicleNo", sap.ui.model.FilterOperator.EQ, sVehicleNo)
                ];
            
                oModel.read("/Parkinglotassigndetails", {
                    filters: aFilters,
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            var oSelectedData = oData.results[0];
                            // Pass the fetched details to the dialog and open it
                            this._openDialog(oSelectedData);
                        } else {
                            sap.m.MessageToast.show("No matching record found for the scanned vehicle number.");
                        }
                    }.bind(this),
                    error: function () {
                        sap.m.MessageToast.show("Error fetching data for the scanned vehicle number.");
                    }
                });
            },
            
            _openDialog: function (oData) {
                // Get the reference to the dialog defined in the view
                var oDialog = this.byId("editDetailsDialog");
            
                // Populate the dialog fields with the data
                this.byId("vehicleNoText").setText(oData.vehicleNo);
                this.byId("driverNameText").setText(oData.driverName);
                this.byId("phoneNoText").setText(oData.phoneNo);
                this.byId("truckTypeText").setText(oData.truckType);
                this.byId("assignTimeText").setText(oData.assigntime);
                this.byId("slotNoText").setText(oData.parkingslot_slotno);
            
                // Open the dialog
                oDialog.open();
            },
            
            onCloseDialog: function () {
                var oDialog = this.byId("editDetailsDialog");
                oDialog.close();
            },
            onQRUnAssign: function () {
                const oView = this.getView();
                const oModel = this.getView().getModel("ModelV2");
            
                // Get the vehicle number from the dialog
                const sVehicleNo = this.byId("vehicleNoText").getText();
                if (!sVehicleNo) {
                    sap.m.MessageToast.show("No vehicle number found.");
                    return;
                }
            
                // Get the current date and time
                const currentDate = new Date();
                const formattedUnassignTime = this.formatDateToEdmDateTimeOffset(currentDate);
            
                // Prepare data for updating the ParkingHistory
                const oHistoryPayload = {
                    driverName: this.byId("driverNameText").getText(),
                    phoneNo: this.byId("phoneNoText").getText(),
                    vehicalNo: sVehicleNo,
                    vehicalType: this.byId("truckTypeText").getText(),
                    assignedDate: this.byId("assignTimeText").getText(),
                    unassignedDate: formattedUnassignTime,
                    parkingslots: {
                        slotno: this.byId("slotNoText").getText()
                    }
                };
            
                // Create the history record
                this.createData(oModel, oHistoryPayload, "/ParkingHistory");
            
                // Fetch the entry to find the cuid (ID) from AssignedLots
                oModel.read("/Parkinglotassigndetails", {
                    filters: [new sap.ui.model.Filter("vehicleNo", sap.ui.model.FilterOperator.EQ, sVehicleNo)],
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            const sCuid = oData.results[0].ID; // Assuming 'ID' is the cuid field
            
                            // Remove the vehicle entry from Parkinglotassigndetails
                            const sPath = "/Parkinglotassigndetails(" + sCuid + ")";
                            oModel.remove(sPath, {
                                success: function () {
                                    sap.m.MessageToast.show("Vehicle unassigned successfully");
            
                                    // Refresh the tables
                                    oView.byId("assignedSlotsTable").getBinding("items").refresh();
                                    oView.byId("historyTable").getBinding("items").refresh();
            
                                    // Update the Parking Slots status
                                    const sSlotNumber = this.byId("slotNoText").getText();
                                    const oUpdatedSlotPayload = {
                                        Available: "Available"
                                    };
                                    oModel.update("/Parkingslots('" + sSlotNumber + "')", oUpdatedSlotPayload, {
                                        success: function () {
                                            oView.byId("parkingLotSelect").getBinding("items").refresh();
                                            this.updateTableCount(); // Update the count after the table refresh
                                        }.bind(this),
                                        error: function (oError) {
                                            sap.m.MessageBox.error("Failed to update parking slot status: " + oError.message);
                                        }.bind(this)
                                    });
            
                                    // Close the dialog
                                    this.byId("editDetailsDialog").close();
                                }.bind(this),
                                error: function (oError) {
                                    sap.m.MessageBox.error("Failed to remove vehicle from assigned slots: " + oError.message);
                                }.bind(this)
                            });
                        } else {
                            sap.m.MessageToast.show("No entry found for the given vehicle number");
                        }
                    }.bind(this),
                    error: function (oError) {
                        sap.m.MessageBox.error("Error fetching entry: " + oError.message);
                    }
                });
            },
            
            // Add the formatDateToEdmDateTimeOffset function
            formatDateToEdmDateTimeOffset: function (date) {
                if (!(date instanceof Date)) {
                    throw new Error("Invalid date object");
                }
                return date.toISOString(); // Formats date as ISO 8601 string
            }
            
                     
        });
    });
