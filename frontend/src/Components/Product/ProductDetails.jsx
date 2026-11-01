import { useState, useEffect } from 'react'
import { useParams, } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { Carousel } from 'react-bootstrap'

import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'

import { formatCurrency, getToken } from '../../Utils/helpers'
import ListReviews from '../Review/ListReviews';
import { useDispatch, useSelector } from 'react-redux'
import { getProductDetails } from '../../actions/productActions'
import { addItemToCart } from '../../actions/cartActions'
const ProductDetails = () => {

    const { product } = useSelector(state => state.productDetails);
    // const [product, setProduct] = useState({})
    const { user } = useSelector(state => state.auth)
    const [quantity, setQuantity] = useState(1)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [errorReview, setErrorReview] = useState('');
    const [success, setSuccess] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)
    const [showReviewForm, setShowReviewForm] = useState(false)
    // const [user, setUser] = useState(getUser())

    let { id } = useParams()
    const dispatch = useDispatch()
    const existingReview = product.reviews?.find(review => (
        String(review.user?._id || review.user) === String(user?._id)
    ))

    const toggleReviewForm = () => {
        if (!showReviewForm && existingReview) {
            setRating(Number(existingReview.rating))
            setComment(existingReview.comment || '')
        }
        setShowReviewForm(open => !open)
    }

    const increaseQty = () => {
        setQuantity(current => Math.min(current + 1, product.stock))
    }

    const decreaseQty = () => {
        setQuantity(current => Math.max(current - 1, 1))
    }

    const addToCart = async () => {
        await dispatch(addItemToCart(id, quantity));

    }

    // const productDetails = async (id) => {
    //     let link = `http://localhost:4001/api/v1/product/${id}`
    //     try {
    //         let res = await axios.get(link)
    //         setProduct(res.data.product)
    //     } catch (err) {
    //         console.log(err)
    //         // setError('Product not found')
    //     }
    // }

    const newReview = async (reviewData) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            }

            const { data } = await axios.put(`${import.meta.env.VITE_API}/review`, reviewData, {
                ...config,
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            })
            setSuccess(data.success)
            setErrorReview('')
            dispatch(getProductDetails(id))
            return true
        } catch (error) {
            setErrorReview(error.response?.data?.message || 'Failed to submit review.')
            setSuccess(false)
            return false
        }
    }

    const reviewHandler = async (event) => {
        event.preventDefault()
        if (!rating) {
            setErrorReview('Please select a rating from 1 to 5.')
            return
        }
        setSubmittingReview(true)
        const submitted = await newReview({ rating, comment, productId: id })
        setSubmittingReview(false)
        if (submitted) setShowReviewForm(false)
    }

    // useEffect(() => {
    //     productDetails(id)
    // }, [id,]);

    useEffect(() => {
        dispatch(getProductDetails(id))

    }, [id, dispatch]);

    // useEffect(() => {
    //     localStorage.setItem('cartItems', JSON.stringify(cartItems));
    // }, [cartItems]);

    return (
        <>
            <MetaData title={product.name} />
            <main className="product-details-page">
            <div className="product-detail-layout">
                <div className="product-detail-media" id="product_image">
                    <Carousel pause='hover'>
                        {product.images && product.images.map(image => (
                            <Carousel.Item key={image.public_id}>
                                <img className="d-block w-100" src={image.url} alt={product.name} />
                            </Carousel.Item>
                        ))}
                    </Carousel>
                </div>

                <div className="product-detail-info">
                    <p className="product-detail-category">{product.category}</p>
                    <h1 className="product-detail-title">{product.name}</h1>
                    <p id="product_id">Item {product._id}</p>

                    <hr />

                    <div className="rating-outer">
                        <div className="rating-inner" style={{ width: `${(product.ratings / 5) * 100}%` }}></div>
                    </div>
                    <span id="no_of_reviews">({product.numOfReviews} Reviews)</span>

                    <hr />

                    <p id="product_price">{formatCurrency(product.price)}</p>
                    <div className="product-purchase-row">
                        <div className="stockCounter">
                            <button className="quantity-step" type="button" onClick={decreaseQty} aria-label="Decrease quantity">-</button>
                            <input type="number" className="count" value={quantity} readOnly aria-label="Quantity" />
                            <button className="quantity-step" type="button" onClick={increaseQty} aria-label="Increase quantity">+</button>
                        </div>
                        <button type="button" id="cart_btn" className="btn btn-primary" disabled={product.stock === 0} onClick={addToCart}>Add to Cart</button>
                    </div>
                    <hr />

                    <p>Status: <span id="stock_status" className={product.stock > 0 ? 'greenColor' : 'redColor'} >{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></p>

                    <hr />

                    <h4 className="mt-2">Description:</h4>
                    <p>{product.description}</p>
                    <hr />
                    <p id="product_seller mb-3">Sold by: <strong>{product.seller}</strong></p>
                    {/* <div className="alert alert-danger mt-5" type='alert'>Login to post your review.</div> */}
                    {/* <button id="review_btn" type="button" className="btn btn-primary mt-4" data-toggle="modal" data-target="#ratingModal"  >
                        Submit Your Review
                    </button> */}
                    {user ? <button
                        id="review_btn"
                        type="button"
                        className="btn btn-primary mt-4"
                        onClick={toggleReviewForm}
                        aria-expanded={showReviewForm}
                        aria-controls="review-form"
                    >
                        {existingReview ? 'Edit Your Review' : 'Submit Your Review'}
                    </button> :
                        <div className="alert alert-danger mt-5" type='alert'>Login to post your review.</div>}
                    {errorReview && <p className="review-feedback" role="alert" style={{ color: 'red' }}>{errorReview}</p>}
                    {success && !errorReview && (
                        <p className="review-feedback" role="status" style={{ color: 'green' }}>
                            {existingReview ? 'Review updated successfully.' : 'Review submitted successfully.'}
                        </p>
                    )}

                    {user && showReviewForm && (
                        <section id="review-form" className="product-review-form" aria-labelledby="review-form-title">
                            <h2 id="review-form-title">{existingReview ? 'Edit your review' : 'Write your review'}</h2>
                            <form onSubmit={reviewHandler}>
                                <fieldset>
                                    <legend>Rating</legend>
                                    <div className="review-rating" role="group" aria-label="Select a review rating">
                                        {[1, 2, 3, 4, 5].map(value => (
                                            <button
                                                key={value}
                                                type="button"
                                                className={`star ${rating >= value ? 'orange' : ''}`}
                                                onClick={() => setRating(value)}
                                                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                                                aria-pressed={rating === value}
                                            >
                                                <i className="fa fa-star" aria-hidden="true" />
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>
                                <label htmlFor="review">Comment</label>
                                <textarea
                                    name="review"
                                    id="review"
                                    className="form-control mt-2"
                                    value={comment}
                                    onChange={event => setComment(event.target.value)}
                                    maxLength={1000}
                                    rows={4}
                                />
                                <button
                                    type="submit"
                                    className="btn my-3 review-btn px-4 text-white"
                                    disabled={submittingReview}
                                >
                                    {submittingReview ? 'Submitting...' : 'Submit review'}
                                </button>
                                <button
                                    type="button"
                                    className="btn my-3 ml-2"
                                    onClick={() => setShowReviewForm(false)}
                                >
                                    Cancel
                                </button>
                            </form>
                        </section>
                    )}
                </div>
                {product.reviews && product.reviews.length > 0 && (

                    <ListReviews reviews={product.reviews} />

                )}

            </div>
            </main>


        </>
    )
}

export default ProductDetails