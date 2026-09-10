/**
 * SmartProcure Queue State Machine Utility
 *
 * Deterministic application-level validation layer for queue status transitions.
 * Mirrors the PostgreSQL RPC transition matrix.
 */

export const QUEUE_STATUS = Object.freeze({
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_SERVICE: 'IN_SERVICE',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED'
});

export const QUEUE_EVENT_TYPE = Object.freeze({
  TOKEN_ISSUED: 'TOKEN_ISSUED',
  CALLED: 'CALLED',
  SERVICE_STARTED: 'SERVICE_STARTED',
  SERVICE_COMPLETED: 'SERVICE_COMPLETED',
  SKIPPED: 'SKIPPED'
});

// Allowed Status Transition Map
export const ALLOWED_TRANSITIONS = Object.freeze({
  [QUEUE_STATUS.WAITING]: Object.freeze([QUEUE_STATUS.CALLED, QUEUE_STATUS.SKIPPED]),
  [QUEUE_STATUS.CALLED]: Object.freeze([QUEUE_STATUS.IN_SERVICE, QUEUE_STATUS.SKIPPED]),
  [QUEUE_STATUS.IN_SERVICE]: Object.freeze([QUEUE_STATUS.COMPLETED]),
  [QUEUE_STATUS.COMPLETED]: Object.freeze([]),
  [QUEUE_STATUS.SKIPPED]: Object.freeze([])
});

// Transition to Event Type Mapping
export const DERIVED_EVENT_MAPPING = Object.freeze({
  [`${QUEUE_STATUS.WAITING}->${QUEUE_STATUS.CALLED}`]: QUEUE_EVENT_TYPE.CALLED,
  [`${QUEUE_STATUS.WAITING}->${QUEUE_STATUS.SKIPPED}`]: QUEUE_EVENT_TYPE.SKIPPED,
  [`${QUEUE_STATUS.CALLED}->${QUEUE_STATUS.IN_SERVICE}`]: QUEUE_EVENT_TYPE.SERVICE_STARTED,
  [`${QUEUE_STATUS.CALLED}->${QUEUE_STATUS.SKIPPED}`]: QUEUE_EVENT_TYPE.SKIPPED,
  [`${QUEUE_STATUS.IN_SERVICE}->${QUEUE_STATUS.COMPLETED}`]: QUEUE_EVENT_TYPE.SERVICE_COMPLETED
});

/**
 * Checks whether a queue transition from currentStatus to targetStatus is valid.
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {boolean}
 */
export function isValidTransition(currentStatus, targetStatus) {
  if (!currentStatus || !targetStatus) return false;
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(targetStatus);
}

/**
 * Validates a transition and returns the derived event type.
 * Throws an operational error if the transition is invalid.
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {string} derivedEventType
 */
export function validateTransition(currentStatus, targetStatus) {
  if (!isValidTransition(currentStatus, targetStatus)) {
    const error = new Error(`Invalid queue status transition from ${currentStatus} to ${targetStatus}`);
    error.name = 'InvalidTransitionError';
    error.statusCode = 400;
    error.currentStatus = currentStatus;
    error.targetStatus = targetStatus;
    throw error;
  }

  const transitionKey = `${currentStatus}->${targetStatus}`;
  return DERIVED_EVENT_MAPPING[transitionKey];
}

/**
 * Retrieves derived event type for a transition, or null if invalid.
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {string|null}
 */
export function getDerivedEventType(currentStatus, targetStatus) {
  const transitionKey = `${currentStatus}->${targetStatus}`;
  return DERIVED_EVENT_MAPPING[transitionKey] || null;
}

export default {
  QUEUE_STATUS,
  QUEUE_EVENT_TYPE,
  ALLOWED_TRANSITIONS,
  DERIVED_EVENT_MAPPING,
  isValidTransition,
  validateTransition,
  getDerivedEventType
};
