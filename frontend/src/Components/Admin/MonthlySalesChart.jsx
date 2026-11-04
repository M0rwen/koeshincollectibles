import { useState, useEffect } from 'react'
import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactCurrency, formatCurrency, getToken } from '../../Utils/helpers'
import api from "../../Utils/api";

export default function MonthlySalesChart() {
    const [sales, setSales] = useState([])
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        const config = {
            headers: { Authorization: `Bearer ${getToken()}` }
        }
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', `${startDate}-01`)
        if (endDate) params.append('endDate', `${endDate}-01`)
        const query = params.toString() ? `?${params.toString()}` : ''

        api.get(`${import.meta.env.VITE_API}/admin/sales-per-month${query}`, config)
            .then(({ data }) => {
                if (active) {
                    setError('')
                    setSales(data.salesPerMonth)
                }
            })
            .catch(err => {
                if (active) setError(err.response?.data?.message || 'Failed to load chart data.')
            })

        return () => { active = false }
    }, [startDate, endDate])

    const clearFilter = () => {
        setStartDate('')
        setEndDate('')
    }

    return (
        <div className="col-12 admin-sales-chart-column">
            <section className="admin-sales-chart" aria-labelledby="monthly-sales-title">
                <div className="admin-sales-chart-toolbar">
                    <strong id="monthly-sales-title" className="admin-sales-chart-title">Monthly Sales</strong>
                    <label className="admin-sales-filter">
                        From
                        <input
                            type="month"
                            value={startDate}
                            max={endDate || undefined}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </label>
                    <label className="admin-sales-filter">
                        To
                        <input
                            type="month"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </label>
                    {(startDate || endDate) && (
                        <button type="button" className="admin-sales-clear-filter" onClick={clearFilter}>
                            Clear filter
                        </button>
                    )}
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                {sales.length === 0 && !error ? (
                    <p className="admin-sales-chart-empty">No sales data for the selected period.</p>
                ) : (
                    <>
                        <div className="admin-sales-chart-plot">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sales} margin={{ top: 30, right: 18, bottom: 8, left: 14 }}>
                                    <defs>
                                        <linearGradient id="monthly-sales-gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--shop-green)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--shop-green)" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="var(--shop-line)" strokeDasharray="4 5" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--shop-muted)', fontSize: 12 }} />
                                    <YAxis
                                        width={66}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--shop-muted)', fontSize: 12 }}
                                        tickFormatter={formatCompactCurrency}
                                    />
                                    <Tooltip
                                        formatter={value => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'var(--shop-surface)', borderColor: 'var(--shop-line)', borderRadius: 10, color: 'var(--shop-ink)' }}
                                        labelStyle={{ color: 'var(--shop-ink)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="var(--shop-green)"
                                        strokeWidth={3}
                                        fill="url(#monthly-sales-gradient)"
                                        dot={{ r: 5, fill: 'var(--shop-surface)', stroke: 'var(--shop-green)', strokeWidth: 3 }}
                                        activeDot={{ r: 7, fill: 'var(--shop-orange)', stroke: 'var(--shop-surface)', strokeWidth: 2 }}
                                    >
                                        <LabelList
                                            dataKey="total"
                                            position="top"
                                            formatter={formatCompactCurrency}
                                            fill="var(--shop-ink)"
                                            fontSize={12}
                                            fontWeight={700}
                                        />
                                    </Area>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {sales.length === 1 && <p className="admin-sales-chart-note">More months will appear as sales come in.</p>}
                    </>
                )}
            </section>
        </div>
    )
}