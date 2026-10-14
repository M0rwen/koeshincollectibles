import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import { downloadOrderReceipt } from '../../Utils/orderReceipt'

const OrderSuccess = () => {
    const receipt = JSON.parse(sessionStorage.getItem('lastOrderReceipt') || 'null')
    return (
        <>

            <MetaData title={'Order Success'} />

            <div className="row justify-content-center">
                <div className="col-6 mt-5 text-center">
                    <img className="my-5 img-fluid d-block mx-auto" src="/images/order_success.png" alt="Order Success" width="200" height="200" />

                    <h2>Your Order has been placed successfully.</h2>
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