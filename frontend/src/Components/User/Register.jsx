import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import axios from 'axios'


const Register = () => {

    const [user, setUser] = useState({
        name: '',
        username: '',
        email: '',
        contactNumber: '',
        password: '',
    })

    const { name, username, email, contactNumber, password } = user;

    const [avatar, setAvatar] = useState('')
    const [avatarPreview, setAvatarPreview] = useState('/images/default_avatar.jpg')

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)


    let navigate = useNavigate()
    // useEffect(() => {
    //     if (isAuthenticated) {
    //         navigate('/')
    //     }

    //     if (error) {
    //         console.log(error)
    //         dispatch(clearErrors());

    //     }

    // }, [error, navigate, isAuthenticated])

    const submitHandler = (e) => {
        e.preventDefault();

        if (!name || !username || !email || !contactNumber || !password) {
            setError('Please complete all required fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        const formData = new FormData();
        formData.set('name', name);
        formData.set('username', username);
        formData.set('email', email);
        formData.set('contactNumber', contactNumber);
        formData.set('password', password);
        formData.set('avatar', avatar);

        register(formData)
    }

    const onChange = e => {
        if (e.target.name === 'avatar') {

            const reader = new FileReader();

            reader.onload = () => {
                if (reader.readyState === 2) {
                    setAvatarPreview(reader.result)
                    setAvatar(reader.result)
                }
            }

            reader.readAsDataURL(e.target.files[0])

        } else {
            setUser({ ...user, [e.target.name]: e.target.value })
        }
    }

    const register = async (userData) => {
        console.log(userData)
        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }

            const { data } = await axios.post(`http://localhost:4001/api/v1/register`, userData, config)
            console.log(data.user)

            setLoading(false)
            setUser(data.user)
            navigate('/')

        } catch (error) {
            setLoading(false)
            setUser(null)
            setError(error.response.data.message)
            console.log(error.response.data.message)
        }
    }




    return (
        <>

            <MetaData title={'Register User'} />

            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler} encType='multipart/form-data'>
                        <h1 className="mb-3">Register</h1>

                        {error && (
                            <div className="alert alert-danger" role="alert">{error}</div>
                        )}

                        <div className="form-group">
                            <label htmlFor="name_field">Name</label>
                            <input
                                type="text"
                                id="name_field"
                                className="form-control"
                                name='name'
                                value={name}
                                onChange={onChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="username_field">Username</label>
                            <input
                                type="text"
                                id="username_field"
                                className="form-control"
                                name='username'
                                value={username}
                                onChange={onChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email_field">Email</label>
                            <input
                                type="email"
                                id="email_field"
                                className="form-control"
                                name='email'
                                value={email}
                                onChange={onChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact_field">Contact Number</label>
                            <input
                                type="tel"
                                id="contact_field"
                                className="form-control"
                                name='contactNumber'
                                value={contactNumber}
                                onChange={onChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password_field">Password</label>
                            <input
                                type="password"
                                id="password_field"
                                className="form-control"
                                name='password'
                                value={password}
                                minLength={6}
                                onChange={onChange}
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label htmlFor='avatar_upload'>Avatar</label>
                            <div className='d-flex align-items-center'>
                                <div>
                                    <figure className='avatar mr-3 item-rtl'>
                                        <img
                                            src={avatarPreview}
                                            className='rounded-circle'
                                            alt='Avatar Preview'
                                        />
                                    </figure>
                                </div>
                                <div className='custom-file'>
                                    <input
                                        type='file'
                                        name='avatar'
                                        className='custom-file-input'
                                        id='customFile'
                                        accept="images/*"
                                        onChange={onChange}
                                    />
                                    <label className='custom-file-label' htmlFor='customFile'>
                                        Choose Avatar
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button
                            id="register_button"
                            type="submit"
                            className="btn btn-block py-3"
                        // disabled={loading ? false : true}
                        >
                            REGISTER
                        </button>
                    </form>
                </div>
            </div>

        </>
    )
}

export default Register