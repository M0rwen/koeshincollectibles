import { Link } from 'react-router-dom'

const Footer = () => (
    <footer className="site-footer">
        <div className="footer-inner">
            <Link className="footer-brand" to="/">koeshin<span>collectibles</span></Link>
            <p>Small objects. Long stories.</p>
            <Link to="/#shop">Back to the collection</Link>
        </div>
        <div className="footer-bottom"><span>Koeshin Collectibles</span><span>A cabinet of curiosities, online</span></div>
    </footer>
)

export default Footer