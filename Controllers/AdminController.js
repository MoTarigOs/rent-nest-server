const Report = require('../Data/ReportModel.js');
const Property = require('../Data/PropertyModel.js');
const User = require('../Data/UserModel.js');
const ErrorModel = require('../Data/ErrorModel.js');
const VerCode = require('../Data/VerificationCode.js');
const WL = require('../Data/WhiteList.js');
const mongoose = require('mongoose');
const { isValidText, isValidEmail, isValidNumber, updatePropertyRatingRemovedReview, updatePropertyRating, updateHostEvaluation } = require('../utils/logic.js');

const getReports = async(req, res) => {

    try {

        if(!req || !req.user) return res.status(400).json({ message: 'request error' });

        const { skip } = req.body ? req.body : { skip: 0 };

        const reports = await Report.find()
            .sort({ reportedTimes: -1, reviews_reportedTimes: -1, updatedAt: -1 })
            .limit(300).skip((skip ? skip : 0) * 300);

        let idsArr = [];
        for (let i = 0; i < reports.length; i++) {
            idsArr.push(reports[i].reported_id);
        }

        const properties = await Property.find({ _id: idsArr })
            .limit(300).skip((skip ? skip : 0) * 300)
            .select('_id images title description ratings city reviews neighbourhood price discount specific_catagory');
        
        return res.status(200).json({ reports, properties });

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

        const skip = req?.body?.skip;

        const is_storage = req?.query?.is_storage;
        
        const errors = await ErrorModel.find(is_storage ? { isStorageError: is_storage === 'true' } : null).sort({ createdAt: 1 })
            .limit(300).skip((skip ? skip : 0) * 300);

        if(!errors) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(errors);

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

        const { skip } = req.query ? req.query : { skip: 0 };

        const properties = await Property.find({ checked: false })
            .select('_id images title description ratings city neighbourhood price discount specific_catagory')
            .limit(300).sort({ createdAt: -1, updatedAt: -1 }).skip((skip ? skip : 0) * 300);

        if(!properties) return res.status(404).json({ message: 'not exist error' });   

        return res.status(200).json(properties);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json(err.message);
    }

};

const getHiddenProperties = async(req, res) => {

    try {

        const { skip } = req.query ? req.query : { skip: 0 };

        const properties = await Property.find({ checked: false, visible: false })
            .select('_id images title description ratings city neighbourhood price discount specific_catagory')
            .limit(300).sort({ createdAt: -1, updatedAt: -1 }).skip((skip ? skip : 0) * 300);

        if(!properties) return res.status(404).json({ message: 'not exist error' });   

        return res.status(200).json(properties);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json(err.message);
    }

};

const getPropertiesByFilesDetails = async(req, res) => {

    try {

        const { skip, isChecked, isVisible } = req.query ? req.query : { skip: 0, isChecked: null, isVisible: null };

        const properties = await Property.find({ 
                checked: isChecked ? isChecked : [false, true], 
                visible: isVisible ? isVisible : [false, true] 
            }).select('_id images title description ratings city neighbourhood price discount specific_catagory checked visible files_details')
            .limit(300).sort({ 
                'files_details.total_size' : -1, 'files_details.no': 1
            }).skip((skip ? skip : 0) * 300);

        if(!properties) return res.status(404).json({ message: 'not exist error' });   

        return res.status(200).json(properties);
        
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

        await User.findOneAndUpdate({ _id: property.owner_id }, {
            $push: { notif: { typeOfNotif: 'accept-prop', targettedId: propertyId } }
        });

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

        await User.findOneAndUpdate({ _id: property.owner_id }, {
            $push: { notif: { typeOfNotif: 'reject-prop', targettedId: propertyId } }
        });

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

        const prop = await Property.findOneAndDelete({ _id: propertyId, owner_id }).select('reviews');

        if(!prop) return res.status(403).json({ message: 'access error' });

        await updateHostEvaluation(owner_id, 'remove all', null, null, null, null, prop.reviews);

        await User.updateOne({ _id: owner_id }, { 
            $inc: { num_of_units: -1 },
            $push: { notif: { typeOfNotif: 'delete-prop', targettedId: propertyId } }
        });

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

        const { writerIds } = req.body;
        const { propertyId } = req.params;

        for (let i = 0; i < writerIds.length; i++) {
            if(!mongoose.Types.ObjectId.isValid(writerIds[i]) || !mongoose.Types.ObjectId.isValid(propertyId))
                return res.status(400).json({ message: 'request error' });
        }

        const property = await Property.findOneAndUpdate({ _id: propertyId }, {
            $pull: { reviews: { writer_id: { $in: writerIds } } }
        }).select('reviews ratings owner_id');

        if(!property) return res.status(404).json({ message: 'not exist error' });

        const updatedProp = await updatePropertyRating(propertyId, property.ratings, 'remove', null, null, property.reviews, writerIds, property.owner_id);

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
                    return { role: 'admin' };
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
        
        const user = await User.findOne({ email }) 
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
            account_type: 'host',
            $push: { notif: { typeOfNotif: 'converted-to-host', targettedId: userId } }
        });
        
        if(updatedUser.modifiedCount < 1 || updatedUser.acknowledged === false) {
            return res.status(500).send("server error");
        }

        // send notification to user email

        res.status(201).json({ message: 'success' });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
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
    convertToHost
};