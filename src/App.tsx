import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Command, Download, FileText, FolderOpen, Grid2X2, Image, Layers3, Plus, Search, Settings2, UploadCloud, X, Palette, SlidersHorizontal, HelpCircle } from "lucide-react";

type Stage = "Drop In" | "Evidence" | "Story Plan" | "Design" | "Your Look" | "Publish";
type Project = { id: string; title: string; category: string; stage: Stage; updated: string; description: string; };
type AssetMeta = { id: string; name: string; type: string; size: number; };
type TemplateName = "Bento" | "Studio" | "Editorial";
type FilterName = "All projects" | "In progress" | "Ready to publish";
type Section = "Overview" | "Case studies" | "Appearance";

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
const DB_NAME = "portfolio-studio-assets";
const DB_STORE = "source-files";
const NOTES_KEY = "portfolio-studio-evidence";
const ASSETS_KEY = "portfolio-studio-asset-index";
const TEMPLATE_KEY = "portfolio-studio-templates";
const APPEARANCE_KEY = "portfolio-studio-appearance";
function readJSON<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; }
  catch { return fallback; }
}
function readProjects(): Project[] { return readJSON("portfolio-studio-projects", initialProjects); }
function openAssetDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) { reject(new Error("This browser does not support local file storage.")); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE, { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local file storage."));
  });
}
async function saveAsset(id: string, file: File): Promise<void> {
  const db = await openAssetDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put({ id, blob: file, name: file.name, type: file.type, size: file.size });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not save file."));
    tx.onabort = () => reject(tx.error ?? new Error("File save was cancelled."));
  });
  db.close();
}
async function getAsset(id: string): Promise<Blob | null> {
  const db = await openAssetDB();
  const result = await new Promise<Blob | null>((resolve, reject) => {
    const request = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(id);
    request.onsuccess = () => resolve(request.result?.blob ?? null);
    request.onerror = () => reject(request.error ?? new Error("Could not retrieve file."));
  });
  db.close();
  return result;
}
async function removeAsset(id: string): Promise<void> {
  const db = await openAssetDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not remove file."));
  });
  db.close();
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(readProjects);
  const [active, setActive] = useState<Stage>("Drop In");
  const [selected, setSelected] = useState<string>("p1");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterName>("All projects");
  const [section, setSection] = useState<Section>("Overview");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Design");
  const [notice, setNotice] = useState("Your workspace is saved on this device");
  const [notes, setNotes] = useState<Record<string, string>>(() => readJSON(NOTES_KEY, {}));
  const [assets, setAssets] = useState<Record<string, AssetMeta[]>>(() => readJSON(ASSETS_KEY, {}));
  const [templates, setTemplates] = useState<Record<string, TemplateName>>(() => readJSON(TEMPLATE_KEY, {}));
  const [appearance, setAppearance] = useState(() => readJSON(APPEARANCE_KEY, { accent: "#ff961a", paper: "#fffcf4", ink: "#2c2c2c" }));
  const [showAppearance, setShowAppearance] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = projects.find(p => p.id === selected) ?? projects[0];
  const filtered = useMemo(() => projects.filter(p => {
    const matchesQuery = (p.title + " " + p.category + " " + p.description).toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All projects" || (filter === "In progress" && p.stage !== "Publish") || (filter === "Ready to publish" && p.stage === "Publish");
    return matchesQuery && matchesFilter;
  }), [projects, query, filter]);

  useEffect(() => { localStorage.setItem("portfolio-studio-projects", JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem(ASSETS_KEY, JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance)); document.documentElement.style.setProperty("--user-accent", appearance.accent); document.documentElement.style.setProperty("--user-paper", appearance.paper); document.documentElement.style.setProperty("--user-ink", appearance.ink); }, [appearance]);
  useEffect(() => {
    const t = window.setTimeout(() => setNotice("All changes saved on this device"), 450);
    return () => window.clearTimeout(t);
  }, [projects, notes, assets, templates, appearance]);

  function addProject() {
    if (!newTitle.trim()) return;
    const p: Project = { id: crypto.randomUUID(), title: newTitle.trim(), category: newCategory, stage: "Drop In", updated: "Just now", description: "A new case study in progress." };
    setProjects(prev => [p, ...prev]); setSelected(p.id); setActive("Drop In"); setNewTitle(""); setShowNew(false); setSection("Case studies");
  }
  function openProject(p: Project) { setSelected(p.id); setActive(p.stage); setSection("Case studies"); }
  function advance() {
    const i = stages.indexOf(active);
    if (i < stages.length - 1) {
      const next = stages[i + 1];
      setActive(next);
      setProjects(prev => prev.map(p => p.id === selected ? { ...p, stage: next, updated: "Just now" } : p));
    } else setNotice("You are at the final step. Review the draft before publishing.");
  }
  async function addFiles(list: FileList | null) {
    if (!list || !current || list.length === 0) return;
    setBusy(true);
    try {
      const additions: AssetMeta[] = [];
      for (const file of Array.from(list)) {
        const id = crypto.randomUUID(); await saveAsset(id, file);
        additions.push({ id, name: file.name, type: file.type, size: file.size });
      }
      setAssets(prev => ({ ...prev, [current.id]: [...(prev[current.id] ?? []), ...additions] }));
      setNotice(`${additions.length} file(s) saved on this device`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save the selected files."); }
    finally { setBusy(false); }
  }
  async function downloadAsset(asset: AssetMeta) {
    try {
      const blob = await getAsset(asset.id);
      if (!blob) { setNotice("This file is no longer available in this browser."); return; }
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = asset.name; document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setNotice("Could not open this saved file."); }
  }
  async function deleteAsset(asset: AssetMeta) {
    try {
      await removeAsset(asset.id);
      setAssets(prev => ({ ...prev, [current.id]: (prev[current.id] ?? []).filter(item => item.id !== asset.id) }));
      setNotice("Source file removed from this draft.");
    } catch { setNotice("Could not remove this file."); }
  }
  function selectStage(stage: Stage) { setActive(stage); setSection("Case studies"); }
  const projectCount = projects.length;
  const currentAssets: AssetMeta[] = current ? (assets[current.id] ?? []) : [];


  if (section === "Appearance") return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">gh.</div><div><strong>PORTFOLIO STUDIO</strong><span>BY GLERMENRIK</span></div></div>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
      <button className="nav-item" onClick={() => setSection("Overview")}><Grid2X2 size={17}/> Overview</button>
      <button className="nav-item" onClick={() => setSection("Case studies")}><FolderOpen size={17}/> Case studies</button>
      <button className="nav-item active" onClick={() => setSection("Appearance")}><Settings2 size={17}/> Appearance</button>
      <div className="side-bottom"><div className="help-card"><CircleHelp size={17}/><div><b>Need a hand?</b><span>Customize your studio.</span></div></div></div>
    </aside>
    <main className="main"><header className="topbar"><div className="crumb">Workspace <span>/</span> Appearance</div><div className="top-actions"><span className="save-state"><i/> {notice}</span><div className="avatar small">G</div></div></header>
      <div className="content">
        <section className="welcome"><div><div className="eyebrow">YOUR CREATIVE SPACE</div><h1>Make it<br/><em>yours.</em></h1><p>Adjust the studio palette. Changes are saved on this device.</p></div></section>
        <section className="engine"><div className="panel-heading"><b>Color palette</b><span>LOCAL PREFERENCE</span></div><div className="appearance-grid">
          <label>Paper <input type="color" value={appearance.paper} onChange={e => setAppearance((p: typeof appearance) => ({...p,paper:e.target.value}))}/></label>
          <label>Ink <input type="color" value={appearance.ink} onChange={e => setAppearance((p: typeof appearance) => ({...p,paper:p.paper,ink:e.target.value}))}/></label>
          <label>Accent <input type="color" value={appearance.accent} onChange={e => setAppearance((p: typeof appearance) => ({...p,accent:e.target.value}))}/></label>
        </div><button className="outline-button" onClick={() => setAppearance({accent:"#ff961a",paper:"#fffcf4",ink:"#2c2c2c"})}>Restore Studio GH palette</button></section>
      </div>
    </main>
  </div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">gh.</div><div><strong>PORTFOLIO STUDIO</strong><span>BY GLERMENRIK</span></div></div>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
      <button className={`nav-item ${section === "Overview" ? "active" : ""}`} onClick={() => setSection("Overview")}><Grid2X2 size={17}/> Overview <span className="nav-count">{projectCount}</span></button>
      <button className={`nav-item ${section === "Case studies" ? "active" : ""}`} onClick={() => setSection("Case studies")}><FolderOpen size={17}/> Case studies</button>
      <button className={`nav-item ${section === "Appearance" ? "active" : ""}`} onClick={() => setSection("Appearance")}><Settings2 size={17}/> Appearance</button>
      <div className="side-bottom"><button className="help-card" onClick={() => setNotice("Tip: use the six stages to build a complete case study. Your notes and files stay on this device.")}><CircleHelp size={17}/><div><b>Need a hand?</b><span>Show a workspace tip.</span></div><ArrowUpRight size={14}/></button><div className="profile"><div className="avatar">G</div><div><b>GLERMENRIK</b><span>Personal workspace</span></div></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> {section}</div><div className="top-actions"><span className="save-state"><i/> {notice}</span><button className="icon-button" aria-label="Keyboard shortcuts" title="Keyboard shortcuts" onClick={() => setShowShortcuts(true)}><Command size={16}/></button><button className="avatar small avatar-button" aria-label="Open appearance" title="Open appearance" onClick={() => setSection("Appearance")}>G</button></div></header>
      <div className="content">
        {section === "Overview" && <>
          <section className="welcome"><div><div className="eyebrow">YOUR CREATIVE ARCHIVE</div><h1>Make the work<br/><em>tell its story.</em></h1><p>A thoughtful space to turn scattered material into case studies worth remembering.</p></div><div className="welcome-art"><div className="art-circle c1"/><div className="art-circle c2"/><div className="art-line">STUDIO GH<br/>EST. 2026</div><span>01 — 06</span></div></section>
          <section className="section-head"><div><div className="eyebrow">THE WORKSPACE</div><h2>Your case studies <span>{projectCount.toString().padStart(2,"0")}</span></h2></div><button className="primary-button" onClick={() => setShowNew(true)}><Plus size={16}/> New case study</button></section>
        </>}
        {section === "Case studies" && <section className="section-head section-head-spaced"><div><div className="eyebrow">YOUR PROJECTS</div><h2>Case studies <span>{projectCount.toString().padStart(2,"0")}</span></h2></div><button className="primary-button" onClick={() => setShowNew(true)}><Plus size={16}/> New case study</button></section>}
        <div className="project-toolbar"><div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your projects"/></div>
          <label className="filter-control"><SlidersHorizontal size={15}/><select value={filter} onChange={e => setFilter(e.target.value as FilterName)} aria-label="Filter projects"><option>All projects</option><option>In progress</option><option>Ready to publish</option></select></label>
        </div>
        <div className="project-grid">{filtered.map((p, i) => <button key={p.id} className={`project-card ${selected === p.id ? "selected" : ""}`} onClick={() => openProject(p)} aria-label={`Open ${p.title}`}>
          <div className={`project-visual visual-${i % 3}`}><span>{p.category.toUpperCase()}</span><div className="visual-shape">{p.title.slice(0,1).toUpperCase()}</div><ArrowUpRight size={17}/></div>
          <div className="project-info"><div><h3>{p.title}</h3><p>{p.description}</p></div><div className="project-meta"><span><i className="status-dot"/> {p.stage}</span><span>{p.updated}</span></div></div>
        </button>)}</div>
        {filtered.length === 0 && <div className="empty-results">No projects match this search. <button className="text-button" onClick={() => {setQuery("");setFilter("All projects");}}>Clear filters</button></div>}

        {section === "Overview" && <section className="engine">
          <div className="engine-top"><div><div className="eyebrow">CASE STUDY ENGINE <span className="live-dot"/></div><h2>From raw material<br/>to <em>ready to share.</em></h2></div><div className="engine-note">A guided process, not another blank page.<br/>Six steps. One clear story.</div></div>
          <div className="steps">{stages.map((s,i)=><button key={s} className={`step ${active === s ? "current" : ""} ${stages.indexOf(current.stage)>i ? "done" : ""}`} onClick={() => selectStage(s)}><span className="step-num">{stages.indexOf(current.stage)>i ? <Check size={13}/> : String(i+1).padStart(2,"0")}</span><b>{s}</b><ArrowUpRight size={13}/></button>)}</div>
          <div className="engine-work"><div className="engine-copy"><div className="eyebrow">STEP {String(stages.indexOf(active)+1).padStart(2,"0")} / 06</div><h3>{active}</h3><p>{stageCopy[active]}</p><button className="text-button" onClick={advance}>Continue to next step <ArrowRight size={15}/></button></div>
            <div className="engine-panel">
              {active === "Drop In" && <><div className="drop-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void addFiles(e.dataTransfer.files);}}><UploadCloud size={23}/><b>Drop your material here</b><span>Files are stored in this browser on this device</span><label className="outline-button">{busy?"Saving files...":"Browse files"}<input type="file" multiple disabled={busy} onChange={e=>{void addFiles(e.target.files);e.currentTarget.value="";}}/></label></div><div className="source-list">{currentAssets.length?currentAssets.map(asset=><div className="source-row" key={asset.id}><FileText size={15}/><span className="source-name">{asset.name}</span><button className="source-action" title="Download file" aria-label={`Download ${asset.name}`} onClick={()=>void downloadAsset(asset)}><Download size={14}/></button><button className="source-action" title="Remove file" aria-label={`Remove ${asset.name}`} onClick={()=>void deleteAsset(asset)}><X size={14}/></button></div>):<div className="empty-source"><Image size={17}/> Your source material will appear here</div>}</div></>}
              {active === "Evidence" && <><div className="panel-heading"><b>Evidence notes</b><span>AUTO-SAVED LOCALLY</span></div><textarea value={notes[current.id]??""} onChange={e=>setNotes(prev=>({...prev,[current.id]:e.target.value}))} placeholder="Capture facts, outcomes, decisions, metrics, roles and useful details..."/><div className="hint">Your notes are saved in this browser and will be here when you return on this device. Keep each claim connected to its original source.</div></>}
              {active === "Story Plan" && <><div className="panel-heading"><b>Story outline</b><span>EDITABLE DRAFT</span></div>{["The challenge","The approach","The making","The outcome"].map((x,i)=><div className="outline-row" key={x}><span>0{i+1}</span><b>{x}</b><span>{i===0?"Why this work mattered":i===1?"The idea and decisions":i===2?"Process, details and craft":"Results and reflection"}</span><ArrowUpRight size={14}/></div>)}</>}
              {active === "Design" && <><div className="panel-heading"><b>Choose a direction</b><span>LAYOUT PRESETS</span></div><div className="template-grid">{(["Bento","Studio","Editorial"] as TemplateName[]).map((x,i)=><button className={templates[current.id]===x || (!templates[current.id]&&i===1)?"template chosen":"template"} key={x} onClick={()=>{setTemplates(prev=>({...prev,[current.id]:x}));setNotice(`${x} layout selected for this case study.`);}} aria-pressed={templates[current.id]===x || (!templates[current.id]&&i===1)}><div className={`template-preview t${i}`}><i/><i/><i/></div><b>{x}</b><span>{i===0?"Modular & flexible":i===1?"Image-led & spacious":"Type-led & narrative"}</span></button>)}</div></>}
              {active === "Your Look" && <><div className="panel-heading"><b>Visual identity</b><span>GLERMENRIK DEFAULT</span></div><div className="swatches"><div style={{background:appearance.paper}} title="Paper"/><div style={{background:appearance.ink}} title="Ink"/><div style={{background:appearance.accent}} title="Accent"/></div><p className="hint">Paper, ink and a precise accent. Open Appearance in the sidebar to customize these colors.</p><button className="outline-button" onClick={()=>setSection("Appearance")}>Customize palette <Palette size={14}/></button></>}
              {active === "Publish" && <><div className="publish-state"><div className="publish-icon"><Check size={20}/></div><div><b>Draft ready for review.</b><span>Public publishing is not connected yet. Your case remains a local draft.</span></div></div><button className="outline-button" onClick={()=>setNotice("Publishing is not connected. Review your evidence and story before exporting.")}>Review publishing status</button></>}
            </div>
          </div>
        </section>}
        {section === "Case studies" && <section className="engine case-study-workbench">
          <div className="engine-top"><div><div className="eyebrow">CASE STUDY ENGINE</div><h2>Build the story of<br/><em>{current.title}.</em></h2></div><div className="engine-note">Select a step to continue shaping this case study.</div></div>
          <div className="steps">{stages.map((s,i)=><button key={s} className={`step ${active===s?"current":""} ${stages.indexOf(current.stage)>i?"done":""}`} onClick={()=>selectStage(s)}><span className="step-num">{stages.indexOf(current.stage)>i?<Check size={13}/>:String(i+1).padStart(2,"0")}</span><b>{s}</b><ArrowUpRight size={13}/></button>)}</div>
          <div className="engine-work"><div className="engine-copy"><div className="eyebrow">STEP {String(stages.indexOf(active)+1).padStart(2,"0")} / 06</div><h3>{active}</h3><p>{stageCopy[active]}</p><button className="text-button" onClick={advance}>Continue to next step <ArrowRight size={15}/></button></div>
            <div className="engine-panel">
              {active==="Drop In" && <><div className="drop-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void addFiles(e.dataTransfer.files);}}><UploadCloud size={23}/><b>Drop your material here</b><span>Files are stored in this browser on this device</span><label className="outline-button">{busy?"Saving files...":"Browse files"}<input type="file" multiple disabled={busy} onChange={e=>{void addFiles(e.target.files);e.currentTarget.value="";}}/></label></div><div className="source-list">{currentAssets.length?currentAssets.map(asset=><div className="source-row" key={asset.id}><FileText size={15}/><span className="source-name">{asset.name}</span><button className="source-action" title="Download file" onClick={()=>void downloadAsset(asset)}><Download size={14}/></button><button className="source-action" title="Remove file" onClick={()=>void deleteAsset(asset)}><X size={14}/></button></div>):<div className="empty-source"><Image size={17}/> Your source material will appear here</div>}</div></>}
              {active==="Evidence" && <><div className="panel-heading"><b>Evidence notes</b><span>AUTO-SAVED LOCALLY</span></div><textarea value={notes[current.id]??""} onChange={e=>setNotes(prev=>({...prev,[current.id]:e.target.value}))} placeholder="Capture facts, outcomes, decisions, metrics, roles and useful details..."/><div className="hint">Your notes are saved in this browser on this device.</div></>}
              {active==="Story Plan" && <><div className="panel-heading"><b>Story outline</b><span>EDITABLE DRAFT</span></div>{["The challenge","The approach","The making","The outcome"].map((x,i)=><div className="outline-row" key={x}><span>0{i+1}</span><b>{x}</b><span>{i===0?"Why this work mattered":i===1?"The idea and decisions":i===2?"Process, details and craft":"Results and reflection"}</span><ArrowUpRight size={14}/></div>)}</>}
              {active==="Design" && <><div className="panel-heading"><b>Choose a direction</b><span>LAYOUT PRESETS</span></div><div className="template-grid">{(["Bento","Studio","Editorial"] as TemplateName[]).map((x,i)=><button className={templates[current.id]===x || (!templates[current.id]&&i===1)?"template chosen":"template"} key={x} onClick={()=>setTemplates(prev=>({...prev,[current.id]:x}))}><div className={`template-preview t${i}`}><i/><i/><i/></div><b>{x}</b><span>{i===0?"Modular & flexible":i===1?"Image-led & spacious":"Type-led & narrative"}</span></button>)}</div></>}
              {active==="Your Look" && <><div className="panel-heading"><b>Visual identity</b><span>GLERMENRIK DEFAULT</span></div><div className="swatches"><div style={{background:appearance.paper}}/><div style={{background:appearance.ink}}/><div style={{background:appearance.accent}}/></div><button className="outline-button" onClick={()=>setSection("Appearance")}>Customize palette <Palette size={14}/></button></>}
              {active==="Publish" && <><div className="publish-state"><div className="publish-icon"><Check size={20}/></div><div><b>Draft ready for review.</b><span>Public publishing is not connected yet.</span></div></div><button className="outline-button" onClick={()=>setNotice("Publishing is not connected yet.")}>Review publishing status</button></>}
            </div>
          </div>
        </section>}
        <footer><span>PORTFOLIO STUDIO <b>·</b> AN INDEPENDENT STUDIO GH PRODUCT</span><span>{notice}</span></footer>
      </div>
    </main>
    {showNew && <div className="modal-backdrop" onClick={()=>setShowNew(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowNew(false)} aria-label="Close"><X size={18}/></button><div className="eyebrow">START SOMETHING GOOD</div><h2>New case study</h2><p>Give this project a name. You can shape the story as you go.</p><label>Project name<input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="e.g. A new visual identity"/></label><label>Category<select value={newCategory} onChange={e=>setNewCategory(e.target.value)}><option>Art</option><option>Design</option><option>Creative Technology</option></select></label><button className="primary-button full" onClick={addProject} disabled={!newTitle.trim()}>Create case study <ArrowRight size={16}/></button></div></div>}
    {showShortcuts && <div className="modal-backdrop" onClick={()=>setShowShortcuts(false)}><div className="modal shortcuts-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowShortcuts(false)} aria-label="Close"><X size={18}/></button><div className="eyebrow">QUICK GUIDE</div><h2>Workspace shortcuts</h2><p>Use these actions to move around the studio.</p><div className="shortcut-list"><div><b>Overview</b><span>Return to your workspace dashboard</span></div><div><b>Case studies</b><span>Browse projects and open any case</span></div><div><b>Appearance</b><span>Adjust your studio palette</span></div><div><b>Six stages</b><span>Choose a stage to edit its material</span></div></div><button className="primary-button full" onClick={()=>setShowShortcuts(false)}>Got it</button></div></div>}
  </div>;
}