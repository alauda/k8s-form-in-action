// @ts-check

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

/**
 * @typedef {import('webpack').Configuration} Configuration
 * @param {Configuration} config
 * @returns {Configuration} mutated webpack config
 */
module.exports = config => {
  console.assert(
    !config.node,
    'Please make sure do not override original `config.node` unexpectedly',
  );

  config.node = {
    global: true,
  };

  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }

  Object.assign(config.resolve.alias, {
    'js-yaml$': require.resolve('./src/js-yaml.shim'),
    // https://github.com/webpack/webpack/issues/13413
    'original-js-yaml$': require.resolve(
      './node_modules/js-yaml/dist/js-yaml.mjs',
    ),
  });

  config.plugins.push(
    new MonacoWebpackPlugin({
      languages: ['yaml'],
      globalAPI: true,
      customLanguages: [
        {
          label: 'yaml',
          entry: '../../monaco-yaml/lib/esm/monaco.contribution',
          worker: {
            id: 'vs/language/yaml/yamlWorker',
            entry: '../../monaco-yaml/lib/esm/yaml.worker.js',
          },
        },
      ],
    }),
  );

  return config;
};
