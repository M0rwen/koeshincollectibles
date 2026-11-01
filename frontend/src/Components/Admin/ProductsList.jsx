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
import api from '../../Utils/api'

const ProductsList = () => {
    const dispatch = useDispatch();
    const { loading, error, products } = useSelector(state => state.products)
    const { error: deleteError, isDeleted, isBulkDeleted } = useSelector(state => state.product)
    const [selectedIds, setSelectedIds] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
    const [currentPage, setCurrentPage] = useState(1)
    const [showDeleted, setShowDeleted] = useState(false)
    const ITEMS_PER_PAGE = 10

    useEffect(() => {
        dispatch(getAdminProducts(showDeleted))
    }, [dispatch, showDeleted])

    useEffect(() => {
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
            toast.success('Product moved to Deleted', { position: 'bottom-right' })
            dispatch({ type: DELETE_PRODUCT_RESET })
            dispatch(getAdminProducts(showDeleted))
        }

        if (isBulkDeleted) {
            toast.success('Products moved to Deleted', { position: 'bottom-right' })
            dispatch({ type: BULK_DELETE_PRODUCTS_RESET })
            dispatch(getAdminProducts(showDeleted))
        }

    }, [error, deleteError, isDeleted, isBulkDeleted, dispatch, showDeleted])

    const deleteProductHandler = (id) => {
        dispatch(deleteProduct(id))
    }

    const bulkDeleteHandler = async () => {
        if (selectedIds.length === 0) {
            toast.error('Please select at least one product to delete', {
                position: 'bottom-right'
            })
            return
        }
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} product(s)?`)) {
            const deleted = await dispatch(bulkDeleteProducts(selectedIds))
            if (deleted) setSelectedIds([])
        }
    }

    const toggleDeletedView = () => {
        setSelectedIds([])
        setCurrentPage(1)
        setShowDeleted(value => !value)
    }

    const restoreProductHandler = async (id) => {
        try {
            await api.put(`${import.meta.env.VITE_API}/admin/product/${id}/restore`)
            toast.success('Product restored successfully', { position: 'bottom-right' })
            dispatch(getAdminProducts(true))
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to restore product', { position: 'bottom-right' })
        }
    }

    const handleSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
        setCurrentPage(1)
    }

    const handleSearch = (value) => {
        setSearchTerm(value)
        setCurrentPage(1)
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

    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE)
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(paginatedProducts.map(p => p._id))
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
                                    <button
                                        type="button"
                                        className={`btn ${showDeleted ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={toggleDeletedView}
                                    >
                                        {showDeleted ? 'Show Active Products' : 'Show Deleted Products'}
                                    </button>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        style={{ width: '300px' }}
                                    />
                                    {!showDeleted && (
                                        <button
                                            className="btn btn-danger"
                                            onClick={bulkDeleteHandler}
                                            disabled={selectedIds.length === 0}
                                        >
                                            Delete Selected ({selectedIds.length})
                                        </button>
                                    )}
                                </div>
                                
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            {!showDeleted && <th style={{ width: '50px' }}>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p._id))}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>}
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
                                        {paginatedProducts.map(product => (
                                            <tr key={product._id}>
                                                {!showDeleted && <td>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedIds.includes(product._id)}
                                                        onChange={() => handleSelectOne(product._id)}
                                                    />
                                                </td>}
                                                <td style={{ wordBreak: 'break-all', maxWidth: '200px' }}>{product._id}</td>
                                                <td>{product.name}</td>
                                                <td>{formatCurrency(product.price)}</td>
                                                <td>{product.stock}</td>
                                                <td>
                                                    {showDeleted
                                                        ? <button className="btn btn-success py-1 px-2" onClick={() => restoreProductHandler(product._id)}>Restore</button>
                                                        : <>
                                                            <Link to={`/admin/product/${product._id}`} className="btn btn-primary py-1 px-2">
                                                                <i className="fa fa-pencil"></i>
                                                            </Link>
                                                            <button className="btn btn-danger py-1 px-2 ml-2" onClick={() => deleteProductHandler(product._id)}>
                                                                <i className="fa fa-trash"></i>
                                                            </button>
                                                        </>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                {sortedProducts.length === 0 && (
                                    <div className="alert alert-info">No products found</div>
                                )}
                                {totalPages > 1 && (
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                            Page {currentPage} of {totalPages} &mdash; {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}
                                        </span>
                                        <div>
                                            <button
                                                className="btn btn-outline-secondary btn-sm mr-2"
                                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                                disabled={currentPage === 1}
                                            >← Prev</button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                                .reduce((acc, p, idx, arr) => {
                                                    if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...')
                                                    acc.push(p)
                                                    return acc
                                                }, [])
                                                .map((item, idx) =>
                                                    item === '...'
                                                        ? <span key={`ellipsis-${idx}`} className="mx-1">…</span>
                                                        : <button
                                                            key={item}
                                                            className={`btn btn-sm mx-1 ${currentPage === item ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                            onClick={() => setCurrentPage(item)}
                                                          >{item}</button>
                                                )
                                            }
                                            <button
                                                className="btn btn-outline-secondary btn-sm ml-2"
                                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                            >Next →</button>
                                        </div>
                                    </div>
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