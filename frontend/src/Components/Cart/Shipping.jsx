import { useFormik } from 'formik'
import { useNavigate } from 'react-router-dom'
import { countries } from 'countries-list'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { useDispatch, useSelector } from 'react-redux'
import { saveShippingInfo } from '../../actions/cartActions'
import { shippingSchema } from '../../validation/schemas'

const Shipping = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { shippingInfo } = useSelector(state => state.cart)
    const countriesList = Object.values(countries)
    const formik = useFormik({
        initialValues: {
            address: shippingInfo.address || '',
            city: shippingInfo.city || '',
            phoneNo: shippingInfo.phoneNo || '',
            postalCode: shippingInfo.postalCode || '',
            country: shippingInfo.country || ''
        },
        validationSchema: shippingSchema,
        validateOnMount: true,
        onSubmit: async values => {
            dispatch(saveShippingInfo(values))
            navigate('/confirm')
        }
    })

    const showError = field => formik.touched[field] && formik.errors[field]

    return (
        <>
            <MetaData title="Shipping Info" />
            <CheckoutSteps shipping />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={formik.handleSubmit} noValidate>
                        <h1 className="mb-4">Shipping Info</h1>

                        <div className="form-group">
                            <label htmlFor="address_field">Address</label>
                            <input
                                type="text"
                                id="address_field"
                                name="address"
                                className="form-control"
                                autoComplete="street-address"
                                value={formik.values.address}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(showError('address'))}
                                aria-describedby={showError('address') ? 'address_error' : undefined}
                            />
                            {showError('address') && <div className="field-error" id="address_error" role="alert">{formik.errors.address}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="city_field">City</label>
                            <input
                                type="text"
                                id="city_field"
                                name="city"
                                className="form-control"
                                autoComplete="address-level2"
                                value={formik.values.city}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(showError('city'))}
                                aria-describedby={showError('city') ? 'city_error' : undefined}
                            />
                            {showError('city') && <div className="field-error" id="city_error" role="alert">{formik.errors.city}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_field">Phone No</label>
                            <input
                                type="tel"
                                id="phone_field"
                                name="phoneNo"
                                className="form-control"
                                autoComplete="tel"
                                inputMode="numeric"
                                value={formik.values.phoneNo}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(showError('phoneNo'))}
                                aria-describedby={showError('phoneNo') ? 'phone_error' : undefined}
                            />
                            {showError('phoneNo') && <div className="field-error" id="phone_error" role="alert">{formik.errors.phoneNo}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="postal_code_field">Postal Code</label>
                            <input
                                type="text"
                                id="postal_code_field"
                                name="postalCode"
                                className="form-control"
                                autoComplete="postal-code"
                                value={formik.values.postalCode}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(showError('postalCode'))}
                                aria-describedby={showError('postalCode') ? 'postal_error' : undefined}
                            />
                            {showError('postalCode') && <div className="field-error" id="postal_error" role="alert">{formik.errors.postalCode}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="country_field">Country</label>
                            <select
                                id="country_field"
                                name="country"
                                className="form-control"
                                value={formik.values.country}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={Boolean(showError('country'))}
                                aria-describedby={showError('country') ? 'country_error' : undefined}
                            >
                                <option value="">Select country</option>
                                {countriesList.map(country => (
                                    <option key={country.name} value={country.name}>{country.name}</option>
                                ))}
                            </select>
                            {showError('country') && <div className="field-error" id="country_error" role="alert">{formik.errors.country}</div>}
                        </div>

                        <button
                            id="shipping_btn"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={!formik.isValid || formik.isSubmitting}
                        >
                            {formik.isSubmitting ? 'Saving…' : 'CONTINUE'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Shipping
