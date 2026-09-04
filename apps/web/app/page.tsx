import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { appConfig } from "@/lib/appConfig";
import { routes } from "@/lib/routes";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-2xl py-10 text-center">
      <p className="font-semibold text-violet-600">
        A quick word hunt through a maze of letters
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
        {appConfig.name}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
        {appConfig.description}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          className="inline-flex min-h-11 items-center rounded-lg bg-violet-600 px-5 font-semibold text-white hover:bg-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          href={routes.play}
        >
          Play
        </Link>
        <Link
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 font-semibold hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-slate-700 dark:hover:bg-slate-800"
          href={routes.daily}
        >
          Daily Challenge
        </Link>
        <Link
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 font-semibold hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-slate-700 dark:hover:bg-slate-800"
          href={routes.practice}
        >
          Practice
        </Link>
      </div>
      <Card className="mt-12 text-left">
        <h2 className="font-semibold">How it works</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Find each listed word by dragging through adjacent letters. Cross out
          every target before time runs out, then jump straight into another
          puzzle.
        </p>
      </Card>
    </section>
  );
}
