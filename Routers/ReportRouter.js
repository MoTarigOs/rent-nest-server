const express = require('express');
const { reportProperty, reportReview } = require('../Controllers/ReportController.js');
const router = express.Router();

router.post('/', reportProperty);

router.post('/review', reportReview);

module.exports = router;