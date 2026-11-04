import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Command, FileText, FolderOpen, Grid2X2, Image, Layers3, LayoutTemplate, Plus, Search, Settings2, Sparkles, UploadCloud, X } from "lucide-react";

type Stage = "Drop In" | "Evidence" | "Story Plan" | "Design" | "Your Look" | "Publish";
type Project = { id: string; title: string; category: string; stage: Stage; updated: string; description: string; };

const stages: Stage[] = ["Drop In", "Evidence", "Story Plan", "Design", "Your Look", "Publish"];
const initialProjects: Project[] = [
  { id: "p1", title: "Fluidez — visual explorations", category: "Art", stage: "Story Plan", updated: "Today", description: "A study of continuous lines, rhythm and organic geometry." },
  { id: "p2", title: "Story Studio", category: "Creative Technology", stage: "Design", updated: "Yesterday", description: "A mobile-first editor for expressive Instagram stories." },
  { id: "p3", title: "+5521 Collection", category: "Art", stage: "Drop In", updated: "Nov 02", description: "A visual love letter to Rio de Janeiro." }
];

const stageCopy: Record<Stage, string> = {
  "Drop In": "Bring everything together. Add images, documents, links and loose notes.",
  "Evidence": "Turn raw material into reliable facts, outcomes, decisions and useful details.",
  "Story Plan": "Shape the narrative before designing the case study.",
  "Design": "Choose a layout that gives the story its own rhythm.",
  "Your Look": "Apply the visual language that makes the case unmistakably yours.",
  "Publish": "Review the final story and prepare a shareable version."
};

function readProjects(): Project[] {
  try { const saved = localStorage.getItem("portfolio-studio-projects"); return saved ? JSON.parse(saved) : initialProjects; }
  catch { return initialProjects; }
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(readProjects);
  const [active, setActive] = useState<Stage>("Drop In");
  const [selected, setSelected] = useState<string>("p1");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Design");
  const [notice, setNotice] = useState("Your workspace is saved on this device");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, string[]>>({});
  const current = projects.find(p => p.id === selected) ?? projects[0];
  const filtered = useMemo(() => projects.filter(p => (p.title + p.category).toLowerCase().includes(query.toLowerCase())), [projects, query]);

  useEffect(() => { localStorage.setItem("portfolio-studio-projects", JSON.stringify(projects)); }, [projects]);
  useEffect(() => { const t = setTimeout(() => setNotice("All changes saved on this device"), 500); return () => clearTimeout(t); }, [projects, notes, files]);

  function addProject() {
    if (!newTitle.trim()) return;
    const p: Project = { id: crypto.randomUUID(), title: newTitle.trim(), category: newCategory, stage: "Drop In", updated: "Just now", description: "A new case study in progress." };
    setProjects(prev => [p, ...prev]); setSelected(p.id); setActive("Drop In"); setNewTitle(""); setShowNew(false);
  }
  function advance() {
    const i = stages.indexOf(active);
    if (i < stages.length - 1) {
      const next = stages[i + 1];
      setActive(next);
      setProjects(prev => prev.map(p => p.id === selected ? { ...p, stage: next, updated: "Just now" } : p));
    }
  }
  function addFiles(list: FileList | null) {
    if (!list || !current) return;
    const names = Array.from(list).map(f => f.name);
    setFiles(prev => ({ ...prev, [current.id]: [...(prev[current.id] ?? []), ...names] }));
    setNotice("File names added to this draft. Cloud upload is not connected yet.");
  }

  if (!current) return null;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">gh.</div><div><strong>PORTFOLIO STUDIO</strong><span>BY GLERMENRIK</span></div></div>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
      <button className="nav-item active"><Grid2X2 size={17}/> Overview <span className="nav-count">{projects.length}</span></button>
      <button className="nav-item" onClick={() => setActive("Drop In")}><FolderOpen size={17}/> Case studies</button>
      <button className="nav-item" onClick={() => setNotice("Appearance settings will arrive in the next build.")}><Settings2 size={17}/> Appearance</button>
      <div className="side-bottom"><div className="help-card"><CircleHelp size={17}/><div><b>Need a hand?</b><span>Your stories, one step at a time.</span></div><ArrowUpRight size={14}/></div><div className="profile"><div className="avatar">G</div><div><b>GLERMENRIK</b><span>Personal workspace</span></div><Settings2 size={16}/></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> Overview</div><div className="top-actions"><span className="save-state"><i/> {notice}</span><button className="icon-button"><Command size={16}/></button><div className="avatar small">G</div></div></header>
      <div className="content">
        <section className="welcome"><div><div className="eyebrow">YOUR CREATIVE ARCHIVE</div><h1>Make the work<br/><em>tell its story.</em></h1><p>A thoughtful space to turn scattered material into case studies worth remembering.</p></div><div className="welcome-art"><div className="art-circle c1"/><div className="art-circle c2"/><div className="art-line">STUDIO GH<br/>EST. 2026</div><span>01 — 06</span></div></section>

        <section className="section-head"><div><div className="eyebrow">THE WORKSPACE</div><h2>Your case studies <span>{projects.length.toString().padStart(2,"0")}</span></h2></div><button className="primary-button" onClick={() => setShowNew(true)}><Plus size={16}/> New case study</button></section>
        <div className="project-toolbar"><div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your projects"/></div><button className="filter-button"><Layers3 size={15}/> All projects <ChevronDown size={14}/></button></div>
        <div className="project-grid">{filtered.map((p, i) => <button key={p.id} className={`project-card ${selected === p.id ? "selected" : ""}`} onClick={() => {setSelected(p.id); setActive(p.stage);}}>
          <div className={`project-visual visual-${i % 3}`}><span>{p.category.toUpperCase()}</span><div className="visual-shape">{i === 0 ? "F" : i === 1 ? "S" : "R"}</div><ArrowUpRight size={17}/></div>
          <div className="project-info"><div><h3>{p.title}</h3><p>{p.description}</p></div><div className="project-meta"><span><i className="status-dot"/> {p.stage}</span><span>{p.updated}</span></div></div>
        </button>)}</div>

        <section className="engine">
          <div className="engine-top"><div><div className="eyebrow">CASE STUDY ENGINE <span className="live-dot"/></div><h2>From raw material<br/>to <em>ready to share.</em></h2></div><div className="engine-note">A guided process, not another blank page.<br/>Six steps. One clear story.</div></div>
          <div className="steps">{stages.map((s,i) => <button key={s} className={`step ${active === s ? "current" : ""} ${stages.indexOf(current.stage) > i ? "done" : ""}`} onClick={() => setActive(s)}><span className="step-num">{stages.indexOf(current.stage) > i ? <Check size={13}/> : String(i+1).padStart(2,"0")}</span><b>{s}</b><ArrowUpRight size={13}/></button>)}</div>
          <div className="engine-work">
            <div className="engine-copy"><div className="eyebrow">STEP {String(stages.indexOf(active)+1).padStart(2,"0")} / 06</div><h3>{active}</h3><p>{stageCopy[active]}</p><button className="text-button" onClick={advance}>Continue to next step <ArrowRight size={15}/></button></div>
            <div className="engine-panel">
              {active === "Drop In" && <><div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); addFiles(e.dataTransfer.files);}}><UploadCloud size={23}/><b>Drop your material here</b><span>Images, documents, notes and references</span><label className="outline-button">Browse files<input type="file" multiple onChange={e => addFiles(e.target.files)}/></label></div><div className="source-list">{(files[current.id] ?? []).length ? files[current.id].map((f,i) => <div className="source-row" key={i}><FileText size={15}/>{f}<Check size={14}/></div>) : <div className="empty-source"><Image size={17}/> Your source material will appear here</div>}</div></>}
              {active === "Evidence" && <><div className="panel-heading"><b>Evidence notes</b><span>MANUAL CAPTURE</span></div><textarea value={notes[current.id] ?? ""} onChange={e => setNotes(prev => ({...prev,[current.id]:e.target.value}))} placeholder="Capture facts, outcomes, decisions, metrics, roles and useful details..."/><div className="hint">Keep each claim connected to its original source. Automatic extraction is not connected yet.</div></>}
              {active === "Story Plan" && <><div className="panel-heading"><b>Story outline</b><span>EDITABLE DRAFT</span></div>{["The challenge","The approach","The making","The outcome"].map((x,i)=><div className="outline-row" key={x}><span>0{i+1}</span><b>{x}</b><span>{i===0?"Why this work mattered":i===1?"The idea and decisions":i===2?"Process, details and craft":"Results and reflection"}</span><ArrowUpRight size={14}/></div>)}</>}
              {active === "Design" && <><div className="panel-heading"><b>Choose a direction</b><span>LAYOUT PRESETS</span></div><div className="template-grid">{["Bento","Studio","Editorial"].map((x,i)=><button className={i===1?"template chosen":"template"} key={x}><div className={`template-preview t${i}`}><i/><i/><i/></div><b>{x}</b><span>{i===0?"Modular & flexible":i===1?"Image-led & spacious":"Type-led & narrative"}</span></button>)}</div></>}
              {active === "Your Look" && <><div className="panel-heading"><b>Visual identity</b><span>GLERMENRIK DEFAULT</span></div><div className="swatches"><div style={{background:"#fffcf4"}}/><div style={{background:"#2c2c2c"}}/><div style={{background:"#ff961a"}}/></div><p className="hint">Paper, ink and a precise accent. Custom styling controls are coming next.</p></>}
              {active === "Publish" && <><div className="publish-state"><div className="publish-icon"><Check size={20}/></div><div><b>Ready when you are.</b><span>This case is still a local draft. No public page has been published.</span></div></div><button className="outline-button" onClick={() => setNotice("Publishing is not connected yet. Your draft remains safely on this device.")}>Review publishing status</button></>}
            </div>
          </div>
        </section>
        <footer><span>PORTFOLIO STUDIO <b>·</b> AN INDEPENDENT STUDIO GH PRODUCT</span><span>{notice}</span></footer>
      </div>
    </main>
    {showNew && <div className="modal-backdrop" onClick={() => setShowNew(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowNew(false)}><X size={18}/></button><div className="eyebrow">START SOMETHING GOOD</div><h2>New case study</h2><p>Give this project a name. You can shape the story as you go.</p><label>Project name<input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. A new visual identity"/></label><label>Category<select value={newCategory} onChange={e => setNewCategory(e.target.value)}><option>Art</option><option>Design</option><option>Creative Technology</option></select></label><button className="primary-button full" onClick={addProject} disabled={!newTitle.trim()}>Create case study <ArrowRight size={16}/></button></div></div>}
  </div>;
}