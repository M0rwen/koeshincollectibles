import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import MetaData from '../Layout/MetaData'
import Sidebar from './SideBar'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'
import { newProduct, clearErrors } from '../../actions/productActions'
import { NEW_PRODUCT_RESET } from '../../constants/productConstants'
import { PRODUCT_CATEGORIES } from '../../constants/productCategories'
import { newProductSchema } from '../../validation/schemas'

const readImage = file => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result)
        else reject(new Error('Could not read the selected image.'))
    }
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.readAsDataURL(file)
})

const NewProduct = () => {
    const dispatch = useDispatch()
    const { loading, error, success } = useSelector(state => state.newProduct)
    const navigate = useNavigate()
    const formik = useFormik({
        initialValues: {
            name: '',
            price: '',
            description: '',
            category: '',
            stock: 0,
            seller: '',
            images: []
        },
        validationSchema: newProductSchema,
        validateOnMount: true,
        onSubmit: values => dispatch(newProduct({
            ...values,
            price: Number(values.price),
            stock: Number(values.stock)
        }))
    })

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }
        if (success) {
            navigate('/admin/products')
            toast.success('Product created successfully', { position: 'bottom-right' })
            dispatch({ type: NEW_PRODUCT_RESET })
        }
    }, [error, dispatch, navigate, success])

    const onImagesChange = async event => {
        const files = Array.from(event.target.files || [])
        if (!files.length) {
            formik.setFieldTouched('images', true, false)
            formik.setFieldValue('images', [])
            return
        }

        const totalSize = files.reduce((total, file) => total + file.size, 0)
        const validationMessage = files.length > 10
            ? 'Choose up to 10 product images.'
            : files.some(file => file.size > 10 * 1024 * 1024) || totalSize > 35 * 1024 * 1024
                ? 'Each image must be under 10 MB and all images together under 35 MB.'
                : files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
                    ? 'Images must be JPEG, PNG, or WebP.'
                    : ''

        formik.setFieldTouched('images', true, false)
        if (validationMessage) {
            formik.setFieldError('images', validationMessage)
            toast.error(validationMessage, { position: 'bottom-right' })
            event.target.value = ''
            return
        }

        try {
            formik.setFieldValue('images', await Promise.all(files.map(readImage)))
        } catch (readError) {
            formik.setFieldError('images', readError.message)
            toast.error(readError.message, { position: 'bottom-right' })
        }
    }

    const showError = field => formik.touched[field] && formik.errors[field]

    return (
        <>
            <MetaData title="New Product" />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    <div className="wrapper my-5">
                        <form className="shadow-lg" onSubmit={formik.handleSubmit} noValidate>
                            <h1 className="mb-4">New Product</h1>

                            <div className="form-group">
                                <label htmlFor="name_field">Name</label>
                                <input
                                    type="text"
                                    id="name_field"
                                    name="name"
                                    className="form-control"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    aria-invalid={Boolean(showError('name'))}
                                    aria-describedby={showError('name') ? 'name_error' : undefined}
                                />
                                {showError('name') && <div className="field-error" id="name_error" role="alert">{formik.errors.name}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="price_field">Price (PHP)</label>
                                <input
                                    type="number"
                                    id="price_field"
                                    name="price"
                                    className="form-control"
                                    min="0"
                                    step="0.01"
                                    value={formik.values.price}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    aria-invalid={Boolean(showError('price'))}
                                    aria-describedby={showError('price') ? 'price_error' : undefined}
                                />
                                {showError('price') && <div className="field-error" id="price_error" role="alert">{formik.errors.price}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="description_field">Description</label>
                                <textarea
                                    id="description_field"
                                    name="description"
                                    className="form-control"
                                    rows="8"
                                    value={formik.values.description}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    aria-invalid={Boolean(showError('description'))}
                                    aria-describedby={showError('description') ? 'description_error' : undefined}
                                />
                                {showError('description') && <div className="field-error" id="description_error" role="alert">{formik.errors.description}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="category_field">Category</label>
                                <select
                                    id="category_field"
                                    name="category"
                                    className="form-control"
                                    value={formik.values.category}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    aria-invalid={Boolean(showError('category'))}
                                    aria-describedby={showError('category') ? 'category_error' : undefined}
                                >
                                    <option value="">Select a collection</option>
                                    {PRODUCT_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                                </select>
                                {showError('category') && <div className="field-error" id="category_error" role="alert">{formik.errors.category}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="stock_field">Stock</label>
                                <input
                                    type="number"
                                    id="stock_field"
                                    name="stock"
                                    className="form-control"
                                    min="0"
                                    step="1"
                                    value={formik.values.stock}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    aria-invalid={Boolean(showError('stock'))}
                                    aria-describedby={showError('stock') ? 'stock_error' : undefined}
                                />
                                {showError('stock') && <div className="field-error" id="stock_error" role="alert">{formik.errors.stock}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="seller_field">Seller Name</label>
                                <input
                                    type="text"
                                    id="seller_field"
                                    name="seller"
                                    className="form-control"
                                    value={formik.values.seller}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    aria-invalid={Boolean(showError('seller'))}
                                    aria-describedby={showError('seller') ? 'seller_error' : undefined}
                                />
                                {showError('seller') && <div className="field-error" id="seller_error" role="alert">{formik.errors.seller}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="images_field">Images</label>
                                <div className="custom-file">
                                    <input
                                        type="file"
                                        id="images_field"
                                        name="images"
                                        className="custom-file-input"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={onImagesChange}
                                        onBlur={() => formik.setFieldTouched('images', true)}
                                        multiple
                                        aria-invalid={Boolean(showError('images'))}
                                        aria-describedby={showError('images') ? 'images_error' : undefined}
                                    />
                                    <label className="custom-file-label" htmlFor="images_field">Choose up to 10 images</label>
                                </div>
                                {formik.values.images.map(image => (
                                    <img src={image} key={image} alt="Product preview" className="mt-3 mr-2" width="55" height="52" />
                                ))}
                                {showError('images') && <div className="field-error" id="images_error" role="alert">{formik.errors.images}</div>}
                            </div>

                            <button
                                id="login_button"
                                type="submit"
                                className="btn btn-block py-3"
                                disabled={!formik.isValid || formik.isSubmitting || loading}
                            >
                                {formik.isSubmitting || loading ? 'Creating…' : 'CREATE'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default NewProduct
