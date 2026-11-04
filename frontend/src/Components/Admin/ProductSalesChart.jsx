import { useEffect, useState } from 'react'
import api from '../../Utils/api'
import Loader from '../Layout/Loader'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const pieColors = ['var(--shop-green)', 'var(--shop-orange)', 'var(--shop-yellow)', 'var(--shop-muted)', 'var(--shop-star)']

const renderPercentageLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55
    const angle = -midAngle * Math.PI / 180
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    return (
        <text x={x} y={y} fill="var(--shop-primary-ink)" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
            {`${Math.round(percent * 100)}%`}
        </text>
    )
}

export default function ProductSalesChart() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get(`${import.meta.env.VITE_API}/admin/product-sales`)
            .then(({ data }) => setSales(data.totalPercentage))
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
                    <div className="admin-sales-chart-plot">
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
                                    label={renderPercentageLabel}
                                    labelLine={false}
                                >
                                    {sales.map((entry, index) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />)}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--shop-surface)', borderColor: 'var(--shop-line)', borderRadius: 10, color: 'var(--shop-ink)' }}
                                />
                                <Legend verticalAlign="bottom" height={32} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>
        </div>
    )
}
