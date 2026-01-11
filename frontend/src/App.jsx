import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import HowToUse from './HowToUse'

const HATS = [
  {
    key: 'blue',
    label: 'Blue',
    description: 'Big picture & facilitation',
    prompt: 'Manage the process: clarify the purpose, question, scope, priorities, and the hat sequence.'
  },
  {
    key: 'white',
    label: 'White',
    description: 'Facts & information',
    prompt: 'List what is known, what is assumed, and what information/data is needed next.'
  },
  {
    key: 'red',
    label: 'Red',
    description: 'Feelings & intuitions',
    prompt: 'Surface gut reactions, hopes, fears, and stakeholder emotions (no justification needed).'
  },
  {
    key: 'yellow',
    label: 'Yellow',
    description: 'Benefits & opportunities',
    prompt: 'Identify value, upsides, and conditions under which the idea is likely to succeed.'
  },
  {
    key: 'black',
    label: 'Black',
    description: 'Risks & failure modes',
    prompt: 'Identify what could go wrong, constraints, unintended consequences, and minimum safety conditions.'
  },
  {
    key: 'green',
    label: 'Green',
    description: 'New ideas & alternatives',
    prompt: 'Generate options, improvements, lateral provocations, and quick experiments (no criticism).'
  }
]

const API_PREFIX = '/api'

const EXAMPLE_TOPIC = `We are considering replacing traditional closed-book exams with open-book, AI-assisted assessments in a university module.\n\nWe want to decide whether to adopt this change next semester, and if so, how to implement it responsibly.`

function buildStructuredText({ topic, decision, stakeholders, constraints, context }) {
  const lines = []
  if (topic?.trim()) {
    lines.push('# Topic / Problem Statement')
    lines.push(topic.trim())
    lines.push('')
  }
  if (decision?.trim()) {
    lines.push('# Decision to make (Blue Hat)')
    lines.push(decision.trim())
    lines.push('')
  }
  if (stakeholders?.trim()) {
    lines.push('# Stakeholders')
    lines.push(stakeholders.trim())
    lines.push('')
  }
  if (constraints?.trim()) {
    lines.push('# Constraints / Non-negotiables')
    lines.push(constraints.trim())
    lines.push('')
  }
  if (context?.trim()) {
    lines.push('# Context (optional)')
    lines.push(context.trim())
    lines.push('')
  }
  return lines.join('\n').trim()
}

export default function App() {
  const [mode, setMode] = useState('text')

  // Text mode fields (group-friendly template)
  const [topic, setTopic] = useState('')
  const [decision, setDecision] = useState('')
  const [stakeholders, setStakeholders] = useState('')
  const [constraints, setConstraints] = useState('')
  const [context, setContext] = useState('')

  const [fileValue, setFileValue] = useState(null)

  const [analysis, setAnalysis] = useState(null)
  const [selectedHat, setSelectedHat] = useState('blue')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [answerLength, setAnswerLength] = useState('long')

  // Student-group notes by hat (client-side only)
  const [notesByHat, setNotesByHat] = useState(() => Object.fromEntries(HATS.map((h) => [h.key, ''])))

  const resultsRef = useRef(null)

  const structuredText = useMemo(
    () => buildStructuredText({ topic, decision, stakeholders, constraints, context }),
    [topic, decision, stakeholders, constraints, context]
  )

  const isReadyToAnalyze = useMemo(() => {
    if (mode === 'text') {
      return structuredText.trim().length > 0
    }
    return Boolean(fileValue)
  }, [mode, structuredText, fileValue])

  const handleAnalyze = async () => {
    setError('')
    if (!isReadyToAnalyze) {
      setError('Please enter a topic/problem statement or upload a PDF to continue.')
      return
    }

    setLoading(true)
    setAnalysis(null)
    try {
      let response
      if (mode === 'pdf' && fileValue) {
        const formData = new FormData()
        formData.append('file', fileValue)
        formData.append('answer_length', answerLength)
        response = await fetch(`${API_PREFIX}/analyze`, {
          method: 'POST',
          body: formData
        })
      } else {
        response = await fetch(`${API_PREFIX}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: structuredText, answer_length: answerLength })
        })
      }

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}))
        throw new Error(detail.detail || 'Analysis failed. Please try again.')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      if (data?.meta?.answer_length) setAnswerLength(data.meta.answer_length)
      setSelectedHat('blue')
      setHatMenuOpen(false)
      if (resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Mobile UX: collapse hat selector to only show the active hat
  const [isMobile, setIsMobile] = useState(false)
  const [hatMenuOpen, setHatMenuOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')

    const update = () => {
      const mobile = mq.matches
      setIsMobile(mobile)
      if (!mobile) setHatMenuOpen(false)
    }

    update()

    // Modern browsers
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    }

    // Legacy fallback WITHOUT deprecated mq.addListener/removeListener
    const onResize = () => update()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  const handleDownload = async () => {
    if (!analysis) return
    setDownloadLoading(true)
    try {
      const response = await fetch(`${API_PREFIX}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, answer_length: answerLength, notes: notesByHat })
      })
      if (!response.ok) {
        throw new Error('Failed to generate PDF report.')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'SixThinkingHatsReport.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Unable to download the report.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleCopy = async () => {
    const active = analysis?.[selectedHat]
    if (!active || active.status !== 'ok') return
    try {
      await navigator.clipboard.writeText(active.content)
    } catch {
      setError('Copy failed. Your browser may block clipboard access.')
    }
  }

  const activeAnalysis = analysis?.[selectedHat]
  const activeHat = HATS.find((h) => h.key === selectedHat)

  const setNotesForHat = (hatKey, value) => {
    setNotesByHat((prev) => ({ ...prev, [hatKey]: value }))
  }

  return (
    <div className="app">
      <a className="skip-link" href="#results">
        Skip to hat outputs
      </a>
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Structured Group Thinking</p>
          <h1>Six Thinking Hats</h1>
          <p className="subtitle">
            A student-friendly tool for analysing ideas, solutions, and problem statements using disciplined
            parallel thinking. Generate one output per hat, add your group notes, and export a PDF.
          </p>
        </div>
        <div className="hero__note">
          <h2>What you get</h2>
          <ul>
            <li>Six “hats” outputs: Blue, White, Red, Yellow, Black, Green.</li>
            <li>Facilitator prompts to keep discussion focused and fair.</li>
            <li>Group notes per hat + downloadable PDF report.</li>
          </ul>
        </div>
      </header>

      <main>
        <HowToUse />

        <section id="input" className="input-panel" aria-label="Input your topic">
          <div className="input-panel__header">
            <div>
              <h2>Submit your topic</h2>
              <p>
                Paste a topic/problem statement (recommended for groups) or upload a PDF.
                The app analyses text only.
              </p>
            </div>
            <div className="mode-toggle" role="tablist" aria-label="Input mode">
              <button
                type="button"
                className={mode === 'text' ? 'active' : ''}
                onClick={() => setMode('text')}
                role="tab"
                aria-selected={mode === 'text'}
              >
                Text
              </button>
              <button
                type="button"
                className={mode === 'pdf' ? 'active' : ''}
                onClick={() => setMode('pdf')}
                role="tab"
                aria-selected={mode === 'pdf'}
              >
                PDF
              </button>
            </div>
          </div>

          <div className="mode-toggle" role="group" aria-label="Answer length">
            <button
              type="button"
              className={answerLength === 'long' ? 'active' : ''}
              onClick={() => setAnswerLength('long')}
              aria-pressed={answerLength === 'long'}
            >
              Long Answer
            </button>
            <button
              type="button"
              className={answerLength === 'short' ? 'active' : ''}
              onClick={() => setAnswerLength('short')}
              aria-pressed={answerLength === 'short'}
            >
              Short Answer
            </button>
          </div>

          {mode === 'text' ? (
            <div className="template">
              <div className="input-group">
                <label htmlFor="topic">Topic / Problem statement (required)</label>
                <textarea
                  id="topic"
                  rows="6"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Paste or type the idea, solution, or problem statement you want to analyse..."
                />
              </div>

              <div className="template__grid">
                <div className="input-group">
                  <label htmlFor="decision">Decision to make (recommended)</label>
                  <textarea
                    id="decision"
                    rows="3"
                    value={decision}
                    onChange={(event) => setDecision(event.target.value)}
                    placeholder="What should the group decide at the end? (e.g., choose option A/B, propose a plan, recommend next steps)"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="stakeholders">Stakeholders (recommended)</label>
                  <textarea
                    id="stakeholders"
                    rows="3"
                    value={stakeholders}
                    onChange={(event) => setStakeholders(event.target.value)}
                    placeholder="Who is affected and how? (e.g., students, staff, customers, community, regulators)"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="constraints">Constraints / non-negotiables (recommended)</label>
                  <textarea
                    id="constraints"
                    rows="3"
                    value={constraints}
                    onChange={(event) => setConstraints(event.target.value)}
                    placeholder="Time, budget, policies, ethics, resources, technical limits, deadlines..."
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="context">Context (optional)</label>
                  <textarea
                    id="context"
                    rows="3"
                    value={context}
                    onChange={(event) => setContext(event.target.value)}
                    placeholder="Any background that helps: history, what has been tried, why this matters, current status..."
                  />
                </div>
              </div>

              <div className="input-footer">
                <span>{structuredText.length.toLocaleString()} characters</span>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setTopic(EXAMPLE_TOPIC)
                    setDecision('Decide whether to adopt AI-assisted open-book assessment next semester, and define an implementation approach.')
                    setStakeholders('Students; instructors; teaching assistants; programme administrators; accreditation stakeholders.')
                    setConstraints('Maintain academic integrity; ensure accessibility; comply with policy; limited marking capacity; semester timeline.')
                    setContext('Recent student feedback suggests stress and rote learning; the module aims to emphasise applied reasoning and authentic work.')
                  }}
                >
                  Use example
                </button>
              </div>
            </div>
          ) : (
            <div className="input-group">
              <label htmlFor="pdf-upload">Upload a PDF (max 10MB)</label>
              <div className="file-upload">
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setFileValue(event.target.files?.[0] || null)}
                />
                <div>
                  <strong>{fileValue ? fileValue.name : 'Drag a PDF or click to browse.'}</strong>
                  <p>Images and scanned pages will not be analysed.</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}

          <div className="actions">
            <button type="button" className="primary" onClick={handleAnalyze} disabled={loading}>
              {loading ? 'Analysing…' : 'Generate hat outputs'}
            </button>
            <p className="disclaimer">
              Your input is sent to an AI service for analysis. No data is stored by this app.
            </p>
          </div>
        </section>

        <section
          id="results"
          ref={resultsRef}
          className={`results results--${selectedHat}`}
          aria-live="polite"
        >
          <div className="results__header">
            <a className="ghost link-btn" href="#input">
              Back to input
            </a>
            <div>
              <h2>Hat outputs</h2>
              <p>Select a hat to guide your next discussion phase.</p>
            </div>
            <div className="analysis-actions">
              <button
                type="button"
                className="secondary"
                onClick={handleDownload}
                disabled={!analysis || downloadLoading}
              >
                {downloadLoading ? 'Preparing PDF…' : 'Download report'}
              </button>
              <button
                type="button"
                className="secondary ghost-btn"
                onClick={handleCopy}
                disabled={!analysis || activeAnalysis?.status !== 'ok'}
              >
                Copy hat output
              </button>
            </div>
          </div>

          <div className="hat-tabs" role="tablist" aria-label="Hat selection">
            {isMobile ? (
              <>
                {/* Always show the active hat; tap to expand/collapse */}
                <button
                  key={selectedHat}
                  type="button"
                  role="tab"
                  aria-selected="true"
                  aria-expanded={hatMenuOpen}
                  className={`active hat-${selectedHat}`}
                  onClick={() => analysis && setHatMenuOpen((v) => !v)}
                  disabled={!analysis}
                >
                  <span className={`hat-dot hat-dot--${selectedHat}`} aria-hidden="true" />
                  <span>{activeHat?.label}</span>
                  <small>
                    {activeHat?.description} · {hatMenuOpen ? 'Tap to hide' : 'Tap to change'} ▾
                  </small>
                </button>

                {/* When expanded, show the other hats */}
                {hatMenuOpen &&
                  HATS.filter((h) => h.key !== selectedHat).map((hat) => (
                    <button
                      key={hat.key}
                      type="button"
                      role="tab"
                      aria-selected="false"
                      className={`hat-${hat.key}`}
                      onClick={() => {
                        setSelectedHat(hat.key)
                        setHatMenuOpen(false)
                      }}
                      disabled={!analysis}
                    >
                      <span className={`hat-dot hat-dot--${hat.key}`} aria-hidden="true" />
                      <span>{hat.label}</span>
                      <small>{hat.description}</small>
                    </button>
                  ))}
              </>
            ) : (
              HATS.map((hat) => (
                <button
                  key={hat.key}
                  type="button"
                  role="tab"
                  aria-selected={selectedHat === hat.key}
                  className={selectedHat === hat.key ? `active hat-${hat.key}` : `hat-${hat.key}`}
                  onClick={() => setSelectedHat(hat.key)}
                  disabled={!analysis}
                >
                  <span className={`hat-dot hat-dot--${hat.key}`} aria-hidden="true" />
                  <span>{hat.label}</span>
                  <small>{hat.description}</small>
                </button>
              ))
            )}
          </div>

          <div className="results-body">
            <aside className="panel" aria-label="Facilitator prompt">
              <h3>Facilitator prompt</h3>
              <p className="panel__lead">
                <strong>{activeHat?.label} Hat:</strong> {activeHat?.prompt}
              </p>
              <div className="panel__mini">
                <h4>Group move</h4>
                <ul>
                  <li>Time-box this hat (2–8 minutes depending on your task).</li>
                  <li>Everyone speaks “through the hat” (one mode at a time).</li>
                  <li>Capture notes; defer debate to the appropriate hat.</li>
                </ul>
              </div>
              <div className="panel__mini">
                <h4>When to switch hats</h4>
                <ul>
                  <li>If the group is arguing: go Blue Hat and restate the question.</li>
                  <li>If claims are unverified: go White Hat and identify needed evidence.</li>
                  <li>If creativity stalls: go Green Hat and require 10 options.</li>
                </ul>
              </div>
            </aside>

            <div className="analysis-card">
              {!analysis && (
                <div className="empty">
                  <h3>Ready when you are</h3>
                  <p>Submit text or a PDF to generate six structured hat outputs for discussion.</p>
                </div>
              )}

              {analysis && activeAnalysis?.status === 'error' && (
                <div className="error-state">
                  <h3>Output unavailable</h3>
                  <p>{activeAnalysis.message}</p>
                </div>
              )}

              {analysis && activeAnalysis?.status === 'ok' && <ReactMarkdown>{activeAnalysis.content}</ReactMarkdown>}
            </div>

            <aside className="panel" aria-label="Group notes">
              <h3>Group notes</h3>
              <p className="panel__lead">
                Capture your team’s conclusions for this hat. Notes are stored in your browser only and can be included in the PDF.
              </p>
              <label className="sr-only" htmlFor="group-notes">
                Notes for {activeHat?.label} hat
              </label>
              <textarea
                id="group-notes"
                rows="12"
                value={notesByHat[selectedHat] || ''}
                onChange={(e) => setNotesForHat(selectedHat, e.target.value)}
                placeholder={`Notes for the ${activeHat?.label} Hat...`}
              />
              <div className="notes-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setNotesForHat(selectedHat, '')}
                  disabled={!notesByHat[selectedHat]}
                >
                  Clear notes
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Built for structured student group discussions. FastAPI + React + Render.</p>
      </footer>
    </div>
  )
}
