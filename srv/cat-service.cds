using my.parkinglot as my from '../db/data-model';


service ParkingLotService {
    entity Parkingslots as projection on my.Parkingslots;
    entity Parkinglotassign as projection on my.Parkinglotassign;
    entity Parkinglot_UnAssign as projection on my.Parkinglot_UnAssign;
    entity ParkingHistory as projection on my.ParkingHistory;
}