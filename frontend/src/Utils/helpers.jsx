import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import orderPricing from '../../../shared/order-pricing.json'

export const SHIPPING_PRICE = orderPricing.shippingPrice
const TAX_RATE = orderPricing.taxRate

export const formatCurrency = (amount) => new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
}).format(Number(amount) || 0)

export const calculateOrderTotals = (cartItems) => {
    const itemsPriceCents = cartItems.reduce((total, item) => {
        const price = Number(item.price)
        const quantity = Number(item.quantity)
        if (!Number.isFinite(price) || !Number.isFinite(quantity)) return total
        return total + Math.round(price * 100) * Math.max(0, quantity)
    }, 0)
    const shippingPriceCents = SHIPPING_PRICE * 100
    const taxPriceCents = Math.round(itemsPriceCents * TAX_RATE)

    return {
        itemsPrice: itemsPriceCents / 100,
        shippingPrice: shippingPriceCents / 100,
        taxPrice: taxPriceCents / 100,
        totalPrice: (itemsPriceCents + shippingPriceCents + taxPriceCents) / 100
    }
}

export const authenticate = (data, next) => {
    if (window !== 'undefined') {
        // console.log('authenticate', response)
        sessionStorage.setItem('token', JSON.stringify(data.token));
        sessionStorage.setItem('user', JSON.stringify(data.user));
    }
    next();
};

export const getUser = () => {
    if (window !== 'undefined') {
        if (sessionStorage.getItem('user')) {
            console.log(JSON.parse(sessionStorage.getItem('user')))
            return JSON.parse(sessionStorage.getItem('user'));
        } else {
            return false;
        }
    }
};

// remove token from session storage
export const logout = next => {
    if (window !== 'undefined') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    }
    next();
};

export const getToken = () => {
    if (window !== 'undefined') {
        if (sessionStorage.getItem('token')) {
            return JSON.parse(sessionStorage.getItem('token'));
        } else {
            return false;
        }
    }
};

export const errMsg = (message = '') => toast.error(message, {
    position: 'bottom-center'
});
export const successMsg = (message = '') => toast.success(message, {
    position: 'bottom-center'
});