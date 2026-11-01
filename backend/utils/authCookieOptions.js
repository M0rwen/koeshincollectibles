const cookieDays = Number(process.env.COOKIE_EXPIRES_TIME)
const expiresInDays = Number.isFinite(cookieDays) && cookieDays > 0 ? cookieDays : 1
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER_SERVICE_ID)

const getAuthCookieOptions = (expires = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)) => ({
    expires,
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
})

module.exports = getAuthCookieOptions
