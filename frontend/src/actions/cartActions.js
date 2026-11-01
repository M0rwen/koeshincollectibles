import api from '../Utils/api'
import { ADD_TO_CART, REMOVE_ITEM_CART, SAVE_SHIPPING_INFO, CLEAR_CART } from '../constants/cartConstants'
import { errMsg } from '../Utils/helpers'

export const addItemToCart = (id, quantity) => async (dispatch, getState) => {
    try {
        const { data } = await api.get(`${import.meta.env.VITE_API}/product/${id}`)
        const product = data.product
        const stock = Math.max(0, Number(product.stock) || 0)

        if (stock === 0) {
            errMsg('This item is out of stock.')
            return false
        }

        const requestedQuantity = Number(quantity)
        const safeQuantity = Math.min(Math.max(1, Number.isFinite(requestedQuantity) ? requestedQuantity : 1), stock)

        if (requestedQuantity > stock) {
            errMsg(`Only ${stock} available. Cart quantity was adjusted.`)
        }

        dispatch({
            type: ADD_TO_CART,
            payload: {
                product: product._id,
                name: product.name,
                price: product.price,
                image: product.images?.[0]?.url || '',
                stock,
                quantity: safeQuantity
            }
        })
        localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
        return true
    } catch (error) {
        errMsg(error.response?.data?.message || 'Unable to add this item to your cart.')
        return false
    }

}

export const removeItemFromCart = (id) => async (dispatch, getState) => {
    dispatch({
        type: REMOVE_ITEM_CART,
        payload: id
    })
    localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
}

export const saveShippingInfo = (data) => async (dispatch) => {
    dispatch({
        type: SAVE_SHIPPING_INFO,
        payload: data
    })
    localStorage.setItem('shippingInfo', JSON.stringify(data))
}

export const clearCart = () => async (dispatch) => {
    dispatch({
        type: CLEAR_CART,
    })
}
