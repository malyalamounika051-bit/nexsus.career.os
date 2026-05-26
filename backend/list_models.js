const axios = require('axios');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const API_KEY = process.env.NVIDIA_API_KEY;

(async () => {
  try {
    const res = await axios.get('https://integrate.api.nvidia.com/v1/models', {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });
    console.log('Available NVIDIA NIM Models:');
    res.data.data.forEach(m => {
      console.log(` - ${m.id}`);
    });
  } catch (err) {
    console.error('Error fetching models:', err.message, err.response?.data);
  }
})();
