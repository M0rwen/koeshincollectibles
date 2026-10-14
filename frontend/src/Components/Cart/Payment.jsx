import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { createOrder, clearErrors } from '../../actions/orderActions'
import { clearCart } from '../../actions/cartActions'
import { formatCurrency } from '../../Utils/helpers'

const Payment = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { cartItems, shippingInfo } = useSelector(state => state.cart)
    const { error, loading } = useSelector(state => state.newOrder)
    const [orderInfo] = useState(() => JSON.parse(sessionStorage.getItem('orderInfo') || 'null'))
    const [paymentMethod, setPaymentMethod] = useState(() => (
        sessionStorage.getItem('paymentMethod') === 'Card (demo only)'
            ? 'Card (demo only)'
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
        if (!orderInfo || cartItems.length === 0) {
            navigate('/cart')
            return
        }

        const order = {
            orderItems: cartItems,
            shippingInfo,
            ...orderInfo,
            paymentMethod,
            paymentInfo: { id: '', status: 'pending' }
        }

        const createdOrder = await dispatch(createOrder(order))
        if (!createdOrder) return

        sessionStorage.setItem('lastOrderReceipt', JSON.stringify(createdOrder))
        dispatch(clearCart())
        sessionStorage.removeItem('orderInfo')
        sessionStorage.removeItem('paymentMethod')
        toast.success(paymentMethod === 'Cash on Delivery'
            ? 'Order placed. Payment is due on delivery.'
            : 'Demo order placed. No card payment was processed.', { position: 'bottom-right' })
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
                        <label className={`payment-method-option${paymentMethod === 'Cash on Delivery' ? ' is-selected' : ''}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="Cash on Delivery"
                                checked={paymentMethod === 'Cash on Delivery'}
                                onChange={() => selectPaymentMethod('Cash on Delivery')}
                            />
                            <span><strong>Cash on delivery</strong><small>Pay in cash when your order arrives.</small></span>
                        </label>
                        <label className={`payment-method-option${paymentMethod === 'Card (demo only)' ? ' is-selected' : ''}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="Card (demo only)"
                                checked={paymentMethod === 'Card (demo only)'}
                                onChange={() => selectPaymentMethod('Card (demo only)')}
                            />
                            <span><strong>Card payment (demo only)</strong><small>No card details are collected and no charge is processed.</small></span>
                        </label>
                    </fieldset>
                    <div className="payment-total">
                        <span>Amount due</span>
                        <strong>{formatCurrency(orderInfo?.totalPrice ?? 0)}</strong>
                    </div>
                    <button
                        id="pay_btn"
                        type="submit"
                        className="store-button store-button-dark payment-submit"
                        disabled={loading || !orderInfo || cartItems.length === 0}
                    >
                        {loading ? 'Placing order...' : 'Place order'}
                    </button>
                </form>
            </main>
        </>
    )
}

export default Payment