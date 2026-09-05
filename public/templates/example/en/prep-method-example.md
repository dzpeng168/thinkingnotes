# PREP Method

> **State Your Point → Present the Reason → Give an Example → Restate the Point**
>
> **Topic**: Recommend migrating company servers from traditional IDC to cloud services  
> **Scenario**: Quarterly technical review, presenting to CTO and tech team  
> **Audience**: CTO, Technical Director, Operations Lead  
> **Date**: 2026-08-30

---

## P — Point

> Get straight to the point in one sentence, state your core opinion or conclusion directly.

**My point is**:
> I recommend the company migrate core business systems from the traditional IDC datacenter to Alibaba Cloud in Q4. This is projected to reduce operations costs by 30%, while significantly improving system elasticity and stability.

**One-sentence summary**:
- Cloud migration = lower cost + greater stability + more flexibility

---

## R — Reason

> Use evidence to support your point, explain "why". Can be data, logic, principles, etc.

**Reason 1: Better cost efficiency**
- Current annual IDC cost is approximately ¥1.2M (servers ¥600K + bandwidth ¥300K + operations labor ¥300K)
- Estimated annual cost after cloud migration: ¥800K-850K, saving roughly 30%
- Pay-as-you-go: resources can be released during low-traffic periods, no need to pay for idle servers

**Reason 2: Better stability and elasticity**
- Cloud services offer 99.99% SLA guarantee, one order of magnitude higher than our self-maintained 99.9%
- Strong auto-scaling capability: can scale up 10x within minutes during peak promotions, no need to procure servers months in advance
- Multi-AZ deployment: single datacenter failure does not affect overall service; we cannot achieve such high disaster recovery on our own

**Reason 3: Improved operational efficiency**
- Many infrastructure ops tasks (hardware replacement, network tuning, security patches) are handled by the cloud provider
- Operations team can shift from "firefighting" to "value creation", focusing on optimizing business systems
- New hires onboard faster; cloud services have far more complete documentation and ecosystem than self-built infrastructure

**Core logic chain**:
```
Cloud migration ← 30% cost reduction (pay-as-you-go + labor savings)
                ← Better stability & elasticity (99.99% SLA + auto-scaling)
                ← Higher ops efficiency (cloud provider handles basic ops)
```

---

## E — Example

> Use specific cases, stories, and data to support your reasoning, making your point more persuasive.

**Positive example**:
- Case description: Competitor A completed cloud migration last year; we know someone working there in operations
- Outcome: After migrating, ops costs dropped by 35%. During last year's Double 11 promotion, they elastically scaled to 8x normal capacity with zero incidents. Previously on IDC, they had to hold their breath every year during peak events.
- What it proves: The cost savings and stability improvements from cloud migration are real and verifiable, not just theoretical.

**Negative example** (optional):
- Case description: Our company's server scaling experience during this year's 618 promotion
- Outcome: We procured servers 1 month in advance; delivery took 2 weeks, racking and debugging another week. After the promotion ended, these servers sat idle — we spent hundreds of thousands on something used for only a few days.
- What it contrasts: Traditional IDC scaling is too rigid with low resource utilization, and cloud elasticity directly solves this problem.

**Data support** (optional):
| Metric | Current (IDC) | Projected After Cloud | Change |
|---|---|---|---|
| Annual cost | ¥1.2M | ¥800-850K | ↓ 30% |
| Availability | 99.9% (~8.76 hrs/year downtime) | 99.99% (~52 min/year downtime) | ↑ 10x |
| Scaling time | 2-4 weeks | Minutes | ↑ Nx |
| Ops headcount | 3 people | 1.5 people | ↓ 50% |

---

## P — Point (Restatement)

> Return to the opening point, restate the conclusion again for a clear call-back.

**So, my conclusion is**:
> All things considered, migrating core business systems to cloud services not only saves about 30% on operations costs — more importantly, it significantly improves system stability and elasticity, freeing the operations team from repetitive work to focus on more valuable tasks. I recommend launching the cloud migration project in Q4, starting with non-core business as a pilot, then gradually migrating core systems after validation.

**Proposed actions**:
- [x] Launch cloud migration feasibility assessment in Q4 (2 weeks)
- [ ] Select 1-2 non-core systems for pilot migration (1 month)
- [ ] After pilot validation, develop a full cloud migration roadmap

**Hand decision-making back to the other party**:
> The above is my analysis and recommendation. The final decision is, of course, yours. Do you think this direction is feasible?

---

## 📝 Complete Practice Area

| Step | Content |
|---|---|
| **P Point** | Recommend migrating core business from IDC to cloud services, can reduce cost by 30% and improve stability |
| **R Reason** | 1. Better cost: annual cost drops from ¥1.2M to ¥850K, saves 30%<br>2. More stable & elastic: 99.99% SLA, minute-level scaling<br>3. Higher ops efficiency: cloud provider handles basic ops, 50% labor savings |
| **E Example** | Positive: Competitor A saw 35% cost drop after cloud migration, zero incidents during peak promo<br>Negative: We procured servers 1 month early for 618, idle after promo<br>Data: 4-item comparison on cost/availability/scaling time/labor |
| **P Restate** | Recommend launching cloud migration in Q4, pilot with non-core first, roll out gradually after validation. Please make the call. |

---

## 💡 Usage Tips

**Applicable scenarios**:
- Upward reporting of work
- Speaking and expressing in meetings
- Writing emails/copy
- Answering questions in interviews
- Persuading others

**Notes**:
1. **Be clear on your point** — Don't be ambiguous, state it clearly in one sentence
2. **Make reasons compelling** — 2-3 of the most persuasive reasons are enough, not too many
3. **Make examples specific** — With details, data, and comparisons, more persuasive
4. **Restate concisely** — Re-emphasize in different words, don't just repeat verbatim
5. **Leave space for the other party** — After expressing your point, hand decision-making back to them

---

## 📌 Quick Reference Card

| Letter | Chinese | English | Purpose | Key Question |
|---|---|---|---|---|
| P | 观点 | Point | State the conclusion | What is my core message? |
| R | 依据 | Reason | Support the point | Why do I say this? |
| E | 举例 | Example | Back up the reason | What are some concrete examples? |
| P | 观点 | Point | Bookend the argument | So what is the conclusion? |
