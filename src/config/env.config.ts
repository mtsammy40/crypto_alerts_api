require('dotenv').config();

const envMap =  {
  mongo_uri: process.env.MONGO_URI || '',
  redis_uri: process.env.REDIS_URI || '',
  novu_api_key: process.env.NOVU_API_KEY || '',
  novu_app_id: process.env.NOVU_APP_ID || '',
  novu_environment_id: process.env.NOVU_ENVIRONMENT_ID || '',
};

for (const [key, value] of Object.entries(envMap)) {
  if (value === '' || !value) {
    throw new Error(`Missing environment variable ${key}`);
  }
}

export default envMap;