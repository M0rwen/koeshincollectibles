import  {  useState, useEffect } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import MetaData from '../Layout/MetaData'
import { toast } from 'react-toastify';
import api from '../../Utils/api'
import { storeAuthToken } from '../../Utils/authToken'
import { useDispatch } from 'react-redux'
import { loadUser } from '../../actions/userActions'

const NewPassword = () => {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    let navigate = useNavigate();
    const dispatch = useDispatch()
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    let { token } = useParams();

    const resetPassword = async (token, passwords) => {
        try {
            const { data } = await api.put(`${import.meta.env.VITE_API}/password/reset/${token}`, passwords)
            storeAuthToken(data.token)
            await dispatch(loadUser())
            setSuccess(data.success)
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'Password reset failed.')
        }
    }
    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });
        }
        if (success) {
            toast.success('password updated', {
                position: 'bottom-right'
            });
            navigate('/')
        }

    }, [error, navigate, success])

    const submitHandler = (e) => {
        e.preventDefault();
        resetPassword(token, { password, confirmPassword })
    }

    return (
        <>
            <MetaData title={'New Password Reset'} />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler}>
                        <h1 className="mb-3">New Password</h1>

                        <div className="form-group">
                            <label htmlFor="password_field">Password</label>
                            <input
                                type="password"
                                id="password_field"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm_password_field">Confirm Password</label>
                            <input
                                type="password"
                                id="confirm_password_field"
                                className="form-control"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button
                            id="new_password_button"
                            type="submit"
                            className="btn btn-block py-3">
                            Set Password
                        </button>

                    </form>
                </div>
            </div>

        </>
    )
}

export default NewPassword