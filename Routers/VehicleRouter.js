const express = require('express');
const { getVehicles, getSpecificVehicleDetails, createVehicle } = require('../Controllers/VehiclesController');
const router = express.Router();

router.get('/', getVehicles);

router.get('/:vehicleId', getSpecificVehicleDetails);

router.post('/', createVehicle);

module.exports = router;