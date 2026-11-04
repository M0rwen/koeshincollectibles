import { useEffect, useState } from 'react'
import api from '../../Utils/api'
import Loader from '../Layout/Loader'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const pieColors = [
    '#57415f', '#ad314d', '#286b49', '#344f78', '#8a4d25',
    '#246b70', '#713d54', '#52602b', '#485b65', '#7a493e',
    '#414c83', '#62502d', '#35614c', '#754b77', '#765a36'
]

const formatPeso = value => `₱${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})}`

const ProductSalesTooltip = ({ active, payload, totalPercent }) => {
    const item = payload?.[0]?.payload
    if (!active || !item) return null

    return (
        <div className="admin-product-sales-tooltip">
            <strong>{item.name}</strong>
            <span>Sales: {formatPeso(item.total)}</span>
            <span>{totalPercent ? `${(Number(item.percent) / totalPercent * 100).toFixed(1)}%` : '0.0%'}</span>
        </div>
    )
}

const ProductSalesLegend = ({ items }) => (
    <ul className="admin-product-sales-legend" aria-label="Products">
        {items.map(item => (
            <li key={item.name}>
                <span className="admin-product-sales-legend-swatch" style={{ backgroundColor: item.color }} aria-hidden="true" />
                <span>{item.name}</span>
            </li>
        ))}
    </ul>
)

const renderPercentageLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, payload, totalPercent }) => {
    const percentage = totalPercent ? Number(payload?.percent) / totalPercent * 100 : 0
    if (percentage < 5) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55
    const angle = -midAngle * Math.PI / 180
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    return (
        <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
            {`${percentage.toFixed(1)}%`}
        </text>
    )
}

export default function ProductSalesChart() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const totalPercent = sales.reduce((sum, item) => sum + Number(item.percent || 0), 0)

    useEffect(() => {
        api.get(`${import.meta.env.VITE_API}/admin/product-sales`)
            .then(({ data }) => setSales(data.totalPercentage.map(item => ({
                ...item,
                total: data.sales.find(sale => sale._id.product === item.name)?.total || 0
            }))))
            .catch(error => setError(error.response?.data?.message || 'Failed to load product sales.'))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="col-12 admin-sales-chart-column">
            <section className="admin-sales-chart" aria-labelledby="product-sales-title">
                <h2 id="product-sales-title" className="admin-sales-chart-title">Sales by Product</h2>
                {loading ? <div className="admin-sales-chart-state"><Loader /></div> : error ? (
                    <p className="admin-sales-chart-empty" role="alert">{error}</p>
                ) : sales.length === 0 ? (
                    <p className="admin-sales-chart-empty">No product sales to display yet.</p>
                ) : (
                    <div className="admin-product-sales-visual">
                        <div className="admin-product-sales-plot">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 8, right: 14, bottom: 8, left: 14 }}>
                                    <Pie
                                        dataKey="percent"
                                        nameKey="name"
                                        data={sales}
                                        cx="50%"
                                        cy="46%"
                                        innerRadius="42%"
                                        outerRadius="66%"
                                        paddingAngle={sales.length > 1 ? 3 : 0}
                                        label={props => renderPercentageLabel({ ...props, totalPercent })}
                                        labelLine={false}
                                    >
                                        {sales.map((entry, index) => <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />)}
                                    </Pie>
                                    <Tooltip content={<ProductSalesTooltip totalPercent={totalPercent} />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <ProductSalesLegend items={sales.map((item, index) => ({
                            name: item.name,
                            color: pieColors[index % pieColors.length]
                        }))} />
                    </div>
                )}
            </section>
        </div>
    )
}
