import type { Method } from 'axios';

export interface ApiRequestArgs {
  url: string;
  method?: Method;
  body?: unknown;
}
