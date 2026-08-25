import { fetchRule34, autocompleteRule34 } from './rule34.js';
import { fetchE621, autocompleteE621 } from './e621.js';
import { fetchDanbooru, autocompleteDanbooru } from './danbooru.js';
import { fetchRule34Paheal } from './rule34paheal.js';
import { fetchYande, autocompleteYande } from './yande.js';
import { fetchKonachan, autocompleteKonachan } from './konachan.js';
import { fetchXbooru } from './xbooru.js';
import { fetchReddit } from './reddit.js';

export const SOURCES = [
  { id: 'rule34', name: 'Rule34', icon: '🎨', supportsAutocomplete: true },
  { id: 'e621', name: 'e621', icon: '🐾', supportsAutocomplete: true },
  { id: 'danbooru', name: 'Danbooru', icon: '🌸', supportsAutocomplete: true },
  { id: 'yande', name: 'Yande.re', icon: '👘', supportsAutocomplete: true },
  { id: 'konachan', name: 'Konachan', icon: '🐱', supportsAutocomplete: true },
  { id: 'rule34paheal', name: 'Rule34 Paheal', icon: '⚡', supportsAutocomplete: false },
  { id: 'xbooru', name: 'Xbooru', icon: '🔞', supportsAutocomplete: false },
  { id: 'reddit', name: 'Reddit', icon: '👽', supportsAutocomplete: false },
];

export async function getFeed({
  source = 'rule34',
  tags = '',
  page = 1,
  limit = 40,
  blacklist = [],
  credentials = {},
}) {
  switch (source.toLowerCase()) {
    case 'rule34':
      return fetchRule34({ tags, page: Math.max(0, page - 1), limit, blacklist, credentials: credentials.rule34 || {} });
    case 'e621':
      return fetchE621({ tags, page, limit, blacklist, credentials: credentials.e621 || {} });
    case 'danbooru':
      return fetchDanbooru({ tags, page, limit, blacklist, credentials: credentials.danbooru || {} });
    case 'yande':
      return fetchYande({ tags, page, limit, blacklist });
    case 'konachan':
      return fetchKonachan({ tags, page, limit, blacklist });
    case 'rule34paheal':
      return fetchRule34Paheal({ tags, page: Math.max(0, page - 1), limit, blacklist });
    case 'xbooru':
      return fetchXbooru({ tags, page: Math.max(0, page - 1), limit, blacklist });
    case 'reddit':
      return fetchReddit({ subreddit: tags || 'nsfw_gifs', limit, blacklist }).catch(() => []);
    default:
      throw new Error(`Unsupported source: ${source}`);
  }
}

export async function getAutocomplete({ source = 'rule34', query = '' }) {
  switch (source.toLowerCase()) {
    case 'rule34':
      return autocompleteRule34(query);
    case 'e621':
      return autocompleteE621(query);
    case 'danbooru':
      return autocompleteDanbooru(query);
    case 'yande':
      return autocompleteYande(query);
    case 'konachan':
      return autocompleteKonachan(query);
    default:
      return [];
  }
}
