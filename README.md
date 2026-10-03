# Loanscope
LoanScope is a browser-based, single-page application that visualizes a loan’s amortization schedule and remaining lifetime as a function of three interactive inputs: starting
principal, annual interest rate, and monthly payment.

BEFORE RUNNING:

Make sure you have already installed `node.js`, `cors.js`, `express.js`, `recharts`, `react`, and `react windows`.

BEGINNING:
1. Download GitHub Repository
2. Unzip folder & Make note of folder's path

TO RUN:

4. Open 2 terminals.
5. In both terminals navigate to the folder you downloaded, "Loanscope_assign"
6. In the 1st terminal, run these commands:
   ```
   cd backend
   node server
   ```
7. You should receive the message `LoanScope API running on http://localhost:3001`
9. In the other terminal run these commands:
   ```
   cd frontend
   npm start
   ```
10. You should receive a message similar to
   ```
   webpack compiled successfully
    Compiling...
    Compiled successfully!

    You can now view frontend in the browser.

    Local:            http://localhost:3000"
   ```
9. Shortly afterwards a new page will be opened in your web browser
