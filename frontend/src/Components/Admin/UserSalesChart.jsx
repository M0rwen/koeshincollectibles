import { useEffect, useState } from 'react'
import api from '../../Utils/api'
import Loader from '../Layout/Loader'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { formatCompactCurrency } from '../../Utils/helpers'

const barColors = ['var(--shop-green)', 'var(--shop-orange)', 'var(--shop-yellow)']

const UserSalesChart = () => {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get(`${import.meta.env.VITE_API}/admin/customer-sales`)
            .then(({ data }) => setSales(data.customerSales))
            .catch(error => setError(error.response?.data?.message || 'Failed to load customer sales.'))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="col-12 admin-sales-chart-column">
            <section className="admin-sales-chart" aria-labelledby="user-sales-title">
                <h2 id="user-sales-title" className="admin-sales-chart-title">Sales by Customer</h2>
                {loading ? <div className="admin-sales-chart-state"><Loader /></div> : error ? (
                    <p className="admin-sales-chart-empty" role="alert">{error}</p>
                ) : sales.length === 0 ? (
                    <p className="admin-sales-chart-empty">No customer sales to display yet.</p>
                ) : (
                    <div className="admin-sales-chart-plot">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sales} margin={{ top: 28, right: 16, bottom: 8, left: 12 }}>
                                <CartesianGrid vertical={false} stroke="var(--shop-line)" strokeDasharray="4 5" />
                                <XAxis
                                    dataKey="userDetails.name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--shop-muted)', fontSize: 12 }}
                                    interval={0}
                                    angle={sales.length > 4 ? -18 : 0}
                                    textAnchor={sales.length > 4 ? 'end' : 'middle'}
                                    height={sales.length > 4 ? 58 : 36}
                                />
                                <YAxis
                                    width={66}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--shop-muted)', fontSize: 12 }}
                                    tickFormatter={formatCompactCurrency}
                                />
                                <Tooltip
                                    formatter={value => `₱${Number(value).toLocaleString('en-PH')}`}
                                    contentStyle={{ backgroundColor: 'var(--shop-surface)', borderColor: 'var(--shop-line)', borderRadius: 10, color: 'var(--shop-ink)' }}
                                />
                                <Legend verticalAlign="top" height={28} />
                                <Bar dataKey="total" name="Sales" radius={[6, 6, 0, 0]} maxBarSize={56}>
                                    {sales.map((item, index) => (
                                        <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                                    ))}
                                    <LabelList
                                        dataKey="total"
                                        position="top"
                                        formatter={formatCompactCurrency}
                                        fill="var(--shop-ink)"
                                        fontSize={12}
                                        fontWeight={700}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>
        </div>
    )
}

export default UserSalesChart
