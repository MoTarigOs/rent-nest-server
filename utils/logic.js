const WL = require('../Data/WhiteList');
const axios = require('axios');
require('dotenv').config();
const path = require('path');
const fsPromise = require('fs').promises;
var nodemailer = require('nodemailer');
const givenSet = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
const testChars = 'ABCDEFGHIJKLMNOPQRSTUVWYZabcdefghijklmnopqrstuvwyz -_.,+=!~;:#@0123456789أابتثجحخدذرزعغلمنهويئسشصضطكفقةىءؤ؛×÷ّآ,؟.';
const validator = require('validator');

const allowedSpecificCatagory = [
    'farm', 'apartment', 'resort', 'commercial', 
    'micro', 'sedan', 'high', 'luxury', 'mini-bus', 'sport'
];

const citiesArray = [{ city_id: "AMM", value: "Amman", arabicName: "عمان" }, { city_id: "AQJ", value: "Aqaba", arabicName: "العقبة" }, { city_id: "IRB", value: "Irbid", arabicName: "اربد" }, { city_id: "ZAR", value: "Zarqa", arabicName: "الزرقاء" }, { city_id: "KWI", value: "Kufranjah", arabicName: "كفرنجة" }, { city_id: "MDA", value: "Madaba", arabicName: "مادبا" }, { city_id: "KAR", value: "Karak", arabicName: "الكرك" }, { city_id: "TAF", value: "Tafila", arabicName: "الطفيلة" }, { city_id: "MAF", value: "Maan", arabicName: "معان" }, { city_id: "AJL", value: "Ajloun", arabicName: "عجلون" }];

const getCitiesArrayForFilter = () => {
    let arr = [];
    citiesArray.forEach((i) => arr.push(i.value));
    return arr;
}

const updateWhiteListAccessToken = async (email, accessToken, refreshToken) => {
    try{
        if(!email || !accessToken || !refreshToken)
            return false; 

        if(!accessToken || !refreshToken)
            return false;

        const token = await WL.findOneAndUpdate({email}, {accessToken: accessToken, refreshToken: refreshToken});

        if(!token) {
            const createWLuser = await WL.create({
                email,
                accessToken: accessToken,
                refreshToken: refreshToken
            });

            if(!createWLuser)
                return false;

            return true;
        }

        return true;    
    } catch(err){
        return false;
    }
}

const checkWhiteListAccessToken = async (email, accessToken) => {
    try{

        if(!email || !accessToken)
            return false;

        const token = await WL.findOne({email});

        if(!token?.accessToken)  
            return false;

        if(token.accessToken !== accessToken)
            return false;

        return true;    
    } catch(err){
        return false;
    }
}

const deleteTokens = async (email) => {
    try{
        const delTokens = await WL.findOneAndUpdate({email}, {accessToken: null, refreshToken: null});
        if(!delTokens)
            return false;
        return true; 
    } catch (err){
        console.log(err);
        return false;
    }
}

const fetchAccessToken = async(accessToken) => {

    const url = process.env.GOOGLE_GET_USER_INFO_FROM_TOKEN;

    const axiosConfig = {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        }
    }

    try{
        const res = await axios.post(url, null, axiosConfig);
        return res;
    } catch(err){
        console.log(err.message);
        return null;
    }
}

const getRandomPassword = () => {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const passwordLength = 32;
    let password = "";

    for (var i = 0; i <= passwordLength; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        password += chars.substring(randomNumber, randomNumber +1);
    }

    return password;
}

const validateImageType = (image) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if(allowedTypes.includes(image.mimetype))
      return true;
    return false;
}

const generateRandomCode = () => {

    let code = "";
    for(let i = 0; i < 6; i++) {
        const pos = Math.floor(Math.random()*givenSet.length);
        code += givenSet[pos];
    }
    return code;

};

const sendToEmail = async(msg, userEmail, gmailAccount, appPassword) => {

    return new Promise(function(resolve, reject) {

        try{

            const sanitizedText = validator.escape(msg);

            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailAccount,
                    pass: appPassword  //App password not actual account password
                }
            });

            let htmlText = `<<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="description" content="description here"/>
                <title>ShoeMade</title>
            </head>
            <body style="font-family: sans-serif; background-color: #f5f5f5; width: 380px;">
            
                <p style="display: none;">Check our best shoes deals!</p>
            
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
                    <tr>
                        <td align="center" style="padding: 16px; width: 100%; background-color: #d10000; border-radius: 8px;">
                            <h3 style="width: 100%; text-align: start; margin-left: 16px;"><img src="https://f003.backblazeb2.com/file/personal-use-mot-tarig/shoemade_html_email_images/shoemade_logo.png" style="width: 72px;"/></h3>
                            <img src="https://f003.backblazeb2.com/file/personal-use-mot-tarig/shoemade_html_email_images/nike_red_shoe.png" style="width: 100%; max-width: 280px; margin-top: -96px;"/>
                            <h3 style="color: white; font-size: 1.2rem;">Most sold Shoe in our store</h3>
                            <p style="color: white; font-size: 0.96rem;">We are giving away 50 Red Dragon Shoe for free <a style="color: white; text-decoration: underline;">visit website</a> and claim yours.</p>
                        </td>
                    </tr>
                </table>
            
                <table cellpadding="8px" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
                    <tr>
                        <td align="center">
                            <p style="margin-top: 32px; color: #3f3f3f;">Colors</p>
                        </td>
                    </tr>
                </table>
            
                <table cellpadding="8px" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
                    <tr>
                        <td align="center" style="width: 33.3333%;"><img src="https://f003.backblazeb2.com/file/personal-use-mot-tarig/shoemade_html_email_images/blue_nike_shoe.jpg" style="width: 100%; margin-top: -12px; height: 100%; border-radius: 8px;"/><h4 style="margin: 0; margin-top: 12px;">Blue Dragon</h4><p style="margin: 0; font-size: 0.7rem; margin-top: 8px;">Only 2000 pieces</p></td>
                        <td align="center" style="width: 33.3333%;"><img src="https://f003.backblazeb2.com/file/personal-use-mot-tarig/shoemade_html_email_images/purple_nike_shoe.jpg" style="width: 100%; margin-top: -12px; height: 100%; border-radius: 8px;"/><h4 style="margin: 0; margin-top: 12px;">Purple Dragon</h4><p style="margin: 0; font-size: 0.7rem; margin-top: 8px;">Only 1200 pieces</p></td>
                        <td align="center" style="width: 33.3333%;"><img src="https://f003.backblazeb2.com/file/personal-use-mot-tarig/shoemade_html_email_images/green_nike_shoe.jpg" style="width: 100%; margin-top: -12px; height: 100%; border-radius: 8px;"/><h4 style="margin: 0; margin-top: 12px;">Green Dragon</h4><p style="margin: 0; font-size: 0.7rem; margin-top: 8px;">Only 8000 pieces</p></td>
                    </tr>
                </table>
            
                <table cellpadding="8px" cellspacing="0" border="0" width="100%" bgcolor="#ffffff" style="max-width: 600px; margin: 24px auto;">
                    <tr>
                        <td align="center">
                            <h2 style="margin-top: 32px;">Best Shoes Deals!</h2>
                            <p>Shoe Made Store, Where reality takes a detour and creativity reigns supreme. Nestled on the corner of Imagination Avenue and Dreamers Lane <a style="color: red;">see details</a> this fantastical boutique beckons with its neon sign flickering in hues of cerulean and stardust. The entrance, guarded by a pair of enchanted wingtip brogues, creaks open to reveal a kaleidoscope of footwear wonder.</p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <img src="https://f003.backblazeb2.com/file/personal-use-mot-tarig/shoemade_html_email_images/yellowgreen_shoes.jpg" style="width: 100%; max-height: 200px; object-fit: cover;"/>
                            <h2 style="margin: 16px 0 8px 0;">400+ Shoes Types</h2>
                            <p style="margin: 0;">We are selling more than 400 different shoes, <a style="text-decoration: underline;">See products</a> and select what suits you.</p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <img src="https://f003.backblazeb2.com/file/personal-use-mot-tarig/shoemade_html_email_images/another_shoes.jpg" style="width: 100%; max-height: 200px; object-fit: cover; margin-top: 32px;"/>
                            <h2 style="margin: 16px 0 8px 0;">High Quality</h2>
                            <p style="margin: 0 0 8px 0;">We do not sell any cheap product, all the shoes are authenticated, so they are made of high quality materials.</p>
                        </td>
                    </tr>
                </table>
            
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto;">
                    <tr>
                        <td align="center" style="padding: 20px;">
                            <p style="color: #888;">You're receiving this email because you subscribed to our newsletter. If you wish to unsubscribe, <a style="color: red; text-decoration: none;">click here</a>.</p>
                        </td>
                    </tr>
                </table>
            
            </body>
            </html>`;

            // console.log("personal email: ", process.env.PERSONAL_EMAIL);

            // if(userEmail !== process.env.PERSONAL_EMAIL){
            //     htmlText = `<html lang="en" style="margin: 0; padding: 0; width: 100%"><body style="margin: 0; padding: 0; width: 100%"><div style="width: 100%; display: flex; justify-content: center; align-items: center;"><h1 style="height: fit-content; font-size: 42px; border: solid 2px; border-radius: 4px; padding: 8px 16px; letter-spacing: 1px;">${sanitizedText}</h1></div></body></html>`
            // } else {
            //     htmlText = `<html lang="en" style="margin: 0; padding: 0; width: 100%"><body style="margin: 0; padding: 0; width: 100%"><div style="width: 100%; display: flex; flex-direction: column; gap: 8px; padding: 12px;">${sanitizedText}</div></body></html>`
            // }
    
            var mailOptions = {
                from: gmailAccount,
                to: userEmail,
                subject: 'MoSocial', //title
                html: htmlText
            };
    
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    reject(false);
                } else {
                    resolve(true)
                }
            });
        } catch(err){
            console.log(err.message);
        }

    });
};

const logDeletedPic = async(pics) => {

    console.log("pics: ", pics);

    if(!pics || pics.length <= 0) return;

    let logObject = "";

    for (let i = 0; i < pics.length; i++) {
        logObject += validator.escape(`{"name": "${pics[i]}"}` + "\n");
    }

    await fsPromise.appendFile(path.join(__dirname, "..", "Log", "DeleteCloudPics.log"), logObject);

};

const escapeHtmlandJS = (text) => {
    return validator.escape(text);
};

const isValidPassword = (ps) => {

    if(typeof ps !== "string" || ps.length < 8 || ps.length > 30) return false;

    for (let i = 0; i < ps.length; i++) {

        let passed = false;

        for (let j = 0; j < testChars.length; j++) {
            if(ps[i] === testChars[j]) 
                passed = true;
        }

        if(!passed) return false;

    };

    return true;

};

const isValidUsername = async(username) => {

    if(typeof username !== "string") return false;

    var regexPattern = /^[A-Za-z][A-Za-z0-9_]{1,32}$/;

    if(!regexPattern.test(username))
      return false;
    
    if(user) return false;

    return true;

};

const isValidEmail = (email) => {

    if(typeof email !== "string" || !email || email.length < 5 || email.length > 30) return false;

    const regexPattern = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,})$/;

    if(!regexPattern.test(email))
      return false;
  
    return true;

};

const isValidText = (text, minLength) => {

    if(!text || typeof text !== "string" || text.length <= 0) return false;

    if(minLength && text.length < minLength) return false;

    // for (let i = 0; i < text.length; i++) {

    //     let passed = false;

    //     for (let j = 0; j < testChars.length; j++) {
    //         if(text[i] === testChars[j]) 
    //             passed = true;
    //     }

    //     if(!passed) return false;

    // };
    
    return true;
};

const isValidNumber = (num, maxLength) => {

    if(!num || typeof num !== "number" || num <= 0) return false;

    if(maxLength && num > maxLength) return false;
    
    return true;

};

module.exports = {
    citiesArray,
    allowedSpecificCatagory,
    getCitiesArrayForFilter,
    updateWhiteListAccessToken, 
    checkWhiteListAccessToken, 
    deleteTokens, 
    fetchAccessToken, 
    getRandomPassword,
    validateImageType,
    generateRandomCode,
    sendToEmail,
    logDeletedPic,
    escapeHtmlandJS,
    isValidPassword,
    isValidEmail,
    isValidUsername,
    isValidText,
    isValidNumber
};