const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your YouTube Data API key
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const MAX_RESULTS = 50;
const DATA_DIR = path.join(__dirname, 'data');

fs.mkdir(DATA_DIR, { recursive: true }).catch(console.error);

app.use(cors());
app.use(express.json());

async function fetchVideoIds(query) {
    const params = new URLSearchParams({
        part: 'id,snippet',
        q: query,
        type: 'video',
        maxResults: MAX_RESULTS,
        order: 'relevance',
        key: API_KEY
    });
    const response = await fetch(`${SEARCH_URL}?${params}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return {
        totalResults: data.pageInfo.totalResults,
        items: data.items.map(item => ({
            videoId: item.id.videoId,
            publishedAt: item.snippet.publishedAt,
            title: item.snippet.title
        })).filter(item => item.videoId)
    };
}

async function fetchVideoStats(videoIds, publishedDates, titles) {
    if (videoIds.length === 0) return { totalViews: 0, totalLikes: 0, count: 0, videos: [] };

    const params = new URLSearchParams({
        part: 'statistics,snippet',
        id: videoIds.join(','),
        key: API_KEY
    });
    const response = await fetch(`${VIDEOS_URL}?${params}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const videos = data.items.map((item, index) => ({
        videoId: videoIds[index],
        title: titles[index],
        viewCount: parseInt(item.statistics.viewCount || 0),
        likeCount: parseInt(item.statistics.likeCount || 0),
        publishedAt: publishedDates[index]
    }));

    const totalViews = videos.reduce((sum, video) => sum + video.viewCount, 0);
    const totalLikes = videos.reduce((sum, video) => sum + video.likeCount, 0);
    return { totalViews, totalLikes, count: videos.length, videos };
}

app.get('/api/compare', async (req, res) => {
    const { term1, term2 } = req.query;
    if (!term1 || !term2) {
        return res.status(400).json({ error: 'Both search terms are required' });
    }

    try {
        const { totalResults: totalResults1, items: items1 } = await fetchVideoIds(term1);
        const videoIds1 = items1.map(item => item.videoId);
        const publishedDates1 = items1.map(item => item.publishedAt);
        const titles1 = items1.map(item => item.title);
        const stats1 = await fetchVideoStats(videoIds1, publishedDates1, titles1);

        const { totalResults: totalResults2, items: items2 } = await fetchVideoIds(term2);
        const videoIds2 = items2.map(item => item.videoId);
        const publishedDates2 = items2.map(item => item.publishedAt);
        const titles2 = items2.map(item => item.title);
        const stats2 = await fetchVideoStats(videoIds2, publishedDates2, titles2);

        const data = {
            term1,
            term2,
            totalResults1,
            totalResults2,
            stats1,
            stats2
        };

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/save-json', async (req, res) => {
    try {
        const data = req.body;
        const filename = `youtube_data_${data.term1}_${data.term2}_${Date.now()}.json`;
        const filepath = path.join(DATA_DIR, filename);
        await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        res.json({ filename });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save JSON' });
    }
});

app.get('/api/load-json/:filename', async (req, res) => {
    try {
        const filepath = path.join(DATA_DIR, req.params.filename);
        const data = await fs.readFile(filepath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to load JSON' });
    }
});

app.get('/api/list-json', async (req, res) => {
    try {
        const files = await fs.readdir(DATA_DIR);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        res.json(jsonFiles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list JSON files' });
    }
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});