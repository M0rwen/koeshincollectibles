const AUTH_TOKEN_KEY = 'koeshin-token'

export const getAuthToken = () => {
    try {
        return window.localStorage.getItem(AUTH_TOKEN_KEY)
    } catch {
        return null
    }
}

export const storeAuthToken = token => {
    if (!token) return
    try {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token)
    } catch {
        return
    }
}

export const clearAuthToken = () => {
    try {
        window.localStorage.removeItem(AUTH_TOKEN_KEY)
    } catch {
        return
    }
}
