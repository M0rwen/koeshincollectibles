import { useState, useEffect } from 'react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, getToken } from "../../Utils/helpers";
import axios from "axios";

export default function MonthlySalesChart() {
    const [sales, setSales] = useState([])
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        setError('')
        const config = {
            headers: { Authorization: `Bearer ${getToken()}` }
        }
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', `${startDate}-01`)
        if (endDate) params.append('endDate', `${endDate}-01`)
        const query = params.toString() ? `?${params.toString()}` : ''

        axios.get(`${import.meta.env.VITE_API}/admin/sales-per-month${query}`, config)
            .then(({ data }) => {
                if (active) setSales(data.salesPerMonth)
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
        <div style={{ padding: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <strong>Monthly Sales</strong>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                    From
                    <input
                        type="month"
                        value={startDate}
                        max={endDate || undefined}
                        onChange={e => setStartDate(e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                    To
                    <input
                        type="month"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={e => setEndDate(e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </label>
                {(startDate || endDate) && (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={clearFilter}
                    >
                        Clear filter
                    </button>
                )}
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {sales.length === 0 && !error ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '32px 0' }}>No sales data for the selected period.</p>
            ) : (
                <ResponsiveContainer width="90%" height={400}>
                    <LineChart data={sales} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <Line type="monotone" dataKey="total" stroke="#8884d8" />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={formatCurrency} />
                        <Tooltip formatter={formatCurrency} />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}