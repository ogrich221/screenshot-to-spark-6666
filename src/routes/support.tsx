import { createFileRoute } from "@tanstack/react-router";
import { FAQ, Features, PageHero, Shell, Stats } from "@/components/site";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: 'Help & Support — Lumen Bank' },
      { name: "description", content: 'Talk to a real person 24/7 by chat or phone, or find answers in our help centre.' },
      { property: "og:title", content: 'Help & Support — Lumen Bank' },
      { property: "og:description", content: 'Talk to a real person 24/7 by chat or phone, or find answers in our help centre.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <Shell>
      <PageHero eyebrow={'Help & Support'} title={'Real people, whenever you need them.'} sub={'Chat with our team in the app, call us any time, or find quick answers below.'} />
      <Features items={[['In-app chat', 'Tap Help in the app to reach a person, usually in under two minutes.'], ['24/7 phone line', 'Call the number on the back of your card, any time of day or night.'], ['Accessibility support', 'Large-print statements, screen-reader support and a priority line on request.'], ['Bereavement support', "A dedicated team to help with a loved one's accounts, gently and quickly."], ['Complaints', "Tell us what went wrong and we'll respond within 3 working days."], ['Help centre', 'Step-by-step guides for everything from setting up to switching.']]} />
      <Stats items={[['24/7', 'human support'], ['< 2 min', 'average chat reply'], ['4.8★', 'from 120,000+ reviews'], ['3 days', 'complaint response']]} />
      <FAQ items={[['How do I reset my passcode?', 'Tap Forgot passcode on the login screen and verify with your face or fingerprint.'], ['How do I close my account?', "Contact us in the app. We'll move your balance wherever you like, with no fees."], ['Where can I find my statements?', 'In the app under Account, then Statements. Download as PDF or CSV.']]} />
    </Shell>
  );
}
