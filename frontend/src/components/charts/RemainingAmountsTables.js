import React, { useEffect, useState } from 'react';
import '../../styles/main.css';

const RemainingAmountsTables = () => {
    const [customerData, setCustomerData] = useState([]);
    const [workReasonTotals, setWorkReasonTotals] = useState([]);

    useEffect(() => {
        fetch('/api/customers/remaining')
            .then(res => res.json())
            .then(data => {
                setCustomerData(data.customers || []);
                setWorkReasonTotals(data.workReasonTotals || []);
            })
            .catch(err => console.error('Error fetching data:', err));
    }, []);

    return (
        <div className="remaining-tables">
            <h2>Customers Remaining Amount</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Number</th>
                        <th>Work Reason</th>
                        <th>Remaining Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {customerData.map((c, idx) => (
                        <tr key={idx}>
                            <td>{c.name}</td>
                            <td>{c.number}</td>
                            <td>{c.work_reason}</td>
                            <td>{c.remaining_amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2>Work Reason Remaining Totals</h2>
            <table>
                <thead>
                    <tr>
                        <th>Work Reason</th>
                        <th>Total Remaining Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {workReasonTotals.map((w, idx) => (
                        <tr key={idx}>
                            <td>{w.work_reason}</td>
                            <td>{w.total_remaining}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RemainingAmountsTables;