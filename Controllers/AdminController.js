const Report = require('../Data/ReportModel.js');
const Property = require('../Data/PropertyModel.js');
const User = require('../Data/UserModel.js');
const ErrorModel = require('../Data/ErrorModel.js');
const VerCode = require('../Data/VerificationCode.js');
const WL = require('../Data/WhiteList.js');
const mongoose = require('mongoose');
const { isValidText, isValidEmail, isValidNumber, updatePropertyRatingRemovedReview, updatePropertyRating, updateHostEvaluation, sendNotification, isValidDetails, citiesArray, isValidPrices, isValidTerms, isValidContacts, isValidEnData, isValidPoint, isValidBookDateFormat, getSkipObj, sendAdminNotification } = require('../utils/logic.js');
const Notif = require('../Data/NotifModel.js');

const getReports = async(req, res) => {

    try {

        console.log('get reports');

        if(!req || !req.user) return res.status(400).json({ message: 'request error' });

        const { cardsPerPage, skip } = req?.query;

        const maxLimit = 36;

        const reports = await Report.find()
            .sort({ reportedTimes: -1, reviews_reportedTimes: -1, updatedAt: -1 })
            .limit((isValidNumber(Number(cardsPerPage)) && Number(cardsPerPage) < maxLimit) ? Number(cardsPerPage) : maxLimit)
            .skip(getSkipObj(skip));

        let idsArr = [];
        for (let i = 0; i < reports.length; i++) {
            idsArr.push(reports[i].reported_id);
        }

        const properties = await Property.find({ _id: idsArr })
            .limit((isValidNumber(Number(cardsPerPage)) && Number(cardsPerPage) < maxLimit) ? Number(cardsPerPage) : maxLimit)
            .skip(getSkipObj(skip))
            .select('_id images title description ratings city reviews neighbourhood price discount specific_catagory');
        
        let count = null; 

        if(!(isValidNumber(Number(skip)) && Number(skip) > 0)) 
            count = await Report.find().countDocuments();

        return res.status(200).json({ properties, reports, count });

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

const deleteReport = async(req, res) => {

    try {

        const propertyId = req?.params?.propertyId;

        if(!mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const deletedReport = await Report.deleteOne({ reported_id: propertyId });
        
        if(!deletedReport || deletedReport.deleteCount <= 0)
            return res.status(404).json({ message: 'not exist error' });

        return res.status(201).json({ message: 'success' });
        
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

const getErrorsOccured = async(req, res) => {

    try {

        if(!req) return res.status(400).json({ message: 'request error' });

        const { skip, cardsPerPage } = req?.query;

        console.log(skip);

        const maxLimit = 36;

        const errors = await ErrorModel.find().sort({ createdAt: 1 })
        .limit((isValidNumber(Number(cardsPerPage)) && Number(cardsPerPage) < maxLimit) ? Number(cardsPerPage) : maxLimit)
        .skip(getSkipObj(skip));

        if(!errors) return res.status(404).json({ message: 'not exist error' });

        let count = null; 

        if(!(isValidNumber(Number(skip)) && Number(skip) > 0)) 
            count = await ErrorModel.find().countDocuments();

        return res.status(200).json({ errors, count });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

};

const deleteErrorOccured = async(req, res) => {

    try {

        const errorId = req?.params?.errorId;

        if(!mongoose.Types.ObjectId.isValid(errorId))
            return res.status(400).json({ message: 'request error' });

        const deletedError = await ErrorModel.deleteOne({ _id: errorId });
        
        if(!deletedError || deletedError.deleteCount <= 0)
            return res.status(404).json({ message: 'not exist error' });

        return res.status(201).json({ message: 'success' });
        
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

const getPropertiesForCheck = async(req, res) => {

    try {

        const { skip, cardsPerPage } = req.query;

        console.log('check: skip ', skip, ' cardsPerPage ', cardsPerPage);

        const maxLimit = 36;

        const properties = await Property.find({ checked: false })
            .select('_id images title description ratings city visible checked isRejected neighbourhood price discount specific_catagory')
            .sort({ createdAt: -1, updatedAt: -1 })
            .limit((isValidNumber(Number(cardsPerPage)) && Number(cardsPerPage) < maxLimit) ? Number(cardsPerPage) : maxLimit)
            .skip(getSkipObj(skip));

        if(!properties) return res.status(404).json({ message: 'not exist error' });   

        let count = null; 

        if(!(isValidNumber(Number(skip)) && Number(skip) > 0)) 
            count = await Property.find({ checked: false }).countDocuments();

            console.log('returning count: ', count, ' props num: ', properties?.length);

        return res.status(200).json({ properties, count });
        
    } catch (err) {
        console.log(err);
        return res.status(501).json(err.message);
    }

};

const getHiddenProperties = async(req, res) => {

    try {

        const { skip, cardsPerPage } = req.query;

        const maxLimit = 36;

        const properties = await Property.find({ visible: false })
            .select('_id images title description ratings visible checked isRejected city neighbourhood price discount specific_catagory')
            .limit((isValidNumber(Number(cardsPerPage)) && Number(cardsPerPage) < maxLimit) ? Number(cardsPerPage) : maxLimit)
            .skip(getSkipObj(skip));

        if(!properties) return res.status(404).json({ message: 'not exist error' });   

        let count = null; 

        if(!(isValidNumber(Number(skip)) && Number(skip) > 0)) 
            count = await Property.find({ visible: false }).countDocuments();

        console.log('count: ', count, ' propsNum: ', properties?.length);    

        return res.status(200).json({ properties, count });

    } catch (err) {
        console.log(err);
        return res.status(501).json(err.message);
    }

};

const getPropertiesByFilesDetails = async(req, res) => {

    try {

        const { skip, isChecked, isVisible, cardsPerPage } = req.query;

        const maxLimit = 36;

        const properties = await Property.find().select('_id images title description ratings visible checked isRejected city neighbourhood price discount specific_catagory checked visible files_details')
            .limit((isValidNumber(Number(cardsPerPage)) && Number(cardsPerPage) < maxLimit) ? Number(cardsPerPage) : maxLimit)
            .skip(getSkipObj(skip))
            .sort({ 
                'files_details.total_size' : -1, 'files_details.no': 1
            });

        if(!properties) return res.status(404).json({ message: 'not exist error' });   
        
        let count = null; 

        if(!(isValidNumber(Number(skip)) && Number(skip) > 0)) 
            count = await Property.find().countDocuments();

        
        console.log('count: ', count, ' propsNum: ', properties?.length, ' isChecked: ', isChecked, ' isVisible: ', isVisible);    

        return res.status(200).json({ properties, count });
        
    } catch (err) {
        console.log(err);
        return res.status(501).json(err.message);
    }

};

const passProperty = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(propertyId)) return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            checked: true, isRejected: false, reject_reasons: []
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        await sendNotification(null, 'accept-prop', propertyId, property.owner_id, null, property?.title);

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const rejectProperty = async(req, res) => {

    try {

        console.log('rejecting');

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        const reasons = req?.body?.reasons;

        if(!mongoose.Types.ObjectId.isValid(propertyId) || !reasons?.length > 0) 
            return res.status(400).json({ message: 'request error' });

        for (let i = 0; i < reasons.length; i++) {
            if(!isValidText(reasons[i])) return res.status(403).json({ message: 'reason error' });
        }

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            isRejected: true,
            reject_reasons: reasons
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        await sendNotification(null, 'reject-prop', propertyId, property.owner_id, null, 'Reject reasons: ' + reasons?.toString());

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const deletePropertyAdmin = async(req, res) => {

    try {

        if(!req || !req.params || !req.body) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        const { owner_id } = req.body;

        if(!mongoose.Types.ObjectId.isValid(propertyId)) return res.status(400).json({ message: 'request error' });

        const prop = await Property.findOneAndDelete({ _id: propertyId, owner_id }).select('reviews title');

        if(!prop) return res.status(403).json({ message: 'access error' });

        await updateHostEvaluation(owner_id, 'remove all', null, null, null, null, prop.reviews);

        await sendNotification(null, 'delete-prop', propertyId, owner_id, null, prop?.title, -1);

        return res.status(201).json({ message: 'success' });
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const hidePropertyAdmin = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            visible: false,
            checked: false
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const showPropertyAdmin = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            visible: true,
            checked: true
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const deleteReviewsAdmin = async(req, res) => {

    try {

        if(!req || !req.params || !req.body) return res.status(400).json({ message: 'request error' });

        const { writerIds, ids } = req.body;
        const { propertyId } = req.params;

        for (let i = 0; i < writerIds.length; i++) {
            if(!mongoose.Types.ObjectId.isValid(writerIds[i]) || !mongoose.Types.ObjectId.isValid(propertyId))
                return res.status(400).json({ message: 'request error' });
        }

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            $pull: { reviews: { $or: [{ writer_id: { $in: writerIds } }, { _id: { $in: ids } }] } }
        }).select('reviews ratings owner_id');

        if(!property) return res.status(404).json({ message: 'not exist error' });

        const updatedProp = await updatePropertyRating(propertyId, property.ratings, 'remove', null, null, property.reviews, writerIds, property.owner_id, ids);

        return res.status(201).json(updatedProp);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const getUsers = async(req, res) => {

    try {

        if(!req || !req.query) return res.status(400).json({ message: 'request error' });

        const { filterType, skip } = req.query;

        console.log(filterType);

        if(filterType && !isValidText(filterType)) return res.status(400).json({ message: 'request error' });
        
        if(skip && !isValidNumber(Number(skip))) return res.status(400).json({ message: 'request error' });
    
        const getFilterObj = () => {

            switch(filterType){
                case 'user':
                    return { role: 'user' };
                case 'admin':
                    return { role: ['admin', 'owner'] };
                case 'owner':
                    return { role: 'owner' };
                case 'email_verified-true':
                    return { email_verified: true };
                case 'email_verified-false':
                    return { email_verified: false };
                case 'blocked-true':
                    return { isBlocked: true};
                case 'blocked-false':
                    return { isBlocked: false};
                case 'Host_requests':
                    return { account_type: { $ne: 'host' }, ask_convert_to_host: true };
                case 'hosts':
                    return { account_type: 'host' };        
                default: 
                    return {};        
            }

        };

        const users = await User.find(getFilterObj()).limit(300)
            .select('_id username email role address email_verified books blocked isBlocked books')
            .skip((skip ? skip : 0) * 300).sort({ createdAt: -1 });

        if(!users) return res.status(403).json({ message: 'not exist error' });

        return res.status(200).json(users);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const getUserByEmail = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { email } = req.params;

        if(!isValidEmail(email)) return res.status(400).json({ message: 'email error' });
        
        const user = await User.findOne({ email: email.toLowerCase() }) 
            .select('_id first_name first_name_en username email phone role address addressEN account_type ask_convert_to_host email_verified books blocked isBlocked books');

        if(!user) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(user);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

};

const getUserById = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { userId } = req.params;

        console.log('by id: ', userId);

        if(!userId || !mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ message: 'request error' });
        
        const user = await User.findOne({ _id: userId }) 
            .select('_id first_name first_name_en username email phone role address addressEN account_type ask_convert_to_host email_verified books blocked isBlocked books');

        if(!user) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(user);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

};

const blockUser = async(req, res) => {

    try {
        
        if(!req || !req.params || !req.body) return res.status(403).json({ message: "request error" });

        const { reason, blockDuration } = req.body;

        const { userId } = req.params;

        if(!isValidText(reason) || !isValidNumber(Number(blockDuration)) || blockDuration <= 0) 
            return res.status(400).json({ message: "input error" });

        if(!mongoose.Types.ObjectId.isValid(userId)) 
            return res.status(403).json({ message: "request error" });

        const blockObj = {
            date_of_block: Date.now(), 
            block_duration: Number(blockDuration),
            reason
        };

        const updatedUser = await User.findOneAndUpdate({ _id: userId, role: ['user', null, undefined, ''] }, { 
            blocked: blockObj, isBlocked: true 
        }, { new: true });

        if(!updatedUser) return res.status(404).json({ message: "not exist error" });

        res.status(201).json(updatedUser);

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const unBlockUser = async(req, res) => {

    try {
        
        if(!req || !req.params || !req.body) return res.status(403).json({ message: "request error" });

        const { userId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(userId)) 
            return res.status(403).json({ message: "request error" });

        const blockObj = {
            date_of_block: null, 
            block_duration: null,
            reason: null
        };

        const updatedUser = await User.findOneAndUpdate({ _id: userId, role: ['user', null, undefined, ''] }, { 
            blocked: blockObj, isBlocked: false 
        }, { new: true });

        if(!updatedUser) return res.status(404).json({ message: "not exist error" });

        res.status(201).json(updatedUser);

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const deleteAccountAdmin = async(req, res) => {

    try {

        if(!req || !req.user || !req.query || !req.params) return res.status(400).json({ message: "request error" });

        const { id, email } = req.user;
    
        const { eCode, userEmail } = req.query;
    
        const { userId } = req.params;
    
        if(!isValidEmail(email) || !isValidEmail(userEmail) || !isValidText(eCode)
            || !mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ message: 'request error' });

        const findAccount = await User.findOne({ _id: userId, email: userEmail, role: ['user', null, undefined, ''] });
    
        console.log(userId, userEmail, findAccount);

        if(!findAccount) return res.status(404).json({ message: "not exist error" });

        const verCode = await VerCode.findOneAndUpdate({ 
            email: email, attempts: { $lte: 30 }
        }, { $inc: { attempts: 1 } });
    
        if(!verCode || !verCode.code || !verCode.date || verCode.attempts > 30) 
            return res.status(403).json({ message: "send code first" });

        if(verCode.code.toString() !== eCode) 
            return res.status(403).json({ message: "not allowed error" });
    
        if(Date.now() - verCode.date > (60 * 60 * 1000)) {
            await VerCode.updateOne({ email: email }, { code: null, date: null, attempts: 0 });
            return res.status(403).json({ message: "ver time end error" });
        }

        await VerCode.updateOne({ email: email }, {
            code: null, date: null, attempts: 0
        });
    
        const deletedAccount = await User.deleteOne({ _id: userId, role: ['user', null, undefined, ''] });
    
        if(!deletedAccount || deletedAccount.deleteCount <= 0)
            return res.status(500).json({ message: "server error" });
        
        await Property.deleteMany({ owner_id: userId }); 

        await WL.deleteOne({ email: userEmail });
    
        await VerCode.deleteOne({ email: userEmail });
    
        return res.status(201).json({ message: 'deleted successfully' });   

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }
  
};

const promoteToAdmin = async(req, res) => {

    try {

        if(!req || !req.user || !req.query) return res.status(400).json({ message: 'request error' });
        
        const { email } = req.user;

        const { userId, eCode } = req.query;

        if(!mongoose.Types.ObjectId.isValid(userId) || !isValidEmail(email)
            || !isValidText(eCode) || eCode.length !== 6)
            return res.status(400).json({ message: 'request error' });

        const verCode = await VerCode.findOneAndUpdate({ 
            email: email, attempts: { $lte: 30 }
        }, { $inc: { attempts: 1 } });
    
        if(!verCode || !verCode.code || !verCode.date || verCode.attempts > 30) 
            return res.status(403).json({ message: "Send code first" });

        if(verCode.code.toString() !== eCode) 
            return res.status(403).json({ message: "not allowed error" });
    
        if(Date.now() - verCode.date > (60 * 60 * 1000)) {
            await VerCode.updateOne({ email: email }, { code: null, date: null, attempts: 0 });
            return res.status(403).json({ message: "ver time end error" });
        }

        await VerCode.updateOne({ email: email }, {
            code: null, date: null, attempts: 0
        });

        const userToPromote = await User.findOneAndUpdate({ _id: userId, role: 'user', email_verified: true, isBlocked: false }, {
            role: 'admin'
        }, { new: true });

        if(!userToPromote) return res.status(400).json({ message: 'not exist error' });

        return res.status(201).json(userToPromote);
        
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

const demoteFromAdmin = async(req, res) => {

    try {

        if(!req || !req.user || !req.query) return res.status(400).json({ message: 'request error' });
        
        const { email } = req.user;

        const { userId, eCode } = req.query;

        if(!mongoose.Types.ObjectId.isValid(userId) || !isValidEmail(email)
            || !isValidText(eCode) || eCode.length !== 6)
            return res.status(400).json({ message: 'request error' });

        const verCode = await VerCode.findOneAndUpdate({ 
            email: email, attempts: { $lte: 30 }
        }, { $inc: { attempts: 1 } });
    
        if(!verCode || !verCode.code || !verCode.date || verCode.attempts > 30) 
            return res.status(403).json({ message: "Send code first" });

        if(verCode.code.toString() !== eCode) 
            return res.status(403).json({ message: "not allowed error" });
    
        if(Date.now() - verCode.date > (60 * 60 * 1000)) {
            await VerCode.updateOne({ email: email }, { code: null, date: null, attempts: 0 });
            return res.status(403).json({ message: "ver time end error" });
        }

        await VerCode.updateOne({ email: email }, {
            code: null, date: null, attempts: 0
        });

        const userToDemote = await User.findOneAndUpdate({ _id: userId, role: 'admin' }, {
            role: 'user'
        }, { new: true });

        if(!userToDemote) return res.status(400).json({ message: 'not exist error' });

        return res.status(201).json(userToDemote);

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

const convertToHost = async(req, res) => {

    try {

        const userId = req?.params?.userId;

        if(!userId || !mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ message: "request error" });

        const updatedUser = await User.updateOne({
             _id: userId, 
             ask_convert_to_host: true, 
             account_type: { $ne: 'host' } 
        }, {
            ask_convert_to_host: false,
            account_type: 'host'
        }).select('email');
        
        if(updatedUser.modifiedCount < 1 || updatedUser.acknowledged === false) {
            return res.status(500).send("server error");
        }

        await sendAdminNotification('new-host', userId, userId, updatedUser?.email);

        await sendNotification(null, 'converted-to-host', null, userId, null, null);

        res.status(201).json({ message: 'success' });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

};

const setAbleToBookAdmin = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            is_able_to_book: true
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }

};

const setPreventBookAdmin = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            is_able_to_book: false
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const setBookedDaysAdmin = async(req, res) => {

    try {

        console.log('booked days: ', req?.body);
        if(!req || !req.params || !req.body) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;
        const { bookedDays } = req.body;

        if(!mongoose.Types.ObjectId.isValid(propertyId)
            || !Array.isArray(bookedDays)
            || bookedDays.length > 1200)
            return res.status(400).json({ message: 'request error' });

        for (let i = 0; i < bookedDays.length; i++) {
            if(!isValidBookDateFormat(bookedDays[i])) return res.status(400).json({ message: 'date error' });
        }

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            booked_days: bookedDays
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const editPropertyAdmin = async(req, res) => {

    try {

        if(!req || !req.params || !req.body) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;
        const { 
            title, description, details, 
            terms_and_conditions, contacts, discount,
            enObj, cancellation, capacity, customerType,
            prices, landArea, floor, city, neighbourhood,
            map_coordinates, type_is_vehicle
        } = req.body;

        // return res.status(400).json({ message: 'stop' });

        if(!mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        if(title && (!isValidText(title) || title.slice(0, 4) === 'unit')) return res.status(400).json({ message: 'title error' });
        
        if(description && !isValidText(description)) return res.status(400).json({ message: 'desc error' });

        if(!isValidText(city) || !citiesArray.find(i => i.value === city)) return res.status(400).json({ message: 'city error' });

        if(neighbourhood && !isValidText(neighbourhood)) return res.status(400).json({ message: 'neighbourhood error' });

        if(prices && !isValidPrices(prices)) return res.status(400).json({ message: 'prices error' });

        if(details && !isValidDetails(details)) return res.status(400).json({ message: 'details error' });
        
        if(terms_and_conditions && !isValidTerms(terms_and_conditions)) return res.status(400).json({ message: 'details error' });

        if(contacts && !isValidContacts(contacts)) return res.status(400).json({ message: 'contacts error' });

        if(discount?.percentage && (!isValidNumber(discount.percentage, 100, 0) || !isValidNumber(discount.num_of_days_for_discount, 2000, 0)))
            return res.status(400).json({ message: 'discount error' });

        if(capacity && !isValidNumber(capacity, null, 0)) return res.status(400).json({ message: 'capacity error' });

        // if(customerType && customerType?.length > 0) {
        //     for (let i = 0; i < customerType.length; i++) {
        //         if(!isValidText(customerType[i]))
        //             return res.status(400).json({ message: 'customer type error' });
        //     }
        // } 

        if(landArea && !isValidText(landArea)) return res.status(400).json({ message: 'land area error' });

        if(floor && !isValidText(floor)) return res.status(400).json({ message: 'floor error' });
        
        if(enObj && !isValidEnData(enObj)) return res.status(400).json({ message: 'enDetails error' });

        if(type_is_vehicle && typeof type_is_vehicle !== 'boolean') return res.status(400).json({ message: 'is vehicle error' });

        if(map_coordinates && (map_coordinates.length !== 2 || !isValidPoint(map_coordinates[0], map_coordinates[1]))) return res.status(400).json({ message: 'coordinates error' });

        const getUpdateObj = () => {
            let obj = {
                title,
                description,
                prices,
                details,
                terms_and_conditions,
                checked: false,
                isRejected: false,
                reject_reasons: [],
                contacts,
                discount,
                capacity,
                customer_type: customerType,
                landArea,
                floor,
                en_data: enObj,
            }
            if(type_is_vehicle) obj.city = city;
            if(type_is_vehicle) obj.neighbourhood = neighbourhood;
            if(!type_is_vehicle && enObj) delete obj.en_data['neighbourEN'];
            if(isValidNumber(Number(cancellation), 10, null, 'start-zero')) obj.cancellation = cancellation;
            return obj;
        };

        console.log(getUpdateObj());
        //return res.status(400).json({ message: 'success' });
        const property = await Property.findOneAndUpdate({ _id: propertyId, type_is_vehicle }, getUpdateObj(), { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        if(!mongoose.Types.ObjectId.isValid(property.owner_id)) return res.status(201).json(property);

        const user = User.findOne({ _id: property.owner_id }).select('email');

        if(!user?.email || !isValidEmail(user.email)) return res.status(201).json(property);

        await sendNotification(user?.email, 'edit-prop', propertyId, id, null, title);

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

};

const getAdminNotif = async(req, res) => {

    try {

        const notifs = await Notif.find()
        .limit(500).sort({ createdAt: 1 });

        if(!notifs) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(notifs);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

};

const addBadge = async(req, res) => {
    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(propertyId))
        return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            isBadge: true
        }, { new: true });

        if(!property) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(property);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }
};

const removeBadge = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(propertyId))
        return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            isBadge: false
        }, { new: true });

        if(!property) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(property);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

};

const setIsDealTrue = async(req, res) => {
    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(propertyId))
        return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            isDeal: true
        }, { new: true });

        if(!property) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(property);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }
};

const setIsDealFalse = async(req, res) => {
    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(propertyId))
        return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            isDeal: false
        }, { new: true });

        if(!property) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(property);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }
};

const addReviewAdmin = async(req, res) => {

    try {

        if(!req || !req.body || !req.params) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.params;

        const { text, user_rating, username } = req.body;

        if(!mongoose.Types.ObjectId.isValid(propertyId) 
            || !isValidText(username) 
            || !isValidText(text) 
            || !isValidNumber(user_rating) || user_rating > 5 || user_rating < 0){        
            return res.status(400).json({ message: 'input error' });
        }

        const getReviewType = () => {
            const x = Math.round(Number(user_rating));
            if(x === 5) return { 'num_of_reviews_percentage.five': 1 };
            if(x === 4) return { 'num_of_reviews_percentage.four': 1 };
            if(x === 3) return { 'num_of_reviews_percentage.three': 1 };
            if(x === 2) return { 'num_of_reviews_percentage.two': 1 };
            if(x === 1) return { 'num_of_reviews_percentage.one': 1 };
            return null;
        };

        const inserted = await Property.findOneAndUpdate({ _id: propertyId }, {
            $push: { reviews: { 
                writer_id: null, 
                username: username,
                text, user_rating: Number(user_rating).toFixed(2),
                updatedAt: Date.now()
            }},
            $inc: getReviewType()
        }).select('_id ratings owner_id');

        if(!inserted) return res.status(403).json({ message: 'not exist error' });

        const updatedInsertedProp = await updatePropertyRating(propertyId, inserted.ratings, 'add', Number(user_rating), null, null, null, inserted.owner_id);    
    
        return res.status(201).json(updatedInsertedProp);

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }
};

module.exports = {
    getReports,
    deleteReport,
    getErrorsOccured,
    deleteErrorOccured,
    getPropertiesForCheck,
    getHiddenProperties,
    passProperty,
    rejectProperty,
    deletePropertyAdmin,
    hidePropertyAdmin,
    showPropertyAdmin,
    deleteReviewsAdmin,
    getUsers,
    getUserByEmail,
    getUserById,
    blockUser, 
    unBlockUser,
    deleteAccountAdmin,
    getPropertiesByFilesDetails,
    promoteToAdmin,
    demoteFromAdmin,
    convertToHost,
    setAbleToBookAdmin,
    setPreventBookAdmin,
    setBookedDaysAdmin,
    editPropertyAdmin,
    getAdminNotif,
    addBadge,
    removeBadge,
    setIsDealTrue,
    setIsDealFalse,
    addReviewAdmin
};