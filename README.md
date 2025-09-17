# YouTube Search Trend Spotter

This is a web application to compare the popularity of two YouTube search terms based on video results, views, and likes. The backend is built with Node.js and Express, handling YouTube Data API requests and JSON file storage. The frontend uses Vue.js 3 with Apache ECharts (via `vue-echarts`) for visualizations, displaying a bar chart, scatter chart, and table of the top 50 latest videos with titles and links.

## Features
- **Compare Search Terms**: Analyze two search terms using YouTube Data API metrics (total videos, views, likes).
- **Visualizations**:
  - **Bar Chart**: Compares total videos (approx), total views, average views, total likes, and average likes.
  - **Scatter Chart**: Plots top 50 videos for both terms on a single graph, showing release dates vs. view counts.
  - **Table**: Lists top 50 latest videos per term with clickable titles, release dates, and view counts.
- **Offline Support**: Save/load JSON files to minimize API quota usage.
- **Responsive Design**: Charts and tables adapt to different screen sizes.

## Architecture
- **Backend**: Node.js + Express
  - Handles YouTube Data API requests and JSON file storage/retrieval.
  - Endpoints: `/api/compare`, `/api/save-json`, `/api/load-json/:filename`, `/api/list-json`.
- **Frontend**: Vue.js 3 + Vue ECharts
  - Reactive UI with input form, chart components (ECharts bar and scatter), and table.
  - Communicates with backend via Axios.
- **Dependencies**:
  - Backend: `express`, `node-fetch`, `cors`
  - Frontend: `vue`, `vue-echarts`, `echarts`, `axios`

## Prerequisites
- **Node.js**: Version 16 or higher.
- **YouTube Data API Key**: Obtain from [Google Cloud Console](https://console.cloud.google.com/).
- **Git**: For cloning the repository (optional).

## Installation

You can clone the repo

`git@github.com:TheEuge/youtube-trend-spotter.git`

and proceed with installation instructions below.

### Directory Structure
```
youtube-trend-spotter/
├── backend/
│   ├── data/              # Stores JSON files
│   ├── index.js           # Express server
│   ├── package.json
├── frontend/
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.js
│   ├── public/
│   ├── package.json
```
## Backend Setup

1. Navigate to the backend directory:

`cd backend`

2. Create **package.json**:

```
{
  "name": "youtube-trend-spotter-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "node-fetch": "^2.6.7",
    "cors": "^2.8.5"
  }
}
```
3. Install dependencies:

`npm install`

4. Create index.js (see the code) and replace `'YOUR_API_KEY_HERE'` with your YouTube Data API key.

5. Start the backend server:

`npm start`

The server runs on http://localhost:3000.

## Frontend Setup

1. Navigate to the frontend directory:

`cd frontend`

2. Create **package.json**:

```
{
  "name": "youtube-trend-spotter-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "vue": "^3.2.47",
    "vue-echarts": "^6.6.1",
    "echarts": "^5.4.3"
  },
  "devDependencies": {
    "@vue/cli-service": "^5.0.8"
  }
}
```

3. Install dependencies:

`npm install`

4. Create `src/main.js` and `src/App.vue` (see the code).

5. Start the Vue development server:

`npm run serve`

The app typically runs on http://localhost:8080.

## Usage

1. **Start the Backend**:

- Ensure the backend server is running (http://localhost:3000).
- Verify the YouTube Data API key is set in `backend/index.js`.

2. **Start the Frontend**:

- Run the Vue app (http://localhost:8080).

3. **Compare Search Terms**:
- Enter two search terms (e.g., "cat videos" and "dog videos").
- Click "Compare" to fetch data from the YouTube API via the backend.

4. **View Results**:

- **Summary**: Displays total videos, total/average views, and total/average likes.
- **Bar Chart**: Compares total videos (thousands), total views (millions), average views (thousands), total likes (millions), and average likes (thousands).
- **Scatter Char**t: Plots top 50 videos for both terms (release date vs. view count) on one graph.
- **Table**: Lists top 50 latest videos per term with clickable titles, release dates, and view counts.

5. **Save/Load JSON**:

- Click "Download JSON" to save data to the server and download it.
- Select a JSON file from the dropdown to load offline data.

## Notes

- **API Quota**: Each comparison uses ~300 units (2 search calls at ~100 units, 2 video calls at ~50 units). The default YouTube Data API quota is 10,000 units/day. Use JSON save/load to minimize quota usage.
- **Responsive Design**: Tables stack vertically on screens < 600px; charts are responsive via ECharts.
- **Date Handling**: Visualizations reflect video release dates (historical) as of the last API fetch or JSON load.
- **Error Handling**: Displays errors for invalid inputs, API failures, or JSON file issues.
- **ECharts**: Uses vue-echarts for bar and scatter charts, with datetime support for release dates.

## Troubleshooting

- **API Errors**:
  - Ensure the API key in backend/index.js is valid and not over quota.
  - Test the YouTube API directly (e.g., via Postman) with:
`https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=cat+videos&type=video&maxResults=50&order=relevance&key=YOUR_API_KEY`
- **CORS Issues**: 
  - Verify the backend is running at http://localhost:3000 before starting the frontend.
  - Test connectivity with curl http://localhost:3000/api/list-json.

- **Chart Rendering**:
  - Ensure vue-echarts and echarts are installed (`npm install vue-echarts@6.6.1 echarts@5.4.3`).
  - Verify the browser is up-to-date (ECharts requires modern browser support).

## JSON Files:

- Check that the backend/data directory is writable.
- Verify JSON files in the dropdown have the correct structure.

_**Note**_: some of the "working" json test datasets are available in `data` folder. Using offline datasets requires running backend server (even with empty API key).

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for bugs, features, or improvements.

## License
This project is licensed under the MIT License.