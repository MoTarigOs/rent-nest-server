const mongoose = require('mongoose');
const Property = require('../Data/PropertyModel.js');
const Report = require('../Data/ReportModel.js');
const User = require('../Data/UserModel.js');
const { isValidText, allowedSpecificCatagory, isValidNumber, citiesArray, getCitiesArrayForFilter, isValidTerms, isValidDetails, updatePropertyRating, isValidPoint, isValidBookDateFormat, isValidContacts, isValidEnData, getUnitCode, updateHostEvaluation } = require('../utils/logic.js');
const sortLatDistance = 0.1;
const sortLongDistance = 0.3;

const getProperties = async(req, res) => {

    try {

        if(!req || !req.query) return res.status(400).json({ message: 'request error' });

        const { 
            city, type_is_vehicle, specific, price_range, 
            min_rate, text, sort, long, lat, skip, categories,
            quickFilter, isEnglish, isCount, cardsPerPage,
            unitCode,
            bedroomFilter,
            capacityFilter,
            poolFilter,
            customers,
            bathroomFacilities,
            bathroomsNum,
            companiansFilter,
            kitchenFilter,
            vehicleType,
        } = req.query;

        // console.log('min_rate: ', min_rate);
        // console.log('quickFilter: ', quickFilter);
        // console.log('categories: ', categories);
        // console.log('bedroomFilter: ', bedroomFilter);
        // console.log('capacityFilter: ', capacityFilter);
        // console.log('poolFilter: ', poolFilter);
        // console.log('customers: ', customers);
        // console.log('bathroomFacilities: ', bathroomFacilities);
        // console.log('bathroomsNum: ', bathroomsNum);
        console.log('type_is_vehicle: ', type_is_vehicle);
        console.log('vehicleType: ', vehicleType);

        // console.log('reached');

        // return res.status(400).json({ message: 'error' });

        const id = req?.user?.id;

        if(city && !citiesArray.find(i => i.value.replaceAll(' ', '-') === city)) return res.status(400).json({ message: 'city error' });
        
        if(type_is_vehicle && type_is_vehicle !== 'false' && type_is_vehicle !== 'true') return res.status(400).json({ message: 'type_is_vehicle error' });

        if(specific && !allowedSpecificCatagory.includes(specific)) return res.status(400).json({ message: 'specific error' });
        
        if(categories){
            categories?.split(',')?.forEach(element => {
                if(!allowedSpecificCatagory.includes(element))
                    return res.status(400).json({ message: 'categories error' });
            });
        }

        if(price_range &&
            (!isValidText(price_range) 
            || !isValidNumber(Number(price_range.split(',')[0]), null, null, 'start-zero') 
            || !isValidNumber(Number(price_range.split(',')[1])))){
                return res.status(400).json({ message: 'price error' });
        }

        if(text && !isValidText(text)) return res.status(400).json({ message: 'text error' });

        if(cardsPerPage && !isValidNumber(Number(cardsPerPage))) return res.status(400).json({ message: 'cards per page error' });

        const filterObj = (isCount) => {

            if(unitCode && isValidNumber(Number(unitCode), null, null, 'start-zero')) return { unit_code: Number(unitCode) };

            let obj = {};
            
            let secondObj = null;

            obj.visible = true;

            // obj.checked = true;

            obj.isRejected = false;

            obj.is_able_to_book = true;

            if(city?.length > 0) obj.city = city;

            if(isValidNumber(Number(min_rate), null, null, 'start-zero'))
                obj = { ...obj, 'ratings.val': { $gte: Number(min_rate) } };

            if(quickFilter && isValidText(quickFilter)){
                if(quickFilter.includes('free-cancel')) obj.cancellation = [0,1,2,3,5,6,7,8];
                if(quickFilter.includes('no-insurance')) obj = { ...obj, 'details.insurance' : false };
                if(quickFilter.includes('discounts')) obj = { ...obj, 'discount.percentage' : { $gte: 1 } };
            }

            if(bedroomFilter?.length > 0 && isValidText(bedroomFilter)){
                if(isValidNumber(Number(bedroomFilter.split(",")?.at(0)))) 
                    obj = { ...obj, 'details.rooms.num': { $gte: Number(bedroomFilter?.split(",")?.at(0)) } };
                if(isValidNumber(Number(bedroomFilter.split(",")?.at(1)))) 
                    obj = { ...obj, 'details.rooms.single_beds': { $gte: Number(bedroomFilter?.split(",")?.at(1)) } };
                if(isValidNumber(Number(bedroomFilter.split(",")?.at(2)))) 
                    obj = { ...obj, 'details.rooms.double_beds': { $gte: Number(bedroomFilter?.split(",")?.at(2)) } };
            }

            if(capacityFilter && isValidNumber(Number(capacityFilter.split(',')?.at(0)), null, null, 'start-zero')){
                obj.capacity = { 
                    $gte: Number(capacityFilter.split(',')?.at(0)),
                    $lte: isValidNumber(Number(capacityFilter.split(',')?.at(1))) ? Number(capacityFilter.split(',')?.at(1)) : undefined
                }
            }

            if(poolFilter && isValidText(poolFilter)) 
                obj = { ...obj, 'details.pool.companians': { $in: poolFilter.split(',') } }
            
            if(customers && isValidText(customers)){
                if(!isEnglish){
                    obj.customer_type = customers.split(',');
                } else {
                    obj = { ...obj, 'en_data.customerTypeEN': customers.split(',') };
                }
            }

            if(bathroomFacilities && isValidText(bathroomFacilities))
                obj = { ...obj, 'details.bathrooms.companians': { $in: bathroomFacilities.split(',') } };

            if(bathroomsNum && isValidNumber(Number(bathroomsNum)))
                obj = { ...obj, 'details.bathrooms.num': { $gte: Number(bathroomsNum) } };

            if(companiansFilter && isValidText(companiansFilter))
                obj = { ...obj, 'details.facilities': { $in: companiansFilter.split(',') } };

            if(kitchenFilter && isValidText(kitchenFilter))
                obj = { ...obj, 'details.kitchen.companians': { $in: kitchenFilter.split(',') } };

            if(type_is_vehicle === 'true'){
                obj.type_is_vehicle = true;
                if(isValidNumber(Number(vehicleType), null, null, 'start-zero'))
                    obj.vehicle_type = Number(vehicleType);
            } else {
                if(categories){
                    obj.specific_catagory = categories.split(',');
                } else if(specific){
                    obj.specific_catagory = specific;
                }
            }
            
            if(price_range) obj.price = { $gte: Number(price_range.split(',')[0]), $lte: Number(price_range.split(',')[1])};

            // if(id && mongoose.Types.ObjectId.isValid(id)) {
            //     if(secondObj){
            //         secondObj = { ...secondObj, owner_id: { $ne: id } };
            //     } else {
            //         secondObj = { ...obj, owner_id: { $ne: id } };
            //     }
            // }    
            
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

            // console.log('secondOb: ', secondObj);

            // console.log('obj: ', obj);

            if(secondObj){
                return secondObj;
            } else {
                return obj;
            }

        };

        const sortObj = () => {
            switch(sort){
                case 'default':
                    return { 'ratings.val': -1, 'ratings.no': -1, updatedAt: -1, createdAt: -1 };
                case 'ratings':
                    return { 'ratings.val': -1, 'ratings.no': -1, createdAt: -1 }
                case 'high-price':
                    return { price: -1, 'ratings.val': -1, 'ratings.no': -1, createdAt: -1 }
                case 'low-price':
                    return { price: 1, 'ratings.val': -1, 'ratings.no': -1, createdAt: -1 }
                default:
                    return { 'ratings.val': -1, 'ratings.no': -1, updatedAt: -1, createdAt: -1 };
            }
        };
        
        const skipObj = () => {

            if(!skip || typeof Number(skip) !== 'number') return 0;

            if(Math.round(Number(skip)) <= 0 || Math.round(Number(skip)) > 1000) return 0;

            return Math.round(Number(skip));

        };

        console.log(filterObj());

        if(isCount?.length > 0) {
            const count = await Property.find(filterObj()).count();
            console.log('only count: ', count);
            return res.status(200).json({ count });
        }
            
        const properties = await Property.find(filterObj())
            .limit(Number(cardsPerPage) > 36 ? 36 : Number(cardsPerPage)).sort(sortObj()).skip(skipObj())
            .select('_id map_coordinates images title description booked_days ratings city neighbourhood en_data.titleEN en_data.neighbourEN price discount specific_catagory'); 

        if(!properties || properties.length <= 0) return res.status(404).json({ message: 'not exist error' });
        
        console.log('props length: ', properties.length);

        const count = await Property.find(filterObj()).countDocuments();

        console.log('count: ', count);

        return res.status(200).json({ properties, count });

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const createProperty = async(req, res) => {

    try {

        if(!req || !req.user || !req.body) return res.status(400).json({ message: 'request error' });
        
        const { id } = req.user;

        const user = await User.findOne({ _id: id, email_verified: true });

        if(!user) return res.status(400).json({ message: 'User not exist' });

        console.log(req.body);

        const { 
            type_is_vehicle, specific_catagory, title, description, city, 
            neighbourhood, map_coordinates, price, details, 
            terms_and_conditions, area, contacts, capacity, customer_type, 
            en_data, cancellation, vehicleType
        } = req.body;

        if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'login error' });

        if(!isValidText(specific_catagory) || !allowedSpecificCatagory.includes(specific_catagory)) return res.status(400).json({ message: 'specific catagory error' });

        if(!isValidText(title)) return res.status(400).json({ message: 'title error' });

        if(!isValidText(description)) return res.status(400).json({ message: 'desc error' });

        if(!isValidText(city) || !citiesArray.find(i => i.value === city)) return res.status(400).json({ message: 'city error' });

        if(neighbourhood && !isValidText(neighbourhood)) return res.status(400).json({ message: 'neighbourhood error' });
        
        if(map_coordinates && (map_coordinates.length !== 2 || !isValidPoint(map_coordinates[0], map_coordinates[1]))) return res.status(400).json({ message: 'coordinates error' });

        if(!isValidNumber(price)) return res.status(400).json({ message: 'price error' });

        if(details && !isValidDetails(details)) return res.status(400).json({ message: 'details error' });

        if(terms_and_conditions && !isValidTerms(terms_and_conditions)) return res.status(400).json({ message: 'details error' });

        if(area && !isValidNumber(Number(area))) return res.status(400).json({ message: 'area error' });

        if(contacts && !isValidContacts(contacts)) return res.status(400).json({ message: 'contacts error' });

        if(capacity && !isValidNumber(capacity, null, 0)) return res.status(400).json({ message: 'capacity error' });

        if(customer_type && !isValidText(customer_type)) return res.status(400).json({ message: 'capacity error' });

        if(en_data && !isValidEnData(en_data)) return res.status(400).json({ message: 'enDetails error' });

        if(vehicleType && !isValidNumber(Number(vehicleType), null, null, 'start-zero'))
            return res.status(400).json({ message: 'vehicleType error' });
            
        const unitCode = await getUnitCode();

        console.log('unitCode: ', unitCode);

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
                contacts,
                capacity,
                customer_type,
                en_data
            };
            if(isValidNumber(Number(cancellation), 10, 0, 'start-zero')) obj.cancellation = cancellation;
            if(unitCode) obj.unit_code = unitCode;
            if(map_coordinates[0] && map_coordinates[1] && isValidPoint(map_coordinates[0], map_coordinates[1])) obj.map_coordinates = map_coordinates;
            if(type_is_vehicle) obj.vehicle_type = vehicleType;
            return obj;
        }
        
        const property = await Property.create(getObj());

        if(!property) return res.status(500).json({ message: 'server error' });

        console.log('property id: ', property._id);

        await User.updateOne({ _id: id }, {
            $inc: { num_of_units: 1 }
        });

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

const getPropertyByUnitCode = async(req, res) => {

    try {

        const unit = req?.params?.unit;

        if(!unit || !isValidNumber(Number(unit), null, null, 'start-zero')) return res.status(400).json({ message: 'invalid unit code' });

        const property = await Property.findOne({ unit_code: unit }).select('_id');

        if(!property) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json({ id: property._id });
        
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'server error' });
    };

};

const getOwnerProperty = async(req, res) => {

    try {

        console.log('owner props');

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { userId } = req.params;

        const { skip, cardsPerPage } = req.query;

        if(!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'request error' });

        const properties = await Property.find({ owner_id: userId }).limit(Number(cardsPerPage))
            .select('_id images title checked visible isRejected description reviews ratings city neighbourhood price discount')
            .sort({ createdAt: -1 }).skip(isValidNumber(Number(skip), 36) ? Number(skip) : 0);

        if(!properties || properties.length <= 0) return res.status(400).json({ message: 'not exist error' });

        const count = await Property.find({ owner_id: userId }).countDocuments();

        return res.status(200).json({ properties, count });

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }

};

const getHostDetails = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { userId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'request error' });

        const host = await User.findOne({ _id: userId }).select('username usernameEN num_of_units rating_score reviews_num createdAt');

        console.log(host);
        
        return res.status(200).json({
            username: host.username,
            usernameEN: host.usernameEN,
            units: host.num_of_units,
            rating: host.rating_score,
            reviewsNum: host.reviews_num,
            joinDate: host.createdAt
        });

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: err.message });
    }

};

const addReview = async(req, res) => {

    try {

        if(!req || !req.user || !req.body || !req.query) return res.status(400).json({ message: 'request error' });

        const { id, username } = req.user;
        
        const { propertyId } = req.query;

        const { text, user_rating } = req.body;

        if(!mongoose.Types.ObjectId.isValid(id) 
            || !mongoose.Types.ObjectId.isValid(propertyId) 
            || !isValidText(username) 
            || !isValidText(text) 
            || !isValidNumber(user_rating) || user_rating > 5 || user_rating < 0){        
            return res.status(400).json({ message: 'input error' });
        }

        const user = await User.findOne({ _id: id, email_verified: true, books: { $elemMatch: { property_id: propertyId, verified_book: true } } });

        if(!user) return res.status(400).json({ message: 'User not exist' });

        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: { $ne: id }, reviews: { $elemMatch: { writer_id: id } } }, {
            $set: { "reviews.$" : { 
                writer_id: id, 
                username: username,
                text, user_rating: Number(user_rating).toFixed(2),
                updatedAt: Date.now()
            }}
        }).select('_id ratings reviews owner_id');

        if(!property){

            const inserted = await Property.findOneAndUpdate({ _id: propertyId, owner_id: { $ne: id } }, {
                $push: { reviews: { 
                    writer_id: id, 
                    username: username,
                    text, user_rating: Number(user_rating).toFixed(2),
                    updatedAt: Date.now()
                }}
            }).select('_id ratings owner_id');

            if(!inserted) return res.status(403).json({ message: 'access error' });

            const updatedInsertedProp = await updatePropertyRating(propertyId, inserted.ratings, 'add', Number(user_rating), null, null, null, inserted.owner_id);    
        
            return res.status(201).json(updatedInsertedProp);

        } else {
            const updatedProp = await updatePropertyRating(propertyId, property.ratings, 'update', Number(user_rating), property.reviews?.find(i => i.writer_id?.toString() === id)?.user_rating, null, null, property.owner_id);
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
            terms_and_conditions, contacts, discount,
            enObj, cancellation, capacity, customerType
        } = req.body;

        console.log(enObj.english_details);
        //return res.status(400).json({ message: 'stop' });

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        if(title && !isValidText(title)) return res.status(400).json({ message: 'title error' });
        
        if(description && !isValidText(description)) return res.status(400).json({ message: 'desc error' });

        if(price && !isValidNumber(price)) return res.status(400).json({ message: 'price error' });
       
        if(details && !isValidDetails(details)) return res.status(400).json({ message: 'details error' });
        
        if(terms_and_conditions && !isValidTerms(terms_and_conditions)) return res.status(400).json({ message: 'details error' });

        if(contacts && !isValidContacts(contacts)) return res.status(400).json({ message: 'contacts error' });

        if(discount?.percentage && (!isValidNumber(discount.percentage, 100, 0) || !isValidNumber(discount.num_of_days_for_discount, 2000, 0)))
            return res.status(400).json({ message: 'discount error' });

        if(capacity && !isValidNumber(capacity, null, 0)) return res.status(400).json({ message: 'capacity error' });

        if(customerType && !isValidText(customerType)) return res.status(400).json({ message: 'customer type error' });
        
        if(enObj && !isValidEnData(enObj)) return res.status(400).json({ message: 'enDetails error' });

        const getUpdateObj = () => {
            let obj = {
                title,
                description,
                price,
                details,
                terms_and_conditions,
                checked: false,
                isRejected: false,
                reject_reasons: [],
                contacts,
                discount,
                capacity,
                customer_type: customerType,
                en_data: enObj,
            }
            if(isValidNumber(Number(cancellation), 10, null, 'start-zero')) obj.cancellation = cancellation;
        };

        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: id }, getUpdateObj(), { new: true });

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

        const prop = await Property.findOneAndDelete({ _id: propertyId, owner_id: id }).select('ratings reviews owner_id');

        if(!prop) return res.status(403).json({ message: 'access error' });

        await updateHostEvaluation(id, 'remove all', null, null, null, null, prop.reviews);

        await Report.deleteOne({ reported_id: propertyId });

        await User.updateOne({ _id: id }, { $inc: { num_of_units: -1 } });

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
    getPropertyByUnitCode,
    getOwnerProperty,
    getHostDetails,
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