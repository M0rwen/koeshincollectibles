import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import ProductSalesChart from './ProductSalesChart'
import UserSalesChart from './UserSalesChart'
import MonthlySalesChart from './MonthlySalesChart'
import { getAdminProducts } from '../../actions/productActions'

const Dashboard = () => {
    const dispatch = useDispatch()
    const { loading, error, products = [] } = useSelector(state => state.products)

    useEffect(() => {
        dispatch(getAdminProducts())
    }, [dispatch])

    return (
        <>
            <MetaData title="Admin Dashboard" />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <div className="col-12 col-md-10">
                    <h1 className="my-4">Dashboard</h1>
                    {loading ? <Loader /> : error ? (
                        <div className="alert alert-danger" role="alert">{error}</div>
                    ) : (
                        <div className="row pr-4">
                            <div className="col-xl-3 col-sm-6 mb-3">
                                <div className="card text-white bg-success o-hidden h-100">
                                    <div className="card-body">
                                        <div className="text-center card-font-size">
                                            Products<br /><b>{products.length}</b>
                                        </div>
                                    </div>
                                    <Link className="card-footer text-white clearfix small z-1" to="/admin/products">
                                        <span className="float-left">View Details</span>
                                        <span className="float-right"><i className="fa fa-angle-right" /></span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <ProductSalesChart />
                <UserSalesChart />
                <MonthlySalesChart />
            </div>
        </>
    )
}

export default Dashboard
