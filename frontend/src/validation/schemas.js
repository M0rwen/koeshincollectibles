import * as Yup from 'yup'
import { PRODUCT_CATEGORIES } from '../constants/productCategories.js'

const contactNumberSchema = Yup.string()
    .required('Contact number is required.')
    .matches(/^\d{8,15}$/, 'Enter 8 to 15 digits only.')

const loginSchema = Yup.object({
    identifier: Yup.string()
        .trim()
        .required('Email or username is required.')
        .test(
            'email-or-username',
            'Enter a valid email address or username.',
            value => !value
                || (value.includes('@')
                    ? Yup.string().email().isValidSync(value)
                    : /^[a-zA-Z0-9_.-]{3,}$/.test(value))
        ),
    password: Yup.string().required('Password is required.')
})

const registerSchema = Yup.object({
    name: Yup.string()
        .trim()
        .max(30, 'Name must be 30 characters or fewer.')
        .required('Name is required.'),
    username: Yup.string()
        .trim()
        .min(3, 'Username must be at least 3 characters.')
        .matches(/^[a-zA-Z0-9_.-]+$/, 'Use letters, numbers, underscores, dots, or dashes only.')
        .required('Username is required.'),
    email: Yup.string()
        .trim()
        .email('Enter a valid email address.')
        .required('Email is required.'),
    contactNumber: contactNumberSchema,
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters.')
        .required('Password is required.')
})

const profileSchema = Yup.object({
    name: Yup.string()
        .trim()
        .max(30, 'Name must be 30 characters or fewer.')
        .required('Name is required.'),
    email: Yup.string()
        .trim()
        .email('Enter a valid email address.')
        .required('Email is required.'),
    contactNumber: contactNumberSchema,
    address: Yup.string()
})

const productFields = {
    name: Yup.string()
        .trim()
        .min(2, 'Product name must be at least 2 characters.')
        .max(100, 'Product name must be 100 characters or fewer.')
        .required('Product name is required.'),
    price: Yup.number()
        .typeError('Enter a valid price.')
        .moreThan(0, 'Price must be greater than zero.')
        .required('Price is required.'),
    description: Yup.string()
        .trim()
        .min(10, 'Description must be at least 10 characters.')
        .required('Description is required.'),
    category: Yup.string()
        .oneOf(PRODUCT_CATEGORIES, 'Choose a valid category.')
        .required('Category is required.'),
    stock: Yup.number()
        .typeError('Enter a valid stock quantity.')
        .integer('Stock must be a whole number.')
        .min(0, 'Stock cannot be negative.')
        .required('Stock is required.'),
    seller: Yup.string()
        .trim()
        .required('Seller name is required.')
}

const newProductSchema = Yup.object({
    ...productFields,
    images: Yup.array()
        .of(Yup.string().required())
        .min(1, 'Choose at least one product image.')
        .max(10, 'Choose no more than 10 product images.')
})

const createUpdateProductSchema = existingImageCount => Yup.object({
    ...productFields,
    images: Yup.array()
        .of(Yup.string().required())
        .max(10, 'Choose no more than 10 product images.')
        .test(
            'has-product-image',
            'Keep an existing image or choose at least one product image.',
            images => Boolean(images?.length || existingImageCount)
        )
})

const shippingSchema = Yup.object({
    address: Yup.string()
        .trim()
        .min(5, 'Address must be at least 5 characters.')
        .required('Address is required.'),
    city: Yup.string()
        .trim()
        .min(2, 'City must be at least 2 characters.')
        .required('City is required.'),
    postalCode: Yup.string()
        .trim()
        .matches(/^[A-Za-z0-9 -]{3,12}$/, 'Enter a valid postal code (3–12 letters or digits).')
        .required('Postal code is required.'),
    country: Yup.string().required('Choose a country.'),
    phoneNo: contactNumberSchema
})

export {
    loginSchema,
    registerSchema,
    profileSchema,
    newProductSchema,
    createUpdateProductSchema,
    shippingSchema
}
