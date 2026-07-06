import { createApp } from "vue";

import App from "./App.vue";
import router from "@/router";
import ArcoVue from "@arco-design/web-vue";
import "@arco-design/web-vue/dist/arco.css";
// CSS
import "@unocss/reset/tailwind-compat.css";
import "virtual:uno.css";
import "virtual:svg-icons-register";
import "./index.less";
import "@/utils/request";
import pinia from "@/store";
// 额外引入图标库
import ArcoVueIcon from "@arco-design/web-vue/es/icon";

const app = createApp(App);
app.use(router);
app.use(ArcoVue);
app.use(ArcoVueIcon);
app.use(pinia);
app.mount("#app");
