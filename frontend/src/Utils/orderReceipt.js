const phpAmount = (amount) => `PHP ${Number(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})}`

export const createOrderReceipt = async (order) => {
    const { jsPDF } = await import('jspdf')
    const document = new jsPDF()
    const pageWidth = document.internal.pageSize.getWidth()
    const rightEdge = pageWidth - 18
    let y = 22

    document.setProperties({ title: `Receipt ${order.orderReference || ''}` })
    document.setFont('helvetica', 'bold')
    document.setFontSize(20)
    document.text("Koeshin Collectibles", 18, y)
    y += 10

    document.setFontSize(15)
    document.text('Order receipt', 18, y)
    y += 8

    document.setFont('helvetica', 'normal')
    document.setFontSize(10)
    document.text(`Reference: ${order.orderReference || 'Unavailable'}`, 18, y)
    y += 6
    document.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-PH')}`, 18, y)
    y += 6
    document.text(`Payment: ${order.paymentMethod || 'Not recorded'}`, 18, y)
    y += 10

    document.setFont('helvetica', 'bold')
    document.text('Item', 18, y)
    document.text('Qty', 145, y, { align: 'right' })
    document.text('Amount (PHP)', rightEdge, y, { align: 'right' })
    y += 3
    document.line(18, y, rightEdge, y)
    y += 7
    document.setFont('helvetica', 'normal')

    for (const item of order.orderItems || []) {
        const itemLines = document.splitTextToSize(item.name || 'Item', 112)
        const rowHeight = Math.max(itemLines.length * 5, 7)
        if (y + rowHeight > 260) {
            document.addPage()
            y = 22
        }
        document.text(itemLines, 18, y)
        document.text(String(item.quantity || 0), 145, y, { align: 'right' })
        document.text(phpAmount(Number(item.price || 0) * Number(item.quantity || 0)), rightEdge, y, { align: 'right' })
        y += rowHeight + 3
    }

    if (y > 250) {
        document.addPage()
        y = 22
    }

    y += 3
    document.line(95, y, rightEdge, y)
    y += 8
    document.text(`Subtotal: ${phpAmount(order.itemsPrice)}`, rightEdge, y, { align: 'right' })
    y += 6
    document.text(`Shipping: ${Number(order.shippingPrice) === 0 ? 'FREE' : phpAmount(order.shippingPrice)}`, rightEdge, y, { align: 'right' })
    y += 6
    document.text(`Tax: ${phpAmount(order.taxPrice)}`, rightEdge, y, { align: 'right' })
    y += 8
    document.setFont('helvetica', 'bold')
    document.setFontSize(12)
    document.text(`Total: ${phpAmount(order.totalPrice)}`, rightEdge, y, { align: 'right' })

    const reference = (order.orderReference || 'order-receipt').replace(/[^a-zA-Z0-9-]/g, '-')
    return { document, filename: `${reference}.pdf` }
}

export const downloadOrderReceipt = async (order) => {
    const { document, filename } = await createOrderReceipt(order)
    document.save(filename)
}