product = require("../models/product");
class APIFeatures {

    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }
    // http://localhost:2173?keyword=apple&price[]
    // http://localhost:4001/api/v1/products?page=1&keyword=apple&price[lte]=1000&price[gte]=10
    search() {
        const keyword = String(this.queryStr.keyword || '').trim().slice(0, 80)
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const searchFilter = keyword ? {
            $or: [
                { name: { $regex: escapedKeyword, $options: 'i' } },
                { category: { $regex: escapedKeyword, $options: 'i' } }
            ]
        } : {}
        this.query = this.query.find(searchFilter);
        return this;
    }

    filter() {
        // { 'price[gte]': '100', 'price[lte]': '1000' }
        const queryCopy = { ...this.queryStr };
        // console.log(queryCopy);
        // Removing fields from the query
        const removeFields = ['keyword', 'page', 'isDeleted', 'deletedAt', 'numOfReviews[gte]'];
        removeFields.forEach(el => delete queryCopy[el]);

        let priceFilter = {};
        if (queryCopy['price[gte]'] || queryCopy['price[lte]']) {
            priceFilter.price = {};
            if (queryCopy['price[gte]']) {
                priceFilter.price.$gte = Number(queryCopy['price[gte]']);
            }
            if (queryCopy['price[lte]']) {
                priceFilter.price.$lte = Number(queryCopy['price[lte]']);
            }
            delete queryCopy['price[gte]'];
            delete queryCopy['price[lte]'];
        }

        let ratingFilter = {};
        if (queryCopy['ratings[gte]'] || queryCopy['ratings[lte]']) {
            ratingFilter.ratings = {};
            if (queryCopy['ratings[gte]']) {
                ratingFilter.ratings.$gte = Number(queryCopy['ratings[gte]']);
            }
            if (queryCopy['ratings[lte]']) {
                ratingFilter.ratings.$lte = Number(queryCopy['ratings[lte]']);
            }
            delete queryCopy['ratings[gte]'];
            delete queryCopy['ratings[lte]'];
        }

        const minimumReviews = Number(this.queryStr['numOfReviews[gte]']);
        const reviewCountFilter = Number.isInteger(minimumReviews) && minimumReviews >= 0
            ? { numOfReviews: { $gte: minimumReviews } }
            : {};

        const filters = { ...queryCopy };
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === '') {
                delete filters[key];
            }
        });

        const finalFilter = { ...filters, ...priceFilter, ...ratingFilter, ...reviewCountFilter };
        this.query = this.query.find(finalFilter);
        return this;
    }

    pagination(resPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resPerPage * (currentPage - 1);

        this.query = this.query.limit(resPerPage).skip(skip);
        return this;
    }
}
module.exports = APIFeatures