import { useState, useEffect, useRef, useCallback } from 'react'
import './DiscoveryChat.css'

// ── Sidebar sections ──────────────────────────────────────
const SECTIONS = [
  { label: 'About You',            icon: '👤' },
  { label: 'Real Behavior',        icon: '🔍' },
  { label: 'Pain Points',          icon: '⚡' },
  { label: 'Memory & Contacts',    icon: '🧠' },
  { label: 'Advice & Vibes',       icon: '💬' },
  { label: 'Getting Things Done',  icon: '✅' },
  { label: 'Workarounds',          icon: '🔧' },
  { label: 'Your Ideal Solution',  icon: '🚀' },
  { label: 'Follow-Up',            icon: '📩' },
]

// ── Question flow ─────────────────────────────────────────
// type: 'yesno' | 'choice' | 'multiselect' | 'text' | 'longtext'
// conditional: (responses) => boolean — skips question if false
// maxSelect: number — only for multiselect
// hasOther: boolean — adds a free-text "Other" entry
const FLOW = [
  // ── Section 0: About You ─────────────────────────────────
  {
    section: 0, key: 'role',
    sectionLabel: 'Section 1 of 9 — About You',
    ask: "Hey! 👋 Thanks for taking a few minutes for this.\n\nI want to understand how people actually get help and advice in real life. No right or wrong answers — just honest experiences.\n\nLet's start: what best describes you?",
    type: 'choice',
    options: ['Working mom', 'Stay-at-home mom', 'Working professional (non-mom)', 'Other'],
    hasOther: true,
  },
  {
    section: 0, key: 'children',
    ask: 'How many children do you have?',
    type: 'choice',
    options: ['0', '1', '2', '3+'],
  },
  {
    section: 0, key: 'work_setup',
    ask: 'What is your current work setup?',
    type: 'choice',
    options: ['Full-time', 'Part-time', 'Freelance / Business owner', 'Not working currently'],
  },

  // ── Section 1: Real Behavior ──────────────────────────────
  {
    section: 1, key: 'last_help',
    sectionLabel: 'Section 2 of 9 — Real Behavior',
    ask: "Think about the last time you needed help, advice, or a recommendation — for example: daycare, a doctor, a school, a class, or a service.\n\nWhat did you do first?",
    type: 'longtext',
    placeholder: 'e.g. I asked a friend, Googled it, posted in a group…',
  },
  {
    section: 1, key: 'who_reached',
    ask: 'Who did you reach out to? Why them specifically?',
    type: 'longtext',
    placeholder: 'e.g. My neighbor Sarah, because she has kids the same age…',
  },
  {
    section: 1, key: 'contact_method',
    ask: 'How did you contact them?',
    type: 'choice',
    options: ['WhatsApp / text', 'Phone call', 'Social media (Facebook groups, etc.)', 'In person', 'Other'],
    hasOther: true,
  },
  {
    section: 1, key: 'multiple_people',
    ask: 'Did you reach out to multiple people?',
    type: 'yesno',
  },
  {
    section: 1, key: 'why_others',
    ask: 'How did you decide who else to ask?',
    type: 'longtext',
    placeholder: 'e.g. I thought of people who had been through similar situations…',
    conditional: r => r.multiple_people === true,
  },

  // ── Section 2: Pain Points ────────────────────────────────
  {
    section: 2, key: 'frustration',
    sectionLabel: 'Section 3 of 9 — Pain Points',
    ask: "Thanks for sharing that. 🙏\n\nWhat was the most frustrating part of that experience?",
    type: 'longtext',
    placeholder: "e.g. I didn't know who to ask, took too long to get a response\u2026",
  },
  {
    section: 2, key: 'missing_person',
    ask: 'Did you feel like you were missing someone who would have been perfect to ask — but didn\'t reach out to them?',
    type: 'yesno',
  },
  {
    section: 2, key: 'why_not_reached',
    ask: 'Why didn\'t you reach out to them?',
    type: 'choice',
    options: [
      "Didn't remember them",
      "Didn't have their contact",
      "Didn't know they had that expertise",
      "Felt awkward reaching out",
      "Other",
    ],
    hasOther: true,
    conditional: r => r.missing_person === true,
  },

  // ── Section 3: Memory & Contacts ─────────────────────────
  {
    section: 3, key: 'cant_remember',
    sectionLabel: 'Section 4 of 9 — Memory & Contacts',
    ask: 'Have you ever thought — "I know someone who knows about this… but I can\'t remember who"?',
    type: 'choice',
    options: ['Frequently', 'Sometimes', 'Rarely', 'Never'],
  },
  {
    section: 3, key: 'contact_tracking',
    ask: 'Where do you currently keep track of useful contacts, if at all? (Select all that apply)',
    type: 'multiselect',
    options: ['In my head', 'Phone contacts', 'WhatsApp chats', 'Notes app', 'Nowhere', 'Other'],
    hasOther: true,
  },
  {
    section: 3, key: 'saved_contact',
    ask: 'Have you ever saved a contact or message just because they might be useful later?',
    type: 'yesno',
  },
  {
    section: 3, key: 'find_later',
    ask: 'And when you needed it — were you able to find it?',
    type: 'choice',
    options: ['Always', 'Sometimes', 'Rarely'],
    conditional: r => r.saved_contact === true,
  },

  // ── Section 4: Advice & Vibes ─────────────────────────────
  {
    section: 4, key: 'advice_matters',
    sectionLabel: 'Section 5 of 9 — Advice & Vibes',
    ask: 'When asking for advice, what matters most to you? Pick your top 2.',
    type: 'multiselect',
    maxSelect: 2,
    options: [
      'Trust (I know them well)',
      'Experience (they\'ve done it before)',
      'Similar situation (same age kids, job, etc.)',
      'Availability / responsiveness',
      'Personality / "vibe"',
      'Other',
    ],
    hasOther: true,
  },
  {
    section: 4, key: 'group_ask',
    ask: 'Have you ever wanted to ask a group of people instead of reaching out to someone one-on-one?',
    type: 'yesno',
  },
  {
    section: 4, key: 'group_where',
    ask: 'Where did you go for that?',
    type: 'choice',
    options: ['WhatsApp groups', 'Facebook groups', 'Slack / community', "Didn't know where to go", 'Other'],
    hasOther: true,
    conditional: r => r.group_ask === true,
  },
  {
    section: 4, key: 'group_dislike',
    ask: 'What do you dislike about those group conversations?',
    type: 'longtext',
    placeholder: 'e.g. Too much noise, irrelevant replies, feel judged…',
    conditional: r => r.group_ask === true,
  },

  // ── Section 5: Getting Things Done ───────────────────────
  {
    section: 5, key: 'task_stopped',
    sectionLabel: 'Section 6 of 9 — Getting Things Done',
    ask: "Think of something you've been meaning to do — book an appointment, follow up with someone, enroll your child in something.\n\nWhat stopped you from doing it?",
    type: 'longtext',
    placeholder: 'e.g. Kept forgetting, didn\'t know where to start, too busy…',
  },
  {
    section: 5, key: 'rely_others',
    ask: 'Do you ever rely on others to remind or push you to take action?',
    type: 'yesno',
  },
  {
    section: 5, key: 'followup_tracking',
    ask: 'How do you currently track things you need to follow up on? (Select all that apply)',
    type: 'multiselect',
    options: ['Calendar', 'Notes', 'To-do apps', 'Messages', "I don't track consistently", 'Other'],
    hasOther: true,
  },

  // ── Section 6: Workarounds ────────────────────────────────
  {
    section: 6, key: 'workarounds',
    sectionLabel: 'Section 7 of 9 — Workarounds',
    ask: "This one is really valuable — be as specific as you can.\n\nHave you created any personal system or hack to manage: useful people, advice, or tasks you need to follow up on?",
    type: 'longtext',
    placeholder: 'e.g. I have a WhatsApp group just for local recs, a note with \"go-to\" contacts…',
  },

  // ── Section 7: Validation ─────────────────────────────────
  {
    section: 7, key: 'magic_solve',
    sectionLabel: 'Section 8 of 9 — Your Ideal Solution',
    ask: "Almost done! 🙌\n\nIf you could magically solve one problem related to getting help, advice, or recommendations — what would it be?",
    type: 'longtext',
    placeholder: 'Describe your ideal scenario…',
  },
  {
    section: 7, key: 'trust_tool',
    ask: 'What would make you trust a tool that helps you reach out to the "right person"?',
    type: 'longtext',
    placeholder: 'e.g. It knows my network, privacy controls, personal recommendations from friends…',
  },

  // ── Section 8: Follow-Up ──────────────────────────────────
  {
    section: 8, key: 'followup_open',
    sectionLabel: 'Section 9 of 9 — Follow-Up',
    ask: "Last question — no pressure at all.\n\nWould you be open to a 15-minute follow-up conversation?",
    type: 'yesno',
  },
  {
    section: 8, key: 'followup_contact',
    ask: "Great! Please share your email or phone number so we can reach out. Completely optional.",
    type: 'text',
    placeholder: 'email@example.com or +1 (555) 000-0000',
    conditional: r => r.followup_open === true,
  },
]

const TOTAL_QUESTIONS = FLOW.length

// ── Message helpers ───────────────────────────────────────
let msgId = 0
const agentMsg = (text, meta = {}) => ({ id: ++msgId, from: 'agent', text, ...meta })
const userMsg  = (text)            => ({ id: ++msgId, from: 'user',  text })

// ── Sub-components ────────────────────────────────────────

// Single-select choice picker (including yes/no)
function ChoicePicker({ options, hasOther, answered, onSelect }) {
  const [otherOpen, setOtherOpen] = useState(false)
  const [otherVal, setOtherVal]   = useState('')
  const [selected, setSelected]   = useState(null)

  if (answered) return null

  const handleOption = (opt) => {
    if (opt === 'Other' && hasOther) {
      setOtherOpen(true)
      setSelected('Other')
    } else {
      setOtherOpen(false)
      setSelected(opt)
      onSelect(opt, opt)
    }
  }

  return (
    <div>
      <div className="dc-choices">
        {options.map(opt => (
          <button
            key={opt}
            className={`dc-choice-btn${selected === opt ? ' dc-choice-btn--selected' : ''}`}
            onClick={() => handleOption(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      {otherOpen && (
        <div className="dc-other-input">
          <input
            autoFocus
            type="text"
            placeholder="Please specify…"
            value={otherVal}
            onChange={e => setOtherVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && otherVal.trim()) {
                onSelect(`Other: ${otherVal.trim()}`, `Other: ${otherVal.trim()}`)
              }
            }}
          />
          <button
            disabled={!otherVal.trim()}
            onClick={() => otherVal.trim() && onSelect(`Other: ${otherVal.trim()}`, `Other: ${otherVal.trim()}`)}
          >
            OK
          </button>
        </div>
      )}
    </div>
  )
}

// Multi-select chip picker
function MultiSelectPicker({ options, hasOther, maxSelect, answered, onDone }) {
  const [selected, setSelected] = useState([])
  const [otherOpen, setOtherOpen] = useState(false)
  const [otherVal, setOtherVal]   = useState('')

  if (answered) return null

  const atMax = maxSelect && selected.filter(s => s !== 'Other').length >= maxSelect

  const toggle = (opt) => {
    if (opt === 'Other' && hasOther) {
      setOtherOpen(v => !v)
      if (selected.includes('Other')) {
        setSelected(s => s.filter(x => x !== 'Other'))
        setOtherOpen(false)
      } else {
        setSelected(s => [...s, 'Other'])
        setOtherOpen(true)
      }
      return
    }
    if (selected.includes(opt)) {
      setSelected(s => s.filter(x => x !== opt))
    } else {
      if (!atMax || !maxSelect) {
        setSelected(s => [...s, opt])
      }
    }
  }

  const handleConfirm = () => {
    const final = selected.map(s => s === 'Other' && otherVal.trim() ? `Other: ${otherVal.trim()}` : s)
    const display = final.join(', ') || 'None'
    onDone(final, display)
  }

  return (
    <div>
      <div className="dc-multisel">
        {options.map(opt => {
          const isOn = selected.includes(opt)
          const isMaxed = atMax && !isOn && opt !== 'Other'
          return (
            <button
              key={opt}
              className={`dc-mchip${isOn ? ' dc-mchip--on' : ''}${isMaxed ? ' dc-mchip--maxed' : ''}`}
              onClick={() => toggle(opt)}
            >
              {isOn && (
                <svg viewBox="0 0 10 10" fill="none" width="10" height="10">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {opt}
            </button>
          )
        })}
      </div>
      {otherOpen && (
        <div className="dc-other-input">
          <input
            autoFocus
            type="text"
            placeholder="Please specify…"
            value={otherVal}
            onChange={e => setOtherVal(e.target.value)}
          />
        </div>
      )}
      <button
        className="dc-multisel-confirm"
        disabled={selected.length === 0}
        onClick={handleConfirm}
      >
        {maxSelect ? `Confirm (${selected.length}/${maxSelect})` : `Confirm selection${selected.length > 0 ? ` (${selected.length})` : ''}`}
      </button>
    </div>
  )
}

// Review summary shown just before submit
function ReviewCard({ responses, flow, onSubmit }) {
  const answered = flow.filter(q => responses[q.key] !== undefined && responses[q.key] !== null)
  return (
    <div className="dc-review">
      <div className="dc-review__header">
        📋 Here's a summary of your responses
      </div>
      <div className="dc-review__rows">
        {answered.map(q => {
          const val = responses[q.key]
          const display = Array.isArray(val) ? val.join(', ') : (val === true ? 'Yes' : val === false ? 'No' : String(val))
          // Shorten the ask to a label
          const label = q.ask.length > 60 ? q.ask.slice(0, 57).replace(/\n.*/s, '').trim() + '…' : q.ask.replace(/\n.*/s, '').trim()
          return (
            <div key={q.key} className="dc-review__row">
              <span className="dc-review__label">{label}</span>
              <span className="dc-review__value">{display || '—'}</span>
            </div>
          )
        })}
      </div>
      <div className="dc-review__actions">
        <button className="dc-review__submit" onClick={onSubmit}>
          <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
            <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Submit responses
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function DiscoveryChat() {
  const [messages,    setMessages]    = useState([])
  const [responses,   setResponses]   = useState({})
  const [qIdx,        setQIdx]        = useState(-1)
  const [isTyping,    setIsTyping]    = useState(false)
  const [inputVal,    setInputVal]    = useState('')
  const [done,        setDone]        = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [answeredIds, setAnsweredIds] = useState(new Set())

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const bootedRef      = useRef(false)
  const textareaRef    = useRef(null)

  // Resolve next unskipped question from index i onward
  const getQuestion = useCallback((i, resp) => {
    for (let j = i; j < FLOW.length; j++) {
      const q = FLOW[j]
      if (!q.conditional || q.conditional(resp)) return { q, i: j }
    }
    return null
  }, [])

  const currentEntry = qIdx >= 0 && !done ? getQuestion(qIdx, responses) : null
  const currentQ     = currentEntry?.q
  const activeSection = done ? SECTIONS.length - 1 : (currentQ ? currentQ.section : 0)

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Boot: welcome + first question
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true

    const first = getQuestion(0, {})
    if (!first) return

    setTimeout(() => {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages([agentMsg(first.q.ask, { qType: first.q.type, qKey: first.q.key, qIdx: first.i, sectionLabel: first.q.sectionLabel, options: first.q.options, hasOther: first.q.hasOther, maxSelect: first.q.maxSelect })])
        setQIdx(first.i)
      }, 900)
    }, 300)
  }, [getQuestion])

  const pushAgent = useCallback((text, meta = {}) => {
    return new Promise(resolve => {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        const m = agentMsg(text, meta)
        setMessages(prev => [...prev, m])
        resolve(m)
      }, 750)
    })
  }, [])

  const advanceFlow = useCallback(async (newResp, answeredMsgId) => {
    if (answeredMsgId !== undefined) {
      setAnsweredIds(prev => new Set([...prev, answeredMsgId]))
    }

    const next = getQuestion(qIdx + 1, newResp)

    if (!next) {
      // All done — show review
      setQIdx(FLOW.length)
      await pushAgent("That's everything! 🎉 Here's a summary of your responses. Ready to submit?")
      setDone(true)
      return
    }

    const { q, i } = next
    const prevQ = FLOW[qIdx]

    // Acknowledgment when crossing section boundary
    if (prevQ && q.section !== prevQ.section) {
      const acks = ["Got it!", "Perfect, thanks.", "That's really helpful.", "Noted!", "Love that answer.", "Thanks for sharing."]
      await pushAgent(acks[Math.floor(Math.random() * acks.length)])
    }

    await pushAgent(q.ask, {
      qType: q.type,
      qKey:  q.key,
      qIdx:  i,
      sectionLabel: q.sectionLabel,
      options:  q.options,
      hasOther: q.hasOther,
      maxSelect: q.maxSelect,
    })
    setQIdx(i)
  }, [qIdx, getQuestion, pushAgent])

  const handleAnswer = useCallback(async (value, displayText, agentMsgId) => {
    setMessages(prev => [...prev, userMsg(displayText)])
    setInputVal('')
    if (textareaRef.current) textareaRef.current.style.height = ''

    const newResp = { ...responses, [FLOW[qIdx].key]: value }
    setResponses(newResp)

    await advanceFlow(newResp, agentMsgId)
    inputRef.current?.focus()
  }, [responses, qIdx, advanceFlow])

  // Text / longtext submit
  const handleTextSubmit = (e) => {
    e?.preventDefault()
    if (!inputVal.trim() || !currentQ) return
    const lastAgent = [...messages].reverse().find(m => m.from === 'agent')
    handleAnswer(inputVal.trim(), inputVal.trim(), lastAgent?.id)
  }

  const handleSubmit = () => {
    // Save to localStorage
    const submission = {
      id: Date.now(),
      submittedAt: new Date().toISOString(),
      responses,
    }
    try {
      const existing = JSON.parse(localStorage.getItem('fp_discovery_submissions') || '[]')
      existing.push(submission)
      localStorage.setItem('fp_discovery_submissions', JSON.stringify(existing))
    } catch (_) {}
    setSubmitted(true)
  }

  const showTextInput = currentQ && (currentQ.type === 'text' || currentQ.type === 'longtext') && !done
  const isLongText    = currentQ?.type === 'longtext'

  // Completed — show thank you
  if (submitted) {
    return (
      <div className="dc-page dc-page--done">
        <div className="dc-done-card">
          <div className="dc-done-icon">
            <svg viewBox="0 0 64 64" fill="none" width="36" height="36">
              <circle cx="32" cy="32" r="30" stroke="var(--fp-teal)" strokeWidth="2"/>
              <path d="M18 32l10 10 18-18" stroke="var(--fp-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="dc-done-title">Thank you! 🙏</h2>
          <p className="dc-done-sub">
            Your responses have been recorded. This is exactly the kind of insight that helps us build something truly useful.<br /><br />
            {responses.followup_open === true
              ? "We'll be in touch for the follow-up conversation!"
              : "If you ever want to share more, feel free to come back."}
          </p>
          <button className="dc-done-btn" onClick={() => { setSubmitted(false); setDone(false); setMessages([]); setResponses({}); setQIdx(-1); setAnsweredIds(new Set()); bootedRef.current = false }}>
            Start over
          </button>
        </div>
      </div>
    )
  }

  // Answered Q count for progress
  const answeredCount = Object.keys(responses).length
  const progressPct   = TOTAL_QUESTIONS > 0 ? Math.round((answeredCount / TOTAL_QUESTIONS) * 100) : 0

  return (
    <div className="dc-page">

      {/* ── Nav ── */}
      <nav className="dc-nav">
        <div className="dc-nav__logo">
          <div className="dc-nav__icon">✦</div>
          <span className="dc-nav__brand">FinitePaths</span>
          <span className="dc-nav__badge">User Discovery</span>
        </div>
        <div className="dc-nav__right">
          <span className="dc-nav__qcount">
            {answeredCount} / {TOTAL_QUESTIONS} answered
          </span>
          <div className="dc-nav__progbar">
            <div className="dc-nav__progfill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </nav>

      {/* ── Shell ── */}
      <div className="dc-shell">

        {/* ── Sidebar ── */}
        <aside className="dc-sidebar">
          <div className="dc-sidebar__title">Progress</div>
          {SECTIONS.map((s, i) => {
            const status = i < activeSection ? 'done' : i === activeSection ? 'active' : 'pending'
            return (
              <div key={i} className={`dc-step dc-step--${status}`}>
                <div className="dc-step__dot">
                  {status === 'done'
                    ? <svg viewBox="0 0 10 10" fill="none" width="10" height="10">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    : i + 1
                  }
                </div>
                <div className="dc-step__label">{s.label}</div>
              </div>
            )
          })}
        </aside>

        {/* ── Chat ── */}
        <div className="dc-chat">

          {/* Topbar */}
          <div className="dc-chat__topbar">
            <div className="dc-chat__av">✦</div>
            <div>
              <div className="dc-chat__name">FP Discovery</div>
              <div className="dc-chat__sub">User Research Assistant</div>
            </div>
            <div className="dc-online">
              <div className="dc-online__dot" />
              Live
            </div>
          </div>

          {/* Messages */}
          <div className="dc-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`dc-msg dc-msg--${msg.from}`}>
                {msg.from === 'agent' && (
                  <div className="dc-msg__av dc-msg__av--agent">✦</div>
                )}
                <div className="dc-msg__col">

                  {/* Section label chip */}
                  {msg.from === 'agent' && msg.sectionLabel && (
                    <div className="dc-section-chip">
                      <svg viewBox="0 0 10 10" fill="none" width="8" height="8">
                        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M5 3v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {msg.sectionLabel}
                    </div>
                  )}

                  <div className="dc-bubble">{msg.text}</div>

                  {/* Yes/No */}
                  {msg.from === 'agent' && msg.qType === 'yesno' && (
                    <ChoicePicker
                      options={['Yes', 'No']}
                      answered={answeredIds.has(msg.id)}
                      onSelect={(_, display) => handleAnswer(display === 'Yes', display, msg.id)}
                    />
                  )}

                  {/* Single-select choice */}
                  {msg.from === 'agent' && msg.qType === 'choice' && (
                    <ChoicePicker
                      options={msg.options || []}
                      hasOther={msg.hasOther}
                      answered={answeredIds.has(msg.id)}
                      onSelect={(value, display) => handleAnswer(value, display, msg.id)}
                    />
                  )}

                  {/* Multi-select */}
                  {msg.from === 'agent' && msg.qType === 'multiselect' && (
                    <MultiSelectPicker
                      options={msg.options || []}
                      hasOther={msg.hasOther}
                      maxSelect={msg.maxSelect}
                      answered={answeredIds.has(msg.id)}
                      onDone={(value, display) => handleAnswer(value, display, msg.id)}
                    />
                  )}

                  {/* Review card */}
                  {msg.from === 'agent' && done && msg === messages[messages.length - 1] && (
                    <ReviewCard
                      responses={responses}
                      flow={FLOW}
                      onSubmit={handleSubmit}
                    />
                  )}
                </div>
                {msg.from === 'user' && (
                  <div className="dc-msg__av dc-msg__av--user">You</div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="dc-msg dc-msg--agent">
                <div className="dc-msg__av dc-msg__av--agent">✦</div>
                <div className="dc-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <form className="dc-inputbar" onSubmit={handleTextSubmit}>
            {isLongText ? (
              <textarea
                ref={el => { inputRef.current = el; textareaRef.current = el }}
                className={`dc-input${!showTextInput ? ' dc-input--hidden' : ''}`}
                rows={1}
                value={inputVal}
                onChange={e => {
                  setInputVal(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit() }
                }}
                placeholder={currentQ?.placeholder || 'Type your answer… (Shift+Enter for new line)'}
                disabled={!showTextInput}
              />
            ) : (
              <input
                ref={inputRef}
                className={`dc-input${!showTextInput ? ' dc-input--hidden' : ''}`}
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder={currentQ?.placeholder || 'Type your answer…'}
                disabled={!showTextInput}
              />
            )}

            {showTextInput && (
              <button type="submit" className="dc-send" disabled={!inputVal.trim()}>
                <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                  <path d="M17 10L3 3l3 7-3 7 14-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            {!showTextInput && !done && (
              <div className="dc-input-hint">Use the options above ↑</div>
            )}
          </form>

        </div>
      </div>
    </div>
  )
}
