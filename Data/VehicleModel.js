const mongoose = require('mongoose');

const vehicleShema = mongoose.Schema({
    owner_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "owner id is required, please try again"]
    }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleShema);