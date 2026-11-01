import { useState } from 'react'
import MetaData from '../Layout/MetaData'
import Sidebar from './SideBar'
import Swal from 'sweetalert2'
import axios from 'axios'
import { DataGrid } from '@mui/x-data-grid'

const ProductReviews = () => {
    const [productId, setProductId] = useState('')
    const [error, setError] = useState('')
    const [listReviews, setListReviews] = useState([])
    const [loading, setLoading] = useState(false)

    const getProductReviews = async (id) => {
        try {
            setLoading(true)
            setError('')
            const { data } = await axios.get(
                `${import.meta.env.VITE_API}/reviews?id=${encodeURIComponent(id)}`,
                { withCredentials: true }
            )
            setListReviews(data.reviews)
        } catch (requestError) {
            setListReviews([])
            setError(requestError.response?.data?.message || requestError.message)
        } finally {
            setLoading(false)
        }
    }

    const deleteReview = async (id) => {
        try {
            setLoading(true)
            setError('')
            await axios.delete(
                `${import.meta.env.VITE_API}/reviews?id=${encodeURIComponent(id)}&productId=${encodeURIComponent(productId)}`,
                { withCredentials: true }
            )
            await getProductReviews(productId)
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message)
        } finally {
            setLoading(false)
        }
    }

    const deleteReviewHandler = (id) => {
        void Swal.fire({
            title: 'Delete Review',
            icon: 'info',
            text: 'Do you want to delete this review?',
            confirmButtonText: 'Delete',
            showCancelButton: true
        }).then(result => {
            if (result.isConfirmed) return deleteReview(id)
        })
    }

    const submitHandler = (event) => {
        event.preventDefault()
        const normalizedProductId = productId.trim()
        if (normalizedProductId) {
            setProductId(normalizedProductId)
            void getProductReviews(normalizedProductId)
        }
    }

    const columns = [
        {
            field: 'id',
            headerName: 'Review ID',
            flex: 1,
            renderCell: params => <span style={{ wordBreak: 'break-all' }}>{params.value}</span>
        },
        { field: 'rating', headerName: 'Rating', width: 130, align: 'right', headerAlign: 'right' },
        { field: 'comment', headerName: 'Comment', flex: 1, minWidth: 180 },
        { field: 'user', headerName: 'User', width: 180 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: params => (
                <button
                    className="btn btn-danger py-1 px-2 ml-2"
                    disabled={loading}
                    onClick={() => deleteReviewHandler(params.id)}
                    aria-label={`Delete review ${params.id}`}
                >
                    <i className="fa fa-trash" />
                </button>
            )
        }
    ]

    const rows = listReviews.map(review => ({
        id: review._id,
        comment: review.comment,
        rating: review.rating,
        user: String(review.user)
    }))

    return (
        <>
            <MetaData title="Product Reviews" />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <div className="col-12 col-md-10">
                    <div className="row justify-content-center mt-5">
                        <div className="col-5">
                            <form onSubmit={submitHandler}>
                                <div className="form-group">
                                    <label htmlFor="productId_field">Enter Product ID</label>
                                    <input
                                        type="text"
                                        id="productId_field"
                                        className="form-control"
                                        value={productId}
                                        onChange={event => setProductId(event.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    id="search_button"
                                    type="submit"
                                    className="btn btn-primary btn-block py-2"
                                    disabled={loading}
                                >
                                    {loading ? 'LOADING...' : 'SEARCH'}
                                </button>
                            </form>
                        </div>
                    </div>
                    {error && <p className="alert alert-danger mt-3" role="alert">{error}</p>}
                    {loading ? (
                        <p className="mt-5 text-center" role="status">Loading reviews...</p>
                    ) : listReviews.length > 0 ? (
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            pageSize={5}
                            rowsPerPageOptions={[5, 10, 25]}
                            disableSelectionOnClick
                            getRowId={row => row.id}
                            showToolbar
                        />
                    ) : (
                        <p className="mt-5 text-center">
                            {productId ? 'No reviews found.' : 'Enter a product ID to view its reviews.'}
                        </p>
                    )}
                </div>
            </div>
        </>
    )
}

export default ProductReviews
