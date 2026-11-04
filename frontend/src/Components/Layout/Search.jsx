import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

const isProductGridPath = pathname => (
    pathname === '/shop'
    || pathname === '/collections'
    || pathname.startsWith('/collections/')
    || pathname === '/search'
    || pathname.startsWith('/search/')
)

const getSearchRouteKey = (pathname, keyword) => JSON.stringify([pathname, keyword])

const Search = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { keyword: routeKeyword } = useParams()
    const urlKeyword = new URLSearchParams(location.search).get('keyword')
    const routeValue = urlKeyword ?? routeKeyword ?? ''
    const [draft, setDraft] = useState(() => ({
        value: routeValue,
        routeKey: getSearchRouteKey(location.pathname, routeValue)
    }))
    const routeKey = getSearchRouteKey(location.pathname, routeValue)
    const keyword = draft.routeKey === routeKey ? draft.value : routeValue
    const trimmedKeyword = keyword.trim()

    const syncSearchToUrl = useCallback((value, { forceShop = false } = {}) => {
        const searchKeyword = value.trim().slice(0, 80)
        const isLegacySearchPath = location.pathname.startsWith('/search/')
        const isGridPage = isProductGridPath(location.pathname)

        if (!searchKeyword && !isGridPage && !isLegacySearchPath && !forceShop) return

        const nextPath = forceShop || isLegacySearchPath || (searchKeyword && !isGridPage)
            ? '/shop'
            : location.pathname
        const params = new URLSearchParams(location.search)
        if (searchKeyword.length >= 2) {
            params.set('keyword', searchKeyword)
        } else {
            params.delete('keyword')
        }

        const query = params.toString()
        const nextUrl = `${nextPath}${query ? `?${query}` : ''}${location.hash}`
        const currentUrl = `${location.pathname}${location.search}${location.hash}`
        if (nextUrl !== currentUrl) {
            setDraft(current => ({
                ...current,
                routeKey: getSearchRouteKey(nextPath, searchKeyword.length >= 2 ? searchKeyword : '')
            }))
            navigate(nextUrl)
        }
    }, [location.hash, location.pathname, location.search, navigate])

    useEffect(() => {
        if (trimmedKeyword.length < 2) return undefined

        const timeout = window.setTimeout(() => syncSearchToUrl(trimmedKeyword), 300)
        return () => window.clearTimeout(timeout)
    }, [trimmedKeyword, syncSearchToUrl])

    const handleChange = event => {
        const value = event.target.value
        setDraft({ value, routeKey })
        if (value.trim().length < 2) syncSearchToUrl(value)
    }

    const handleSubmit = event => {
        event.preventDefault()
        syncSearchToUrl(trimmedKeyword, {
            forceShop: !isProductGridPath(location.pathname)
        })
    }

    return (
        <form className="site-search" onSubmit={handleSubmit} role="search">
            <label className="sr-only" htmlFor="search_field">Search the collection</label>
            <input
                type="search"
                id="search_field"
                placeholder="Search cards, cars, curious things..."
                value={keyword}
                onChange={handleChange}
                aria-label="Search the collection"
            />
            <button type="submit" aria-label="Search">
                <i className="fa fa-search" aria-hidden="true" />
            </button>
        </form>
    )
}

export default Search
