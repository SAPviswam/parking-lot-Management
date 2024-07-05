sap.ui.define(
    [
        "sap/ui/core/mvc/Controller"
    ],
    function(Controller) {
      "use strict";
  
      return Controller.extend("com.app.parkinglotmanagement.controller.slotdetails", {
        onInit: function () {
          const oRouter = this.getOwnerComponent().getRouter();
          oRouter.attachRoutePatternMatched(this.onSelectSlot, this); 
      },
      onSelectSlot: function(oEvent ){
        debugger;
          const {slotassign} = oEvent.getParameter("arguments");
          this.ID = slotassign;
          // const sRouterName = oEvent.getParameter("name");
          const oObjectPage = this.getView().byId("idslotsDetailsObject");
          oObjectPage.bindElement(`/Parkingslots(${slotassign})`, {
               expand: 'parkinglotassign'
          });
      }
      });
    }
  );
  