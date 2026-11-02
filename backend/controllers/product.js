const Product = require('../models/product')
const Order = require('../models/order')
const cloudinary = require('cloudinary')
const fs = require('fs/promises')
const path = require('path')
const { randomUUID } = require('crypto')
const APIFeatures = require('../utils/apiFeatures');
const Filter = require('bad-words');
const badWordsFilter = new Filter();

const productImageDirectory = path.resolve(__dirname, '../../frontend/public/images/products')
const maxImageBytes = 10 * 1024 * 1024
const maxTotalImageBytes = 35 * 1024 * 1024

const getImageInputs = (images) => {
    if (typeof images === 'string') return [images]
    if (!Array.isArray(images)) return []
    return images.filter(image => typeof image === 'string' && image.length > 0)
}

const saveProductImages = async (images) => {
    const savedImages = []
    let totalBytes = 0

    try {
        for (const image of images) {
            const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(image)
            if (!match) throw new Error('Images must be valid JPEG, PNG, or WebP data URLs')

            const buffer = Buffer.from(match[2], 'base64')
            if (buffer.length === 0 || buffer.length > maxImageBytes) {
                throw new Error('Each product image must be smaller than 10 MB')
            }

            totalBytes += buffer.length
            if (totalBytes > maxTotalImageBytes) {
                throw new Error('Combined product images must be smaller than 35 MB')
            }

            const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase()
            const filename = `${randomUUID()}.${extension}`
            await fs.mkdir(productImageDirectory, { recursive: true })
            await fs.writeFile(path.join(productImageDirectory, filename), buffer, { flag: 'wx' })
            savedImages.push({
                public_id: `repo:${filename}`,
                url: `/images/products/${filename}`
            })
        }
    } catch (error) {
        await destroyProductImages(savedImages)
        throw error
    }

    return savedImages
}

const destroyProductImages = async (images = []) => {
    await Promise.allSettled(images.map(async image => {
        if (image.public_id?.startsWith('repo:')) {
            const filename = image.public_id.slice('repo:'.length)
            if (path.basename(filename) === filename) {
                await fs.unlink(path.join(productImageDirectory, filename)).catch(error => {
                    if (error.code !== 'ENOENT') throw error
                })
            }
        } else if (image.public_id?.startsWith('products/')) {
            await cloudinary.v2.uploader.destroy(image.public_id)
        }
    }))
}

exports.newProduct = async (req, res, next) => {
    const imageInputs = getImageInputs(req.body.images)
    if (imageInputs.length === 0 || imageInputs.length > 10) {
        return res.status(400).json({ message: 'Please provide between 1 and 10 product images' })
    }

    let images
    try {
        images = await saveProductImages(imageInputs)
    } catch (error) {
        return res.status(400).json({ message: `Product image upload failed: ${error.message}` })
    }

    let product
    try {
        product = await Product.create({
            ...req.body,
            images,
            user: req.user.id,
            isDeleted: false,
            deletedAt: undefined
        })
    } catch (error) {
        await destroyProductImages(images)
        return res.status(400).json({ message: error.message })
    }

    if (!product)
        return res.status(400).json({
            success: false,
            message: 'Product not created'
        })


    return res.status(201).json({
        success: true,
        product
    })
}

exports.getProducts = async (req, res) => {

    const resPerPage = 4;
    const activeProducts = { isDeleted: { $ne: true } }
    const productsCount = await Product.countDocuments(activeProducts);

    const apiFeatures = new APIFeatures(Product.find(activeProducts), req.query).search().filter()
    const filteredProductsCount = await Product.countDocuments(apiFeatures.query.getFilter());

    apiFeatures.pagination(resPerPage);
    const products = await apiFeatures.query;

    if (!products)
        return res.status(400).json({ message: 'error loading products' })
    return res.status(200).json({
        success: true,
        products,
        filteredProductsCount,
        resPerPage,
        productsCount,

    })
    // if (!products)
    //     return res.status(400).json({ message: 'error loading products' })

    // return res.status(200).json({
    //     success: true,
    //     products,
    //     resPerPage,
    //     productsCount,

    // })
}

exports.getSingleProduct = async (req, res, next) => {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    return res.status(200).json({
        success: true,
        product
    })
}

exports.getAdminProducts = async (req, res, next) => {

    const filter = req.query.deleted === 'true'
        ? { isDeleted: true }
        : { isDeleted: { $ne: true } }
    const products = await Product.find(filter);
    if (!products) {
        return res.status(404).json({
            success: false,
            message: 'Products not found'
        })
    }
    return res.status(200).json({
        success: true,
        products
    })

}
exports.updateProduct = async (req, res, next) => {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    const imageInputs = getImageInputs(req.body.images)
    if (imageInputs.length > 10) {
        return res.status(400).json({ message: 'A product can have at most 10 images' })
    }

    const updateFields = { ...req.body }
    delete updateFields.images
    delete updateFields.isDeleted
    delete updateFields.deletedAt
    if (imageInputs.length > 0) {
        try {
            updateFields.images = await saveProductImages(imageInputs)
        } catch (error) {
            return res.status(400).json({ message: `Product image upload failed: ${error.message}` })
        }
    }

    let updatedProduct
    try {
        updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id, isDeleted: { $ne: true } },
            updateFields, {
            new: true,
            runValidators: true,
            useFindandModify: false
            })
    } catch (error) {
        if (updateFields.images) await destroyProductImages(updateFields.images)
        return res.status(400).json({ message: error.message })
    }

    if (imageInputs.length > 0) {
        await destroyProductImages(product.images)
    }

    return res.status(200).json({
        success: true,
        product: updatedProduct
    })
}

exports.deleteProduct = async (req, res, next) => {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    product.isDeleted = true
    product.deletedAt = new Date()
    await product.save({ validateBeforeSave: false })

    return res.status(200).json({
        success: true,
        message: 'Product deleted'
    })
}

exports.restoreProduct = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: true })
    if (!product) {
        return res.status(404).json({ success: false, message: 'Deleted product not found' })
    }

    product.isDeleted = false
    product.deletedAt = undefined
    await product.save({ validateBeforeSave: false })
    return res.status(200).json({ success: true, product })
}

exports.createProductReview = async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    // 6.1 — buyers only: the reviewer must have a Delivered order containing this product
    const purchasedOrder = await Order.findOne({
        user: req.user._id,
        orderStatus: 'Delivered',
        'orderItems.product': productId,
        isDeleted: { $ne: true }
    })
    if (!purchasedOrder) {
        return res.status(403).json({
            success: false,
            message: 'You can only review products you have purchased and received.'
        })
    }

    // 6.3 — bad word filter
    if (comment && badWordsFilter.isProfane(comment)) {
        return res.status(400).json({
            success: false,
            message: 'Your review contains inappropriate language. Please revise your comment.'
        })
    }

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }
    const product = await Product.findOne({ _id: productId, isDeleted: { $ne: true } });
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' })
    }
    const existingReview = product.reviews.find(
        review => review.user.toString() === req.user._id.toString()
    )
    if (existingReview) {
        existingReview.comment = comment
        existingReview.rating = Number(rating)
        existingReview.name = req.user.name
        existingReview.isDeleted = false
        existingReview.deletedAt = undefined
    } else {
        product.reviews.push(review);
    }
    const activeReviews = product.reviews.filter(item => item.isDeleted !== true)
    product.numOfReviews = activeReviews.length
    product.ratings = activeReviews.length
        ? activeReviews.reduce((total, item) => total + item.rating, 0) / activeReviews.length
        : 0
    await product.save({ validateBeforeSave: false });
    if (!product)
        return res.status(400).json({
            success: false,
            message: 'review not posted'
        })
    return res.status(200).json({
        success: true
    })
}

exports.getProductReviews = async (req, res, next) => {
    const product = await Product.findOne({ _id: req.query.id, isDeleted: { $ne: true } });
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' })
    }
    res.status(200).json({
        success: true,
        reviews: product.reviews.filter(review => review.isDeleted !== true)
    })
}

exports.deleteReview = async (req, res, next) => {
    const product = await Product.findOne({ _id: req.query.productId, isDeleted: { $ne: true } });
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' })
    }
    const review = product.reviews.id(req.query.id)
    if (!review || review.isDeleted === true) {
        return res.status(404).json({ success: false, message: 'Review not found' })
    }

    review.isDeleted = true
    review.deletedAt = new Date()
    const activeReviews = product.reviews.filter(item => item.isDeleted !== true)
    product.numOfReviews = activeReviews.length
    product.ratings = activeReviews.length
        ? activeReviews.reduce((total, item) => total + item.rating, 0) / activeReviews.length
        : 0
    await product.save({ validateBeforeSave: false })

    return res.status(200).json({
        success: true
    })
}

exports.productSales = async (req, res, next) => {
    // SELECT product.name,sum(price * quantity) as total
    // FROM order
    // GROUP BY product_id
    const activeProductIds = await Product.find({ isDeleted: { $ne: true } }).distinct('_id')
    const totalSales = await Order.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $unwind: '$orderItems' },
        { $match: { 'orderItems.product': { $in: activeProductIds } } },
        {
            $group: {
                _id: null,
                total: {
                    $sum: {
                        $multiply: ['$orderItems.price', '$orderItems.quantity']
                    }
                }
            },
        },
    ])
    // console.log(totalSales)
    const sales = await Order.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $project: { _id: 0, orderItems: 1 } },
        { $unwind: "$orderItems" },
        { $match: { 'orderItems.product': { $in: activeProductIds } } },

        {
            $group: {
                _id: { product: "$orderItems.name" },
                total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            },
        },
    ])
    console.log(sales)

    if (!totalSales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }
    if (!sales) {
        return res.status(404).json({
            message: 'error sales'
        })

    }

    const totalPercentage = sales.map(item => {
        const total = totalSales[0]?.total || 0
        const percent = total ? Number(((item.total / total) * 100).toFixed(2)) : 0
        return {
            name: item._id.product,
            percent
        }
    })
    console.log(totalPercentage)
    res.status(200).json({
        success: true,
        totalPercentage,
        sales,
        totalSales
    })

}

exports.bulkDeleteProducts = async (req, res, next) => {
    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Please provide product IDs to delete'
        })
    }

    try {
        const products = await Product.find({
            _id: { $in: ids },
            isDeleted: { $ne: true }
        })

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found'
            })
        }

        await Product.updateMany(
            { _id: { $in: products.map(product => product._id) }, isDeleted: { $ne: true } },
            { $set: { isDeleted: true, deletedAt: new Date() } }
        )

        return res.status(200).json({
            success: true,
            message: `${products.length} products deleted successfully`
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}