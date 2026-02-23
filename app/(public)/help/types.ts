import type { FormEvent } from "react";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type HelpPageState = {
  faqItems: FaqItem[];
  openFaqId: string;
  subject: string;
  message: string;
  isSubmitting: boolean;
  setSubject: (value: string) => void;
  setMessage: (value: string) => void;
  onToggleFaq: (id: string) => void;
  onSubmitContact: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};
