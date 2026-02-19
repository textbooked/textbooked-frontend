"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  MessageSquareText,
  SendHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FaqItem } from "./types";
import { wait } from "@/lib/utils/helpers";


const FAQ_ITEMS: FaqItem[] = [
  {
    id: "book-setup",
    question: "How do I get started with a new textbook?",
    answer:
      "Add your textbook from the Library, then open it, generate pace options, and create a plan. Once the plan is created, start from the current section in the Plan tab.",
  },
  {
    id: "activities",
    question: "What is an activity?",
    answer:
      "An activity is one unit of work inside a section, like Reading, Assignment, Review, or Test. Activities are scheduled inside your weekly plan.",
  },
  {
    id: "current-section",
    question: "How is the current section selected?",
    answer:
      "Textbooked focuses the earliest TODO activity first. If all activities are complete, it focuses the most recent completed activity.",
  },
  {
    id: "pace-change",
    question: "Can I change pace after creating a plan?",
    answer:
      "Not yet in the current release. Pace is locked after plan creation. A restart flow is planned to let you pick a new pace and start date.",
  },
  {
    id: "toc-use",
    question: "What can I do in the ToC tab?",
    answer:
      "The ToC tab is for exploring structure only. You can expand and collapse sections quickly to understand chapter breakdowns without leaving the page.",
  },
  {
    id: "status-toggle",
    question: "What does Mark Done / Mark TODO do?",
    answer:
      "It updates activity completion status in your study plan so progress and focus stay accurate. This supports optimistic updates for fast UI response.",
  },
];

const HelpPage = () => {
  const [openFaqId, setOpenFaqId] = useState<string>(FAQ_ITEMS[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!subject.trim()) {
      toast.error("Please add a short subject.");
      return;
    }

    if (message.trim().length < 10) {
      toast.error("Please provide a bit more detail in your message.");
      return;
    }

    setIsSubmitting(true);

    try {
      await wait(600);
      toast.success("Thanks. Your message was captured.");
      setSubject("");
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

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
            Back to Library
          </Link>
        </Button>
      </div>

      <Card className="relative overflow-hidden border-border/80 bg-gradient-to-br from-background via-background to-muted/40 shadow-sm">
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-muted/40 blur-2xl" />
        <CardContent className="relative py-6">
          <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
            Get unstuck quickly.
          </h2>
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
            {FAQ_ITEMS.map((faq) => {
              const isOpen = openFaqId === faq.id;

              return (
                <div key={faq.id} className="rounded-lg border bg-background">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    onClick={() => setOpenFaqId((current) => (current === faq.id ? "" : faq.id))}
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
                      <p className="px-4 py-3 text-sm text-muted-foreground">
                        {faq.answer}
                      </p>
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
            <form className="space-y-4" onSubmit={(event) => void onSubmitContact(event)}>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
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
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Share context, steps, and what you expected to happen."
                  rows={7}
                  required
                />
              </div>

              <p className="text-xs text-muted-foreground">
                We already have your account email, so no need to add contact details here.
              </p>

              <Button type="submit" className="w-full flex-row" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
                <SendHorizontal className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default HelpPage;
