import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'JobCopilot',
    executableName: 'jobcopilot',
    asar: true,
    appBundleId: 'dev.jobcopilot.demo',
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'jobcopilot',
      setupExe: 'JobCopilot-Setup.exe',
      noMsi: true,
    }),
    new MakerZIP({}, ['darwin', 'win32', 'linux']),
    new MakerDeb({ options: { name: 'jobcopilot', productName: 'JobCopilot' } }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'apps/desktop/src/main/index.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'apps/desktop/src/preload/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
        {
          entry: 'apps/desktop/src/preload/mock-page-preload.ts',
          config: 'vite.mockpreload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
