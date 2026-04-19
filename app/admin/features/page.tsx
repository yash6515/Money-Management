"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Slider } from "@/components/ui/slider";
import type { FeatureFlag } from "@/lib/types";

export default function AdminFeatures() {
  const { user: me } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);

  useEffect(() => {
    (async () => setFlags(await store.listFeatureFlags()))();
  }, []);

  async function toggle(key: string, enabled: boolean) {
    await store.updateFeatureFlag(key, { enabled });
    if (me) await store.addAdminLog({ admin_id: me.id, admin_name: me.name, action: "toggle_feature", target_id: key, metadata: { enabled } });
    setFlags(await store.listFeatureFlags());
  }

  async function rollout(key: string, pct: number) {
    await store.updateFeatureFlag(key, { rollout_percentage: pct });
    setFlags(await store.listFeatureFlags());
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-bold">Feature Flags</h1>
        <p className="text-xs text-muted-foreground">Toggle features · gradual rollout · no redeploy</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {flags.map((f) => (
          <Card key={f.key}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-mono">{f.key}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{f.description}</CardDescription>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={f.enabled}
                    onChange={(e) => toggle(f.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:bg-teal peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform"></div>
                </label>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Rollout</span>
                <Badge variant="outline" className="text-[10px]">{f.rollout_percentage}%</Badge>
              </div>
              <Slider value={f.rollout_percentage} min={0} max={100} step={5} onChange={(v) => rollout(f.key, v)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
