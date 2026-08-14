import { request } from "./client";

export async function sendAiMessage(message) {
  return request("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
