const { shippingPrice: SHIPPING_PRICE, taxRate: TAX_RATE } = require('../../shared/order-pricing.json')

const calculateOrderTotals = orderItems => {
    const itemsPriceCents = orderItems.reduce((total, item) => {
        const priceCents = Math.round(Number(item.price) * 100)
        const quantity = Number(item.quantity)
        if (!Number.isFinite(priceCents) || !Number.isFinite(quantity)) return total
        return total + priceCents * quantity
    }, 0)
    const taxPriceCents = Math.round(itemsPriceCents * TAX_RATE)
    const shippingPriceCents = Math.round(SHIPPING_PRICE * 100)

    return {
        itemsPrice: itemsPriceCents / 100,
        shippingPrice: shippingPriceCents / 100,
        taxPrice: taxPriceCents / 100,
        totalPrice: (itemsPriceCents + taxPriceCents + shippingPriceCents) / 100
    }
}

module.exports = { SHIPPING_PRICE, calculateOrderTotals }
