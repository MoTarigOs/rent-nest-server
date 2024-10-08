const asyncHandler = require('express-async-handler');
const { isValidPassword, isValidUsername, isValidEmail, generateRandomCode, sendToEmail, isValidText, updateWhiteListAccessToken, deleteTokens, generateSecretKey, isValidNumber, sendNotification, sendAdminNotification } = require('../utils/logic.js');
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

        const { 
            username, email, password, 
            firstName, lastName, accountType, 
            phone, address 
        } = req.body;

        // console.log(req.body);

        if(!isValidPassword(password))
            return res.status(400).json({message: "pass error"});

        if(!isValidUsername(username))
            return res.status(400).json({message: "name error"});

        if(!isValidEmail(email))
            return res.status(400).json({message: "email error"});

        if(!isValidText(firstName) || firstName?.length > 20) 
            return res.status(400).json({message: "first name error"});

        if(!isValidText(lastName) || lastName?.length > 20) 
            return res.status(400).json({message: "last name error"});

        if(accountType?.length > 0 && accountType !== 'guest' && accountType !== 'host') 
            return res.status(400).json({message: "account type error"});

        if(phone?.length > 0 && (!isValidText(phone) || phone?.length > 20)) 
            return res.status(400).json({message: "phone error"});

        if(address?.length > 0 && (!isValidText(address) || address?.length > 20)) 
            return res.status(400).json({message: "address error"});

        /* check email availability */
        const emailAvailable = await User.findOne({ email: email?.toLowerCase() }).select('email username');
        if(emailAvailable)
            return res.status(403).json({ message: "email error 2" }); 
        if(emailAvailable?.username === username)
            return res.status(403).json({ message: "username error" }); 

        /* hash the password */
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email: email?.toLowerCase(),
            password: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            phone,
            address,
            ask_convert_to_host: accountType?.length > 0 ? true : false
        });

        if(!user) return res.status(400).json({ message: "input error" });

        await sendAdminNotification('new-user', user._id, user._id, user?.email);

        res.status(201).json({ message: "Account Successfully created" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'unknown error' });
    }

};

const checkUsername = async(req, res) => {

    try {

        const { username } = req.params;

        console.log('checking username: ', username);

        if(!isValidUsername(username)) 
            return res.status(400).json({ message: 'username error' });

        const exist = await User.findOne({ username }).select('_id username');
        
        if(exist) return res.status(404).json({ message: 'username error' });
        
        return res.status(200).json({ message: 'success' });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
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
        attempts: 0,
        // $inc: { total_codes_sent: 1 }
    });

    if(!verCodeRes) {
        const verCodeCreate = await VerCode.create({
            email: email,
            code: code,
            date: Date.now(),
            attempts: 0
        });

        if(!verCodeCreate) return res.status(500).send("server error");
    } else {
        if(verCodeRes.total_codes_sent > 500) return res.status(403).send('send code limit exceeded');
    }
    
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

    const updateUser = await User.findOneAndUpdate({ email }, { 
        email_verified: true
    }).select('_id');

    if(!updateUser) return res.status(500).send("server error");

    await sendNotification(null, 'email-verified', null, updateUser._id);

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

    const user = await User.findOneAndUpdate({ email: email }, { 
        password: hashedPassword, attempts: 0, email_verified: true
    }).select('_id');

    if(!user) {
        return res.status(500).send("server error");
    }

    await sendNotification(null, 'password-change', null, user._id);

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

    let user = await User.findOneAndUpdate({ email: email?.toLowerCase() }, { 
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

    if(!secretKey) return res.status(500).json({ message: 'refresh the page' });

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
        .select('_id email_verified username email role address ask_convert_to_host addressEN phone favourites books notif first_name last_name first_name_en last_name_en account_type notif_enabled');

    if(!user) return res.status(404).json({ message: 'not exist error' });

    res.status(200).json({
        user_id: user._id, 
        user_username: user.username, 
        user_email: user.email,
        address: user.address,
        addressEN: user.addressEN,
        phone: user.phone,
        is_verified: user.email_verified,
        tokenExp: req.token_exp,
        role: user.role,
        my_books: user.books,
        my_fav: user.favourites,
        storage_key: secretKey,
        notifications: user.notif,
        firstName: user.first_name,
        lastName: user.last_name,
        firstNameEN: user.first_name_en,
        lastNameEN: user.last_name_en,
        accountType: user.account_type,
        waitingToBeHost: user.ask_convert_to_host,
        notifEnabled: user.notif_enabled
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

    const user = await User.findOneAndUpdate({ email: email }, { 
        password: hashedPassword, attempts: 0, email_verified: true
    }).select('_id');

    if(!user) {
        return res.status(500).send("server error");
    }

    await sendNotification(null, 'password-change', null, user._id);

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

const askConvertToHost = async(req, res) => {

    try {

        const id = req?.user?.id;

        if(!id || !mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: "request error" });

        const updatedUser = await User.updateOne({ _id: id }, {
            ask_convert_to_host: true
        }).select('email');

        console.log(updatedUser);

        if(updatedUser.modifiedCount < 1 || updatedUser.acknowledged === false) {
            return res.status(500).send("server error");
        }

        await sendAdminNotification('ask-for-host', id, id, updatedUser?.email);

        res.status(201).json({ message: 'success' });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

};

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

        const { skip, cardsPerPage } = req.query;

        if(!isValidEmail(email) || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'request error' });

        const user = await User.findOne({ _id: id, email }).select('_id favourites');

        if(!user || !user.favourites || user.favourites.length <= 0) 
            return res.status(404).json({ message: 'not found error' });

        const properties = await Property.find({ _id: user.favourites }).limit(Number(cardsPerPage) > 36 ? 36 : Number(cardsPerPage))
            .select('_id map_coordinates images title description booked_days ratings city neighbourhood en_data prices discount specific_catagory')
            .sort({ createdAt: -1 }).skip(isValidNumber(Number(skip), 36) ? Number(skip) : 0);
            
        if(!properties || properties.length <= 0) return res.status(400).json({ message: 'not exist error' });

        const count = await Property.find({ _id: user.favourites }).countDocuments();

        return res.status(200).json({ properties, count });
        
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

        const { skip, cardsPerPage } = req.query;

        console.log('books');

        if(!isValidEmail(email) || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'request error' });

        const user = await User.findOne({ _id: id, email }).select('_id books');

        if(!user || !user.books || user.books.length <= 0) 
            return res.status(404).json({ message: 'not found error' });

        let idsArr = [];
        for (let i = 0; i < user.books.length; i++) {
            idsArr.push(user.books[i].property_id);
        };

        const properties = await Property.find({ _id: idsArr }).limit(Number(cardsPerPage) > 36 ? 36 : Number(cardsPerPage))
        .select('_id map_coordinates images title description booked_days ratings city neighbourhood en_data prices discount specific_catagory')
        .sort({ createdAt: -1 }).skip(isValidNumber(Number(skip), 36) ? Number(skip) : 0);

        if(!properties || properties.length <= 0) return res.status(400).json({ message: 'not exist error' });

        const count = await Property.find({ _id: idsArr }).countDocuments();

        return res.status(200).json({ properties, count });
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

const addToBooks = async(req, res) => {

    try {

        if(!req || !req.user || !req.params || !req.body) return res.status(400).json({ message: 'request error' });

        const { id, username, email } = req.user;
        const { propertyId } = req.params;
        const { startDate, endDate } = req.body;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        if(startDate && typeof startDate !== 'number') return res.status(400).json({ message: 'date error' });

        if(endDate && typeof endDate !== 'number') return res.status(400).json({ message: 'date error' });    
        
        const property = await Property.findOne({ _id: propertyId }).select('owner_id title images unit_code en_data.titleEN');

        if(!property) return res.status(404).json({ message: 'not exist error' });

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

            if(!pushToUser)
                return res.status(403).json({ message: 'access error' });

            returnBooks = pushToUser.books;

            await User.updateOne({ _id: property.owner_id }, {
                $push: { book_guests : { 
                    guest_id: id,
                    booked_property_id: propertyId,
                    booked_property_title: property.title,
                    booked_property_titleEN: property.en_data.titleEN,
                    booked_property_unit: property.unit_code,
                    booked_property_image: property.images?.at(0),
                    guest_name: username
                }}
            });

            await sendNotification(null, 'book', propertyId, property.owner_id, id, username);

        } else {

            returnBooks = user.books;

            await User.updateOne({ _id: property.owner_id }, {
                $push: { book_guests : { 
                    guest_id: id,
                    booked_property_id: propertyId,
                    booked_property_title: property.title,
                    booked_property_titleEN: property.en_data.titleEN,
                    booked_property_unit: property.unit_code,
                    booked_property_image: property.images?.at(0),
                    guest_name: username
                }}
            });

            await sendNotification(null, 'book', propertyId, property.owner_id, id, username);

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

        const property = await Property.findOne({ _id: propertyId }).select('owner_id');

        if(property){
            await User.findOneAndUpdate({ _id: property.owner_id }, {
                $pull: { book_guests: { guest_id: id, booked_property_id: propertyId } }
            });
        }

        return res.status(201).json(user.books);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

const getGuests = async(req, res) => {

    try {

        const id = req?.user?.id;

        if(!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'request error' });
        
        const user = await User.findOne({ _id: id }).select('book_guests');

        if(!user) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(user.book_guests);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }
};

const verifyGuestBook = async(req, res) => {

    try {

        if(!req || !req.query) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;

        const { guestId, propertyId } = req.query;

        if(!mongoose.Types.ObjectId.isValid(guestId) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });
            
        const user = await User.updateOne({ 
            _id: guestId, books: { $elemMatch: { property_id: propertyId } }
        }, {
            $set: { "books.$.verified_book" : true }
        });

        console.log('user updateOne: ', user);

        if(!user?.acknowledged) return res.status(404).json({ message: 'request error' });

        const updatedUserGuestArray = await User.findOneAndUpdate({ _id: id }, {
            $pull: { book_guests: { guest_id: guestId, booked_property_id: propertyId } }
        }, { new: true }).select('book_guests');

        res.status(201).json(updatedUserGuestArray?.book_guests);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }
};

const deleteGuestBook = async(req, res) => {

    try {

        if(!req || !req.query) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;

        const { guestId, propertyId } = req.query;

        if(!mongoose.Types.ObjectId.isValid(guestId) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const updatedUserGuestArray = await User.findOneAndUpdate({ _id: id }, {
            $pull: { book_guests: { guest_id: guestId, booked_property_id: propertyId } }
        }, { new: true }).select('book_guests');

        return res.status(201).json(updatedUserGuestArray?.book_guests);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

};

const deleteNotifications = async(req, res) => {

    try {
       
        const userId = req?.user?.id;

        if(!mongoose.Types.ObjectId.isValid(userId)) 
            return res.status(400).json({ message: 'request error' });

        const idsArr = req?.params?.ids?.split(',');

        console.log('idsArr: ', idsArr);

        if(!idsArr?.length > 0 || !Array.isArray(idsArr))
            return res.status(400).json({ message: 'request error' });

        for (let i = 0; i < idsArr.length; i++) {
            if(!mongoose.Types.ObjectId.isValid(idsArr[i]))
                return res.status(400).json({ message: 'request error' });
        }    

        const user = await User.updateOne({ _id: userId }, {
            $pull: {
                notif: { 
                  _id: { $in: idsArr }
                }
            }
        });

        if(user.modifiedCount < 1 || user.acknowledged === false) {
            return res.status(500).send("server error");
        }

        res.status(201).json({ message: 'sucess' });
        
    } catch (err) {
        console.log(err);    
        return res.status(500).send("server error");
    }

};

const enableNotif = async(req, res) => {

    try {

        const id = req?.user?.id;
        const state = req?.query?.state;

        console.log('notif to : ', state === 'true');

        if(!id || !state || (state !== 'false' && state !== 'true') || !mongoose.Types.ObjectId.isValid(id)) 
            return res.status(500).json({ message: 'request error' });

        const user = await User.updateOne({ _id: id }, { notif_enabled: state === 'true' });
        
        if(!user || user.modifiedCount < 1 || user.acknowledged === false) {
            return res.status(500).json({ message: "server error" });
        }

        res.status(200).json({ message: 'success' });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'server error' });
    }

};

const editUser = async(req, res) => {

    try {

        if(!req || !req.user || !req.body) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;

        const { 
            updateFirstName, updateFirstNameEN, updateLastName, 
            updateLastNameEN, updateUsername, updateAddress, 
            updateAddressEN, updatePhone,  
        } = req.body;

        // console.log(req.body);

        if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'request error' });
        
        if(updateFirstName && !isValidText(updateFirstName)) return res.status(400).json({ message: 'first name error' });
        if(updateFirstNameEN && !isValidText(updateFirstNameEN)) return res.status(400).json({ message: 'first name en error' });
        if(updateLastName && !isValidText(updateLastName)) return res.status(400).json({ message: 'last name error' });
        if(updateLastNameEN && !isValidText(updateLastNameEN)) return res.status(400).json({ message: 'last name en error' });
        if(updateUsername && !isValidUsername(updateUsername)) return res.status(400).json({ message: 'username error' });
        if(updateAddress && !isValidText(updateAddress)) return res.status(400).json({ message: 'address error' });
        if(updateAddressEN && !isValidText(updateAddressEN)) return res.status(400).json({ message: 'address en error' });
        if(updatePhone && !isValidText(updatePhone)) return res.status(400).json({ message: 'phone error' });

        let updateObj = {};

        if(updateFirstName) updateObj.first_name = updateFirstName;
        if(updateFirstNameEN) updateObj.first_name_en = updateFirstNameEN;
        if(updateLastName) updateObj.last_name = updateLastName;
        if(updateLastNameEN) updateObj.last_name_en = updateLastNameEN;
        if(updateUsername) updateObj.username = updateUsername;
        if(updateAddress) updateObj.address = updateAddress;
        if(updateAddressEN) updateObj.addressEN = updateAddressEN;
        if(updatePhone) updateObj.phone = updatePhone;

        const user = await User.findOneAndUpdate({ _id: id, email_verified: true }, updateObj, { new: true })
        .select('username address addressEN phone first_name first_name_en last_name last_name_en');

        console.log(user);

        if(!user) return res.status(400).json({ message: 'access error' });
        
        return res.status(201).json(user);
    
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

module.exports = {
    registerUser, checkUsername, sendCodeToEmail, sendCodeToEmailSignPage, 
    verifyEmail, changePasswordSignPage, loginUser,
    getUserInfo, refreshToken, changePassword,
    logoutUser, askConvertToHost, deleteAccount, getFavourites,
    addToFavourite, removeFromFavourite,
    getBooks, addToBooks, removeFromBooks, enableNotif,
    getGuests, verifyGuestBook, deleteGuestBook, deleteNotifications, editUser
};