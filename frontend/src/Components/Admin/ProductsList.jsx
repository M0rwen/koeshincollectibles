import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'


import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { formatCurrency } from '../../Utils/helpers';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import {
    getAdminProducts,
    deleteProduct,
    clearErrors,
    bulkDeleteProducts,
} from '../../actions/productActions'
import { DELETE_PRODUCT_RESET, BULK_DELETE_PRODUCTS_RESET } from '../../constants/productConstants'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'

const ProductsList = () => {
    const dispatch = useDispatch();
    const { loading, error, products } = useSelector(state => state.products)
    const { error: deleteError, isDeleted, isBulkDeleted } = useSelector(state => state.product)
    const [selectedIds, setSelectedIds] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

    useEffect(() => {
        console.log('ProductsList mounting, dispatching getAdminProducts')
        dispatch(getAdminProducts())
    }, [dispatch])

    useEffect(() => {
        console.log('State changed:', { loading, error, products, isDeleted, isBulkDeleted })

        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });
            dispatch(clearErrors())
        }

        if (deleteError) {
            toast.error(deleteError, {
                position: 'bottom-right'
            });
            dispatch(clearErrors())
        }

        if (isDeleted) {
            toast.success('Product deleted successfully', {
                position: 'bottom-right'
            })
            dispatch({ type: DELETE_PRODUCT_RESET })
        }

        if (isBulkDeleted) {
            toast.success('Products deleted successfully', {
                position: 'bottom-right'
            })
            setSelectedIds([])
            dispatch({ type: BULK_DELETE_PRODUCTS_RESET })
        }

    }, [error, deleteError, isDeleted, isBulkDeleted, dispatch])

    const deleteProductHandler = (id) => {
        dispatch(deleteProduct(id))
    }

    const bulkDeleteHandler = () => {
        if (selectedIds.length === 0) {
            toast.error('Please select at least one product to delete', {
                position: 'bottom-right'
            })
            return
        }
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} product(s)?`)) {
            dispatch(bulkDeleteProducts(selectedIds))
        }
    }

    const handleSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const filteredProducts = products && Array.isArray(products) 
        ? products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product._id.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : []

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!sortConfig.key) return 0
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (typeof aValue === 'string') {
            return sortConfig.direction === 'asc' 
                ? aValue.localeCompare(bValue) 
                : bValue.localeCompare(aValue)
        }
        return sortConfig.direction === 'asc' 
            ? aValue - bValue 
            : bValue - aValue
    })

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(sortedProducts.map(p => p._id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        )
    }

    return (
        <>
            <MetaData title={'All Products'} />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>

                <div className="col-12 col-md-10">
                    <>
                        <h1 className="my-5">All Products</h1>

                        {loading ? <Loader /> : error ? (
                            <div className="alert alert-danger">{error}</div>
                        ) : (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Form.Control
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ width: '300px' }}
                                    />
                                    <button 
                                        className="btn btn-danger" 
                                        onClick={bulkDeleteHandler}
                                        disabled={selectedIds.length === 0}
                                    >
                                        Delete Selected ({selectedIds.length})
                                    </button>
                                </div>
                                
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50px' }}>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={selectedIds.length === sortedProducts.length && sortedProducts.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th onClick={() => handleSort('_id')} style={{ cursor: 'pointer' }}>
                                                ID {sortConfig.key === '_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                                                Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th onClick={() => handleSort('stock')} style={{ cursor: 'pointer' }}>
                                                Stock {sortConfig.key === 'stock' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedProducts.map(product => (
                                            <tr key={product._id}>
                                                <td>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedIds.includes(product._id)}
                                                        onChange={() => handleSelectOne(product._id)}
                                                    />
                                                </td>
                                                <td style={{ wordBreak: 'break-all', maxWidth: '200px' }}>{product._id}</td>
                                                <td>{product.name}</td>
                                                <td>{formatCurrency(product.price)}</td>
                                                <td>{product.stock}</td>
                                                <td>
                                                    <Link to={`/admin/product/${product._id}`} className="btn btn-primary py-1 px-2">
                                                        <i className="fa fa-pencil"></i>
                                                    </Link>
                                                    <button className="btn btn-danger py-1 px-2 ml-2" onClick={() => deleteProductHandler(product._id)}>
                                                        <i className="fa fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                {sortedProducts.length === 0 && (
                                    <div className="alert alert-info">No products found</div>
                                )}
                            </>
                        )}

                    </>
                </div>
            </div>

        </>
    )
}

export default ProductsList