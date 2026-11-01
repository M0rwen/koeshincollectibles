const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') })

const mongoose = require('mongoose')
const cloudinary = require('cloudinary')
const Product = require('../models/product')

const products = [
    {
        name: 'Marvel Legends Series Iron Man',
        imageUrl: 'https://cdn.media.amplience.net/i/hasbropulse/G0821_5.png?w=1004&fmt=auto',
        price: 2450,
        description: 'This Marvel Legends Series figure brings Iron Man to life in his classic armored look. Its poseable design makes it a striking centerpiece for a Marvel display.',
        category: 'Marvel Figurines',
        seller: "Koeshin's Collectibles",
        stock: 3
    },
    {
        name: 'Marvel Legends Series X-Men ’97 Wolverine',
        imageUrl: 'https://m.media-amazon.com/images/I/617RSdsobqL._AC_SX679_.jpg',
        price: 2180,
        description: 'Wolverine arrives in his animated X-Men ’97 costume as part of the Marvel Legends Series. Display him alongside the rest of the team or let the adamantium-clawed mutant headline a shelf.',
        category: 'Marvel Figurines',
        seller: "Koeshin's Collectibles",
        stock: 2
    },
    {
        name: 'Marvel Select Captain America',
        imageUrl: 'https://images.bigbadtoystore.com/images/product/122955/d4bde9a4-63b9-4835-b9f3-a0cea39826c0/original.jpg',
        price: 3290,
        description: 'The Marvel Select Captain America figure captures the hero with his unmistakable shield and uniform. A detailed sculpt and confident stance make it a bold addition to a Marvel collection.',
        category: 'Marvel Figurines',
        seller: "Koeshin's Collectibles",
        stock: 1
    },
    {
        name: 'Magic: The Gathering — Bloomburrow Play Booster Box',
        imageUrl: 'https://images.ctfassets.net/s5n2t79q9icq/2yc6b38ItLaZlTNU06Al5J/2b9db80e948342683efe3f7269d80614/xhzkUIgc7_Play_EN.png?fm=webp',
        price: 7950,
        description: 'Bloomburrow takes players to a world populated by brave little animalfolk. This Play Booster Box is made for drafting, deck-building, or discovering memorable cards from the set.',
        category: 'Magic: The Gathering Cards',
        seller: "Koeshin's Collectibles",
        stock: 2
    },
    {
        name: 'Magic: The Gathering — Modern Horizons 3 Collector Booster',
        imageUrl: 'https://media.wizards.com/2024/images/daily/en_jhpBKHHkxxXH.png',
        price: 1850,
        description: 'Modern Horizons 3 brings powerful cards and fan-favorite characters to the Modern format. This Collector Booster is a premium pack for players and collectors hunting special treatments.',
        category: 'Magic: The Gathering Cards',
        seller: "Koeshin's Collectibles",
        stock: 6
    },
    {
        name: 'Magic: The Gathering — Commander Masters Set Booster Box',
        imageUrl: 'https://media.wizards.com/2023/images/daily/en_t1UnJeGrSmzp.png',
        price: 11900,
        description: 'Commander Masters celebrates the multiplayer format with cards drawn from across Magic’s history. The Set Booster Box offers a collectible opening experience built around Commander favorites.',
        category: 'Magic: The Gathering Cards',
        seller: "Koeshin's Collectibles",
        stock: 1
    },
    {
        name: 'RG 1/144 RX-78-2 Gundam Ver. 2.0',
        imageUrl: 'https://static.wikia.nocookie.net/gunplabuilders/images/f/fa/RG-RX-78-2-Gundam-%282.0%29-box.jpg/revision/latest/scale-to-width-down/1000?cb=20240605095743',
        price: 2480,
        description: 'This Real Grade RX-78-2 updates the classic mobile suit with refined proportions and intricate construction. Its compact 1/144 scale packs in the mechanical detail Gunpla builders love.',
        category: 'Gundam',
        seller: "Koeshin's Collectibles",
        stock: 3
    },
    {
        name: 'HG 1/144 Gundam Aerial',
        imageUrl: 'https://neboy.com.ph/cdn/shop/files/HGAERIALREBUILD01.jpg?v=1744345111&width=990',
        price: 1190,
        description: 'Build the protagonist mobile suit from Mobile Suit Gundam: The Witch from Mercury in approachable High Grade form. Gund-Bit details and a clean silhouette make Aerial a standout build or display piece.',
        category: 'Gundam',
        seller: "Koeshin's Collectibles",
        stock: 4
    },
    {
        name: 'MG 1/100 Zeta Gundam Ver.Ka',
        imageUrl: 'https://mechaalliance.com/wp-content/uploads/2023/06/IMG_4077.jpg',
        price: 4680,
        description: 'The Master Grade Zeta Gundam Ver.Ka is a detailed build inspired by its classic Universal Century design. Its transformation feature and layered mechanical frame reward experienced Gunpla builders.',
        category: 'Gundam',
        seller: "Koeshin's Collectibles",
        stock: 2
    },
    {
        name: 'Fantastic Four #1 Facsimile Edition',
        imageUrl: 'https://images.penguinrandomhouse.com/cover/75960621066400111',
        price: 620,
        description: 'This facsimile edition revisits the first appearance of Marvel’s original super-team. It is an accessible way to add a foundational Fantastic Four issue to a comics shelf.',
        category: 'Marvel Comics',
        seller: "Koeshin's Collectibles",
        stock: 5
    },
    {
        name: 'X-Men #1 (1991) Facsimile Edition',
        imageUrl: 'https://unknowncomicbooks.com/cdn/shop/files/foilXMEN2024010_DC19large_403040bd-ff19-4327-a09b-e577857905bb.jpg?v=1762406810&width=700',
        price: 590,
        description: 'Revisit the celebrated 1991 X-Men launch with this facsimile edition of the original issue. The team-focused cover and oversized-era presentation make it a recognizable piece of comic-book history.',
        category: 'Marvel Comics',
        seller: "Koeshin's Collectibles",
        stock: 4
    },
    {
        name: 'What If: Thor Vol 11',
        imageUrl: 'https://static.wikia.nocookie.net/marveldatabase/images/e/e7/What_If_Thor_Vol_1_1.jpg/revision/latest/scale-to-width-down/1000?cb=20180112224619',
        price: 650,
        description: 'This facsimile edition revisits the story asking what would happen if Jane Foster found the hammer of Thor. It offers collectors a display-friendly way to revisit a memorable alternate Marvel tale.',
        category: 'Marvel Comics',
        seller: "Koeshin's Collectibles",
        stock: 3
    },
    {
        name: 'Hot Wheels ’55 Chevy Bel Air Gasser — Boulevard',
        imageUrl: 'https://m.media-amazon.com/images/I/71tumb5MkqL._AC_SX450_.jpg',
        price: 1180,
        description: 'The ’55 Chevy Bel Air Gasser brings classic drag-racing attitude to Hot Wheels’ Boulevard line. Its lifted stance and bold paint make this die-cast a favorite among car-culture displays.',
        category: 'Hot Wheels',
        seller: "Koeshin's Collectibles",
        stock: 3
    },
    {
        name: 'Hot Wheels 1993 Ford Mustang Cobra R — Red Line Club',
        imageUrl: 'https://scontent.fmnl13-5.fna.fbcdn.net/v/t39.30808-6/553758705_1179118954029545_7653491409172467835_n.webp?stp=dst-jpg_tt6&cstp=mx1600x1600&ctp=s1600x1600&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHibfgRLgubaMi3iYTFsNmKuyfR0t7iUfK7J9HS3uJR8pS0wce6zrdk1ekmNxo35kqr1EL3AVPf0TjEGSu0X8X4&_nc_ohc=EBYcKgH_PP8Q7kNvwEMR6sp&_nc_oc=AdpIY_XZkRi9MsVIr670ra7LD-8tMBMM0gAqySShWhOGUyW13oI0GERFp7jJ8PwLZcZkp9pAKmra6sAJJFIF8qOq&_nc_zt=23&_nc_ht=scontent.fmnl13-5.fna&_nc_gid=xGoAOcSzFepRtZPhtCDAVg&_nc_ss=7b2a8&oh=00_AQRFbqZKklCrXx6xywRneSIT6KQh0ekqaUGPLVc40tqVmg&oe=6AECF730',
        price: 2890,
        description: 'This Red Line Club release celebrates the Fox-body-era Mustang Cobra R with a collector-focused finish. The sharp profile and racing details give it a distinctive place in a Hot Wheels lineup.',
        category: 'Hot Wheels',
        seller: "Koeshin's Collectibles",
        stock: 1
    },
    {
        name: 'Hot Wheels ’67 Chevy C10 — Super Treasure Hunt',
        imageUrl: 'https://i.ytimg.com/vi/1FNhLzjkwOI/maxresdefault.jpg',
        price: 2350,
        description: 'The ’67 Chevy C10 turns a classic pickup into a sought-after Super Treasure Hunt casting. Its special finish and unmistakable truck shape make it a fun centerpiece for a Hot Wheels collection.',
        category: 'Hot Wheels',
        seller: "Koeshin's Collectibles",
        stock: 2
    }
]

const fallbackImage = { public_id: 'placeholder:mascot', url: '/images/logo.png' }

const imagePublicId = productName => productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const getProductImage = async (product, upload = (...args) => cloudinary.v2.uploader.upload(...args)) => {
    const imageUrl = product.imageUrl?.trim()
    if (!imageUrl) {
        console.error(`Product image missing for "${product.name}"; using the mascot placeholder.`)
        return [fallbackImage]
    }

    try {
        const result = await upload(imageUrl, {
            folder: 'products',
            public_id: imagePublicId(product.name),
            overwrite: true
        })
        if (!result.public_id || !result.secure_url) {
            throw new Error('Cloudinary did not return a public_id and secure_url')
        }
        return [{ public_id: result.public_id, url: result.secure_url }]
    } catch (error) {
        console.error(`Product image upload failed for "${product.name}"; using the mascot placeholder: ${error.message || String(error)}`)
        return [fallbackImage]
    }
}

const seedProducts = async () => {
    if (!process.env.DB_URI) {
        throw new Error('DB_URI is missing from backend/config/.env')
    }

    await mongoose.connect(process.env.DB_URI)
    cloudinary.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    })

    let inserted = 0

    for (const product of products) {
        const { imageUrl, price, category, ...productFields } = product
        const images = await getProductImage(product)
        const result = await Product.updateOne(
            { name: product.name },
            { $set: { price, images, category }, $setOnInsert: productFields },
            { upsert: true }
        )
        inserted += result.upsertedCount
    }

    console.log(`Collectible catalog ready: ${inserted} added, ${products.length - inserted} already present.`)
}

if (require.main === module) {
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
}

module.exports = { products, getProductImage }
