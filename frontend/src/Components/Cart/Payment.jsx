import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { createOrder, clearErrors } from '../../actions/orderActions'
import { removeItemsFromCart } from '../../actions/cartActions'
import { calculateOrderTotals, formatCurrency } from '../../Utils/helpers'
import { clearCheckoutSelection, getCheckoutItems } from '../../Utils/checkout'

const Payment = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { cartItems, shippingInfo } = useSelector(state => state.cart)
    const { error, loading } = useSelector(state => state.newOrder)
    const checkoutItems = getCheckoutItems(cartItems)
    const totals = calculateOrderTotals(checkoutItems)
    const [orderInfo] = useState(() => JSON.parse(sessionStorage.getItem('orderInfo') || 'null'))
    const [processingPayment, setProcessingPayment] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState(() => (
        sessionStorage.getItem('paymentMethod') === 'Demo payment'
            ? 'Demo payment'
            : 'Cash on Delivery'
    ))

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }
    }, [error, dispatch])

    const selectPaymentMethod = (method) => {
        setPaymentMethod(method)
        sessionStorage.setItem('paymentMethod', method)
    }

    const submitHandler = async (event) => {
        event.preventDefault()
        if (processingPayment || loading) return
        if (!orderInfo || checkoutItems.length === 0) {
            navigate('/cart')
            return
        }

        const order = {
            orderItems: checkoutItems,
            shippingInfo,
            ...orderInfo,
            paymentMethod,
            paymentInfo: { status: 'pending' }
        }

        if (paymentMethod === 'Demo payment') {
            setProcessingPayment(true)
            await new Promise(resolve => window.setTimeout(resolve, 1500))
        }

        const createdOrder = await dispatch(createOrder(order))
        if (!createdOrder) {
            setProcessingPayment(false)
            return
        }

        sessionStorage.setItem('lastOrderReceipt', JSON.stringify(createdOrder))
        await dispatch(removeItemsFromCart(checkoutItems.map(item => item.product)))
        clearCheckoutSelection()
        sessionStorage.removeItem('orderInfo')
        sessionStorage.removeItem('paymentMethod')
        toast.success(paymentMethod === 'Cash on Delivery'
            ? 'Order placed. Pay on delivery.'
            : 'Demo payment completed. No real charge was made.', { position: 'bottom-right' })
        navigate('/success')
    }

    return (
        <>
            <MetaData title="Payment method" />
            <CheckoutSteps shipping confirmOrder payment />
            <main className="payment-page">
                <form className="payment-panel" onSubmit={submitHandler}>
                    <p className="store-kicker">CHECKOUT</p>
                    <h1>Payment method</h1>
                    <fieldset className="payment-method-list">
                        <legend className="sr-only">Choose a payment method</legend>
                        <label className={`payment-method-option${paymentMethod === 'Demo payment' ? ' is-selected' : ''}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="Demo payment"
                                checked={paymentMethod === 'Demo payment'}
                                onChange={() => selectPaymentMethod('Demo payment')}
                                disabled={processingPayment || loading}
                            />
                            <span><strong>Pay now (demo)</strong><small>Demo payment, no real charge and no card details collected.</small></span>
                        </label>
                        <label className={`payment-method-option${paymentMethod === 'Cash on Delivery' ? ' is-selected' : ''}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="Cash on Delivery"
                                checked={paymentMethod === 'Cash on Delivery'}
                                onChange={() => selectPaymentMethod('Cash on Delivery')}
                                disabled={processingPayment || loading}
                            />
                            <span><strong>Cash on Delivery</strong><small>Pay when your order arrives.</small></span>
                        </label>
                    </fieldset>
                    <p className="payment-demo-note">Demo payment, no real charge.</p>
                    <div className="payment-total">
                        <span>Subtotal: {formatCurrency(totals.itemsPrice)}</span>
                    </div>
                    <div className="payment-total">
                        <span>Shipping: PHP {totals.shippingPrice.toFixed(2)}</span>
                    </div>
                    <div className="payment-total">
                        <span>Tax: {formatCurrency(totals.taxPrice)}</span>
                    </div>
                    <div className="payment-total">
                        <span>Amount due</span>
                        <strong>{formatCurrency(totals.totalPrice)}</strong>
                    </div>
                    <button
                        id="pay_btn"
                        type="submit"
                        className="store-button store-button-dark payment-submit"
                        disabled={loading || processingPayment || !orderInfo || checkoutItems.length === 0}
                    >
                        {processingPayment ? 'Processing payment…' : loading ? 'Placing order...' : paymentMethod === 'Demo payment' ? 'Pay now (demo)' : 'Place order'}
                    </button>
                </form>
            </main>
        </>
    )
}

export default Payment