"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
export function AccountRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className="button" type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Checking for updates…" : "Refresh status"}</button>;
}
