import { useEffect, useState } from 'react'

const MASCOT_IMAGE = '/images/logo.png'
const MEDIA_CANDIDATES = [
    { source: '/images/login-art.webm', type: 'video' },
    { source: '/images/login-art.mp4', type: 'video' },
    { source: '/images/login-art.webp', type: 'image' },
    { source: '/images/login-art.gif', type: 'image' },
    { source: '/images/login-art.png', type: 'image' }
]

const AuthLayout = ({ children, eyebrow, title, description }) => {
    const [artMedia, setArtMedia] = useState({ source: '/images/login-art.png', type: 'image' })
    const handleMediaError = () => setArtMedia(current => {
        if (current.source === MASCOT_IMAGE) return current
        const currentIndex = MEDIA_CANDIDATES.findIndex(candidate => candidate.source === current.source)
        return MEDIA_CANDIDATES[currentIndex + 1] || { source: MASCOT_IMAGE, type: 'image' }
    })

    useEffect(() => {
        let isCurrent = true
        const findArtMedia = async () => {
            for (const candidate of MEDIA_CANDIDATES) {
                try {
                    const response = await fetch(candidate.source, { method: 'HEAD' })
                    const contentType = response.headers.get('content-type') || ''
                    if (response.ok && !contentType.includes('text/html')) {
                        if (isCurrent) setArtMedia(candidate)
                        return
                    }
                } catch {
                    continue
                }
            }
            if (isCurrent) setArtMedia({ source: MASCOT_IMAGE, type: 'image' })
        }

        void findArtMedia()
        return () => {
            isCurrent = false
        }
    }, [])

    return (
        <main className="auth-page">
            <section className="auth-shell" aria-label={title}>
                <aside className="auth-art-panel">
                    {artMedia.type === 'video' ? (
                        <video
                            className="auth-art-image"
                            src={artMedia.source}
                            autoPlay
                            muted
                            loop
                            playsInline
                            aria-hidden="true"
                            onError={handleMediaError}
                        />
                    ) : (
                        <img
                            className="auth-art-image"
                            src={artMedia.source}
                            alt=""
                            onError={handleMediaError}
                        />
                    )}
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
