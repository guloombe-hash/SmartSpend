module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Transform import.meta → { url: undefined } for Metro web compatibility (Firebase v12)
      function () {
        return {
          visitor: {
            MetaProperty(path) {
              path.replaceWithSourceString('({ url: undefined })');
            },
          },
        };
      },
    ],
  };
};
