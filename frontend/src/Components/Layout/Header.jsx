import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../actions/userActions'
import Search from './Search'

const Header = ({ theme, onToggleTheme }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { user } = useSelector(state => state.auth)
    const { cartItems } = useSelector(state => state.cart)

    const logoutHandler = async () => {
        const loggedOut = await dispatch(logout())
        navigate('/login', { replace: true })
        if (loggedOut) {
            toast.success('Logged out', { position: 'bottom-right' })
        } else {
            toast.error('Signed out here, but the server could not end the session.', { position: 'bottom-right' })
        }
    }

    return (
        <header className="site-header">
            <div className="site-utility">
                <span>A curious little shop for collectors and the collector-curious</span>
                <span>Small finds. Long stories.</span>
            </div>
            <div className="site-nav-wrap">
                <Link className="site-brand" to="/" aria-label="Koeshin Collectibles home">
                    <img className="brand-mascot" src="/images/logo.png" alt="" />
                    <span className="brand-name">koeshin<span>collectibles</span></span>
                </Link>
                <Search />
                <div className="site-actions">
                    {user ? (
                        <>
                            <Link className="site-account" to="/me" aria-label={`Account for ${user.name}`}>
                                <span className="account-mark">{user.name?.charAt(0)?.toUpperCase() || 'K'}</span>
                                <span className="account-label">{user.name?.split(' ')[0] || 'Account'}</span>
                            </Link>
                            <Link className="site-text-link header-orders-link" to="/orders/me" aria-label="View orders">
                                <i className="fa fa-list-alt" aria-hidden="true" /><span>Orders</span>
                            </Link>
                            {user.role === 'admin' && (
                                <Link className="site-text-link header-admin-link" to="/dashboard" aria-label="Admin dashboard">
                                    <i className="fa fa-wrench" aria-hidden="true" /><span>Admin</span>
                                </Link>
                            )}
                            <button className="site-text-link logout-link" type="button" onClick={logoutHandler} aria-label="Sign out">
                                <i className="fa fa-sign-out" aria-hidden="true" /><span>Sign out</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link className="site-text-link header-login-link" to="/login" aria-label="Login">
                                <i className="fa fa-sign-in" aria-hidden="true" /><span>Login</span>
                            </Link>
                            <Link className="site-text-link header-register-link" to="/register" aria-label="Register">
                                <i className="fa fa-user-plus" aria-hidden="true" /><span>Register</span>
                            </Link>
                        </>
                    )}
                    <Link className="site-cart" to="/cart" aria-label={`Cart, ${cartItems?.length || 0} items`}>
                        <i className="fa fa-shopping-bag" aria-hidden="true" />
                        <span>Bag</span>
                        <span className="cart-count">{cartItems?.length || 0}</span>
                    </Link>
                    <button
                        className="theme-toggle"
                        type="button"
                        onClick={onToggleTheme}
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        aria-pressed={theme === 'dark'}
                    >
                        <i className={`fa ${theme === 'light' ? 'fa-moon-o' : 'fa-sun-o'}`} aria-hidden="true" />
                        <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
                    </button>
                </div>
            </div>
            <nav className="site-subnav" aria-label="Main navigation">
                <Link to="/shop">Shop all</Link>
                <Link to="/collections">Collections</Link>
                <span>Cards | toys | objects with a past</span>
                <span className="subnav-note">A cabinet of curiosities, online</span>
            </nav>
        </header>
    )
}

export default Header