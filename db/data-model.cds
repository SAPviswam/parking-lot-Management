namespace my.parkinglot;

using {cuid} from '@sap/cds/common';

entity Parkingslots {
  key slotno                  : String @title: 'Parking Lot Number';
      type                    : String @title: 'Slot Type';
      Available               : String;
      parkinglotassigndetails : Association to many Parkinglotassigndetails
                                  on parkinglotassigndetails.parkingslot = $self;
}


entity Parkinglotassigndetails {
  key vehicleNo    : String   @title: 'Vehicle Number';
      driverName   : String   @title: 'Driver Name';
      phoneNo      : String   @title: 'Phone Number';
      truckType    : String   @title: 'Truck Type'; // 'Inbound' or 'Outbound'
      assigntime   : DateTime @title: 'Assignment Time';
      unassigntime : DateTime @title: 'UnAssignment Time';
      parkingslot  : Association to Parkingslots;
}


entity ParkingHistory {
  key ID                      : UUID;
      vehicalNo               : String;
      driverName              : String;
      phone                   : String;
      vehicalType             : String;
      assignedDate            : DateTime;
      unassignedDate          : DateTime;
      parkingslots            : Association to Parkingslots;
      parkinglotassigndetails : Association to Parkinglotassigndetails

}

entity Reservation : cuid {
  RVenderName     : String;
  RVenderMobileNo : String;
  RDriverName     : String;
  RDriverMobileNo : String;
  ReservationTime : String;
  RVehicleno      : String;
  RVehicleType    : String;

}

entity Reservered : cuid {
  R1VenderName     : String;
  R1VenderMobileNo : String;
  R1DriverName     : String;
  R1DriverMobileNo : String;
  ReservationTime1 : String;
  R1Vehicleno      : String;
  R1VehicleType    : String;
  R1slotno         : Association to Parkingslots;
}


entity Notification : cuid {
  NVenderName     : String;
  NVenderMobileNo : String;
  NDriverName     : String;
  NDriverMobileNo : String;
  NRservationTime : String;
  NVehicleno      : String;
  NVehicleType    : String;
}
