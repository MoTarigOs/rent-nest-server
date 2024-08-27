const mongoose = require('mongoose');
const Report = require('../Data/ReportModel.js');
const { isValidText } = require('../utils/logic');


const reportProperty = async(req, res) => {

    try {

        if(!req || !req.body || !req.query) return res.status(400).json({ message: 'request error' });

        const { text } = req.body;
        
        console.log('report prop, text: ', text);

        const { propertyId } = req.query;

        console.log('propId: ', propertyId);

        if(!mongoose.Types.ObjectId.isValid(propertyId) || !isValidText(text, 0))    
            return res.status(400).json({ message: 'input error' });
        
        const updateReport = await Report.findOneAndUpdate({ reported_id: propertyId }, {
            $inc: { reportedTimes: 1 }, $push: { texts: text } 
        });

        if(!updateReport){
            const createReport = await Report.create({
                reported_id: propertyId,
                reportedTimes: 1,
                texts: [text]
            });
            if(!createReport) return res.status(501).json({ message: 'server error' });
        }

        return res.status(201).json({ message: 'success' });
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const reportReview = async(req, res) => {

    try {

        if(!req || !req.body || !req.query) return res.status(400).json({ message: 'request error' });

        const { text } = req.body;
        
        console.log('report prop review, text: ', text);

        const { propertyId, writerId } = req.query;

        if(!mongoose.Types.ObjectId.isValid(propertyId)
            || !mongoose.Types.ObjectId.isValid(writerId) 
            || !isValidText(text, 0))    
            return res.status(400).json({ message: 'input error' });
        
        const updateReport = await Report.findOneAndUpdate({ reported_id: propertyId}, {
           $addToSet: { review_writers_ids: writerId }, $inc: { reviews_reportedTimes: 1 }
        });

        if(!updateReport){
            const createReport = await Report.create({
                reported_id: propertyId,
                review_writers_ids: [writerId],
                reviews_reportedTimes: 1
            });
            if(!createReport) return res.status(501).json({ message: 'server error' });
        }

        return res.status(201).json({ message: 'success' });

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

module.exports = {
    reportProperty,
    reportReview
}