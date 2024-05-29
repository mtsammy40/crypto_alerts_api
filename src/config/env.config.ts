require('dotenv').config();

const envMap =  {
  mongo_uri: process.env.MONGO_URI || '',
  redis_uri: process.env.REDIS_URI || '',
};

for (const [key, value] of Object.entries(envMap)) {
  if (value === '' || !value) {
    throw new Error(`Missing environment variable ${key}`);
  }
}

export default envMap;