const Order = require('../models/order');
const Product = require('../models/product');
const mongoose = require('mongoose');
const { randomUUID } = require('crypto')
const sendEmail = require('../utils/sendEmail');
const createOrderReceiptPdf = require('../utils/orderReceipt');
const User = require('../models/user');
const { calculateOrderTotals } = require('../utils/orderPricing');

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
})[character])

// Create a new order   =>  /api/v1/order/new
exports.newOrder = async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        paymentMethod
    } = req.body;

    if (!['Cash on Delivery', 'Demo payment'].includes(paymentMethod)) {
        return res.status(400).json({ message: 'Please select a valid payment method' })
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ message: 'Please add at least one item to your order' })
    }

    const trustedOrderItems = []
    const reservedStock = []
    try {
        for (const item of orderItems) {
            const productId = item.product && typeof item.product === 'object'
                ? item.product._id
                : item.product
            const quantity = Number(item.quantity)
            if (!mongoose.Types.ObjectId.isValid(productId) || !Number.isInteger(quantity) || quantity < 1) {
                await releaseReservedStock(reservedStock)
                return res.status(400).json({ message: 'One or more order items are invalid' })
            }

            const product = await Product.findOneAndUpdate(
                { _id: productId, isDeleted: { $ne: true }, stock: { $gte: quantity } },
                { $inc: { stock: -quantity } },
                { new: true, runValidators: true }
            )
            if (!product) {
                await releaseReservedStock(reservedStock)
                const availableProduct = await Product.findOne({ _id: productId, isDeleted: { $ne: true } })
                if (availableProduct) {
                    return res.status(400).json({ message: `${availableProduct.name} does not have enough stock` })
                }
                return res.status(400).json({ message: 'One or more products in your order are no longer available' })
            }
            reservedStock.push({ product: product._id, quantity })

            trustedOrderItems.push({
                name: product.name,
                quantity,
                image: product.images?.[0]?.url || item.image,
                price: product.price,
                product: product._id
            })
        }
    } catch (error) {
        await releaseReservedStock(reservedStock)
        return next(error)
    }

    const totals = calculateOrderTotals(trustedOrderItems)
    const isDemoPayment = paymentMethod === 'Demo payment'
    const paymentReference = isDemoPayment ? `DEMO-${randomUUID().toUpperCase()}` : undefined
    const order = new Order({
        orderItems: trustedOrderItems,
        shippingInfo,
        ...totals,
        paymentInfo: isDemoPayment
            ? { status: 'succeeded', reference: paymentReference }
            : { status: 'pending' },
        paymentMethod,
        paidAt: isDemoPayment ? Date.now() : undefined,
        stockDeducted: true,
        user: req.user._id
    })
    order.orderReference = `KC-${order._id.toString().toUpperCase()}`
    try {
        await order.save()
    } catch (error) {
        await releaseReservedStock(reservedStock)
        return next(error)
    }

    const customer = { name: req.user.name, email: req.user.email }
    res.status(200).json({
        success: true,
        order: {
            ...order.toObject(),
            customer
        }
    })

    setImmediate(async () => {
        try {
            const paymentNote = paymentMethod === 'Cash on Delivery'
                ? 'Pay on delivery.'
                : 'Paid (demo payment). Demo payment, no real charge.'
            const paymentDate = order.paidAt
                ? new Date(order.paidAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
                : null
            const emailItems = order.orderItems.map(item => (
                `${escapeHtml(item.name)} (Qty ${item.quantity}) — PHP ${Number(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
            )).join('<br>')
            const receipt = await createOrderReceiptPdf({
                ...order.toObject(),
                customer
            })

            await sendEmail({
                email: customer.email,
                subject: `Koeshin's Collectibles — Order ${order.orderReference} confirmed`,
                message: `
                    <strong>Order confirmed</strong><br>
                    Hi ${escapeHtml(customer.name)},<br><br>
                    Thank you for your order ${escapeHtml(order.orderReference)}.<br><br>
                    ${emailItems}<br><br>
                    Subtotal: PHP ${Number(order.itemsPrice).toFixed(2)}<br>
                    Shipping: PHP ${Number(order.shippingPrice).toFixed(2)}<br>
                    Tax: PHP ${Number(order.taxPrice).toFixed(2)}<br>
                    Total: PHP ${Number(order.totalPrice).toFixed(2)}<br>
                    Payment status: ${isDemoPayment ? 'Paid (demo payment)' : 'Pending'}.<br>
                    ${paymentDate ? `Paid date: ${escapeHtml(paymentDate)}<br>` : ''}
                    ${isDemoPayment ? `Payment reference: ${escapeHtml(paymentReference)}<br>` : ''}
                    ${paymentNote}<br><br>
                    You can view your order in your Koeshin's Collectibles account.
                `,
                attachments: [{
                    filename: receipt.filename,
                    content: receipt.buffer,
                    contentType: 'application/pdf'
                }]
            })
        } catch (emailError) {
            console.error('Order confirmation email failed:', emailError)
        }
    })
}

exports.myOrders = async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id, isDeleted: { $ne: true } })
    // console.log(req.user)
    res.status(200).json({
        success: true,
        orders
    })
}

exports.getSingleOrder = async (req, res, next) => {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
        .populate({ path: 'user', select: 'name email', match: { isDeleted: { $ne: true } } })
        .populate('orderItems.product', '_id isDeleted')
    if (!order) {
        return res.status(404).json({
            message: 'No Order found with this ID',

        })
    }
    const ownerId = order.user?._id || order.user
    if (req.user.role !== 'admin' && ownerId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this order' })
    }
    res.status(200).json({
        success: true,
        order
    })
}

exports.allOrders = async (req, res, next) => {
    const filter = req.query.deleted === 'true'
        ? { isDeleted: true }
        : { isDeleted: { $ne: true } }
    const orders = await Order.find(filter)
    // console.log(orders)
    let totalAmount = 0;

    orders.forEach(order => {

        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
}

exports.deleteOrder = async (req, res, next) => {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: { $ne: true } })

    if (!order) {
        return res.status(404).json({
            message: 'No Order found with this ID',

        })

    }
    order.isDeleted = true
    order.deletedAt = new Date()
    await order.save({ validateBeforeSave: false })
    return res.status(200).json({
        success: true
    })
}

exports.restoreOrder = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: true })
    if (!order) {
        return res.status(404).json({ success: false, message: 'Deleted order not found' })
    }
    order.isDeleted = false
    order.deletedAt = undefined
    await order.save({ validateBeforeSave: false })
    return res.status(200).json({ success: true })
}

exports.updateOrder = async (req, res, next) => {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
    if (!order) {
        return res.status(404).json({ message: 'Order not found' })
    }

    const allowedStatuses = ['Processing', 'Shipped', 'Delivered']
    const nextStatus = req.body.status
    if (!allowedStatuses.includes(nextStatus)) {
        return res.status(400).json({ message: 'Please select a valid order status' })
    }

    if (order.orderStatus === 'Delivered') {
        return res.status(400).json({
            message: 'You have already delivered this order',

        })
    }

    const deliveryReservations = []
    if (nextStatus === 'Delivered') {
        if (order.stockDeducted !== true) {
            try {
                for (const item of order.orderItems) {
                    const product = await Product.findOneAndUpdate(
                        { _id: item.product, isDeleted: { $ne: true }, stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity } },
                        { new: true, runValidators: true }
                    )
                    if (!product) {
                        await releaseReservedStock(deliveryReservations)
                        const availableProduct = await Product.findOne({
                            _id: item.product,
                            isDeleted: { $ne: true }
                        })
                        return res.status(400).json({
                            success: false,
                            message: availableProduct
                                ? `${item.name} does not have enough stock to complete this legacy order`
                                : `${item.name} is no longer available to complete this legacy order`
                        })
                    }
                    deliveryReservations.push({ product: product._id, quantity: item.quantity })
                }
            } catch (error) {
                await releaseReservedStock(deliveryReservations)
                return next(error)
            }
            order.stockDeducted = true
        }
        order.deliveredAt = Date.now()
        if (order.paymentMethod === 'Cash on Delivery') {
            order.paymentInfo = {
                ...(order.paymentInfo?.toObject?.() || order.paymentInfo || {}),
                status: 'succeeded'
            }
            order.paidAt = order.paidAt || Date.now()
        }
    }

    order.orderStatus = nextStatus
    try {
        await order.save()
    } catch (error) {
        await releaseReservedStock(deliveryReservations)
        return next(error)
    }

    res.status(200).json({
        success: true,
        notificationQueued: true
    })

    setImmediate(async () => {
        try {
            const customer = await User.findOne({
                _id: order.user,
                isDeleted: { $ne: true }
            }).select('email name')
            if (!customer?.email) {
                console.error('Order status email failed: customer email address is unavailable.')
                return
            }

            const totals = calculateOrderTotals(order.orderItems)
            const itemsHtml = order.orderItems.map(item =>
                `<tr>
                    <td style="padding:4px 8px">${escapeHtml(item.name)}</td>
                    <td style="padding:4px 8px;text-align:center">${item.quantity}</td>
                    <td style="padding:4px 8px;text-align:right">PHP ${Number(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>`
            ).join('')

            const statusColor = nextStatus === 'Delivered' ? '#22863a' : nextStatus === 'Shipped' ? '#0366d6' : '#6f42c1'
            const receiptPayment = order.paymentMethod === 'Cash on Delivery'
                ? (order.paymentInfo?.status === 'succeeded' ? 'Paid on delivery.' : 'Pay on delivery.')
                : 'Paid (demo payment). Demo payment, no real charge.'
            const receipt = await createOrderReceiptPdf({
                ...order.toObject(),
                customer: { name: customer.name, email: customer.email }
            })

            await sendEmail({
                email: customer.email,
                subject: nextStatus === 'Delivered'
                    ? `Koeshin's Collectibles — Order ${order.orderReference || order._id} delivered`
                    : `Koeshin's Collectibles — Order ${order.orderReference || order._id} is now ${nextStatus}`,
                message: `
                        <div style="font-family:sans-serif;max-width:600px;margin:auto">
                            <h2 style="margin-bottom:4px">${nextStatus === 'Delivered' ? 'Your order has been delivered' : 'Order status update'}</h2>
                            <p>Hi ${escapeHtml(customer.name)},</p>
                            <p>Your order <strong>${escapeHtml(order.orderReference || order._id)}</strong> ${nextStatus === 'Delivered'
                                ? 'has been delivered. We hope your new finds bring a little joy.'
                                : `has been updated to: <span style="color:${statusColor};font-weight:bold">${escapeHtml(nextStatus)}</span>`}
                            </p>
                            <table style="width:100%;border-collapse:collapse;margin:16px 0">
                                <thead>
                                    <tr style="background:#f6f8fa">
                                        <th style="padding:6px 8px;text-align:left">Item</th>
                                        <th style="padding:6px 8px;text-align:center">Qty</th>
                                        <th style="padding:6px 8px;text-align:right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>${itemsHtml}</tbody>
                            </table>
                            <p style="text-align:right">
                                Subtotal: PHP ${totals.itemsPrice.toFixed(2)}<br>
                                Shipping: PHP ${totals.shippingPrice.toFixed(2)}<br>
                                Tax: PHP ${totals.taxPrice.toFixed(2)}<br>
                                <strong>Total: PHP ${totals.totalPrice.toFixed(2)}</strong>
                            </p>
                            <p>Payment: ${escapeHtml(receiptPayment)}</p>
                            ${order.paidAt ? `<p>Paid date: ${escapeHtml(new Date(order.paidAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }))}</p>` : ''}
                            ${order.paymentInfo?.reference ? `<p>Payment reference: ${escapeHtml(order.paymentInfo.reference)}</p>` : ''}
                            <p style="color:#666;font-size:0.9em">Your PDF receipt is attached for safekeeping.</p>
                            <p>Thank you for shopping at Koeshin's Collectibles. Good things keep finding us.</p>
                        </div>
                    `,
                attachments: [{
                    filename: receipt.filename,
                    content: receipt.buffer,
                    contentType: 'application/pdf'
                }]
            })
        } catch (statusEmailError) {
            console.error('Order status email failed:', statusEmailError)
        }
    })
}

async function releaseReservedStock(reservedStock) {
    for (const reservation of reservedStock.reverse()) {
        try {
            await Product.updateOne(
                { _id: reservation.product },
                { $inc: { stock: reservation.quantity } }
            )
        } catch (error) {
            console.error(`Failed to restore reserved stock for product ${reservation.product}:`, error)
        }
    }
}

exports.totalOrders = async (req, res, next) => {
    const totalOrders = await Order.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ])
    if (!totalOrders) {
        return res.status(404).json({
            message: 'error total orders',
        })
    }
    res.status(200).json({
        success: true,
        totalOrders
    })

}

exports.totalSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalPrice" }
            }
        }
    ])
    if (!totalSales) {
        return res.status(404).json({
            message: 'error total sales',
        })
    }
    res.status(200).json({
        success: true,
        totalSales
    })
}

exports.customerSales = async (req, res, next) => {
    const customerSales = await Order.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            },
        },
        // {
        //     $group: {
        //         _id: "$user",
        //         total: { $sum: "$totalPrice" },
        //     }
        // },

        { $unwind: "$userDetails" },
        { $match: { 'userDetails.isDeleted': { $ne: true } } },
        {
            $group: {
                _id: "$user",
                total: { $sum: "$totalPrice" },
                doc: { "$first": "$$ROOT" },

            }
        },

        {
            $replaceRoot: {
                newRoot: { $mergeObjects: [{ total: '$total' }, '$doc'] },
            },
        },
        // {
        //     $group: {
        //         _id: "$userDetails.name",
        //         total: { $sum: "$totalPrice" }
        //     }
        // },
        {
            $project: {
                _id: 0,
                "userDetails.name": 1,
                total: 1,
            }
        },
        { $sort: { total: -1 } },

    ])
    if (!customerSales) {
        return res.status(404).json({
            message: 'error customer sales',
        })


    }
    // return console.log(customerSales)
    res.status(200).json({
        success: true,
        customerSales
    })

}

exports.salesPerMonth = async (req, res, next) => {
    const pipeline = [{ $match: { isDeleted: { $ne: true } } }]

    // 5.5 - optional date filter via query params ?startDate=YYYY-MM&endDate=YYYY-MM
    const { startDate, endDate } = req.query
    if (startDate || endDate) {
        const match = { paidAt: {} }
        if (startDate) match.paidAt.$gte = new Date(startDate)
        if (endDate) {
            const end = new Date(endDate)
            end.setMonth(end.getMonth() + 1)
            match.paidAt.$lt = end
        }
        pipeline.push({ $match: match })
    }

    pipeline.push(
        {
            $group: {
                _id: {
                    year: { $year: "$paidAt" },
                    month: { $month: "$paidAt" }
                },
                total: { $sum: "$totalPrice" },
            },
        },
        {
            $addFields: {
                month: {
                    $let: {
                        vars: {
                            monthsInString: [undefined, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
                        },
                        in: {
                            $arrayElemAt: ['$$monthsInString', "$_id.month"]
                        }
                    }
                }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
            $project: {
                _id: false,
                month: true,
                total: true,
            }
        }
    )

    const salesPerMonth = await Order.aggregate(pipeline)
    res.status(200).json({
        success: true,
        salesPerMonth
    })
}