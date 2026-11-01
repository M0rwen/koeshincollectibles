import {
    ALL_PRODUCTS_REQUEST,
    ALL_PRODUCTS_SUCCESS,
    ALL_PRODUCTS_FAIL,
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DETAILS_SUCCESS,
    PRODUCT_DETAILS_FAIL,
    NEW_PRODUCT_REQUEST,
    NEW_PRODUCT_SUCCESS,
    NEW_PRODUCT_RESET,
    NEW_PRODUCT_FAIL,

    ADMIN_PRODUCTS_REQUEST,
    ADMIN_PRODUCTS_SUCCESS,
    ADMIN_PRODUCTS_FAIL,

    UPDATE_PRODUCT_REQUEST,
    UPDATE_PRODUCT_SUCCESS,
    UPDATE_PRODUCT_RESET,
    UPDATE_PRODUCT_FAIL,
    DELETE_PRODUCT_REQUEST,
    DELETE_PRODUCT_SUCCESS,
    DELETE_PRODUCT_FAIL,
    DELETE_PRODUCT_RESET,
    BULK_DELETE_PRODUCTS_REQUEST,
    BULK_DELETE_PRODUCTS_SUCCESS,
    BULK_DELETE_PRODUCTS_FAIL,
    BULK_DELETE_PRODUCTS_RESET,
    CLEAR_ERRORS
} from '../constants/productConstants'

export const productsReducer = (state = { products: [] }, action) => {
    switch (action.type) {
        case ALL_PRODUCTS_REQUEST:
            return {
                ...state,
                loading: true,
                loadingMore: (action.payload?.page ?? 1) > 1 && action.payload?.queryKey === state.queryKey,
                products: (action.payload?.page ?? 1) === 1 || action.payload?.queryKey !== state.queryKey ? [] : state.products,
                queryKey: action.payload?.queryKey,
                error: null
            }
        case ADMIN_PRODUCTS_REQUEST:
            return {
                ...state,
                loading: true,
                products: []
            }
        case ALL_PRODUCTS_SUCCESS: {
            if (action.meta?.queryKey !== state.queryKey) return state
            const existingProducts = action.meta?.append ? state.products : []
            const existingIds = new Set(existingProducts.map(product => String(product._id)))
            const newProducts = action.payload.products.filter(product => !existingIds.has(String(product._id)))
            return {
                ...state,
                loading: false,
                loadingMore: false,
                products: [...existingProducts, ...newProducts],
                productsCount: action.payload.productsCount,
                resPerPage: action.payload.resPerPage,
                filteredProductsCount: action.payload.filteredProductsCount
            }
        }
        case ADMIN_PRODUCTS_SUCCESS:
            return {
                ...state,
                loading: false,
                products: action.payload
            }
        case UPDATE_PRODUCT_SUCCESS:
            return {
                ...state,
                products: state.products.map(product =>
                    product._id === action.payload?._id ? action.payload : product
                )
            }
        case ALL_PRODUCTS_FAIL:
            if (action.meta?.queryKey !== state.queryKey) return state
            return {
                ...state,
                loading: false,
                loadingMore: false,
                error: action.payload
            }
        case ADMIN_PRODUCTS_FAIL:
            return {
                ...state,
                loading: false,
                loadingMore: false,
                error: action.payload
            }


        case CLEAR_ERRORS:
            return {
                ...state,
                error: null
            }
        default:
            return state;
    }
}

export const productDetailsReducer = (state = { product: {} }, action) => {
    switch (action.type) {

        case PRODUCT_DETAILS_REQUEST:
            return {
                ...state,
                loading: true,
                product: {},
                error: null
            }

        case PRODUCT_DETAILS_SUCCESS:
            return {
                ...state,
                loading: false,
                product: action.payload,
                error: null
            }

        case UPDATE_PRODUCT_SUCCESS:
            return {
                ...state,
                product: state.product?._id === action.payload?._id ? action.payload : state.product
            }

        case PRODUCT_DETAILS_FAIL:
            return {
                ...state,
                loading: false,
                product: {},
                error: action.payload
            }

        case CLEAR_ERRORS:
            return {
                ...state,
                error: null
            }

        default:
            return state
    }
}

export const newProductReducer = (state = { product: {} }, action) => {
    switch (action.type) {
        case NEW_PRODUCT_REQUEST:

            return {
                ...state,
                loading: true
            }
        case NEW_PRODUCT_SUCCESS:
            return {
                ...state,
                loading: false,
                success: action.payload.success,
                product: action.payload.product
            }
        case NEW_PRODUCT_FAIL:

            return {
                ...state,
                error: action.payload
            }
        case NEW_PRODUCT_RESET:

            return {
                ...state,
                success: false
            }
        case CLEAR_ERRORS:
            return {
                ...state,
                error: null
            }
        default:
            return state
    }
}

export const productReducer = (state = {}, action) => {
    switch (action.type) {

        case DELETE_PRODUCT_REQUEST:
        case UPDATE_PRODUCT_REQUEST:
            return {
                ...state,
                loading: true,
                ...(action.type === UPDATE_PRODUCT_REQUEST ? { isUpdated: false } : {})
            }

        case DELETE_PRODUCT_SUCCESS:
            return {
                ...state,
                loading: false,
                isDeleted: action.payload
            }

        case UPDATE_PRODUCT_SUCCESS:
            return {
                ...state,
                loading: false,
                isUpdated: true
            }


        case DELETE_PRODUCT_FAIL:
            return {
                ...state,
                loading: false,
                error: action.payload
            }
        case UPDATE_PRODUCT_FAIL:
            return {
                ...state,
                loading: false,
                isUpdated: false,
                error: action.payload
            }

        case DELETE_PRODUCT_RESET:
            return {
                ...state,
                isDeleted: false
            }
        case UPDATE_PRODUCT_RESET:
            return {
                ...state,
                isUpdated: false
            }
        case BULK_DELETE_PRODUCTS_REQUEST:
            return {
                ...state,
                loading: true
            }
        case BULK_DELETE_PRODUCTS_SUCCESS:
            return {
                ...state,
                loading: false,
                isBulkDeleted: action.payload.success || true
            }
        case BULK_DELETE_PRODUCTS_FAIL:
            return {
                ...state,
                error: action.payload
            }
        case BULK_DELETE_PRODUCTS_RESET:
            return {
                ...state,
                isBulkDeleted: false
            }
        case CLEAR_ERRORS:
            return {
                ...state,
                error: null
            }
        default:
            return state
    }
}

// export const newReviewReducer = (state = {}, action) => {
//     switch (action.type) {
//         case NEW_REVIEW_REQUEST:
//             return {
//                 ...state,
//                 loading: true
//             }
//         case NEW_REVIEW_SUCCESS:
//             return {
//                 ...state,
//                 loading: false,
//                 success: action.payload
//             }
//         case NEW_REVIEW_FAIL:
//             return {
//                 ...state,
//                 error: action.payload
//             }
//         case NEW_REVIEW_RESET:
//             return {
//                 ...state,
//                 success: false
//             }
//         case CLEAR_ERRORS:
//             return {
//                 ...state,
//                 error: null
//             }
//         default:
//             return state
//     }

// }
