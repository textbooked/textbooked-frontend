import Link from "next/link"
import { ArrowLeft, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage account preferences for Textbooked.
          </p>
        </div>

        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Library
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Settings options will be added here in a future iteration.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
