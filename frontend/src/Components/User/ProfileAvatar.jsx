import { useState } from 'react'

const ProfileAvatar = ({ user, imageUrl: imageUrlOverride, className = '' }) => {
    const imageUrl = imageUrlOverride ?? user?.avatar?.url
    const [failedImageUrl, setFailedImageUrl] = useState(null)

    if (imageUrl && failedImageUrl !== imageUrl) {
        return (
            <img
                className={`profile-avatar ${className}`.trim()}
                src={imageUrl}
                alt={`${user?.name || 'Your'} profile`}
                onError={() => setFailedImageUrl(imageUrl)}
            />
        )
    }

    return (
        <span className={`profile-avatar profile-avatar-fallback ${className}`.trim()} aria-hidden="true">
            {user?.name?.trim()?.charAt(0)?.toUpperCase() || 'K'}
        </span>
    )
}

export default ProfileAvatar
