import type { Request, Response } from 'express';
import { trackingService } from './tracking.service.js';
import { TRACKING_MESSAGES } from './tracking.constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';

export const trackingController = {
  timeline: asyncHandler(async (req: Request, res: Response) => {
    const events = await trackingService.timeline(req.params.orderId);
    return ok(res, events, TRACKING_MESSAGES.TIMELINE);
  }),

  recordLocation: asyncHandler(async (req: Request, res: Response) => {
    const ping = await trackingService.recordLocation(req.user!.id, req.body);
    return created(res, ping, TRACKING_MESSAGES.LOCATION_RECORDED);
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const history = await trackingService.history(req.user!.id);
    return ok(res, history, TRACKING_MESSAGES.HISTORY);
  }),
};
