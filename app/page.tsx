'use client'

import { useRef, useState } from 'react'
import { ArrowUpRight, Check, FileImage, Link2, Loader2, Newspaper, UploadCloud } from 'lucide-react'

const tabs = [
  { id: 'text', label: 'Paste Text', icon: Newspaper },
  { id: 'link', label: 'Drop a Link', icon: Link2 },
  { id: 'image', label: 'Upload Screenshot', icon: FileImage },
] as const

type Tab = (typeof tabs)[number]['id']
type RequestType = 'text' | 'link' | 'screenshot'
type Verdict = 'REAL' | 'FAKE' | 'MISLEADING' | 'UNVERIFIED'
type Report = { verdict: Verdict; confidence?: number; claim?: string; why?: string; redFlags?: string; sources?: string; note?: string; raw?: string; title: string; body: string; source: string }
const demoReport: Report = { verdict: 'UNVERIFIED', title: 'Awaiting your first dispatch', body: 'Paste a claim, share a link, or upload a screenshot and our desk will investigate its provenance, sources, and context.', source: 'The Veritas Gazette fact desk' }

function parseReply(reply: string): Report {
  const sections: Record<string, string> = {}
  const pattern = /(?:^|\n)\s*(?:📰|🎯|📌|🔍|🚩|🔗|✍️)\s*([^:]+):\s*([\s\S]*?)(?=\n\s*(?:📰|🎯|📌|🔍|🚩|🔗|✍️)\s*[^:]+:|$)/g
  for (const match of reply.matchAll(pattern)) sections[match[1].trim().toLowerCase()] = match[2].trim()
  const verdictText = sections.verdict?.toUpperCase().trim().replace(/[^A-Z]/g, '')
  const verdict = (['REAL', 'FAKE', 'MISLEADING', 'UNVERIFIED'].includes(verdictText) ? verdictText : 'UNVERIFIED') as Verdict
  const confidence = sections.confidence ? Math.max(0, Math.min(100, Number.parseInt(sections.confidence, 10) || 0)) : undefined
  if (!sections.verdict && !sections['claim checked'] && !sections.why) return { verdict: 'UNVERIFIED', title: 'Unfiled dispatch', body: 'The desk received a reply, but it did not match the expected report format.', source: 'Raw wire copy', raw: reply }
  return { verdict, confidence, claim: sections['claim checked'], why: sections.why, redFlags: sections['red flags'], sources: sections.sources, note: sections["editor's note"], title: 'Fact-check dispatch', body: sections.why || 'The desk filed a verdict.', source: 'Veritas fact desk' }
}

function sourceLinks(value?: string) {
  if (!value) return null
  return value.split(/\s*(?:,|;|\n)\s*/).filter(Boolean).map((item, index) => {
    const match = item.match(/https?:\/\/\S+/)
    if (!match) return <span key={index}>{item}{index < value.split(/[,;\n]/).length - 1 ? ' · ' : ''}</span>
    const url = match[0].replace(/[.)]+$/, '')
    return <span key={index}><a href={url} target="_blank" rel="noreferrer">{url}</a>{index < value.split(/[,;\n]/).length - 1 ? ' · ' : ''}</span>
  })
}

export default function Page() {
  const [tab, setTab] = useState<Tab>('text')
  const [value, setValue] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [report, setReport] = useState<Report>(demoReport)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const today = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())

  async function investigate() {
    if ((!value.trim() && !imageBase64) || loading) return
    setLoading(true); setError('')
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 60000)
    try {
      const type: RequestType = tab === 'image' ? 'screenshot' : tab
      
      // FIXED: Calling your local Next.js backend API route instead of missing webhook
      const response = await fetch('/api/generate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          type, 
          text: value, 
          url: tab === 'link' ? value : '', 
          imageBase64: type === 'screenshot' ? imageBase64 : '', 
          timestamp: new Date().toISOString() 
        }), 
        signal: controller.signal 
      })

      if (!response.ok) throw new Error('Wire error')
      const data = await response.json()
      const reply = data.reply || data.text || ''
      setReport(parseReply(typeof reply === 'string' ? reply : ''))
    } catch { 
      setError('The wire is down. Please check your API key and try again.') 
    } finally { 
      window.clearTimeout(timeout); 
      setLoading(false) 
    }
  }

  function handleFile(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setImageBase64(String(reader.result).split(',')[1] || ''); setValue(file.name); setTab('image') }
    reader.readAsDataURL(file)
  }

  return (
    <main className="gazette-shell"><div className="page-frame">
      <header className="masthead"><div className="masthead-meta"><span>Vol. I</span><span className="meta-rule" /><span>Established 2024</span></div><div className="masthead-title-wrap"><span className="ornament">✦</span><div><p className="kicker">An impartial record for an uncertain age</p><h1>THE VERITAS GAZETTE</h1><p className="tagline">Truth, Verified Daily</p></div><span className="ornament">✦</span></div><div className="masthead-bottom"><span>Morning Edition</span><span>{today}</span><span>Price: One good question</span></div></header>
      <section className="intro-grid"><div className="intro-copy"><p className="eyebrow">The daily fact desk</p><h2>Before it becomes<br /><em>tomorrow&apos;s headline.</em></h2><p className="intro-text">Bring us the claim making the rounds. We&apos;ll trace its origins, weigh the evidence, and give you the story behind the story.</p></div><div className="issue-note"><span className="issue-label">Editor&apos;s note</span><p>“The first duty of a newspaper is to tell the truth as nearly as the truth may be ascertained.”</p><small>— Walter Lippmann</small></div></section>
      <div className="column-rule" />
      <section className="desk-grid"><aside className="side-column"><p className="side-heading">How to file</p><ol><li><b>Bring the evidence</b><span>Paste a claim, URL, or image.</span></li><li><b>Let the desk work</b><span>We compare context and sources.</span></li><li><b>Read the verdict</b><span>Keep your judgment informed.</span></li></ol><div className="side-stamp">FACT<br />DESK<br /><span>NO. 001</span></div></aside>
        <section className="chat-column" aria-label="Letters to the Editor fact checker"><div className="column-heading"><span>Letters to the Editor</span><span className="heading-line" /><span>Fact Check No. 001</span></div><div className="letter"><div className="letter-label">Your submission</div><p>“No claim is too small for a second look.”</p></div>
          <div className={`editorial-note ${report === demoReport ? 'empty-note' : ''}`}>{error ? <><div className="note-top"><span>Wire report</span><VerdictStamp verdict="UNVERIFIED" /></div><h3>The wire is down</h3><p>{error}</p></> : report.raw ? <><div className="note-top"><span>Raw editorial copy</span><VerdictStamp verdict="UNVERIFIED" /></div><h3>Unparsed dispatch</h3><p className="raw-reply">{report.raw}</p></> : <><div className="note-top"><span>{report === demoReport ? 'Desk is ready' : 'Editorial note'}</span><VerdictStamp verdict={report.verdict} /></div>{report.confidence !== undefined && <div className="confidence"><span>Confidence {report.confidence}%</span><div className="ink-bar"><i style={{ width: `${report.confidence}%` }} /></div></div>}<h3>{report.claim || report.title}</h3>{report.why && <p><b>Why:</b> {report.why}</p>}{report.redFlags && <p className="report-line"><b>Red flags:</b> {report.redFlags}</p>}{report.sources && <p className="report-line"><b>Sources:</b> <span className="source-links">{sourceLinks(report.sources)}</span></p>}{report.note && <p className="report-line"><b>Editor&apos;s note:</b> {report.note}</p>}{report === demoReport && <p>{report.body}</p>}{report !== demoReport && <small><Check size={13} /> Filed by {report.source}</small>}</>}</div>
          <div className="input-card"><div className="tab-list" role="tablist">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)} role="tab" aria-selected={tab === id}><Icon size={15} />{label}</button>)}</div>{tab === 'image' ? <button className="drop-zone" onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}><UploadCloud size={24} /><span>Drop a screenshot here or <u>browse files</u></span><small>PNG, JPG up to 10MB</small></button> : <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={tab === 'link' ? 'Paste the article URL you want investigated…' : 'Paste the claim, quote, or headline you want investigated…'} aria-label="Claim to investigate" />}<input ref={fileRef} hidden type="file" accept="image/png,image/jpeg" onChange={(e) => handleFile(e.target.files?.[0])} /><div className="input-footer"><span>{tab === 'link' ? 'We&apos;ll inspect the source and its surrounding context.' : 'Your submission stays between you and the desk.'}</span><button className="investigate-button" onClick={investigate} disabled={(!value.trim() && !imageBase64) || loading}>{loading ? <><Loader2 size={15} className="spin" /> Filing report…</> : <>Investigate <ArrowUpRight size={16} /></>}</button></div></div>{loading && <div className="press-loading"><span className="typing-dot" /> Stop the presses… fact-checking in progress<span className="cursor">▌</span></div>}</section></section>
      <footer className="footer"><div><p className="footer-title">How it works</p><p>Veritas compares claims against available context and reliable reporting. A verdict is a starting point for your own careful reading—not a substitute for it.</p></div><div className="footer-mark">THE VERITAS<br /><span>GAZETTE</span></div><p className="copyright">© 2024 The Veritas Gazette · Built for better questions</p></footer>
    </div></main>
  )
}

function VerdictStamp({ verdict }: { verdict: Verdict }) { return <span className={`verdict-stamp ${verdict.toLowerCase()}`}>{verdict}</span> }