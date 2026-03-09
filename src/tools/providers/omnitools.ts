import { dataTools } from '../data.js';
import { documentTools } from '../document.js';
import { fileTools } from '../file.js';
import { mediaTools } from '../media.js';
import { textTools } from '../text.js';
import type { ToolProvider } from '../types.js';

export const omniToolsProvider: ToolProvider = {
  id: 'omnitools',
  name: 'OmniTools',
  getTools: () => [...textTools, ...dataTools, ...documentTools, ...fileTools, ...mediaTools],
};
