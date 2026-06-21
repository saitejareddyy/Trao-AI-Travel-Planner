const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const protect = require('../middleware/auth');

// Protect all routes under this endpoint
router.use(protect);

router.get('/', tripController.getUserTrips);
router.get('/:id', tripController.getTripById);
router.post('/', tripController.generateNewTrip);
router.put('/:id', tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);
router.post('/:id/regenerate-day', tripController.regenerateDay);

module.exports = router;
