sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/Fragment"
    ],
    function(BaseController,Fragment) {
      "use strict";
  
      return BaseController.extend("com.app.parkinglotmanagement.controller.BaseController", {
        onInit: function() {
        },
        // createData: function(oModel, oPayload, sPath){
        //     return new Promise((resolve, reject) => {
        //         oModel.create(sPath, oPayload, {
        //             refreshAfterChange: true,
        //             success: function(oSuccessData){
        //                 resolve(oSuccessData);
        //             },
        //             error: function(oErrorData){
        //                 reject(oErrorData)
        //             }
        //         })
        //     })
            
        // },
        loadFragment: async function (sFragmentName) {
            const oFragment = await Fragment.load({
                id: this.getView().getId(),
                name: `com.app.parking-lot-management.fragment.${sFragmentName}`,
                controller: this
            });
            this.getView().addDependent(oFragment);
            return oFragment
        },

      });
    }
  );
  