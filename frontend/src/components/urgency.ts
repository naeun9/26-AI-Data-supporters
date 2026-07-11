import type { Urgency } from "../types";

export function urgencyBadgeClass(urgency: Urgency): string {
  switch (urgency) {
    case "hot":
      return "badge badge-hot";
    case "warn":
      return "badge badge-warn";
    default:
      return "badge badge-none";
  }
}

export function urgencyTextClass(urgency: Urgency): string {
  switch (urgency) {
    case "hot":
      return "dday-text hot";
    case "warn":
      return "dday-text warn";
    default:
      return "dday-text none";
  }
}
