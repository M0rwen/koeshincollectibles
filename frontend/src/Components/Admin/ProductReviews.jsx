import { useState, useCallback, useMemo } from 'react'


import MetaData from '../Layout/MetaData'
import Sidebar from './SideBar'
// import Toast from '../Layout/Toast'
import Swal from 'sweetalert2'
import { errMsg, getToken, successMsg } from '../../Utils/helpers'
import api from '../../Utils/api'
import { DataGrid, } from '@mui/x-data-grid'

const ProductReviews = () => {
    const [productId, setProductId] = useState('')
    const [listReviews, setListReviews] = useState([])
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        }
    }), [])

    const getProductReviews = useCallback(async (id) => {
        try {

            const { data } = await api.get(`${import.meta.env.VITE_API}/reviews?id=${id}`, config)
            setListReviews(data.reviews)

        } catch (error) {
            errMsg(error.response?.data?.message || error.message)
        }
    }, [config])
    const deleteReview = async (id, productId) => {
        try {
            const { data } = await api.delete(`${import.meta.env.VITE_API}/reviews?id=${id}&productId=${productId}`, config)
            if (data.success) {
                successMsg('Review moved to Deleted')
                await getProductReviews(productId)
            }

        } catch (error) {
            errMsg(error.response?.data?.message || error.message)
        }
    }

    const deleteReviewHandler = (id) => {
        Swal.fire({
            title: 'Delete Review',
            icon: 'info',
            text: 'Do you want to delete this review',
            confirmButtonText: 'Delete',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                deleteReview(id, productId)
            }
        })

    }
    const submitHandler = (e) => {
        e.preventDefault();
        getProductReviews(productId)
    }

    const columns = [
        {
            field: 'id',
            headerName: 'Review ID',
            flex: 1,
            renderCell: (params) => <span style={{ wordBreak: 'break-all' }}>{params.value}</span>
        },
        {
            field: 'rating',
            headerName: 'Rating',

            width: 130,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'comment',
            headerName: 'Comment',
            width: 120,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'user',
            headerName: 'User',
            width: 120,
            align: 'right',
            headerAlign: 'right'
        },

        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => (

                <>
                    <button className="btn btn-danger py-1 px-2 ml-2" onClick={() => deleteReviewHandler(params.id)}>
                        <i className="fa fa-trash"></i>
                    </button>
                </>
            )
        }
    ];

    const rows = listReviews.map(review => ({
        id: review._id,
        comment: review.comment,
        rating: review.rating,
        user: review.user,
    }));



    return (
        <>
            <MetaData title={'Product Reviews'} />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <div className="col-12 col-md-10">
                    <>
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
                                            onChange={(e) => setProductId(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        id="search_button"
                                        type="submit"
                                        className="btn btn-primary btn-block py-2"
                                    >
                                        SEARCH
                                    </button>
                                </ form>
                            </div>
                        </div>
                        {listReviews && listReviews.length > 0 ? (
                            <DataGrid
                                rows={rows}
                                columns={columns}

                                pageSize={5}
                                rowsPerPageOptions={[5, 10, 25]}
                                disableSelectionOnClick
                                getRowId={(row) => row.id}
                                showToolbar
                            />
                        ) : (
                            <p className="mt-5 text-center">No Reviews.</p>
                        )}
                    </>
                </div>
            </div>
        </>
    )
}

export default ProductReviews