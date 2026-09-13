# "Instant Invoice" Project Report

> **STAR — Do the work with your hands, get it done with your mouth.**
> S Situation → T Task → A Action → R Result: tell a 3-month project in 5 minutes.

**Audience**: Business-unit quarterly review

---

## ① S · Situation

> Why this project…

- Since Q3 last year, support logged heavy complaints: e-invoices took 3.2 days on average; finance spent 4 person-days a month on invoicing.
- Ops estimate: slow invoicing was the #2 driver of churn renewal — roughly ¥1.8M annualized revenue impact.

## ② T · Task

> What task objectives were set…

- As project PM, my goal: **compress invoicing from 3.2 days to under 0.5 days within 90 days (automation rate ≥85%)**.
- Why: 0.5 days is below the user-perception threshold; 85% automation is the minimum to double finance's efficiency.

## ③ A · Action

> What I / the team actually did…

- Mapped the 11-step invoicing chain and located 3 bottlenecks: manual tax-terminal triggering, manual verification of buyer details, monthly batch queueing.
- My plan: auto-invoicing via the tax vendor's API + OCR verification + queue smoothing.
- Hardest problem: finance feared compliance risk with auto-invoicing. My solution: run a 30-day **shadow mode** — auto-invoice in parallel with 10% manual sampling — and let a zero-error log win finance's sign-off.

## ④ R · Result

> What the project achieved…

- Invoicing time: **3.2 days → 4 hours** (beat the target), automation rate 91%.
- Finance saves 3 person-days monthly; invoicing complaints down 92%.
- Transferable lesson: the **shadow-mode playbook** — for any compliance-sensitive automation, run in parallel first, buy trust with data, then cut over. Now a team SOP.

---

## 📢 One-line report (elevator version)

> Customers waited 3 days for an invoice; we got it to 4 hours with 91% automation in 90 days — the trick was letting the automated system "shadow-run" for a month and letting the zero-error data convince finance.
