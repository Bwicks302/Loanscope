export function amortization(principal, interestRate, monthlyPayment) {
    let principalCents = principal * 100
    const monthlyRate = interestRate / 100 / 12
    const monthlyPaymentCents = monthlyPayment * 100

    const initialMonthlyInterestCents = principalCents * monthlyRate
    if (monthlyPaymentCents <= initialMonthlyInterestCents) {
        return {error: 'Monthly payment is too low to cover interest. Loan will never be paid off at this rate.'}
    }

    const schedule = []
    let totalInterestCents = 0
    let totalPrincipalCents = 0
    let month = 0
    const maxMonths = 1200 // Prevent infinite loop in case of unexpected behavior + Specified in the requirements

    while (principalCents > 0 && month < maxMonths) {
        month++
        const monthlyInterestCents = principalCents * monthlyRate
        let principalPaidCents = monthlyPaymentCents - monthlyInterestCents
        let actualPaymentCents = monthlyPaymentCents

        if (principalCents + monthlyInterestCents < principalPaidCents) {
            actualPaymentCents = principalCents + monthlyInterestCents
            principalPaidCents = principalCents
            principalCents = 0
        } else {
            principalCents -= principalPaidCents
        }
        totalInterestCents += monthlyInterestCents
        totalPrincipalCents += principalPaidCents
        schedule.push({
            month,
            payment: actualPaymentCents / 100,
            principalPaid: principalPaidCents / 100,
            interestPaid: monthlyInterestCents / 100,
            remainingBalance: principalCents / 100,
            cumulativeInterest: totalInterestCents / 100,
            cumulativePrincipal: totalPrincipalCents / 100
        })
    }

    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + month)

    return {
        schedule,
        termMonths: month,
        termYears: month / 12,
        termRemainingMonths: month % 12,
        totalInterest: totalInterestCents / 100,
        payoffDate: payoffDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }),
        exceededMaxTerm: month >= maxMonths && principalCents > 0
        }
    }