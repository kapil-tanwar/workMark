import { request } from "./client";

export async function getNotifications() {
  const data = await request("/api/notifications");
  return data.notifications || [];
}

export async function markNotificationAsRead(id) {
  const data = await request(`/api/notifications/${id}/read`, { method: "PATCH" });
  return data.notification;
}

export async function markAllNotificationsAsRead() {
  return request("/api/notifications/read-all", { method: "PATCH" });
}
