import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import MetaData from './Layout/MetaData'
import Product from './Product/Product'
import Loader from './Layout/Loader'
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { useDispatch, useSelector } from 'react-redux'

import { getProducts } from '../actions/productActions'
import { PRODUCT_CATEGORIES } from '../constants/productCategories'
import { formatCurrency } from '../Utils/helpers'
const Home = () => {
    const { keyword, category: categoryParam } = useParams()
    const { pathname } = useLocation()
    const { loading, products, error, productsCount, filteredProductsCount } = useSelector(state => state.products)
    const [price, setPrice] = useState(['', ''])
    const [category, setCategory] = useState(() => (
        PRODUCT_CATEGORIES.includes(categoryParam) ? categoryParam : ''
    ))
    const [rating, setRating] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [catalogRetry, setCatalogRetry] = useState(0)
    const dispatch = useDispatch()
    const sentinelRef = useRef(null)
    const count = filteredProductsCount ?? productsCount ?? 0
    const hasMore = products.length < count
    const minimumPrice = Number(price[0]) || 1
    const maximumPrice = Number(price[1]) || 3500
    const sliderMaximum = Math.max(3500, Number(price[0]) || 0, Number(price[1]) || 0)
    const sliderValue = minimumPrice <= maximumPrice
        ? [minimumPrice, maximumPrice]
        : [maximumPrice, minimumPrice]
    const priceRangeInvalid = Boolean(price[0] && price[1] && Number(price[0]) > Number(price[1]))
    const isHomePage = pathname === '/'
    const isShopPage = pathname === '/shop'
    const isCollectionsPage = pathname === '/collections'
    const isCategoryPage = pathname.startsWith('/collections/')
    const productsByCategory = PRODUCT_CATEGORIES
        .map(name => ({
            name,
            products: products.filter(product => product.category === name)
        }))
        .filter(collection => collection.products.length > 0)

    useEffect(() => {
        if (isCollectionsPage || priceRangeInvalid) return
        dispatch(getProducts(currentPage, keyword, price, category, rating))
    }, [currentPage, keyword, price, category, rating, priceRangeInvalid, isCollectionsPage, dispatch])

    useEffect(() => {
        if (!isCollectionsPage || priceRangeInvalid) return

        let cancelled = false
        const loadCatalog = async () => {
            let page = 1
            let result
            do {
                result = await dispatch(getProducts(page, keyword, price, category, rating))
                if (cancelled || !result) return
                page += 1
            } while (result.resPerPage > 0 && page <= Math.ceil(result.filteredProductsCount / result.resPerPage))
        }

        void loadCatalog()
        return () => {
            cancelled = true
        }
    }, [catalogRetry, category, dispatch, isCollectionsPage, keyword, price, priceRangeInvalid, rating])

    useEffect(() => {
        const sentinel = sentinelRef.current
        if (isCollectionsPage || !sentinel || loading || error || !hasMore) return

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setCurrentPage(page => page + 1)
            }
        }, { rootMargin: '320px 0px' })

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [error, hasMore, isCollectionsPage, loading])

    const updateCategory = (value) => {
        setCategory(value)
        setCurrentPage(1)
    }

    const clearFilters = () => {
        setPrice(['', ''])
        setCategory('')
        setRating('')
        setCurrentPage(1)
    }

    const retryProducts = () => {
        if (isCollectionsPage) {
            setCatalogRetry(retry => retry + 1)
            return
        }
        dispatch(getProducts(currentPage, keyword, price, category, rating))
    }

    const hasFilters = Boolean(keyword || category || rating || price[0] || price[1])

    return (
        <>
            <MetaData title={isCollectionsPage ? 'Collections' : category || (isShopPage ? 'Shop all products' : 'Curious finds, carefully kept')} />
            <main className="store-home">
                {isHomePage && (
                    <section className="store-hero" aria-labelledby="store-hero-title">
                        <div className="store-hero-copy">
                            <p className="store-kicker">THE KOESHIN COLLECTION | THE COLLECTOR'S CABINET</p>
                            <h1 id="store-hero-title">Good things<br />keep finding us.</h1>
                            <p className="store-hero-text">Trading cards, Hot Wheels-scale racers, old-school toys and the odd thing you didn't know you were looking for.</p>
                            <a className="store-button store-button-light" href="#shop">Explore the finds <span aria-hidden="true">&gt;</span></a>
                            <p className="store-hero-note">A little nostalgia. A lot of character.</p>
                        </div>
                        <div className="store-hero-art">
                            <img src="/images/catalog/tin-silver-jet.jpg" alt="Colorful vintage tin toy racer" />
                            <span className="store-art-label">SMALL OBJECTS<br />BIG STORIES</span>
                        </div>
                    </section>
                )}

                {(isHomePage || isCollectionsPage || isCategoryPage) && <section className="collection-shortcuts" id="collections" aria-labelledby="collections-title">
                    <div className="section-heading collection-heading">
                        <div>
                            <p className="store-kicker">{isCollectionsPage ? 'FIND YOUR NEXT FAVORITE' : 'FOLLOW YOUR CURIOSITY'}</p>
                            <h2 id="collections-title">{isCollectionsPage ? 'Collections' : isCategoryPage ? 'Browse collections' : 'Browse the cabinets'}</h2>
                            {isCollectionsPage && <p className="collection-description">Explore collectibles for every kind of collector.</p>}
                        </div>
                        {isHomePage && <span className="collection-side-note">Three little worlds to get lost in</span>}
                    </div>
                    {isHomePage ? (
                        <div className="collection-list">
                            {PRODUCT_CATEGORIES.map((item, index) => (
                                <Link
                                    className="collection-link"
                                    key={item}
                                    to={`/collections/${encodeURIComponent(item)}`}
                                >
                                    <span className="collection-number">0{index + 1}</span>
                                    <span>{item}</span>
                                    <span className="collection-arrow" aria-hidden="true">&gt;</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <nav className="collection-selector" aria-label="Choose a collection">
                            <Link
                                className={`collection-chip${isCollectionsPage ? ' is-selected' : ''}`}
                                to="/collections"
                                aria-current={isCollectionsPage ? 'page' : undefined}
                            >
                                All collections
                            </Link>
                            {PRODUCT_CATEGORIES.map(item => {
                                const isSelected = isCategoryPage && categoryParam === item
                                return (
                                    <Link
                                        className={`collection-chip${isSelected ? ' is-selected' : ''}`}
                                        key={item}
                                        to={`/collections/${encodeURIComponent(item)}`}
                                        aria-current={isSelected ? 'page' : undefined}
                                    >
                                        {item}
                                    </Link>
                                )
                            })}
                        </nav>
                    )}
                </section>}

                <section className="shop-section" id="shop" aria-labelledby="shop-title">
                    <div className="shop-title-row">
                        <div>
                            <p className="store-kicker">THE GOOD STUFF</p>
                            <h2 id="shop-title">{keyword ? `Finds for "${keyword}"` : isCollectionsPage ? 'All collections' : category || (isShopPage ? 'Shop all products' : isCategoryPage ? categoryParam : 'Shop the collection')}</h2>
                        </div>
                        <div className="shop-count-wrap">
                            <p className="shop-count">{count} {count === 1 ? 'find' : 'finds'} in the cabinet</p>
                            <p className="catalog-preview-note">Preview listings; verify price, condition, and stock before sale.</p>
                        </div>
                    </div>

                    <div className="shop-layout">
                        <aside className="shop-filters" aria-label="Filter products">
                            <div className="filter-title-row">
                                <h3>Refine your hunt</h3>
                                {hasFilters && <button className="filter-reset" type="button" onClick={clearFilters}>Clear</button>}
                            </div>
                            <div className="filter-group">
                                <label htmlFor="category-filter">Collection</label>
                                <select id="category-filter" value={category} onChange={(event) => updateCategory(event.target.value)}>
                                    <option value="">Every collection</option>
                                    {PRODUCT_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label htmlFor="price-filter">Price range</label>
                                <Box className="price-slider">
                                    <Slider
                                        id="price-filter"
                                        getAriaLabel={() => 'Price range'}
                                        value={sliderValue}
                                        onChange={(_, value) => {
                                            setPrice(value.map(String))
                                            setCurrentPage(1)
                                        }}
                                        valueLabelDisplay="auto"
                                        getAriaValueText={formatCurrency}
                                        min={1}
                                        max={sliderMaximum}
                                    />
                                </Box>
                                <div className="price-values"><span>{price[0] ? formatCurrency(price[0]) : 'No minimum'}</span><span>{price[1] ? formatCurrency(price[1]) : 'No limit'}</span></div>
                                <div className="price-inputs">
                                    <div>
                                        <label htmlFor="minimum-price">Minimum (PHP)</label>
                                        <input
                                            id="minimum-price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            inputMode="decimal"
                                            placeholder="No minimum"
                                            value={price[0]}
                                            onChange={event => {
                                                setPrice([event.target.value, price[1]])
                                                setCurrentPage(1)
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="maximum-price">Maximum (PHP)</label>
                                        <input
                                            id="maximum-price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            inputMode="decimal"
                                            placeholder="No limit"
                                            value={price[1]}
                                            onChange={event => {
                                                setPrice([price[0], event.target.value])
                                                setCurrentPage(1)
                                            }}
                                        />
                                    </div>
                                </div>
                                {priceRangeInvalid && <p className="filter-error" role="alert">Minimum price cannot exceed maximum price.</p>}
                            </div>
                            <div className="filter-group">
                                <label htmlFor="rating-filter">Minimum rating</label>
                                <select id="rating-filter" value={rating} onChange={(event) => {
                                    setRating(event.target.value)
                                    setCurrentPage(1)
                                }}>
                                    <option value="">Any rating</option>
                                    {[4, 3, 2, 1].map(value => <option key={value} value={value}>{value} stars &amp; up</option>)}
                                </select>
                            </div>
                            <p className="filter-footnote">Collected curios, pocket-sized classics, and well-loved oddities.</p>
                        </aside>

                        <div className="shop-results">
                            {loading && currentPage === 1 && products.length === 0 ? <Loader /> : error && currentPage === 1 && products.length === 0 ? (
                                <div className="shop-empty"><h3>We couldn't open the cabinet.</h3><p>{error}</p><button className="store-button store-button-dark" type="button" onClick={retryProducts}>Try again</button></div>
                            ) : products.length > 0 && isCollectionsPage ? (
                                <div className="collection-products">
                                    {productsByCategory.map(collection => (
                                        <section className="collection-product-section" key={collection.name}>
                                            <div className="collection-product-heading">
                                                <h3>
                                                    <Link to={`/collections/${encodeURIComponent(collection.name)}`}>{collection.name}</Link>
                                                </h3>
                                                <span>{collection.products.length} {collection.products.length === 1 ? 'product' : 'products'}</span>
                                            </div>
                                            <div className="product-grid">
                                                {collection.products.map(product => <Product key={product._id} product={product} />)}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            ) : products?.length ? (
                                <div className="product-grid">
                                    {products.map(product => <Product key={product._id} product={product} />)}
                                </div>
                            ) : (
                                <div className="shop-empty">
                                    <span className="empty-mark" aria-hidden="true">*</span>
                                    <h3>No products found</h3>
                                    <p>Try another collection or loosen the filters to see more finds.</p>
                                    <button className="store-button store-button-dark" type="button" onClick={clearFilters}>Show everything</button>
                                </div>
                            )}
                            {error && products.length > 0 && isCollectionsPage && (
                                <div className="infinite-error" role="alert">
                                    <span>Some products couldn't load: {error}</span>
                                    <button type="button" onClick={retryProducts}>Retry</button>
                                </div>
                            )}
                            {error && currentPage > 1 && (
                                <div className="infinite-error" role="alert">
                                    <span>More finds couldn't load.</span>
                                    <button type="button" onClick={() => dispatch(getProducts(currentPage, keyword, price, category, rating))}>Retry</button>
                                </div>
                            )}
                            {loading && currentPage > 1 && <div className="infinite-loading" role="status"><span className="loading-mark" />Loading more finds...</div>}
                            {!isCollectionsPage && !loading && !error && hasMore && <div ref={sentinelRef} className="infinite-sentinel" aria-hidden="true" />}
                            {!loading && !hasMore && products.length > 0 && <p className="collection-end">You've reached the end of this collection.</p>}
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

export default Home