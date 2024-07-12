using my.parkinglot as my from '../db/data-model';


service ParkingLotService {
    entity Parkingslots as projection on my.Parkingslots;
    entity Parkinglotassigndetails as projection on my.Parkinglotassigndetails;
    entity Reservation as projection on my.Reservation;
    entity ParkingHistory as projection on my.ParkingHistory;
}