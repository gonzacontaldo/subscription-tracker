// eslint-disable-next-line @typescript-eslint/no-var-requires
const appJson = require('./app.json');

module.exports = () => {
  const extra = appJson.expo?.extra ?? {};

  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      extra: {
        ...extra,
        apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000',
      },
    },
  };
};
