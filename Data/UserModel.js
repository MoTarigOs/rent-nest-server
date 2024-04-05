const mongoose = require('mongoose');
const { arrayLimitSchema } = require('../utils/logic');

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
        required: [true, "password is required"],
        minLength: 8,
        maxLength: 100
    },
    role: {
        type: String,
        default: 'user',
        maxLength: 10
    },
    address: {
        type: String,
        maxLength: 500
    },
    phone: {
        type: String,
        maxLength: 50
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    favourites: {
        type: [mongoose.Types.ObjectId],
        validate: [arrayLimitSchema, 'array limit error']
    },
    books: {
        type: [{ 
            property_id: { type: mongoose.Types.ObjectId },
            date_of_book_start: { type: Number },
            date_of_book_end: { type: Number }
        }],
        validate: [arrayLimitSchema, 'array limit error']
    },
    blocked: {
        date_of_block: {type: Number},
        block_duration: {type: Number},
        reason: {type: String, maxLength: 500}
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);