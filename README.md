# GridHeal Dashboard

> **"A microgrid is an operating system for electricity. GridHeal is the scheduler."**
>
> Built by **Team lulzsec** (Karan Singh, Saurav Khulbe, Raj Gaurav Singh, Parth Biroria)  
> *Bharati Vidyapeeth's College of Engineering*  
> *Prompt-ae-thon | Sustainability & Smart Cities (PS4: Self-Healing Renewable Energy Grid)*

---

## ⚡ Overview

GridHeal is an autonomous, self-healing microgrid controller designed for university campuses. It runs a 15-minute continuous control loop:
1. **Detect:** Monitor telemetry and flag sudden drop/trip anomalies.
2. **Predict:** Forecast solar and demand 4 steps ahead with uncertainty bands.
3. **Reallocate:** Priority dispatch (P0 Critical, P1 Flexible, P2 Deferrable), EV deadline shifting, and peak shaving.
4. **Recover:** Solid-state fault isolation and microgrid islanding to ensure **0 minutes of critical load downtime**.

The app is completely static, deterministic (Mulberry32 PRNG), and client-side, with zero external backend dependencies or API keys required.

---

## 🚀 Easy 1-Click Deployment (Vercel & Netlify)

### Deploying on **Vercel**
1. Push this repository to GitHub/GitLab.
2. Go to [vercel.com/new](https://vercel.com/new) and select the repository.
3. Preset will auto-detect **Vite**:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**. The `vercel.json` rewrite file is already configured.

### Deploying on **Netlify**
1. Push this repository to GitHub/GitLab.
2. Go to [app.netlify.com](https://app.netlify.com) and click **Add new site** > **Import an existing project**.
3. Choose your repository.
4. The included `netlify.toml` automatically configures:
   - **Base directory:** (leave default)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**.

Alternatively, drag and drop the built `dist/` directory directly into Netlify Drop for instant hosting without git.

---

## 🛠️ Local Development & Testing

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run Vitest test suite (verifying determinism, energy balance, and zero downtime)
npm test

# Build production bundle
npm run build
```

---

## 📊 Visual Components Built
- **Power River:** Animated campus microgrid schematic with real-time kW ribbons, battery tank fill, and fault isolation points.
- **Dumbbell Scorecard:** Compares Baseline vs GridHeal on critical downtime (0 min target), replan duration (< 1s target), peak demand, and CO2 emissions.
- **Supply–Demand Tape:** Stacked supply above the zero line and demands below, highlighting fault windows.
- **Split-Reveal Compare:** Interactive slider revealing Baseline on the left vs GridHeal on the right with green shaded kWh saved ribbon.
- **Scheduler Gantt:** CPU scheduler visualization treating loads as prioritized processes (P0, P1, P2).
- **Forecast Fan:** Predictive solar uncertainty fan evaluated in real-time against actual telemetry.
- **Spiral Clock:** 7-day radial heatmap with 24-hour dial and interactive step jump navigation.
- **Why Panel:** Explainable right-side drawer stepping through the 4-stage decision loop for each action taken.
- **Guided Tour:** 6-step interactive walkthrough for non-expert judges and evaluators.
