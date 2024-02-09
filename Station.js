const mongoose = require('mongoose');

const StationSchema = new mongoose.Schema({
    station_id: Number,
    station_name: String,
    longitude: Number,
    latitude: Number
});

const Station = mongoose.model('Station', StationSchema);

module.exports = Station;
