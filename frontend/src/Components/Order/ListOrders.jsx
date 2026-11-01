import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import { getToken } from '../../Utils/helpers'
import { useDispatch, useSelector } from 'react-redux'
import { myOrders } from '../../actions/orderActions'
import { calculateOrderTotals, formatCurrency } from '../../Utils/helpers'

const ListOrders = () => {
    // const [loading, setLoading] = useState(true)
    // const [error, setError] = useState('')
    const dispatch = useDispatch();
    const { loading, error, orders = [] } = useSelector(state => state.myOrders);
    // const [myOrdersList, setMyOrdersList] = useState([])

    // const myOrders = async () => {
    //     try {
    //         const config = {
    //             headers: {
    //                 'Authorization': `Bearer ${getToken()}`
    //             }
    //         }
    //         const { data } = await axios.get(`${import.meta.env.VITE_API}/orders/me`, config)
    //         console.log(data)
    //         setMyOrdersList(data.orders)
    //         setLoading(false)

    //     } catch (error) {
    //         setError(error.response.data.message)
    //     }
    // }
    useEffect(() => {
        dispatch(myOrders());
        if (error) {
            toast.error(error, {
                position: toast.POSITION.BOTTOM_RIGHT
            });
        }
    }, [error, dispatch])

    return (
        <>
            <MetaData title={'My Orders'} />
            <h1 className="my-5">My Orders</h1>
            {loading ? <Loader /> : (
                <div className="customer-orders-list">
                    {orders.map(order => {
                        const items = order.orderItems || []
                        const reference = order.orderReference || order._id
                        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'
                        const delivered = String(order.orderStatus || '').includes('Delivered')
                        const totals = calculateOrderTotals(items)

                        return (
                            <article className="customer-order-row" key={order._id}>
                                <div className="customer-order-reference">
                                    <span>Order reference</span>
                                    <strong>{reference}</strong>
                                </div>
                                <div className="customer-order-items">
                                    {items.slice(0, 2).map((item, index) => (
                                        <div className="customer-order-item" key={`${item.product}-${index}`}>
                                            <img src={item.image} alt="" loading="lazy" />
                                            <span className="customer-order-item-name">{item.name}</span>
                                            <span className="customer-order-item-quantity">× {item.quantity}</span>
                                        </div>
                                    ))}
                                    {items.length > 2 && <span className="customer-order-more">+{items.length - 2} more</span>}
                                    {!items.length && <span className="customer-order-more">No item details</span>}
                                </div>
                                <div className="customer-order-meta">
                                    <span className={delivered ? 'customer-order-status is-delivered' : 'customer-order-status'}>
                                        {order.orderStatus || 'Processing'}
                                    </span>
                                    <strong>{formatCurrency(totals.totalPrice)}</strong>
                                    <time>{date}</time>
                                </div>
                                <Link className="customer-order-view" to={`/order/${order._id}`}>View</Link>
                            </article>
                        )
                    })}
                    {!orders.length && <p className="customer-orders-empty">No orders yet.</p>}
                </div>
            )}
        </>
    )
}

export default ListOrders