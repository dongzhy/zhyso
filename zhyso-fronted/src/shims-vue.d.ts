/* eslint-disable */
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "vue-router" {
  import type {
    RouteRecordRaw,
    Router,
    createRouter,
    createWebHistory,
  } from "vue-router";
  export { RouteRecordRaw, Router, createRouter, createWebHistory };
}
