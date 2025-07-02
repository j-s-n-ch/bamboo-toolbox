import { createWebHashHistory, createRouter } from "vue-router";

const routes = [{ path: "/", component: () => import("@/GearTool.vue") }];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
