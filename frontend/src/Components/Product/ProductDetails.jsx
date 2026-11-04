import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { Carousel, Modal } from 'react-bootstrap'

import { formatCurrency } from '../../Utils/helpers'
import { startBuyNowCheckout, getPendingBuyNow, clearPendingBuyNow, setPendingBuyNow } from '../../Utils/checkout'
import ListReviews from '../Review/ListReviews';
import { useDispatch, useSelector } from 'react-redux'
import { getProductDetails, newReview as submitReview } from '../../actions/productActions'
import { addItemToCart } from '../../actions/cartActions'
import { toast } from 'react-toastify'
const ProductDetails = () => {

    const { product } = useSelector(state => state.productDetails);
    // const [product, setProduct] = useState({})
    const { user } = useSelector(state => state.auth)
    const [quantity, setQuantity] = useState(1)
    const [loadedProductId, setLoadedProductId] = useState(null)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [errorReview, setErrorReview] = useState('');
    const [success, setSuccess] = useState('')
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewSubmitting, setReviewSubmitting] = useState(false)

    let { id } = useParams()
    const dispatch = useDispatch()
    const location = useLocation()
    const navigate = useNavigate()
    const stock = Math.max(0, Number(product.stock) || 0)
    const productLoaded = loadedProductId === id && product?._id === id
    const existingReview = product.reviews?.find(
        review => user && String(review.user) === String(user._id)
    )
    const displayQuantity = productLoaded && stock > 0
        ? Math.min(quantity, stock)
        : quantity

    const increaseQty = () => {
        setQuantity(current => Math.min(Math.max(current, displayQuantity) + 1, stock))
    }

    const decreaseQty = () => {
        setQuantity(Math.max(displayQuantity - 1, 1))
    }

    const addToCart = async () => {
        if (!productLoaded) return
        await dispatch(addItemToCart(id, quantity));

    }

    const startBuyNow = () => {
        if (!productLoaded || stock === 0 || user?.role === 'admin') return
        if (!user) {
            setPendingBuyNow({ productId: product._id, quantity: displayQuantity })
            navigate(`/login?redirect=buy-now&productId=${encodeURIComponent(product._id)}`)
            return
        }

        startBuyNowCheckout({
            product: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0]?.url || '',
            stock,
            quantity: Math.min(Math.max(1, displayQuantity), stock)
        })
        navigate('/shipping')
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

    const openReviewForm = () => {
        setRating(existingReview?.rating || 0)
        setComment(existingReview?.comment || '')
        setErrorReview('')
        setSuccess(false)
        setShowReviewModal(true)
    }

    const reviewHandler = async event => {
        event.preventDefault()
        if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
            setErrorReview('Choose a rating from 1 to 5 stars.')
            return
        }
        if (!comment.trim() || comment.trim().length > 1000) {
            setErrorReview('Enter a review of 1000 characters or fewer.')
            return
        }

        setReviewSubmitting(true)
        try {
            const result = await dispatch(submitReview({ rating, comment, productId: id }))
            if (result?.success) {
                await dispatch(getProductDetails(id))
                setSuccess(true)
                setErrorReview('')
                setShowReviewModal(false)
            } else {
                setErrorReview(result?.message || 'Failed to submit review.')
                setSuccess(false)
            }
        } finally {
            setReviewSubmitting(false)
        }
    }

    // useEffect(() => {
    //     productDetails(id)
    // }, [id,]);

    useEffect(() => {
        let isCurrent = true
        dispatch(getProductDetails(id)).then(loadedProduct => {
            if (isCurrent && loadedProduct?._id === id) setLoadedProductId(id)
            if (isCurrent && !loadedProduct && getPendingBuyNow()?.productId === id) clearPendingBuyNow()
        })
        return () => {
            isCurrent = false
        }
    }, [id, dispatch])

    useEffect(() => {
        if (!user || !productLoaded || new URLSearchParams(location.search).get('buyNow') !== '1') return

        const pendingBuyNow = getPendingBuyNow()
        if (!pendingBuyNow || pendingBuyNow.productId !== id) return

        clearPendingBuyNow()
        if (user.role === 'admin') return

        if (stock === 0) {
            toast.error('This item is out of stock.', { position: 'bottom-right' })
            navigate(`/product/${id}`, { replace: true })
            return
        }

        startBuyNowCheckout({
            product: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0]?.url || '',
            stock,
            quantity: Math.min(Math.max(1, Number(pendingBuyNow.quantity) || 1), stock)
        })
        navigate('/shipping', { replace: true })
    }, [user, location.search, product, productLoaded, id, stock, navigate])

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
                    {user?.role !== 'admin' && (
                        <div className="product-purchase-row">
                            <div className="stockCounter">
                                <button className="quantity-step" type="button" onClick={decreaseQty} disabled={!productLoaded || quantity <= 1} aria-label="Decrease quantity">-</button>
                                <input type="number" className="count" value={displayQuantity} readOnly aria-label="Quantity" />
                                <button className="quantity-step" type="button" onClick={increaseQty} disabled={!productLoaded || displayQuantity >= stock} aria-label="Increase quantity">+</button>
                            </div>
                            <button type="button" id="cart_btn" className="btn btn-primary" disabled={!productLoaded || stock === 0} onClick={addToCart}>Add to Cart</button>
                            <button type="button" className="btn shop-button-accent buy-now-button" disabled={!productLoaded || stock === 0} onClick={startBuyNow}>Buy now</button>
                        </div>
                    )}
                    <hr />

                    <p>Status: <span id="stock_status" className={product.stock > 0 ? 'greenColor' : 'redColor'} >{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></p>

                    <hr />

                    <h4 className="mt-2">Description:</h4>
                    <p>{product.description}</p>
                    <hr />
                    <p id="product_seller mb-3">Sold by: <strong>{product.seller}</strong></p>
                    {user ? <button id="review_btn" type="button" className="btn btn-primary mt-4" onClick={openReviewForm} disabled={!productLoaded}>
                        {existingReview ? 'Edit Your Review' : 'Write a Review'}
                    </button> :
                        <div className="alert alert-danger mt-5" type='alert'>Login to post your review.</div>}
                    {errorReview && !showReviewModal && <p className="review-feedback" role="alert">{errorReview}</p>}
                    {success && <p className="review-feedback" role="status">Your review has been saved.</p>}
                    <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>{existingReview ? 'Edit your review' : 'Write a review'}</Modal.Title>
                        </Modal.Header>
                        <form onSubmit={reviewHandler}>
                            <Modal.Body>
                                {errorReview && <p className="review-feedback" role="alert">{errorReview}</p>}
                                <fieldset className="review-rating-field">
                                    <legend>Your rating</legend>
                                    <div className="review-rating-options">
                                        {[1, 2, 3, 4, 5].map(value => (
                                            <button
                                                key={value}
                                                type="button"
                                                className={`review-rating-star${value <= rating ? ' is-selected' : ''}`}
                                                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                                                aria-pressed={rating === value}
                                                onClick={() => setRating(value)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>
                                <label className="form-label" htmlFor="review-comment">Your review</label>
                                <textarea
                                    id="review-comment"
                                    className="form-control"
                                    value={comment}
                                    onChange={event => setComment(event.target.value)}
                                    maxLength={1000}
                                    rows={5}
                                    required
                                />
                                <small className="review-character-count">{comment.length}/1000</small>
                            </Modal.Body>
                            <Modal.Footer>
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowReviewModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>
                                    {reviewSubmitting ? 'Saving…' : existingReview ? 'Update review' : 'Submit review'}
                                </button>
                            </Modal.Footer>
                        </form>
                    </Modal>
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