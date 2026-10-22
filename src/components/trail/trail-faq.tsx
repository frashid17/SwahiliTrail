import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_DATA = [
  {
    question: "What is Swahili Trail?",
    answer:
      "Swahili Trail helps you plan Kenya trips - explore places and events, build day-by-day itineraries, match stays, and ask a multilingual guide.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. Free includes Guide, Planner, and Stay & Eat with a monthly AI allowance. Trail Plus raises fair-use limits for deeper itinerary work.",
  },
  {
    question: "How do I pay for Trail Plus?",
    answer:
      "Checkout runs through Paystack. You can pay with M-Pesa or card. Trail Plus unlocks for 30 days after payment; paying again extends your period.",
  },
  {
    question: "Which languages does the guide support?",
    answer:
      "The guide can reply in English, Kiswahili, and several other languages - useful for roads, matatus, meals, and local phrases.",
  },
  {
    question: "Is travel information guaranteed?",
    answer:
      "No. Information is for planning only. Always verify fees, visas, road conditions, and safety with official sources before you go.",
  },
];

export function TrailFaq() {
  return (
    <section>
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6 lg:px-8 xl:py-24">
        <div className="flex animate-in fade-in slide-in-from-top-10 flex-col items-center gap-4 fill-mode-both duration-1000 ease-in-out">
          <Badge
            variant="outline"
            className="h-auto border-0 px-3 py-1 text-sm outline outline-border"
          >
            FAQs
          </Badge>
          <h2 className="max-w-lg text-center font-display text-3xl font-medium sm:text-5xl">
            Got questions? We’ve got answers ready
          </h2>
        </div>
        <Accordion
          type="single"
          collapsible
          className="flex w-full flex-col gap-6"
        >
          {FAQ_DATA.map((faq, index) => (
            <AccordionItem
              key={`item-${index}`}
              value={`item-${index}`}
              className={cn(
                "group/item flex flex-col gap-3 rounded-2xl border border-border p-6 transition-colors data-open:bg-accent animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-700",
                index === 0 && "delay-100",
                index === 1 && "delay-200",
                index === 2 && "delay-300",
                index === 3 && "delay-400",
                index === 4 && "delay-500",
              )}
            >
              <AccordionTrigger className="cursor-pointer p-0 text-left text-lg font-medium hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden sm:text-xl">
                {faq.question}
                <PlusIcon className="h-6 w-6 shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-45" />
              </AccordionTrigger>
              <AccordionContent className="p-0 text-base text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
