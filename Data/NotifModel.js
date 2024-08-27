const mongoose = require("mongoose");

const NotifSchema = mongoose.Schema({
    typeOfNotif: String, 
    targettedId: mongoose.Types.ObjectId, 
    userId: mongoose.Types.ObjectId,
    name: String
});

module.exports = mongoose.model('Notification', NotifSchema);