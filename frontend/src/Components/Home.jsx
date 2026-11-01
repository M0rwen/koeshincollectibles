import { useState, useEffect, useRef, useMemo } from 'react'
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

const ProductShelf = ({ eyebrow, title, products, link, linkLabel }) => (
    <section className="landing-shelf" aria-labelledby={`shelf-${title.toLowerCase().replaceAll(' ', '-')}`}>
        <div className="landing-section-heading">
            <div>
                <p className="store-kicker">{eyebrow}</p>
                <h2 id={`shelf-${title.toLowerCase().replaceAll(' ', '-')}`}>{title}</h2>
            </div>
            {link && <Link className="landing-text-link" to={link}>{linkLabel} <span aria-hidden="true">→</span></Link>}
        </div>
        {products.length ? (
            <div className="landing-product-row">
                {products.map(product => <Product key={product._id} product={product} />)}
            </div>
        ) : (
            <p className="landing-empty">The cabinet is being arranged. Check back soon for new finds.</p>
        )}
    </section>
)

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
    const newestProducts = useMemo(() => [...products].sort((first, second) => (
        new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime()
    )), [products])
    const fanFavorites = useMemo(() => {
        const topRated = [...newestProducts]
            .filter(product => Number(product.ratings) > 0)
            .sort((first, second) => (
                Number(second.ratings) - Number(first.ratings)
                || Number(second.numOfReviews || 0) - Number(first.numOfReviews || 0)
            ))
            .slice(0, 4)
        const favoriteIds = new Set(topRated.map(product => String(product._id)))
        return [
            ...topRated,
            ...newestProducts
                .filter(product => !favoriteIds.has(String(product._id)))
                .slice(0, Math.max(0, 4 - topRated.length))
        ]
    }, [newestProducts])
    const featuredCategory = newestProducts[0]?.category || PRODUCT_CATEGORIES[0]
    const featuredProducts = newestProducts
        .filter(product => product.category === featuredCategory)
        .slice(0, 4)
    const newestFind = newestProducts[0]

    useEffect(() => {
        if (isCollectionsPage || priceRangeInvalid) return
        if (isHomePage) {
            dispatch(getProducts(currentPage, keyword, price, category, rating))
            return
        }
        dispatch(getProducts(currentPage, keyword, price, category, rating))
    }, [currentPage, keyword, price, category, rating, priceRangeInvalid, isCollectionsPage, isHomePage, catalogRetry, dispatch])

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
        if (isCollectionsPage || isHomePage) {
            setCatalogRetry(retry => retry + 1)
            return
        }
        dispatch(getProducts(currentPage, keyword, price, category, rating))
    }

    const hasFilters = Boolean(keyword || category || rating || price[0] || price[1])

    if (isHomePage) {
        return (
            <>
                <MetaData title="Curious finds, carefully kept" />
                <main className="store-home store-landing">
                    <section className="landing-drop" aria-labelledby="store-hero-title">
                        <div className="landing-drop-copy">
                            <p className="landing-overline"><span aria-hidden="true">✦</span> A FRESH FIND IN THE CABINET</p>
                            <h1 id="store-hero-title">Good things<br />keep finding us.</h1>
                            <p className="landing-intro">A little shop of pocket-sized legends, curious keepsakes, and things worth keeping.</p>
                            <div className="landing-drop-detail">
                                <span className="landing-drop-pin" aria-hidden="true">✦</span>
                                <span className="landing-drop-detail-copy">
                                    <small>{newestFind ? 'JUST ADDED TO THE SHELF' : 'THE KOESHIN COLLECTION'}</small>
                                    <strong>{newestFind?.name || 'A cabinet of curiosities'}</strong>
                                </span>
                            </div>
                            <Link className="landing-cta" to={newestFind ? `/product/${newestFind._id}` : '/shop'}>
                                {newestFind ? 'Meet the newest find' : 'Explore the shop'} <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                        <div className="landing-drop-display">
                            <span className="landing-display-note">FOUND WITH<br />A LITTLE MAGIC</span>
                            <div className="landing-display-shelf" aria-hidden="true" />
                            <Link
                                className="landing-drop-object"
                                to={newestFind ? `/product/${newestFind._id}` : '/shop'}
                                aria-label={newestFind ? `View ${newestFind.name}` : 'Explore the shop'}
                            >
                                <img
                                    src={newestFind?.images?.[0]?.url || '/images/catalog/tin-silver-jet.jpg'}
                                    alt={newestFind?.name || 'A colorful vintage tin toy racer'}
                                />
                            </Link>
                            <span className="landing-drop-badge">THE LATEST<br />LITTLE LEGEND</span>
                        </div>
                        <span className="landing-spark landing-spark-one" aria-hidden="true">✦</span>
                        <span className="landing-spark landing-spark-two" aria-hidden="true">✧</span>
                    </section>

                    <section className="landing-categories" aria-labelledby="landing-categories-title">
                        <div className="landing-section-heading">
                            <div>
                                <p className="store-kicker">PICK A PATH</p>
                                <h2 id="landing-categories-title">Choose your cabinet</h2>
                            </div>
                            <span className="landing-aside-note">Every shelf has a story.</span>
                        </div>
                        <nav className="hanging-signs" aria-label="Browse product categories">
                            {PRODUCT_CATEGORIES.map((item, index) => (
                                <Link
                                    className={`hanging-sign hanging-sign-${index + 1}`}
                                    key={item}
                                    to={`/collections/${encodeURIComponent(item)}`}
                                >
                                    <span className="hanging-sign-number">0{index + 1}</span>
                                    <span className="hanging-sign-label">{item}</span>
                                    <span className="hanging-sign-arrow" aria-hidden="true">↗</span>
                                </Link>
                            ))}
                        </nav>
                    </section>

                    <ProductShelf eyebrow="JUST UNBOXED" title="New arrivals" products={newestProducts.slice(0, 4)} link="/shop" linkLabel="See every find" />
                    <ProductShelf eyebrow="THE ONES YOU LOVE" title="Fan favorites" products={fanFavorites} link="/shop" linkLabel="Browse the shop" />
                    {products.length > 4 && (
                        <ProductShelf
                            eyebrow="KEEP EXPLORING"
                            title="More from the cabinet"
                            products={newestProducts.slice(4)}
                            link="/shop"
                            linkLabel="Browse the full shop"
                        />
                    )}
                    {error && products.length > 0 && (
                        <p className="landing-load-note" role="alert">
                            More finds couldn’t be loaded. <button type="button" onClick={retryProducts}>Try again</button>
                        </p>
                    )}
                    {loading && products.length > 0 && (
                        <div className="infinite-loading" role="status"><span className="loading-mark" />Loading more finds...</div>
                    )}
                    {!loading && !error && hasMore && (
                        <div ref={sentinelRef} className="infinite-sentinel" role="status" aria-label="Loading more collectibles" />
                    )}
                    {!loading && !hasMore && products.length > 0 && (
                        <p className="collection-end">You've reached the end of the collection.</p>
                    )}

                    <section className="landing-featured" aria-labelledby="featured-collection-title">
                        <div className="landing-featured-copy">
                            <p className="store-kicker">A LITTLE WORLD OF ITS OWN</p>
                            <h2 id="featured-collection-title">Featured collection</h2>
                            <p>Step into {featuredCategory.toLowerCase()}—a hand-picked corner of the cabinet, full of pieces with stories still to tell.</p>
                            <Link className="landing-featured-link" to={`/collections/${encodeURIComponent(featuredCategory)}`}>
                                Explore {featuredCategory} <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                        <div className="landing-featured-display">
                            {featuredProducts.slice(0, 3).map((product, index) => (
                                <Link
                                    className={`featured-object featured-object-${index + 1}`}
                                    key={product._id}
                                    to={`/product/${product._id}`}
                                    aria-label={`View ${product.name}`}
                                >
                                    <img src={product.images?.[0]?.url || '/images/logo.png'} alt="" />
                                </Link>
                            ))}
                            {!featuredProducts.length && <span className="featured-placeholder" aria-hidden="true">✦</span>}
                            <span className="featured-collection-stamp" aria-hidden="true">THE<br />GOOD<br />FINDS</span>
                        </div>
                    </section>

                    {error && products.length === 0 && !loading && (
                        <div className="landing-load-error" role="alert">
                            <p>We couldn’t open the cabinet just now.</p>
                            <button className="landing-cta" type="button" onClick={retryProducts}>Try again</button>
                        </div>
                    )}
                </main>
            </>
        )
    }

    return (
        <>
            <MetaData title={isCollectionsPage ? 'Collections' : category || (isShopPage ? 'Shop all products' : 'Curious finds, carefully kept')} />
            <main className="store-home">
                {(isCollectionsPage || isCategoryPage) && <section className="collection-shortcuts" id="collections" aria-labelledby="collections-title">
                    <div className="section-heading collection-heading">
                        <div>
                            <p className="store-kicker">FIND YOUR NEXT FAVORITE</p>
                            <h2 id="collections-title">{isCollectionsPage ? 'Collections' : 'Browse collections'}</h2>
                            {isCollectionsPage && <p className="collection-description">Explore collectibles for every kind of collector.</p>}
                        </div>
                    </div>
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