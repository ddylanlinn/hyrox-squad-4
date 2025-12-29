import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import RaceGuide from "../views/RaceGuide.vue";

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
  },
  {
    path: "/race-guide",
    name: "RaceGuide",
    component: RaceGuide,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
