import Order from "../models/order.js";
import ProductReview from "../models/productReview.js";
import Variant from "../models/variant.js";
import ReturnRequest from "../models/returnRequest.js";

export const getVariantGroupAnalytics = async (req, res) => {
  try {
    const { id, primaryOptionId } = req.params;
    const requestedRange = req.query.range || "3 Months";

    const query = { product: id };
    if (req.vendor?._id) {
      query.vendorId = req.vendor._id;
    }

    const allVariants = await Variant.find(query);
    if (!allVariants || allVariants.length === 0) {
      return res.status(404).json({ success: false, message: "No variants found for this product" });
    }

    const filteredVariants = allVariants.filter(variant => {
      let pOptId = 'default';
      if (variant.attributes && variant.attributes.length > 0) {
        const colorAttr = variant.attributes.find(a => a.attribute?.name?.toLowerCase() === 'color' || a.attribute?.name?.toLowerCase() === 'colour');
        if (colorAttr) {
          pOptId = colorAttr.option?.toString() || 'default';
        } else {
          pOptId = variant.attributes[0]?.option?.toString() || 'default';
        }
      }
      return pOptId === primaryOptionId;
    });

    if (filteredVariants.length === 0) {
      return res.status(404).json({ success: false, message: "No variants found for this primary option" });
    }

    const variantIds = filteredVariants.map(v => v._id);

    // Aggregate Orders data for these variants
    const orderItemsAggregation = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.variant": { $in: variantIds }, status: { $nin: ["cancelled"] } } }
    ]);

    let totalRevenue = 0;
    let totalUnitsSold = 0;

    // Determine status breakdown
    const orderStatusCounts = {
      delivered: 0,
      processing: 0,
      shipped: 0,
      pending: 0,
      cancelled: 0,
    };

    // Keep track of unique orders
    const uniqueOrders = new Set();
    const recentOrdersMap = new Map();

    // 1. Build Time Series Buckets
    const now = new Date();

    // A. 7 Days (daily)
    const sevenDaysBuckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
      sevenDaysBuckets.push({
        label,
        month: label,
        startDate: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
        endDate: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
        revenue: 0,
        orders: 0,
        units: 0,
        avgOrderValue: 0,
      });
    }

    // B. 30 Days (6 x 5-day intervals)
    const thirtyDaysBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const endD = new Date(now);
      endD.setDate(endD.getDate() - (i * 5));
      const startD = new Date(endD);
      startD.setDate(startD.getDate() - 4);
      const label = `${startD.getDate()}-${endD.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      thirtyDaysBuckets.push({
        label,
        month: label,
        startDate: new Date(startD.getFullYear(), startD.getMonth(), startD.getDate(), 0, 0, 0),
        endDate: new Date(endD.getFullYear(), endD.getMonth(), endD.getDate(), 23, 59, 59, 999),
        revenue: 0,
        orders: 0,
        units: 0,
        avgOrderValue: 0,
      });
    }

    // C. 3 Months (monthly)
    const threeMonthsBuckets = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      threeMonthsBuckets.push({
        label,
        month: label,
        startDate: d,
        endDate: nextM,
        revenue: 0,
        orders: 0,
        units: 0,
        avgOrderValue: 0,
      });
    }

    // D. 6 Months (monthly)
    const sixMonthsBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      sixMonthsBuckets.push({
        label,
        month: label,
        startDate: d,
        endDate: nextM,
        revenue: 0,
        orders: 0,
        units: 0,
        avgOrderValue: 0,
      });
    }

    // E. 1 Year (12 monthly)
    const oneYearBuckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      oneYearBuckets.push({
        label,
        month: label,
        startDate: d,
        endDate: nextM,
        revenue: 0,
        orders: 0,
        units: 0,
        avgOrderValue: 0,
      });
    }

    // Process order items
    orderItemsAggregation.forEach(order => {
      const item = order.items;
      uniqueOrders.add(order._id.toString());

      const itemRevenue = (item.sellingPrice || 0) * (item.quantity || 1);
      totalRevenue += itemRevenue;
      totalUnitsSold += (item.quantity || 1);

      // Status mapping
      const status = item.status || order.status || 'pending';
      if (['delivered'].includes(status)) orderStatusCounts.delivered++;
      else if (['processing', 'packed'].includes(status)) orderStatusCounts.processing++;
      else if (['shipped', 'on_the_way'].includes(status)) orderStatusCounts.shipped++;
      else if (['cancelled'].includes(status)) orderStatusCounts.cancelled++;
      else orderStatusCounts.pending++;

      const orderTime = new Date(order.createdAt).getTime();

      // Populate buckets
      const fillBuckets = (buckets) => {
        for (const b of buckets) {
          if (orderTime >= b.startDate.getTime() && orderTime <= b.endDate.getTime()) {
            b.revenue += itemRevenue;
            b.orders += 1;
            b.units += (item.quantity || 1);
            break;
          }
        }
      };

      fillBuckets(sevenDaysBuckets);
      fillBuckets(thirtyDaysBuckets);
      fillBuckets(threeMonthsBuckets);
      fillBuckets(sixMonthsBuckets);
      fillBuckets(oneYearBuckets);

      // Recent orders list
      if (!recentOrdersMap.has(order._id.toString())) {
        recentOrdersMap.set(order._id.toString(), {
          _id: order._id,
          orderId: order.orderId,
          user: order.user,
          createdAt: order.createdAt,
          amount: itemRevenue,
          status: status
        });
      } else {
        const existing = recentOrdersMap.get(order._id.toString());
        existing.amount += itemRevenue;
      }
    });

    // Compute avgOrderValue for buckets
    const finalizeBuckets = (buckets) =>
      buckets.map(b => ({
        month: b.label,
        label: b.label,
        revenue: Math.round(b.revenue * 100) / 100,
        orders: b.orders,
        units: b.units,
        avgOrderValue: b.orders > 0 ? Math.round((b.revenue / b.orders) * 100) / 100 : 0,
      }));

    const timeSeries = {
      "7 Days": finalizeBuckets(sevenDaysBuckets),
      "30 Days": finalizeBuckets(thirtyDaysBuckets),
      "3 Months": finalizeBuckets(threeMonthsBuckets),
      "6 Months": finalizeBuckets(sixMonthsBuckets),
      "1 Year": finalizeBuckets(oneYearBuckets),
    };

    const salesChart = timeSeries[requestedRange] || timeSeries["3 Months"];

    const recentOrders = Array.from(recentOrdersMap.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Populate user in recent orders
    await Order.populate(recentOrders, { path: "user", select: "username email" });

    // Calculate reserved units from pending/processing unfulfilled orders
    const reservedAggregation = await Order.aggregate([
      { $match: { status: { $in: ["pending", "processing", "packed"] } } },
      { $unwind: "$items" },
      { $match: { "items.variant": { $in: variantIds }, "items.status": { $nin: ["cancelled", "refunded"] } } },
      { $group: { _id: null, totalReserved: { $sum: "$items.quantity" } } }
    ]);
    const totalReserved = reservedAggregation[0]?.totalReserved || 0;
    const totalStock = filteredVariants.reduce((s, v) => s + (v.stock || 0), 0);

    // Stock & Inventory Summary
    const inventorySummary = {
      totalProducts: filteredVariants.length,
      available: Math.max(0, totalStock - totalReserved),
      reserved: totalReserved,
      lowStock: filteredVariants.filter(v => (v.stock || 0) > 0 && (v.stock || 0) <= 5).length,
      outOfStock: filteredVariants.filter(v => (v.stock || 0) === 0).length,
      totalStock
    };

    // Customer Reviews
    const reviews = await ProductReview.find({
      $or: [
        { variant: { $in: variantIds } },
        { product: id }
      ]
    })
      .populate("user", "username email profileImage")
      .sort({ createdAt: -1 })
      .limit(5);

    // Returns & Refunds from ReturnRequest
    const returnRequests = await ReturnRequest.find({
      $or: [
        { originalVariant: { $in: variantIds } },
        { product: id }
      ]
    }).lean();

    const totalReturns = returnRequests.length;
    const exchangeCount = returnRequests.filter(r => r.type === "exchange").length;
    const standardReturnCount = returnRequests.filter(r => r.type === "return").length;
    const qcPassedCount = returnRequests.filter(r => r.qcStatus === "passed").length;
    const refundedOrdersCount = returnRequests.filter(r => ["completed", "initiated"].includes(r.refundStatus) || r.status === "refunded").length;
    const refundAmount = returnRequests.reduce((sum, r) => sum + (r.refundAmount || 0), 0);

    const counts = {
      totalSales: totalRevenue,
      unitsSold: totalUnitsSold,
      totalOrders: uniqueOrders.size,
      returns: totalReturns,
      returnRate: uniqueOrders.size > 0 ? ((totalReturns / uniqueOrders.size) * 100).toFixed(1) : 0,
      exchangeCount,
      standardReturnCount,
      qcPassedCount,
      refundAmount,
      refundedOrdersCount,
      avgRefundPerReturn: totalReturns > 0 ? Math.round(refundAmount / totalReturns) : 0,
      avgOrderValue: uniqueOrders.size > 0 ? (totalRevenue / uniqueOrders.size).toFixed(2) : 0
    };

    // Stock History for variant SKUs
    const stockHistory = filteredVariants.map(v => ({
      _id: v._id,
      sku: v.sku || 'N/A',
      stock: v.stock || 0,
      status: (v.stock || 0) > 10 ? 'In Stock' : (v.stock || 0) > 0 ? 'Low Stock' : 'Out of Stock',
      updatedAt: v.updatedAt || v.createdAt || now,
      change: `${v.stock || 0} units available in warehouse`
    }));

    // Product Activity Timeline
    const activity = [
      {
        action: "Variant Group Active",
        description: `${filteredVariants.length} variant SKU(s) managed with ${inventorySummary.totalStock} total units`,
        date: filteredVariants[0]?.updatedAt || now,
        type: "inventory"
      },
      ...recentOrders.slice(0, 3).map(o => ({
        action: "Order Placed",
        description: `Order ${o.orderId || `#${o._id.toString().slice(-6)}`} • ₹${(o.amount || 0).toLocaleString()} by ${o.user?.username || 'Customer'}`,
        date: o.createdAt,
        type: "order"
      })),
      ...returnRequests.slice(0, 2).map(r => ({
        action: `${r.type === 'exchange' ? 'Exchange' : 'Return'} ${r.status || 'Requested'}`,
        description: `Refund ₹${(r.refundAmount || 0).toLocaleString()} • ${r.reason || 'Customer claim'}`,
        date: r.createdAt || now,
        type: "return"
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      data: {
        counts,
        salesChart,
        timeSeries,
        orderStats: orderStatusCounts,
        inventorySummary,
        recentOrders,
        reviews,
        stockHistory,
        activity,
        qa: []
      }
    });

  } catch (error) {
    console.error("Error fetching variant group analytics:", error);
    res.status(500).json({ success: false, message: "Failed to fetch variant group analytics" });
  }
};
