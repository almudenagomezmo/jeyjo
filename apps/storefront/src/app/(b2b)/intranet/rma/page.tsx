import type { Metadata } from "next";
import { RmaIncidentsPanel } from "@/components/intranet/RmaIncidentsPanel";

export const metadata: Metadata = { title: "RMA e incidencias" };

export default function RmaPage() {
  return <RmaIncidentsPanel />;
}
