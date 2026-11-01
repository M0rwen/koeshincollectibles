import { Link } from 'react-router-dom'

const Footer = () => (
    <footer className="site-footer">
        <div className="footer-inner">
            <Link className="footer-brand" to="/">koeshin<span>collectibles</span></Link>
            <p>Small objects. Long stories.</p>
            <div className="footer-contact">
                <h2>Contact us</h2>
                <a href="tel:09999999999">09999999999</a>
                <p>Curious finds for collectors, and stories waiting to be discovered.</p>
            </div>
            <Link to="/shop">Back to the collection</Link>
        </div>
        <div className="footer-bottom"><span>Koeshin Collectibles</span><span>A cabinet of curiosities, online</span></div>
    </footer>
)

export default Footer