const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_id: Number,
    user_name: String,
    balance: Number
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
