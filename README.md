# Personal Vitals Insight

Build a web app called NeuroVitals — a personal health dashboard that detects what's 

UNUSUAL FOR THIS SPECIFIC USER, not against generic population norms.

CORE CONCEPT: Every metric is compared against the user's own rolling historical 

baseline (mean + standard deviation over their last N days), not a fixed "normal range." 

This is the entire product differentiator — do not build generic threshold-based alerts.

PAGES / FLOWS:

1. Onboarding

   - Simple signup (email/password via Supabase auth)

   - "Building your baseline" state: explain that the first 7-14 days are calibration, 

     no insights shown yet — just data collection

2. Daily Check-in (mood/mental state)

   - Quick-tap mood log: energy level, stress level, sleep quality (1-5 scale each)

   - One optional free-text note

   - Should feel like a 10-second interaction, not a form

3. Vitals Dashboard

   - Cards for: Resting HR, HRV, Sleep Duration, Activity/Steps

   - Since real wearable OAuth is out of scope for this prototype, seed realistic 

     synthetic daily data (generate a believable 30-day history per metric with normal 

     day-to-day variance, then include 2-3 "deviation" days worth flagging)

   - Each card shows: current value, small trend sparkline, and delta vs personal baseline 

     (e.g. "+9 bpm vs your 14-day average")

4. Insights Feed (the core feature)

   - This is the explainable AI layer — but simulate the "AI" as a deterministic scoring 

     function, not a real ML call:

     - For each metric, compute z-score = (today's value - rolling mean) / rolling stddev

     - Flag as a deviation if |z-score| > 1.5 (configurable threshold)

     - When 2+ metrics deviate on the same day, generate an insight card combining them

   - Insight card format (this exact structure matters, it's the "explainability" promise):

     "[Metric] is [X] vs your [N]-day baseline, coinciding with [correlated metric change].

      Most significant contributor: [metric]. This is not a diagnosis."

   - Insights are historical/informational only — no red alert styling, no urgency language

5. Baseline View

   - A simple explainer screen: "How NeuroVitals sees you" — show the user's own 

     personal ranges for each metric vs. what a generic health app would show, 

     side by side, to make the differentiator visible and tangible

DESIGN DIRECTION:

- Calm, clinical-but-warm — not a fitness-app aesthetic (no gamification, no streaks, 

  no red/urgent colors for deviations — deviations are informational, not alarms)

- Soft neutral palette, generous whitespace, one accent color used sparingly

- Mobile-first, since check-ins happen on the go

EXPLICITLY DO NOT BUILD:

- No doctor/clinician features, no data sharing, no marketplace

- No emergency alerting or "call for help" flows

- No real wearable API integration — synthetic data only for this prototype



DATA: Use Supabase for auth + storing check-ins and synthetic vitals history.  it should has login and authentication

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/665f1972-22cd-44f8-8805-8feeb1b2dd45).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
