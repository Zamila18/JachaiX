import { ModuleShell } from "@/components/shared/ModuleShell";

export function MonitorPageView() {
  return (
    <ModuleShell
      label="Monitoring"
      title="System and queue health observability"
      summary="Live infra and pipeline metrics are designed for integration with service telemetry."
      state="Demo"
    />
  );
}
