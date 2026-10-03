import React, {useState, useEffect, useMemo, useRef, useCallback} from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts'
import { amortization } from './Amortization.js'
import { List } from 'react-window'

export default function LoanScope() {
  const [principal, setPrincipal] = useState(250000)
  const [interestRate, setInterestRate] = useState(6.5)
  const [monthlyPayment, setMonthlyPayment] = useState(1600)
  const [showInterest, setShowInterest] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState('All')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const debounceTimer = useRef(null)

  // Parse URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const principalParam = parseFloat(params.get('principal'))
    const interestRateParam = parseFloat(params.get('interestRate'))
    const monthlyPaymentParam = parseFloat(params.get('monthlyPayment'))

    if (principalParam >= 1 && principalParam <= 100000000) setPrincipal(principalParam)
    if (interestRateParam >= 0 && interestRateParam <= 40) setInterestRate(interestRateParam)
    if (monthlyPaymentParam >= 1) setMonthlyPayment(monthlyPaymentParam)
  }, [])

  // Recalculate amortization schedule whenever inputs change
  
    const runAmortization = useCallback((p, r, m) => {
    const minMonthlyPayment = (p * (r / 100)) / 12
    if (m < minMonthlyPayment) {
      setError(`Payment must exceed monthly interest of $${minMonthlyPayment.toFixed(2)} to pay off the loan.`)
      setData(null)
      return
    }
    setError(null)
    // Fetch amortization schedule from backend
    fetch('http://localhost:3001/Amortization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principal, interestRate, monthlyPayment })
    })
    .then(res => res.json())
    .then(res => res.error ? setError(res.error) : setData(res))
    .catch(() => setData(amortization(principal, interestRate, monthlyPayment)))
  }, [principal, interestRate, monthlyPayment])

  useEffect(() => {
    runAmortization(principal, interestRate, monthlyPayment)
  }, [runAmortization, principal, interestRate, monthlyPayment])

  const handleSliderChange = (setter, val, paramName) => {
    setter(val)
    const p = paramName === 'p' ? val : principal
    const r = paramName === 'r' ? val : interestRate
    const m = paramName === 'm' ? val : monthlyPayment
    runAmortization(p, r, m)
  }
  
  const handleNumericChange = (setter, val, paramName) => {
    setter(val)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      const p = paramName === 'p' ? val : principal
      const r = paramName === 'r' ? val : interestRate
      const m = paramName === 'm' ? val : monthlyPayment
      runAmortization(p, r, m)
    }, 300)
  }
  const handleShare = () => {
    const url = `${window.location.origin}?principal=${principal}&interestRate=${interestRate}&monthlyPayment=${monthlyPayment}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const exportCSV = () => {
    if (!data?.schedule) return
    const headers = ['Month', 'Payment', 'Principal Paid', 'Interest Paid', 'Remaining Balance', 'Cumulative Interest', 'Cumulative Principal']
    const rows = data.schedule.map(r =>
      [r.month, r.payment.toFixed(2), r.principalPaid.toFixed(2), r.interestPaid.toFixed(2), r.remainingBalance.toFixed(2), r.cumulativeInterest.toFixed(2), r.cumulativePrincipal.toFixed(2)]).join("\n")
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'amortization_schedule.csv'
    link.click()
  }

  const filteredSchedule = useMemo(() => {
    if (!data?.schedule) return []
    if (selectedYear === 'All') return data.schedule
    const yr = parseInt(selectedYear, 10)
    return data.schedule.filter(s => Math.ceil(s.month / 12) === yr)
  }, [data, selectedYear])

  const totalYears = data?.schedule ? Math.ceil((data.termMonths || data.schedule.length) / 12) : 0
  const paymentMax = Math.max(1000000, ((principal * (interestRate / 100)) / 12) * 3)

  const Row = ({ index, style }) => {
    const row = filteredSchedule[index]
    return (
      <div
        style={{
          ...style,
          display: 'grid',
          gridTemplateColumns: '70px 1fr 1fr 1fr 1fr',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
          padding: '0 8px',
          boxSizing: 'border-box',
          backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb',
          textAlign: 'right',
          fontSize: '0.9rem'
        }}
      >
        <span style={{ textAlign: 'left' }}>{row.month}</span>
        <span>${row.payment.toFixed(2)}</span>
        <span>${row.principalPaid.toFixed(2)}</span>
        <span>${row.interestPaid.toFixed(2)}</span>
        <span>${row.remainingBalance.toFixed(2)}</span>
      </div>
    )
  }

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>LoanScope</h1>
        <button onClick={handleShare}>{copied ? 'Copied Link!' : 'Share Scenario'}</button>
      </header>

      {/* Inputs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', margin: '1.5rem 0' }}>
        <div>
          <label>Principal ($): </label>
          <input type="number" min="1" max="100000000" value={principal} onChange={e => handleNumericChange(setPrincipal, Number(e.target.value), 'p')} />
          <input type="range" min="1" max="100000000" value={principal} onChange={e => handleSliderChange(setPrincipal, Number(e.target.value), 'p')} style={{ width: '100%' }} />
        </div>
        <div>
          <label>Interest Rate (%): </label>
          <input type="number" step="0.01" min="0" max="40" value={interestRate} onChange={e => handleNumericChange(setInterestRate, Number(e.target.value), 'r')} />
          <input type="range" step="0.01" min="0" max="40" value={interestRate} onChange={e => handleSliderChange(setInterestRate, Number(e.target.value), 'r')} style={{ width: '100%' }} />
        </div>
        <div>
          <label>Monthly Payment ($): </label>
          <input type="number" min="1" max={paymentMax} value={monthlyPayment} onChange={e => handleNumericChange(setMonthlyPayment, Number(e.target.value), 'm')} />
          <input type="range" min="1" max={Math.min(paymentMax, 25000)} value={monthlyPayment} onChange={e => handleSliderChange(setMonthlyPayment, Number(e.target.value), 'm')} style={{ width: '100%' }} />
        </div>
      </section>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      {/* Summary KPI Cards */}
      {data && (
        <section style={{ display: 'flex', gap: '2rem', background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
          <div><strong>Payoff Date:</strong> <div>{data.payoffDate}</div></div>
          <div><strong>Loan Term:</strong> <div>{data.termYears}y {data.termRemainingMonths}m</div></div>
          <div><strong>Total Interest:</strong> <div>${data.totalInterest.toLocaleString()}</div></div>
        </section>
      )}

      {/* Visualization */}
      {data && (
        <section style={{ height: '350px', marginTop: '2rem' }}>
          <label>
            <input type="checkbox" checked={showInterest} onChange={e => setShowInterest(e.target.checked)} />
            Overlay Cumulative Interest
          </label>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.schedule}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="remainingBalance" stroke="#2563eb" dot={false} name="Balance ($)" />
              {showInterest && <Line type="monotone" dataKey="cumulativeInterest" stroke="#dc2626" dot={false} name="Interest Paid ($)" />}
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Actions & Schedule Table */}
      {data && (
        <section style={{ marginTop: '2rem' }}>
          <button onClick={exportCSV}>Export CSV</button>
        </section>
      )}
      {/* Expandable Virtualized Schedule Panel*/}
      {data?.schedule && (
        <section style={{ marginTop: '2.5rem', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            onClick={() => setIsScheduleOpen(prev => !prev)}
            style={{
              width: '100%',
              padding: '1rem',
              textAlign: 'left',
              background: '#eee',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <span>Amortization Schedule ({data?.schedule?.length || 0} months)</span>
            <span>{isScheduleOpen ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {isScheduleOpen && (
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="year-select" style={{ marginRight: '0.5rem' }}>Filter by Year:</label>
                  <select
                    id="year-select"
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    style={{ padding: '0.3rem' }}
                  >
                    <option value="All">All Years</option>
                    {Array.from({ length: totalYears }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Year {i + 1}</option>
                    ))}
                  </select>
                </div>
                <button onClick={exportCSV} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}>
                  Export CSV
                </button>
              </div>

              <div style={{ border: '1px solid #eee', borderRadius: '4px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 1fr 1fr 1fr 1fr',
                    padding: '8px',
                    fontWeight: 'bold',
                    background: '#f9fafb',
                    borderBottom: '2px solid #ddd',
                    textAlign: 'right'
                  }}
                >
                  <span style={{ textAlign: 'left' }}>Month</span>
                  <span>Payment</span>
                  <span>Principal</span>
                  <span>Interest</span>
                  <span>Balance</span>
                </div>

                <List
                  height={Math.min(400, filteredSchedule.length * 40)}
                  rowCount={filteredSchedule.length}
                  rowHeight={40}
                  width="100%"
                  rowComponent={Row}
                >
                </List>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Disclaimer */}
      <footer style={{ marginTop: '3rem', fontSize: '0.8rem', color: '#666', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
        *Illustrative estimate only, not financial advice. Does not include fees, escrow, or variable compounding.
      </footer>
    </main>
  )
}

