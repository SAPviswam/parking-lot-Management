// sap.ui.define([
//     "sap/ui/core/mvc/Controller",
//     "sap/ui/model/json/JSONModel",
//     "sap/m/MessageToast",
// ],
// function (Controller, JSONModel, MessageToast) {
//     "use strict";
 
//     return Controller.extend("com.app.reservations.controller.Home", {
//         onInit: function () {
//            const Reservation = new JSONModel({
//             RVenderName : "",
//             RVenderMobileNo : "",
//             RDriverName : "",
//             RDriverMobileNo : "",
//             ReservationTime : "",
//             RVehicleno : "",
//             RVehicleType: "",
//            })
//            this.getView().setModel(Reservation,"Reservation")
//         },
 
//         onSubmit: function () {
//             debugger
//           var VName = this.getView().byId("VenderName").getValue();
//           var VNo = this.getView().byId("VenderNo").getValue();
//           var DName = this.getView().byId("DriverName").getValue();
//           var DNo = this.getView().byId("DriverNo").getValue();
//           var DT = this.getView().byId("Rdateandtime").getValue();
//           var VeNo = this.getView().byId("VehicleNo").getValue();
//           var VeT = this.getView().byId("VehicleType").getValue();
 
//           var oView = this.getView();
//           var bValid = true;
 
//         //   if (!VName || VName.length < 3) {
//         //     oView.byId("VenderName").setValueState("Error").setValueStateText("Vendor name must contain at least 3 characters");
//         //     bValid = false;
//         // } else {
//         //     oView.byId("VenderName").setValueState("None");
//         // }
 
//         if (!VNo || VNo.length !== 10 || !/^\d+$/.test(VNo)) {
//             oView.byId("VenderNo").setValueState("Error").setValueStateText("Vendor mobile number must be a 10-digit numeric value");
//             bValid = false;
//         } else {
//             oView.byId("VenderNo").setValueState("None");
//         }
 
//         // if (!DName || DName.length < 3) {
//         //     oView.byId("DriverName").setValueState("Error").setValueStateText("Driver name must contain at least 3 characters");
//         //     bValid = false;
//         // } else {
//         //     oView.byId("DriverName").setValueState("None");
//         // }
 
//         if (!DNo || DNo.length !== 10 || !/^\d+$/.test(DNo)) {
//             oView.byId("DriverNo").setValueState("Error").setValueStateText("Driver mobile number must be a 10-digit numeric value");
//             bValid = false;
//         } else {
//             oView.byId("DriverNo").setValueState("None");
//         }
 
//         // if (!DT) {
//         //     oView.byId("Rdateandtime").setValueState("Error").setValueStateText("Reservation time is required");
//         //     bValid = false;
//         // } else {
//         //     oView.byId("Rdateandtime").setValueState("None");
//         // }
        
//         if (!DT) {
//             oView.byId("Rdateandtime").setValueState("Error").setValueStateText("Reservation time is required");
//             bValid = false;
//         } else {
//             // Check if the selected date is in the past
//             var selectedDate = new Date(DT);
//             var currentDate = new Date();
//             currentDate.setHours(0, 0, 0, 0); // Set to midnight to compare dates only

//             if (selectedDate < currentDate) {
//                 oView.byId("Rdateandtime").setValueState("Error").setValueStateText("Please select a future date");
//                 MessageToast.show("Please select a future date")
//                 bValid = false;
//             } else {
//                 oView.byId("Rdateandtime").setValueState("None");
//             }
//         }

//         if (!VeNo || !/^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/.test(VeNo)) {
//             oView.byId("VehicleNo").setValueState("Error").setValueStateText("Vehicle number should follow this pattern: AP12CD1234");
//             bValid = false;
//         } else {
//             oView.byId("VehicleNo").setValueState("None");
//         }
 
//         if (!VeT) {
//             oView.byId("VehicleType").setValueState("Error").setValueStateText("Vehicle type is required");
//             bValid = false;
//         } else {
//             oView.byId("VehicleType").setValueState("None");
//         }
 
//         // if (!bValid) {
//         //     MessageToast.show("Please enter correct data");
//         //     return; // Prevent further execution if validation fails
//         // }
 
 
//           const NewReservation = {
//             RVenderName : VName,
//             RVenderMobileNo :VNo,
//             RDriverName : DName ,
//             RDriverMobileNo : DNo,
//             ReservationTime : DT,
//             RVehicleno : VeNo,
//             RVehicleType: VeT,
 
//           }
         
//           const NewReservation1 = {
//             NVenderName : VName,
//             NVenderMobileNo :VNo,
//             NDriverName : DName ,
//             NDriverMobileNo : DNo,
//             NRservationTime : DT,
//             NVehicleno : VeNo,
//             NVehicleType: VeT,
 
//           }
 
//           var model  = this.getView().getModel();
//           var Reservationmd = model.bindList("/Reservation").create(NewReservation);
//           var Notify = model.bindList("/Notification").create(NewReservation1);
//           if (Reservationmd){
//             oView.byId("VenderName").setValue("");
//                 oView.byId("VenderNo").setValue("");
//                 oView.byId("DriverName").setValue("");
//                 oView.byId("DriverNo").setValue("");
//                 oView.byId("Rdateandtime").setValue("");
//                 oView.byId("VehicleNo").setValue("");
//                 oView.byId("VehicleType").setValue("");
//                 model.refresh();
//           }
//         else{
 
//             MessageToast.show("Failed to create reservation: " + error.message);
//         }
//         }
//     });
// });
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
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
        },
 
        onSubmit: function () {
            var oView = this.getView();
            var bValid = true;

            // Assign input values to variables after validation
            var VName = this.getView().byId("VenderName").getValue();
            var VNo = this.getView().byId("VenderNo").getValue();
            var DName = this.getView().byId("DriverName").getValue();
            var DNo = this.getView().byId("DriverNo").getValue();
            var DT = this.getView().byId("Rdateandtime").getValue();
            var VeNo = this.getView().byId("VehicleNo").getValue();
            var VeT = this.getView().byId("VehicleType").getValue();



            // Validate Vehicle Number
            if (!VeNo || !/^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/.test(VeNo)) {
                oView.byId("VehicleNo").setValueState("Error").setValueStateText("Vehicle number should follow this pattern: AP12BG1234");
                bValid = false;
            } else {
                oView.byId("VehicleNo").setValueState("None");
            }

            // Validate Vendor Name
            if (!VName) {
                oView.byId("VenderName").setValueState("Error")
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
            // Validate Driver Mobile Number
            if (!DName) {
            oView.byId("DriverName").setValueState("Error");
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
                oView.byId("VehicleType").setValueState("Error").setValueStateText("Vehicle type is required");
                bValid = false;
            } else {
                oView.byId("VehicleType").setValueState("None");
            }

            // Validate Reservation Date
            if (!DT) {
                oView.byId("Rdateandtime").setValueState("Error").setValueStateText("Reservation time is required");
                bValid = false;
            } else {
                // Check if the selected date is in the past
                var selectedDate = new Date(DT);
                var currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0); // Set to midnight to compare dates only

                if (selectedDate < currentDate) {
                    oView.byId("Rdateandtime").setValueState("Error").setValueStateText("Please select a future date");
                    MessageBox.error("Please select a future date.");
                    bValid = false;
                    return;
                } else {
                    oView.byId("Rdateandtime").setValueState("None");
                }
            }

            // // Assign input values to variables after validation
            // var VName = oView.byId("VenderName").getValue();
            // var VNo = oView.byId("VenderNo").getValue();
            // var DName = oView.byId("DriverName").getValue();
            // var DNo = oView.byId("DriverNo").getValue();
            // var DT = oView.byId("Rdateandtime").getValue();
            // var VeNo = oView.byId("VehicleNo").getValue();
            // var VeT = oView.byId("VehicleType").getValue();

            // Check all mandtory fields.
            if (!bValid) {
                MessageToast.show("Please fill all mandatory fields correctly.");
                return; // Prevent further execution if validation fails
            }

            // Create New Reservation
            const NewReservation = {
                RVenderName: VName,
                RVenderMobileNo: VNo,
                RDriverName: DName,
                RDriverMobileNo: DNo,
                ReservationTime: DT,
                RVehicleno: VeNo,
                RVehicleType: VeT,
            };

            // Create Notification (if required)
            const NewReservation1 = {
                NVenderName: VName,
                NVenderMobileNo: VNo,
                NDriverName: DName,
                NDriverMobileNo: DNo,
                NRservationTime: DT,
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
                oView.byId("VehicleType").setValue("");
                model.refresh();
                MessageToast.show("Reservation request send successfully.");
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
            this.byId("VehicleType").setValue("");
        }
    });
});
