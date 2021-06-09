/* eslint-disable import/no-unresolved -- https://github.com/webpack/webpack/issues/13413 */

import { DEFAULT_SCHEMA, Schema } from 'original-js-yaml';

Schema.create =
  Schema.create ||
  ((...args) => {
    let [schemas, customTags] = args;
    if (args.length < 2) {
      customTags = schemas;
    }
    return DEFAULT_SCHEMA.extend({
      implicit: schemas,
      explicit: customTags,
    });
  });

export * from 'original-js-yaml';
