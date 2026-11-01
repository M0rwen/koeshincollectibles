import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'

import { getOrderDetails } from '../../actions/orderActions'
import { formatCurrency } from '../../Utils/helpers'
import { downloadOrderReceipt } from '../../Utils/orderReceipt'

// import { getToken } from '../../Utils/helpers'

const OrderDetails = () => {
    // const [loading, setLoading] = useState(true)
    // const [error, setError] = useState('')
    // const [order, setOrder] = useState({})
    const dispatch = useDispatch();
    const { loading, error, order = {} } = useSelector(state => state.orderDetails)

    const { shippingInfo, orderItems, paymentInfo, paymentMethod, user, totalPrice, orderStatus } = order
    let { id } = useParams();

    // const getOrderDetails = async (id) => {
    //     try {

    //         const config = {
    //             headers: {
    //                 'Authorization': `Bearer ${getToken()}`
    //             }
    //         }

    //         const { data } = await axios.get(`${import.meta.env.VITE_API}/order/${id}`, config)
    //         console.log(data)
    //         setOrder(data.order)

    //         setLoading(false)


    //     } catch (error) {
    //         setError(error.response.data.message)
    //     }
    // }

    useEffect(() => {
        dispatch(getOrderDetails(id))

        if (error) {
            toast.error(error, {
                position: toast.POSITION.BOTTOM_RIGHT
            });
        }
    }, [error, id, dispatch])

    const shippingDetails = shippingInfo && `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`

    const isPaid = paymentInfo && paymentInfo.status === 'succeeded' ? true : false

    return (
        <>
            <MetaData title={'Order Details'} />

            {loading ? <Loader /> : (
                <>
                    <div className="row d-flex justify-content-between">
                        <div className="col-12 col-lg-8 mt-5 order-details">

                            <h1 className="my-5">Order # {order._id}</h1>
                            {order.orderReference && (
                                <div className="order-reference-block">
                                    <p><b>Reference:</b> {order.orderReference}</p>
                                    <button className="store-button store-button-dark receipt-download" type="button" onClick={() => downloadOrderReceipt(order)}>
                                        Download PDF receipt
                                    </button>
                                </div>
                            )}

                            <h4 className="mb-4">Shipping Info</h4>
                            <p><b>Name:</b> {user && user.name}</p>
                            <p><b>Phone:</b> {shippingInfo && shippingInfo.phoneNo}</p>
                            <p className="mb-4"><b>Address:</b>{shippingDetails}</p>
                            <p><b>Amount:</b> {formatCurrency(totalPrice)}</p>

                            <hr />

                            <h4 className="my-4">Payment</h4>
                            <p><b>Method:</b> {paymentMethod || 'Not recorded'}</p>
                            <p className={isPaid ? "greenColor" : "redColor"}><b>{isPaid ? "PAID" : paymentInfo?.status === 'pending' ? 'PENDING' : 'NOT PAID'}</b></p>


                            <h4 className="my-4">Order Status:</h4>
                            <p className={order.orderStatus && String(order.orderStatus).includes('Delivered') ? "greenColor" : "redColor"} ><b>{orderStatus}</b></p>


                            <h4 className="my-4">Order Items:</h4>

                            <hr />
                            <div className="cart-item my-1 order-line-items">
                                {orderItems && orderItems.map((item, index) => {
                                    const productId = item.product && typeof item.product === 'object'
                                        ? item.product._id
                                        : item.product

                                    return (
                                    <div key={item._id || `${productId || item.name}-${index}`} className="row my-5">
                                        <div className="col-4 col-lg-2">
                                            {productId
                                                ? <Link to={`/product/${productId}`} aria-label={`View ${item.name}`}><img src={item.image} alt={item.name} height="45" width="65" /></Link>
                                                : <img src={item.image} alt={item.name} height="45" width="65" />}
                                        </div>

                                        <div className="col-5 col-lg-5">
                                            {productId
                                                ? <Link to={`/product/${productId}`}>{item.name}</Link>
                                                : <span>{item.name}</span>}
                                        </div>


                                        <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                                            <p>{formatCurrency(item.price)}</p>
                                        </div>

                                        <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                                            <p>{item.quantity} Piece(s)</p>
                                        </div>
                                    </div>
                                    )
                                })}
                            </div>
                            <hr />
                        </div>
                    </div>
                </>
            )}

        </>
    )
}

export default OrderDetails