const mongoose = require('mongoose');

const TrainStopSchema = new mongoose.Schema({
    station_id: Number,
    arrival_time: String,
    departure_time: String,
    fare: Number
});

const TrainSchema = new mongoose.Schema({
    train_id: Number,
    train_name: String,
    capacity: Number,
    stops: [TrainStopSchema]
});

const Train = mongoose.model('Train', TrainSchema);

module.exports = Train;
