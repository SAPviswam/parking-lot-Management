namespace my.parkinglot;

using {managed} from '@sap/cds/common';


entity Parkingslots : managed {
  key ID               : UUID;
      slotno           : String @title: 'Parking Lot Number';
      type             : String @title: 'Slot Type';
      status           : String;
      parkinglotassign : Association to Parkinglotassign;
}


entity Parkinglotassign : managed {
  key ID          : UUID;
      vehicleNo   : String @title: 'Vehicle Number';
      driverName  : String @title: 'Driver Name';
      phoneNo     : String @title: 'Phone Number';
      truckType   : String @title: 'Truck Type'; // 'Inbound' or 'Outbound'
      time        : Time   @title: 'Assignment Time';
      status      : String @title: 'Status'; // 'Assigned' or 'Unassigned'
      parkingslot : Association to Parkingslots;
}


entity Parkinglot_UnAssign : managed {
  key ID               : UUID;
      status           : String @title: 'Status'; // 'Unassigned'
      time             : Time   @title: 'Unassignment Time';
      parkinglotassign : Association to Parkinglotassign;
}


entity ParkingHistory {
  key ID                 : UUID;
      parkingslot        : Association to Parkingslots;
      parkinglotassign   : Association to Parkinglotassign;
      parkinglotunassign : Association to Parkinglot_UnAssign;
      event              : String @title: 'Event Description';
}
