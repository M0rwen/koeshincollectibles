import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Sidebar from './SideBar'
// import { getToken } from '../../Utils/helpers';
// import axios from 'axios'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux'
import { newProduct, clearErrors } from '../../actions/productActions'
import { NEW_PRODUCT_RESET } from '../../constants/productConstants'
import { PRODUCT_CATEGORIES } from '../../constants/productCategories'

const NewProduct = () => {
    const dispatch = useDispatch()
    const { loading, error, success } = useSelector(state => state.newProduct)

    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState(0);
    const [seller, setSeller] = useState('');
    const [images, setImages] = useState([]);
    const [imagesPreview, setImagesPreview] = useState([])
    // const [error, setError] = useState('')
    // const [loading, setLoading] = useState(true)
    // const [success, setSuccess] = useState('')
    // const [product, setProduct] = useState({})

    let navigate = useNavigate()

    const submitHandler = (e) => {
        e.preventDefault();
        if (images.length === 0) {
            toast.error('Add at least one product image.', { position: 'bottom-right' })
            return
        }

        dispatch(newProduct({
            name,
            price: Number(price),
            description,
            category,
            stock: Number(stock),
            seller,
            images
        }))
    }

    const onChange = e => {
        const files = Array.from(e.target.files || [])
        if (files.length > 10) {
            toast.error('Choose up to 10 product images.', { position: 'bottom-right' })
            e.target.value = ''
            return
        }
        const totalSize = files.reduce((total, file) => total + file.size, 0)
        if (files.some(file => file.size > 10 * 1024 * 1024) || totalSize > 35 * 1024 * 1024) {
            toast.error('Each image must be under 10 MB and all images together under 35 MB.', { position: 'bottom-right' })
            e.target.value = ''
            return
        }
        if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
            toast.error('Images must be JPEG, PNG, or WebP.', { position: 'bottom-right' })
            e.target.value = ''
            return
        }

        setImagesPreview([]);
        setImages([])
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setImagesPreview(oldArray => [...oldArray, reader.result])
                    setImages(oldArray => [...oldArray, reader.result])
                }
            }

            reader.readAsDataURL(file)
            // console.log(reader)
        })

    }
    // const newProduct = async (formData) => {

    //     try {
    //         const config = {
    //             headers: {
    //                 'Content-Type': 'application/json',

    //             },
    //             withCredentials: true
    //         }

    //         const { data } = await axios.post(`${import.meta.env.VITE_API}/admin/product/new`, formData, config)
    //         setLoading(false)
    //         setSuccess(data.success)
    //         setProduct(data.product)
    //     } catch (error) {
    //         setError(error.response.data.message)

    //     }
    // }
    // useEffect(() => {

    //     if (error) {
    //         toast.error(error, {
    //             position: 'bottom-right'
    //         });
    //     }

    //     if (success) {
    //         navigate('/admin/products');
    //         toast.success('Product created successfully', {
    //             position: 'bottom-right'
    //         })

    //     }

    // }, [error, success,])
    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });
            dispatch(clearErrors())
        }

        if (success) {
            navigate('/admin/products');
            toast.success('Product created successfully', {
                position: 'bottom-right'
            })
            dispatch({ type: NEW_PRODUCT_RESET })

        }

    }, [error, dispatch, navigate, success])

    return (
        <>
            <MetaData title={'New Product'} />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>

                <div className="col-12 col-md-10">
                    <>
                        <div className="wrapper my-5">
                            <form className="shadow-lg" onSubmit={submitHandler}>
                                <h1 className="mb-4">New Product</h1>

                                <div className="form-group">
                                    <label htmlFor="name_field">Name</label>
                                    <input
                                        type="text"
                                        id="name_field"
                                        className="form-control"
                                        required
                                        minLength={2}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="price_field">Price (PHP)</label>
                                    <input
                                        type="number"
                                        id="price_field"
                                        className="form-control"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description_field">Description</label>
                                    <textarea className="form-control" id="description_field" rows="8" minLength={10} value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="category_field">Category</label>
                                    <select className="form-control" id="category_field" value={category} onChange={(e) => setCategory(e.target.value)} required>
                                        <option value="">Select a collection</option>
                                        {PRODUCT_CATEGORIES.map(category => (
                                            <option key={category} value={category} >{category}</option>
                                        ))}

                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="stock_field">Stock</label>
                                    <input
                                        type="number"
                                        id="stock_field"
                                        className="form-control"
                                        min="0"
                                        step="1"
                                        required
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="seller_field">Seller Name</label>
                                    <input
                                        type="text"
                                        id="seller_field"
                                        className="form-control"
                                        required
                                        value={seller}
                                        onChange={(e) => setSeller(e.target.value)}
                                    />
                                </div>

                                <div className='form-group'>
                                    <label>Images</label>

                                    <div className='custom-file'>
                                        <input
                                            type='file'
                                            name='images'
                                            className='custom-file-input'
                                            id='customFile'
                                            accept='image/jpeg,image/png,image/webp'
                                            onChange={onChange}
                                            multiple
                                            required
                                        />
                                        <label className='custom-file-label' htmlFor='customFile'>
                                            Choose up to 10 images
                                        </label>
                                    </div>

                                    {imagesPreview.map(img => (
                                        <img src={img} key={img} alt="Images Preview" className="mt-3 mr-2" width="55" height="52" />
                                    ))}

                                </div>


                                <button
                                    id="login_button"
                                    type="submit"
                                    className="btn btn-block py-3"
                                    disabled={loading}
                                >
                                    CREATE
                                </button>

                            </form>
                        </div>
                    </>
                </div>
            </div>

        </>
    )
}
export default NewProduct
