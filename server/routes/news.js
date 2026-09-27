const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const response = await axios.get('https://news.google.com/rss/search?q=India+(investing+OR+"personal+finance"+OR+"saving+money"+OR+"mutual+funds"+OR+stocks)&hl=en-IN&gl=IN&ceid=IN:en');
    const $ = cheerio.load(response.data, { xml: true });
    const newsItems = [];

    $('item').slice(0, 6).each((i, el) => {
      // Decode title to remove source prefix if it exists
      let title = $(el).find('title').text();
      const source = $(el).find('source').text() || 'Financial News';
      
      if (title.includes(` - ${source}`)) {
        title = title.replace(` - ${source}`, '');
      }

      const link = $(el).find('link').text();
      const pubDate = $(el).find('pubDate').text();
      
      // Convert publication date to relative time (e.g. "2 hours ago")
      const date = new Date(pubDate);
      const now = new Date();
      const diffMs = now - date;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      let timeStr = pubDate;
      if (diffMins < 60 && diffMins >= 0) {
        timeStr = `${diffMins || 1} min${diffMins > 1 ? 's' : ''} ago`;
      } else if (diffHrs < 24 && diffHrs > 0) {
        timeStr = `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
      } else if (diffDays > 0) {
        timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        timeStr = 'Just now';
      }

      // Assign random tags just to keep the UI looking dynamic
      const tags = ['Investing', 'Personal Finance', 'Savings', 'Stock Market', 'Mutual Funds', 'Wealth'];
      const randomTag = tags[Math.floor(Math.random() * tags.length)];

      newsItems.push({
        id: i + 1,
        title,
        link,
        source: source,
        time: timeStr,
        tag: randomTag
      });
    });

    res.json(newsItems);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).send('Server Error fetching news');
  }
});

module.exports = router;
