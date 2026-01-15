# React + TypeScript + Vite + shadcn/ui

This is a template for a new Vite project with React, TypeScript, and shadcn/ui.

## Local Development

### Emulators

This project uses Firebase Local Emulators for Firestore, Auth, and Functions.

To start the emulators with a fresh state:

```bash
bun run emulator
```

To start emulators with imported data (if you have exported data in
`./emulator-data`):

```bash
bun run emulator:import
```

To export current emulator data to `./emulator-data`:

```bash
bun run emulator:export
```

## Deployment (Cloudflare Pages)

1. **Connect GitHub**: Link your repository to Cloudflare Pages.
2. **Build Settings**:
   - **Build Command**: `bun run build`
   - **Build Output Directory**: `dist`
3. **Environment Variables**: Add these in the Cloudflare dashboard (Settings >
   Environment Variables):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_CODEKARO_API_URL` (Optional)
4. **Deploy**: Click "Save and Deploy".

### Verification

The build process ensures:

- `_redirects` is copied to `dist/` for proper SPA routing.
- `index.html` is generated as the entry point.

## Backend Deployment (Firebase)

The frontend is deployed via Cloudflare, but Firestore Security Rules and
Indexes must be deployed separately.

To deploy only the backend configuration:

```bash
bun run deploy:firebase
```

This script:

1. Deploys `firestore.rules`
2. Deploys `firestore.indexes.json`
3. Skips hosting (handled by Cloudflare)

## Deployment Workflow & Previews (CI/CD)

The project is configured for automated deployments via Cloudflare Pages.

### Preview Deployments

Every Pull Request automatically generates a unique **Preview URL**.

1. Open a Pull Request in GitHub.
2. Cloudflare Pages detects the PR and builds the site.
3. A comment with the **Preview URL** is posted on the PR.
4. Use this URL to test changes in a production-like environment before merging.

> **Note:** Preview deployments use the Staging Firebase project (if configured)
> or the same production Firebase project depending on your environment
> variables set in Cloudflare Dashboard.

### Production Deployment

Merging to `main` triggers a **Production Deployment**.

- Ensures `main` always reflects the live site.
- It is recommended to enable **Branch Protection Rules** in GitHub to require a
  successful build before merging.

### Configuration Steps

**In Cloudflare Dashboard:**

1. Go to **Settings > Builds & Deployments**.
2. Enable **Preview deployments** (usually on by default).
3. Under **Environment variables**, set `VITE_FIREBASE_*` keys for both
   **Production** and **Preview** environments.

**In GitHub Settings:**

1. Go to **Settings > Branches**.
2. Add a rule for `main`.
3. Check **"Require status checks to pass before merging"** and select
   `Cloudflare Pages`.
