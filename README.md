# WorldView Immersive

A production-oriented original 3D globe application inspired by immersive spatial-intelligence interfaces. It is intentionally not a copy of any third-party repository.

## Included

- CesiumJS/WebGL 3D Earth
- Optional Cesium Ion photorealistic imagery + World Terrain
- No-token fallback using OpenStreetMap tiles
- Live USGS earthquake feed through the backend
- OpenStreetMap Nominatim geographic search through the backend
- Smooth camera flight to search results
- Interactive earthquake markers and event details
- Layer system with earthquakes, atmosphere, and country borders
- Express backend + Vite/React frontend in one Render Web Service
- Render Blueprint (`render.yaml`)
- Responsive desktop/mobile overlay UI

## Deploy on Render

1. Unzip this project.
2. Create a new GitHub repository and upload the unzipped files.
3. In Render choose **New → Web Service** and connect the GitHub repository.
4. Render can use the included `render.yaml`, or set:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
5. Optional: set `VITE_CESIUM_ION_TOKEN` in Render Environment Variables.

Without a Cesium Ion token, the app still starts and uses an OpenStreetMap base layer. With a valid token, it uses Cesium Ion imagery and World Terrain for a much richer globe.

## Local run

```bash
npm install
npm run dev
```

The frontend is on `http://localhost:5173` and the dev API is on `http://localhost:3001`.

## Important

Public Nominatim and OSM services have usage policies and rate limits. For a public/high-traffic production deployment, replace them with a proper geocoding provider and cached tile/data infrastructure.
