const mongoose = require('mongoose');
const Property = require('../Data/PropertyModel.js');
const Report = require('../Data/ReportModel.js');
const { isValidText, allowedSpecificCatagory, isValidNumber, citiesArray, getCitiesArrayForFilter, isValidTerms, isValidDetails, updatePropertyRating, isValidPoint, isValidBookDateFormat, isValidContacts } = require('../utils/logic.js');
const sortLatDistance = 0.5;

const getProperties = async(req, res) => {

    try {

        if(!req || !req.query) return res.status(400).json({ message: 'request error' });

        const { 
            city, type_is_vehicle, specific, price_range, 
            min_rate, text, sort, long, lat, skip
        } = req.query;

        const id = req?.user?.id;

        if(city && !citiesArray.find(i => i.value.replaceAll(' ', '-') === city)) return res.status(400).json({ message: 'city error' });
        
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

        if(text && !isValidText(text)) return res.status(400).json({ message: 'text error' });

        const filterObj = () => {
            
            let obj = {};
            
            let secondObj = null;

            obj.visible = true;

            obj.checked = true;

            obj.isRejected = false;

            obj.is_able_to_book = true;

            if(city?.length > 0) obj.city = city;

            if(type_is_vehicle) obj.type_is_vehicle = type_is_vehicle;

            if(allowedSpecificCatagory.includes(specific)) 
                obj.specific_catagory = specific;

            if(price_range) obj.price_range = { $gte: Number(price_range.split(',')[0]), $lte: Number(price_range.split(',')[1])};

            if(type_is_vehicle) obj.type_is_vehicle = type_is_vehicle;

            if(min_rate)
                secondObj = { ...obj, 'ratings.val': { $gte: Number(min_rate) } };

            if(id && mongoose.Types.ObjectId.isValid(id)) {
                if(secondObj){
                    secondObj = { ...secondObj, owner_id: { $ne: id } };
                } else {
                    secondObj = { ...obj, owner_id: { $ne: id } };
                }
            }    
            
            if(text) {
                if(secondObj){
                    secondObj = { ...secondObj, $text : { $search : text } };
                } else {
                    secondObj = { ...obj, $text : { $search : text } };
                }
            }

            if(sort === 'address' && typeof Number(long) === 'number' && typeof Number(lat) === 'number'){
                if(secondObj){ 
                    secondObj = {
                        ...secondObj,
                        'map_coordinates.0': { 
                            $gte: Number(long) - sortLongDistance, 
                            $lte: Number(long) + sortLongDistance
                        },
                        'map_coordinates.1': { 
                            $gte: Number(lat) - sortLatDistance, 
                            $lte: Number(lat) + sortLatDistance
                        }
                    } 
                } else {
                    secondObj = {
                        ...obj,
                        'map_coordinates.0': { 
                            $gte: Number(long) - sortLongDistance, 
                            $lte: Number(long) + sortLongDistance
                        },
                        'map_coordinates.1': { 
                            $gte: Number(lat) - sortLatDistance, 
                            $lte: Number(lat) + sortLatDistance
                        }
                    }
                }
            }

            console.log('secondOb: ', secondObj);

            console.log('obj: ', obj);

            if(secondObj){
                return secondObj;
            } else {
                return obj;
            }

        }

        const sortObj = () => {
            switch(sort){
                case 'default':
                    return { 'ratings.val': -1, createdAt: -1 };
                case 'ratings':
                    return { 'ratings.val': -1, createdAt: -1 }
                case 'high-price':
                    return { price: -1, 'ratings.val': -1, createdAt: -1 }
                case 'low-price':
                    return { price: 1, 'ratings.val': -1, createdAt: -1 }
                default:
                    return { createdAt: -1 };
            }
        };
        
        const skipObj = () => {

            if(!skip || typeof Number(skip) !== 'number') return 0;

            if(Math.round(Number(skip)) <= 0 || Math.round(Number(skip)) > 100) return 0;

            return Math.round(Number(skip));

        };
            
        const properties = await Property.find(filterObj())
            .limit(300).sort(sortObj()).skip(skipObj() * 300)
            .select('_id map_coordinates images title description booked_days ratings city neighbourhood price discount specific_catagory'); 

        if(!properties || properties.length <= 0) return res.status(404).json({ message: 'not exist error' });
        
        return res.status(200).json(properties);

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const createProperty = async(req, res) => {

    try {

        if(!req || !req.user || !req.body) return res.status(400).json({ message: 'request error' });
        
        const { id } = req.user;
        const { 
            type_is_vehicle, specific_catagory, title, description, city, 
            neighbourhood, map_coordinates, price, details, 
            terms_and_conditions, area, contacts
        } = req.body;

        if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'login error' });

        if(!isValidText(specific_catagory) || !allowedSpecificCatagory.includes(specific_catagory)) return res.status(400).json({ message: 'specific catagory error' });

        if(!isValidText(title, 5)) return res.status(400).json({ message: 'title error' });
        
        if(!isValidText(description, 25)) return res.status(400).json({ message: 'desc error' });
        
        if(!isValidText(city) || !citiesArray.find(i => i.value === city)) return res.status(400).json({ message: 'city error' });

        if(neighbourhood && !isValidText(neighbourhood)) return res.status(400).json({ message: 'neighbourhood error' });
        
        if(map_coordinates && (map_coordinates.length !== 2 || !isValidPoint(map_coordinates[0], map_coordinates[1]))) return res.status(400).json({ message: 'coordinates error' });

        if(!isValidNumber(price)) return res.status(400).json({ message: 'price error' });

        if(details && !isValidDetails(details)) return res.status(400).json({ message: 'details error' });

        if(terms_and_conditions && !isValidTerms(terms_and_conditions)) return res.status(400).json({ message: 'details error' });

        if(area && !isValidNumber(Number(area))) return res.status(400).json({ message: 'area error' });

        if(contacts && !isValidContacts(contacts)) return res.status(400).json({ message: 'contacts error' });

        const getObj = () => {
            const obj = {
                owner_id: id,
                type_is_vehicle,
                specific_catagory,
                title,
                description,
                city,
                neighbourhood,
                price,
                images: [],
                videos: [],
                reviews: [],
                details,
                terms_and_conditions,
                area,
                contacts
            };
            if(isValidPoint(map_coordinates[0], map_coordinates[1])) obj.map_coordinates = map_coordinates;
            return obj;

        }
        
        const property = await Property.create(getObj());

        if(!property) return res.status(500).json({ message: 'server error' });

        console.log('property id: ', property._id);

        return res.status(201).json({
            id: property._id
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
    }

};

const getProperty = async(req, res) => {

    try {

        if(!req || !req.query) return res.status(400).json({ message: 'request error' });

        const { propertyId } = req.query;

        if(!mongoose.Types.ObjectId.isValid(propertyId)) return res.status(400).json({ message: 'request error' });

        const property = await Property.findOne({ _id: propertyId });
        
        if(!property) return res.status(400).json({ message: 'not exist error' });

        return res.status(200).json(property);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'unknown error' });
    }

};

const getOwnerProperty = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { userId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'request error' });

        const properties = await Property.find({ owner_id: userId }).limit(300)
            .select('_id images title checked visible isRejected description ratings city neighbourhood price discount')
            .sort({ createdAt: -1 });

        if(!properties || properties.length <= 0) return res.status(400).json({ message: 'not exist error' });

        return res.status(200).json(properties);

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }

};

const addReview = async(req, res) => {

    try {

        if(!req || !req.user || !req.body || !req.query) return res.status(400).json({ message: 'request error' });

        const { id, username } = req.user;

        const { text, user_rating } = req.body;

        const { propertyId } = req.query;

        if(!mongoose.Types.ObjectId.isValid(id) 
            || !mongoose.Types.ObjectId.isValid(propertyId) 
            || !isValidText(username) 
            || !isValidText(text) 
            || !isValidNumber(user_rating) || user_rating > 5 || user_rating < 0){        
            return res.status(400).json({ message: 'input error' });
        }

        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: { $ne: id }, reviews: { $elemMatch: { writer_id: id } } }, {
            $set: { "reviews.$" : { 
                writer_id: id, 
                username: username,
                text, user_rating: Number(user_rating).toFixed(2)
            }}
        }).select('_id reviews ratings');

        if(!property){

            const inserted = await Property.findOneAndUpdate({ _id: propertyId, owner_id: { $ne: id } }, {
                $push: { reviews: { 
                    writer_id: id, 
                    username: username,
                    text, user_rating: Number(user_rating).toFixed(2)
                }}
            }).select('_id reviews ratings');

            if(!inserted) return res.status(403).json({ message: 'access error' });

            const updatedInsertedProp = await updatePropertyRating(propertyId, inserted.ratings, user_rating, true);    
        
            return res.status(201).json(updatedInsertedProp);

        } else {
            const updatedProp = await updatePropertyRating(
                propertyId, 
                property.ratings, 
                user_rating, false, 
                property.reviews.find(i => i?.writer_id?.toString() === id)
            );
            return res.status(201).json(updatedProp);
        }         
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }
};

const editProperty = async(req, res) => {

    try {

        if(!req || !req.user || !req.params || !req.body) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;
        const { 
            title, description, price, details, 
            terms_and_conditions, contacts, discount
        } = req.body;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        if(title && !isValidText(title, 5)) return res.status(400).json({ message: 'title error' });
        
        if(description && !isValidText(description, 25)) return res.status(400).json({ message: 'desc error' });

        if(price && !isValidNumber(price)) return res.status(400).json({ message: 'price error' });
       
        if(details && !isValidDetails(details)) return res.status(400).json({ message: 'details error' });
        
        if(terms_and_conditions && !isValidTerms(terms_and_conditions)) return res.status(400).json({ message: 'details error' });

        console.log('jophnyyy: ', contacts, isValidContacts(contacts));

        if(contacts && !isValidContacts(contacts)) return res.status(400).json({ message: 'contacts error' });

        if(discount?.percentage && (!isValidNumber(discount.percentage, 100, 0) || !isValidNumber(discount.num_of_days_for_discount, 2000, 0)))
            return res.status(400).json({ message: 'discount error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: id }, {
            title,
            description,
            price,
            details,
            terms_and_conditions,
            checked: false,
            isRejected: false,
            reject_reasons: [],
            contacts,
            discount
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

const hideProperty = async(req, res) => {

    try {

        if(!req || !req.user || !req.params) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: id }, {
            visible: false
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }

};

const showProperty = async(req, res) => {

    try {

        if(!req || !req.user || !req.params) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: id }, {
            visible: true
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }

};

const setAbleToBook = async(req, res) => {

    try {

        if(!req || !req.user || !req.params) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: id }, {
            is_able_to_book: true
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }

};

const setPreventBook = async(req, res) => {

    try {

        if(!req || !req.user || !req.params) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: id }, {
            is_able_to_book: false
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }

};

const setBookedDays = async(req, res) => {

    try {

        if(!req || !req.user || !req.params || !req.body) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;
        const { bookedDays } = req.body;

        if(!mongoose.Types.ObjectId.isValid(id) 
            || !mongoose.Types.ObjectId.isValid(propertyId)
            || !Array.isArray(bookedDays)
            || bookedDays.length > 1200)
            return res.status(400).json({ message: 'request error' });

        for (let i = 0; i < bookedDays.length; i++) {
            if(!isValidBookDateFormat(bookedDays[i])) return res.status(400).json({ message: 'date error' });
        }

        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: id }, {
            booked_days: bookedDays
        }, { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }

};

const deleteProperty = async(req, res) => {

    try {

        if(!req || !req.user || !req.params) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const prop = await Property.deleteOne({ _id: propertyId, owner_id: id });

        await Report.deleteOne({ reported_id: propertyId });

        if(!prop) return res.status(403).json({ message: 'access error' });

        return res.status(201).json({ message: 'success' });
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }

};

module.exports = {
    getProperties,
    createProperty,
    getProperty,
    getOwnerProperty,
    addReview,
    editProperty,
    hideProperty,
    showProperty,
    setAbleToBook,
    setPreventBook,
    setBookedDays,
    deleteProperty
};




            // if(isValidText(text)){
            //     if(sort !== 'address'){
            //         return {
            //             city: city?.length > 0 ? city : getCitiesArrayForFilter(),
            //             type_is_vehicle: type_is_vehicle ? (type_is_vehicle === 'false' ? false : true) : [false, true],
            //             specific_catagory: allowedSpecificCatagory.includes(specific) ? specific : allowedSpecificCatagory,
            //             price: price_range ? { $gte: Number(price_range.split(',')[0]), $lte: Number(price_range.split(',')[1])} : { $gte: 0 },
            //             'ratings.val': min_rate ? { $gte: Number(min_rate) } : { $gte: 0 },
            //             visible: true,
                        
            //         };
            //     } else {
            //         if(typeof Number(long) === 'number' && typeof Number(lat) === 'number')
            //             return {
            //                 city: city?.length > 0 ? city : getCitiesArrayForFilter(),
            //                 type_is_vehicle: type_is_vehicle ? (type_is_vehicle === 'false' ? false : true) : [false, true],
            //                 specific_catagory: allowedSpecificCatagory.includes(specific) ? specific : allowedSpecificCatagory,
            //                 price: price_range ? { $gte: Number(price_range.split(',')[0]), $lte: Number(price_range.split(',')[1])} : { $gte: 0 },
            //                 'ratings.val': min_rate ? { $gte: Number(min_rate) } : { $gte: 0 },
            //                 visible: true,
            //             };
            //         const sortLongDistance = Math.cos(Number(lat) * Math.PI / 180) / 2;
            //         return {
            //             city: city?.length > 0 ? city : getCitiesArrayForFilter(),
            //             type_is_vehicle: type_is_vehicle ? (type_is_vehicle === 'false' ? false : true) : [false, true],
            //             specific_catagory: allowedSpecificCatagory.includes(specific) ? specific : allowedSpecificCatagory,
            //             price: price_range ? { $gte: Number(price_range.split(',')[0]), $lte: Number(price_range.split(',')[1])} : { $gte: 0 },
            //             'ratings.val': min_rate ? { $gte: Number(min_rate) } : { $gte: 0 },
            //             visible: true,
            //             'map_coordinates.0': { 
            //                 $gte: Number(long) - sortLongDistance, 
            //                 $lte: Number(long) + sortLongDistance
            //             },
            //             'map_coordinates.1': { 
            //                 $gte: Number(lat) - sortLatDistance, 
            //                 $lte: Number(lat) + sortLatDistance
            //             },
            //             $text: { $search : text }
            //         };
            //     }
            // } else if(sort !== 'address'){
            //     return {
            //         city: city?.length > 0 ? city : getCitiesArrayForFilter(),
            //         type_is_vehicle: type_is_vehicle ? (type_is_vehicle === 'false' ? false : true) : [false, true],
            //         specific_catagory: allowedSpecificCatagory.includes(specific) ? specific : allowedSpecificCatagory,
            //         price: price_range ? { $gte: Number(price_range.split(',')[0]), $lte: Number(price_range.split(',')[1])} : { $gte: 0 },
            //         'ratings.val': min_rate ? { $gte: Number(min_rate) } : { $gte: 0 },
            //         visible: true,
            //     };
            // } else {
            //     if(typeof Number(long) === 'number' && typeof Number(lat) === 'number')
            //         return {
            //             city: city?.length > 0 ? city : getCitiesArrayForFilter(),
            //             type_is_vehicle: type_is_vehicle ? (type_is_vehicle === 'false' ? false : true) : [false, true],
            //             specific_catagory: allowedSpecificCatagory.includes(specific) ? specific : allowedSpecificCatagory,
            //             price: price_range ? { $gte: Number(price_range.split(',')[0]), $lte: Number(price_range.split(',')[1])} : { $gte: 0 },
            //             'ratings.val': min_rate ? { $gte: Number(min_rate) } : { $gte: 0 },
            //             visible: true,
            //         };
            //     const sortLongDistance = Math.cos(Number(lat) * Math.PI / 180) / 2;
            //     return {
            //         city: city?.length > 0 ? city : getCitiesArrayForFilter(),
            //         type_is_vehicle: type_is_vehicle ? (type_is_vehicle === 'false' ? false : true) : [false, true],
            //         specific_catagory: allowedSpecificCatagory.includes(specific) ? specific : allowedSpecificCatagory,
            //         price: price_range ? { $gte: Number(price_range.split(',')[0]), $lte: Number(price_range.split(',')[1])} : { $gte: 0 },
            //         'ratings.val': min_rate ? { $gte: Number(min_rate) } : { $gte: 0 },
            //         visible: true,
            //         'map_coordinates.0': { 
            //             $gte: Number(long) - sortLongDistance, 
            //             $lte: Number(long) + sortLongDistance
            //         },
            //         'map_coordinates.1': { 
            //             $gte: Number(lat) - sortLatDistance, 
            //             $lte: Number(lat) + sortLatDistance
            //         }
            //     };
            // }