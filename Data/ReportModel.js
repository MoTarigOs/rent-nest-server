const mongoose = require("mongoose");

const ReportSchema = mongoose.Schema({
    reported_id: {
        type: mongoose.Types.ObjectId,
        required: [true, 'require report error'],
        unique: [true, 'already exist']
    },
    review_writers_ids: [{
        type: mongoose.Types.ObjectId
    }],
    reviews_reportedTimes: {
        type: Number,
        default: 0
    },
    reportedTimes: {
        type: Number,
        default: 0
    },
    texts: [{
        type: String,
        maxLength: 500
    }]
});

module.exports = mongoose.model('Report', ReportSchema);