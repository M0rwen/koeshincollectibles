const dotenv = require('dotenv');
dotenv.config({ path: './config/.env' })

if (!process.env.JWT_SECRET?.trim()) {
    console.error('Missing required environment variable: JWT_SECRET')
    process.exit(1)
}

const app = require('./app');
const connectDatabase = require('./config/database')
const cloudinary = require('cloudinary');

process.env.JWT_EXPIRES_TIME = process.env.JWT_EXPIRES_TIME || '7d';
process.env.COOKIE_EXPIRES_TIME = process.env.COOKIE_EXPIRES_TIME || '1';

connectDatabase();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

app.listen(process.env.PORT, () => {
    console.log(`server started on port:' ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
});