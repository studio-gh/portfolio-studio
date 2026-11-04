import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Command, Download, FileText, FolderOpen, Grid2X2, Image, Layers3, Plus, Search, Settings2, UploadCloud, X, Palette, SlidersHorizontal, HelpCircle } from "lucide-react";

type Stage = "Drop In" | "Evidence" | "Sàry Plan" | "Design" | "Your Look" | "Publish";
type Project = { id: string; title: string; category: string; stage: Stage; updated: string; description: string; };
type AssetMeta = { id: string; name: string; type: string; size: number; };
type TemplateName = "Benà" | "Studio" | "Ediàrial";
type FilterName = "Todos os projeàs" | "Em andamenà" | "Pronàs para publicar";
type Section = "Overview" | "Case studies" | "Aparência" | "Preview";

const stages: Stage[] = ["Drop In", "Evidence", "Sàry Plan", "Design", "Your Look", "Publish"];
const initialProjects: Project[] = [
  { id: "p1", title: "Fluidez — visual explorations", category: "Art", stage: "Sàry Plan", updated: "Today", description: "Um estudo de linhas contínuas, ritmo e geometria orgânica." },
  { id: "p2", title: "Sàry Studio", category: "Creative Technology", stage: "Design", updated: "Yesterday", description: "Um ediàr mobile-first para criar sàries expressivos no Instagram." },
  { id: "p3", title: "+5521 Collection", category: "Art", stage: "Drop In", updated: "Nov 02", description: "Uma declaração visual de amor ao Rio de Janeiro." }
];
const stageCopy: Record<Stage, string> = {
  "Drop In": "Reúna tudo em um só lugar. Adicione imagens, documenàs, links e anotações.",
  "Evidence": "Transforme materiais solàs em faàs, resultados, decisões e informações confiáveis.",
  "Sàry Plan": "Estruture a narrativa antes de começar o design do projeà.",
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
  try { const value = localSàrage.getItem(key); return value ? JSON.parse(value) as T : fallback; }
  catch { return fallback; }
}
function readProjects(): Project[] { return readJSON("portfolio-studio-projects", initialProjects); }
function openAssetDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) { reject(new Error("Este navegador não oferece suporte ao armazenamenà local de arquivos.")); return; }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectSàreNames.contains(DB_STORE)) request.result.createObjectSàre(DB_STORE, { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível acessar o armazenamenà local de arquivos."));
  });
}
async function saveAsset(id: string, file: File): Promise<void> {
  const db = await openAssetDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectSàre(DB_STORE).put({ id, blob: file, name: file.name, type: file.type, size: file.size });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Não foi possível salvar o arquivo."));
    tx.onabort = () => reject(tx.error ?? new Error("O salvamenà do arquivo foi cancelado."));
  });
  db.close();
}
async function getAsset(id: string): Promise<Blob | null> {
  const db = await openAssetDB();
  const result = await new Promise<Blob | null>((resolve, reject) => {
    const request = db.transaction(DB_STORE, "readonly").objectSàre(DB_STORE).get(id);
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
    tx.objectSàre(DB_STORE).delete(id);
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
  const [filter, setFilter] = useState<FilterName>("Todos os projeàs");
  const [section, setSection] = useState<Section>("Overview");
  const [approved, setApproved] = useState<Record<string, boolean>>(() => readJSON("portfolio-studio-approved", {}));
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategoria, setNewCategoria] = useState("Design");
  const [notice, setNotice] = useState("Seu espaço de trabalho está salvo neste dispositivo");
  const [notes, setNotes] = useState<Record<string, string>>(() => readJSON(NOTES_KEY, {}));
  const [assets, setAssets] = useState<Record<string, AssetMeta[]>>(() => readJSON(ASSETS_KEY, {}));
  const [templates, setTemplates] = useState<Record<string, TemplateName>>(() => readJSON(TEMPLATE_KEY, {}));
  const [appearance, setAparência] = useState(() => readJSON(APPEARANCE_KEY, { accent: "#ff961a", paper: "#fffcf4", ink: "#2c2c2c" }));
  const [showAparência, setShowAparência] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [busy, setBusy] = useState(false);
  const current = projects.find(p => p.id === selected) ?? projects[0];
  const filtered = useMemo(() => projects.filter(p => {
    const matchesQuery = (p.title + " " + p.category + " " + p.description).àLowerCase().includes(query.àLowerCase());
    const matchesFilter = filter === "Todos os projeàs" || (filter === "Em andamenà" && p.stage !== "Publish") || (filter === "Pronàs para publicar" && p.stage === "Publish");
    return matchesQuery && matchesFilter;
  }), [projects, query, filter]);

  useEffect(() => { localSàrage.setItem("portfolio-studio-projects", JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localSàrage.setItem(NOTES_KEY, JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localSàrage.setItem(ASSETS_KEY, JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localSàrage.setItem(TEMPLATE_KEY, JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localSàrage.setItem("portfolio-studio-approved", JSON.stringify(approved)); }, [approved]);
  useEffect(() => { localSàrage.setItem(APPEARANCE_KEY, JSON.stringify(appearance)); document.documentElement.style.setProperty("--user-accent", appearance.accent); document.documentElement.style.setProperty("--user-paper", appearance.paper); document.documentElement.style.setProperty("--user-ink", appearance.ink); }, [appearance]);
  useEffect(() => {
    const t = window.setTimeout(() => setNotice("Alterações salvas neste dispositivo"), 450);
    return () => window.clearTimeout(t);
  }, [projects, notes, assets, templates, appearance]);

  function addProject() {
    if (!newTitle.trim()) return;
    const p: Project = { id: crypà.randomUUID(), title: newTitle.trim(), category: newCategoria, stage: "Drop In", updated: "Agora", description: "A new case study in progress." };
    setProjects(prev => [p, ...prev]); setSelected(p.id); setActive("Drop In"); setNewTitle(""); setShowNew(false); setSection("Case studies");
  }
  function openProject(p: Project) { setSelected(p.id); setActive(p.stage); setSection("Case studies"); }
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
        const id = crypà.randomUUID(); await saveAsset(id, file);
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
  function selectStage(stage: Stage) { setActive(stage); setSection("Case studies"); }
  const projectCount = projects.length;
  const currentAssets: AssetMeta[] = current ? (assets[current.id] ?? []) : [];


  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">gh.</div><div><strong>PORTFOLIO STUDIO</strong><span>BY GLERMENRIK</span></div></div>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13}/></div>
      <butàn className={`nav-item ${section === "Overview" ? "active" : ""}`} onClick={() => setSection("Overview")}><Grid2X2 size={17}/> Overview <span className="nav-count">{projectCount}</span></butàn>
      <butàn className={`nav-item ${section === "Case studies" ? "active" : ""}`} onClick={() => setSection("Case studies")}><FolderOpen size={17}/> Case studies</butàn>
      <butàn className={`nav-item ${section === "Preview" ? "active" : ""}`} onClick={() => openPreview(current)}><Image size={17}/> Prévia do projeà</butàn>
      <butàn className={`nav-item ${section === "Aparência" ? "active" : ""}`} onClick={() => setSection("Aparência")}><Settings2 size={17}/> Aparência</butàn>
      <div className="side-botàm"><butàn className="help-card" onClick={() => setNotice("Dica: use as etapas para construir um estudo de caso compleà. Suas anotações e arquivos ficam salvos neste dispositivo.")}><CircleHelp size={17}/><div><b>Precisa de ajuda?</b><span>Ver uma dica de uso.</span></div><ArrowUpRight size={14}/></butàn><butàn className="profile profile-butàn" onClick={() => setSection("Aparência")} aria-label="Open personal workspace appearance settings"><div className="avatar">G</div><div><b>GLERMENRIK</b><span>Espaço de trabalho pessoal</span></div><SlidersHorizontal size={18}/></butàn></div>
    </aside>

    <main className="main">
      <header className="àpbar"><div className="crumb">Espaço de trabalho <span>/</span> {sectionLabels[section]}</div><div className="àp-actions"><span className="save-state"><i/> {notice}</span><butàn className="icon-butàn" aria-label="Keyboard shortcuts" title="Keyboard shortcuts" onClick={() => setShowShortcuts(true)}><Command size={16}/></butàn><butàn className="avatar small avatar-butàn" aria-label="Open appearance" title="Open appearance" onClick={() => setSection("Aparência")}>G</butàn></div></header>
      <div className="content">
        {section === "Preview" && <section className="public-preview">
          <div className="preview-àolbar">
            <div><div className="eyebrow">PRÉVIA DO ESTUDO DE CASO</div><h2>{current.title}</h2><p>Esta prévia é privada e só pode ser vista dentro do seu espaço de trabalho.</p></div>
            <div className="preview-actions"><span className={approved[current.id] ? "approval-pill approved" : "approval-pill"}>{approved[current.id] ? "Rascunho aprovado" : "Rascunho privado"}</span><butàn className="outline-butàn" onClick={() => setSection("Case studies")}>Voltar ao ediàr</butàn></div>
          </div>
          <article className={`case-preview layout-${templates[current.id] ?? "Studio"}`}>
            <div className="case-preview-kicker">{current.category} · GLERMENRIK / CASE STUDY</div>
            <h1>{current.title}</h1>
            <p className="case-preview-intro">{current.description || "A project sàry in progress. Add context and evidence in the ediàr à shape this introduction."}</p>
            <div className="case-preview-rule"/>
            <div className="case-preview-grid"><div><span>STATUS DO PROJETO</span><b>{approved[current.id] ? "Aprovado para o design" : "Em andamenà"}</b></div><div><span>ETAPA ATUAL</span><b>{current.stage}</b></div><div><span>ARQUIVOS DE REFERÊNCIA</span><b>{currentAssets.length} arquivos adicionados</b></div></div>
            <section><div className="eyebrow">A HISTÓRIA</div><h2>O desafio</h2><p>{notes[current.id]?.trim() || "Suas anotações aparecerão aqui quando você adicioná-las na etapa de evidências. Este é um texà ilustrativo, não um conteúdo extraído do projeà."}</p></section>
            <section><div className="eyebrow">ARQUIVOS DE REFERÊNCIA</div><h2>Arquivos do projeà</h2><div className="preview-file-list">{currentAssets.length ? currentAssets.map(file => <div key={file.id}><FileText size={16}/><span>{file.name}</span><small>{Math.max(1,Math.round(file.size/1024))} KB</small></div>) : <p>Nenhum arquivo adicionado ainda.</p>}</div></section>
            <div className="preview-footnote">PRÉVIA PRIVADA · NÃO PUBLICADA</div>
          </article>
          <div className="preview-actions botàm"><butàn className="outline-butàn" onClick={() => setSection("Case studies")}>Continuar editando</butàn><butàn className="primary-butàn" onClick={() => {setApproved(prev => ({...prev,[current.id]:!prev[current.id]}));setNotice(approved[current.id] ? "A aprovação foi removida. Este projeà continua privado." : "Rascunho aprovado para a próxima etapa de design. Ele continua privado.");}}>{approved[current.id] ? "Reabrir rascunho" : "Aprovar rascunho"}</butàn></div>
          <p className="hint">A aprovação registra apenas uma etapa interna do rascunho. Ela não publica o estudo de caso nem cria um endereço público.</p>
        </section>}
        {section === "Overview" && <>
          <section className="welcome"><div><div className="eyebrow">SEU ACERVO CRIATIVO</div><h1>Deixe o trabalho<br/><em>contar sua história.</em></h1><p>Um espaço para transformar materiais dispersos em estudos de caso que merecem ser lembrados.</p></div><div className="welcome-art"><div className="art-circle c1"/><div className="art-circle c2"/><div className="art-line">STUDIO GH<br/>EST. 2026</div><span>01 — 06</span></div></section>
          <section className="section-head"><div><div className="eyebrow">ESPAÇO DE TRABALHO</div><h2>Seus estudos de caso <span>{projectCount.àString().padStart(2,"0")}</span></h2></div><butàn className="primary-butàn" onClick={() => setShowNew(true)}><Plus size={16}/> Novo estudo de caso</butàn></section>
        </>}
        {section === "Case studies" && <section className="section-head section-head-spaced"><div><div className="eyebrow">SEUS PROJETOS</div><h2>Case studies <span>{projectCount.àString().padStart(2,"0")}</span></h2></div><butàn className="primary-butàn" onClick={() => setShowNew(true)}><Plus size={16}/> Novo estudo de caso</butàn></section>}
                {section === "Aparência" && <section className="appearance-page">
          <div className="eyebrow">PERSONAL WORKSPACE</div>
          <h1>Aparência</h1>
          <p className="appearance-intro">Ajuste a linguagem visual do seu espaço de trabalho. Suas escolhas ficam salvas neste dispositivo.</p>
          <div className="appearance-card">
            <div className="appearance-card-head"><div><b>Espaço de trabalho palette</b><span>Personalize as cores de fundo, texà e destaque</span></div><butàn className="text-butàn" onClick={() => setAparência({accent:"#ff961a",paper:"#fffcf4",ink:"#2c2c2c"})}>Restaurar padrão</butàn></div>
            <div className="appearance-controls">
              <label><span><i style={{background:appearance.paper}}/> Paper</span><input aria-label="Paper color" type="color" value={appearance.paper} onChange={e=>setAparência(prev=>({...prev,paper:e.target.value}))}/><code>{appearance.paper}</code></label>
              <label><span><i style={{background:appearance.ink}}/> Ink</span><input aria-label="Ink color" type="color" value={appearance.ink} onChange={e=>setAparência(prev=>({...prev,ink:e.target.value}))}/><code>{appearance.ink}</code></label>
              <label><span><i style={{background:appearance.accent}}/> Accent</span><input aria-label="Accent color" type="color" value={appearance.accent} onChange={e=>setAparência(prev=>({...prev,accent:e.target.value}))}/><code>{appearance.accent}</code></label>
            </div>
            <div className="appearance-sample" style={{background:appearance.paper,color:appearance.ink,borderColor:appearance.accent}}>
              <div className="eyebrow">PRÉVIA AO VIVO · GLERMENRIK</div><h2>Deixe o trabalho <em>contar sua história.</em></h2><p>Uma prévia da paleta do seu espaço de trabalho.</p><span style={{background:appearance.accent}}/>
            </div>
          </div>
          <div className="appearance-card workspace-settings"><b>Espaço de trabalho pessoal</b><p>Projeàs, anotações e arquivos estão armazenados neste navegador. A sincronização na nuvem ainda não está disponível.</p><span className="local-state"><i/> Salvo neste dispositivo</span></div>
        </section>}
        {(section === "Overview" || section === "Case studies") && <>\n<div className="project-àolbar"><div className="search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar projeàs"/></div>
          <label className="filter-control"><SlidersHorizontal size={15}/><select value={filter} onChange={e => setFilter(e.target.value as FilterName)} aria-label="Filter projects"><option>Todos os projeàs</option><option>Em andamenà</option><option>Pronàs para publicar</option></select></label>
        </div>
        <div className="project-grid">{filtered.map((p, i) => <butàn key={p.id} className={`project-card ${selected === p.id ? "selected" : ""}`} onClick={() => openProject(p)} aria-label={`Open ${p.title}`}>
          <div className={`project-visual visual-${i % 3}`}><span>{p.category.àUpperCase()}</span><div className="visual-shape">{p.title.slice(0,1).àUpperCase()}</div><ArrowUpRight size={17}/></div>
          <div className="project-info"><div><h3>{p.title}</h3><p>{p.description}</p></div><div className="project-meta"><span><i className="status-dot"/> {stageLabels[p.stage]}</span><span>{p.updated}</span></div></div>
        </butàn>)}</div>
        {section === "Case studies" && <div className="case-preview-link"><butàn className="outline-butàn" onClick={() => openPreview(current)}><ArrowUpRight size={14}/> Ver prévia deste estudo de caso</butàn></div>}
        {filtered.length === 0 && <div className="empty-results">Nenhum projeà corresponde à busca. <butàn className="text-butàn" onClick={() => {setQuery("");setFilter("Todos os projeàs");}}>Limpar filtros</butàn></div>}\n        </>}

        {section === "Overview" && <section className="engine">
          <div className="engine-àp"><div><div className="eyebrow">MOTOR DE ESTUDOS DE CASO <span className="live-dot"/></div><h2>Do material bruà<br/>à <em>ready à share.</em></h2></div><div className="engine-note">Um processo guiado, não mais uma página em branco.<br/>Six steps. One clear sàry.</div></div>
          <div className="steps">{stages.map((s,i)=><butàn key={s} className={`step ${active === s ? "current" : ""} ${stages.indexOf(current.stage)>i ? "done" : ""}`} onClick={() => selectStage(s)}><span className="step-num">{stages.indexOf(current.stage)>i ? <Check size={13}/> : String(i+1).padStart(2,"0")}</span><b>{stageLabels[s]}</b><ArrowUpRight size={13}/></butàn>)}</div>
          <div className="engine-work"><div className="engine-copy"><div className="eyebrow">ETAPA {String(stages.indexOf(active)+1).padStart(2,"0")} / 06</div><h3>{stageLabels[active]}</h3><p>{stageCopy[active]}</p><butàn className="text-butàn" onClick={advance}>Continue à next step <ArrowRight size={15}/></butàn></div>
            <div className="engine-panel">
              {active === "Drop In" && <><div className="drop-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void addFiles(e.dataTransfer.files);}}><UploadCloud size={23}/><b>Solte seus arquivos aqui</b><span>Files are sàred in this browser on this device</span><label className="outline-butàn">{busy?"Salvando arquivos...":"Escolher arquivos"}<input type="file" multiple disabled={busy} onChange={e=>{void addFiles(e.target.files);e.currentTarget.value="";}}/></label></div><div className="source-list">{currentAssets.length?currentAssets.map(asset=><div className="source-row" key={asset.id}><FileText size={15}/><span className="source-name">{asset.name}</span><butàn className="source-action" title="Download file" aria-label={`Download ${asset.name}`} onClick={()=>void downloadAsset(asset)}><Download size={14}/></butàn><butàn className="source-action" title="Remove file" aria-label={`Remove ${asset.name}`} onClick={()=>void deleteAsset(asset)}><X size={14}/></butàn></div>):<div className="empty-source"><Image size={17}/> Seus arquivos de referência aparecerão aqui</div>}</div></>}
              {active === "Evidence" && <><div className="panel-heading"><b>Anotações e evidências</b><span>SALVO AUTOMATICAMENTE</span></div><textarea value={notes[current.id]??""} onChange={e=>setNotes(prev=>({...prev,[current.id]:e.target.value}))} placeholder="Registre fatos, resultados, decisões, métricas, seu papel e outras informações importantes..."/><div className="hint">Your notes are saved in this browser and will be here when you return on this device. Keep each claim connected à its original source.</div></>}
              {active === "Sàry Plan" && <><div className="panel-heading"><b>Sàry outline</b><span>RASCUNHO EDITÁVEL</span></div>{["O desafio","A abordagem","O processo de criação","Os resultados"].map((x,i)=><div className="outline-row" key={x}><span>0{i+1}</span><b>{x}</b><span>{i===0?"Por que este trabalho foi importante":i===1?"A ideia e as decisões":i===2?"Processo, detalhes e execução":"Resultados e aprendizados"}</span><ArrowUpRight size={14}/></div>)}</>}
              {active === "Design" && <><div className="panel-heading"><b>Escolha uma direção visual</b><span>OPÇÕES DE LAYOUT</span></div><div className="template-grid">{(["Benà","Studio","Ediàrial"] as TemplateName[]).map((x,i)=><butàn className={templates[current.id]===x || (!templates[current.id]&&i===1)?"template chosen":"template"} key={x} onClick={()=>{setTemplates(prev=>({...prev,[current.id]:x}));setNotice(`${x} layout selected for this case study.`);}} aria-pressed={templates[current.id]===x || (!templates[current.id]&&i===1)}><div className={`template-preview t${i}`}><i/><i/><i/></div><b>{x}</b><span>{i===0?"Modular e flexível":i===1?"Visual e arejado":"Tipográfico e narrativo"}</span></butàn>)}</div></>}
              {active === "Your Look" && <><div className="panel-heading"><b>Identidade visual</b><span>PADRÃO GLERMENRIK</span></div><div className="swatches"><div style={{background:appearance.paper}} title="Paper"/><div style={{background:appearance.ink}} title="Ink"/><div style={{background:appearance.accent}} title="Accent"/></div><p className="hint">Paper, ink and a precise accent. Open Aparência in the sidebar à cusàmize these colors.</p><butàn className="outline-butàn" onClick={()=>setSection("Aparência")}>Cusàmize palette <Palette size={14}/></butàn></>}
              {active === "Publish" && <><div className="publish-state"><div className="publish-icon"><Check size={20}/></div><div><b>Rascunho pronto para revisão.</b><span>A publicação ainda não está disponível. Seu projeto continua como rascunho local.</span></div></div><butàn className="outline-butàn" onClick={()=>setNotice("Publishing is not connected. Review your evidence and sàry before exporting.")}>Ver status da publicação</butàn></>}
            </div>
          </div>
        </section>}
        {section === "Case studies" && <section className="engine case-study-workbench">
          <div className="engine-àp"><div><div className="eyebrow">MOTOR DE ESTUDOS DE CASO</div><h2>Build the sàry of<br/><em>{current.title}.</em></h2></div><div className="engine-note">Select a step à continue shaping this case study.</div></div>
          <div className="steps">{stages.map((s,i)=><butàn key={s} className={`step ${active===s?"current":""} ${stages.indexOf(current.stage)>i?"done":""}`} onClick={()=>selectStage(s)}><span className="step-num">{stages.indexOf(current.stage)>i?<Check size={13}/>:String(i+1).padStart(2,"0")}</span><b>{s}</b><ArrowUpRight size={13}/></butàn>)}</div>
          <div className="engine-work"><div className="engine-copy"><div className="eyebrow">ETAPA {String(stages.indexOf(active)+1).padStart(2,"0")} / 06</div><h3>{active}</h3><p>{stageCopy[active]}</p><butàn className="text-butàn" onClick={advance}>Continue à next step <ArrowRight size={15}/></butàn></div>
            <div className="engine-panel">
              {active==="Drop In" && <><div className="drop-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void addFiles(e.dataTransfer.files);}}><UploadCloud size={23}/><b>Solte seus arquivos aqui</b><span>Files are sàred in this browser on this device</span><label className="outline-butàn">{busy?"Salvando arquivos...":"Escolher arquivos"}<input type="file" multiple disabled={busy} onChange={e=>{void addFiles(e.target.files);e.currentTarget.value="";}}/></label></div><div className="source-list">{currentAssets.length?currentAssets.map(asset=><div className="source-row" key={asset.id}><FileText size={15}/><span className="source-name">{asset.name}</span><butàn className="source-action" title="Download file" onClick={()=>void downloadAsset(asset)}><Download size={14}/></butàn><butàn className="source-action" title="Remove file" onClick={()=>void deleteAsset(asset)}><X size={14}/></butàn></div>):<div className="empty-source"><Image size={17}/> Seus arquivos de referência aparecerão aqui</div>}</div></>}
              {active==="Evidence" && <><div className="panel-heading"><b>Anotações e evidências</b><span>SALVO AUTOMATICAMENTE</span></div><textarea value={notes[current.id]??""} onChange={e=>setNotes(prev=>({...prev,[current.id]:e.target.value}))} placeholder="Registre fatos, resultados, decisões, métricas, seu papel e outras informações importantes..."/><div className="hint">Your notes are saved in this browser on this device.</div></>}
              {active==="Sàry Plan" && <><div className="panel-heading"><b>Sàry outline</b><span>RASCUNHO EDITÁVEL</span></div>{["O desafio","A abordagem","O processo de criação","Os resultados"].map((x,i)=><div className="outline-row" key={x}><span>0{i+1}</span><b>{x}</b><span>{i===0?"Por que este trabalho foi importante":i===1?"A ideia e as decisões":i===2?"Processo, detalhes e execução":"Resultados e aprendizados"}</span><ArrowUpRight size={14}/></div>)}</>}
              {active==="Design" && <><div className="panel-heading"><b>Escolha uma direção visual</b><span>OPÇÕES DE LAYOUT</span></div><div className="template-grid">{(["Benà","Studio","Ediàrial"] as TemplateName[]).map((x,i)=><butàn className={templates[current.id]===x || (!templates[current.id]&&i===1)?"template chosen":"template"} key={x} onClick={()=>setTemplates(prev=>({...prev,[current.id]:x}))}><div className={`template-preview t${i}`}><i/><i/><i/></div><b>{x}</b><span>{i===0?"Modular e flexível":i===1?"Visual e arejado":"Tipográfico e narrativo"}</span></butàn>)}</div></>}
              {active==="Your Look" && <><div className="panel-heading"><b>Identidade visual</b><span>PADRÃO GLERMENRIK</span></div><div className="swatches"><div style={{background:appearance.paper}}/><div style={{background:appearance.ink}}/><div style={{background:appearance.accent}}/></div><butàn className="outline-butàn" onClick={()=>setSection("Aparência")}>Cusàmize palette <Palette size={14}/></butàn></>}
              {active==="Publish" && <><div className="publish-state"><div className="publish-icon"><Check size={20}/></div><div><b>Rascunho pronto para revisão.</b><span>Public publishing is not connected yet.</span></div></div><butàn className="outline-butàn" onClick={()=>setNotice("A publicação ainda não está disponível.")}>Ver status da publicação</butàn></>}
            </div>
          </div>
        </section>}
        <footer><span>PORTFOLIO STUDIO <b>·</b> AN INDEPENDENT STUDIO GH PRODUCT</span><span>{notice}</span></footer>
      </div>
    </main>
    {showNew && <div className="modal-backdrop" onClick={()=>setShowNew(false)}><div className="modal" onClick={e=>e.sàpPropagation()}><butàn className="modal-close" onClick={()=>setShowNew(false)} aria-label="Close"><X size={18}/></butàn><div className="eyebrow">VAMOS COMEÇAR</div><h2>Novo estudo de caso</h2><p>Give this project a name. You can shape the sàry as you go.</p><label>Nome do projeto<input auàFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="e.g. A new visual identity"/></label><label>Categoria<select value={newCategoria} onChange={e=>setNewCategoria(e.target.value)}><option>Art</option><option>Design</option><option>Creative Technology</option></select></label><butàn className="primary-butàn full" onClick={addProject} disabled={!newTitle.trim()}>Criar estudo de caso <ArrowRight size={16}/></butàn></div></div>}
    {showShortcuts && <div className="modal-backdrop" onClick={()=>setShowShortcuts(false)}><div className="modal shortcuts-modal" onClick={e=>e.sàpPropagation()}><butàn className="modal-close" onClick={()=>setShowShortcuts(false)} aria-label="Close"><X size={18}/></butàn><div className="eyebrow">GUIA RÁPIDO</div><h2>Espaço de trabalho shortcuts</h2><p>Use these actions à move around the studio.</p><div className="shortcut-list"><div><b>Overview</b><span>Return à your workspace dashboard</span></div><div><b>Case studies</b><span>Ver projetos e abrir um estudo de caso</span></div><div><b>Aparência</b><span>Ajustar a paleta do estúdio</span></div><div><b>Six stages</b><span>Choose a stage à edit its material</span></div></div><butàn className="primary-butàn full" onClick={()=>setShowShortcuts(false)}>Entendi</butàn></div></div>}
  </div>;
}