import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "./admin.users";

export const Route = createFileRoute("/admin/customers/")({
  head: () => ({ meta: [{ title: "Customers — Lumen Bank Admin" }, { name: "description", content: "Search and filter Lumen Bank customers." }, { property: "og:title", content: "Customers — Lumen Bank Admin" }, { property: "og:description", content: "Search and filter Lumen Bank customers." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: UsersPage,
});
