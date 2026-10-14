import { useState, useEffect } from 'react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, getToken } from "../../Utils/helpers";
import axios from "axios";

export default function MonthlySalesChart() {
    const [sales, setSales] = useState([])
    useEffect(() => {
        let active = true
        const config = {
            headers: { Authorization: `Bearer ${getToken()}` }
        }

        axios.get(`${import.meta.env.VITE_API}/admin/sales-per-month`, config)
            .then(({ data }) => {
                if (active) setSales(data.salesPerMonth)
            })
            .catch(error => {
                if (active) console.error(error)
            })

        return () => { active = false }
    }, [])

    return (
        <ResponsiveContainer width="90%" height={600}>
            <LineChart width={600} height={300} data={sales} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="total" stroke="#8884d8" />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={formatCurrency} />
            </LineChart>
        </ResponsiveContainer>
    );
}