import { useState } from 'react'

const MASCOT_IMAGE = '/images/logo.png'

const AuthLayout = ({ children, eyebrow, title, description }) => {
    const [imageSource, setImageSource] = useState('/images/login-art.jpg')

    return (
        <main className="auth-page">
            <section className="auth-shell" aria-label={title}>
                <aside className="auth-art-panel">
                    <img
                        className="auth-art-image"
                        src={imageSource}
                        alt=""
                        onError={() => setImageSource(current => (
                            current === MASCOT_IMAGE ? current : MASCOT_IMAGE
                        ))}
                    />
                    <div className="auth-art-copy">
                        <p>{eyebrow}</p>
                        <h1>Good things keep finding us.</h1>
                        <span>{description}</span>
                    </div>
                </aside>
                <div className="auth-form-panel">
                    <p className="auth-form-eyebrow">{eyebrow}</p>
                    <h2>{title}</h2>
                    {children}
                </div>
            </section>
        </main>
    )
}

export default AuthLayout
