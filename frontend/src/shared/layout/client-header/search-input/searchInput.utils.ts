import { APP_ROUTING_PATHS } from '../../../../app/routing';

export const SEARCH_AUTOCOMPLETE_MIN_CHARS = 2;
export const SEARCH_AUTOCOMPLETE_DEBOUNCE_MS = 320;
export const SEARCH_AUTOCOMPLETE_LIMIT = 8;

export const normalizeSearchQuery = (query: string) => query.trim();

export const canRequestAutocomplete = (query: string) => (
  normalizeSearchQuery(query).length >= SEARCH_AUTOCOMPLETE_MIN_CHARS
);

export const getSearchPagePath = (query: string, page = 1) => (
  APP_ROUTING_PATHS.APP_SEARCH_PAGE(normalizeSearchQuery(query), page)
);
