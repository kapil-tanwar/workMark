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
      <PageHeader title="Settings" description="Company info and leave allocation." />
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
          <h3 className="font-semibold">Leave allocation (days per year)</h3>
          <div className="space-y-1.5">
            <Label>Casual leave</Label>
            <Input
              type="number"
              value={s.leaveAllocation.casual}
              onChange={(e) =>
                setS({ ...s, leaveAllocation: { ...s.leaveAllocation, casual: +e.target.value } })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sick leave</Label>
            <Input
              type="number"
              value={s.leaveAllocation.sick}
              onChange={(e) => setS({ ...s, leaveAllocation: { ...s.leaveAllocation, sick: +e.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Earned leave</Label>
            <Input
              type="number"
              value={s.leaveAllocation.earned}
              onChange={(e) =>
                setS({ ...s, leaveAllocation: { ...s.leaveAllocation, earned: +e.target.value } })
              }
            />
          </div>
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
