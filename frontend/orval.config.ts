import { defineConfig } from 'orval';

export default defineConfig({
  posApi: {
    input: {
      target: './openapi.json',
    },
    output: {
      mode: 'split',
      target: 'src/api/generated/posApi.ts',
      schemas: 'src/api/generated/model',
      client: 'swr',
      httpClient: 'fetch',
      override: {
        mutator: {
          path: './src/api/custom-fetch.ts',
          name: 'customFetch',
        },
      },
    },
  },
});
