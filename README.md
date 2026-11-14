# Water Ring Toss

A mobile web game inspired by the classic handheld water ring toss toy. Press the
buttons to shoot water jets, and tilt or shake your phone to land rings on pegs.

**Play:** https://naomishah99.github.io/waterful_Ring_Toss/

See [PLAN.md](PLAN.md) for the step-by-step build plan.

## Run locally

```bash
npm install
npm run dev        # laptop: http://localhost:5173/waterful_Ring_Toss/
npm run dev:phone  # phone on same Wi-Fi: open the https://<your-ip>:5173 link it prints
```

`dev:phone` uses a self-signed certificate, so your phone will show a warning the
first time; accept it to continue. HTTPS is needed for tilt and shake sensors.

Every push to `main` deploys automatically to GitHub Pages.
