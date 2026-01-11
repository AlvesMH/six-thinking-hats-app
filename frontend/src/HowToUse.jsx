import { useState } from 'react'

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="howto__section">
      <button
        type="button"
        className={open ? 'howto__toggle open' : 'howto__toggle'}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="howto__toggleTitle">{title}</span>
        <span className="howto__toggleIcon" aria-hidden="true">
          {open ? '–' : '+'}
        </span>
      </button>
      {open && <div className="howto__content">{children}</div>}
    </div>
  )
}

export default function HowToUse() {
  return (
    <section className="howto" aria-label="How to use Six Thinking Hats">
      <div className="howto__header">
        <h2>How to use this app (student group workflow)</h2>
        <p>
          This tool is designed for face-to-face teamwork and online synchronous discussion.
          It supports disciplined “parallel thinking”: your group focuses on one thinking mode at a time,
          then deliberately switches modes together.
        </p>
      </div>

      <div className="howto__grid">
        <Section title="1) Set up the task (Blue Hat)" defaultOpen>
          <ol>
            <li>
              Agree on the <strong>topic</strong> you want to analyse (idea, solution, or problem statement).
            </li>
            <li>
              Use the app’s input template to add context:
              <ul>
                <li><strong>Decision to make</strong> (What will we decide at the end?)</li>
                <li><strong>Constraints</strong> (time, budget, policy rules, ethics, resources)</li>
                <li><strong>Stakeholders</strong> (who is affected and how)</li>
              </ul>
            </li>
            <li>
              Choose <strong>Long Answer</strong> if you want richer prompts for discussion, or <strong>Short Answer</strong>
              if you are time-boxed.
            </li>
            <li>
              Run the analysis. Start by reading the <strong>Blue Hat</strong> output to confirm the question and the plan.
            </li>
          </ol>
          <p className="howto__tip">
            Facilitation tip: The Blue Hat is the “chair”. Keep it neutral and process-focused.
            If the group is stuck or arguing, return to Blue Hat and restate the question.
          </p>
        </Section>

        <Section title="2) Run a high-quality discussion round (recommended sequence)">
          <p>
            A common sequence for group decision-making is:
            <strong> Blue → White → Red → Yellow → Black → Green → Blue</strong>.
            Start and finish with Blue Hat.
          </p>
          <ul>
            <li>
              <strong>Blue (2–3 min):</strong> confirm goals, sequence, time-boxes, and roles.
            </li>
            <li>
              <strong>White (5–8 min):</strong> list facts, assumptions, and what you need to verify.
            </li>
            <li>
              <strong>Red (30–90 sec):</strong> quick “gut check” reactions (no debate).
            </li>
            <li>
              <strong>Yellow (4–6 min):</strong> capture benefits and the conditions for success.
            </li>
            <li>
              <strong>Black (4–6 min):</strong> identify risks, failure modes, and constraints (constructive pessimism).
            </li>
            <li>
              <strong>Green (6–10 min):</strong> generate alternatives and experiments (no criticism).
            </li>
            <li>
              <strong>Blue (2–4 min):</strong> prioritise next actions and decide what happens next.
            </li>
          </ul>
          <p className="howto__tip">
            Parallel thinking works best when everyone speaks from the same hat at the same time.
            If someone “switches hats” (e.g., criticising during Green Hat), gently park that point and return to it in the right hat.
          </p>
        </Section>

        <Section title="3) Use the outputs as a worksheet, not as the answer">
          <ul>
            <li>
              Treat each hat output as a <strong>discussion scaffold</strong>. The goal is to surface what matters,
              not to accept the AI output uncritically.
            </li>
            <li>
              Add your group’s conclusions in the <strong>Group notes</strong> panel. This helps you distinguish:
              <ul>
                <li>what the model suggested,</li>
                <li>what your group agrees with, and</li>
                <li>what you reject or want to verify.</li>
              </ul>
            </li>
            <li>
              Use <strong>Copy</strong> to paste a hat output into a shared document (Google Doc / Word / Teams / Zoom chat)
              so each person can annotate live.
            </li>
          </ul>
        </Section>

        <Section title="4) Handle discomfort and disagreement productively">
          <p>
            Some people find “wearing a hat” unnatural or uncomfortable. This is expected.
            The method deliberately forces the brain into distinct thinking modes.
          </p>
          <ul>
            <li>
              <strong>Validate the feeling</strong> (Red Hat), then return to the agreed process (Blue Hat).
            </li>
            <li>
              Remind the group: <strong>Black Hat is not negativity</strong>; it is a safety function.
              The “mismatch detector” helps spot danger and weak assumptions.
            </li>
            <li>
              Protect Green Hat time: defer criticism and let creativity run before evaluation.
            </li>
            <li>
              If conflict escalates: pause, reframe the question (Blue), and run a short Red Hat “temperature check”.
            </li>
          </ul>
        </Section>

        <Section title="5) Turn discussion into decisions and actions (closing Blue Hat)">
          <ol>
            <li>
              From Yellow + Black: write a single sentence stating the <strong>best version of the idea</strong> and its
              <strong>main risk conditions</strong>.
            </li>
            <li>
              From White: list the <strong>top 3 unknowns</strong> that must be verified.
            </li>
            <li>
              From Green: select <strong>one low-cost experiment</strong> (or prototype/pilot) you can run quickly.
            </li>
            <li>
              Use Blue Hat to assign owners, deadlines, and success criteria.
            </li>
            <li>
              Download the PDF report to attach to your submission or meeting notes.
            </li>
          </ol>
        </Section>
      </div>
    </section>
  )
}
