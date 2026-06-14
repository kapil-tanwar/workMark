import { createFileRoute } from "@tanstack/react-router";
import { store } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — WorkFlow HR" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  useWorkflowRefresh();
  const [s, setS] = useState(store.getSettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sync = () => setS(store.getSettings());
    sync();
    window.addEventListener("wf:change", sync);
    return () => window.removeEventListener("wf:change", sync);
  }, []);

  async function save() {
    setSaving(true);
    try {
      await store.setSettings(s);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Company info and leave policies." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">Company information</h3>
          <div className="space-y-1.5">
            <Label>Company name</Label>
            <Input value={s.companyName} onChange={(e) => setS({ ...s, companyName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>HR email</Label>
            <Input type="email" value={s.companyEmail} onChange={(e) => setS({ ...s, companyEmail: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Working hours</Label>
            <Input value={s.workingHours} onChange={(e) => setS({ ...s, workingHours: e.target.value })} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">Leave policy</h3>
          <div className="space-y-1.5">
            <Label>Monthly earned leave accrual (days)</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={s.monthlyEarnedAccrual}
              onChange={(e) => setS({ ...s, monthlyEarnedAccrual: +e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Added automatically at 00:00:01 on the 1st of every month for all active employees.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Comp-off leave is earned when employees submit overtime requests and admins approve them (0.5 for half day, 1 for full day).
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
