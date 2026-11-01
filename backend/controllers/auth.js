const User = require('../models/user');
const crypto = require('crypto')
const cloudinary = require('cloudinary')
const sendEmail = require('../utils/sendEmail')
const sendToken = require('../utils/jwtToken');
const getAuthCookieOptions = require('../utils/authCookieOptions')
const admin = require('../config/firebaseAdmin');

// ─── Google / Firebase login ──────────────────────────────────────────────────
// POST /api/v1/auth/firebase
// Body: { idToken }  (the Firebase ID token from the frontend popup)
exports.firebaseLogin = async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
        return res.status(400).json({ message: 'No Firebase ID token provided' });
    }

    let decoded;
    try {
        // Verify the token with Firebase Admin — throws if fake or expired
        decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
        return res.status(401).json({ message: 'Invalid or expired Google token. Please try again.' });
    }

    const { uid, email, name, picture } = decoded;

    // Try to find an existing user with this email
    let user = await User.findOne({ email });

    if (!user) {
        // First-time Google sign-in: create a new account with safe defaults.
        // Username: take the part before "@" and add a short random suffix so it is unique.
        const base = email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 20);
        const suffix = Math.random().toString(36).slice(2, 6); // e.g. "k7m2"
        const username = `${base}_${suffix}`;

        // Password: random 32-char string — user never needs it (they log in with Google).
        const tempPassword = crypto.randomBytes(16).toString('hex');

        // Avatar: use Google's profile photo URL directly.
        // We use "google:<uid>" as public_id so the delete-avatar code never tries
        // to remove it from Cloudinary.
        const avatar = {
            public_id: `google:${uid}`,
            url: picture || 'https://res.cloudinary.com/demo/image/upload/v1/avatars/default'
        };

        user = await User.create({
            name: name || 'Google User',
            username,
            email,
            contactNumber: '00000000', // placeholder — user can update in their profile
            password: tempPassword,
            avatar,
        });
    }

    // Issue the same JWT cookie as the normal login — nothing else changes
    sendToken(user, 200, res);
};
// ─────────────────────────────────────────────────────────────────────────────

exports.registerUser = async (req, res, next) => {
    console.log(req.body)

    const { name, username, email, contactNumber, password } = req.body;

    if (!name || !username || !email || !contactNumber || !password) {
        return res.status(400).json({ message: 'Please provide name, username, email, contact number and password.' })
    }

    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
        crop: "scale"
    }, (err, res) => {
        console.log(err, res);
    });
    const user = await User.create({
        name,
        username,
        email,
        contactNumber,
        password,
        avatar: {
            public_id: result.public_id,
            url: result.secure_url
        },
    })
    //test token
    const token = user.getJwtToken();

    return res.status(201).json({
        success: true,
        user,
        token
    })
    // sendToken(user, 200, res)
}

exports.loginUser = async (req, res, next) => {
    console.log(req.body)
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ error: 'Please enter username/email and password' })
    }

    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier } : { username: identifier };

    let user = await User.findOne(query).select('+password')
    if (!user) {
        return res.status(401).json({ message: 'Invalid username/email or password' })
    }


    // Checks if password is correct or not
    const isPasswordMatched = await user.comparePassword(password);


    if (!isPasswordMatched) {
        return res.status(401).json({ message: 'Invalid Email or Password' })
    }
    // const token = user.getJwtToken();

    // res.status(201).json({
    //     success: true,
    //     token,
    //     user
    // });
    user = await User.findOne(query)
    sendToken(user, 200, res)
}

exports.forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ error: 'User not found with this email' })

    }
    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    // Create reset password url
    const resetUrl = `${req.protocol}://localhost:5173/password/reset/${resetToken}`;
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`
    try {
        await sendEmail({
            email: user.email,
            subject: 'ShopIT Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ error: error.message })

    }
}

exports.resetPassword = async (req, res, next) => {
    console.log(req.params.token)
    // Hash URL token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })
    console.log(user)

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has been expired' })

    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Password does not match' })

    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const token = user.getJwtToken();
    return res.status(201).json({
        success: true,
        token,
        user
    });

}

exports.getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    console.log(user)

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updateProfile = async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        contactNumber: req.body.contactNumber,
        address: req.body.address || ''
    }

    // Update avatar
    if (req.body.avatar !== '') {
        let user = await User.findById(req.user.id)
        const image_id = user.avatar?.public_id;
        // Only destroy if it's a real Cloudinary image, not a Google photo
        if (image_id && !image_id.startsWith('google:')) {
            await cloudinary.v2.uploader.destroy(image_id);
        }
        // console.log("Res", res)
        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        })

        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    })
    if (!user) {
        return res.status(401).json({ message: 'User Not Updated' })
    }

    return res.status(200).json({
        success: true,
        user
    })
}

exports.updatePassword = async (req, res, next) => {
    console.log(req.body.password)
    const user = await User.findById(req.user.id).select('+password');
    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return res.status(400).json({ message: 'Old password is incorrect' })
    }
    user.password = req.body.password;
    await user.save();
    const token = user.getJwtToken();

    return res.status(201).json({
        success: true,
        user,
        token
    });

}

exports.allUsers = async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
}

exports.deleteUser = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(401).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    // Only remove from Cloudinary if it's a real Cloudinary image (not a Google avatar)
    const image_id = user.avatar?.public_id;
    if (image_id && !image_id.startsWith('google:')) {
        await cloudinary.v2.uploader.destroy(image_id);
    }
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({
        success: true,
    })
}

exports.getUserDetails = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ message: `User does not found with id: ${req.params.id}` })
        // return next(new ErrorHandler(`User does not found with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user
    })
}

exports.updateUser = async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        // useFindAndModify: false
    })

    return res.status(200).json({
        success: true
    })
}

exports.logout = async (req, res, next) => {
    res.cookie('token', null, getAuthCookieOptions(new Date(0)))

    return res.status(200).json({
        success: true,
        message: 'Logged out'
    })
}