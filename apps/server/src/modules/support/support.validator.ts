import { body, param } from 'express-validator';
import { TICKET_STATUSES, TICKET_PRIORITIES } from './support.constants.js';

export const idParamValidator = [param('id').isString().notEmpty()];

export const createSupportTicketValidator = [
  body('subject').isString().trim().isLength({ min: 3 }).withMessage('Subject is required'),
  body('message').optional().isString().trim(),
  body('category').optional().isString(),
  body('priority').optional().isIn(TICKET_PRIORITIES).withMessage('Invalid priority'),
  body('orderId').optional().isString(),
];

export const updateSupportTicketValidator = [
  param('id').isString().notEmpty(),
  body('status').optional().isIn(TICKET_STATUSES).withMessage('Invalid status'),
  body('priority').optional().isIn(TICKET_PRIORITIES).withMessage('Invalid priority'),
  body('assigneeId').optional({ nullable: true }).isString(),
  body('category').optional().isString(),
];

export const addMessageValidator = [
  param('id').isString().notEmpty(),
  body('body').isString().trim().isLength({ min: 1 }).withMessage('Message body is required'),
  body('isInternal').optional().isBoolean(),
];
