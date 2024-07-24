using my.parkinglot as my from '../db/data-model';


service ParkingLotService {
    entity Parkingslots as projection on my.Parkingslots;
    entity Parkinglotassigndetails as projection on my.Parkinglotassigndetails;
    entity ParkingHistory as projection on my.ParkingHistory;
    entity Reservation as projection on my.Reservation;
    entity Reservered as projection on my.Reservered;
    entity Notification as projection on my.Notification;
}