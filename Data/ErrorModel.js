const mongoose = require("mongoose");

const ErrorSchema = mongoose.Schema({
    isStorageError: {
        type: Boolean, default: false
    },
    storage_err: {
        type: {
            filename: String,
            code: String,
            stack: String,
        }
    }
});

module.exports = mongoose.model('Error', ErrorSchema);