import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../actions/userActions'
import Search from './Search'

const Header = () => {
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)
    const { cartItems } = useSelector(state => state.cart)

    const logoutHandler = () => {
        dispatch(logout())
        toast.success('Logged out', { position: 'bottom-right' })
    }

    return (
        <header className="site-header">
            <div className="site-utility">
                <span>Curious finds for collectors and the collector-curious</span>
                <span>Made to be kept, found to be shared</span>
            </div>
            <div className="site-nav-wrap">
                <Link className="site-brand" to="/" aria-label="Koeshin Collectibles home">
                    <span className="brand-stamp" aria-hidden="true">K</span>
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
                            {user.role === 'admin' && <Link className="site-text-link" to="/dashboard">Studio</Link>}
                            <button className="site-text-link logout-link" type="button" onClick={logoutHandler}>Sign out</button>
                        </>
                    ) : <Link className="site-text-link" to="/login">Sign in</Link>}
                    <Link className="site-cart" to="/cart" aria-label={`Cart, ${cartItems?.length || 0} items`}>
                        <i className="fa fa-shopping-bag" aria-hidden="true" />
                        <span>Bag</span>
                        <span className="cart-count">{cartItems?.length || 0}</span>
                    </Link>
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