const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') })

const mongoose = require('mongoose')
const Product = require('../models/product')

const products = [
    {
        name: '1980 Seattle Sounders Fire-Safety Trading Cards',
        price: 1020,
        description: 'A three-card set from the 1980 Seattle Sounders fire-safety promotion. This is a catalog preview; price, stock, and item condition are illustrative and must be verified before sale.',
        category: 'Trading Cards',
        seller: 'Koeshin Collectibles',
        stock: 3,
        images: [{ public_id: 'catalog/trading-card-collection', url: '/images/catalog/trading-card-collection.jpg' }]
    },
    {
        name: 'Vintage Red Roadster Die-Cast Model',
        price: 1590,
        description: 'A red miniature roadster from a vintage toy-car collection. This is a catalog preview; maker, price, stock, and item condition have not been verified.',
        category: 'Die-Cast Cars',
        seller: 'Koeshin Collectibles',
        stock: 2,
        images: [{ public_id: 'catalog/vintage-toy-car', url: '/images/catalog/vintage-toy-car.jpg' }]
    },
    {
        name: 'Japanese Silver Jet Tin Racer',
        price: 2610,
        description: 'A colorful silver tin friction racer with a playful cockpit figure. This is a catalog preview; price, stock, and item condition are illustrative and must be verified before sale.',
        category: 'Vintage Toys',
        seller: 'Koeshin Collectibles',
        stock: 1,
        images: [{ public_id: 'catalog/tin-silver-jet', url: '/images/catalog/tin-silver-jet.jpg' }]
    },
    {
        name: '1978 2-XL Educational Robot',
        price: 2150,
        description: 'A late-1970s talking educational robot with its distinctive question-and-answer controls. This is a catalog preview; price, stock, and item condition are illustrative and must be verified before sale.',
        category: 'Collectible Figures',
        seller: 'Koeshin Collectibles',
        stock: 1,
        images: [{ public_id: 'catalog/2xl-robot', url: '/images/catalog/2xl-robot.jpg' }]
    },
    {
        name: 'Clix De Luxe Vintage Camera',
        price: 3060,
        description: 'A compact Clix De Luxe camera with a sculptural front lens and classic black finish. This is a catalog preview; functionality, price, stock, and item condition are unverified.',
        category: 'Vintage Cameras',
        seller: 'Koeshin Collectibles',
        stock: 1,
        images: [{ public_id: 'catalog/clix-vintage-camera', url: '/images/catalog/clix-vintage-camera.jpg' }]
    },
    {
        name: '1979 Electronic Detective Board Game',
        price: 1810,
        description: 'A late-1970s electronic mystery game with its keypad, suspect panel, and original-style console. This is a catalog preview; completeness, price, stock, and item condition are unverified.',
        category: 'Tabletop Games',
        seller: 'Koeshin Collectibles',
        stock: 2,
        images: [{ public_id: 'catalog/electronic-detective-game', url: '/images/catalog/electronic-detective-game.jpg' }]
    }
]

const seedProducts = async () => {
    if (!process.env.DB_URI) {
        throw new Error('DB_URI is missing from backend/config/.env')
    }

    await mongoose.connect(process.env.DB_URI)
    let inserted = 0

    for (const product of products) {
        const { price, ...productFields } = product
        const result = await Product.updateOne(
            { name: product.name },
            { $set: { price }, $setOnInsert: productFields },
            { upsert: true }
        )
        inserted += result.upsertedCount
    }

    console.log(`Collectible catalog ready: ${inserted} added, ${products.length - inserted} already present.`)
}

seedProducts()
    .catch(error => {
        console.error(`Catalog seed failed: ${error.message}`)
        process.exitCode = 1
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect()
        }
    })