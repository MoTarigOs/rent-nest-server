const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is required"],
        minLength: 2,
        maxLength: 45
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email address is already taken"],
        minLength: 5,
        maxLength: 100
    },
    password: {
        type: String,
        required: [true, "password is required"]
    },
    role: {
        type: String,
        default: 'user',
        maxLength: 10
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    blocked: {
        date_of_block: {type: Number},
        block_duration: {type: Number}
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);