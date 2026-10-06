export const calculateBagTotals = (items, couponDiscount = 0) => {
  let subtotal = 0;
  let totalMRP = 0;
  let totalTax = 0;

  const itemBreakdown = items.map((item) => {
    const itemSellingPrice = parseFloat(item.price) || 0;
    const mrp = parseFloat(item.mrp) || itemSellingPrice;
    const gstRate = parseFloat(item.gstRate) || 0;
    
    const itemTotalSellingPrice = itemSellingPrice * item.quantity;
    const itemTotalMRP = mrp * item.quantity;
    
    // Reverse GST Calculation from the Selling Price
    const itemBasePrice = itemTotalSellingPrice / (1 + (gstRate / 100));
    const itemTax = itemTotalSellingPrice - itemBasePrice;

    subtotal += itemTotalSellingPrice;
    totalMRP += itemTotalMRP;
    totalTax += itemTax;

    return {
      ...item,
      itemTotal: itemTotalSellingPrice,
      gstRate: gstRate,
      cgst: itemTax / 2,
      sgst: itemTax / 2,
      taxAmount: itemTax,
      basePriceTotal: itemBasePrice,
    };
  });

  const finalSubtotal = Math.max(0, subtotal - couponDiscount);

  // 3-tier delivery rule
  let shippingAmount = 0;
  if (finalSubtotal < 500) shippingAmount = 99;
  else if (finalSubtotal < 1000) shippingAmount = 49;
  else shippingAmount = 0;

  const totalDiscount = (totalMRP - subtotal) + couponDiscount;

  return {
    items: itemBreakdown,
    totalMRP,
    subtotal,
    discountOnMRP: totalDiscount,
    couponDiscount,
    totalTax,
    totalCGST: totalTax / 2,
    totalSGST: totalTax / 2,
    shipping: shippingAmount, 
    // GST is inclusive in item selling prices; grandTotal is finalSubtotal + shipping
    grandTotal: finalSubtotal + shippingAmount, 
  };
};
