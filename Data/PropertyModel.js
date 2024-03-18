const mongoose = require('mongoose');

const propertyShema = mongoose.Schema({
    owner_id: {
        type: mongoose.Schema.ObjectId,
        required: [true, "request error"]
    },
    type_is_vehicle: {
        type: Boolean,
        required: [true, "type error"]
    },
    specific_catagory: {
        type: String,
        maxLength: 100,
        minLength: 1
    },
    title: {
        type: String,
        maxLength: 250,
        minLength: 5,
        required: [true, "title error"]
    },
    description: {
        type: String,
        maxLength: 4000,
        minLength: 25,
        required: [true, "desc error"]
    },
    city: {
        type: String,
        maxLength: 100,
        minLength: 1,
        required: [true, "city error"]
    },
    neighbourhood: {
        type: String,
        maxLength: 100
    },
    map_coordinates: [{
        type: Number
    }],
    price: {
        type: Number,
        min: 1,
        max: 1000000000000000,
        required: [true, "price error"]
    },
    images: [{
        type: String,
        maxLength: 500
    }],
    videos: [{
        type: String,
        maxLength: 500
    }],
    details: {
        insurance: { type: Boolean, default: false },
        guest_rooms: [{ type: String, maxLength: 500 }],
        facilities: [{ type: String, maxLength: 500 }],
        bathrooms: [{ type: String, maxLength: 500 }],
        kitchen: [{ type: String, maxLength: 500 }],
        rooms: [{ type: String, maxLength: 500 }],
        vehicle_specifications: [{ type: String, maxLength: 500 }],
        vehicle_addons: [{ type: String, maxLength: 500 }]
    },
    terms_and_conditions: [{
        type: String, maxLength: 500
    }],
    reviews: [{
        username: { type: String },
        text: { type: String, maxLength: 500 },
        user_rating: { type: Number, maxLength: 5 }
    }],
    ratings: {
        val: { type: Number, max: 5, default: 0 },
        no: { type: Number, max: 1000000, default: 0 },
    },
    area: {
        type: Number, max: 10000000000
    },
    discount: {
        num_of_days_for_discount: { type: Number, max: 1000, default: 0 },
        percentage: { type: Number, max: 100, default: 0 },
    }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertyShema);