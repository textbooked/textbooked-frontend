import Link from "next/link"
import { ArrowLeft, CircleHelp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HelpPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Help</h1>
          <p className="text-sm text-muted-foreground">
            Quick guidance for common textbook planning and assignment flows.
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
            <CircleHelp className="size-4" />
            Need help?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Use Library to create or open a book.</p>
          <p>Upload a ToC, generate pace options, then create a plan.</p>
          <p>Open plan items to generate assignments and submit attempts.</p>
        </CardContent>
      </Card>
    </section>
  )
}
