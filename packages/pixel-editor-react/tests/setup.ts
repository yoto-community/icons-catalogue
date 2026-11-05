import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// `globals` n'est pas activé : le nettoyage automatique de Testing Library ne
// s'installe pas tout seul, on le branche explicitement.
afterEach(() => {
  cleanup();
});
