"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { seleccionarInterfazInicial } from "@backend/server/actions/preferencia-interfaz";
import {
  INTERFACE_VARIANTS,
  type InterfaceVariant,
} from "@backend/config/interface-variants";
import { cn } from "@/lib/utils";

type InterfaceScores = Record<InterfaceVariant, number>;

type OnboardingOption = {
  variant: InterfaceVariant;
  text: string;
};

type OnboardingQuestion = {
  title: string;
  options: OnboardingOption[];
};

const QUESTIONS: OnboardingQuestion[] = [
  {
    title: "Como prefieres recorrer tus cursos?",
    options: [
      {
        variant: "creative",
        text: "Explorando ambientes visuales y descubriendo contenido de forma libre.",
      },
      {
        variant: "business",
        text: "Con informacion directa, ordenada y enfocada en avanzar rapidamente.",
      },
      {
        variant: "educational",
        text: "Siguiendo una estructura clara de contenidos, modulos y objetivos.",
      },
      {
        variant: "gamified",
        text: "Superando niveles, retos y viendo constantemente mi progreso.",
      },
    ],
  },
  {
    title: "Que te gustaria encontrar primero al entrar?",
    options: [
      {
        variant: "creative",
        text: "Una experiencia visual con cursos destacados y contenido para descubrir.",
      },
      {
        variant: "business",
        text: "Mis cursos, progreso y acciones pendientes de forma inmediata.",
      },
      {
        variant: "educational",
        text: "Mi ruta academica, contenidos y siguiente leccion.",
      },
      {
        variant: "gamified",
        text: "Mi nivel, progreso, retos y proxima mision.",
      },
    ],
  },
  {
    title: "Como prefieres que se presente la informacion?",
    options: [
      {
        variant: "creative",
        text: "Visual, dinamica y con mayor protagonismo de imagenes y ambientes.",
      },
      {
        variant: "business",
        text: "Compacta, profesional y orientada a datos.",
      },
      {
        variant: "educational",
        text: "Organizada, clara y facil de estudiar paso a paso.",
      },
      {
        variant: "gamified",
        text: "Interactiva, con indicadores, recompensas y objetivos visibles.",
      },
    ],
  },
  {
    title: "Que te motiva mas a continuar aprendiendo?",
    options: [
      {
        variant: "creative",
        text: "Descubrir experiencias y contenidos nuevos.",
      },
      {
        variant: "business",
        text: "Ver resultados concretos y avanzar eficientemente.",
      },
      {
        variant: "educational",
        text: "Comprender claramente lo que estoy aprendiendo.",
      },
      {
        variant: "gamified",
        text: "Completar retos, desbloquear etapas y alcanzar metas.",
      },
    ],
  },
];

const FINAL_VARIANT_DETAILS = {
  creative: {
    label: "Interfaz Creativa",
    description:
      "Visual e inmersiva. Da mayor protagonismo a imagenes, ambientes y exploracion.",
    icon: Sparkles,
  },
  business: {
    label: "Interfaz Empresarial",
    description:
      "Directa y profesional. Prioriza progreso, informacion y acciones importantes.",
    icon: BarChart3,
  },
  educational: {
    label: "Interfaz Educativa",
    description:
      "Clara y estructurada. Organiza el aprendizaje para avanzar paso a paso.",
    icon: BookOpenCheck,
  },
  gamified: {
    label: "Interfaz Gamificada",
    description:
      "Dinamica y orientada a retos. Destaca niveles, progreso y objetivos.",
    icon: Trophy,
  },
} as const satisfies Record<
  InterfaceVariant,
  {
    label: string;
    description: string;
    icon: LucideIcon;
  }
>;

function createEmptyScores(): InterfaceScores {
  return {
    creative: 0,
    business: 0,
    educational: 0,
    gamified: 0,
  };
}

function getRecommendedVariant(answers: (InterfaceVariant | null)[]): InterfaceVariant {
  const scores = createEmptyScores();

  for (const answer of answers) {
    if (answer) scores[answer] += 1;
  }

  const maxScore = Math.max(...INTERFACE_VARIANTS.map((variant) => scores[variant]));
  const winners = INTERFACE_VARIANTS.filter((variant) => scores[variant] === maxScore);
  const lastAnswer = answers.at(-1);

  if (lastAnswer && winners.includes(lastAnswer)) {
    return lastAnswer;
  }

  return winners[0] ?? "creative";
}

function ProgressDots({ currentQuestion }: { currentQuestion: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {QUESTIONS.map((question, index) => (
        <span
          key={question.title}
          className={cn(
            "h-2.5 rounded-full transition-all duration-200 motion-reduce:transition-none",
            index <= currentQuestion ? "w-6 bg-[#91DC00]" : "w-2.5 bg-white/28",
          )}
        />
      ))}
    </div>
  );
}

function VariantIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/12 bg-white/8 text-[#91DC00]">
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}

export function OnboardingInterfaz() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(InterfaceVariant | null)[]>(
    () => QUESTIONS.map(() => null),
  );
  const [showResult, setShowResult] = useState(false);
  const [showManualOptions, setShowManualOptions] = useState(false);
  const [selectedFinalVariant, setSelectedFinalVariant] = useState<InterfaceVariant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const question = QUESTIONS[currentQuestion] ?? QUESTIONS[0]!;
  const selectedAnswer = answers[currentQuestion] ?? null;
  const recommendedVariant = useMemo(() => getRecommendedVariant(answers), [answers]);
  const finalVariant = selectedFinalVariant ?? recommendedVariant;
  const recommendedDetails = FINAL_VARIANT_DETAILS[recommendedVariant];
  const FinalRecommendedIcon = recommendedDetails.icon;

  function selectAnswer(variant: InterfaceVariant) {
    setAnswers((current) =>
      current.map((answer, index) => (index === currentQuestion ? variant : answer)),
    );
  }

  function goNext() {
    if (!selectedAnswer) return;
    if (currentQuestion === QUESTIONS.length - 1) {
      setShowResult(true);
      return;
    }
    setCurrentQuestion((value) => value + 1);
  }

  function goBack() {
    if (showResult) {
      setShowResult(false);
      setShowManualOptions(false);
      return;
    }
    setCurrentQuestion((value) => Math.max(0, value - 1));
  }

  function saveVariant(variant: InterfaceVariant) {
    setSelectedFinalVariant(variant);
    setError(null);
    startSaving(async () => {
      const result = await seleccionarInterfazInicial({ variant });
      if (!result.ok) {
        setError(result.mensaje ?? "No se pudo guardar la preferencia.");
        return;
      }

      router.replace("/mis-cursos");
      router.refresh();
    });
  }

  return (
    <main className="relative flex min-h-dvh overflow-hidden bg-[#061120] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden="true"
      >
        <div className="absolute -left-28 top-[-12rem] size-[26rem] rounded-full bg-[#00896F]/24 blur-3xl" />
        <div className="absolute right-[-10rem] top-20 size-[30rem] rounded-full bg-[#91DC00]/14 blur-3xl" />
        <div className="absolute bottom-[-14rem] left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-cyan-400/12 blur-3xl" />
      </div>

      <section className="relative mx-auto flex w-full max-w-3xl items-center">
        <div className="w-full rounded-[28px] border border-white/14 bg-white/[0.075] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur-2xl sm:p-8">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#91DC00]">
                <Compass className="size-4" aria-hidden="true" />
                Personaliza tu experiencia
              </div>
              <h1 className="text-2xl font-bold tracking-normal text-white sm:text-3xl">
                Elige como quieres aprender
              </h1>
            </div>

            {!showResult && (
              <div className="shrink-0 space-y-2">
                <p className="text-sm font-medium text-white/72">
                  Pregunta {currentQuestion + 1} de {QUESTIONS.length}
                </p>
                <ProgressDots currentQuestion={currentQuestion} />
              </div>
            )}
          </div>

          {showResult ? (
            <div className="space-y-7">
              <div className="rounded-3xl border border-[#91DC00]/24 bg-[#91DC00]/8 p-5 text-center sm:p-7">
                <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[#91DC00] text-[#061120]">
                  <FinalRecommendedIcon className="size-7" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#91DC00]">
                  Tu experiencia recomendada
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white">
                  {recommendedDetails.label}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/74">
                  {recommendedDetails.description}
                </p>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => saveVariant(recommendedVariant)}
                  className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#91DC00] px-5 py-2.5 text-sm font-bold text-[#061120] transition hover:bg-[#7fc400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102030] disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {isSaving && finalVariant === recommendedVariant ? "Guardando preferencia..." : "Usar esta interfaz"}
                  {!isSaving && <Check className="size-4" aria-hidden="true" />}
                </button>
                <div>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setShowManualOptions((value) => !value)}
                    className="mt-4 text-sm font-semibold text-white/76 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102030] disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    Elegir otra opcion
                  </button>
                </div>
              </div>

              {showManualOptions && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {INTERFACE_VARIANTS.map((variant) => {
                    const details = FINAL_VARIANT_DETAILS[variant];
                    const isSelected = finalVariant === variant;
                    return (
                      <article
                        key={variant}
                        className={cn(
                          "flex h-full flex-col gap-4 rounded-2xl border bg-white/[0.055] p-4",
                          isSelected ? "border-[#91DC00]/70" : "border-white/12",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <VariantIcon icon={details.icon} />
                          <div className="min-w-0">
                            <h3 className="font-bold text-white">{details.label}</h3>
                            <p className="mt-1 text-sm leading-5 text-white/68">
                              {details.description}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => saveVariant(variant)}
                          className="mt-auto min-h-10 rounded-xl border border-white/16 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#91DC00]/60 hover:bg-[#91DC00]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102030] disabled:cursor-not-allowed disabled:opacity-65"
                        >
                          {isSaving && finalVariant === variant ? "Guardando..." : "Seleccionar"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-7">
              <div
                key={currentQuestion}
                className="space-y-5 transition duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none animate-in fade-in slide-in-from-right-3"
              >
                <h2 className="text-xl font-bold leading-tight text-white sm:text-2xl">
                  {question.title}
                </h2>

                <div className="grid gap-3">
                  {question.options.map((option) => {
                    const isSelected = selectedAnswer === option.variant;
                    return (
                      <button
                        key={option.variant}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectAnswer(option.variant)}
                        className={cn(
                          "flex min-h-16 items-center justify-between gap-4 rounded-2xl border p-4 text-left text-sm leading-6 transition duration-200 motion-reduce:transition-none",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102030]",
                          isSelected
                            ? "border-[#91DC00]/70 bg-[#91DC00]/12 text-white shadow-[0_0_0_1px_rgba(145,220,0,0.12)]"
                            : "border-white/12 bg-white/[0.055] text-white/76 hover:border-white/26 hover:bg-white/[0.08] hover:text-white",
                        )}
                      >
                        <span>{option.text}</span>
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-full border",
                            isSelected
                              ? "border-[#91DC00] bg-[#91DC00] text-[#061120]"
                              : "border-white/24 text-transparent",
                          )}
                          aria-hidden="true"
                        >
                          <Check className="size-4" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={currentQuestion === 0}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/12 px-4 py-2.5 text-sm font-semibold text-white/76 transition hover:border-white/24 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102030] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Atras
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={!selectedAnswer}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#91DC00] px-5 py-2.5 text-sm font-bold text-[#061120] transition hover:bg-[#7fc400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102030] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {currentQuestion === QUESTIONS.length - 1 ? "Ver recomendacion" : "Continuar"}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-5 rounded-xl border border-red-300/30 bg-red-500/12 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
