import { Navigate } from 'react-router-dom'

import Loader from '../Layout/Loader'
import { useDispatch, useSelector } from 'react-redux'
import { loadUser } from '../../actions/userActions'

const ProtectedRoute = ({ children, isAdmin = false }) => {
    const { isAuthenticated, loading, user, sessionRestored, sessionError } = useSelector(state => state.auth)
    const dispatch = useDispatch()

    if (loading) return <Loader />
    if (!sessionRestored && sessionError) {
        return (
            <div className="landing-load-error" role="alert">
                <p>{sessionError}</p>
                <button className="store-button store-button-dark" type="button" onClick={() => dispatch(loadUser())}>
                    Retry
                </button>
            </div>
        )
    }
    if (!sessionRestored) return <Loader />
    if (loading === false) {
        if (isAuthenticated === false) {
            return <Navigate to='/login' />
        }
        if (isAdmin === true && user.role !== 'admin') {
            return <Navigate to='/' />
        }
        return children
    }
    return <Loader />
};

export default ProtectedRoute;