const asyncHandler = require('express-async-handler');
const { isValidPassword, isValidUsername, isValidEmail, generateRandomCode, sendToEmail, isValidText, updateWhiteListAccessToken } = require('../utils/logic');
const User = require('../Data/UserModel');
const VerCode = require('../Data/VerificationCode');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');

const registerUser = async(req, res) => {

    try{

        if(!req?.body)
            return res.status(400).json({message: "request error"});

        const { username, email, password, captchaToken } = req.body;

        console.log('username: ', username, ' email: ', email, ' password: ', password);
            
        if(!username || !email || !password)
            return res.status(402).json({message: "empty field"});

        // if(!captchaToken) return res.status(403).send("captcha error");

        // const captchaRes = await axios.post(
        //     `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
        // );

        // if (!captchaRes.data.success) return res.status(403).send("captcha error");

        if(!isValidPassword(password))
            return res.status(400).json({message: "pass error"});

        if(!isValidUsername(username))
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
        return res.status(500).json({ message: 'unknown error' });
    }

};

const sendCodeToEmail = asyncHandler( async(req, res) => {

    if(!req?.user) return res.status(404).send("Error in request");

    const { email } = req.user;

    if(!isValidEmail(email)) return res.status(403).send("please enter valid email!");

    /* check email availability */
    const emailAvailable = await User.findOne({ email: email });

    if(!emailAvailable) return res.status(403).json({ message: "please register with the email before verifing it" });

    if(emailAvailable.email_verified === true) return res.status(400).json({ message: 'Your account is already verified' });

    const code = generateRandomCode();

    const sendEmailRes = await sendToEmail(code, email, process.env.GMAIL_ACCOUNT, process.env.GMAIL_APP_PASSWORD);

    if(!sendEmailRes || sendEmailRes === false) return res.status(501).send("We encountered an error when sending the code please try again later");

    const verCodeRes = await VerCode.findOneAndUpdate({ email: email }, { code: code, date: Date.now() });

    if(!verCodeRes) {
        const verCodeCreate = await VerCode.create({
            email: email,
            code: code,
            date: Date.now()
        });

        if(!verCodeCreate) return res.status(501).send("Error in our server please try again later");
    };

    res.status(201).send("Code sent Successfully");

});

const verifyEmail = asyncHandler( async(req, res) => {

    if(!req.user || !req?.body) return res.status(403).send("Error in the request");

    const { eCode } = req.body;
    
    const { email } = req.user;

    if(!isValidEmail(email) || !isValidText(eCode) || eCode.length !== 6) return res.status(403).send("Error in the request");

    const verCode = await VerCode.findOne({ email: email, code: eCode });

    if(!verCode || !verCode.date) return res.status(400).send("Send code first");

    if(Date.now() - verCode.date > (60 * 60 * 1000)) return res.status(403).send("It's had been more than hour, please re send code");

    const updateVerCode = await VerCode.findOneAndUpdate({ email: email }, { code: null, date: null });

    const updateUser = await User.findOneAndUpdate({ email }, { email_verified: true });

    if(!updateVerCode || !updateUser) return res.status(501).send("Error in our server, re send verification");

    res.status(200).send("Successfully verified your Email :)");

});

const loginUser = asyncHandler(async (req, res) => {

    if(req?.body === null || req?.body === undefined)
        return res.status(404).json({message: "request error"});

    const { email, password, captchaToken } = req.body;

    console.log('email: ', email, ' password: ', password);
    
    if(!email || !password) return res.status(400).json({message: "empty field"});

    if(!isValidEmail(email)) return res.status(400).json({message: "email error"});
    
    if(!isValidPassword(password)) return res.status(400).json({message: "pass error"});

    // if(!captchaToken) return res.status(403).send("captcha error");

    // const captchaRes = await axios.post(
    //     `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
    // );

    // if (!captchaRes.data.success) return res.status(403).send("captcha error");    

    const user = await User.findOne({ email: email });
    
    if(!user) return res.status(404).json({message: "user not exist"});

    if(user.isBlocked){

        const elabsed = Date.now() - user.blocked.date_of_block;

        if(elabsed <= user.blocked.block_duration) 
            return res.status(402).json({ message: 'blocked', blockTime: (user.blocked.block_duration - elabsed) });
    
        const blockObj = {
            date_of_block: null,
            block_duration: null
        };

        const updateBlockedUser = await User.findOneAndUpdate({ email: email }, { blocked: blockObj, isBlocked: false });

        if(!updateBlockedUser) return res.status(501).send("server error");

        const obj = {blocked_user_id: user._id};

        await Admin.updateOne({ blocked_users_ids: obj }, { $pull: { blocked_users_ids: obj } });
        
    };    

    if((await bcrypt.compare(password, user.password))){

        const accessToken = jwt.sign({
            user: {
                username: user.username,
                email: user.email,
                id: user.id
            }
        },process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10d" }
        );

        const refreshToken = jwt.sign({
            user: {
                username: user.username,
                email: user.email,
                id: user.id
            }
        },process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "30d" }
        );

        if(await updateWhiteListAccessToken(user.email, accessToken, refreshToken)){

            res.status(201);
            res.cookie('_a_t', accessToken, { 
                path: '/', 
                httpOnly: true, 
                sameSite: 'None', 
                secure: true, 
                maxAge: (10 * 24 * 60 * 60 * 1000)
            });
            res.cookie('_r_t', refreshToken, { 
                path: '/', 
                httpOnly: true, 
                sameSite: 'None', 
                secure: true, 
                maxAge: (30 * 24 * 60 * 60 * 1000)
            });
            res.json(({ message: "login success" }));
        } else {
            res.status(501).json({message: "server error"});
        }

    } else {
        return res.status(403).json({message: "input error"});
    }
});

const getUserInfo = asyncHandler(async(req, res) => {

    console.log('info reached');

    if(!req || !req.user || !req.user.id || !req.user.username) return res.status(401).json({ message: "login" });

    if(!mongoose.Types.ObjectId.isValid(req.user.id)) return res.status(403).json({ message: "login" });

    const user = await User.findOne({ _id: req.user.id });

    res.status(200).json({
        user_id: user.id, 
        user_username: user.username, 
        tokenExp: req.token_exp,
        role: user.role
    });

});

const refreshToken = asyncHandler(async(req, res) => {});
const changePassword = asyncHandler(async(req, res) => {});
const changePasswordEmailCode = asyncHandler(async(req, res) => {});
const logoutUser = asyncHandler(async(req, res) => {});
const deleteAccount = asyncHandler(async(req, res) => {});

module.exports = {
    registerUser, sendCodeToEmail, verifyEmail, loginUser,
    getUserInfo, refreshToken, changePassword, changePasswordEmailCode,
    logoutUser, deleteAccount
};