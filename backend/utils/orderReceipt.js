const fs = require('fs')
const path = require('path')
const { jsPDF } = require('jspdf')

const colors = {
    lavender: [224, 222, 239],
    lavenderDeep: [190, 188, 216],
    cocoa: [56, 45, 61],
    muted: [101, 90, 104],
    coral: [187, 64, 89],
    paper: [251, 248, 243],
    line: [222, 214, 224]
}

const phpAmount = amount => `PHP ${Number(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})}`

const paymentStatus = order => {
    if (order.paymentMethod === 'Cash on Delivery') {
        return order.orderStatus === 'Delivered' && (order.paymentInfo?.status === 'succeeded' || order.paidAt)
            ? 'Paid on delivery'
            : 'Pending (due on delivery)'
    }
    if (order.paymentMethod === 'Card (demo only)') return 'No payment processed (demo)'
    return order.paymentInfo?.status === 'succeeded' ? 'Paid' : 'Pending'
}

const createOrderReceiptPdf = async order => {
    const pdf = new jsPDF({ compress: true })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 15
    const rightEdge = pageWidth - margin
    let y = 53

    pdf.setProperties({ title: `Receipt ${order.orderReference || ''}`, subject: "Koeshin's Collectibles order receipt" })
    pdf.setFillColor(...colors.lavender)
    pdf.rect(0, 0, pageWidth, 39, 'F')

    try {
        const logoPath = path.resolve(__dirname, '../../frontend/public/images/logo.png')
        const logo = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
        pdf.addImage(logo, 'PNG', margin, 5, 28, 28)
    } catch (error) {
        console.error('Order receipt mascot logo could not be added:', error)
    }

    pdf.setTextColor(...colors.cocoa)
    pdf.setFont('times', 'bold')
    pdf.setFontSize(19)
    pdf.text("Koeshin's Collectibles", 48, 17)
    pdf.setFontSize(13)
    pdf.text('Order receipt', 48, 28)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text('A cabinet of curious little finds', rightEdge, 27, { align: 'right' })

    const reference = order.orderReference || 'Unavailable'
    const orderDate = new Date(order.createdAt || Date.now()).toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    })
    const customer = order.customer || {}
    const shipping = order.shippingInfo || {}
    const shippingAddress = [shipping.address, shipping.city, shipping.postalCode, shipping.country]
        .filter(Boolean)
        .join(', ') || 'Not provided'

    const drawDetail = (label, value, x, startY, width) => {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.setTextColor(...colors.muted)
        pdf.text(label.toUpperCase(), x, startY)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.setTextColor(...colors.cocoa)
        const lines = pdf.splitTextToSize(String(value || 'Not provided'), width)
        pdf.text(lines, x, startY + 5)
        return startY + 5 + lines.length * 4
    }

    const columnGap = 11
    const columnWidth = (pageWidth - margin * 2 - columnGap) / 2
    const leftColumn = margin
    const rightColumn = margin + columnWidth + columnGap
    const rowOneBottom = Math.max(
        drawDetail('Order reference', reference, leftColumn, y, columnWidth),
        drawDetail('Order date', orderDate, rightColumn, y, columnWidth)
    )
    y = rowOneBottom + 6
    const rowTwoBottom = Math.max(
        drawDetail('Customer', customer.name, leftColumn, y, columnWidth),
        drawDetail('Email', customer.email, rightColumn, y, columnWidth)
    )
    y = rowTwoBottom + 6
    const addressEnd = drawDetail('Shipping address', shippingAddress, leftColumn, y, columnWidth)
    drawDetail('Contact number', shipping.phoneNo, rightColumn, y, columnWidth)
    y = Math.max(addressEnd, y + 9) + 6
    drawDetail('Payment method', order.paymentMethod || 'Not recorded', leftColumn, y, columnWidth)
    const status = paymentStatus(order)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...colors.muted)
    pdf.text('PAYMENT STATUS', rightColumn, y)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(...colors.coral)
    pdf.text(status, rightColumn, y + 5)
    y += 16

    const columns = {
        name: margin + 3,
        quantity: 113,
        unitPrice: 151,
        lineAmount: rightEdge - 3
    }
    const productWidth = columns.quantity - columns.name - 7

    const drawTableHeader = () => {
        pdf.setFillColor(...colors.cocoa)
        pdf.roundedRect(margin, y, pageWidth - margin * 2, 10, 1.5, 1.5, 'F')
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.setTextColor(...colors.paper)
        pdf.text('Product', columns.name, y + 6.5)
        pdf.text('Qty', columns.quantity, y + 6.5, { align: 'right' })
        pdf.text('Unit price', columns.unitPrice, y + 6.5, { align: 'right' })
        pdf.text('Amount', columns.lineAmount, y + 6.5, { align: 'right' })
        y += 14
    }

    drawTableHeader()
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    for (const [index, item] of (order.orderItems || []).entries()) {
        const productLines = pdf.splitTextToSize(String(item.name || 'Item'), productWidth)
        const rowHeight = Math.max(9, productLines.length * 4.2 + 3)
        if (y + rowHeight + 48 > pageHeight - 22) {
            pdf.addPage()
            y = 18
            drawTableHeader()
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(8.5)
        }

        if (index % 2 === 0) {
            pdf.setFillColor(...colors.lavender)
            pdf.rect(margin, y - 3, pageWidth - margin * 2, rowHeight, 'F')
        }
        pdf.setTextColor(...colors.cocoa)
        pdf.text(productLines, columns.name, y + 1)
        pdf.text(String(item.quantity || 0), columns.quantity, y + 1, { align: 'right' })
        pdf.text(phpAmount(item.price), columns.unitPrice, y + 1, { align: 'right' })
        pdf.text(phpAmount(Number(item.price || 0) * Number(item.quantity || 0)), columns.lineAmount, y + 1, { align: 'right' })
        y += rowHeight
    }

    y += 6
    pdf.setDrawColor(...colors.line)
    pdf.line(pageWidth - 86, y, rightEdge, y)
    y += 7
    const drawSummaryLine = (label, amount, emphasis = false) => {
        pdf.setFont('helvetica', emphasis ? 'bold' : 'normal')
        pdf.setFontSize(emphasis ? 11 : 9)
        pdf.setTextColor(...(emphasis ? colors.coral : colors.cocoa))
        pdf.text(label, pageWidth - 84, y)
        pdf.text(amount, rightEdge, y, { align: 'right' })
        y += emphasis ? 9 : 6
    }

    drawSummaryLine('Subtotal', phpAmount(order.itemsPrice))
    drawSummaryLine('Shipping', Number(order.shippingPrice) === 0 ? 'FREE' : phpAmount(order.shippingPrice))
    drawSummaryLine('Tax', phpAmount(order.taxPrice))
    pdf.setFillColor(...colors.lavender)
    pdf.roundedRect(pageWidth - 90, y - 4, 75, 13, 1.5, 1.5, 'F')
    drawSummaryLine('TOTAL', phpAmount(order.totalPrice), true)

    y += 5
    pdf.setFont('times', 'italic')
    pdf.setFontSize(10)
    pdf.setTextColor(...colors.cocoa)
    const thanks = pdf.splitTextToSize("Thank you for visiting Koeshin's Collectibles.", pageWidth - margin * 2)
    pdf.text(thanks, margin, y)
    y += thanks.length * 5 + 2

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...colors.muted)
    const footer = pdf.splitTextToSize(
        "Thank you for visiting Koeshin's Collectibles. Good things keep finding us.",
        pageWidth - margin * 2
    )
    if (y + footer.length * 4 > pageHeight - 10) {
        pdf.addPage()
        y = 18
    }
    pdf.text(footer, margin, y)

    const referenceForFilename = (order.orderReference || 'order-receipt').replace(/[^a-zA-Z0-9-]/g, '-')
    return {
        buffer: Buffer.from(pdf.output('arraybuffer')),
        filename: `${referenceForFilename}.pdf`
    }
}

module.exports = createOrderReceiptPdf
