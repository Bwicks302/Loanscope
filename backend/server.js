import express from 'express'
import cors from 'cors'
import {amortization} from '../frontend/src/Amortization.js'

const app = express()
app.use(cors())
app.use(express.json())

app.post('/api/calculate', (req, res) => {
    const { principal, rate, time } = req.body;

    if (principal < 1 || principal > 100000000 || rate < 0 || rate > 40 || time < 1){
        return res.status(400).json({ error: 'Invalid input values' });
    }

    const result = amortization(Number(principal), Number(rate), Number(time))
    if (result.error) return res.status(422).json({ error: result.error })

    return res.json(result);
});


app.listen(3001, () => console.log('LoanScope API running on http://localhost:3001'))