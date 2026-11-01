import api from '../Utils/api';

import {
    ALL_PRODUCTS_REQUEST,
    ALL_PRODUCTS_SUCCESS,
    ALL_PRODUCTS_FAIL,
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DETAILS_SUCCESS,
    PRODUCT_DETAILS_FAIL,
    NEW_PRODUCT_REQUEST,
    NEW_PRODUCT_SUCCESS,
    NEW_PRODUCT_FAIL,
    UPDATE_PRODUCT_REQUEST,
    UPDATE_PRODUCT_SUCCESS,
    UPDATE_PRODUCT_FAIL,
    ADMIN_PRODUCTS_REQUEST,
    ADMIN_PRODUCTS_SUCCESS,
    ADMIN_PRODUCTS_FAIL,
    DELETE_PRODUCT_REQUEST,
    DELETE_PRODUCT_SUCCESS,
    DELETE_PRODUCT_FAIL,
    NEW_REVIEW_REQUEST,
    NEW_REVIEW_SUCCESS,
    NEW_REVIEW_FAIL,
    BULK_DELETE_PRODUCTS_REQUEST,
    BULK_DELETE_PRODUCTS_SUCCESS,
    BULK_DELETE_PRODUCTS_FAIL,


    CLEAR_ERRORS
} from '../constants/productConstants';

export const getProducts = (currentPage = 1, keyword = '', price = ['', ''], category = '', rating = '') => async (dispatch) => {
    let queryKey = ''
    try {
        const filters = new URLSearchParams()
        if (keyword) filters.set('keyword', keyword)
        if (price[0] !== '' && Number.isFinite(Number(price[0]))) filters.set('price[gte]', String(price[0]))
        if (price[1] !== '' && Number.isFinite(Number(price[1]))) filters.set('price[lte]', String(price[1]))
        if (category) filters.set('category', category)
        if (rating) filters.set('ratings[gte]', rating)
        queryKey = filters.toString()

        const query = new URLSearchParams(filters)
        query.set('page', String(currentPage))

        dispatch({
            type: ALL_PRODUCTS_REQUEST,
            payload: { page: currentPage, queryKey }
        })

        const link = `${import.meta.env.VITE_API}/products?${query.toString()}`
        const { data } = await api.get(link)
        console.log(data)
        dispatch({
            type: ALL_PRODUCTS_SUCCESS,
            payload: data,
            meta: { append: currentPage > 1, queryKey }
        })
        return data

    } catch (error) {
        dispatch({
            type: ALL_PRODUCTS_FAIL,
            payload: error.response?.data?.message || error.message,
            meta: { queryKey }
        })
    }
}

export const getProductDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_DETAILS_REQUEST })
        const { data } = await api.get(`${import.meta.env.VITE_API}/product/${id}`)
        dispatch({
            type: PRODUCT_DETAILS_SUCCESS,
            payload: data.product
        })
    } catch (error) {
        dispatch({
            type: PRODUCT_DETAILS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const newProduct = (productData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_PRODUCT_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json',

            },
            withCredentials: true //correct
        }
        const { data } = await api.post(`${import.meta.env.VITE_API}/admin/product/new`, productData, config)
        dispatch({
            type: NEW_PRODUCT_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: NEW_PRODUCT_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}

export const getAdminProducts = () => async (dispatch) => {
    try {
        dispatch({ type: ADMIN_PRODUCTS_REQUEST })
        const { data } = await api.get(`${import.meta.env.VITE_API}/admin/products`, {
            //AxiosRequestConfig parameter
            withCredentials: true //correct
        })
        dispatch({
            type: ADMIN_PRODUCTS_SUCCESS,
            payload: data.products
        })
    } catch (error) {
        dispatch({
            type: ADMIN_PRODUCTS_FAIL,
            payload: error.response.data.message
        })
    }
}

export const updateProduct = (id, productData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PRODUCT_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json',

            },
            withCredentials: true //correct
        }
        const { data } = await api.put(`${import.meta.env.VITE_API}/admin/product/${id}`, productData, config)
        dispatch({
            type: UPDATE_PRODUCT_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: UPDATE_PRODUCT_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}

export const deleteProduct = (id) => async (dispatch) => {
    try {

        dispatch({ type: DELETE_PRODUCT_REQUEST })

        const { data } = await api.delete(`${import.meta.env.VITE_API}/admin/product/${id}`, { withCredentials: true })

        dispatch({
            type: DELETE_PRODUCT_SUCCESS,
            payload: data.success
        })

    } catch (error) {
        dispatch({
            type: DELETE_PRODUCT_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}

export const newReview = (reviewData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_REVIEW_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        }
        const { data } = await api.put(`${import.meta.env.VITE_API}/review`, reviewData, config)
        dispatch({
            type: NEW_REVIEW_SUCCESS,
            payload: data.success
        })
        return { success: data.success }
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to submit review.'
        dispatch({
            type: NEW_REVIEW_FAIL,
            payload: message
        })
        return { success: false, message }
    }
}

export const clearErrors = () => async (dispatch) => {
    dispatch({
        type: CLEAR_ERRORS

    })
}

export const bulkDeleteProducts = (ids) => async (dispatch) => {
    try {
        dispatch({ type: BULK_DELETE_PRODUCTS_REQUEST })
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        }
        const { data } = await api.delete(`${import.meta.env.VITE_API}/admin/products/bulk`, {
            ...config,
            data: { ids }
        })
        dispatch({
            type: BULK_DELETE_PRODUCTS_SUCCESS,
            payload: data
        })
    } catch (error) {
        dispatch({
            type: BULK_DELETE_PRODUCTS_FAIL,
            payload: error.response?.data?.message || error.message
        })
    }
}
