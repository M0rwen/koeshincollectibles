import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import MetaData from '../Layout/MetaData'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { updateProfile, loadUser, clearErrors } from '../../actions/userActions'
import { UPDATE_PROFILE_RESET } from '../../constants/userConstants'
import { useDispatch, useSelector } from 'react-redux'
import { profileSchema } from '../../validation/schemas'

const UpdateProfile = () => {
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)
    const { error, isUpdated, loading } = useSelector(state => state.user)
    const [avatar, setAvatar] = useState('')
    const avatarPreview = avatar || user?.avatar?.url || '/images/default_avatar.jpg'
    const navigate = useNavigate()

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: user?.name || '',
            email: user?.email || '',
            contactNumber: user?.contactNumber || '',
            address: user?.address || ''
        },
        validationSchema: profileSchema,
        validateOnMount: true,
        onSubmit: values => {
            const formData = new FormData()
            formData.set('name', values.name.trim())
            formData.set('email', values.email.trim())
            formData.set('contactNumber', values.contactNumber)
            formData.set('address', values.address)
            formData.set('avatar', avatar)
            return dispatch(updateProfile(formData))
        }
    })

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }
        if (isUpdated) {
            dispatch(loadUser())
            navigate('/me', { replace: true })
            dispatch({ type: UPDATE_PROFILE_RESET })
        }
    }, [error, isUpdated, user, dispatch, navigate])

    const onAvatarChange = event => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            if (reader.readyState === FileReader.DONE) {
                setAvatar(reader.result)
            }
        }
        reader.onerror = () => toast.error('Could not read the selected avatar.', { position: 'bottom-right' })
        reader.readAsDataURL(file)
    }

    const showError = field => formik.touched[field] && formik.errors[field]

    return (
        <>
            <MetaData title="Update Profile" />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={formik.handleSubmit} encType="multipart/form-data" noValidate>
                        <h1 className="mt-2 mb-5">Update Profile</h1>

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
                            <label htmlFor="email_field">Email</label>
                            <input
                                type="email"
                                id="email_field"
                                name="email"
                                className="form-control"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(showError('email'))}
                                aria-describedby={showError('email') ? 'email_error' : undefined}
                            />
                            {showError('email') && <div className="field-error" id="email_error" role="alert">{formik.errors.email}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact_field">Contact Number</label>
                            <input
                                type="tel"
                                id="contact_field"
                                name="contactNumber"
                                className="form-control"
                                inputMode="numeric"
                                value={formik.values.contactNumber}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(showError('contactNumber'))}
                                aria-describedby={showError('contactNumber') ? 'contact_error' : undefined}
                            />
                            {showError('contactNumber') && <div className="field-error" id="contact_error" role="alert">{formik.errors.contactNumber}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="address_field">Address</label>
                            <textarea
                                id="address_field"
                                name="address"
                                className="form-control"
                                value={formik.values.address}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="avatar_upload">Avatar</label>
                            <div className="d-flex align-items-center">
                                <figure className="avatar mr-3 item-rtl">
                                    <img src={avatarPreview} className="rounded-circle" alt="Avatar Preview" />
                                </figure>
                                <div className="custom-file">
                                    <input
                                        type="file"
                                        name="avatar"
                                        className="custom-file-input"
                                        id="avatar_upload"
                                        accept="image/*"
                                        onChange={onAvatarChange}
                                    />
                                    <label className="custom-file-label" htmlFor="avatar_upload">Choose Avatar</label>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn update-btn btn-block mt-4 mb-3"
                            disabled={!formik.isValid || formik.isSubmitting || loading}
                        >
                            {formik.isSubmitting || loading ? 'Updating…' : 'Update'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default UpdateProfile
