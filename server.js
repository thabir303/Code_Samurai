
const express = require('express');
const dotenv=require("dotenv").config();
const mongoose = require('mongoose');

const app=express();
app.use(express.json());

const port = process.env.PORT || 8000;

app.post('/api/users', async (req, res) => {
    try {
        const { user_id, user_name, balance } = req.body;

        // Create a new User instance
        const newUser = new User({
            user_id,
            user_name,
            balance
        });

        // Save the new user to the database
        await newUser.save();

        // Respond with the saved user data and status code 201
        res.status(201).json(newUser);
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).json({ error: 'Failed to add user' });
    }
});
app.post('/api/stations', async (req, res) => {
    try {
        const { station_id, station_name, longitude, latitude } = req.body;

        // Create a new Station instance
        const newStation = new Station({
            station_id,
            station_name,
            longitude,
            latitude
        });

        // Save the new station to the database
        await newStation.save();

        // Respond with the saved station data and status code 201
        res.status(201).json(newStation);
    } catch (err) {
        console.error('Error adding station:', err);
        res.status(500).json({ error: 'Failed to add station' });
    }
});
app.post('/api/trains', async (req, res) => {
    try {
        const { train_id, train_name, capacity, stops } = req.body;

        // Calculate service start and end times
        const service_start = stops[0].departure_time;
        const service_ends = stops[stops.length - 1].arrival_time;

        // Create a new Train instance
        const newTrain = new Train({
            train_id,
            train_name,
            capacity,
            stops
        });

        // Save the new train to the database
        await newTrain.save();

        // Respond with the saved train data and status code 201
        res.status(201).json({
            train_id,
            train_name,
            capacity,
            service_start,
            service_ends,
            num_stations: stops.length
        });
    } catch (err) {
        console.error('Error adding train:', err);
        res.status(500).json({ error: 'Failed to add train' });
    }
});


//////feature 1  : station
//list all station

app.get('/api/stations', async (req, res) => {
    try {
        // Find all stations and sort by station_id in ascending order
        const stations = await Station.find().sort({ station_id: 1 });

        // Return the list of stations in the response
        res.status(200).json({ stations });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});




////////list all trains at a given station

app.get('/api/stations/:station_id/trains', async (req, res) => {
    try {
        const { station_id } = req.params;

        // Find the station by station_id
        const station = await Station.findOne({ station_id });

        // If the station does not exist, return a 404 response
        if (!station) {
            return res.status(404).json({ message: `Station with id: ${station_id} was not found` });
        }

        // Find all trains that have a stop at the given station
        const trains = await Train.find({ 'stops.station_id': station_id });

        // If no trains pass through the station, return an empty array
        if (!trains || trains.length === 0) {
            return res.status(200).json({ station_id, trains: [] });
        }

        // Sort trains based on departure time, arrival time, and train_id
        trains.sort((a, b) => {
            if (a.departure_time !== b.departure_time) {
                // Sort by departure time (null values first)
                if (!a.departure_time) return -1;
                if (!b.departure_time) return 1;
                return a.departure_time.localeCompare(b.departure_time);
            } else if (a.arrival_time !== b.arrival_time) {
                // Sort by arrival time (null values first)
                if (!a.arrival_time) return -1;
                if (!b.arrival_time) return 1;
                return a.arrival_time.localeCompare(b.arrival_time);
            } else {
                // Sort by train_id
                return a.train_id - b.train_id;
            }
        });

        // Extract relevant information for response, including arrival_time and departure_time
        const trainList = trains.map(train => ({
            train_id: train.train_id,
            arrival_time: train.stops.find(stop => stop.station_id === station_id)?.arrival_time || null,
            departure_time: train.stops.find(stop => stop.station_id === station_id)?.departure_time || null
        }));

        // Return the sorted list of trains in the response
        res.status(200).json({ station_id, trains: trainList });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



mongoose
    .connect('mongodb+srv://bsse1321:Abir123@restapi.nkqy7wr.mongodb.net/Node-API?retryWrites=true&w=majority')
    .then(() => {
        // Start the server
        app.listen(port, () => {
            console.log(`API is running in port ${port}`);
        });

        // Define a simple endpoint for API confirmation
        app.get('/api', (req, res) => {
            res.send(`Api is running on ${port}`);
        });

        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.log(error);
});

const User = require('./User');
const Station = require('./Station');
const Train = require('./Train');