import type { ApartmentPlanStatus } from "@/types/floor-plan";
import { formatMoney } from "@/lib/format-money";

export { formatMoney };

export function apartmentStatusLabel(status: ApartmentPlanStatus): string {
  switch (status) {
    case "AVAILABLE":
      return "Հասանելի";
    case "RESERVED":
      return "Ամրագրված";
    case "SOLD":
      return "Վաճառված";
    case "HIDDEN":
      return "Թաքցված";
    default:
      return status;
  }
}

export function apartmentFill(status: ApartmentPlanStatus, active: boolean): string {
  if (active) {
    switch (status) {
      case "AVAILABLE":
        return "rgba(138, 115, 72, 0.45)";
      case "RESERVED":
        return "rgba(120, 110, 70, 0.4)";
      case "SOLD":
        return "rgba(90, 90, 88, 0.45)";
      default:
        return "rgba(138, 115, 72, 0.35)";
    }
  }

  switch (status) {
    case "AVAILABLE":
      return "rgba(214, 190, 140, 0.42)";
    case "RESERVED":
      return "rgba(180, 170, 140, 0.36)";
    case "SOLD":
      return "rgba(120, 120, 118, 0.4)";
    default:
      return "rgba(200, 200, 198, 0.22)";
  }
}
