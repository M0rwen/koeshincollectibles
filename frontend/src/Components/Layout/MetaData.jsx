import { Helmet } from 'react-helmet'

const MetaData = ({ title }) => {
    return (
        <Helmet>
            <title>{`${title} | Koeshin Collectibles`}</title>
        </Helmet>
    )
}

export default MetaData