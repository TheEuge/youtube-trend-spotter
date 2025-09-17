<template>
  <div class="container">
    <h1>YouTube Search Trend Spotter</h1>
    <p>Enter two search terms to compare their popularity based on video results, views, and likes, or load a JSON file
      for offline use.</p>

    <input v-model="term1" placeholder="Enter first search term (e.g., 'cat videos')" required />
    <input v-model="term2" placeholder="Enter second search term (e.g., 'dog videos')" required />
    <div class="button-group">
      <button @click="compareTerms" :disabled="loading">Compare</button>
      <button @click="downloadJson" :disabled="!lastFetchedData">Download JSON</button>
      <select v-model="selectedJson" @change="loadJsonFile" v-if="jsonFiles.length">
        <option value="" disabled>Select a JSON file</option>
        <option v-for="file in jsonFiles" :key="file" :value="file">{{ file }}</option>
      </select>
      <span v-if="loading">Loading results...</span>
    </div>
    <div v-if="error" class="input-error">{{ error }}</div>

    <hr>
    </hr>

    <div v-if="isValidResults" id="results">
      <div class="summary">
        <div style="margin-bottom: 10px;">
          <strong>{{ results.term1 }}:</strong><br />
          <u>Total Videos</u> <i>(Approx)</i>: <b>{{ results.totalResults1.toLocaleString() }}</b><br />
          <u>Top <b>{{ results.stats1.count }}</b> Videos</u> - Total Views: <b>{{
            results.stats1.totalViews.toLocaleString() }}</b> (Avg:
          <b>{{ Math.round(results.stats1.totalViews / (results.stats1.count || 1)).toLocaleString() }}</b>)<br />
          <u>Total Likes</u>: <b>{{ results.stats1.totalLikes.toLocaleString() }}</b> (Avg:
          <b>{{ Math.round(results.stats1.totalLikes / (results.stats1.count || 1)).toLocaleString() }}</b>)
        </div>
        <div>
          <strong>{{ results.term2 }}:</strong><br />
          <u>Total Videos</u> <i>(Approx)</i>: <b>{{ results.totalResults2.toLocaleString() }}</b><br />
          <u>Top <b>{{ results.stats2.count }}</b> Videos</u> - Total Views: <b>{{
            results.stats2.totalViews.toLocaleString() }}</b> (Avg:
          <b>{{ Math.round(results.stats2.totalViews / (results.stats2.count || 1)).toLocaleString() }}</b>)<br />
          <u>Total Likes</u>: <b>{{ results.stats2.totalLikes.toLocaleString() }}</b> (Avg:
          <b>{{ Math.round(results.stats2.totalLikes / (results.stats2.count || 1)).toLocaleString() }}</b>)
        </div>
        <p>
          <strong><i>Popularity Insight:</i></strong><br />
          <b>{{ results.totalResults1 > results.totalResults2 ? results.term1 : results.term2 }}</b> has more total
          videos.
          <b>{{ results.stats1.totalViews > results.stats2.totalViews ? results.term1 : results.term2 }}</b> has higher
          total
          views.
          <b>{{ results.stats1.totalLikes > results.stats2.totalLikes ? results.term1 : results.term2 }}</b> has more
          likes.
        </p>
      </div>

      <hr>
      </hr>

      <div class="chart-container">
        <h3>Total and Average Metrics Comparison</h3>
        <v-chart :option="barChartOptions" style="height: 400px;" />
      </div>

      <div v-if="isValidScatterData" class="chart-container">
        <h3>Video Release Dates and Popularity</h3>
        <v-chart :option="scatterChartOptions" style="height: 400px;" />
      </div>

      <div style="margin-top: 40px;">
        <h3>Top 50 Recent Videos for {{ results.term1 }} and {{ results.term2 }}</h3>
      </div>
      <div class="video-tables">
        <div class="video-table-container">
          <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Release Date</th>
              <th>View Count</th>
            </tr>
          </thead>
          <tbody>
          <tr v-for="video in sortedVideos(results.stats1.videos)" :key="video.videoId">
            <td><a :href="'https://youtu.be/' + video.videoId" target="_blank">{{ video.title }}</a></td>
            <td>{{ new Date(video.publishedAt).toLocaleDateString() }}</td>
            <td>{{ video.viewCount.toLocaleString() }}</td>
          </tr>
          </tbody>
          </table>
        </div>
        <div class="video-table-container">
          <table>
            <thead>
            <tr>
              <th>Title</th>
              <th>Release Date</th>
              <th>View Count</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="video in sortedVideos(results.stats2.videos)" :key="video.videoId">
              <td><a :href="'https://youtu.be/' + video.videoId" target="_blank">{{ video.title }}</a></td>
              <td>{{ new Date(video.publishedAt).toLocaleDateString() }}</td>
              <td>{{ video.viewCount.toLocaleString() }}</td>
            </tr>
          </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import VueECharts from 'vue-echarts';

export default {
  components: {
    VChart: VueECharts
  },
  data() {
    return {
      term1: '',
      term2: '',
      loading: false,
      error: '',
      results: null,
      lastFetchedData: null,
      jsonFiles: [],
      selectedJson: ''
    };
  },
  computed: {
    isValidResults() {
      return (
        this.results &&
        this.results.term1 &&
        this.results.term2 &&
        this.results.totalResults1 != null &&
        this.results.totalResults2 != null &&
        this.results.stats1 &&
        this.results.stats1.videos &&
        Array.isArray(this.results.stats1.videos) &&
        this.results.stats2 &&
        this.results.stats2.videos &&
        Array.isArray(this.results.stats2.videos)
      );
    },
    isValidScatterData() {
      return this.scatterChartOptions.series.every(series => series.data && Array.isArray(series.data) && series.data.length > 0);
    },
    barChartOptions() {
      if (!this.isValidResults) return {};
      const { term1, term2, totalResults1, totalResults2, stats1, stats2 } = this.results;
      return {
        backgroundColor: '#ffffff',
        title: { show: false },
        tooltip: { trigger: 'axis' },
        legend: { show: true },
        grid: { containLabel: true },
        xAxis: {
          type: 'category',
          data: [term1, term2],
          name: 'Search Terms'
        },
        yAxis: [
          {
            type: 'value',
            name: 'Total Videos (Thousands)',
            position: 'left'
          },
          {
            type: 'value',
            name: 'Views/Likes (Millions or Thousands)',
            position: 'right'
          }
        ],
        series: [
          {
            name: 'Total Videos (Approx)',
            type: 'bar',
            yAxisIndex: 0,
            data: [totalResults1 / 1e3, totalResults2 / 1e3],
            itemStyle: { color: 'rgba(54, 162, 235, 0.6)' }
          },
          {
            name: 'Total Views (Millions)',
            type: 'bar',
            yAxisIndex: 1,
            data: [stats1.totalViews / 1e6, stats2.totalViews / 1e6],
            itemStyle: { color: 'rgba(255, 99, 132, 0.6)' }
          },
          {
            name: 'Average Views',
            type: 'bar',
            yAxisIndex: 1,
            data: [(stats1.totalViews / (stats1.count || 1)) / 1e3, (stats2.totalViews / (stats2.count || 1)) / 1e3],
            itemStyle: { color: 'rgba(75, 192, 192, 0.6)' }
          },
          {
            name: 'Total Likes (Millions)',
            type: 'bar',
            yAxisIndex: 1,
            data: [stats1.totalLikes / 1e6, stats2.totalLikes / 1e6],
            itemStyle: { color: 'rgba(153, 102, 255, 0.6)' }
          },
          {
            name: 'Average Likes',
            type: 'bar',
            yAxisIndex: 1,
            data: [(stats1.totalLikes / (stats1.count || 1)) / 1e3, (stats2.totalLikes / (stats2.count || 1)) / 1e3],
            itemStyle: { color: 'rgba(255, 159, 64, 0.6)' }
          }
        ]
      };
    },
    scatterChartOptions() {
      if (!this.isValidResults) return {};
      const { term1, term2, stats1, stats2 } = this.results;
      const dataset1 = {
        name: `${term1} Video Views`,
        type: 'scatter',
        data: stats1.videos
          .filter(video => video.publishedAt && Number.isFinite(video.viewCount) && !isNaN(new Date(video.publishedAt).getTime()))
          .map(video => [new Date(video.publishedAt).getTime(), video.viewCount / 1e6]),
        symbolSize: 5,
        itemStyle: { color: 'rgba(54, 162, 235, 0.6)' }
      };
      const dataset2 = {
        name: `${term2} Video Views`,
        type: 'scatter',
        data: stats2.videos
          .filter(video => video.publishedAt && Number.isFinite(video.viewCount) && !isNaN(new Date(video.publishedAt).getTime()))
          .map(video => [new Date(video.publishedAt).getTime(), video.viewCount / 1e6]),
        symbolSize: 5,
        itemStyle: { color: 'rgba(255, 99, 132, 0.6)' }
      };
      const series = [dataset1, dataset2].filter(s => s.data.length > 0);
      return {
        backgroundColor: '#ffffff',
        title: { show: false },
        tooltip: {
          trigger: 'item',
          formatter: params => `${params.seriesName}: ${new Date(params.value[0]).toLocaleDateString()}, ${params.value[1].toFixed(2)}M views`
        },
        xAxis: {
          type: 'time',
          name: 'Release Date'
        },
        yAxis: {
          type: 'value',
          name: 'Views (Millions)',
          min: 0
        },
        series
      };
    }
  },
  methods: {
    async compareTerms() {
      if (!this.term1 || !this.term2) {
        this.error = 'Please enter both search terms.';
        return;
      }
      this.error = '';
      this.loading = true;
      try {
        const response = await axios.get('http://localhost:3000/api/compare', {
          params: { term1: this.term1, term2: this.term2 }
        });
        const data = response.data;
        if (
          !data ||
          !data.term1 ||
          !data.term2 ||
          data.totalResults1 == null ||
          data.totalResults2 == null ||
          !data.stats1 ||
          !Array.isArray(data.stats1.videos) ||
          !data.stats2 ||
          !Array.isArray(data.stats2.videos)
        ) {
          throw new Error('Invalid API response structure');
        }
        console.log('API Response:', JSON.stringify(data, null, 2));
        this.results = data;
        this.lastFetchedData = data;
        await this.fetchJsonFiles();
      } catch (error) {
        this.error = `Error: ${error.response?.data?.error || error.message}. Check your API key or quota.`;
        this.results = null;
      } finally {
        this.loading = false;
      }
    },
    async downloadJson() {
      if (!this.lastFetchedData) return;
      try {
        const response = await axios.post('http://localhost:3000/api/save-json', this.lastFetchedData);
        const { filename } = response.data;
        const downloadResponse = await axios.get(`http://localhost:3000/api/load-json/${filename}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([downloadResponse.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        await this.fetchJsonFiles();
      } catch (error) {
        this.error = 'Failed to save or download JSON: ' + (error.response?.data?.error || error.message);
      }
    },
    async loadJsonFile() {
      if (!this.selectedJson) return;
      try {
        const response = await axios.get(`http://localhost:3000/api/load-json/${this.selectedJson}`);
        const data = response.data;
        if (
          !data ||
          !data.term1 ||
          !data.term2 ||
          data.totalResults1 == null ||
          data.totalResults2 == null ||
          !data.stats1 ||
          !Array.isArray(data.stats1.videos) ||
          !data.stats2 ||
          !Array.isArray(data.stats2.videos)
        ) {
          throw new Error('Invalid JSON file structure');
        }
        console.log('Loaded JSON:', JSON.stringify(data, null, 2));
        this.results = data;
        this.lastFetchedData = data;
      } catch (error) {
        this.error = 'Failed to load JSON file: ' + (error.response?.data?.error || error.message);
        this.results = null;
      }
    },
    async fetchJsonFiles() {
      try {
        const response = await axios.get('http://localhost:3000/api/list-json');
        this.jsonFiles = response.data;
      } catch (error) {
        this.error = 'Failed to fetch JSON files: ' + (error.response?.data?.error || error.message);
      }
    },
    sortedVideos(videos) {
      if (!Array.isArray(videos)) return [];
      return videos
        .filter(video => video.publishedAt && video.videoId && video.title && !isNaN(new Date(video.publishedAt).getTime()))
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 50);
    }
  },
  mounted() {
    this.fetchJsonFiles();
  }
};
</script>

<style scoped>
.container {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.container h1 {
  text-align:center
}

input {
  width: 50%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #ff0000;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

button:hover {
  background: #cc0000;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-error {
  color: red;
  margin-top: 5px;
  font-size: 14px;
}

.summary {
  background: #f9f9f9;
  font-size: 16px;
  font-weight: normal;
  padding: 15px;
  margin: 10px 0;
  line-height: 1.5;
}

.chart-container {
  position: relative;
  height: 400px;
  margin: 20px 0;
}

.video-tables {
  display: flex;
  flex-direction: row;
  gap: 20px;
  margin-top: 20px;
}

.video-table-container {
  flex: 1;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.video-table-container table {
  width: 100%;
  border-collapse: collapse;
}

.video-table-container th,
.video-table-container td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.video-table-container th {
  background-color: #f4f4f4;
  position: sticky;
  top: 0;
  z-index: 1;
}

.video-table-container tr:nth-child(even) {
  background-color: #D6EEEE;
}

.video-table-container h3 {
  margin: 10px;
  font-size: 16px;
}

.video-table-container a {
  color: #0066cc;
  text-decoration: none;
}

.video-table-container a:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .button-group {
    flex-direction: column;
    align-items: flex-start;
  }
  .video-tables {
    flex-direction: column;
  }
  input {
    width: 100%;
  }
}
</style>