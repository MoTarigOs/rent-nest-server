const mongoose = require('mongoose');
const Property = require('../Data/PropertyModel.js');
const Report = require('../Data/ReportModel.js');
const User = require('../Data/UserModel.js');
const { isValidText, allowedSpecificCatagory, isValidNumber, citiesArray, getCitiesArrayForFilter, isValidTerms, isValidDetails, updatePropertyRating, isValidPoint, isValidBookDateFormat, isValidContacts, isValidEnData, getUnitCode, updateHostEvaluation, isValidPrices, sendToEmail, isValidEmail, sendNotification, sendAdminNotification } = require('../utils/logic.js');
const sortLatDistance = 0.1;
const sortLongDistance = 0.3;
const propSelectObj = '_id map_coordinates images title description booked_days ratings city neighbourhood en_data.titleEN en_data.neighbourEN prices discount specific_catagory';

const getProperties = async(req, res) => {

    try {

        if(!req || !req.query) return res.status(400).json({ message: 'request error' });

        const { 
            city, type_is_vehicle, specific, price_range, 
            min_rate, searchText, neighbourText, text, sort, long, lat, skip, categories,
            quickFilter, isEnglish, isCount, cardsPerPage,
            reservationType,
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
            isSearchMap
        } = req.query;

        console.log('reservationType: ', reservationType);
        // console.log('quickFilter: ', quickFilter);
        // console.log('categories: ', categories);
        // console.log('bedroomFilter: ', bedroomFilter);
        // console.log('capacityFilter: ', capacityFilter);
        // console.log('poolFilter: ', poolFilter);
        // console.log('customers: ', customers);
        // console.log('bathroomFacilities: ', bathroomFacilities);
        // console.log('bathroomsNum: ', bathroomsNum);
        // console.log('type_is_vehicle: ', type_is_vehicle);
        // console.log('vehicleType: ', vehicleType);

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

        if(searchText && !isValidText(searchText)) return res.status(400).json({ message: 'search text error' });
        if(neighbourText && !isValidText(neighbourText)) return res.status(400).json({ message: 'neighbour text error' });

        if(cardsPerPage && !isValidNumber(Number(cardsPerPage))) return res.status(400).json({ message: 'cards per page error' });

        const getPriceFieldName = (isFilter, invert) => {

            if(!invert) invert = 1;

            const getFilterObj = (fftype) => {
                if(!isFilter) return 1 * invert;
                switch(fftype?.toLowerCase()){
                    case 'daily':
                        return {
                            $gte: Number(price_range?.split(',')[0]), 
                            $lte: Number(price_range?.split(',')[1])
                        };
                    case 'weekly':
                        return {
                            $lte: Number(price_range?.split(',')[1]) * 7
                        };
                    case 'monthly':
                        return { 
                            $lte: Number(price_range?.split(',')[1]) * 30
                        };
                    case 'yearly':
                        return {
                            $lte: Number(price_range?.split(',')[1]) * 365
                        };
                    default:
                        return -1;
                }
            };
            
            if(!isValidText(reservationType)) return { 'prices.daily': getFilterObj(reservationType) };
            if(!isFilter) switch(reservationType?.toLowerCase()){
                case 'daily':
                    return { 'prices.daily': getFilterObj(reservationType) };
                case 'weekly':
                    return { 'prices.weekly': getFilterObj('weekly'), 'prices.daily': getFilterObj('daily') };
                case 'monthly':
                    return { 'prices.monthly': getFilterObj('monthly'), 'prices.weekly': getFilterObj('weekly'), 'prices.daily': getFilterObj('daily') };
                case 'seasonly':
                    return { 'prices.seasonly': getFilterObj('seasonly') };
                case 'yearly':
                    return { 'prices.yearly': getFilterObj('yearly'), 'prices.monthly': getFilterObj('monthly'), 'prices.weekly': getFilterObj('weekly'), 'prices.daily': getFilterObj('daily') };
                default:
                    return { 'prices.daily': getFilterObj('daily') };
            }
            else switch(reservationType?.toLowerCase()){
                case 'daily':
                    return { 'prices.daily': getFilterObj('daily') };
                case 'weekly':
                    return { $or: [ 
                         { 'prices.weekly': getFilterObj('weekly') },  
                         { 'prices.daily': getFilterObj('daily') }
                    ]};
                case 'monthly':
                    return { $or: [ 
                        { 'prices.monthly': getFilterObj('monthly') },  
                        { 'prices.weekly': getFilterObj('weekly') },  
                        { 'prices.daily': getFilterObj('daily') }
                   ]};
                case 'seasonly':
                    return { 'prices.daily': getFilterObj('daily') };
                case 'yearly':
                    return { $or: [ 
                        { 'prices.yearly': getFilterObj('yearly') },  
                        { 'prices.monthly': getFilterObj('monthly') },  
                        { 'prices.weekly': getFilterObj('weekly') },  
                        { 'prices.daily': getFilterObj('daily') }
                   ]};
                default:
                    return { 'prices.daily': getFilterObj('daily') };
            }

        };

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
                if(quickFilter.includes('discounts')) obj = { ...obj, $or: [ { isDeal: true }, {'discount.percentage': { $gte: 1 }} ] }
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
                    obj.customer_type = { $in: customers.split(',') };
                } else {
                    obj = { ...obj, 'en_data.customerTypeEN': { $in: customers.split(',') } };
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
            
            if(price_range) obj = { 
                ...obj, ...getPriceFieldName(true)
            };

            // if(id && mongoose.Types.ObjectId.isValid(id)) {
            //     if(secondObj){
            //         secondObj = { ...secondObj, owner_id: { $ne: id } };
            //     } else {
            //         secondObj = { ...obj, owner_id: { $ne: id } };
            //     }
            // }    
            
            if(searchText?.length > 0 || neighbourText?.length > 0) {
                const searchTextObj = () => {
                    const obbArr = [];
                    if(searchText?.length > 0)
                        searchText.split(' ').forEach((i) => {
                            obbArr.push({ title: { $regex: "^" + i, $options: "i" } });
                            obbArr.push({ 'en_data.titleEN': { $regex: "^" + i, $options: "i" } });
                            obbArr.push({ 'en_data.descEN': { $regex: "^" + i, $options: "i" } });
                            obbArr.push({ description: { $regex: "^" + i, $options: "i" } });
                        });
                    if(neighbourText?.length > 0)
                        neighbourText.split(' ').forEach((i) => {
                            obbArr.push({ neighbourhood: { $regex: "^" + i, $options: "i" } });
                            obbArr.push({ 'en_data.descEN': { $regex: "^" + i, $options: "i" } });
                            obbArr.push({ description: { $regex: "^" + i, $options: "i" } });
                            obbArr.push({ 'en_data.neighbourEN': { $regex: "^" + i, $options: "i" } });
                        });
                    return obbArr;
                };
                if(secondObj){
                    secondObj = { ...secondObj, $or: searchTextObj() };
                } else {
                    secondObj = { ...obj, $or: searchTextObj() };
                }
            }

            if(sort === 'address' && isValidNumber(Number(long)) && isValidNumber(Number(lat))){
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

            if(secondObj){
                return secondObj;
            } else {
                return obj;
            }

        };

        const sortObj = () => {
            switch(sort){
                case 'default':
                    return { 'ratings.val': -1, 'ratings.no': -1, ...getPriceFieldName(), updatedAt: -1, createdAt: -1 };
                case 'ratings':
                    return { 'ratings.val': -1, 'ratings.no': -1, createdAt: -1 }
                case 'high-price':
                    return { ...getPriceFieldName(false, -1), 'ratings.val': -1, 'ratings.no': -1, createdAt: -1 }
                case 'low-price':
                    return { ...getPriceFieldName(), 'ratings.val': -1, 'ratings.no': -1, createdAt: -1 }
                default:
                    return { 'ratings.val': -1, 'ratings.no': -1, updatedAt: -1, createdAt: -1 };
            }
        };
        
        const skipObj = () => {

            if(!skip || typeof Number(skip) !== 'number') return 0;

            if(Math.round(Number(skip)) <= 0 || Math.round(Number(skip)) > 1000) return 0;

            return Math.round(Number(skip));

        };

        console.log(filterObj(), sortObj());
        
        const maxLimit = isSearchMap ? 120 : 36;

        // if(isCount?.length > 0) {
        //     const count = await Property.find(filterObj()).count();
        //     console.log('only count: ', count);
        //     return res.status(200).json({ count });
        // }
            
        const properties = await Property.find(filterObj())
            .limit((isValidNumber(Number(cardsPerPage)) && Number(cardsPerPage) < maxLimit) ? Number(cardsPerPage) : maxLimit).sort(sortObj()).skip(skipObj())
            .select('_id map_coordinates images title description booked_days ratings city neighbourhood en_data.titleEN en_data.neighbourEN prices discount specific_catagory isDeal'); 

        if(!properties || properties.length <= 0) return res.status(404).json({ message: 'not exist error' });
        
        // console.log('props length: ', properties.length);

        let count = null; 

        if(!(isValidNumber(Number(skip)) && Number(skip) > 0)) 
            count = await Property.find(filterObj()).countDocuments();

        return res.status(200).json({ properties, count });

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const createProperty = async(req, res) => {

    try {

        // return res.status(200).json({ message: 'success' });

        if(!req || !req.user || !req.body) return res.status(400).json({ message: 'request error' });
        
        const { id, email } = req.user;

        // important host account !!!

        // const user = await User.findOne({ _id: id, email_verified: true, account_type: 'host' });

        // if(!user) return res.status(400).json({ message: 'User not exist' });

        const { 
            type_is_vehicle, specific_catagory, title, description, city, 
            neighbourhood, map_coordinates, details, 
            terms_and_conditions, area, contacts, capacity, customer_type, 
            en_data, cancellation, vehicleType, prices, landArea, floor,
        } = req.body;

        if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'login error' });

        if(!isValidText(specific_catagory) || !allowedSpecificCatagory.includes(specific_catagory)) return res.status(400).json({ message: 'specific catagory error' });

        if(!isValidText(title) || title.slice(0, 4) === 'unit') return res.status(400).json({ message: 'title error' });

        if(!isValidText(description)) return res.status(400).json({ message: 'desc error' });

        if(!isValidText(city) || !citiesArray.find(i => i.value === city)) return res.status(400).json({ message: 'city error' });

        if(neighbourhood && !isValidText(neighbourhood)) return res.status(400).json({ message: 'neighbourhood error' });
        
        if(map_coordinates && (map_coordinates.length !== 2 || !isValidPoint(map_coordinates[0], map_coordinates[1]))) return res.status(400).json({ message: 'coordinates error' });

        if(!isValidPrices(prices)) return res.status(400).json({ message: 'prices error' });

        if(details && !isValidDetails(details)) return res.status(400).json({ message: 'details error' });

        if(terms_and_conditions && !isValidTerms(terms_and_conditions)) return res.status(400).json({ message: 'details error' });

        if(area && !isValidNumber(Number(area))) return res.status(400).json({ message: 'area error' });

        if(contacts && !isValidContacts(contacts)) return res.status(400).json({ message: 'contacts error' });

        if(capacity && !isValidNumber(capacity, null, 0)) return res.status(400).json({ message: 'capacity error' });

        if(customer_type && customer_type?.length > 0) {
            for (let i = 0; i < customer_type.length; i++) {
                if(!isValidText(customer_type[i]))
                    return res.status(400).json({ message: 'customer type error' });
            }
        } 

        if(en_data && !isValidEnData(en_data)) return res.status(400).json({ message: 'enDetails error' });

        if(vehicleType && !isValidNumber(Number(vehicleType), null, null, 'start-zero'))
            return res.status(400).json({ message: 'vehicleType error' });
            
        const unitCode = await getUnitCode();

        console.log('unitCode: ', unitCode);

        // return res.status(200).json({ message: 'success' });

        const getObj = () => {
            const obj = {
                owner_id: id,
                type_is_vehicle,
                specific_catagory,
                title,
                description,
                city,
                neighbourhood,
                prices,
                images: [],
                videos: [],
                reviews: [],
                details,
                terms_and_conditions,
                area,
                landArea,
                floor,
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

        await sendAdminNotification('create-prop', property._id, id, property.title);

        await sendNotification(email, 'create-prop', property._id, id, null, property.title, 1);

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

const getPropertiesByIds = async(req, res) => {

    try {

        const ids = req?.params?.ids;
        const skip = req?.params?.skip;
        const limit = req?.params?.limit;

        const idArray = ids?.split(',');

        console.log('id array: ', idArray);

        if(!Array.isArray(idArray) || !idArray?.length > 0)
            return res.status(400).json({ message: 'request error' });

        for (let i = 0; i < idArray.length; i++) {
            if(!mongoose.Types.ObjectId.isValid(idArray[i]))
                return res.status(400).json({ message: 'request error' });
        }

        const properties = await Property.find({ _id: idArray })
        .select(propSelectObj).skip(skip);
        // .limit(Number(limit) > 36 ? 36 : Number(limit))

        console.log('props: ', properties);
        
        if(!properties) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(properties);
        
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
            .select('_id images title checked visible isRejected description reviews ratings city neighbourhood en_data prices discount')
            .sort({ createdAt: -1 }).skip(isValidNumber(Number(skip), 36) ? Number(skip) : 0);

        if(!properties || properties.length <= 0) return res.status(400).json({ message: 'not exist error' });

        const count = await Property.find({ owner_id: userId }).countDocuments();

        return res.status(200).json({ properties, count });

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const getHostDetails = async(req, res) => {

    try {

        if(!req || !req.params) return res.status(400).json({ message: 'request error' });

        const { userId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'request error' });

        const host = await User.findOne({ _id: userId, account_type: 'host' })
        .select('username num_of_units rating_score reviews_num first_name first_name_en last_name last_name_en createdAt');

        console.log(host);

        if(!host) return res.status(400).json({ message: 'not exist error' });
        
        return res.status(200).json({
            username: host.username,
            units: host.num_of_units,
            rating: host.rating_score,
            reviewsNum: host.reviews_num,
            firstName: host.first_name,
            firstNameEN: host.first_name_en,
            lastName: host.last_name,
            lastNameEN: host.last_name_en,
            joinDate: host.createdAt
        });

    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const addReview = async(req, res) => {

    try {

        if(!req || !req.user || !req.body || !req.query) return res.status(400).json({ message: 'request error' });

        const { id, username, email } = req.user;
        
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

        const getReviewType = () => {
            const x = Math.round(Number(user_rating));
            if(x === 5) return { 'num_of_reviews_percentage.five': 1 };
            if(x === 4) return { 'num_of_reviews_percentage.four': 1 };
            if(x === 3) return { 'num_of_reviews_percentage.three': 1 };
            if(x === 2) return { 'num_of_reviews_percentage.two': 1 };
            if(x === 1) return { 'num_of_reviews_percentage.one': 1 };
            return null;
        };

        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: { $ne: id }, reviews: { $elemMatch: { writer_id: id } } }, {
            $set: { "reviews.$" : { 
                writer_id: id, 
                username: username,
                text, user_rating: Number(user_rating).toFixed(2),
                updatedAt: Date.now()
            }},
            $inc: getReviewType()
        }).select('_id ratings reviews owner_id');

        if(!property){

            const inserted = await Property.findOneAndUpdate({ _id: propertyId, owner_id: { $ne: id } }, {
                $push: { reviews: { 
                    writer_id: id, 
                    username: username,
                    text, user_rating: Number(user_rating)?.toFixed(2),
                    updatedAt: Date.now()
                }},
                $inc: getReviewType()
            }).select('_id ratings owner_id');

            if(!inserted) return res.status(403).json({ message: 'access error' });

            const updatedInsertedProp = await updatePropertyRating(propertyId, inserted.ratings, 'add', Number(user_rating), null, null, null, inserted.owner_id);    
        
            await sendNotification(email, 'new-review', propertyId, inserted.owner_id, id, username);

            return res.status(201).json(updatedInsertedProp);

        } else {

            const updatedProp = await updatePropertyRating(propertyId, property.ratings, 'update', Number(user_rating), property.reviews?.find(i => i.writer_id?.toString() === id)?.user_rating, null, null, property.owner_id);
            
            await sendNotification(email, 'update-review', propertyId, property.owner_id, id, username);

            return res.status(201).json(updatedProp);

        }         
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }
};

const editProperty = async(req, res) => {

    try {

        if(!req || !req.user || !req.params || !req.body) return res.status(400).json({ message: 'request error' });

        const { id, email } = req.user;
        const { propertyId } = req.params;
        const { 
            title, description, details, 
            terms_and_conditions, contacts, discount,
            enObj, cancellation, capacity, customerType,
            prices, landArea, floor, city, neighbourhood,
            map_coordinates, type_is_vehicle
        } = req.body;

        if(details && !isValidDetails(details)) return res.status(400).json({ message: 'details error' });

        console.log('prices: ', prices);

        // return res.status(400).json({ message: 'stop' });

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        if(title && (!isValidText(title) || title.slice(0, 4) === 'unit')) return res.status(400).json({ message: 'title error' });
        
        if(description && !isValidText(description)) return res.status(400).json({ message: 'desc error' });

        if(!isValidText(city) || !citiesArray.find(i => i.value === city)) return res.status(400).json({ message: 'city error' });

        if(neighbourhood && !isValidText(neighbourhood)) return res.status(400).json({ message: 'neighbourhood error' });

        if(prices && !isValidPrices(prices)) return res.status(400).json({ message: 'prices error' });

        if(details && !isValidDetails(details)) return res.status(400).json({ message: 'details error' });
        
        if(terms_and_conditions && !isValidTerms(terms_and_conditions)) return res.status(400).json({ message: 'details error' });

        if(contacts && !isValidContacts(contacts)) return res.status(400).json({ message: 'contacts error' });

        if(discount?.percentage && (!isValidNumber(discount.percentage, 100, 0) || !isValidNumber(discount.num_of_days_for_discount, 2000, 0)))
            return res.status(400).json({ message: 'discount error' });

        if(capacity && !isValidNumber(capacity, null, 0)) return res.status(400).json({ message: 'capacity error' });

        // if(customerType && customerType?.length > 0) {
        //     for (let i = 0; i < customerType.length; i++) {
        //         if(!isValidText(customerType[i]))
        //             return res.status(400).json({ message: 'customer type error' });
        //     }
        // } 

        if(landArea && !isValidText(landArea)) return res.status(400).json({ message: 'land area error' });

        if(floor && !isValidText(floor)) return res.status(400).json({ message: 'floor error' });
        
        if(enObj && !isValidEnData(enObj)) return res.status(400).json({ message: 'enDetails error' });

        if(type_is_vehicle && typeof type_is_vehicle !== 'boolean') return res.status(400).json({ message: 'is vehicle error' });

        if(map_coordinates && (map_coordinates.length !== 2 || !isValidPoint(map_coordinates[0], map_coordinates[1]))) return res.status(400).json({ message: 'coordinates error' });

        const getUpdateObj = () => {
            let obj = {
                title,
                description,
                prices,
                details,
                terms_and_conditions,
                checked: false,
                isRejected: false,
                reject_reasons: [],
                contacts,
                discount,
                capacity,
                customer_type: customerType,
                landArea,
                floor,
                en_data: enObj,
            }
            if(type_is_vehicle) obj.city = city;
            if(type_is_vehicle) obj.neighbourhood = neighbourhood;
            if(!type_is_vehicle && enObj) delete obj.en_data['neighbourEN'];
            if(isValidNumber(Number(cancellation), 10, null, 'start-zero')) obj.cancellation = cancellation;
            return obj;
        };

        console.log(getUpdateObj());
        //return res.status(400).json({ message: 'success' });
        const property = await Property.findOneAndUpdate({ _id: propertyId, owner_id: id, type_is_vehicle }, getUpdateObj(), { new: true });

        if(!property) return res.status(403).json({ message: 'access error' });

        await sendAdminNotification('edit-prop', propertyId, id, title);

        await sendNotification(email, 'edit-prop', propertyId, id, null, title);

        return res.status(201).json(property);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'server error' });
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
        return res.status(501).json({ message: 'server error' });
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
        return res.status(501).json({ message: 'server error' });
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
        return res.status(501).json({ message: 'server error' });
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
        return res.status(501).json({ message: 'server error' });
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
        return res.status(501).json({ message: 'server error' });
    }

};

const deleteProperty = async(req, res) => {

    try {

        if(!req || !req.user || !req.params) return res.status(400).json({ message: 'request error' });

        const { id } = req.user;
        const { propertyId } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(propertyId))
            return res.status(400).json({ message: 'request error' });

        const prop = await Property.findOneAndDelete({ _id: propertyId, owner_id: id }).select('ratings title reviews owner_id');

        console.log('deleting this: ', prop);
        
        if(!prop) return res.status(403).json({ message: 'access error' });

        await updateHostEvaluation(id, 'remove all', null, null, null, null, prop.reviews);

        await Report.deleteOne({ reported_id: propertyId });

        await sendNotification(null, 'delete-prop', propertyId, id, null, prop.title, -1);

        return res.status(201).json({ message: 'success' });
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }

};

const getDeals = async(req, res) => {

    try {

        const props = await Property.find({ 
            $or: [ { isDeal: true }, {'discount.percentage': { $gte: 1 }} ] 
        }).sort({ 'ratings.val': -1, 'discount.percentage': -1 });

        if(!props) return res.status(404).json({ message: 'not exist error' });

        return res.status(200).json(props);
        
    } catch (err) {
        console.log(err);
        return res.status(501).json({ message: 'server error' });
    }
};

module.exports = {
    getProperties,
    createProperty,
    getProperty,
    getPropertyByUnitCode,
    getPropertiesByIds,
    getOwnerProperty,
    getHostDetails,
    addReview,
    editProperty,
    hideProperty,
    showProperty,
    setAbleToBook,
    setPreventBook,
    setBookedDays,
    deleteProperty,
    getDeals
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