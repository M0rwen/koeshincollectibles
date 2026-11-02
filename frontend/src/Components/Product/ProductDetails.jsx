import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { Carousel } from 'react-bootstrap'

import 'react-toastify/dist/ReactToastify.css';

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

    let { id } = useParams()
    const dispatch = useDispatch()
    const location = useLocation()
    const navigate = useNavigate()
    const stock = Math.max(0, Number(product.stock) || 0)
    const productLoaded = loadedProductId === id && product?._id === id
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

    function setUserRatings() {
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.starValue = index + 1;
            ['click', 'mouseover', 'mouseout'].forEach(function (e) {
                star.addEventListener(e, showRatings);
            })
        })
        function showRatings(e) {
            stars.forEach((star, index) => {
                if (e.type === 'click') {
                    if (index < this.starValue) {
                        star.classList.add('orange');
                        setRating(this.starValue)
                    } else {
                        star.classList.remove('orange')
                    }
                }
                if (e.type === 'mouseover') {
                    if (index < this.starValue) {
                        star.classList.add('yellow');
                    } else {
                        star.classList.remove('yellow')
                    }
                }
                if (e.type === 'mouseout') {
                    star.classList.remove('yellow')
                }
            })
        }
    }

    const reviewHandler = async () => {
        const result = await dispatch(submitReview({ rating, comment, productId: id }))
        if (result?.success) {
            setSuccess(true)
            setErrorReview('')
        } else {
            setErrorReview(result?.message || 'Failed to submit review.')
            setSuccess(false)
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
                    {/* <div className="alert alert-danger mt-5" type='alert'>Login to post your review.</div> */}
                    {/* <button id="review_btn" type="button" className="btn btn-primary mt-4" data-toggle="modal" data-target="#ratingModal"  >
                        Submit Your Review
                    </button> */}
                    {user ? <button id="review_btn" type="button" className="btn btn-primary mt-4" data-toggle="modal" data-target="#ratingModal" onClick={setUserRatings} >
                        Submit Your Review
                    </button> :
                        <div className="alert alert-danger mt-5" type='alert'>Login to post your review.</div>}
                    {errorReview && <p className="review-feedback" role="alert" style={{ color: 'red' }}>{errorReview}</p>}
                    {success && !errorReview && <p className="review-feedback" role="status" style={{ color: 'green' }}>Review submitted successfully.</p>}

                    {/* <div className="row mt-2 mb-5">
                        <div className="rating w-50">

                            <div className="modal fade" id="ratingModal" tabIndex="-1" role="dialog" aria-labelledby="ratingModalLabel" aria-hidden="true">
                                <div className="modal-dialog" role="document">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title" id="ratingModalLabel">Submit Review</h5>
                                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">

                                            <ul className="stars" >
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                            </ul>

                                            <textarea
                                                name="review"
                                                id="review" className="form-control mt-3"


                                            >
                                            </textarea>


                                            <button className="btn my-3 float-right review-btn px-4 text-white" data-dismiss="modal" aria-label="Close" >Submit</button>
                                        </div>

                                    </div>
                                </div>
                            </div>

                        </div>
                    </div> */}
                    <div className="product-review-area">
                        <div>

                            <div className="modal fade" id="ratingModal" tabIndex="-1" role="dialog" aria-labelledby="ratingModalLabel" aria-hidden="true">
                                <div className="modal-dialog" role="document">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title" id="ratingModalLabel">Submit Review</h5>
                                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                            </button>
                                        </div>
                                        <div className="modal-body">

                                            <ul className="stars" >
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                                <li className="star"><i className="fa fa-star"></i></li>
                                            </ul>

                                            <textarea
                                                name="review"
                                                id="review" className="form-control mt-3"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}

                                            >
                                            </textarea>


                                            <button className="btn my-3 float-right review-btn px-4 text-white" data-dismiss="modal" aria-label="Close" onClick={reviewHandler} >Submit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
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