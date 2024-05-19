const mongoose = require('mongoose');

const arrayLimitSchema = (val) => {
    if(!val) return true;
    if(val.length > 300) return false
    return true;
};

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is required"]
    },
    usernameEN: {
        type: String
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
    addressEN: {
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
            date_of_book_end: { type: Number },
            verified_book: { type: Boolean, default: false }
        }],
        validate: [arrayLimitSchema, 'array limit error']
    },
    book_guests: {
        type: [{
            guest_id: mongoose.Types.ObjectId,
            guest_name: String,
            booked_property_id: mongoose.Types.ObjectId,
            booked_property_title: String,
            booked_property_titleEN: String,
            booked_property_unit: Number,
            booked_property_image: String
        }],
        validate: [arrayLimitSchema, 'array limit error']
    },
    rating_score: { type: Number, max: 5, min: 0, default: 0 }, 
    reviews_num: { type: Number, default: 0, min: 0 },
    num_of_units: { type: Number, default: 0, min: 0 },
    blocked: {
        date_of_block: {type: Number},
        block_duration: {type: Number},
        reason: {type: String, maxLength: 500}
    },
    attempts: {
        type: Number, max: 60, min: 0, default: 0
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);