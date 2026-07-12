import { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MiniHeader } from "../components/MiniHeader";
import { QUESTIONS } from "../data/quiz";
import { ALL_CAREER_PERIODS } from "../api/kised";
import { useAppState } from "../state/AppState";
import type { TypeKey } from "../types";
import "./TestPage.css";

const TYPE_ORDER: TypeKey[] = ["tech", "idea", "mainstreet", "career", "comeback"];

export function TestPage() {
  const navigate = useNavigate();
  const { myStage, setMyStage, completeTest } = useAppState();
  const [phase, setPhase] = useState<"stage" | "quiz">("stage");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(TypeKey | null)[]>(Array(QUESTIONS.length).fill(null));

  const question = QUESTIONS[index];
  const progress = Math.round(((index + 1) / QUESTIONS.length) * 100);

  function finish(finalAnswers: (TypeKey | null)[]) {
    const tally: Record<TypeKey, number> = { tech: 0, idea: 0, mainstreet: 0, career: 0, comeback: 0 };
    finalAnswers.forEach((t) => {
      if (t) tally[t] += 1;
    });
    const winner = TYPE_ORDER.reduce((best, key) => (tally[key] > tally[best] ? key : best), TYPE_ORDER[0]);
    completeTest(winner);
    navigate("/test/result");
  }

  function pickStage(stage: string) {
    setMyStage(stage);
    setPhase("quiz");
  }

  function pick(type: TypeKey) {
    const next = [...answers];
    next[index] = type;
    setAnswers(next);
    if (index === QUESTIONS.length - 1) {
      finish(next);
    } else {
      setTimeout(() => setIndex((i) => i + 1), 180);
    }
  }

  return (
    <div>
      <MiniHeader
        title="유형 검사"
        sticky
        maxWidth={640}
        right={
          <button className="btn-text mini-exit" onClick={() => navigate("/")}>
            나가기 <X size={16} />
          </button>
        }
      />
      <main className="test-main">
        {phase === "stage" ? (
          <>
            <div className="test-question-block">
              <span className="badge badge-soft">준비 단계</span>
              <h1>창업 준비 단계가 어떻게 되세요?</h1>
            </div>

            <div className="test-options">
              {ALL_CAREER_PERIODS.map((stage) => {
                const selected = myStage === stage;
                return (
                  <button
                    key={stage}
                    className={`test-option${selected ? " selected" : ""}`}
                    onClick={() => pickStage(stage)}
                  >
                    {stage}
                  </button>
                );
              })}
            </div>

            <div className="test-nav-row" style={{ justifyContent: "flex-end" }}>
              <button className="btn-text" onClick={() => setPhase("quiz")}>
                건너뛰기 →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="test-progress-row">
              <span className="test-progress-count">
                질문 {index + 1} / {QUESTIONS.length}
              </span>
            </div>
            <div className="test-progress-track">
              <div className="test-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="test-question-block">
              <span className="badge badge-soft">Q{index + 1}</span>
              <h1>{question.text}</h1>
            </div>

            <div className="test-options">
              {question.options.map((opt) => {
                const selected = answers[index] === opt.type;
                return (
                  <button
                    key={opt.key}
                    className={`test-option${selected ? " selected" : ""}`}
                    onClick={() => pick(opt.type)}
                  >
                    <span className={`test-option-badge${selected ? " selected" : ""}`}>{opt.key}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="test-nav-row">
              {index > 0 ? (
                <button className="btn-text" onClick={() => setIndex((i) => i - 1)}>
                  ← 이전
                </button>
              ) : (
                <button className="btn-text" onClick={() => setPhase("stage")}>
                  ← 이전
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
