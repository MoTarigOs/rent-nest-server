const WL = require('../Data/WhiteList.js');
const Property = require('../Data/PropertyModel.js');
const axios = require('axios');
require('dotenv').config();
const path = require('path');
const fsPromise = require('fs').promises;
var nodemailer = require('nodemailer');
const givenSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789abcdefghijklmnopqrstuvwxyz";
const testChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -_.,+=!~;:#@0123456789أابتثجحخدذرزعغلمنهويئسشصضطكفقةىءؤ؛×÷ّآ,؟.';
const validator = require('validator');

const allowedSpecificCatagory = [
    'farm', 'apartment', 'resort', 'commercial', 
    'micro', 'sedan', 'high', 'luxury', 'mini-bus', 'sport'
];

const citiesArray = [
  {
      city_id: 0,
      value: 'Amman',       
      arabicName: 'عمان',   
      long: 35.9651,        
      lat: 31.9053
    },
    {
      city_id: 1,
      value: 'Jerash',
      arabicName: 'جرش',
      long: 35.8961,
      lat: 32.2775
    },
    {
      city_id: 2,
      value: 'Ajloun',
      arabicName: 'عجلون',
      long: 35.7517,
      lat: 32.3326
    },
    {
      city_id: 3,
      value: 'Dead Sea & Jordan Valley',
      arabicName: 'البحر الميت و ألأغوار',
      long: 35.5699,
      lat: 32.3172
    },
    {
      city_id: 4,
      value: 'Wadi Rum and Petra',
      arabicName: 'وادي رم و البتراء',
      long: 35.4444,
      lat: 30.3285
    },
    {
      city_id: 5,
      value: 'Main',
      arabicName: 'ماعين',
      long: 35.7331,
      lat: 31.6803
    },
    {
      city_id: 6,
      value: 'As-Salt',
      arabicName: 'السلط',
      long: 35.7273,
      lat: 32.0392
    },
    {
      city_id: 7,
      value: 'Aqaba',
      arabicName: 'العقبة',
      long: 35.0075,
      lat: 29.5269
    },
    {
      city_id: 8,
      value: 'Irbid',
      arabicName: 'اربد',
      long: 35.8575,
      lat: 32.5556
    },
    {
      city_id: 9,
      value: 'Madaba',
      arabicName: 'مادبا',
      long: 35.8,
      lat: 31.7167
    },
    {
      city_id: 10,
      value: 'Karak',
      arabicName: 'الكرك',
      long: 35.7047,
      lat: 31.1837
    },
    {
      city_id: 11,
      value: 'Mafraq',
      arabicName: 'المفرق',
      long: 36.2053,
      lat: 32.3404
    },
    {
      city_id: 12,
      value: 'Zarqa',       
      arabicName: 'الزرقاء',
      long: 36.0877,
      lat: 32.0722
    },
    {
      city_id: 13,
      value: 'Tafilah',
      arabicName: 'الطفيلة',
      long: 35.6,
      lat: 30.8333
    },
];

const getCitiesArrayForFilter = () => {
    let arr = [];
    citiesArray.forEach((i) => arr.push(i.value));
    return arr;
}

const JordanBoundryPoints = [
  [35.0017, 29.6052],
  [35.0195, 29.6167],
  [35.0327, 29.6307],
  [35.0324, 29.6502],
  [35.0298, 29.6713],
  [35.0297, 29.705],
  [35.0468, 29.767],
  [35.0497, 29.7872],
  [35.0468, 29.8021],
  [35.0513, 29.8209],
  [35.0808, 29.8723],
  [35.0776, 29.9505],
  [35.0984, 30.0226],
  [35.1758, 30.1191],
  [35.1445, 30.2395],
  [35.1635, 30.2762],
  [35.1601, 30.2962],
  [35.1665, 30.3134],
  [35.1887, 30.3347],
  [35.1919, 30.3466],
  [35.1866, 30.3622],
  [35.152, 30.4186],
  [35.156, 30.4322],
  [35.1698, 30.4493],
  [35.1767, 30.4672],
  [35.1993, 30.558],
  [35.2017, 30.5745],
  [35.2312, 30.6238],
  [35.2461, 30.6357],
  [35.2514, 30.658],
  [35.2759, 30.6967],
  [35.29, 30.7251],
  [35.2901, 30.7659],
  [35.2989, 30.7867],
  [35.3138, 30.8023],
  [35.333, 30.8082],
  [35.3381, 30.8284],
  [35.3331, 30.8449],
  [35.3334, 30.863],
  [35.3601, 30.9139],
  [35.3977, 30.9351],
  [35.415, 30.9488],
  [35.4151, 30.9695],
  [35.4069, 30.989],
  [35.4045, 31.0052],
  [35.4086, 31.0256],
  [35.4468, 31.0764],
  [35.4598, 31.1204],
  [35.4588, 31.136],
  [35.4538, 31.1568],
  [35.4458, 31.1715],
  [35.4012, 31.2231],
  [35.3898, 31.2445],
  [35.3949, 31.2646],
  [35.4551, 31.3593],
  [35.4715, 31.3996],
  [35.4751, 31.4198],
  [35.4763, 31.5297],
  [35.4783, 31.5743],
  [35.4995, 31.6364],
  [35.5303, 31.7196],
  [35.5557, 31.7585],
  [35.5434, 31.8169],
  [35.5513, 31.8359],
  [35.5408, 31.8501],
  [35.5506, 31.8665],
  [35.5332, 31.876],
  [35.5234, 31.9181],
  [35.5415, 31.933],
  [35.5478, 31.9686],
  [35.5311, 32],
  [35.5404, 32.0116],
  [35.5388, 32.0184],
  [35.5278, 32.0292],
  [35.5256, 32.0722],
  [35.5339, 32.0863],
  [35.5371, 32.104],
  [35.5512, 32.1203],
  [35.555, 32.1314],
  [35.5579, 32.1581],
  [35.5643, 32.183],
  [35.5727, 32.1963],
  [35.5755, 32.206],
  [35.5744, 32.2175],
  [35.5716, 32.2254],
  [35.5707, 32.2414],
  [35.5668, 32.2557],
  [35.5704, 32.2778],
  [35.5635, 32.2923],
  [35.5638, 32.2994],
  [35.5687, 32.311],
  [35.5608, 32.3288],
  [35.5616, 32.3369],
  [35.5648, 32.3439],
  [35.5676, 32.3588],
  [35.5652, 32.3647],
  [35.5578, 32.3725],
  [35.5597, 32.3904],
  [35.5679, 32.3898],
  [35.5583, 32.4035],
  [35.5593, 32.4051],
  [35.5668, 32.4069],
  [35.5686, 32.4107],
  [35.5657, 32.4332],
  [35.5774, 32.4364],
  [35.5749, 32.4496],
  [35.5783, 32.4522],
  [35.5832, 32.4524],
  [35.5857, 32.4573],
  [35.5837, 32.4606],
  [35.5754, 32.464],
  [35.5738, 32.4686],
  [35.5747, 32.4736],
  [35.587, 32.4925],
  [35.5882, 32.4976],
  [35.5863, 32.5003],
  [35.5789, 32.5028],
  [35.5725, 32.5152],
  [35.566, 32.5151],
  [35.5613, 32.5181],
  [35.5666, 32.5244],
  [35.5767, 32.5262],
  [35.5789, 32.5294],
  [35.5722, 32.5386],
  [35.5715, 32.5446],
  [35.5737, 32.5456],
  [35.5795, 32.5423],
  [35.5841, 32.5422],
  [35.5859, 32.5517],
  [35.5959, 32.5515],
  [35.5969, 32.5536],
  [35.5866, 32.5716],
  [35.5873, 32.5811],
  [35.592, 32.5904],
  [35.59, 32.5966],
  [35.5826, 32.6],
  [35.5803, 32.6046],
  [35.5818, 32.6195],
  [35.5787, 32.6226],
  [35.58, 32.6329],
  [35.5945, 32.6422],
  [35.6033, 32.6443],
  [35.6057, 32.6467],
  [35.6053, 32.6528],
  [35.6166, 32.6566],
  [35.6147, 32.6707],
  [35.6212, 32.6769],
  [35.6494, 32.6873],
  [35.6614, 32.6938],
  [35.6861, 32.6953],
  [35.6933, 32.6992],
  [35.7032, 32.7018],
  [35.7191, 32.7113],
  [35.7335, 32.7236],
  [35.7563, 32.7262],
  [35.7642, 32.7473],
  [35.7692, 32.7509],
  [35.7796, 32.7519],
  [35.8014, 32.7596],
  [35.8077, 32.7565],
  [35.8093, 32.7511],
  [35.8045, 32.7427],
  [35.8076, 32.7384],
  [35.817, 32.7396],
  [35.8202, 32.7346],
  [35.8263, 32.7311],
  [35.8351, 32.729],
  [35.8413, 32.7294],
  [35.8619, 32.7357],
  [35.8784, 32.7357],
  [35.8864, 32.7331],
  [35.9013, 32.7248],
  [35.9091, 32.7259],
  [35.9204, 32.7221],
  [35.9308, 32.7246],
  [35.9368, 32.7241],
  [35.9452, 32.7177],
  [35.948, 32.707],
  [35.9517, 32.7034],
  [35.9627, 32.697],
  [35.9746, 32.6969],
  [35.9827, 32.6906],
  [35.9829, 32.682],
  [35.9726, 32.6735],
  [35.9734, 32.6711],
  [35.983, 32.6651],
  [35.9936, 32.6614],
  [36.0108, 32.6628],
  [36.0197, 32.6619],
  [36.0329, 32.6579],
  [36.0363, 32.6543],
  [36.0392, 32.6425],
  [36.0388, 32.6308],
  [36.0349, 32.6071],
  [36.0363, 32.6039],
  [36.0589, 32.5878],
  [36.0704, 32.5758],
  [36.0844, 32.5491],
  [36.0887, 32.5367],
  [36.0908, 32.5179],
  [36.1106, 32.5231],
  [36.1338, 32.5239],
  [36.1647, 32.5222],
  [36.1784, 32.5183],
  [36.2007, 32.5285],
  [36.2056, 32.5284],
  [36.2178, 32.5218],
  [36.2577, 32.4929],
  [36.2961, 32.4705],
  [36.3365, 32.4427],
  [36.4006, 32.3872],
  [36.4097, 32.3822],
  [36.4636, 32.3773],
  [36.4802, 32.3734],
  [36.4928, 32.3675],
  [36.5033, 32.3591],
  [36.5207, 32.3549],
  [36.6704, 32.3423],
  [36.6921, 32.3391],
  [36.7133, 32.3252],
  [36.72, 32.3251],
  [36.7384, 32.3324],
  [36.8254, 32.3107],
  [36.8458, 32.3125],
  [36.8893, 32.3482],
  [36.9562, 32.3908],
  [37.0336, 32.4327],
  [37.5361, 32.7026],
  [38.4211, 33.1732],
  [38.7968, 33.3682],
  [38.818, 33.3057],
  [38.8288, 33.2582],
  [38.9938, 32.7753],
  [39.0379, 32.6409],
  [39.0535, 32.582],
  [39.0577, 32.5437],
  [39.0522, 32.5127],
  [39.0163, 32.4598],
  [39.0094, 32.4342],
  [39.0098, 32.4132],
  [39.0153, 32.3877],
  [39.0255, 32.3616],
  [39.0395, 32.3404],
  [39.0566, 32.3275],
  [39.0815, 32.3208],
  [39.104, 32.3203],
  [39.1989, 32.3281],
  [39.2233, 32.3259],
  [39.2414, 32.3203],
  [39.2637, 32.3044],
  [39.2891, 32.2708],
  [39.3009, 32.2371],
  [39.3021, 32.2213],
  [39.2124, 32.1524],
  [39.2009, 32.1543],
  [39.1792, 32.1354],
  [39.0063, 32.0006],
  [38.667, 31.9193],
  [38.0398, 31.7635],
  [37.984, 31.7445],
  [37.9713, 31.7451],
  [37.9596, 31.7436],
  [37.8713, 31.7216],
  [37.6787, 31.6721],
  [37.64, 31.6635],
  [37.4033, 31.6017],
  [37.3818, 31.5946],
  [37.1805, 31.5458],
  [37.0922, 31.5219],
  [37.0062, 31.5006],
  [37.1922, 31.3171],
  [37.2399, 31.2784],
  [37.2671, 31.2449],
  [37.2773, 31.2356],
  [37.2828, 31.2278],
  [37.3249, 31.1851],
  [37.33, 31.1782],
  [37.3911, 31.1217],
  [37.4592, 31.05],
  [37.518, 30.9931],
  [37.5463, 30.9611],
  [37.5742, 30.9371],
  [37.5963, 30.9133],
  [37.6336, 30.8781],
  [37.9035, 30.6064],
  [37.9328, 30.5763],
  [37.9615, 30.5377],
  [37.9971, 30.5007],
  [37.6656, 30.3326],
  [37.6364, 30.2767],
  [37.5208, 30.0425],
  [37.5055, 30.0008],
  [37.2071, 29.9479],
  [37.1265, 29.9314],
  [37.1231, 29.9322],
  [37.1222, 29.9308],
  [37.1007, 29.929],
  [37.0572, 29.9193],
  [37.0547, 29.92],
  [37.0496, 29.9169],
  [37.0373, 29.9171],
  [37.0002, 29.9106],
  [36.865, 29.8856],
  [36.7969, 29.8709],
  [36.792, 29.8715],
  [36.7849, 29.8679],
  [36.7758, 29.852],
  [36.7648, 29.8378],
  [36.7599, 29.8205],
  [36.7361, 29.789],
  [36.6809, 29.7494],
  [36.6677, 29.7278],
  [36.6441, 29.6944],
  [36.6438, 29.6874],
  [36.6392, 29.6738],
  [36.6245, 29.6369],
  [36.616, 29.6318],
  [36.5504, 29.5636],
  [36.5485, 29.5605],
  [36.5473, 29.5462],
  [36.5273, 29.5143],
  [36.4923, 29.4853],
  [36.4741, 29.4643],
  [36.4601, 29.4525],
  [36.4493, 29.4304],
  [36.4371, 29.4207],
  [36.4308, 29.42],
  [36.4233, 29.4134],
  [36.4093, 29.4057],
  [36.397, 29.4014],
  [36.3868, 29.4028],
  [36.3709, 29.3976],
  [36.3417, 29.3801],
  [36.3313, 29.3731],
  [36.3103, 29.352],
  [36.2497, 29.3127],
  [36.2126, 29.2862],
  [36.1518, 29.232],
  [36.0982, 29.2026],
  [36.0828, 29.189],
  [36.0728, 29.1834],
  [36.0024, 29.1951],
  [35.9696, 29.1982],
  [35.9083, 29.21],
  [35.8199, 29.22],
  [35.7371, 29.238],
  [35.1351, 29.3318],
  [35.0888, 29.3393],
  [35.0742, 29.3441],
  [35.0531, 29.3444],
  [34.9621, 29.3587],
  [34.9668, 29.3615],
  [34.9665, 29.3632],
  [34.9607, 29.3674],
  [34.9585, 29.3649],
  [34.9576, 29.3674],
  [34.966, 29.3721],
  [34.9621, 29.3774],
  [34.9643, 29.3827],
  [34.9685, 29.3865],
  [34.9637, 29.3937],
  [34.9646, 29.3985],
  [34.9704, 29.4035],
  [34.9762, 29.406],
  [34.9779, 29.4099],
  [34.9724, 29.4204],
  [34.9746, 29.4326],
  [34.9704, 29.4379],
  [34.9676, 29.4471],
  [34.9712, 29.4501],
  [34.9715, 29.4535],
  [34.9762, 29.459],
  [34.9743, 29.4629],
  [34.9746, 29.4704],
  [34.9801, 29.4776],
  [34.9796, 29.4804],
  [34.9835, 29.4835],
  [34.9854, 29.4904],
  [34.9918, 29.5004],
  [34.9907, 29.5037],
  [34.9957, 29.5171],
  [35.001, 29.5182],
  [35.0007, 29.526],
  [34.9982, 29.5282],
  [34.9979, 29.5307],
  [34.9799, 29.5424],
  [34.966, 29.5471],
  [34.9757, 29.571],
  [34.9865, 29.5898],
  [35.0017, 29.6052]
];

const isValidPoint = (myLong, myLat) => {

    const point = {
      x: myLong, y: myLat
    };

    const num_vertices = JordanBoundryPoints.length;
    const x = point.x;
    const y = point.y;
    let inside = false;
  
    let p1 = JordanBoundryPoints[0];
    let p2;
  
    for (let i = 1; i <= num_vertices; i++) {
      p2 = JordanBoundryPoints[i % num_vertices];
  
      if (y > Math.min(p1[1], p2[1])) {
        if (y <= Math.max(p1[1], p2[1])) {
          if (x <= Math.max(p1[0], p2[0])) {
            const x_intersection = ((y - p1[1]) * (p2[0] - p1[0])) / (p2[1] - p1[1]) + p1[0];
  
            if (p1[0] === p2[0] || x <= x_intersection) {
              inside = !inside;
            }
          }
        }
      }
  
      p1 = p2;
    }
  
    return inside;

};

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

            let htmlText = '';

            // console.log("personal email: ", process.env.PERSONAL_EMAIL);

            if(userEmail !== process.env.PERSONAL_EMAIL){
                htmlText = `<html lang="en" style="margin: 0; padding: 0; width: 100%"><body style="margin: 0; padding: 0; width: 100%"><div style="width: 100%; display: flex; justify-content: center; align-items: center;"><h1 style="height: fit-content; font-size: 42px; border: solid 2px; border-radius: 4px; padding: 8px 16px; letter-spacing: 1px;">${sanitizedText}</h1></div></body></html>`
            } else {
                htmlText = `<html lang="en" style="margin: 0; padding: 0; width: 100%"><body style="margin: 0; padding: 0; width: 100%"><div style="width: 100%; display: flex; flex-direction: column; gap: 8px; padding: 12px;">${sanitizedText}</div></body></html>`
            }
    
            var mailOptions = {
                from: gmailAccount,
                to: userEmail,
                subject: 'Rent Nest', //title
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

    if(typeof ps !== "string" || ps.length < 8 || ps.length > 100) return false;

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

    var regexPattern = /^[A-Za-z][A-Za-z0-9_]{1,45}$/;

    if(!regexPattern.test(username))
      return false;
    
    if(user) return false;

    return true;

};

const isValidEmail = (email) => {

    if(!email || typeof email !== "string" || email.length < 5 || email.length > 30) return false;

    const regexPattern = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,})$/;

    if(!regexPattern.test(email))
      return false;
  
    return true;

};

const isValidText = (text, minLength) => {

    if(!minLength && (!text || typeof text !== "string" || text.length <= 0)) return false;

    if(minLength && (!text || typeof text !== "string" || text.length < minLength)) return false;

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

const isValidNumber = (num, maxLength, minLength, type) => {

    if(isNaN(Number(num))) return false;

    if(Boolean(maxLength) && (typeof num !== "number" || num > maxLength)) return false;

    if(Boolean(minLength <= 0 ? 1 : minLength) && (typeof num !== "number" || num < minLength)) return false;

    if(!Boolean(maxLength) && !Boolean(minLength) && (typeof num !== "number" || num <= 0)) return false;
    
    return true;

};

const contactsPlatforms = [
  'whatsapp', 'facebook', 'instagram', 'youtube'
];

const isValidContacts = (contacts) => {

  for (let i = 0; i < contacts.length; i++) {

    const contact = contacts[i];

    if(!isValidText(contact.val) || !contactsPlatforms.includes(contact.platform))
        return false;

    let origin;

    try {
        origin = (new URL(contact.val)).origin;
    } catch(err) {
        if(contact.platform !== 'whatsapp' && contact.platform !== 'telegram')
            return false;
        if(!isValidNumber(Number(contact.val))) return false;
    }

    console.log('going...', origin, !origin, contact);

    switch(contact.platform){
        case 'youtube':
            if(origin !== 'https://www.youtube.com' && origin !== 'https://youtu.be'){
                return false;
            }
            break;
        case 'whatsapp':
            if(origin && origin !== 'https://wa.me'){
                return false;
            } else if(!origin && !isValidNumber(Number(contact.val))){
                return false;
            }
            break;
        case 'facebook':
            if(origin !== 'https://www.youtube.com' && origin !== 'https://youtu.be'){
                return false;
            }
        case 'snapchat':
            if(origin !== 'https://www.youtube.com' && origin !== 'https://youtu.be'){
                return false;
            }
            break;
        case 'linkedin':
            if(origin !== 'https://www.youtube.com' && origin !== 'https://youtu.be'){
                return false;
            }
            break;
        case 'instagram':
            if(origin !== 'https://www.youtube.com' && origin !== 'https://youtu.be'){
                return false;
            }
            break;
        default:
            return false;
    }

  }

  console.log('returned true');
  return true;

};

const isValidDetails = (dtl) => {
    return true;
};

const isValidTerms = (trms) => {
    return true;
};

const arrayLimitSchema = (val) => {
    if(!val) return true;
    if(val.length > 300) return false
    return true;
};

const updatePropertyRating = async(propertyId, ratingsObj, addScore, isNew, pastRateObj) => {

    try {
        
        const value = ratingsObj.val;

        const numOfRates = ratingsObj.no;

        if(typeof value !== 'number') return null;

        if(typeof numOfRates !== 'number') return null;

        const sumScore = isNew ? (value * numOfRates) : (value * numOfRates) - pastRateObj.user_rating;

        const newValue = (sumScore + addScore) / (isNew ? numOfRates + 1 : numOfRates);

        const newRatingsObj = { val: newValue > 5 ? 5 : newValue < 0 ? 0 : newValue, no: isNew ? (numOfRates + 1 < 0 ? 0 : numOfRates + 1) : (numOfRates < 0 ? 0 : numOfRates) };

        const newProp = await Property.findOneAndUpdate({ _id: propertyId }, { 
          ratings: newRatingsObj
        }, { new: true });

        return newProp;

    } catch (err) {
        console.log(err);
        return null;
    }

};

const isValidBookDateFormat = (date) => {

  console.log('date: ', date);

  if(!date || typeof date !== 'string' || date.length <= 0) return false;

  const day = date.split('-')?.at(0);
  const month = date.split('-')?.at(1);
  const year = date.split('-')?.at(2);

  if(!day || typeof Number(day) !== 'number' || Number(day) < 1 || Number(day) > 31) return false;
  if(!month || typeof Number(month) !== 'number' || Number(month) < 1 || Number(month) > 12) return false;
  if(!year || typeof Number(year) !== 'number' || Number(year) < 2024 || Number(year) > new Date().getFullYear() + 5) return false;

  return true;

};

const getOnlyEnglishAndNum = (text) => {
  let newText = '';
  for (let i = 0; i < text.length; i++) {
    if(!givenSet.includes(text[i])){
      newText += generateRandomCode().slice(0, 1);
    } else {
      newText += text[i]
    }
  }
  return newText;
};

const generateSecretKey = (userId, username) => {

  const randomCode1 = generateRandomCode();
  const randomCode2 = generateRandomCode();
  const randomCode3 = generateRandomCode();

  const dateNow = Date.now();

  const str = getOnlyEnglishAndNum(`${randomCode1}${dateNow}${randomCode2}${username}${randomCode3}`);

  return `${str.replaceAll('-', '0')}-${userId}`;

};

module.exports = {
    JordanBoundryPoints,
    citiesArray,
    allowedSpecificCatagory,
    isValidPoint,
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
    isValidContacts,
    isValidNumber,
    isValidDetails,
    isValidTerms,
    arrayLimitSchema,
    updatePropertyRating,
    isValidBookDateFormat,
    generateSecretKey
};