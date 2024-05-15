const asyncHandler = require('express-async-handler');
const { isValidPassword, isValidUsername, isValidEmail, generateRandomCode, sendToEmail, isValidText, updateWhiteListAccessToken, deleteTokens, generateSecretKey } = require('../utils/logic.js');
const User = require('../Data/UserModel.js');
const VerCode = require('../Data/VerificationCode.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');
const Property = require('../Data/PropertyModel.js');
const WL = require('../Data/WhiteList.js');

const registerUser = async(req, res) => {

    try{

        console.log('registering new user');

        if(!req?.body)
            return res.status(400).json({message: "request error"});

        const { username, email, password } = req.body;

        if(!isValidPassword(password))
            return res.status(400).json({message: "pass error"});

        if(!isValidText(username))
            return res.status(400).json({message: "name error"});

        if(!isValidEmail(email))
            return res.status(400).json({message: "email error"});

        /* check email availability */
        const emailAvailable = await User.findOne({email: email});
        if(emailAvailable)
            return res.status(403).send("email error 2"); 

        /* hash the password */
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        if(!user) return res.status(400).json({ message: "input error" });

        res.status(201).send("Account Successfully created");

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'unknown error' });
    }

};

const sendCodeToEmail = asyncHandler(async(req, res) => {

    if(!req || !req.user) return res.status(400).send("request error");

    const { email } = req.user;

    if(!isValidEmail(email)) return res.status(403).send("please enter valid email!");

    /* check email availability */
    const emailAvailable = await User.findOne({ email });

    if(!emailAvailable) return res.status(403).json({ message: "register first error" });

    const code = generateRandomCode();

    const sendEmailRes = await sendToEmail(code, email, process.env.GMAIL_ACCOUNT, process.env.GMAIL_APP_PASSWORD);

    if(!sendEmailRes || sendEmailRes === false) return res.status(500).send("server error");

    const verCodeRes = await VerCode.findOneAndUpdate({ email: email }, { 
        code: code, 
        date: Date.now(),
        attempts: 0
    });

    if(!verCodeRes) {
        const verCodeCreate = await VerCode.create({
            email: email,
            code: code,
            date: Date.now(),
            attempts: 0
        });

        if(!verCodeCreate) return res.status(500).send("Eserver error");
    };

    res.status(201).send("Code sent Successfully");

});

const sendCodeToEmailSignPage = asyncHandler(async(req, res) => {

    if(!req || !req.query) return res.status(400).send("request error");

    const { email } = req.query;

    if(!isValidEmail(email)) return res.status(403).send("please enter valid email!");

    /* check email availability */
    const emailAvailable = await User.findOne({ email });

    if(!emailAvailable) return res.status(403).json({ message: "register first error" });

    const code = generateRandomCode();

    const sendEmailRes = await sendToEmail(code, email, process.env.GMAIL_ACCOUNT, process.env.GMAIL_APP_PASSWORD);

    if(!sendEmailRes || sendEmailRes === false) return res.status(500).send("server error");

    const verCodeRes = await VerCode.findOneAndUpdate({ email: email }, { 
        code: code, 
        date: Date.now(),
        attempts: 0
    });

    if(!verCodeRes) {
        const verCodeCreate = await VerCode.create({
            email: email,
            code: code,
            date: Date.now(),
            attempts: 0
        });

        if(!verCodeCreate) return res.status(500).send("Eserver error");
    };

    res.status(201).send("Code sent Successfully");

});

const verifyEmail = asyncHandler( async(req, res) => {

    if(!req || !req.user || !req.body) return res.status(403).send("request error");

    const { eCode } = req.body;
    
    const { email } = req.user;

    if(!isValidEmail(email) || !isValidText(eCode) || eCode.length !== 6) return res.status(403).send("Error in the request");

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

    const updateUser = await User.findOneAndUpdate({ email }, { email_verified: true });

    if(!updateUser) return res.status(500).send("server error");

    res.status(201).send("Successfully verified your Email");

});

const changePasswordSignPage = asyncHandler( async(req, res) => {

    if(!req || !req.body) return res.status(403).send("Error in the request");

    const { eCode, newPassword, email } = req.body;
    
    if(!isValidEmail(email) || !isValidText(eCode) || eCode.length !== 6 || !isValidPassword(newPassword)) return res.status(403).send("Error in the request");

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

    await VerCode.updateOne({ email: email }, { 
        code: null, date: null, attempts: 0 
    });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.updateOne({ email: email }, { 
        password: hashedPassword, attempts: 0
    });

    if(!user || user.modifiedCount < 1 || user.acknowledged === false) {
        return res.status(500).send("server error");
    }

    res.status(201).send("Successfully verified your Email");

});

const loginUser = asyncHandler(async (req, res) => {

    if(req?.body === null || req?.body === undefined)
        return res.status(404).json({message: "request error"});

    const { email, password } = req.body;
    
    if(!email || !password) return res.status(400).json({message: "empty field"});

    if(!isValidEmail(email)) return res.status(400).json({message: "email error"});
    
    if(!isValidPassword(password)) return res.status(400).json({message: "pass error"});

    let wasBlocked = false;

    let user = await User.findOneAndUpdate({ email: email }, { 
        $inc: { attempts: 1 } 
    });
    
    if(!user) return res.status(404).json({ message: "user not exist" });

    if(user.attempts > 30) return res.status(403).json({ message: 'attempts exceeded' });

    if(user.isBlocked){

        const elabsed = Date.now() - user.blocked.date_of_block;

        if(!user?.blocked?.date_of_block || !user?.blocked?.block_duration)
            return res.status(404).json({ message: 'block error' });

        if(elabsed <= user.blocked.block_duration) 
            return res.status(403).json({ 
                message: 'blocked', 
                blockTime: (user.blocked.block_duration - elabsed),
                blockReason: user.blocked.reason
            });
    
        const blockObj = {
            date_of_block: null,
            block_duration: null,
            reason: null
        };

        const updateBlockedUser = await User.findOneAndUpdate({ email: email }, 
            { blocked: blockObj, isBlocked: false }, 
            { new: true });

        if(!updateBlockedUser) return res.status(500).send("server error");

        user = updateBlockedUser;
       
        wasBlocked = true;

    };    

    if((await bcrypt.compare(password, user.password))){

        await User.updateOne({ _id: user._id, email: user.email }, {
            attempts: 0
        });

        const accessToken = jwt.sign({
            user: {
                username: user.username,
                email: user.email,
                id: user.id
            }
        },process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
        );

        const refreshToken = jwt.sign({
            user: {
                username: user.username,
                email: user.email,
                id: user.id
            }
        },process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "90d" }
        );

        if(await updateWhiteListAccessToken(user.email, accessToken, refreshToken)){

            res.status(201);
            res.cookie('_a_t', accessToken, { 
                path: '/', 
                // httpOnly: true, 
                sameSite: 'None', 
                secure: true, 
                maxAge: (30 * 24 * 60 * 60 * 1000)
            });
            res.cookie('_r_t', refreshToken, { 
                path: '/', 
                // httpOnly: true, 
                sameSite: 'None', 
                secure: true, 
                maxAge: (90 * 24 * 60 * 60 * 1000)
            });
            res.cookie('is_logined', 'true', { maxAge: (30 * 24 * 60 * 60 * 1000) });
            res.json(({ message: wasBlocked ? "was blocked" : "login success" }));
        } else {
            res.status(500).json({message: "server error"});
        }

    } else {
        return res.status(403).json({message: "input error"});
    }
});

const getUserInfo = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.user.id || !req.user.username) return res.status(401).json({ message: "login" });

    const { id, username, email } = req.user;

    if(!mongoose.Types.ObjectId.isValid(id) 
        || !isValidEmail(email) || !isValidText(username)) 
        return res.status(403).json({ message: "login" });

    const secretKey = generateSecretKey(id, username);

    const secret = await VerCode.findOneAndUpdate({ email }, {
        storage_key: secretKey, storage_key_date: Date.now(), storage_key_attempts: 0
    });

    if(!secret) {
        const createdSecret = await VerCode.create({
            email, storage_key: secretKey, storage_key_date: Date.now(), storage_key_attempts: 0
        });
        if(!createdSecret) return res.status(500).json({ message: 'try again error' });
    };

    const user = await User.findOne({ _id: id })
        .select('_id email_verified username email role address phone favourites books');

    res.status(200).json({
        user_id: user._id, 
        user_username: user.username, 
        user_email: user.email,
        address: user.address,
        phone: user.phone,
        is_verified: user.email_verified,
        tokenExp: req.token_exp,
        role: user.role,
        my_books: user.books,
        my_fav: user.favourites,
        storage_key: secretKey
    });

});

const refreshToken = asyncHandler( async (req, res) => {

    const refreshTokenCookie = req?.cookies?._r_t ? req.cookies._r_t : null;

    if(!refreshTokenCookie) return res.status(400).json({ message: "login error" });

    jwt.verify(
        refreshTokenCookie,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler( async(err, decoded) => {

            if(err || !decoded?.user?.email) 
                return res.status(403).json({ message: 'login error' });

            const validToken = await WL.findOne({ email: decoded.user.email });

            if(!validToken || !validToken.refreshToken || validToken.refreshToken !== refreshTokenCookie) 
                return res.status(403).json({ message: "login error" });

            const accessToken = jwt.sign({
                user: {
                    username: decoded.user.username,
                    email: decoded.user.email,
                    id: decoded.user.id
                }
            },process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "30d" }
            );
    
            const refreshToken = jwt.sign({
                user: {
                    username: decoded.user.username,
                    email: decoded.user.email,
                    id: decoded.user.id
                }
            },process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "90d" }
            );

            const updateList = await updateWhiteListAccessToken(decoded.user.email, accessToken, refreshToken);

            if(!updateList) return res.status(500).send("server error");
            
            res.status(201);
            res.cookie('_a_t', accessToken, { 
                path: '/', 
                // httpOnly: true, 
                // sameSite: 'None', 
                // secure: true, 
                maxAge: (30 * 24 * 60 * 60 * 1000)
            });
            res.cookie('_r_t', refreshToken, { 
                path: '/', 
                // httpOnly: true, 
                // sameSite: 'None', 
                // secure: true, 
                maxAge: (90 * 24 * 60 * 60 * 1000)
            });
            res.cookie('is_logined', 'true', { maxAge: (30 * 24 * 60 * 60 * 1000) });
            res.json({ message: "refreshed successfully" });

        })
    )
});

const changePassword = asyncHandler(async(req, res) => {

    if(!req || !req.body) return res.status(403).send("request error");

    const { email, newPassword, eCode } = req.body;

    if(!isValidEmail(email) 
        || !isValidText(eCode) || eCode.length !== 6 
        || !isValidPassword(newPassword)) return res.status(403).send("invalid inputs");

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

    /* hash the password */
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.updateOne({ email: email }, { 
        password: hashedPassword, attempts: 0, email_verified: true
    });

    if(!user || user.modifiedCount < 1 || user.acknowledged === false) {
        return res.status(500).send("server error");
    }

    res.status(201).send("Successfully changed password");

});

const logoutUser = asyncHandler(async(req, res) => {

    if(await deleteTokens(req.user.email) === false)
        return res.status(400).json({message: "server error"});

    res.clearCookie('_a_t');    
    res.clearCookie('_r_t');
    res.cookie('is_logined', 'false', { maxAge: 100000000000000 });
    res.clearCookie('csrf_token');
    res.clearCookie('csrf-token');
    res.status(201);
    res.send("Log out suucessfully");   

});

const deleteAccount = asyncHandler(async(req, res) => {

    if(!req || !req.user || !req.query) return res.status(400).json({ message: "request error" });

    const { id, email } = req.user;

    const { eCode } = req.query;

    if(!isValidEmail(email) || !mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: 'request error' });

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

    const findAccount = await User.findOne({ _id: id, email: email });

    if(!findAccount) return res.status(404).json({ message: "not exist error" });

    await WL.deleteOne({ email: email });

    await VerCode.deleteOne({ email: email });

    const deletedAccount = await User.deleteOne({ _id: id });

    if(!deletedAccount || deletedAccount.deleteCount <= 0)
        return res.status(500).json({ message: "server error" });
    
    await Property.deleteMany({ owner_id: id }); 

    res.clearCookie('_a_t');    
    res.clearCookie('_r_t');
    res.status(201);
    res.json({ message: 'success' });   

});

const getFavourites = async(req, res) => {

    try {

        if(!req || !req.user) return res.status(400).json({ message: 'request error' });

        const { id, email } = req.user;

        if(!isValidEmail(email) || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'request error' });

        const user = await User.findOne({ _id: id, email }).select('_id favourites');

        if(!user || !user.favourites || user.favourites.length <= 0) 
            return res.status(404).json({ message: 'not found error' });

        const properties = await Property.find({ _id: user.favourites })
            .limit(300).sort({ createdAt: -1 })
            .select('_id images title description ratings city neighbourhood price discount specific_catagory');    

        if(!properties) 
            return res.status(404).json({ message: 'not found error' });

        return res.status(200).json(properties);    
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

const addToFavourite = async(req, res) => {

    try {

        if(!req || !req.user || !req.params) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const user = await User.findOneAndUpdate({ _id: id, email_verified: true }, {
            $addToSet: { favourites: propertyId }
        }, { new: true }).select('_id favourites');

        if(!user) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(user.favourites);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

const removeFromFavourite = async(req, res) => {

    try {

        if(!req || !req.user || !req.params) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const user = await User.findOneAndUpdate({ _id: id }, {
            $pull: { favourites: propertyId }
        }, { new: true }).select('_id favourites');

        if(!user) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(user.favourites);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

const getBooks = async(req, res) => {

    try {

        if(!req || !req.user) return res.status(400).json({ message: 'request error' });

        const { id, email } = req.user;

        if(!isValidEmail(email) || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'request error' });

        const user = await User.findOne({ _id: id, email }).select('_id books');

        if(!user || !user.books || user.books.length <= 0) 
            return res.status(404).json({ message: 'not found error' });

        let idsArr = [];
        for (let i = 0; i < user.books.length; i++) {
            idsArr.push(user.books[i].property_id);
        };

        const properties = await Property.find({ _id: idsArr })
            .limit(300).sort({ createdAt: -1 })
            .select('_id images title description ratings city neighbourhood price discount specific_catagory');    

        if(!properties) return res.status(404).json({ message: 'not found error' });

        let idsToPull = [];    
        for (let i = 0; i < properties.length; i++) {
            if(properties[i].owner_id === id){
                idsToPull.push(properties[i]._id);
            }
        };

        if(idsToPull.length > 0){
            await User.updateOne({ _id: id }, {
                $pull: { books: { property_id: idsToPull } }
            });
        };

        return res.status(200).json(properties);    
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

const addToBooks = async(req, res) => {

    try {

        if(!req || !req.user || !req.params || !req.body) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;
        const { startDate, endDate } = req.body;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        if(startDate && typeof startDate !== 'number') return res.status(400).json({ message: 'date error' });

        if(endDate && typeof endDate !== 'number') return res.status(400).json({ message: 'date error' });    

        const user = await User.findOneAndUpdate({ 
            _id: id, email_verified: true, books: { $elemMatch: { property_id: propertyId } }
        }, {
            $set: { "books.$" : { 
                property_id: propertyId, 
                date_of_book_start: startDate ? startDate : Date.now(), 
                date_of_book_end: endDate ? endDate : Date.now() + 86400000
            }}
        }, { new: true }).select('_id books');

        let returnBooks = null;

        if(!user) {

            const pushToUser = await User.findOneAndUpdate({ _id: id }, {
                $push: { books: { property_id: propertyId, date_of_book_start: startDate, date_of_book_end: endDate } }
            }, { new: true }).select('_id books');

            if(!pushToUser || pushToUser.modifiedCount < 1 || pushToUser.acknowledged === false)
                return res.status(403).json({ message: 'access error' });

            returnBooks = pushToUser.books;

        } else {
            returnBooks = user.books;
        }

        return res.status(201).json(returnBooks);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

const removeFromBooks = async(req, res) => {

    try {

        if(!req || !req.user || !req.params) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const user = await User.findOneAndUpdate({ _id: id }, {
            $pull: { books: { property_id: propertyId } }
        }, { new: true }).select('_id books');

        if(!user) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(user.books);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

const editUser = async(req, res) => {

    try {

        if(!req || !req.user || !req.body) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;

        const { updateUsername, updateAddress, updatePhone, updateUsernameEN } = req.body;

        if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'request error' });
        
        if(updateUsername && !isValidText(updateUsername)) return res.status(400).json({ message: 'username error' });

        if(updateAddress && !isValidText(updateAddress)) return res.status(400).json({ message: 'address error' });

        if(updatePhone && !isValidText(updatePhone)) return res.status(400).json({ message: 'phone error' });
        
        if(updateUsernameEN && !isValidText(updateUsernameEN)) return res.status(400).json({ message: 'phone error' });

        let updateObj = {};

        if(updateAddress) updateObj.address = updateAddress;
        if(updatePhone) updateObj.address = updatePhone;
        if(updateUsername) updateObj.address = updateUsername;
        if(updateUsernameEN) updateObj.address = updateUsernameEN;

        const user = await User.findOneAndUpdate({ _id: id, email_verified: true }, updateObj);

        if(!user) return res.status(400).json({ message: 'access error' });
        
        return res.status(201).json({ message: 'success' });
    
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: err.message });
    }

};

module.exports = {
    registerUser, sendCodeToEmail, sendCodeToEmailSignPage, 
    verifyEmail, changePasswordSignPage, loginUser,
    getUserInfo, refreshToken, changePassword,
    logoutUser, deleteAccount, getFavourites,
    addToFavourite, removeFromFavourite,
    getBooks, addToBooks, removeFromBooks, editUser
};