import type { CustomProjectConfig } from 'lost-pixel';

export const config: CustomProjectConfig = {
  customShots: {
    currentShotsPath: './packages/css/.lostpixel',
  },
  lostPixelProjectId: process.env.LOST_PIXEL_PROJECT_ID,
  apiKey: process.env.LOST_PIXEL_API_KEY,
  ciBuildId: process.env.GITHUB_SHA,
  ciBuildNumber: process.env.GITHUB_RUN_ID,
  repository: 'letanure/ui-lib',
  commitRef: process.env.GITHUB_REF_NAME,
  commitRefName: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME,
  commitHash: process.env.GITHUB_SHA,
};
