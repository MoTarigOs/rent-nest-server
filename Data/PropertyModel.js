const mongoose = require('mongoose');

const arrayLimitSchema = (val) => {
    if(!val) return true;
    if(val.length > 300) return false;
    return true;
};

const isValidBookDateFormat = (date) => {

    console.log('date: ', date);
  
    if(!date || typeof date !== 'string' || date.length <= 0) return false;
  
    const day = date.split('-')?.at(0);
    const month = date.split('-')?.at(1);
    const year = date.split('-')?.at(2);
  
    if(!day || typeof Number(day) !== 'number' || Number(day) < 1 || Number(day) > 31) return false;
    if(!month || typeof Number(month) !== 'number' || Number(month) < 1 || Number(month) > 12) return false;
    if(!year || typeof Number(year) !== 'number' || Number(year) < 2024 || Number(year) > new Date().getFullYear() + 5) return false;
  
    return true;
  
};

const arrayLimitSchema1200 = (val) => {
    console.log('val: ', val);
    if(!val) return false;
    if(val.length > 8) return false;
    return true;
};

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
        required: [true, 'specific catagory error'],
        maxLength: 100,
        minLength: 1
    },
    title: {
        type: String,
        maxLength: 250,
        minLength: 5,
        required: [true, "title error"],
        index: 'text'
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
        maxLength: 100,
        default: ''
    },
    map_coordinates: {
        type: [Number],
        validate: [arrayLimitSchema, 'limit array error']
    },
    price: {
        type: Number,
        min: 1,
        max: 1000000000000000,
        required: [true, "price error"]
    },
    images: { 
        type: [{
            type: String,
            maxLength: 500
        }],
        default: [],
        validate: [arrayLimitSchema, 'array limit error']
    },
    videos: { 
        type: [{
            type: String,
            maxLength: 500
        }],
        default: [],
        validate: [arrayLimitSchema, 'array limit error']
    },
    files_details: {
        total_size: { type: Number, default: 0 },
        no: { type: Number, default: 0 } 
    },
    details: {
        insurance: { type: Boolean, default: false },
        guest_rooms: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
        facilities: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
        bathrooms: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
        kitchen: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
        rooms: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
        vehicle_specifications: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
        vehicle_addons: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
    },
    terms_and_conditions: { 
        type: [{
            type: String,
            maxLength: 500
        }],
        default: [],
        validate: [arrayLimitSchema, 'array limit error']
    },
    reviews: { 
        type: [{
            writer_id: { type: mongoose.Types.ObjectId },
            username: { type: String },
            text: { type: String, maxLength: 500 },
            user_rating: { type: Number, maxLength: 5 }
        }],
        default: [],
        validate: [arrayLimitSchema, 'array limit error']
    },
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
    },
    booked_days: {
        type: [{ type: String, maxLength: 20, validate: [isValidBookDateFormat, 'book day error'] }],
        default: undefined,
        validate: [arrayLimitSchema1200, 'array limit error']
    },
    is_able_to_book: {
        type: Boolean,
        default: true
    },
    visible: {
        type: Boolean,
        default: true
    },
    checked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }).index({ 
    'title' : 'text', 
    'description' : 'text',
    'neighbourhood': 'text'
});

module.exports = mongoose.model('Property', propertyShema);