/**
 * Reusable validation helper for Refund and Return/Exchange Status transitions.
 * Enforces business logic rules and prevents illegal lifecycle state changes.
 * QC requirement removed per user specification.
 */

/**
 * Validate Quality Check (QC) status transitions.
 * Kept as non-blocking stub for backward compatibility.
 */
export const validateQcTransition = () => {
  return { isValid: true };
};

/**
 * Validate Refund status transitions.
 * @param {String} currentRefundStatus - Existing refund status
 * @param {String} targetRefundStatus - Proposed refund status ("not_required", "initiated", "processing", "completed", "failed")
 * @returns {Object} { isValid: Boolean, message: String }
 */
export const validateRefundTransition = (currentRefundStatus, targetRefundStatus) => {
  if (!targetRefundStatus || targetRefundStatus === currentRefundStatus) {
    return { isValid: true };
  }

  const validStatuses = ["not_required", "initiated", "processing", "completed", "failed"];
  if (!validStatuses.includes(targetRefundStatus)) {
    return { isValid: false, message: `Invalid refund status: ${targetRefundStatus}` };
  }

  return { isValid: true };
};

/**
 * Validate overall Return / Exchange Request status transitions.
 * Simplified Flows:
 * Return: 1. Requested (pending) -> 2. Approved/Rejected -> 3. Pickup -> 4. Return completed (completed/refunded)
 * Exchange: 1. Requested (pending) -> 2. Approved/Rejected -> 3. Pickup & Replace -> 4. Exchange completed (completed/exchanged)
 * @param {String} currentStatus - Existing return request status
 * @param {String} targetStatus - Proposed return request status
 * @param {String} effectiveQcStatus - Effective QC status (ignored)
 * @param {String} requestType - "return" or "exchange"
 * @returns {Object} { isValid: Boolean, message: String }
 */
export const validateReturnStatusTransition = (currentStatus, targetStatus, effectiveQcStatus, requestType) => {
  if (!targetStatus || targetStatus === currentStatus) {
    return { isValid: true };
  }

  const validStatuses = [
    "pending",
    "approved",
    "rejected",
    "pickup",
    "pickup_replace",
    "completed",
    "pickup_scheduled",
    "picked_up",
    "received",
    "refunded",
    "exchanged",
    "packed",
    "shipped"
  ];

  if (!validStatuses.includes(targetStatus)) {
    return { isValid: false, message: `Invalid return request status: ${targetStatus}` };
  }

  if (currentStatus === "rejected") {
    return { isValid: false, message: "Cannot change status of a rejected request." };
  }

  return { isValid: true };
};
