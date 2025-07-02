import { createApp } from "vue";
import { createPinia } from "pinia";
import { router } from "./routes";
import directives from "@/directives";
import App from "./App.vue";

const pinia = createPinia();

const app = createApp(App);
app.use(pinia);
app.use(router);

Object.entries(directives).forEach(([name, directive]) => {
  app.directive(name, directive);
});

router.isReady().then(() => {
  app.mount("#app");
});
