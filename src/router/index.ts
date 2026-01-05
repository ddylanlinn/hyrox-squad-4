import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import RaceGuide from "../views/RaceGuide.vue";
import Timeline from "../views/Timeline.vue";

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
  {
    path: "/timeline",
    name: "Timeline",
    component: Timeline,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
