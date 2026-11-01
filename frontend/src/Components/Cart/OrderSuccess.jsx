import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { downloadOrderReceipt } from '../../Utils/orderReceipt'
import { calculateOrderTotals } from '../../Utils/helpers'
import { formatCurrency } from '../../Utils/helpers'

const OrderSuccess = () => {
    const receipt = JSON.parse(sessionStorage.getItem('lastOrderReceipt') || 'null')
    const totals = receipt ? calculateOrderTotals(receipt.orderItems || []) : null
    return (
        <>

            <MetaData title={'Order Success'} />

            <div className="row justify-content-center">
                <div className="col-6 mt-5 text-center">
                    <img className="my-5 img-fluid d-block mx-auto" src="/images/order_success.png" alt="Order Success" width="200" height="200" />

                    <h2>Your Order has been placed successfully.</h2>
                    {totals && (
                        <div className="order-success-summary">
                            <p>Subtotal: {formatCurrency(totals.itemsPrice)}</p>
                            <p>Shipping: PHP {totals.shippingPrice.toFixed(2)}</p>
                            <p>Tax: {formatCurrency(totals.taxPrice)}</p>
                            <p><strong>Total: {formatCurrency(totals.totalPrice)}</strong></p>
                        </div>
                    )}
                    {receipt?.orderReference && (
                        <>
                            <p className="order-reference-label">Order reference</p>
                            <p className="order-reference">{receipt.orderReference}</p>
                            <button className="store-button store-button-dark receipt-download" type="button" onClick={() => downloadOrderReceipt(receipt)}>
                                Download PDF receipt
                            </button>
                        </>
                    )}

                    <Link to="/orders/me">Go to Orders</Link>
                </div>

            </div>

        </>
    )
}

export default OrderSuccess