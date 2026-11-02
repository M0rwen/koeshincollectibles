const CHECKOUT_SELECTION_KEY = 'checkoutSelection'
const PENDING_BUY_NOW_KEY = 'pendingBuyNow'

export const getCheckoutItems = cartItems => {
    const selection = JSON.parse(sessionStorage.getItem(CHECKOUT_SELECTION_KEY) || 'null')
    return selection?.mode === 'buyNow' && Array.isArray(selection.items)
        ? selection.items
        : cartItems
}

export const startBuyNowCheckout = item => {
    sessionStorage.setItem(CHECKOUT_SELECTION_KEY, JSON.stringify({
        mode: 'buyNow',
        items: [item]
    }))
}

export const startCartCheckout = () => {
    sessionStorage.setItem(CHECKOUT_SELECTION_KEY, JSON.stringify({ mode: 'cart' }))
}

export const getPendingBuyNow = () => JSON.parse(sessionStorage.getItem(PENDING_BUY_NOW_KEY) || 'null')

export const setPendingBuyNow = selection => {
    sessionStorage.setItem(PENDING_BUY_NOW_KEY, JSON.stringify(selection))
}

export const clearPendingBuyNow = () => {
    sessionStorage.removeItem(PENDING_BUY_NOW_KEY)
}

export const clearCheckoutSelection = () => {
    sessionStorage.removeItem(CHECKOUT_SELECTION_KEY)
}
