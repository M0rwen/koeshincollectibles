const Product = require('../models/product')
const Order = require('../models/order')
const cloudinary = require('cloudinary')
const fs = require('fs/promises')
const path = require('path')
const { randomUUID } = require('crypto')
const APIFeatures = require('../utils/apiFeatures');

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
        product = await Product.create({ ...req.body, images, user: req.user.id })
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
    const productsCount = await Product.countDocuments();

    // const products = await Product.find()
    const apiFeatures = new APIFeatures(Product.find(), req.query).search().filter()
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
    const product = await Product.findById(req.params.id);
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

    const products = await Product.find();
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
    const product = await Product.findById(req.params.id);
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
    if (imageInputs.length > 0) {
        try {
            updateFields.images = await saveProductImages(imageInputs)
        } catch (error) {
            return res.status(400).json({ message: `Product image upload failed: ${error.message}` })
        }
    }

    let updatedProduct
    try {
        updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateFields, {
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
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    await product.deleteOne()
    await destroyProductImages(product.images)

    return res.status(200).json({
        success: true,
        message: 'Product deleted'
    })
}

exports.createProductReview = async (req, res, next) => {
    const { rating, comment, productId } = req.body;
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }
    const product = await Product.findById(productId);
    const isReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()
    )
    if (isReviewed) {
        product.reviews.forEach(review => {
            if (review.user.toString() === req.user._id.toString()) {
                review.comment = comment;
                review.rating = rating;
            }
        })
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length
    }
    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
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
    const product = await Product.findById(req.query.id);
    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
}

exports.deleteReview = async (req, res, next) => {
    console.log(req.query)
    const product = await Product.findById(req.query.productId);
    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());
    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    return res.status(200).json({
        success: true
    })
}

exports.productSales = async (req, res, next) => {
    // SELECT product.name,sum(price * quantity) as total
    // FROM order
    // GROUP BY product_id
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$itemsPrice" }

            },

        },
    ])
    // console.log(totalSales)
    const sales = await Order.aggregate([
        { $project: { _id: 0, "orderItems": 1, totalPrice: true } },
        { $unwind: "$orderItems" },

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

    let totalPercentage = {}
    totalPercentage = sales.map(item => {

        // console.log( ((item.total/totalSales[0].total) * 100).toFixed(2))
        percent = Number(((item.total / totalSales[0].total) * 100).toFixed(2))
        total = {
            name: item._id.product,
            percent
        }
        return total
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
        const products = await Product.find({ _id: { $in: ids } })

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found'
            })
        }

        const allImages = products.flatMap(product => product.images || [])
        await destroyProductImages(allImages)

        await Product.deleteMany({ _id: { $in: ids } })

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