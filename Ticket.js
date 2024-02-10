const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  ticket_id: Number,
  wallet_id: Number,
  balance: Number,
  stations: [
    {
      station_id: Number,
      train_id: Number,
      arrival_time: String,
      departure_time: String,
    },
  ],
});

const Ticket = mongoose.model('Ticket', TicketSchema);

module.exports = Ticket;