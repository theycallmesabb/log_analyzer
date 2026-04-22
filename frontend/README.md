# SecureLog — Log Anomaly Detection Frontend

Dark navy security dashboard matching the SecureLog UI design.

## Run in 3 steps

```bash
npm install
npm run dev
# Open http://localhost:5173
```

## Pages

| Route        | Page             |
|-------------|-----------------|
| `/`          | Dashboard        |
| `/logs`      | Log Viewer       |
| `/threats`   | Threat Detection |
| `/analytics` | Analytics        |
| `/settings`  | Settings         |

## Connect your backend

Replace dummy data in `src/data/sampleData.js` with real API calls:

```js
// Example
const res = await fetch('http://localhost:8000/api/logs')
const logs = await res.json()
```
