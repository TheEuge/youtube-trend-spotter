const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const port = 3000;

// Load API key from environment variable
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error('Error: API_KEY is not set in .env file');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
fs.mkdir(DATA_DIR, { recursive: true }).catch(console.error);

app.use(cors());
app.use(express.json());

// Compare two search terms
app.get('/api/compare', async (req, res) => {
  const { term1, term2 } = req.query;
  if (!term1 || !term2) {
    return res.status(400).json({ error: 'Both term1 and term2 are required' });
  }

  try {
    // Fetch search results for term1 and term2
    const searchUrl1 = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(term1)}&type=video&maxResults=50&order=relevance&key=${API_KEY}`;
    const searchUrl2 = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(term2)}&type=video&maxResults=50&order=relevance&key=${API_KEY}`;

    const [response1, response2] = await Promise.all([
      fetch(searchUrl1).then(res => res.json()),
      fetch(searchUrl2).then(res => res.json())
    ]);

    if (response1.error || response2.error) {
      throw new Error(response1.error?.message || response2.error?.message || 'YouTube API error');
    }

    const videoIds1 = response1.items.map(item => item.id.videoId).join(',');
    const videoIds2 = response2.items.map(item => item.id.videoId).join(',');

    // Fetch video details
    const videoUrl1 = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds1}&key=${API_KEY}`;
    const videoUrl2 = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds2}&key=${API_KEY}`;

    const [videoResponse1, videoResponse2] = await Promise.all([
      fetch(videoUrl1).then(res => res.json()),
      fetch(videoUrl2).then(res => res.json())
    ]);

    if (videoResponse1.error || videoResponse2.error) {
      throw new Error(videoResponse1.error?.message || videoResponse2.error?.message || 'YouTube API error');
    }

    // Process stats for term1
    const stats1 = {
      totalViews: 0,
      totalLikes: 0,
      count: videoResponse1.items.length,
      videos: videoResponse1.items.map(item => ({
        videoId: item.id,
        title: item.snippet.title,
        viewCount: parseInt(item.statistics.viewCount || 0),
        likeCount: parseInt(item.statistics.likeCount || 0),
        publishedAt: item.snippet.publishedAt
      }))
    };
    stats1.totalViews = stats1.videos.reduce((sum, video) => sum + video.viewCount, 0);
    stats1.totalLikes = stats1.videos.reduce((sum, video) => sum + video.likeCount, 0);

    // Process stats for term2
    const stats2 = {
      totalViews: 0,
      totalLikes: 0,
      count: videoResponse2.items.length,
      videos: videoResponse2.items.map(item => ({
        videoId: item.id,
        title: item.snippet.title,
        viewCount: parseInt(item.statistics.viewCount || 0),
        likeCount: parseInt(item.statistics.likeCount || 0),
        publishedAt: item.snippet.publishedAt
      }))
    };
    stats2.totalViews = stats2.videos.reduce((sum, video) => sum + video.viewCount, 0);
    stats2.totalLikes = stats2.videos.reduce((sum, video) => sum + video.likeCount, 0);

    res.json({
      term1,
      term2,
      totalResults1: response1.pageInfo.totalResults,
      totalResults2: response2.pageInfo.totalResults,
      stats1,
      stats2
    });
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Save JSON data
app.post('/api/save-json', async (req, res) => {
  try {
    const data = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `comparison-${timestamp}.json`;
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    res.json({ filename });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save JSON' });
  }
});

// Load JSON data
app.get('/api/load-json/:filename', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, req.params.filename);
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load JSON' });
  }
});

// List JSON files
app.get('/api/list-json', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    res.json(files.filter(file => file.endsWith('.json')));
  } catch (error) {
    res.status(500).json({ error: 'Failed to list JSON files' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});