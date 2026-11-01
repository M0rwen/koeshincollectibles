const getAuthCookieOptions = require('./authCookieOptions')

const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken();
    res.status(statusCode).cookie('token', token, getAuthCookieOptions()).json({
        success: true,
        user
    })
}

module.exports = sendToken;