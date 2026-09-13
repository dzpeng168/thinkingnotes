# Catching an Angry Client with FOSSA

> **FOSSA — the core of communicating with emotional people.**
>
> ✘ Misconception: they're being unreasonable, so I'll out-reason them into agreement.
> ✓ Correct: with emotional communication, **handle the emotion first, then the problem**.

**Subject**: Key client Mr. Zhang — furious on the phone after two consecutive outages, threatening to cancel renewal.

---

## F · Feelings

> Acknowledge and express understanding of the other's feelings — stand beside them, not against them

- What I heard: beneath the anger, **panic about business damage** — the second outage hit on their big promo day.
- What I said: "Mr. Zhang, if I were you, I'd be furious too. A system outage on promo day is not something an apology alone can settle. Let's make sure you leave this call with both an answer and a plan."
- Effect: a few seconds of silence, then his tone dropped: "Fine. Tell me what you'll do."

## O · Objectives

> Confirm the goal the other party wants — focus on goals, move past emotion

- What they actually want: not compensation, but **"this must never happen again."**
- Our shared goal: a stability guarantee solid enough to turn the crisis into a deeper renewal conversation.

## S · Situation

> Analyze the current problems, constraints, and resources together; prioritize

- Objective problems: outage 1 from traffic exceeding capacity (fixable by scaling); outage 2 from a third-party CDN failure (needs multi-path backup).
- Constraint: the multi-path backup takes 2 weeks to build.
- Priority: scale up first (this week), dual-path backup next (two weeks), then a dedicated SLA.

## S · Solutions

> Explore together what both sides can do under current conditions

- Our side: elastic scaling live by Friday; dual-path backup within two weeks; a 7×24 dedicated contact in the interim.
- Their side: share their promo calendar so we can run load tests 3 days ahead.

## A · Action

> An executable plan: reasonable goals, quantifiable results, deadlines

- [ ] By Friday 18:00: scaling live, verified by their tech (owner: me)
- [ ] Within two weeks: dual-path backup live + load-test report shared (owner: architecture team)
- [ ] From this month: a stability report sent to Mr. Zhang on the 1st of each month (owner: customer success)

---

## 💬 Retrospective

- Did it go well? Where it nearly broke: the F step decided everything — if my first sentence had explained "the outage cause", the call would have escalated within 30 seconds.
- For next time: pre-draft the "first sentence" for catching emotions, and turn it into a team script template.
