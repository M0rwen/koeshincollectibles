import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart, removeItemFromCart } from '../../actions/cartActions'
import { calculateOrderTotals, formatCurrency } from '../../Utils/helpers'


const Cart = () => {
    const dispatch = useDispatch();
    const { cartItems } = useSelector(state => state.cart)
    const { isAuthenticated } = useSelector(state => state.auth)
    const navigate = useNavigate()
    const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calculateOrderTotals(cartItems)


    const increaseQty = (id, quantity, stock) => {
        const newQty = quantity + 1;
        if (newQty > stock) return;
        dispatch(addItemToCart(id, newQty))
    }

    const decreaseQty = (id, quantity) => {
        const newQty = quantity - 1;
        if (newQty <= 0) return;
        dispatch(addItemToCart(id, newQty))
    }

    const removeCartItemHandler = (id) => {
        dispatch(removeItemFromCart(id))
    }
    const checkoutHandler = () => {
        navigate(isAuthenticated ? '/shipping' : '/login?redirect=shipping')
    }
    // localStorage.setItem('cartItems', JSON.stringify(cartItems))

    return (
        <>
            <MetaData title={'Your Cart'} />
            {cartItems.length === 0 ? <h2 className="mt-5">Your Cart is Empty</h2> : (
                <>
                    <h2 className="mt-5">Your Cart: <b>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</b></h2>

                    <div className="row d-flex justify-content-between">
                        <div className="col-12 col-lg-8">

                            {cartItems.map(item => (
                                <div className="cart-item" key={item.product}>
                                        <hr />
                                        <div className="row">
                                            <div className="col-4 col-lg-3">
                                                <img src={item.image} alt="Laptop" height="90" width="115" />
                                            </div>

                                            <div className="col-5 col-lg-3">
                                                <Link to={`/product/${item.product}`}>{item.name}</Link>
                                            </div>


                                            <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                                                <p id="card_item_price">{formatCurrency(item.price)}</p>
                                            </div>

                                            <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                                                <div className="stockCounter d-inline">
                                                    <button className="btn btn-danger minus" type="button" aria-label={`Decrease ${item.name} quantity`} disabled={item.quantity <= 1} onClick={() => decreaseQty(item.product, item.quantity)}>-</button>

                                                    <input type="number" className="form-control count d-inline" value={item.quantity} readOnly aria-label={`${item.name} quantity`} />

                                                    <button className="btn btn-primary plus" type="button" aria-label={`Increase ${item.name} quantity`} disabled={item.quantity >= item.stock} onClick={() => increaseQty(item.product, item.quantity, item.stock)}>+</button>
                                                </div>
                                            </div>

                                            <div className="col-4 col-lg-1 mt-4 mt-lg-0">
                                                <button id="delete_cart_item" className="btn btn-danger" type="button" aria-label={`Remove ${item.name} from cart`} onClick={() => removeCartItemHandler(item.product)}>
                                                    <i className="fa fa-trash" aria-hidden="true" />
                                                </button>
                                            </div>

                                        </div>
                                        <hr />
                                </div>
                            ))}

                        </div>

                        <div className="col-12 col-lg-3 my-4">
                            <div id="order_summary">
                                <h4>Order Summary</h4>
                                <hr />
                                <p>Subtotal: <span className="order-summary-values">{formatCurrency(itemsPrice)}</span></p>
                                <p>Shipping: <span className="order-summary-values">PHP {shippingPrice.toFixed(2)}</span></p>
                                <p>Estimated tax: <span className="order-summary-values">{formatCurrency(taxPrice)}</span></p>


                                <hr />
                                <p className="cart-grand-total">Grand total: <span className="order-summary-values">{formatCurrency(totalPrice)}</span></p>
                                <p className="shipping-hint">A flat shipping fee applies to each order.</p>
                                <hr />
                                <button id="checkout_btn" className="btn btn-primary btn-block" onClick={checkoutHandler}>Check out</button>
                                {/*<button id="checkout_btn" className="btn btn-primary btn-block" >Check out</button>*/}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default Cart