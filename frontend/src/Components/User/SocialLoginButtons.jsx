import { signInWithPopup } from 'firebase/auth'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { loginWithFirebase } from '../../actions/userActions'
import { auth, facebookProvider, googleProvider } from '../../firebase'

const SocialLoginButtons = () => {
    const dispatch = useDispatch()

    const signIn = async (provider, providerName) => {
        try {
            const result = await signInWithPopup(auth, provider)
            const idToken = await result.user.getIdToken()
            dispatch(loginWithFirebase(idToken))
        } catch (error) {
            if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) return

            const message = error.code === 'auth/operation-not-allowed'
                ? `${providerName} sign-in is not enabled in Firebase yet.`
                : `${providerName} sign-in failed. Please try again.`
            toast.error(message, { position: 'bottom-right' })
        }
    }

    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        fontWeight: 500,
    }

    return (
        <div className="social-login-options">
            <div className="text-center my-3" style={{ color: '#888', fontSize: '0.85rem' }}>or</div>
            <button
                id="google_login_button"
                type="button"
                className="btn btn-block py-2"
                style={{ ...buttonStyle, border: '1px solid #dadce0', background: '#fff', color: '#3c4043' }}
                onClick={() => signIn(googleProvider, 'Google')}
            >
                Continue with Google
            </button>
            <button
                id="facebook_login_button"
                type="button"
                className="btn btn-block py-2 mt-2"
                style={{ ...buttonStyle, background: '#1877f2', color: '#fff' }}
                onClick={() => signIn(facebookProvider, 'Facebook')}
            >
                Continue with Facebook
            </button>
        </div>
    )
}

export default SocialLoginButtons
