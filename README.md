# CityCare CDO

CityCare CDO is a Vue 3 admin portal backed by an Express API and MongoDB.

## Data ownership

Operational records (reports, fleet vehicles, barangays, and collection schedules), administrator profile details, and administrative preferences are served and persisted by the backend. The frontend reads and writes these records through `/api`; it does not contain operational sample records. Analytics are calculated from stored reports, and response-time reporting starts once a report has an assignment timestamp.

The browser keeps only interface preferences such as the selected theme and the authentication token needed for API requests. User profile details and admin preferences are loaded from the API.

## Run locally

1. Configure `backend/.env` with a reachable MongoDB URI and the required backend secrets.
2. Start the API from the repository root:

   ```powershell
   npm --prefix backend run dev
   ```

3. Start the Vue development server in another terminal:

   ```powershell
   npm run dev
   ```

The development server proxies `/api` to `http://localhost:5000`. MongoDB must be available for records and preferences to persist.

## Citizen mobile app and live reports

The admin incident table polls the backend every five seconds. Reports are stored in MongoDB, and the admin can inspect evidence, assign a fleet unit, and update a report through the protected status API. The reports API uses database pagination; `GET /api/reports` returns up to 1,000 newest reports by default, and accepts `page` and `limit` parameters (maximum page size: 1,000). Its response includes `count` for the current page, `total`, `totalPages`, `statusCounts`, and `data`.

Citizen submissions can use `POST /api/reports` with JSON fields such as `title`, `category`, `barangay`, `purokZone`, `landmark`, `description`, `gpsCoordinates`, `reporter`, and `userEmail`. Photo evidence must be uploaded by the mobile app to an image-storage service first; send the resulting HTTP(S) download URL as `photoUrl` (also accepts `imageUrl` or `photoEvidenceUrl`). The API stores that URL, not the binary image, and the admin report drawer displays it. Do not send a base64 image in the report JSON.

### Public HTTPS deployment (Render)

The local server is only reachable from the computer/LAN. To accept reports from phones on other networks or locations, deploy the API and admin site to public hosting with HTTPS. A Render Blueprint is included in `render.yaml`:

1. Push this project to a GitHub repository and create a Render account.
2. In Render, choose **New → Blueprint**, connect that repository, and deploy `render.yaml`. It creates `citycare-cdo-api` and `citycare-cdo-admin`; the browser admin is built with the API's public HTTPS address.
3. Before the API can become healthy, set its `MONGO_URI` environment variable in Render to the MongoDB Atlas connection string. Keep the database username/password private. Add the Render service's outbound IP addresses shown in its settings to the Atlas Network Access allowlist. If the selected Render plan has no stable outbound IPs, contact the host or use a private network/static-egress option rather than exposing Atlas broadly.
4. If the admin site's Render hostname is not `citycare-cdo-admin.onrender.com`, update the API's `ALLOWED_ORIGINS` value to the exact HTTPS admin-site origin, with no trailing slash.
5. Wait for both deployments to finish. Check `https://<API_HOST>/api/health`; it must return `ONLINE` and `CONNECTED`. Open the admin site and submit a report from the mobile app to verify end-to-end delivery.
6. In the separate Android project (not included here), set `CityCareApiService.kt`'s base URL to `https://<API_HOST>/api/` and build/release a new app version. An emulator should use this same public HTTPS URL once deployed; `10.0.2.2` is only for a local emulator/backend setup.
7. Upload citizen photos to Firebase Storage or another image host and send the HTTPS download URL as `photoUrl`; ensure the storage rules allow intended readers to view the evidence.

Render may sleep free web-service instances when idle, causing a delay on the first request; use an always-on plan for time-sensitive operations. The included rate limits are per source IP: by default, 1,500 submissions/hour and 10,000 API requests/hour. Many mobile carriers and offices share public IPs, so adjust those values to match expected traffic. These in-memory limits suit a single API instance; use a shared rate-limit store before running multiple instances.

Each report receives a unique ID based on its MongoDB document ID. Reports are paginated for the admin UI, which can browse more than 1,000 stored reports without downloading the whole collection each refresh.
