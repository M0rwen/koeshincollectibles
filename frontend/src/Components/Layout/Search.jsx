import { useState } from 'react'
import { useNavigate } from "react-router-dom";

const Search = () => {

    const [keyword, setKeyword] = useState('')
    const navigate = useNavigate()

    const searchHandler = (e) => {
        e.preventDefault()
        navigate(keyword.trim() ? `/search/${encodeURIComponent(keyword.trim())}` : '/')
    }

    return (
        <form className="site-search" onSubmit={searchHandler} role="search">
            <label className="sr-only" htmlFor="search_field">Search the collection</label>
            <input
                type="search"
                id="search_field"
                placeholder="Search cards, cars, curious things..."
                value={keyword}
                onChange={event => setKeyword(event.target.value)}
            />
            <button type="submit" aria-label="Search">
                <i className="fa fa-search" aria-hidden="true" />
            </button>
        </form>
    )
}

export default Search