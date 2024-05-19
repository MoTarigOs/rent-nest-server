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
        required: [true, "title error"],
        index: 'text'
    },
    description: {
        type: String,
        maxLength: 4000,
        index: 'text',
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
        default: '',
        index: 'text'
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
    unit_code: {
        type: Number,
        unique: [true, 'unit code error'],
        sparse: true
    },
    vehicle_type: Number,
    customer_type: { type: String },
    capacity: { type: Number },
    cancellation: { type: Number },
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
        bathrooms: { num: Number, companians: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] } },
        kitchen: { dim: { x: Number, y: Number }, companians: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] } },
        rooms: { num: Number, single_beds: Number, double_beds: Number },
        pool: { num: Number, dim: { x: Number, y: Number }, companians: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] } },
        vehicle_specifications: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
        vehicle_addons: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
        near_places: { type: [{ type: String, maxLength: 500 }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
    },
    en_data: {
        english_details: { type: [{ enName: String, arName: String }], default: [], validate: [arrayLimitSchema, 'array limit error'] },
        customerTypeEN: { type: String },
        titleEN: { type: String, maxLength: 250, index: 'text' },
        descEN: { type: String, maxLength: 4000, index: 'text' },
        neighbourEN: { type: String, maxLength: 100, index: 'text' }
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
            user_rating: { type: Number, max: 5 },
            updatedAt: Date
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
        num_of_days_for_discount: { type: Number, max: 2000, default: 0 },
        percentage: { type: Number, max: 100, min: 0, default: 0 },
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
    },
    isRejected: {
        type: Boolean,
        default: false
    }, 
    reject_reasons: {
        type: [String],
        default: undefined,
        validate: [arrayLimitSchema, 'array limit error']
    },
    contacts: {
        type: [{
            platform: String,
            val: String
        }],
        default: undefined,
        validate: [arrayLimitSchema, 'array limit error']
    }
}, { timestamps: true }).index({ 
    'title' : 'text', 
    'description' : 'text',
    'neighbourhood': 'text',
    'en_data.titleEN': 'text',
    'en_data.descEN': 'text',
    'en_data.neighbourEN': 'text'
});

module.exports = mongoose.model('Property', propertyShema);