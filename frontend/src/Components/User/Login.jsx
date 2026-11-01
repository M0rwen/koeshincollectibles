import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDispatch, useSelector } from 'react-redux'
import { login, clearErrors } from '../../actions/userActions'
import SocialLoginButtons from './SocialLoginButtons'

const Login = () => {
    const { isAuthenticated, error, loading } = useSelector(state => state.auth)
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    let navigate = useNavigate()
    let location = useLocation()
    const dispatch = useDispatch()

    const submitHandler = (e) => {
        e.preventDefault()
        if (!identifier.trim() || !password) {
            toast.error('Enter your username or email and password.', { position: 'bottom-right' })
            return
        }
        dispatch(login(identifier.trim(), password))
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
                            <form className="shadow-lg" onSubmit={submitHandler}>
                                <h1 className="mb-3">Login</h1>

                                <div className="form-group">
                                    <label htmlFor="identifier_field">Username or Email</label>
                                    <input
                                        type="text"
                                        id="identifier_field"
                                        className="form-control"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password_field">Password</label>
                                    <input
                                        type="password"
                                        id="password_field"
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <Link to="/password/forgot" className="float-right mb-4">Forgot Password?</Link>

                                <button
                                    id="login_button"
                                    type="submit"
                                    className="btn btn-block py-3"
                                >
                                    LOGIN
                                </button>

                                <SocialLoginButtons />

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
