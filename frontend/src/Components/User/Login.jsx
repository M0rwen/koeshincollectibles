import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useFormik } from 'formik'

import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'
import { login, loginWithGoogle, clearErrors } from '../../actions/userActions'
import { loginSchema } from '../../validation/schemas'

// Firebase popup helpers
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../firebase'

const Login = () => {
    const { isAuthenticated, error, loading } = useSelector(state => state.auth)
    let navigate = useNavigate()
    let location = useLocation()
    const dispatch = useDispatch()
    const formik = useFormik({
        initialValues: { identifier: '', password: '' },
        validationSchema: loginSchema,
        validateOnMount: true,
        onSubmit: values => dispatch(login(values.identifier.trim(), values.password))
    })

    // ── Normal username/password submit ───────────────────────────────────────
    // ── Google sign-in popup ──────────────────────────────────────────────────
    const googleHandler = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider)
            const idToken = await result.user.getIdToken()
            dispatch(loginWithGoogle(idToken))
        } catch (err) {
            // User just closed the popup — don't show an error
            if (
                err.code !== 'auth/popup-closed-by-user' &&
                err.code !== 'auth/cancelled-popup-request'
            ) {
                toast.error('Google sign-in failed. Please try again.', { position: 'bottom-right' })
            }
        }
    }

    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') : ''

    useEffect(() => {
        if (isAuthenticated && redirect === 'shipping') {
            navigate(`/${redirect}`)
        } else if (isAuthenticated) {
            navigate('/')
        }
        if (error) {
            toast.error(error, { position: 'bottom-right' })
            dispatch(clearErrors())
        }
    }, [error, isAuthenticated, dispatch, navigate, redirect])

    return (
        <>
            {loading ? <Loader /> : (
                <>
                    <MetaData title={'Login'} />

                    <div className="row wrapper">
                        <div className="col-10 col-lg-5">
                            <form className="shadow-lg" onSubmit={formik.handleSubmit} noValidate>
                                <h1 className="mb-3">Login</h1>

                                <div className="form-group">
                                    <label htmlFor="identifier_field">Username or Email</label>
                                    <input
                                        type="text"
                                        id="identifier_field"
                                        name="identifier"
                                        className="form-control"
                                        autoComplete="username"
                                        value={formik.values.identifier}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        aria-invalid={Boolean(formik.touched.identifier && formik.errors.identifier)}
                                        aria-describedby={formik.touched.identifier && formik.errors.identifier ? 'identifier_error' : undefined}
                                    />
                                    {formik.touched.identifier && formik.errors.identifier && (
                                        <div className="field-error" id="identifier_error" role="alert">{formik.errors.identifier}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password_field">Password</label>
                                    <input
                                        type="password"
                                        id="password_field"
                                        className="form-control"
                                        name="password"
                                        autoComplete="current-password"
                                        value={formik.values.password}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
                                        aria-describedby={formik.touched.password && formik.errors.password ? 'password_error' : undefined}
                                    />
                                    {formik.touched.password && formik.errors.password && (
                                        <div className="field-error" id="password_error" role="alert">{formik.errors.password}</div>
                                    )}
                                </div>

                                <Link to="/password/forgot" className="float-right mb-4">Forgot Password?</Link>

                                <button
                                    id="login_button"
                                    type="submit"
                                    className="btn btn-block py-3"
                                    disabled={!formik.isValid || formik.isSubmitting || loading}
                                >
                                    {formik.isSubmitting || loading ? 'LOGGING IN…' : 'LOGIN'}
                                </button>

                                {/* ── Google button ── */}
                                <div
                                    className="text-center my-3"
                                    style={{ color: '#888', fontSize: '0.85rem' }}
                                >
                                    or
                                </div>

                                <button
                                    id="google_login_button"
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
                                    {/* Inline Google "G" logo — no extra image file needed */}
                                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                    </svg>
                                    Continue with Google
                                </button>

                                <Link to="/register" className="float-right mt-3">New User?</Link>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default Login
