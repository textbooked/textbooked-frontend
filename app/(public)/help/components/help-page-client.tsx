"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  MessageSquareText,
  SendHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { useHelpPage } from "../hooks/use-help-page";

export function HelpPageClient() {
  const state = useHelpPage();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Support Center</h1>
          <p className="text-sm text-muted-foreground">
            Find quick answers and contact support when something blocks your study flow.
          </p>
        </div>

        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card className="relative overflow-hidden border-border/80 bg-gradient-to-br from-background via-background to-muted/40 shadow-sm">
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-muted/40 blur-2xl" />
        <CardContent className="relative py-6">
          <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Get unstuck quickly.</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Browse common questions, then send us details if you hit a blocker.
            We&apos;ll review and follow up using your account email.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleHelp className="size-4" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.faqItems.map((faq) => {
              const isOpen = state.openFaqId === faq.id;

              return (
                <div key={faq.id} className="rounded-lg border bg-background">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    onClick={() => state.onToggleFaq(faq.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-medium">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen ? "rotate-180" : "rotate-0",
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "grid transition-all duration-200",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <Separator />
                      <p className="px-4 py-3 text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareText className="size-4" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void state.onSubmitContact(event)}>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input
                  id="subject"
                  value={state.subject}
                  onChange={(event) => state.setSubject(event.target.value)}
                  placeholder="What do you need help with?"
                  maxLength={120}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={state.message}
                  onChange={(event) => state.setMessage(event.target.value)}
                  placeholder="Share context, steps, and what you expected to happen."
                  rows={7}
                  required
                />
              </div>

              <p className="text-xs text-muted-foreground">
                We already have your account email, so no need to add contact details here.
              </p>

              <Button type="submit" className="w-full" disabled={state.isSubmitting}>
                {state.isSubmitting ? "Sending..." : "Send Message"}
                <SendHorizontal className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
