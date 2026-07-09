import { Router } from 'express';
import { mapsController } from './maps.controller.js';
import { geocodeQueryValidator, routeQueryValidator } from './maps.validator.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = Router();

router.get('/route', validate(routeQueryValidator), mapsController.route);
router.get('/geocode', validate(geocodeQueryValidator), mapsController.geocode);

export default router;
