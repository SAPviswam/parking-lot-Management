namespace my.parkinglot;


entity Parkingslots {
  key slotno                  : String @title: 'Parking Lot Number';
      type                    : String @title: 'Slot Type';
      Available               : Boolean;
      parkinglotassigndetails : Association to many Parkinglotassigndetails on parkinglotassigndetails.parkingslot = $self;
}


entity Parkinglotassigndetails {
  key vehicleNo    : String @title: 'Vehicle Number';
      driverName   : String @title: 'Driver Name';
      phoneNo      : String @title: 'Phone Number';
      truckType    : String @title: 'Truck Type'; // 'Inbound' or 'Outbound'
      assigntime   : DateTime @title: 'Assignment Time';
      unassigntime : DateTime @title: 'UnAssignment Time';
      parkingslot  : Association to Parkingslots;
}

entity Reservation {
  key ID           : UUID;
  key vehicalNo    : String;
      driverName   : String;
      phone        : Integer64;
      vehicalType  : String;
      date         : DateTime;
      parkingslots : Association to Parkingslots
}

entity ParkingHistory {
  key ID             : UUID;
      vehicalNo      : String;
      driverName     : String;
      phone          : String;
      vehicalType    : String;
      assignedDate   : DateTime;
      unassignedDate : DateTime;
      parkingslots   : Association to Parkingslots;
      parkinglotassigndetails : Association to Parkinglotassigndetails

}
