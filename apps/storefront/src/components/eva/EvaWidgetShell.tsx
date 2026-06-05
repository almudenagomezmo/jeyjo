import { EvaWidgetLauncher } from "@/components/eva/EvaWidgetLauncher";

function isWidgetEnabled(): boolean {
  const flag = process.env.EVA_WIDGET_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return true;
}

type Props = {
  channel?: "storefront" | "intranet";
};

export function EvaWidgetShell({ channel = "storefront" }: Props) {
  if (!isWidgetEnabled()) return null;
  return <EvaWidgetLauncher channel={channel} />;
}
