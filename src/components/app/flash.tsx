"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * Server Actions that finish by redirecting cannot hand back a form state, so
 * they tag the destination URL instead (`?saved=1`). This picks the tag up,
 * says the sentence, and strips it from the URL so a refresh or a shared link
 * does not repeat the celebration.
 */
export function Flash({
  param,
  message,
  description,
}: {
  param: string;
  message: string;
  description?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shown = React.useRef(false);

  const present = searchParams.get(param) === "1";

  React.useEffect(() => {
    if (!present || shown.current) return;
    shown.current = true;

    toast.success(message, { description });

    const params = new URLSearchParams(searchParams.toString());
    params.delete(param);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [present, message, description, param, pathname, router, searchParams]);

  return null;
}
