import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/styles/index.css";

import VueClickAway from "vue3-click-away";

const app = createApp(App);
app.use(router);
app.use(VueClickAway);
app.mount("#root");
