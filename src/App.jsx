import { useState, useMemo } from "react";
import "./App.css";

const ADMIN_PASSWORD = "admin123";

const PERGUNTAS = [
  { id: 1, tipo: "estrelas", texto: "Como você avalia sua satisfação geral com nosso serviço?" },
  { id: 2, tipo: "estrelas", texto: "Como você avalia o atendimento recebido?" },
  { id: 3, tipo: "texto",    texto: "O que você mais gostou na sua experiência?" },
  { id: 4, tipo: "texto",    texto: "O que podemos melhorar para atendê-lo melhor?" },
];

const STORAGE_KEY = "pesquisa_respostas";

function carregarRespostas() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    return salvo ? JSON.parse(salvo) : [];
  } catch {
    return [];
  }
}

function salvarRespostas(lista) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch {
    // silencia erros de storage
  }
}

function Estrelas({ valor, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente"];
  return (
    <div>
      <div className="stars-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n}
            onClick={() => !readonly && onChange(n)}
            onMouseEnter={() => !readonly && setHover(n)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`star-btn${n <= (hover || valor) ? " active" : ""}${readonly ? " readonly" : ""}`}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}>★</button>
        ))}
      </div>
      {!readonly && <p className="star-label">{labels[hover || valor] || "\u00a0"}</p>}
    </div>
  );
}

function BarraMini({ valor, max, cor }) {
  return (
    <div className="barra-bg">
      <div className="barra-fill" style={{ width: `${max ? (valor / max) * 100 : 0}%`, background: cor }} />
    </div>
  );
}

function TelaPesquisa({ onVerAdmin }) {
  const [respostas, setRespostas] = useState({ p1: 0, p2: 0, p3: "", p4: "" });
  const [etapa, setEtapa] = useState("form");
  const [erros, setErros] = useState({});

  const atualizar = (k, v) => {
    setRespostas(p => ({ ...p, [k]: v }));
    setErros(p => ({ ...p, [k]: false }));
  };

  const enviar = () => {
    const e = {};
    if (!respostas.p1) e.p1 = true;
    if (!respostas.p2) e.p2 = true;
    if (!respostas.p3.trim()) e.p3 = true;
    if (!respostas.p4.trim()) e.p4 = true;
    if (Object.keys(e).length) { setErros(e); return; }
    const nova = { id: Date.now(), data: new Date().toISOString().split("T")[0], ...respostas };
    const lista = [...carregarRespostas(), nova];
    salvarRespostas(lista);
    setEtapa("obrigado");
  };

  if (etapa === "obrigado") return (
    <div className="card">
      <div className="obrigado">
        <div className="obrigado-icon">🎉</div>
        <h2 className="obrigado-titulo">Obrigado pelo seu feedback!</h2>
        <p className="obrigado-texto">
          Sua resposta foi registrada de forma <strong>anônima e confidencial</strong>.<br />
          Sua opinião é muito importante para nós!
        </p>
        <div className="badge">🔒 Resposta confidencial garantida</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <button className="btn-secundario"
            onClick={() => { setRespostas({ p1: 0, p2: 0, p3: "", p4: "" }); setEtapa("form"); }}>
            Responder novamente
          </button>
          <button className="btn-admin" onClick={onVerAdmin}>🔐 Admin</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="header-icon">📋</div>
        <h1 className="header-titulo">Pesquisa de Satisfação</h1>
        <p className="header-sub">Suas respostas são <strong>anônimas e confidenciais</strong>.<br />Leva menos de 2 minutos!</p>
        <div className="badge">🔒 100% Confidencial</div>
      </div>

      <div className="perguntas">
        {[
          { k: "p1", idx: 0, tipo: "estrelas" },
          { k: "p2", idx: 1, tipo: "estrelas" },
          { k: "p3", idx: 2, tipo: "texto", ph: "Escreva aqui..." },
          { k: "p4", idx: 3, tipo: "texto", ph: "Sua sugestão é muito valiosa..." },
        ].map(({ k, idx, tipo, ph }) => (
          <div key={k} className={`bloco${erros[k] ? " bloco-erro" : ""}`}>
            <p className="label">
              <span className="num">{idx + 1}</span>{PERGUNTAS[idx].texto}
            </p>
            {tipo === "estrelas"
              ? <Estrelas valor={respostas[k]} onChange={v => atualizar(k, v)} />
              : <textarea className="textarea" rows={3} placeholder={ph}
                  value={respostas[k]} onChange={e => atualizar(k, e.target.value)} />
            }
            {erros[k] && <p className="erro-msg">{tipo === "estrelas" ? "Por favor, selecione uma avaliação." : "Por favor, escreva sua resposta."}</p>}
          </div>
        ))}
      </div>

      <div className="card-footer">
        <button className="btn-admin" onClick={onVerAdmin}>🔐 Admin</button>
        <button className="btn-primario" onClick={enviar}>Enviar Pesquisa →</button>
      </div>
    </div>
  );
}

function TelaLogin({ onLogin, onVoltar }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [mostrar, setMostrar] = useState(false);

  const entrar = () => {
    if (senha === ADMIN_PASSWORD) onLogin();
    else { setErro(true); setSenha(""); }
  };

  return (
    <div className="card">
      <div className="login-wrap">
        <div className="login-icon">🔐</div>
        <h2 className="login-titulo">Acesso Administrativo</h2>
        <p className="login-sub">Digite a senha para acessar o dashboard</p>
        <label className="campo-label">Senha de acesso</label>
        <div className="senha-wrap">
          <input type={mostrar ? "text" : "password"}
            className={`input${erro ? " input-erro" : ""}`}
            value={senha} placeholder="••••••••"
            onChange={e => { setSenha(e.target.value); setErro(false); }}
            onKeyDown={e => e.key === "Enter" && entrar()} />
          <button className="btn-olho" onClick={() => setMostrar(!mostrar)}>{mostrar ? "🙈" : "👁️"}</button>
        </div>
        {erro && <p className="erro-msg">Senha incorreta. Tente novamente.</p>}
        <button className="btn-primario full" onClick={entrar}>Entrar no Dashboard</button>
        <button className="btn-secundario full" style={{ marginTop: 10 }} onClick={onVoltar}>← Voltar à pesquisa</button>
      </div>
    </div>
  );
}

function Dashboard({ onSair }) {
  const [dados] = useState(() => carregarRespostas());
  const cores = ["#ef4444","#f97316","#eab308","#22c55e","#10b981"];
  const lbl = ["","★","★★","★★★","★★★★","★★★★★"];

  const m = useMemo(() => {
    const n = dados.length;
    if (!n) return null;
    const mediaP1 = (dados.reduce((s, r) => s + r.p1, 0) / n).toFixed(1);
    const mediaP2 = (dados.reduce((s, r) => s + r.p2, 0) / n).toFixed(1);
    const mediaGeral = (((+mediaP1 + +mediaP2) / 2)).toFixed(1);
    const distP1 = [1,2,3,4,5].map(e => ({ e, q: dados.filter(r => r.p1 === e).length }));
    const distP2 = [1,2,3,4,5].map(e => ({ e, q: dados.filter(r => r.p2 === e).length }));
    const pct = Math.round((dados.filter(r => r.p1 >= 4 && r.p2 >= 4).length / n) * 100);
    return { n, mediaP1, mediaP2, mediaGeral, distP1, distP2, pct };
  }, [dados]);

  return (
    <div className="card dash-card">
      <div className="dash-header">
        <div>
          <h2 className="dash-titulo">📊 Dashboard Administrativo</h2>
          <p className="dash-sub">Pesquisa de Satisfação — Visão geral dos resultados</p>
        </div>
        <button className="btn-sair" onClick={onSair}>Sair</button>
      </div>

      <div className="dash-body">
        <div className="grid3">
          <div className="metrica purple"><p className="m-label">Total de Respostas</p><p className="m-valor">{m?.n ?? 0}</p><p className="m-sub">📋 respondentes</p></div>
          <div className="metrica green"><p className="m-label">Média Geral</p><p className="m-valor green-text">{m?.mediaGeral ?? "—"} <span style={{fontSize:18}}>★</span></p><p className="m-sub">de 5.0 possíveis</p></div>
          <div className="metrica blue"><p className="m-label">Clientes Satisfeitos</p><p className="m-valor blue-text">{m?.pct ?? 0}%</p><p className="m-sub">avaliaram ≥ 4 estrelas</p></div>
        </div>

        {m && (
          <div className="grid2">
            {[{label:"Satisfação Geral", dist: m.distP1, media: m.mediaP1},{label:"Atendimento", dist: m.distP2, media: m.mediaP2}].map(({label,dist,media}) => (
              <div key={label}>
                <h3 className="secao-titulo">{label}</h3>
                <div className="secao">
                  <p className="secao-media">Média: {media} ★</p>
                  {dist.slice().reverse().map(({e,q}) => (
                    <div key={e} className="dist-row">
                      <span className="dist-label" style={{color: cores[e-1]}}>{lbl[e]}</span>
                      <BarraMini valor={q} max={m.n} cor={cores[e-1]} />
                      <span className="dist-count">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="secao">
          <h3 className="secao-titulo">💬 Comentários Recentes</h3>
          <div className="comentarios">
            {dados.slice(-6).reverse().map(r => (
              <div key={r.id} className="comentario-card">
                <div className="coment-top">
                  <div className="coment-stars">
                    <span>Satisfação: <strong style={{color:"#f59e0b"}}>{"★".repeat(r.p1)}</strong></span>
                    <span>Atendimento: <strong style={{color:"#f59e0b"}}>{"★".repeat(r.p2)}</strong></span>
                  </div>
                  <span className="coment-data">{r.data}</span>
                </div>
                <div className="coment-body">
                  <div><p className="coment-cat green-cat">✅ O que mais gostou</p><p className="coment-text">{r.p3}</p></div>
                  <div><p className="coment-cat purple-cat">🔧 O que melhorar</p><p className="coment-text">{r.p4}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="rodape-privacidade">🔒 Todas as respostas são anônimas e confidenciais. Nenhum dado de identificação pessoal é coletado.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [tela, setTela] = useState("pesquisa");
  return (
    <div className="pagina">
      {tela === "pesquisa"  && <TelaPesquisa onVerAdmin={() => setTela("login")} />}
      {tela === "login"     && <TelaLogin onLogin={() => setTela("dashboard")} onVoltar={() => setTela("pesquisa")} />}
      {tela === "dashboard" && <Dashboard onSair={() => setTela("pesquisa")} />}
    </div>
  );
}
