import Order from "../models/order.js";
import ProductReview from "../models/productReview.js";
import Variant from "../models/variant.js";

export const getVariantGroupAnalytics = async (req, res) => {
  try {
    const { id, primaryOptionId } = req.params;

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
    let refundAmount = 0;
    let totalReturns = 0;

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

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySales = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthYear = d.toLocaleString('en-US', { month: 'short' });
      monthlySales[monthYear] = { revenue: 0, orders: 0, units: 0 };
    }

    orderItemsAggregation.forEach(order => {
      const item = order.items;
      uniqueOrders.add(order._id.toString());

      const itemRevenue = item.sellingPrice * item.quantity;
      totalRevenue += itemRevenue;
      totalUnitsSold += item.quantity;

      // Status mapping
      const status = item.status || order.status || 'pending';
      if (['delivered'].includes(status)) orderStatusCounts.delivered++;
      else if (['processing', 'packed'].includes(status)) orderStatusCounts.processing++;
      else if (['shipped', 'on_the_way'].includes(status)) orderStatusCounts.shipped++;
      else if (['cancelled'].includes(status)) orderStatusCounts.cancelled++;
      else orderStatusCounts.pending++;

      // Chart data
      if (order.createdAt >= sixMonthsAgo) {
        const monthYear = new Date(order.createdAt).toLocaleString('en-US', { month: 'short' });
        if (monthlySales[monthYear]) {
          monthlySales[monthYear].revenue += itemRevenue;
          monthlySales[monthYear].orders += 1;
          monthlySales[monthYear].units += item.quantity;
        }
      }

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

    const salesChart = Object.keys(monthlySales).reverse().map(month => ({
      month,
      revenue: monthlySales[month].revenue,
      orders: monthlySales[month].orders,
      units: monthlySales[month].units
    }));

    const recentOrders = Array.from(recentOrdersMap.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Populate user in recent orders
    await Order.populate(recentOrders, { path: "user", select: "username email" });

    // Stock & Inventory Summary
    const inventorySummary = {
      totalProducts: filteredVariants.length,
      available: 0,
      reserved: 0,
      lowStock: 0,
      outOfStock: 0,
      totalStock: 0
    };

    filteredVariants.forEach(v => {
      inventorySummary.totalStock += v.stock || 0;
      if (v.stock > 0) inventorySummary.available++;
      else inventorySummary.outOfStock++;
      if (v.stock > 0 && v.stock < 10) inventorySummary.lowStock++;
    });

    // Customer Reviews
    const reviews = await ProductReview.find({ variant: { $in: variantIds } })
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .limit(5);

    const counts = {
      totalSales: totalRevenue,
      unitsSold: totalUnitsSold,
      totalOrders: uniqueOrders.size,
      returns: totalReturns,
      refundAmount: refundAmount,
      avgOrderValue: uniqueOrders.size > 0 ? (totalRevenue / uniqueOrders.size).toFixed(2) : 0
    };

    return res.status(200).json({
      success: true,
      data: {
        counts,
        salesChart,
        orderStats: orderStatusCounts,
        inventorySummary,
        recentOrders,
        reviews
      }
    });

  } catch (error) {
    console.error("Error fetching variant group analytics:", error);
    res.status(500).json({ success: false, message: "Failed to fetch variant group analytics" });
  }
};
