import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addItemToCart } from '../../actions/cartActions'
import api from '../../Utils/api'
import { formatCurrency } from '../../Utils/helpers'

const Search = () => {
    const [keyword, setKeyword] = useState('')
    const [products, setProducts] = useState([])
    const [activeIndex, setActiveIndex] = useState(-1)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)
    const searchRef = useRef(null)
    const trimmedKeyword = keyword.trim()

    useEffect(() => {
        if (trimmedKeyword.length < 2) return undefined

        const controller = new AbortController()
        const timeout = window.setTimeout(async () => {
            try {
                const { data } = await api.get(`${import.meta.env.VITE_API}/products/suggest`, {
                    params: { keyword: trimmedKeyword },
                    signal: controller.signal
                })
                setProducts((data.products || []).slice(0, 8))
                setActiveIndex(-1)
                setIsOpen(true)
            } catch (requestError) {
                if (!controller.signal.aborted) {
                    setProducts([])
                    setIsOpen(true)
                    setError(requestError.response?.data?.message || 'Suggestions are unavailable right now.')
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false)
            }
        }, 250)

        return () => {
            window.clearTimeout(timeout)
            controller.abort()
        }
    }, [trimmedKeyword])

    useEffect(() => {
        const closeOnOutsideClick = event => {
            if (!searchRef.current?.contains(event.target)) setIsOpen(false)
        }
        document.addEventListener('mousedown', closeOnOutsideClick)
        document.addEventListener('touchstart', closeOnOutsideClick)
        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick)
            document.removeEventListener('touchstart', closeOnOutsideClick)
        }
    }, [])

    const searchHandler = event => {
        event.preventDefault()
        setIsOpen(false)
        navigate(trimmedKeyword ? `/search/${encodeURIComponent(trimmedKeyword)}` : '/')
    }

    const openProduct = product => {
        setIsOpen(false)
        navigate(`/product/${encodeURIComponent(product._id)}`)
    }

    const changeKeyword = value => {
        setKeyword(value)
        setProducts([])
        setActiveIndex(-1)
        setError('')
        const hasSearchTerm = value.trim().length >= 2
        setIsOpen(hasSearchTerm)
        setIsLoading(hasSearchTerm)
        if (!hasSearchTerm) setIsLoading(false)
    }

    const handleKeyDown = event => {
        if (event.key === 'Escape') {
            setIsOpen(false)
            setActiveIndex(-1)
            return
        }

        if (!isOpen || !products.length) return

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex(index => (index + 1) % products.length)
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex(index => (index - 1 + products.length) % products.length)
        } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault()
            openProduct(products[activeIndex])
        }
    }

    const addSuggestionToCart = async (event, product) => {
        event.preventDefault()
        event.stopPropagation()
        const added = await dispatch(addItemToCart(product._id, 1))
        if (added) setIsOpen(false)
    }

    const showSuggestions = isOpen && trimmedKeyword.length >= 2

    return (
        <form
            ref={searchRef}
            className={`site-search${showSuggestions ? ' has-suggestions' : ''}`}
            onSubmit={searchHandler}
            role="search"
        >
            <label className="sr-only" htmlFor="search_field">Search the collection</label>
            <input
                type="search"
                id="search_field"
                placeholder="Search cards, cars, curious things..."
                value={keyword}
                onFocus={() => {
                    if (trimmedKeyword.length >= 2) setIsOpen(true)
                }}
                onKeyDown={handleKeyDown}
                onChange={event => changeKeyword(event.target.value)}
                role="combobox"
                aria-autocomplete="list"
                aria-haspopup="grid"
                aria-expanded={showSuggestions}
                aria-controls="search-suggestions"
                aria-activedescendant={activeIndex >= 0 ? `search-product-${activeIndex}` : undefined}
            />
            <button type="submit" aria-label="Search">
                <i className="fa fa-search" aria-hidden="true" />
            </button>
            {showSuggestions && (
                <section className="search-suggestions" id="search-suggestions" aria-label="Live product results">
                    {isLoading ? (
                        <p className="search-suggestions-message" role="status">Searching…</p>
                    ) : error ? (
                        <p className="search-suggestions-message search-suggestions-error" role="alert">{error}</p>
                    ) : products.length ? (
                        <>
                            <div className="search-results-grid" role="grid" aria-label="Matching products">
                                {products.map((product, index) => (
                                    <article
                                        className={`collectible-card search-product-card${activeIndex === index ? ' is-active' : ''}`}
                                        id={`search-product-${index}`}
                                        key={product._id}
                                        role="gridcell"
                                        aria-selected={activeIndex === index}
                                        onMouseEnter={() => setActiveIndex(index)}
                                    >
                                        <button
                                            className="search-product-open"
                                            type="button"
                                            aria-label={`View ${product.name}`}
                                            onClick={() => openProduct(product)}
                                        >
                                            <span className="collectible-image">
                                                <span className="collectible-category">{product.category}</span>
                                                <img src={product.images?.[0]?.url || '/images/logo.png'} alt="" />
                                            </span>
                                        </button>
                                        <div className="collectible-info">
                                            <div className="collectible-rating" aria-label={`${Number(product.ratings) || 0} out of 5 stars, ${product.numOfReviews || 0} reviews`}>
                                                <span className="rating-stars" aria-hidden="true">
                                                    {Array.from({ length: 5 }, (_, starIndex) => (
                                                        <i className={`fa fa-star${starIndex < Math.round(Number(product.ratings) || 0) ? '' : '-o'}`} key={starIndex} />
                                                    ))}
                                                </span>
                                                <span>{product.numOfReviews || 0} reviews</span>
                                            </div>
                                            <h3>
                                                <button type="button" className="search-product-name" onClick={() => openProduct(product)}>
                                                    {product.name}
                                                </button>
                                            </h3>
                                            <div className="collectible-buy-row search-product-actions">
                                                <span className="collectible-price">{formatCurrency(product.price)}</span>
                                                <button className="store-button store-button-dark search-view-button" type="button" onClick={() => openProduct(product)}>View</button>
                                                {user && user.role !== 'admin' && (
                                                    <button
                                                        className="store-button store-button-light search-cart-button"
                                                        type="button"
                                                        disabled={Number(product.stock) < 1}
                                                        onClick={event => addSuggestionToCart(event, product)}
                                                    >
                                                        {Number(product.stock) < 1 ? 'Out of stock' : 'Add to cart'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <Link
                                className="search-see-all"
                                to={`/search/${encodeURIComponent(trimmedKeyword)}`}
                                onClick={() => setIsOpen(false)}
                            >
                                See all results for ‘{trimmedKeyword}’
                            </Link>
                        </>
                    ) : (
                        <p className="search-suggestions-message">No matches</p>
                    )}
                </section>
            )}
        </form>
    )
}

export default Search
