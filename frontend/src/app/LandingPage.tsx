import { ActivitySquare, Bone, HeartPulse, LineChart, ShieldPlus, Stethoscope } from "lucide-react";
import { HeroSection } from "@/components/ui/hero-section-5";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#061115] text-slate-50">
      <HeroSection />

      <section id="features" className="border-t border-teal-100/10 bg-[#061115] py-20">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
              Project overview
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              A guided recovery estimate for fracture care conversations.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              OrthoPredict turns familiar patient answers into the model fields it needs:
              BMI from height and weight, nutrition score from eating and hydration habits,
              and rehab adherence from therapy activity.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <FeatureBlock
              icon={<Stethoscope className="h-5 w-5" />}
              title="Patient-first intake"
              text="The form asks for age, fracture type, affected bone, height, weight, meals, hydration, rehab sessions, and clinical risk flags."
            />
            <FeatureBlock
              icon={<LineChart className="h-5 w-5" />}
              title="Personalized estimate"
              text="The result page returns predicted weeks, confidence, uncertainty, probability split, driver signals, and a printable patient summary."
            />
            <FeatureBlock
              icon={<ActivitySquare className="h-5 w-5" />}
              title="What-if simulator"
              text="Nutrition and rehab habits can be adjusted after prediction while the rest of the patient profile remains fixed."
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#08161b] py-20">
        <div className="container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
              Workflow
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              From intake to recovery range in one flow.
            </h2>
          </div>
          <div className="grid gap-4">
            <WorkflowRow
              number="01"
              title="Collect understandable inputs"
              text="People enter measurements and habits they usually know, not derived model scores."
            />
            <WorkflowRow
              number="02"
              title="Calculate hidden model fields"
              text="The frontend calculates BMI, nutrition score, and rehab adherence before calling the prediction API."
            />
            <WorkflowRow
              number="03"
              title="Explain the estimate"
              text="The results view highlights the recovery interval, confidence, top feature importance, and practical rehab tips."
            />
          </div>
        </div>
      </section>

      <section id="model" className="bg-[#030b0e] py-20 text-white">
        <div className="container grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">
              Model boundary
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Advisory output, not a diagnosis.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              The project is built as a clinical decision-support demo. It estimates
              healing time from structured inputs and keeps a disclaimer in front of
              the prediction workflow.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ModelPoint icon={<ShieldPlus className="h-5 w-5" />} text="Session disclaimer before app use" />
            <ModelPoint icon={<Bone className="h-5 w-5" />} text="Fracture and bone-specific inputs" />
            <ModelPoint icon={<HeartPulse className="h-5 w-5" />} text="Modifiable recovery habits" />
            <ModelPoint icon={<LineChart className="h-5 w-5" />} text="Confidence and uncertainty visible" />
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#061115] py-16">
        <div className="container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
              Ready to try it
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Open the prediction app.</h2>
          </div>
          <a
            href="/predict"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90"
          >
            Start prediction
          </a>
        </div>
      </section>
    </div>
  );
}

interface FeatureBlockProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

function FeatureBlock({ icon, title, text }: FeatureBlockProps) {
  return (
    <div className="rounded-[2rem] border border-teal-100/10 bg-[#0b1c22] p-6 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.85)]">
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
    </div>
  );
}

interface WorkflowRowProps {
  number: string;
  title: string;
  text: string;
}

function WorkflowRow({ number, title, text }: WorkflowRowProps) {
  return (
    <div className="grid gap-4 border-t border-teal-100/10 py-6 sm:grid-cols-[4rem_1fr]">
      <span className="text-sm font-semibold text-teal-300">{number}</span>
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-300">{text}</p>
      </div>
    </div>
  );
}

function ModelPoint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-teal-100/10 bg-[#0b1c22] p-5">
      <div className="mb-4 text-teal-200">{icon}</div>
      <p className="text-sm leading-6 text-slate-200">{text}</p>
    </div>
  );
}
