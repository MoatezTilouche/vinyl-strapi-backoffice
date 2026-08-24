import type { DiscogsConnector } from './discogs.types';
import { MockDiscogsConnector } from './discogs.mock';

let connector: DiscogsConnector | undefined;

export function getDiscogsConnector(): DiscogsConnector {
  if (connector) return connector;
  const mode = process.env.DISCOGS_MODE ?? 'mock';
  if (mode !== 'mock') {
    throw new Error('Only DISCOGS_MODE=mock is implemented for this 8-hour technical test. Real API mode is optional in the brief.');
  }
  connector = new MockDiscogsConnector();
  return connector;
}
