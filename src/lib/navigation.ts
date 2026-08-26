import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Images,
  LayoutDashboard,
  Ruler,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Permission } from "./permissions";

export type NavItem = {
  href: string;
  label: string;
  /** Shorter label for the phone's bottom bar. */
  shortLabel?: string;
  icon: LucideIcon;
  permission?: Permission;
  /** Whether this item appears in the phone's bottom navigation. */
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    mobile: true,
  },
  {
    href: "/app/customers",
    label: "Customers",
    icon: Users,
    permission: "customer:read",
    mobile: true,
  },
  {
    href: "/app/orders",
    label: "Orders",
    icon: ShoppingBag,
    permission: "order:read",
    mobile: true,
  },
  {
    href: "/app/measurements",
    label: "Measurements",
    shortLabel: "Measure",
    icon: Ruler,
    permission: "measurement:read",
  },
  {
    href: "/app/payments",
    label: "Payments",
    icon: CreditCard,
    permission: "payment:read",
    mobile: true,
  },
  {
    href: "/app/styles",
    label: "Style Library",
    shortLabel: "Styles",
    icon: Images,
    permission: "style:read",
  },
  {
    href: "/app/calendar",
    label: "Calendar",
    icon: CalendarDays,
    permission: "calendar:read",
  },
  {
    href: "/app/reports",
    label: "Reports",
    icon: BarChart3,
    permission: "report:read",
  },
  {
    // No permission: everyone needs to reach their own name, password and
    // devices, even if the business settings tabs are hidden from them.
    href: "/app/settings",
    label: "Settings",
    icon: Settings,
  },
];

/** The item whose section the current path belongs to. */
export function activeNavHref(pathname: string): string {
  // Longest match wins so /app/customers/123 highlights Customers, not
  // Dashboard.
  let best = "/app";
  for (const item of NAV_ITEMS) {
    if (item.href === "/app") continue;
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (item.href.length > best.length) best = item.href;
    }
  }
  return best;
}
