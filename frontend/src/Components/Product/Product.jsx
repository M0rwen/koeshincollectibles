import { Link } from 'react-router-dom';
import { formatCurrency } from '../../Utils/helpers'

const Product = ({ product }) => {
    const image = product.images?.[0]
    return (
        <article className="collectible-card">
            <Link className="collectible-image" to={`/product/${product._id}`} aria-label={`View ${product.name}`}>
                <span className="collectible-category">{product.category}</span>
                <img src={image?.url || '/images/logo.png'} alt={product.name} loading="lazy" />
            </Link>
            <div className="collectible-info">
                <div className="collectible-rating" aria-label={`${product.ratings || 0} out of 5 stars`}>
                    <span className="rating-stars" aria-hidden="true">
                        {Array.from({ length: 5 }, (_, index) => (
                            <i className={`fa fa-star${index < Math.round(product.ratings || 0) ? '' : '-o'}`} key={index} />
                        ))}
                    </span>
                    <span>{product.numOfReviews || 0} reviews</span>
                </div>
                <h3><Link to={`/product/${product._id}`}>{product.name}</Link></h3>
                <div className="collectible-buy-row">
                    <span className="collectible-price">{formatCurrency(product.price)}</span>
                    <Link className="collectible-open" to={`/product/${product._id}`} aria-label={`See details for ${product.name}`}>
                        <i className="fa fa-arrow-right" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </article>
    )
}

export default Product