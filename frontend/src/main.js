import { createApp } from "vue";
import { createPinia } from "pinia";
import directives from "@/directives";
import App from "./App.vue";

const pinia = createPinia();

const app = createApp(App);
app.use(pinia);

Object.entries(directives).forEach(([name, directive]) => {
  app.directive(name, directive);
});

app.mount("#app");
