import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Command, Download, FileText, FolderOpen, Grid2X2, Image, Layers3, Plus, Search, Settings2, UploadCloud, X, Palette, SlidersHorizontal, HelpCircle } from "lucide-react";

type Stage = "Drop In" | "Evidence" | "Story Plan" | "Design" | "Your Look" | "Publish";
type Project = { id: string; title: string; category: string; stage: Stage; updated: string; description: string; };
type AssetMeta = { id: string; name: string; type: string; size: number; };
type TemplateName = "Bento" | "Studio" | "Editorial";
type FilterName = "All projects" | "In progress" | "Ready to publish";
type Section = "Overview" | "Case studies" | "Appearance" | "Preview";
const sectionLabels: Record<Section, string> = { Overview: "Visão geral", "Estudos de caso": "Estudos de caso", Appearance: "Aparência", Preview: "Prévia" };
const stageLabels: Record<Stage, string> = { "Drop In": "Adicionar materiais", Evidence: "Evidências", "Story Plan": "Estrutura da história", Design: "Design", "Your Look": "Sua identidade", Publish: "Publicação" };

const stages: Stage[] = ["Drop In", "Evidence", "Story Plan", "Design", "Your Look", "Publish"];
const initialProjects: Project[] = [
  { id: "p1", title: "Fluidez — visual explorations", category: "Art", stage: "Story Plan", updated: "Hoje", description: "Um estudo de linhas contínuas, ritmo e geometria orgânica." },
  { id: "p2", title: "Story Studio", category: "Creative Technology", stage: "Design", updated: "Ontem", description: "Um editor mobile-first para criar stories expressivos no Instagram." },
  { id: "p3", title: "+5521 Collection", category: "Art", stage: "Drop In", updated: "02 nov", description: "Uma declaração visual de amor ao Rio de Janeiro." }
];
const stageCopy: Record<Stage, string> = {
  "Drop In": "Reúna tudo em um só lugar. Adicione imagens, documentos, links e anotações.",
  "Evidence": "Transforme materiais soltos em fatos, resultados, decisões e informações confiáveis.",
  "Story Plan": "Estruture a narrativa antes de começar o design do projeto.",
  "Design": "Escolha um layout que dê ritmo à história.",
  "Your Look": "Aplique uma linguagem visual com a sua identidade.",
  "Publish": "Revise a história e prepare uma versão para compartilhar."
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
    if (!("indexedDB" in window)) { reject(new Error("Este navegador não oferece suporte ao armazenamento local de arquivos.")); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE, { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível acessar o armazenamento local de arquivos."));
  });
}
async function saveAsset(id: string, file: File): Promise<void> {
  const db = await openAssetDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put({ id, blob: file, name: file.name, type: file.type, size: file.size });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Não foi possível salvar o arquivo."));
    tx.onabort = () => reject(tx.error ?? new Error("O salvamento do arquivo foi cancelado."));
  });
  db.close();
}
async function getAsset(id: string): Promise<Blob | null> {
  const db = await openAssetDB();
  const result = await new Promise<Blob | null>((resolve, reject) => {
    const request = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(id);
    request.onsuccess = () => resolve(request.result?.blob ?? null);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível recuperar o arquivo."));
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
    tx.onerror = () => reject(tx.error ?? new Error("Não foi possível remover o arquivo."));
  });
  db.close();
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(readProjects);
  const [active, setActive] = useState<Stage>("Drop In");
  const [selected, setSelected] = useState<string>("p1");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterName>("All projects");
  const [section, setSection] = useState<Section>("Visão geral");
  const [approved, setApproved] = useState<Record<string, boolean>>(() => readJSON("portfolio-studio-approved", {}));
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Design");
  const [notice, setNotice] = useState("Seu espaço de trabalho está salvo neste dispositivo");
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
  useEffect(() => { localStorage.setItem("portfolio-studio-approved", JSON.stringify(approved)); }, [approved]);
  useEffect(() => { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance)); document.documentElement.style.setProperty("--user-accent", appearance.accent); document.documentElement.style.setProperty("--user-paper", appearance.paper); document.documentElement.style.setProperty("--user-ink", appearance.ink); }, [appearance]);
  useEffect(() => {
    const t = window.setTimeout(() => setNotice("Alterações salvas neste dispositivo"), 450);
    return () => window.clearTimeout(t);
  }, [projects, notes, assets, templates, appearance]);

  function addProject() {
    if (!newTitle.trim()) return;
    const p: Project = { id: crypto.randomUUID(), title: newTitle.trim(), category: newCategory, stage: "Drop In", updated: "Agora", description: "Um novo estudo de caso em andamento." };
    setProjects(prev => [p, ...prev]); setSelected(p.id); setActive("Drop In"); setNewTitle(""); setShowNew(false); setSection("Case studies");
  }
  function openProject(p: Project) { setSelected(p.id); setActive(p.stage); setSection("Estudos de caso"); }
  function openPreview(p: Project) { setSelected(p.id); setSection("Preview"); }
  function advance() {
    const i = stages.indexOf(active);
    if (i < stages.length - 1) {
      const next = stages[i + 1];
      setActive(next);
      setProjects(prev => prev.map(p => p.id === selected ? { ...p, stage: next, updated: "Agora" } : p));
    } else setNotice("Você chegou à última etapa. Revise o rascunho antes de publicar.");
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
      setNotice(`${additions.length} arquivo(s) salvo(s) neste dispositivo`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível salvar os arquivos selecionados."); }
    finally { setBusy(false); }
  }
  async function downloadAsset(asset: AssetMeta) {
    try {
      const blob = await getAsset(asset.id);
      if (!blob) { setNotice("Este arquivo não está mais disponível neste navegador."); return; }
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = asset.name; document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setNotice("Não foi possível abrir este arquivo salvo."); }
  }
  async function deleteAsset(asset: AssetMeta) {
    try {
      await removeAsset(asset.id);
      setAssets(prev => ({ ...prev, [current.id]: (prev[current.id] ?? []).filter(item => item.id !== asset.id) }));
      setNotice("Arquivo de referência removido deste rascunho.");
    } catch { setNotice("Não foi possível remover este arquivo."); }
  }
  function selectStage(stage: Stage) { setActive(stage); setSection("Estudos de caso"); }
  const projectCount = projects.length;
  const currentAssets: AssetMeta[] = current ? (assets[current.id] ?? []) : [];


  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">gh.</div><div><strong>PORTFOLIO STUDIO</strong><span>BY GLERMENRIK</span></div></div>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
      <button className={`nav-item ${section === "Overview" ? "active" : ""}`} onClick={() => setSection("Overview")}><Grid2X2 size={17}/> Overview <span className="nav-count">{projectCount}</span></button>
      <button className={`nav-item ${section === "Case studies" ? "active" : ""}`} onClick={() => setSection("Estudos de caso")}><FolderOpen size={17}/> Case studies</button>
      <button className={`nav-item ${section === "Preview" ? "active" : ""}`} onClick={() => openPreview(current)}><Image size={17}/> Preview current</button>
      <button className={`nav-item ${section === "Appearance" ? "active" : ""}`} onClick={() => setSection("Appearance")}><Settings2 size={17}/> Appearance</button>
      <div className="side-bottom"><button className="help-card" onClick={() => setNotice("Tip: use the six stages to build a complete case study. Your notes and files stay on this device.")}><CircleHelp size={17}/><div><b>Precisa de ajuda?</b><span>Ver uma dica de uso.</span></div><ArrowUpRight size={14}/></button><button className="profile profile-button" onClick={() => setSection("Aparência")} aria-label="Open personal workspace appearance settings"><div className="avatar">G</div><div><b>GLERMENRIK</b><span>Espaço de trabalho pessoal</span></div><SlidersHorizontal size={18}/></button></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> {sectionLabels[section]}</div><div className="top-actions"><span className="save-state"><i/> {notice}</span><button className="icon-button" aria-label="Keyboard shortcuts" title="Keyboard shortcuts" onClick={() => setShowShortcuts(true)}><Command size={16}/></button><button className="avatar small avatar-button" aria-label="Open appearance" title="Open appearance" onClick={() => setSection("Aparência")}>G</button></div></header>
      <div className="content">
        {section === "Prévia" && <section className="public-preview">
          <div className="preview-toolbar">
            <div><div className="eyebrow">CASE STUDY PREVIEW</div><h2>{current.title}</h2><p>This preview is private and visible only inside your workspace.</p></div>
            <div className="preview-actions"><span className={approved[current.id] ? "approval-pill approved" : "approval-pill"}>{approved[current.id] ? "Approved draft" : "Private draft"}</span><button className="outline-button" onClick={() => setSection("Estudos de caso")}>Voltar ao editor</button></div>
          </div>
          <article className={`case-preview layout-${templates[current.id] ?? "Studio"}`}>
            <div className="case-preview-kicker">{current.category} · GLERMENRIK / CASE STUDY</div>
            <h1>{current.title}</h1>
            <p className="case-preview-intro">{current.description || "A project story in progress. Add context and evidence in the editor to shape this introduction."}</p>
            <div className="case-preview-rule"/>
            <div className="case-preview-grid"><div><span>PROJECT STATUS</span><b>{approved[current.id] ? "Approved for design" : "In progress"}</b></div><div><span>CURRENT STAGE</span><b>{current.stage}</b></div><div><span>SOURCE MATERIAL</span><b>{currentAssets.length} files attached</b></div></div>
            <section><div className="eyebrow">THE STORY</div><h2>The challenge</h2><p>{notes[current.id]?.trim() || "Your evidence notes will appear here when you add them in the Evidence stage. This is placeholder guidance, not extracted project content."}</p></section>
            <section><div className="eyebrow">SOURCE MATERIAL</div><h2>Project archive</h2><div className="preview-file-list">{currentAssets.length ? currentAssets.map(file => <div key={file.id}><FileText size={16}/><span>{file.name}</span><small>{Math.max(1,Math.round(file.size/1024))} KB</small></div>) : <p>No files added yet.</p>}</div></section>
            <div className="preview-footnote">PRIVATE PREVIEW · NOT PUBLISHED</div>
          </article>
          <div className="preview-actions bottom"><button className="outline-button" onClick={() => setSection("Estudos de caso")}>Continuar editando</button><button className="primary-button" onClick={() => {setApproved(prev => ({...prev,[current.id]:!prev[current.id]}));setNotice(approved[current.id] ? "Approval removed. This case remains private." : "Draft approved for the next design step. It is still private.");}}>{approved[current.id] ? "Reopen draft" : "Approve draft"}</button></div>
          <p className="hint">Approval here records an internal draft checkpoint only. It does not publish the case study or create a public URL.</p>
        </section>}
        {section === "Visão geral" && <>
          <section className="welcome"><div><div className="eyebrow">YOUR CREATIVE ARCHIVE</div><h1>Make the work<br/><em>tell its story.</em></h1><p>A thoughtful space to turn scattered material into case studies worth remembering.</p></div><div className="welcome-art"><div className="art-circle c1"/><div className="art-circle c2"/><div className="art-line">STUDIO GH<br/>EST. 2026</div><span>01 — 06</span></div></section>
          <section className="section-head"><div><div className="eyebrow">THE WORKSPACE</div><h2>Your case studies <span>{projectCount.toString().padStart(2,"0")}</span></h2></div><button className="primary-button" onClick={() => setShowNew(true)}><Plus size={16}/> New case study</button></section>
        </>}
        {section === "Estudos de caso" && <section className="section-head section-head-spaced"><div><div className="eyebrow">YOUR PROJECTS</div><h2>Case studies <span>{projectCount.toString().padStart(2,"0")}</span></h2></div><button className="primary-button" onClick={() => setShowNew(true)}><Plus size={16}/> New case study</button></section>}
                {section === "Aparência" && <section className="appearance-page">
          <div className="eyebrow">PERSONAL WORKSPACE</div>
          <h1>Aparência</h1>
          <p className="appearance-intro">Tune the visual language of your workspace. Your choices are saved on this device.</p>
          <div className="appearance-card">
            <div className="appearance-card-head"><div><b>Workspace palette</b><span>Customize paper, ink and accent colors</span></div><button className="text-button" onClick={() => setAppearance({accent:"#ff961a",paper:"#fffcf4",ink:"#2c2c2c"})}>Reset defaults</button></div>
            <div className="appearance-controls">
              <label><span><i style={{background:appearance.paper}}/> Paper</span><input aria-label="Paper color" type="color" value={appearance.paper} onChange={e=>setAppearance(prev=>({...prev,paper:e.target.value}))}/><code>{appearance.paper}</code></label>
              <label><span><i style={{background:appearance.ink}}/> Ink</span><input aria-label="Ink color" type="color" value={appearance.ink} onChange={e=>setAppearance(prev=>({...prev,ink:e.target.value}))}/><code>{appearance.ink}</code></label>
              <label><span><i style={{background:appearance.accent}}/> Accent</span><input aria-label="Accent color" type="color" value={appearance.accent} onChange={e=>setAppearance(prev=>({...prev,accent:e.target.value}))}/><code>{appearance.accent}</code></label>
            </div>
            <div className="appearance-sample" style={{background:appearance.paper,color:appearance.ink,borderColor:appearance.accent}}>
              <div className="eyebrow">LIVE PREVIEW · GLERMENRIK</div><h2>Make the work <em>tell its story.</em></h2><p>A little preview of your workspace palette.</p><span style={{background:appearance.accent}}/>
            </div>
          </div>
          <div className="appearance-card workspace-settings"><b>Espaço de trabalho pessoal</b><p>Projects, notes and source files are currently stored in this browser. Cloud sync is not connected yet.</p><span className="local-state"><i/> Saved on this device</span></div>
        </section>}
        {(section === "Visão geral" || section === "Estudos de caso") && <>\n<div className="project-toolbar"><div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar projetos"/></div>
          <label className="filter-control"><SlidersHorizontal size={15}/><select value={filter} onChange={e => setFilter(e.target.value as FilterName)} aria-label="Filter projects"><option>Todos os projetos</option><option>Em andamento</option><option>Prontos para publicar</option></select></label>
        </div>
        <div className="project-grid">{filtered.map((p, i) => <button key={p.id} className={`project-card ${selected === p.id ? "selected" : ""}`} onClick={() => openProject(p)} aria-label={`Open ${p.title}`}>
          <div className={`project-visual visual-${i % 3}`}><span>{p.category.toUpperCase()}</span><div className="visual-shape">{p.title.slice(0,1).toUpperCase()}</div><ArrowUpRight size={17}/></div>
          <div className="project-info"><div><h3>{p.title}</h3><p>{p.description}</p></div><div className="project-meta"><span><i className="status-dot"/> {stageLabels[p.stage]}</span><span>{p.updated}</span></div></div>
        </button>)}</div>
        {section === "Estudos de caso" && <div className="case-preview-link"><button className="outline-button" onClick={() => openPreview(current)}><ArrowUpRight size={14}/> Preview this case study</button></div>}
        {filtered.length === 0 && <div className="empty-results">No projects match this search. <button className="text-button" onClick={() => {setQuery("");setFilter("All projects");}}>Clear filters</button></div>}\n        </>}

        {section === "Visão geral" && <section className="engine">
          <div className="engine-top"><div><div className="eyebrow">CASE STUDY ENGINE <span className="live-dot"/></div><h2>From raw material<br/>to <em>ready to share.</em></h2></div><div className="engine-note">A guided process, not another blank page.<br/>Six steps. One clear story.</div></div>
          <div className="steps">{stages.map((s,i)=><button key={s} className={`step ${active === s ? "current" : ""} ${stages.indexOf(current.stage)>i ? "done" : ""}`} onClick={() => selectStage(s)}><span className="step-num">{stages.indexOf(current.stage)>i ? <Check size={13}/> : String(i+1).padStart(2,"0")}</span><b>{stageLabels[s]}</b><ArrowUpRight size={13}/></button>)}</div>
          <div className="engine-work"><div className="engine-copy"><div className="eyebrow">ETAPA {String(stages.indexOf(active)+1).padStart(2,"0")} / 06</div><h3>{stageLabels[active]}</h3><p>{stageCopy[active]}</p><button className="text-button" onClick={advance}>Ir para a próxima etapa <ArrowRight size={15}/></button></div>
            <div className="engine-panel">
              {active === "Drop In" && <><div className="drop-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void addFiles(e.dataTransfer.files);}}><UploadCloud size={23}/><b>Solte seus arquivos aqui</b><span>Files are stored in this browser on this device</span><label className="outline-button">{busy?"Saving files...":"Browse files"}<input type="file" multiple disabled={busy} onChange={e=>{void addFiles(e.target.files);e.currentTarget.value="";}}/></label></div><div className="source-list">{currentAssets.length?currentAssets.map(asset=><div className="source-row" key={asset.id}><FileText size={15}/><span className="source-name">{asset.name}</span><button className="source-action" title="Download file" aria-label={`Download ${asset.name}`} onClick={()=>void downloadAsset(asset)}><Download size={14}/></button><button className="source-action" title="Remove file" aria-label={`Remove ${asset.name}`} onClick={()=>void deleteAsset(asset)}><X size={14}/></button></div>):<div className="empty-source"><Image size={17}/> Your source material will appear here</div>}</div></>}
              {active === "Evidence" && <><div className="panel-heading"><b>Anotações e evidências</b><span>AUTO-SAVED LOCALLY</span></div><textarea value={notes[current.id]??""} onChange={e=>setNotes(prev=>({...prev,[current.id]:e.target.value}))} placeholder="Registre fatos, resultados, decisões, métricas, seu papel e outras informações importantes..."/><div className="hint">Your notes are saved in this browser and will be here when you return on this device. Keep each claim connected to its original source.</div></>}
              {active === "Story Plan" && <><div className="panel-heading"><b>Estrutura da história</b><span>EDITABLE DRAFT</span></div>{["The challenge","The approach","The making","The outcome"].map((x,i)=><div className="outline-row" key={x}><span>0{i+1}</span><b>{x}</b><span>{i===0?"Why this work mattered":i===1?"The idea and decisions":i===2?"Process, details and craft":"Results and reflection"}</span><ArrowUpRight size={14}/></div>)}</>}
              {active === "Design" && <><div className="panel-heading"><b>Escolha uma direção visual</b><span>LAYOUT PRESETS</span></div><div className="template-grid">{(["Bento","Studio","Editorial"] as TemplateName[]).map((x,i)=><button className={templates[current.id]===x || (!templates[current.id]&&i===1)?"template chosen":"template"} key={x} onClick={()=>{setTemplates(prev=>({...prev,[current.id]:x}));setNotice(`${x} layout selected for this case study.`);}} aria-pressed={templates[current.id]===x || (!templates[current.id]&&i===1)}><div className={`template-preview t${i}`}><i/><i/><i/></div><b>{x}</b><span>{i===0?"Modular & flexible":i===1?"Image-led & spacious":"Type-led & narrative"}</span></button>)}</div></>}
              {active === "Your Look" && <><div className="panel-heading"><b>Identidade visual</b><span>GLERMENRIK DEFAULT</span></div><div className="swatches"><div style={{background:appearance.paper}} title="Paper"/><div style={{background:appearance.ink}} title="Ink"/><div style={{background:appearance.accent}} title="Accent"/></div><p className="hint">Paper, ink and a precise accent. Open Appearance in the sidebar to customize these colors.</p><button className="outline-button" onClick={()=>setSection("Aparência")}>Customize palette <Palette size={14}/></button></>}
              {active === "Publish" && <><div className="publish-state"><div className="publish-icon"><Check size={20}/></div><div><b>Draft ready for review.</b><span>Public publishing is not connected yet. Your case remains a local draft.</span></div></div><button className="outline-button" onClick={()=>setNotice("Publishing is not connected. Review your evidence and story before exporting.")}>Review publishing status</button></>}
            </div>
          </div>
        </section>}
        {section === "Estudos de caso" && <section className="engine case-study-workbench">
          <div className="engine-top"><div><div className="eyebrow">CASE STUDY ENGINE</div><h2>Build the story of<br/><em>{current.title}.</em></h2></div><div className="engine-note">Select a step to continue shaping this case study.</div></div>
          <div className="steps">{stages.map((s,i)=><button key={s} className={`step ${active===s?"current":""} ${stages.indexOf(current.stage)>i?"done":""}`} onClick={()=>selectStage(s)}><span className="step-num">{stages.indexOf(current.stage)>i?<Check size={13}/>:String(i+1).padStart(2,"0")}</span><b>{stageLabels[s]}</b><ArrowUpRight size={13}/></button>)}</div>
          <div className="engine-work"><div className="engine-copy"><div className="eyebrow">ETAPA {String(stages.indexOf(active)+1).padStart(2,"0")} / 06</div><h3>{stageLabels[active]}</h3><p>{stageCopy[active]}</p><button className="text-button" onClick={advance}>Ir para a próxima etapa <ArrowRight size={15}/></button></div>
            <div className="engine-panel">
              {active==="Drop In" && <><div className="drop-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void addFiles(e.dataTransfer.files);}}><UploadCloud size={23}/><b>Solte seus arquivos aqui</b><span>Files are stored in this browser on this device</span><label className="outline-button">{busy?"Saving files...":"Browse files"}<input type="file" multiple disabled={busy} onChange={e=>{void addFiles(e.target.files);e.currentTarget.value="";}}/></label></div><div className="source-list">{currentAssets.length?currentAssets.map(asset=><div className="source-row" key={asset.id}><FileText size={15}/><span className="source-name">{asset.name}</span><button className="source-action" title="Download file" onClick={()=>void downloadAsset(asset)}><Download size={14}/></button><button className="source-action" title="Remove file" onClick={()=>void deleteAsset(asset)}><X size={14}/></button></div>):<div className="empty-source"><Image size={17}/> Your source material will appear here</div>}</div></>}
              {active==="Evidence" && <><div className="panel-heading"><b>Anotações e evidências</b><span>AUTO-SAVED LOCALLY</span></div><textarea value={notes[current.id]??""} onChange={e=>setNotes(prev=>({...prev,[current.id]:e.target.value}))} placeholder="Registre fatos, resultados, decisões, métricas, seu papel e outras informações importantes..."/><div className="hint">Your notes are saved in this browser on this device.</div></>}
              {active==="Story Plan" && <><div className="panel-heading"><b>Estrutura da história</b><span>EDITABLE DRAFT</span></div>{["The challenge","The approach","The making","The outcome"].map((x,i)=><div className="outline-row" key={x}><span>0{i+1}</span><b>{x}</b><span>{i===0?"Why this work mattered":i===1?"The idea and decisions":i===2?"Process, details and craft":"Results and reflection"}</span><ArrowUpRight size={14}/></div>)}</>}
              {active==="Design" && <><div className="panel-heading"><b>Escolha uma direção visual</b><span>LAYOUT PRESETS</span></div><div className="template-grid">{(["Bento","Studio","Editorial"] as TemplateName[]).map((x,i)=><button className={templates[current.id]===x || (!templates[current.id]&&i===1)?"template chosen":"template"} key={x} onClick={()=>setTemplates(prev=>({...prev,[current.id]:x}))}><div className={`template-preview t${i}`}><i/><i/><i/></div><b>{x}</b><span>{i===0?"Modular & flexible":i===1?"Image-led & spacious":"Type-led & narrative"}</span></button>)}</div></>}
              {active==="Your Look" && <><div className="panel-heading"><b>Identidade visual</b><span>GLERMENRIK DEFAULT</span></div><div className="swatches"><div style={{background:appearance.paper}}/><div style={{background:appearance.ink}}/><div style={{background:appearance.accent}}/></div><button className="outline-button" onClick={()=>setSection("Aparência")}>Customize palette <Palette size={14}/></button></>}
              {active==="Publish" && <><div className="publish-state"><div className="publish-icon"><Check size={20}/></div><div><b>Draft ready for review.</b><span>Public publishing is not connected yet.</span></div></div><button className="outline-button" onClick={()=>setNotice("Publishing is not connected yet.")}>Review publishing status</button></>}
            </div>
          </div>
        </section>}
        <footer><span>PORTFOLIO STUDIO <b>·</b> AN INDEPENDENT STUDIO GH PRODUCT</span><span>{notice}</span></footer>
      </div>
    </main>
    {showNew && <div className="modal-backdrop" onClick={()=>setShowNew(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowNew(false)} aria-label="Close"><X size={18}/></button><div className="eyebrow">START SOMETHING GOOD</div><h2>Novo estudo de caso</h2><p>Give this project a name. You can shape the story as you go.</p><label>Project name<input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Ex.: uma nova identidade visual"/></label><label>Category<select value={newCategory} onChange={e=>setNewCategory(e.target.value)}><option>Art</option><option>Design</option><option>Creative Technology</option></select></label><button className="primary-button full" onClick={addProject} disabled={!newTitle.trim()}>Criar estudo de caso <ArrowRight size={16}/></button></div></div>}
    {showShortcuts && <div className="modal-backdrop" onClick={()=>setShowShortcuts(false)}><div className="modal shortcuts-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowShortcuts(false)} aria-label="Close"><X size={18}/></button><div className="eyebrow">QUICK GUIDE</div><h2>Workspace shortcuts</h2><p>Use these actions to move around the studio.</p><div className="shortcut-list"><div><b>Visão geral</b><span>Return to your workspace dashboard</span></div><div><b>Estudos de caso</b><span>Browse projects and open any case</span></div><div><b>Aparência</b><span>Adjust your studio palette</span></div><div><b>Six stages</b><span>Choose a stage to edit its material</span></div></div><button className="primary-button full" onClick={()=>setShowShortcuts(false)}>Entendi</button></div></div>}
  </div>;
}