const Order = require('../models/order');
const Product = require('../models/product');
const sendEmail = require('../utils/sendEmail');
const createOrderReceiptPdf = require('../utils/orderReceipt');
const User = require('../models/user');

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
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paymentMethod

    } = req.body;

    const order = new Order({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paymentMethod,
        paidAt: !['Cash on Delivery', 'Card (demo only)'].includes(paymentMethod)
            && paymentInfo?.status === 'succeeded' ? Date.now() : undefined,
        user: req.user._id
    })
    order.orderReference = `KC-${order._id.toString().toUpperCase()}`
    await order.save()

    const customer = { name: req.user.name, email: req.user.email }
    const paymentNote = paymentMethod === 'Cash on Delivery'
        ? 'Payment is pending and due on delivery.'
        : 'Payment is pending; this demo order did not process a card payment.'
    const emailItems = order.orderItems.map(item => (
        `${escapeHtml(item.name)} (Qty ${item.quantity}) — PHP ${Number(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    )).join('<br>')
    let receipt

    try {
        receipt = await createOrderReceiptPdf({
            ...order.toObject(),
            customer
        })
    } catch (receiptError) {
        console.error('Order receipt PDF generation failed:', receiptError)
    }

    try {
        await sendEmail({
            email: req.user.email,
            subject: `Koeshin's Collectibles — Order ${order.orderReference} confirmed`,
            message: `
                <strong>Order confirmed</strong><br>
                Hi ${escapeHtml(req.user.name)},<br><br>
                Thank you for your order ${escapeHtml(order.orderReference)}.<br><br>
                ${emailItems}<br><br>
                Total: PHP ${Number(order.totalPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}<br>
                Payment status: Pending.<br>
                ${paymentNote}<br><br>
                You can view your order in your Koeshin's Collectibles account.
            `,
            attachments: receipt ? [{
                filename: receipt.filename,
                content: receipt.buffer,
                contentType: 'application/pdf'
            }] : undefined
        })
    } catch (emailError) {
        console.error('Order confirmation email failed:', emailError)
    }

    res.status(200).json({
        success: true,
        order: {
            ...order.toObject(),
            customer,
            receiptPdf: receipt?.buffer.toString('base64')
        }
    })
}

exports.myOrders = async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id })
    // console.log(req.user)
    res.status(200).json({
        success: true,
        orders
    })
}

exports.getSingleOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) {
        res.status(404).json({
            message: 'No Order found with this ID',

        })
    }
    res.status(200).json({
        success: true,
        order
    })
}

exports.allOrders = async (req, res, next) => {
    const orders = await Order.find()
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
    const order = await Order.findByIdAndDelete(req.params.id)

    if (!order) {
        return res.status(400).json({
            message: 'No Order found with this ID',

        })

    }
    return res.status(200).json({
        success: true
    })
}

exports.updateOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id)
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

    if (nextStatus === 'Delivered') {
        await Promise.all(order.orderItems.map(item => updateStock(item.product, item.quantity)))
        order.deliveredAt = Date.now()
    }

    order.orderStatus = nextStatus
    await order.save()

    // 5.4 — send status-update email with order summary and PDF receipt.
    let emailSent = false
    try {
        const customer = await User.findById(order.user).select('email name')
        if (!customer?.email) {
            throw new Error('Customer email is unavailable')
        }

        const itemsHtml = order.orderItems.map(item =>
            `<tr>
                <td style="padding:4px 8px">${escapeHtml(item.name)}</td>
                <td style="padding:4px 8px;text-align:center">${item.quantity}</td>
                <td style="padding:4px 8px;text-align:right">PHP ${Number(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
            </tr>`
        ).join('')

        const statusColor = nextStatus === 'Delivered' ? '#22863a' : nextStatus === 'Shipped' ? '#0366d6' : '#6f42c1'
        const receipt = await createOrderReceiptPdf({
            ...order.toObject(),
            customer: { name: customer.name, email: customer.email }
        })

        await sendEmail({
            email: customer.email,
            subject: `Koeshin Collectibles – Order ${order.orderReference || order._id} is now ${nextStatus}`,
            message: `
                <div style="font-family:sans-serif;max-width:600px;margin:auto">
                    <h2 style="margin-bottom:4px">Order status update</h2>
                    <p>Hi ${escapeHtml(customer.name)},</p>
                    <p>Your order <strong>${order.orderReference || order._id}</strong> has been updated to:
                        <span style="color:${statusColor};font-weight:bold"> ${nextStatus}</span>
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
                    <p style="text-align:right"><strong>Total: PHP ${Number(order.totalPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></p>
                    <p style="color:#666;font-size:0.9em">You can view your full order and download your PDF receipt from your order history page.</p>
                    <p>Thank you for shopping at Koeshin Collectibles!</p>
                </div>
            `,
            attachments: [{
                filename: receipt.filename,
                content: receipt.buffer,
                contentType: 'application/pdf'
            }]
        })
        emailSent = true
    } catch (emailErr) {
        console.error('Order status email failed:', emailErr.message)
    }

    res.status(200).json({
        success: true,
        emailSent,
        message: emailSent ? undefined : 'Order status updated, but the email notification could not be sent.'
    })
}

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    console.log("product", id)
    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false })
}

exports.totalOrders = async (req, res, next) => {
    const totalOrders = await Order.aggregate([
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
    console.log(customerSales)
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
    const pipeline = []

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