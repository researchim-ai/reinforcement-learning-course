import {defineConfig} from 'vite';
export default defineConfig({
 resolve:{dedupe:['three']},
 optimizeDeps:{include:['three','three/addons/utils/BufferGeometryUtils.js']},
 server:{watch:{usePolling:true}},
 build:{rollupOptions:{output:{manualChunks:{three:['three']}}}},
});
