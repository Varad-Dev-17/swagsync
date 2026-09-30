export const getReturnEligibility = (order, item, latestRequest = null) => {
  const effStatus = (item?.status || order?.status || '').toLowerCase();
  // If order/item is not delivered, return eligibility is not applicable yet.
  if (effStatus !== 'delivered') {
    return {
      showButton: false,
      buttonLabel: '',
      helperMessage: '',
      expiryDate: null,
      isExpired: false,
      hasReturnRequest: false,
    };
  }

  // Active status means a request is currently pending/processing
  const isActiveRequest = latestRequest && !['rejected', 'refunded', 'exchanged', 'completed'].includes(latestRequest.status);

  // Case 1: Active Return/Exchange Request exists
  if (isActiveRequest) {
    const requestType = latestRequest.type === 'exchange' ? 'Exchange' : 'Return';
    const statusText = latestRequest.status.charAt(0).toUpperCase() + latestRequest.status.slice(1).replace(/_/g, ' ');
    
    return {
      showButton: true,
      buttonLabel: `${requestType} Requested`,
      helperMessage: `Status: ${statusText}`,
      expiryDate: null,
      isExpired: false,
      hasReturnRequest: true,
      activeRequest: latestRequest,
    };
  }

  // If item was already returned & refunded, no further return is possible
  const isRefundCompleted = latestRequest && (
    latestRequest.status === 'refunded' || 
    (latestRequest.type === 'return' && latestRequest.status === 'completed')
  );
  if (isRefundCompleted) {
    return {
      showButton: false,
      buttonLabel: '',
      helperMessage: 'Item Returned & Refunded',
      expiryDate: null,
      isExpired: true,
      hasReturnRequest: false,
    };
  }

  const isExchangeCompleted = latestRequest && (
    latestRequest.status === 'exchanged' || 
    (latestRequest.type === 'exchange' && latestRequest.status === 'completed')
  );

  const isRejected = latestRequest && latestRequest.status === 'rejected';

  const policy = item.product?.returnPolicy;
  const isReturnable = policy?.returnable ?? true;
  const returnDays = policy?.returnDays ?? 7;

  // Prefer deliveredAt for date calculation, fallback to updatedAt or current date
  const deliveryDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt || Date.now());
  
  // For exchanged items, return window begins from exchange completion date or delivery date, whichever is later
  let effectiveDeliveryDate = deliveryDate;
  if (isExchangeCompleted && latestRequest.updatedAt) {
    const exchangeDate = new Date(latestRequest.updatedAt);
    if (!isNaN(exchangeDate.getTime()) && exchangeDate > effectiveDeliveryDate) {
      effectiveDeliveryDate = exchangeDate;
    }
  }

  const expiryDate = new Date(effectiveDeliveryDate);
  expiryDate.setDate(expiryDate.getDate() + returnDays);

  const currentDate = new Date();
  const isExpired = currentDate > expiryDate;

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Case 2: Product is not returnable
  if (!isReturnable) {
    return {
      showButton: false,
      buttonLabel: '',
      helperMessage: 'This product is not returnable.',
      expiryDate: null,
      isExpired: true,
      hasReturnRequest: false,
    };
  }

  // Case 3: Return window has expired
  if (isExpired) {
    return {
      showButton: false,
      buttonLabel: '',
      helperMessage: isRejected 
        ? `Request rejected • Window closed on ${formatDate(expiryDate)}` 
        : `Return window closed on ${formatDate(expiryDate)}`,
      expiryDate,
      isExpired: true,
      hasReturnRequest: false,
    };
  }

  // Case 4: Eligible for return
  return {
    showButton: true,
    buttonLabel: isRejected ? 'Re-apply Return' : (isExchangeCompleted ? 'Return' : 'Return / Exchange'),
    helperMessage: `Return available until ${formatDate(expiryDate)}`,
    expiryDate,
    isExpired: false,
    hasReturnRequest: false,
    isPostExchange: isExchangeCompleted,
    isRejected,
  };
};
