import { useSyncExternalStore } from 'react';
import { getState, subscribe } from '../lib/sync.js';

export const useSync = () => useSyncExternalStore(subscribe, getState);
