

const verifyReCaptcha = async(req, res) => {

    try {

        const token = req?.body?.gRecaptchaToken;

        if(!token) return res.status(400).json({ message: 'request error' });

        const url = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=sdsd`;
        
        console.log('url: ', url);

        const fetchRes = (await fetch({
            url: url.toString(), method: 'POST'
        })).json();

        console.log('recaptcha res: ', fetchRes);

        next();

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

module.exports = verifyReCaptcha;