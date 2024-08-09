
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/format/DateFormat"
], function (Controller, JSONModel, MessageToast, MessageBox, DateFormat) {
    "use strict";
 
    return Controller.extend("com.app.reservations.controller.Home", {
        onInit: function () {
            const Reservation = new JSONModel({
                RVenderName : "",
                RVenderMobileNo : "",
                RDriverName : "",
                RDriverMobileNo : "",
                ReservationTime : "",
                RVehicleno : "",
                RVehicleType: "",
            });
            this.getView().setModel(Reservation, "Reservation");

            // Initialize the date picker to allow only the next two days excluding today
            this._initializeDatePicker();
        },


        _initializeDatePicker: function() {
            var oDatePicker = this.byId("Rdateandtime");
            var currentDate = new Date();
            var minDate = new Date();
            minDate.setDate(currentDate.getDate() + 1); // Tomorrow
            var maxDate = new Date();
            maxDate.setDate(currentDate.getDate() + 3); // Three days after tomorrow
            
            oDatePicker.setMinDate(minDate);
            oDatePicker.setMaxDate(maxDate);
            oDatePicker.attachChange(this._validateDate, this);
        },
        _validateDate: function(oEvent) {
            var oDatePicker = oEvent.getSource();
            var selectedDate = oDatePicker.getDateValue();
            var currentDate = new Date();
            var minDate = new Date();
            minDate.setDate(currentDate.getDate() + 1); 
            var maxDate = new Date();
            maxDate.setDate(currentDate.getDate() + 3); 
        
            if (selectedDate < minDate || selectedDate > maxDate) {
                oDatePicker.setValueState("Error").setValueStateText("Please select a date within the allowed range (next 3 days).");
            } else {
                oDatePicker.setValueState("None");
            }
        },        
        

        onSubmit: function () {
            var oView = this.getView();
            var bValid = true;
            
            // Assign input values to variables after validation
            var VName = this.getView().byId("VenderName").getValue();
            var VNo = this.getView().byId("VenderNo").getValue();
            var DName = this.getView().byId("DriverName").getValue();
            var DNo = this.getView().byId("DriverNo").getValue();
            var DT = this.getView().byId("Rdateandtime").getDateValue(); // Get Date object instead of string
            var VeNo = this.getView().byId("VehicleNo").getValue().toUpperCase();
            var VeT = this.getView().byId("trasportType").getSelectedKey();
            
            // Validate Vehicle Number
            if (!VeNo || !/^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/.test(VeNo)) {
                oView.byId("VehicleNo").setValueState("Error").setValueStateText("Vehicle number should follow this pattern: AP12BG1234");
                bValid = false;
            } else {
                oView.byId("VehicleNo").setValueState("None");
            }
            
            // Validate Vendor Name
            if (!VName) {
                oView.byId("VenderName").setValueState("Error").setValueStateText("Vendor Name is required");
                bValid = false;
            } else {
                oView.byId("VenderName").setValueState("None");
            }
            
            // Validate Vendor Mobile Number
            if (!VNo || VNo.length !== 10 || !/^\d+$/.test(VNo)) {
                oView.byId("VenderNo").setValueState("Error").setValueStateText("Vendor mobile number must be a 10-digit numeric value");
                bValid = false;
            } else {
                oView.byId("VenderNo").setValueState("None");
            }
            
            // Validate Driver Name
            if (!DName) {
                oView.byId("DriverName").setValueState("Error").setValueStateText("Driver Name is required");
                bValid = false;
            } else {
                oView.byId("DriverName").setValueState("None");
            }
            
            // Validate Driver Mobile Number
            if (!DNo || DNo.length !== 10 || !/^\d+$/.test(DNo)) {
                oView.byId("DriverNo").setValueState("Error").setValueStateText("Driver mobile number must be a 10-digit numeric value");
                bValid = false;
            } else {
                oView.byId("DriverNo").setValueState("None");
            }
            
            // Validate Vehicle Type
            if (!VeT) {
                oView.byId("trasportType").setValueState("Error").setValueStateText("Vehicle type is required");
                bValid = false;
            } else {
                oView.byId("trasportType").setValueState("None");
            }
            
            // Validate Reservation Date
            if (!DT) {
                oView.byId("Rdateandtime").setValueState("Error").setValueStateText("Reservation time is required");
                bValid = false;
            } else {
                // Check if the selected date is within the allowed range
                var currentDate = new Date();
                var minDate = new Date();
                minDate.setDate(currentDate.getDate() + 1); 
                var maxDate = new Date();
                maxDate.setDate(currentDate.getDate() + 3); 
                
                if (DT < minDate || DT > maxDate) {
                    oView.byId("Rdateandtime").setValueState("Error").setValueStateText("Please select a date within the allowed range (next 3 days).");
                    MessageBox.error("Please select a date within the allowed range (next 3 days).");
                    bValid = false;
                    return;
                } else {
                    oView.byId("Rdateandtime").setValueState("None");
                }
            }
            
            // Convert date to ISO 8601 format (only date part)
            var isoDate = DT.toISOString().split('T')[0]; // 'YYYY-MM-DD'
            
            // Format the date as DD-MM-YYYY
            var day = ("0" + DT.getDate()).slice(-2); // Add leading zero if needed
            var month = ("0" + (DT.getMonth() + 1)).slice(-2); // Add leading zero if needed
            var year = DT.getFullYear();
            var formattedDate = day + "-" + month + "-" + year; // 'DD-MM-YYYY'
            
            // Create New Reservation
            const NewReservation = {
                RVenderName: VName,
                RVenderMobileNo: VNo,
                RDriverName: DName,
                RDriverMobileNo: DNo,
                ReservationTime: isoDate, // Use ISO format for the server
                RVehicleno: VeNo,
                RVehicleType: VeT,
            };
            
            // Create Notification (if required)
            const NewReservation1 = {
                NVenderName: VName,
                NVenderMobileNo: VNo,
                NDriverName: DName,
                NDriverMobileNo: DNo,
                NRservationTime: isoDate, // Use ISO format for the server
                NVehicleno: VeNo,
                NVehicleType: VeT,
            };
            
            var model = this.getView().getModel();
            var Reservationmd = model.bindList("/Reservation").create(NewReservation);
            var Notify = model.bindList("/Notification").create(NewReservation1);
            
            if (Reservationmd) {
                oView.byId("VenderName").setValue("");
                oView.byId("VenderNo").setValue("");
                oView.byId("DriverName").setValue("");
                oView.byId("DriverNo").setValue("");
                oView.byId("Rdateandtime").setValue("");
                oView.byId("VehicleNo").setValue("");
                oView.byId("trasportType").setSelectedKey("");
                model.refresh();
                MessageToast.show("Reservation request sent successfully.");
                this.byId("idNotifications").refresh();
            } else {
                MessageToast.show("Failed to create reservation.");
            }
        },
        

        onCancelSubmit: function () {
            this.byId("VenderName").setValue("");
            this.byId("VenderNo").setValue("");
            this.byId("DriverName").setValue("");
            this.byId("DriverNo").setValue("");
            this.byId("Rdateandtime").setValue("");
            this.byId("VehicleNo").setValue("");
            this.byId("trasportType").setSelectedKey("");
        }
    });
});
