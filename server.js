
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
        const trainList = trains.map(train => {
            // console.log('Train:', train);
            const station_id = parseInt(req.params.station_id);

            const arrivalStop = train.stops.find(stop => stop.station_id === station_id);
            // console.log('Arrival Stop:', arrivalStop);
            
            return {
                train_id: train.train_id,
                arrival_time: arrivalStop ? arrivalStop.arrival_time : null,
                departure_time: arrivalStop ? arrivalStop.departure_time : null
            };
        });
        
        // Return the sorted list of trains in the response
        res.status(200).json({ station_id, trains: trainList });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});





///// wallet////////////////



app.get('/api/wallets/:wallet_id', async (req, res) => {
    try {
        const { wallet_id } = req.params;

        // Find the user based on the wallet ID
        const user = await User.findOne({ user_id: wallet_id });

        // If the user is not found, return a 404 error
        if (!user) {
            return res.status(404).json({ message: `Wallet with id: ${wallet_id} was not found` });
        }

        // If the user is found, return their wallet balance along with user ID and name
        res.status(200).json({
            wallet_id: user.user_id,
            balance: user.balance,
            wallet_user: {
                user_id: user.user_id,
                user_name: user.user_name
            }
        });
    } catch (error) {
        console.error('Error retrieving wallet balance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




//// Add Wallet Balance


app.put('/api/wallets/:wallet_id', async (req, res) => {
    try {
        const { wallet_id } = req.params;
        const { recharge } = req.body;

        // Check if recharge is within the range 100 - 10000
        if (recharge < 100 || recharge > 10000) {
            return res.status(400).json({ message: `Invalid amount: ${recharge}` });
        }

        // Find the user by user_id
        const user = await User.findOne({ user_id: wallet_id });

        // If the user does not exist, return a 404 response
        if (!user) {
            return res.status(404).json({ message: `Wallet with id: ${wallet_id} was not found` });
        }

        // Add funds to the user's balance
        user.balance += recharge;

        // Save the updated user to the database
        await user.save();

        // Respond with the updated wallet data and status code 200
        res.status(200).json({
            wallet_id: user.user_id,
            wallet_balance: user.balance,
            wallet_user: {
                user_id: user.user_id,
                user_name: user.user_name,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

 // Adjust the path as per your project structure

// Helper function to calculate cost between two stations


///////////////////// Purchase Ticket


app.post('/api/tickets', async (req, res) => {
  try {
    const { wallet_id, time_after, station_from, station_to } = req.body;

  
    // For simplicity, let's assume the user has enough balance
    // and a direct train between station_from and station_to

    const user = await User.findOne({ user_id: wallet_id });
    if (!user) {
      return res.status(403).json({ message: `User not found with ID ${wallet_id}` });
    }

    const train = await Train.findOne({ 'stops.station_id': { $all: [station_from, station_to] } });
    if (!train) {
      return res.status(403).json({ message: `No direct train available between stations ${station_from} and ${station_to}` });
    }

    // Calculate fare based on the train's stops
    const stops = train.stops;
    const fare = stops.find((stop) => stop.station_id === station_to).fare;

    // Check if the user has enough balance
    if (user.balance < fare) {
      return res.status(402).json({ message: `Insufficient balance. Recharge amount: ${fare - user.balance} to purchase the ticket` });
    }

    // Update user's balance
    user.balance -= fare;
    await user.save();

    // Generate a basic ticket
    const ticket = new Ticket({
      ticket_id: Math.floor(Math.random() * 1000) + 1,
      wallet_id,
      balance: user.balance,
      stations: [
        {
          station_id: station_from,
          train_id: train.train_id,
          departure_time: '11:00',
          arrival_time: null,
        },
        {
          station_id: station_to,
          train_id: train.train_id,
          departure_time: null,
          arrival_time: '12:00',
        },
      ],
    });

    // Save the ticket to the database
    await ticket.save();

    // Send the successful response
    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
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
const Ticket = require('./Ticket');