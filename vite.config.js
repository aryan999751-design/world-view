import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';

export default defineConfig({
  plugins:[
    react(),
    viteStaticCopy({
      targets:[
        {src:'node_modules/cesium/Build/Cesium/Workers',dest:'cesium'},
        {src:'node_modules/cesium/Build/Cesium/ThirdParty',dest:'cesium'},
        {src:'node_modules/cesium/Build/Cesium/Assets',dest:'cesium'},
        {src:'node_modules/cesium/Build/Cesium/Widgets',dest:'cesium'}
      ]
    })
  ],
  define:{CESIUM_BASE_URL:JSON.stringify('/cesium')},
  resolve:{alias:{'@':path.resolve(process.cwd(),'src')}},
  server:{port:5173}
});
