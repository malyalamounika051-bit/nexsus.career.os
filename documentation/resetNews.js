const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../../backend/.env') });

const CareerPulseNews = require('../../../backend/models/CareerPulseNews');
const { fetchAllFeeds } = require('../../../backend/services/rssFeedService');

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nexus';
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected.');

    console.log('Deleting existing career pulse news...');
    const delResult = await CareerPulseNews.deleteMany({});
    console.log(`Deleted ${delResult.deletedCount} items.`);

    console.log('Fetching fresh feeds...');
    const articles = await fetchAllFeeds();
    console.log(`Fetched ${articles.length} fresh articles.`);

    if (articles.length > 0) {
      for (const article of articles) {
        await CareerPulseNews.findOneAndUpdate(
          { articleUrl: article.articleUrl },
          { ...article, timestamp: new Date() },
          { upsert: true, new: true }
        );
      }
      console.log('Saved articles successfully.');
    }

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Error running feed sync:', err);
  }
}

run();
