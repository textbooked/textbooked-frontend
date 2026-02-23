"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { wait } from "@/lib/utils/helpers";

import type { FaqItem, HelpPageState } from "../types";

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "book-setup",
    question: "How do I get started with a new textbook?",
    answer:
      "Start from Home and create your first study plan. You can also open the Library to manage sources, then create and run your plan from there.",
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

export function useHelpPage(): HelpPageState {
  const [openFaqId, setOpenFaqId] = useState<string>(FAQ_ITEMS[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqItems = useMemo(() => FAQ_ITEMS, []);

  const onToggleFaq = useCallback((id: string) => {
    setOpenFaqId((current) => (current === id ? "" : id));
  }, []);

  const onSubmitContact = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
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
  }, [message, subject]);

  return {
    faqItems,
    openFaqId,
    subject,
    message,
    isSubmitting,
    setSubject,
    setMessage,
    onToggleFaq,
    onSubmitContact,
  };
}
