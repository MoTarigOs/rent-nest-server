const { default: mongoose } = require('mongoose');
const Property = require('../Data/PropertyModel.js');
const { isValidText, allowedSpecificCatagory, isValidNumber, citiesArray, getCitiesArrayForFilter } = require('../utils/logic.js');


const getProperties = async(req, res) => {

    try {

        if(!req || !req.query) return res.status(400).json({ message: 'request error' });

        const { city, type_is_vehicle, specific, price_range, min_rate, text, sort, skip } = req.query;

        if(city && !citiesArray.find(i => i.value.toLowerCase() === city.toLowerCase())) return res.status(400).json({ message: 'city error' });
        
        if(type_is_vehicle && type_is_vehicle !== 'false' && type_is_vehicle !== 'true') return res.status(400).json({ message: 'type_is_vehicle error' });

        if(specific && !allowedSpecificCatagory.includes(specific)) return res.status(400).json({ message: 'specific error' });
        
        if(price_range &&
            (!isValidText(price_range) 
            || !isValidNumber(Number(price_range.split(',')[0])) 
            || !isValidNumber(Number(price_range.split(',')[1])))){
                return res.status(400).json({ message: 'price error' });
        }

        if(min_rate && (typeof Number(min_rate) !== 'number' || Number(min_rate) > 5 || Number(min_rate) < 0)){
            return res.status(400).json({ message: 'rate error' });
        }

        const filterObj = {
            city: city?.length > 0 ? city : getCitiesArrayForFilter(),
            type_is_vehicle: type_is_vehicle ? (type_is_vehicle === 'false' ? false : true) : [false, true],
            specific_catagory: allowedSpecificCatagory.includes(specific) ? specific : allowedSpecificCatagory,
            price: price_range ? { $gte: Number(price_range.split(',')[0]), $lte: Number(price_range.split(',')[1])} : { $gte: 0 },
            'ratings.val': min_rate ? { $gte: Number(min_rate) } : { $gte: 0 }
        };

        const sortObj = () => {
            switch(sort){
                default:
                    return { createdAt: -1 };
            }
        };
        
        const skipObj = () => {

            if(!skip || typeof skip !== 'number') return 0;

            if(Math.round(skip) <= 0 || Math.round(skip) > 100) return 0;

            return Math.round(skip) * 300;

        };

        console.log(filterObj);
        console.log(sortObj());
        console.log(skipObj());
            
        const properties = await Property.find().limit(300).select('_id images title description ratings city neighbourhood price discount specific_catagory'); 

        if(!properties || properties.length <= 0) return res.status(404).json({ message: 'not exist error' });
        
        return res.status(200).json(properties);

    } catch (err) {
        console.log(err);
        return res.status(501).json(err.message);
    }

};

const createProperty = async(req, res) => {

    try {

        console.log('creating property, id: ', req.user.id, ' body: ', req.body);

        if(!req || !req.user || !req.body) return res.status(400).json({ message: 'request error' });
        
        const { id } = req.user;
        const { 
            type_is_vehicle, specific_catagory, title, description, city, 
            neighbourhood, map_coordinates, price, details, terms_and_conditions
        } = req.body;

        console.log(details);

        if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'login error' });

        if(!isValidText(specific_catagory) || !allowedSpecificCatagory.includes(specific_catagory)) return res.status(400).json({ message: 'specific catagory error' });

        if(!isValidText(title, 5)) return res.status(400).json({ message: 'title error' });
        
        if(!isValidText(description, 25)) return res.status(400).json({ message: 'desc error' });
        
        if(!isValidText(city) || !citiesArray.find(i => i.value === city)) return res.status(400).json({ message: 'city error' });
        
        if(typeof neighbourhood !== 'string') return res.status(400).json({ message: 'neighbourhood error' });
        
        if(map_coordinates && (map_coordinates.length > 2 || typeof map_coordinates[0] !== 'number' || typeof map_coordinates[1] !== 'number')) return res.status(400).json({ message: 'neighbourhood error' });
        
        if(!isValidNumber(price)) return res.status(400).json({ message: 'price error' });
       
        const property = await Property.create({
            owner_id: id,
            type_is_vehicle,
            specific_catagory,
            title,
            description,
            city,
            neighbourhood,
            map_coordinates,
            price,
            images: [],
            videos: [],
            details,
            terms_and_conditions
        });

        if(!property) return res.status(501).json({ message: 'server error' });

        return res.status(201).json({
            id: property._id
        });

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const getProperty = async(req, res) => {

    try {

        console.log(req.url);

        if(!req || !req.query) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.query;

        if(!mongoose.Types.ObjectId.isValid(propertyId)) return res.status(400).json({ message: 'request error' });

        const property = await Property.findOne({ _id: propertyId });
        
        if(!property) return res.status(400).json({ message: 'not exist error' });

        return res.status(200).json(property);

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'unknown error' });
    }

};

const getOwnerProperty = async(req, res) => {

    try {

        console.log('owner items reached');

        if(!req || !req.user) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;

        if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'request error' });

        const properties = await Property.find({ owner_id: id }).limit(300).select('_id images title description ratings city neighbourhood price discount');
        
        console.log(properties);

        if(!properties || properties.length <= 0) return res.status(400).json({ message: 'not exist error' });

        return res.status(200).json(properties);

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'unknown error' });
    }

};

module.exports = {
    getProperties,
    createProperty,
    getProperty,
    getOwnerProperty
}