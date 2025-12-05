const { algoliasearch } = window;

import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY, ALGOLIA_INDEX_NAME } from './config.js';

export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY);
export const index = searchClient.initIndex(ALGOLIA_INDEX_NAME);
