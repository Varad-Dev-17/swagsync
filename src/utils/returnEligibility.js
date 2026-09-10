export const getReturnEligibility = (order, item, activeRequest = null) => {
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

  const hasReturnRequest = !!activeRequest; 

  const policy = item.product?.returnPolicy;
  const isReturnable = policy?.returnable ?? true;
  const returnDays = policy?.returnDays ?? 7;

  // Prefer deliveredAt for date calculation, fallback to updatedAt or current date
  const deliveryDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt || Date.now());
  const expiryDate = new Date(deliveryDate);
  expiryDate.setDate(expiryDate.getDate() + returnDays);

  const currentDate = new Date();
  const isExpired = currentDate > expiryDate;

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Case 1: Active Return Request exists
  if (hasReturnRequest) {
    const requestType = activeRequest.type === 'exchange' ? 'Exchange' : 'Return';
    const statusText = activeRequest.status.charAt(0).toUpperCase() + activeRequest.status.slice(1);
    
    return {
      showButton: true,
      buttonLabel: `${requestType} Requested`,
      helperMessage: `Status: ${statusText}`,
      expiryDate: null,
      isExpired: false,
      hasReturnRequest,
      activeRequest,
    };
  }

  // Case 2: Product is not returnable
  if (!isReturnable) {
    return {
      showButton: false,
      buttonLabel: '',
      helperMessage: 'This product is not returnable.',
      expiryDate: null,
      isExpired: true, // effectively expired/invalid
      hasReturnRequest,
    };
  }

  // Case 3: Return window has expired
  if (isExpired) {
    return {
      showButton: false,
      buttonLabel: '',
      helperMessage: `Return window closed on ${formatDate(expiryDate)}`,
      expiryDate,
      isExpired: true,
      hasReturnRequest,
    };
  }

  // Case 4: Eligible for return
  return {
    showButton: true,
    buttonLabel: 'Return / Exchange',
    helperMessage: `Return available until ${formatDate(expiryDate)}`,
    expiryDate,
    isExpired: false,
    hasReturnRequest,
  };
};
