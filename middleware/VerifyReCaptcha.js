

const verifyReCaptcha = async(req, res, next) => {

    try {

        const token = req?.body?.gRecaptchaToken;

        if(!token) return res.status(400).json({ message: 'request error' });

        const url = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY.toString()}&response=${token.toString()}`;

        const fetchRes = await (await fetch(url, { method: 'POST' })).json();

        console.log('recaptcha res: ', await fetchRes);

        if(!fetchRes || fetchRes.success !== true || fetchRes.score < 0.5) 
            return res.status(403).json({ message: 'recaptcha error' });

        next();

    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: 'server error' });
    }

};

module.exports = verifyReCaptcha;