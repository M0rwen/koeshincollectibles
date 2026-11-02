import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../Utils/api'
import { formatCurrency } from '../../Utils/helpers'

const Search = () => {
    const [keyword, setKeyword] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [activeIndex, setActiveIndex] = useState(-1)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
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
                setSuggestions((data.products || []).slice(0, 6))
                setActiveIndex(-1)
                setIsOpen(true)
            } catch (requestError) {
                if (!controller.signal.aborted) {
                    setSuggestions([])
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
        setSuggestions([])
        setActiveIndex(-1)
        setError('')
        const hasSearchTerm = value.trim().length >= 2
        setIsOpen(hasSearchTerm)
        setIsLoading(hasSearchTerm)
    }

    const handleKeyDown = event => {
        if (event.key === 'Escape') {
            setIsOpen(false)
            setActiveIndex(-1)
            return
        }

        if (!isOpen || !suggestions.length) return

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex(index => (index + 1) % suggestions.length)
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex(index => (index - 1 + suggestions.length) % suggestions.length)
        } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault()
            openProduct(suggestions[activeIndex])
        }
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
                onChange={event => setKeyword(event.target.value)}
                onFocus={() => {
                    if (trimmedKeyword.length >= 2) setIsOpen(true)
                }}
                onKeyDown={handleKeyDown}
                onChange={event => changeKeyword(event.target.value)}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="search-suggestions"
                aria-activedescendant={activeIndex >= 0 ? `search-suggestion-${activeIndex}` : undefined}
            />
            <button type="submit" aria-label="Search">
                <i className="fa fa-search" aria-hidden="true" />
            </button>
            {showSuggestions && (
                <div className="search-suggestions" id="search-suggestions" role="listbox" aria-label="Product suggestions">
                    {isLoading ? (
                        <p className="search-suggestions-message" role="status">Searching…</p>
                    ) : error ? (
                        <p className="search-suggestions-message search-suggestions-error" role="alert">{error}</p>
                    ) : suggestions.length ? suggestions.map((product, index) => (
                        <button
                            className={`search-suggestion${activeIndex === index ? ' is-active' : ''}`}
                            id={`search-suggestion-${index}`}
                            key={product._id}
                            type="button"
                            role="option"
                            aria-selected={activeIndex === index}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => openProduct(product)}
                        >
                            <img src={product.images?.[0]?.url || '/images/logo.png'} alt="" />
                            <span className="search-suggestion-copy">
                                <strong>{product.name}</strong>
                                <small>{product.category}</small>
                            </span>
                            <span className="search-suggestion-price">{formatCurrency(product.price)}</span>
                        </button>
                    )) : (
                        <p className="search-suggestions-message">No matches</p>
                    )}
                </div>
            )}
        </form>
    )
}

export default Search
