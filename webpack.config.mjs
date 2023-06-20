// @ts-check

import path from 'node:path';

import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

/**
 * @typedef {import("webpack").Configuration} Configuration
 * @param {Configuration} config
 * @returns {Configuration} mutated webpack config
 */
export default config => {
  console.assert(
    !config.node,
    'Please make sure do not override original `config.node` unexpectedly',
  );

  config.module.rules.push({
    test: /node_modules[/\\]monaco-editor[/\\]esm[/\\].+\.css$/i,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: {
          // https://github.com/webpack/webpack-dev-server/issues/1815#issuecomment-1181720815
          url: false,
        },
      },
    ],
  });

  config.node = {
    global: true,
  };

  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }

  Object.assign(config.resolve.alias, {
    'js-yaml$': path.resolve('./src/js-yaml.shim.js'), // https://github.com/webpack/webpack/issues/13413
    'original-js-yaml$': path.resolve(
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
          entry: '../../monaco-yaml/index.js',
          worker: {
            id: 'vs/language/yaml/yamlWorker',
            entry: '../../monaco-yaml/yaml.worker.js',
          },
        },
      ],
    }),
  );

  return config;
};
