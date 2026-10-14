/* eslint-disable no-case-declarations */
import { ADD_TO_CART, REMOVE_ITEM_CART, SAVE_SHIPPING_INFO, CLEAR_CART } from '../constants/cartConstants'
export const cartReducer = (state = { cartItems: [], shippingInfo: {} }, action) => {
    // console.log(state.cartItems)
    switch (action.type) {
        case ADD_TO_CART:
            const item = action.payload
            const stock = Number(item.stock)
            if (!Number.isFinite(stock) || stock <= 0) return state

            const safeItem = {
                ...item,
                stock,
                quantity: Math.min(Math.max(1, Number(item.quantity) || 1), stock)
            }

            const isItemExist = state.cartItems.find(i => i.product === item.product)
            if (isItemExist) {
                return {
                    ...state,
                    cartItems: state.cartItems.map(i => i.product === isItemExist.product ? safeItem : i)
                }
            } else {
                return {
                    ...state,
                    cartItems: [...state.cartItems, safeItem]
                }
            }
        case REMOVE_ITEM_CART:
            return {
                ...state,
                cartItems: state.cartItems.filter(i => i.product !== action.payload)
            }

        case SAVE_SHIPPING_INFO:
            return {
                ...state,
                shippingInfo: action.payload
            }
        case CLEAR_CART:
            return {
                ...state,
                cartItems: [],
                shippingInfo: {}
            }
        default:
            return state
    }
}