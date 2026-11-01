import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import MetaData from '../Layout/MetaData'
import axios from 'axios'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'
import { loginWithGoogle } from '../../actions/userActions'
import { registerSchema } from '../../validation/schemas'

// Firebase popup helpers
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../firebase'

const Register = () => {
    const [avatar, setAvatar] = useState('')
    const [avatarPreview, setAvatarPreview] = useState('/images/default_avatar.jpg')

    const [error, setError] = useState('')

    const dispatch = useDispatch()
    const { isAuthenticated } = useSelector(state => state.auth)
    let navigate = useNavigate()

    const formik = useFormik({
        initialValues: {
            name: '',
            username: '',
            email: '',
            contactNumber: '',
            password: ''
        },
        validationSchema: registerSchema,
        validateOnMount: true,
        onSubmit: async values => {
            setError('')
            const formData = new FormData()
            formData.set('name', values.name.trim())
            formData.set('username', values.username.trim())
            formData.set('email', values.email.trim())
            formData.set('contactNumber', values.contactNumber)
            formData.set('password', values.password)
            formData.set('avatar', avatar)
            await register(formData)
        }
    })

    useEffect(() => {
        if (isAuthenticated) navigate('/')
    }, [isAuthenticated, navigate])

    const onChange = e => {
        if (e.target.name === 'avatar') {
            if (!e.target.files?.[0]) return
            const reader = new FileReader()
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setAvatarPreview(reader.result)
                    setAvatar(reader.result)
                }
            }
            reader.readAsDataURL(e.target.files[0])
        }
    }

    const register = async (userData) => {
        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } }
            await axios.post(`http://localhost:4001/api/v1/register`, userData, config)
            navigate('/')
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed')
        }
    }

    // ── Google sign-in (same as Login page) ───────────────────────────────────
    const googleHandler = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider)
            const idToken = await result.user.getIdToken()
            dispatch(loginWithGoogle(idToken))
        } catch (err) {
            if (
                err.code !== 'auth/popup-closed-by-user' &&
                err.code !== 'auth/cancelled-popup-request'
            ) {
                toast.error('Google sign-in failed. Please try again.', { position: 'bottom-right' })
            }
        }
    }

    return (
        <>
            <MetaData title={'Register User'} />

            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={formik.handleSubmit} encType='multipart/form-data' noValidate>
                        <h1 className="mb-3">Register</h1>

                        {error && (
                            <div className="alert alert-danger" role="alert">{error}</div>
                        )}

                        <div className="form-group">
                            <label htmlFor="name_field">Name</label>
                            <input
                                type="text"
                                id="name_field"
                                className="form-control"
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
                                aria-describedby={formik.touched.name && formik.errors.name ? 'name_error' : undefined}
                            />
                            {formik.touched.name && formik.errors.name && <div className="field-error" id="name_error" role="alert">{formik.errors.name}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="username_field">Username</label>
                            <input
                                type="text"
                                id="username_field"
                                className="form-control"
                                name="username"
                                autoComplete="username"
                                value={formik.values.username}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(formik.touched.username && formik.errors.username)}
                                aria-describedby={formik.touched.username && formik.errors.username ? 'username_error' : undefined}
                            />
                            {formik.touched.username && formik.errors.username && <div className="field-error" id="username_error" role="alert">{formik.errors.username}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email_field">Email</label>
                            <input
                                type="email"
                                id="email_field"
                                className="form-control"
                                name="email"
                                autoComplete="email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
                                aria-describedby={formik.touched.email && formik.errors.email ? 'email_error' : undefined}
                            />
                            {formik.touched.email && formik.errors.email && <div className="field-error" id="email_error" role="alert">{formik.errors.email}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact_field">Contact Number</label>
                            <input
                                type="tel"
                                id="contact_field"
                                className="form-control"
                                name="contactNumber"
                                inputMode="numeric"
                                autoComplete="tel"
                                value={formik.values.contactNumber}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(formik.touched.contactNumber && formik.errors.contactNumber)}
                                aria-describedby={formik.touched.contactNumber && formik.errors.contactNumber ? 'contact_error' : undefined}
                            />
                            {formik.touched.contactNumber && formik.errors.contactNumber && <div className="field-error" id="contact_error" role="alert">{formik.errors.contactNumber}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password_field">Password</label>
                            <input
                                type="password"
                                id="password_field"
                                className="form-control"
                                name="password"
                                autoComplete="new-password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
                                aria-describedby={formik.touched.password && formik.errors.password ? 'password_error' : undefined}
                            />
                            {formik.touched.password && formik.errors.password && <div className="field-error" id="password_error" role="alert">{formik.errors.password}</div>}
                        </div>

                        <div className='form-group'>
                            <label htmlFor='avatar_upload'>Avatar</label>
                            <div className='d-flex align-items-center'>
                                <div>
                                    <figure className='avatar mr-3 item-rtl'>
                                        <img
                                            src={avatarPreview}
                                            className='rounded-circle'
                                            alt='Avatar Preview'
                                        />
                                    </figure>
                                </div>
                                <div className='custom-file'>
                                    <input
                                        type='file'
                                        name='avatar'
                                        className='custom-file-input'
                                        id='customFile'
                                        accept="image/*"
                                        onChange={onChange}
                                    />
                                    <label className='custom-file-label' htmlFor='customFile'>
                                        Choose Avatar
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button
                            id="register_button"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={!formik.isValid || formik.isSubmitting}
                        >
                            {formik.isSubmitting ? 'REGISTERING…' : 'REGISTER'}
                        </button>

                        {/* ── Or register with Google ── */}
                        <div
                            className="text-center my-3"
                            style={{ color: '#888', fontSize: '0.85rem' }}
                        >
                            or
                        </div>

                        <button
                            id="google_register_button"
                            type="button"
                            className="btn btn-block py-2"
                            style={{
                                border: '1px solid #dadce0',
                                background: '#fff',
                                color: '#3c4043',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                fontWeight: 500,
                            }}
                            onClick={googleHandler}
                        >
                            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            Continue with Google
                        </button>

                    </form>
                </div>
            </div>

        </>
    )
}

export default Register