# Submission Guide — Group 13

**CT124-3-3-BCD Blockchain Development · APU**

This file tells every team member exactly what to do before the submission deadline. Read it top to bottom before touching anything.

---

## What gets submitted

The lecturer requires two separate ZIP files:

| ZIP file | Contents |
|---|---|
| `documentation_group13.zip` | `documentation/documentation_group13.md` only |
| `implementation_group13.zip` | `frontend/` folder + `hardhat-project/` folder — with node_modules deleted |

---

## Step 1 — Download the project from GitHub

1. Go to the GitHub repository (Taha will share the link).
2. Click **Code → Download ZIP**, or run:
   ```bash
   git clone <repo-url>
   cd <project-folder>
   ```
3. You do NOT need to run anything yet — just have the files on your machine.

---

## Step 2 — What to DELETE before zipping

These folders are generated automatically and must NOT be included in the ZIP. They are large and recreated by `npm install`.

Delete these folders:

```
frontend/node_modules/
hardhat-project/node_modules/
hardhat-project/artifacts/
hardhat-project/cache/
hardhat-project/typechain-types/
```

Also delete these files (auto-generated or environment-specific):

```
frontend/.next/
frontend/tsconfig.tsbuildinfo
frontend/.env.local
```

### Quick way to delete on Windows

Open PowerShell in the project root and run:

```powershell
Remove-Item -Recurse -Force frontend\node_modules
Remove-Item -Recurse -Force frontend\.next
Remove-Item -Recurse -Force hardhat-project\node_modules
Remove-Item -Recurse -Force hardhat-project\artifacts
Remove-Item -Recurse -Force hardhat-project\cache
Remove-Item -Recurse -Force hardhat-project\typechain-types
Remove-Item -Force frontend\tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Force frontend\.env.local -ErrorAction SilentlyContinue
```

---

## Step 3 — What to KEEP (do not delete these)

```
frontend/
  app/
  components/
  lib/
  public/
  scripts/
  package.json
  package-lock.json
  next.config.js
  tailwind.config.ts
  tsconfig.json
  postcss.config.js

hardhat-project/
  contracts/
  scripts/
  test/
  hardhat.config.ts
  package.json
  package-lock.json
  tsconfig.json
  start-local.bat

documentation/
  documentation_group13.md

README.md
PRESENTATION.md
```

Do NOT include: `enhancement-plan/`, `_bmad/`, `mysql-data/`, `.pdf` files, `SUBMISSION_GUIDE.md` (this file).

---

## Step 4 — Create the two ZIP files

### ZIP 1 — Documentation

1. Go into the `documentation/` folder.
2. Select `documentation_group13.md`.
3. Right-click → Send to → Compressed (zipped) folder.
4. Rename it to `documentation_group13.zip`.

### ZIP 2 — Implementation

1. Select the `frontend/` folder and the `hardhat-project/` folder together (hold Ctrl to select both).
2. Right-click → Send to → Compressed (zipped) folder.
3. Rename it to `implementation_group13.zip`.

---

## Step 5 — Check the documentation file before submitting

Open `documentation/documentation_group13.md` and verify:

- [ ] Group 13 member table is at the top (all 4 names + TP numbers)
- [ ] Part 1 to Part 2 mapping table is present (10 rows)
- [ ] Figure 1 is a Mermaid architecture diagram
- [ ] Every feature section has Figure X.Y code blocks with source file captions
- [ ] Setup instructions include all four SQL table definitions
- [ ] Screenshots section has placeholders — **replace them with real screenshots before submitting**
- [ ] References section has the 6 academic references

---

## How to take screenshots for the documentation

The documentation file has placeholder lines like:
```
[INSERT SCREENSHOT — Dashboard with role badge + stat tiles]
```

You need to replace each one with an actual image. Steps:

1. Start the app (see README.md for full setup).
2. Take screenshots of each page/feature listed.
3. Save images into `documentation/screenshots/` folder.
4. In `documentation_group13.md`, replace each placeholder with:
   ```md
   ![Dashboard](screenshots/dashboard.png)
   ```

Screenshots needed (in order):
1. Dashboard — company name + role badge + stat tiles
2. Add Product — step 3 review screen
3. Add Product — success screen with confetti and QR code
4. Track page — full timeline + status progress bar + QR
5. Track page — SensorChart showing temperature and humidity lines
6. Track page — red RecallBanner visible at top
7. IssueRecallModal — open with reason textarea filled
8. Verify page — authenticity seal showing
9. Verify page — red RecallBanner for a recalled product
10. Verify page — QR scanner modal, Upload tab active
11. IPFS gateway — certificate file opening in browser
12. Audit page — filters applied, donut chart visible
13. IoT Simulator page — after submitting a reading
14. Contacts page — saved contacts with role badges
15. Transfer Ownership modal — ContactPicker showing saved contacts
16. ThemeSwitcher open — Aurora theme active, full dashboard

---

## How to use Claude to finish the documentation

If `documentation/documentation_group13.md` is incomplete or needs updating, you can ask Claude to fix it. Here is exactly what to say:

---

### Claude prompt — generate/fix the documentation

Open Claude Code (or claude.ai) in the project folder and paste this:

```
I need you to update documentation/documentation_group13.md for a blockchain supply chain DApp assignment.

The project is at: [paste the folder path here]

Rules:
- The file must be Markdown (.md), not Word
- Every Figure X.Y code block must be quoted VERBATIM from the actual source file with the exact line numbers
- Every figure must have a caption: **Figure X.Y — description** — *Source: `relative/path` lines A–B.*
- Every feature section must open with: "This feature implements [Part 1 §X.Y] and satisfies the marking criterion [criterion] by..."

Figures I need:
- Figure 2.1: addProduct function from hardhat-project/contracts/SupplyChain.sol
- Figure 2.2: ProductAdded event parsing from frontend/app/add-product/page.tsx
- Figure 3.1: connectWallet helper from frontend/lib/contract.ts
- Figure 4.1: transferOwnership Solidity from hardhat-project/contracts/SupplyChain.sol
- Figure 5.2: verifyProduct Solidity from hardhat-project/contracts/SupplyChain.sol
- Figure 6.1: uploadToIPFS from frontend/lib/ipfs.ts
- Figure 7.1: getHistory Solidity from hardhat-project/contracts/SupplyChain.sol
- Figure 9.1: FilterBar component from frontend/app/audit/_components/FilterBar.tsx
- Figure 13.1: logSensorReading Solidity from hardhat-project/contracts/SupplyChain.sol
- Figure 14.1: issueRecall and liftRecall Solidity from hardhat-project/contracts/SupplyChain.sol
- Figure 14.2: RecallBanner component from frontend/components/RecallBanner.tsx
- Figure 15.1: ThemeProvider from frontend/lib/theme.tsx
- Figure 15.4: CSS variable block from frontend/app/globals.css

Read every file before quoting. Do not paraphrase. Show exact line numbers.
```

---

### Claude prompt — add screenshots to the documentation

After taking your screenshots, paste this into Claude:

```
I have taken screenshots and saved them in documentation/screenshots/.
The files are named: dashboard.png, add-product-review.png, add-product-success.png, track-timeline.png, track-sensor-chart.png, track-recall-banner.png, issue-recall-modal.png, verify-seal.png, verify-recall.png, verify-qr-scanner.png, ipfs-certificate.png, audit-filters.png, iot-simulator.png, contacts-page.png, transfer-modal.png, theme-aurora.png

Please update documentation/documentation_group13.md to replace every [INSERT SCREENSHOT ...] placeholder with the correct ![alt text](screenshots/filename.png) markdown image tag.
```

---

## Full submission checklist

Before uploading to the submission portal:

- [ ] `documentation_group13.zip` contains only `documentation_group13.md` (and `screenshots/` folder if screenshots are added)
- [ ] `implementation_group13.zip` contains `frontend/` and `hardhat-project/` with NO `node_modules` inside either
- [ ] Screenshot placeholders in the documentation are replaced with real images
- [ ] Member contributions table in `PRESENTATION.md` is filled in (who did what)
- [ ] Group member names and TP numbers are correct in the documentation cover page
- [ ] The documentation opens and renders correctly in a Markdown viewer (GitHub, VS Code, or Typora)

---

## Contact

If anything breaks during setup or submission, contact Taha (TP078281) or open the project README.md for the full setup walkthrough.
