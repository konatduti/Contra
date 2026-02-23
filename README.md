# Contra - Insured B2B AI Contract Analysis & Risk Assessment
## Your lawyer never replied this fast.

## Project Purpose
Contra provides AI-driven contract analysis for SMEs. It lets users upload contracts in PDF, DOCX or image form, extracts text with OCR and then performs a multi‑step review using OpenAI GPT‑4.1. The results include contract summaries, key terms, risk assessment and legal references.

## Features
- Multi-format document upload with drag-and-drop interface
- OCR text extraction for images and PDFs
- Advanced GPT‑4.1 analysis with language detection and contract type classification
- Risk assessment and actionable recommendations
- Asynchronous processing page with real-time status checks
- Company management with seat limits and credit buckets
- Platform admin dashboard for monitoring users, companies and access requests

## Roles and Dashboards
- **User** – uploads documents and consumes personal or company credits via the User Dashboard.
- **Company Organizer** – manages members of a single company through the Company Organizer Dashboard.
- **Platform Admin** – full control of the system with Platform Admin Dashboard and can access any company's dashboard.

## Credits
Four credit buckets are supported and selectable at upload time:
- Individual Monthly
- Individual One-off
- Company Monthly
- Company One-off

## Access Requests
Visitors without an account may request access from the landing page. Platform admins are notified by email and can accept or reject requests from the Platform Admin Dashboard, which creates the company and first Company Organizer automatically.

Platform admins can also create companies directly, adjust seat limits and credit allocations, edit member passwords and credits, or remove companies entirely. Company organizers may delete their own company when needed.

## Installation

### System Dependencies
Poppler is required for PDF processing. The included utilities (such as `pdfinfo` and `pdftoppm`) allow `pdf2image` to read and convert PDF pages.

For local development on Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y poppler-utils
```

Include `poppler-utils` in your deployment environment as well. For Railway or other Nixpack builds, list the required packages in an `apt.txt` file:

```
tesseract-ocr
tesseract-ocr-hun
libtesseract-dev
libleptonica-dev
poppler-utils
```

### Python Packages
Python 3.11+ is required. Install dependencies using the `pyproject.toml` file:

```bash
pip install -e .
# or, if a requirements file is available
pip install -r requirements.txt
```

## Environment Variables
Before running the application set these variables:

- `OPENAI_API_KEY` – key for OpenAI contract analysis
- `DATABASE_URL` – database connection string (e.g. `sqlite:///contra.db`)
- `SESSION_SECRET` – Flask session secret key
- `SMTP_SERVER` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` – optional SMTP settings for outgoing mail
- `SMTP_FROM` – sender address for email notifications (defaults to `admin@contraai.hu`)
- `OCR_LANG` – OCR language for Tesseract (defaults to `hun` for Hungarian-first extraction)
- `OCR_DEFAULT_LANG` – default OCR language chain (for example `hun+eng`, Hungarian-first)
- `OCR_PROVIDER_CHAIN` – comma-separated OCR providers, e.g. `google_vision,tesseract`
- `OCR_SPACE_API_KEY` – optional API key for OCR.space fallback provider
- `GOOGLE_APPLICATION_CREDENTIALS` – path to Google service-account JSON file (preferred)
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` – raw service-account JSON in env var (alternative to file path)
- `OCR_GOOGLE_VISION_TIMEOUT` – timeout in seconds for Google Vision OCR calls (default `20`)
- `OCR_MIN_QUALITY_SCORE` – default quality threshold for OCR providers that require gating (default `0.40`)
- `OCR_MIN_QUALITY_SCORE_TESSERACT` / `OCR_MIN_QUALITY_SCORE_OCR_SPACE` / `OCR_MIN_QUALITY_SCORE_GOOGLE_VISION` – provider-specific threshold overrides
- `OCR_STRICT_PROVIDER` – when `true`, OCR raises on provider failure instead of silently falling back

## Persistent Database
To avoid losing data on redeploys, use an external PostgreSQL database and point `DATABASE_URL` to it.

### Using Neon
1. Create a Neon project and install the Neon GitHub app.
2. Add `NEON_API_KEY` and `NEON_PROJECT_ID` secrets to the repo.
3. Set `DATABASE_URL` in GitHub Secrets to your Neon main branch connection string.
4. The workflow `.github/workflows/neon_branch.yml` creates a branch database per PR and runs `init_db.py` to set up tables.
5. In your production deployment, set `DATABASE_URL` to the same connection string and run `python init_db.py` once.

## Running the Flask Server
After installing and configuring the environment variables, start the server with:

```bash
python main.py
```

## Development Notes
- Recent updates (see `replit.md` for full history):
- Analyzer now mirrors the standalone script and accepts both the document text and OpenAI API key via `analyze_document(text, api_key)`.
- Restored multi-model analyzer with parallel GPT‑4o calls and comprehensive output.
- Implemented background processing and a progress page with `/check_analysis` polling to avoid timeouts.
- Optimized analyzer and error handling so average processing time is around 95 seconds.

## Web Frontend & Internationalisation

The `frontend/` directory contains a Next.js 14 App Router project with English/Hungarian localisation powered by **i18next** and **next-i18next**. The header exposes a language selector beside the theme toggle and every string updates immediately without a full page reload. Translations are persisted to a `lang` cookie, to `localStorage.lang`, and to the `users.language` column in the shared database via the API route `POST /api/user/language`.

### Editing or Adding Translations

- **Update copy**: edit the locale dictionaries in `frontend/public/locales/en.json` and `frontend/public/locales/hu.json`. Every user-facing string — including button labels, dashboard copy, and the legal text — lives in these two files.
- **Terms & Privacy**: update the Markdown stored under the `legal.terms.content` and `legal.privacy.content` keys inside the locale dictionaries. The pages continue to render the Markdown through MDX, so tables, emphasis, and other formatting are supported.
- **Add a new language**:
  1. Add the language code to `SUPPORTED_LANGUAGES` in `frontend/i18n/settings.ts`.
  2. Create a new locale dictionary at `frontend/public/locales/<language>.json` mirroring the structure of the existing files.
  3. Provide translations for the `language.options` entries so the switcher displays the desired labels.

### Persistence Overview

- **Cookie**: `frontend/lib/locale/server.ts` writes the `lang` cookie to remember the selection across sessions.
- **localStorage**: `LocaleProvider` stores the language in `localStorage.lang` for instant client-side hydration.
- **Database**: the API route updates `users.language` (see migration `0002_add_user_language`) using the Neon serverless client in `frontend/lib/db.ts`.


Made by:
Artur Bitemo & Donat Kuti

#




## Frontend Integration (contrafrontend)

This backend now exposes compatibility endpoints under `/api/v1/*` so the public `konatduti/contrafrontend` BFF can proxy requests without code changes.

### Configure contrafrontend

Set the frontend environment variable:

```bash
BACKEND_URL=https://<contra-backend-domain>
```

The frontend BFF route `/api/bff/*` should now proxy to:

- `GET /api/v1/me`
- `GET /api/v1/dashboard`
- `GET /api/v1/documents`
- `GET /api/v1/documents/<id>`
- `POST /api/v1/documents/upload`
- `GET /api/v1/analysis/<id>/status`

Additional admin/company compatibility endpoints are also available:

- `GET /api/v1/admin/requests`
- `GET /api/v1/admin/companies`
- `GET /api/v1/companies/<id>/members`

### Quick verification

```bash
curl -i https://<contra-backend-domain>/api/v1/me
curl -i https://<contra-backend-domain>/api/v1/dashboard
curl -i https://<contra-backend-domain>/health
```

If calling via the frontend BFF, verify:

```bash
curl -i https://<contrafrontend-domain>/api/bff/me
```

For local smoke tests, use:

```bash
./scripts/smoke_test.sh http://localhost:5000
```
