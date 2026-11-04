const User = require('../models/user')
const jwt = require("jsonwebtoken")

exports.isAuthenticatedUser = async (req, res, next) => {
    const authorization = req.get('Authorization') || ''
    const bearerToken = /^Bearer\s+(.+)$/i.exec(authorization)?.[1]
    const token = bearerToken || req.cookies?.token

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
        return res.status(401).json({ message: 'Your session is invalid or has expired. Please log in again.' })
    }

    req.user = await User.findById(decoded.id)
    if (!req.user || req.user.isDeleted === true) {
        return res.status(401).json({ message: 'Your account is unavailable. Please contact support.' })
    }

    next()
};

exports.authorizeRoles = (...roles) => {

    return (req, res, next) => {
        // console.log(roles, req.user, req.body);
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user.role}) is not allowed to acccess this resource` })

        }
        next()
    }
}