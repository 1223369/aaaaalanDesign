import { defineConfig } from "vite";
import AutoImport from "unplugin-auto-import/vite";
import vue from "@vitejs/plugin-vue";
import { ArcoResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import { resolve } from "path";

const config = ({ mode }) => {
  return {
    plugin: [
      vue(),
      // 自动按需引入组件
      AutoImport({
        resolvers: [
          ArcoResolver({
            // importStyle: 'less',
          }),
        ],
        imports: ["vue", "vue-router", "pinia", "@vueuse/core"],
        eslintrc: {
          enabled: true,
        },
      }),
      Components({
        directoryAsNamespace: true,
        // 自定义组件的自动导入目录
        dirs: [
          "src/components",
          "src/views/components", // 如果views 中也有可复用的组件
        ],
        // 组件的有效文件扩展名
        extensions: ["vue", "tsx"],
        resolvers: [
          // 自动引入arco
          ArcoResolver({
            // importStyle: 'less',
            resolveIcons: true,
          }),
        ],
      }),
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [resolve(process.cwd(), "src/assets/icons")],
        // 指定symbolId格式
        symbolId: "icon-[dir]-[name]",
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(config);
