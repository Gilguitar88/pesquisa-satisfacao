import { useState, useMemo, useEffect } from "react";
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";

// ─── Configuração ──────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "admin123";

const MEDICOS = [
  "Dr. Arthur","Dra. Tayane","Dra. Lívia","Dra. Carol",
  "Dr. Renato","Dr. Guilherme","Dr. Rafael","Dr. João","Dr. Danilo",
];

const ESCALA = [
  { label: "Excelente", valor: 5, cor: "#10b981" },
  { label: "Muito bom", valor: 4, cor: "#22c55e" },
  { label: "Bom",       valor: 3, cor: "#eab308" },
  { label: "Regular",   valor: 2, cor: "#f97316" },
  { label: "Ruim",      valor: 1, cor: "#ef4444" },
];

const MESES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ─── Componente Opções de Avaliação ───────────────────────────────────────────
function OpcaoAvaliacao({ valor, onChange }) {
  return (
    <div className="opcoes-row">
      {ESCALA.map(({ label, valor: v, cor }) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`opcao-btn${valor === v ? " opcao-ativa" : ""}`}
          style={valor === v ? { borderColor: cor, background: cor+"18", color: cor } : {}}>
          <span className="opcao-dot" style={{ background: valor === v ? cor : "#d1d5db" }} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Tela da Pesquisa ──────────────────────────────────────────────────────────
function TelaPesquisa({ onVerAdmin }) {
  const [form, setForm] = useState({ nome:"", medico:"", avalMedico:0, avalRecepcao:0, gostou:"", melhorar:"" });
  const [etapa, setEtapa] = useState("form");
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErros(p => ({ ...p, [k]: false }));
  };

  const enviar = async () => {
    const e = {};
    if (!form.medico)          e.medico       = true;
    if (!form.avalMedico)      e.avalMedico   = true;
    if (!form.avalRecepcao)    e.avalRecepcao = true;
    if (!form.gostou.trim())   e.gostou       = true;
    if (!form.melhorar.trim()) e.melhorar     = true;
    if (Object.keys(e).length) { setErros(e); return; }

    setSalvando(true);
    try {
      await addDoc(collection(db, "respostas"), {
        ...form,
        data: new Date().toISOString().split("T")[0],
        criadoEm: new Date(),
      });
      setEtapa("obrigado");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao enviar. Verifique sua conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  if (etapa === "obrigado") return (
    <div className="card">
      <div className="obrigado">
        <div className="obrigado-icon">🎉</div>
        <h2 className="obrigado-titulo">Obrigado pelo seu feedback!</h2>
        <p className="obrigado-texto">
          Agradecemos por dedicar seu tempo e nos ajudar a evoluir cada vez mais! ✨<br />
          Sua resposta foi registrada de forma <strong>anônima e confidencial</strong>.
        </p>
        <div className="badge">🔒 Resposta confidencial garantida</div>
        <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:24, flexWrap:"wrap" }}>
          <button className="btn-secundario"
            onClick={() => { setForm({ nome:"", medico:"", avalMedico:0, avalRecepcao:0, gostou:"", melhorar:"" }); setEtapa("form"); }}>
            Nova resposta
          </button>
          <button className="btn-admin" onClick={onVerAdmin}>🔐 Admin</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="header-icon">💙</div>
        <h1 className="header-titulo">Clínica Mazon &amp; Bigliazzi</h1>
        <p className="header-sub" style={{fontSize:15}}>Pesquisa de Satisfação</p>
        <p className="header-sub" style={{opacity:.85, marginTop:4}}>
          Olá! Sua opinião é muito importante para nós 💙<br/>
          Queremos saber como foi sua experiência em nossa clínica:
        </p>
        <div className="badge" style={{marginTop:12}}>🔒 100% Confidencial &amp; Anônimo</div>
      </div>

      <div className="perguntas">
        {/* Nome – Opcional */}
        <div className="bloco">
          <p className="label">
            Seu nome <span className="opcional-tag">(não obrigatório)</span>
          </p>
          <input
            type="text"
            className="input-nome"
            placeholder="Digite seu nome (opcional)..."
            value={form.nome}
            onChange={e => set("nome", e.target.value)}
          />
        </div>

        {/* Q1 – Médico */}
        <div className={`bloco${erros.medico ? " bloco-erro" : ""}`}>
          <p className="label"><span className="num">1</span>Com qual doutor(a) você foi atendido(a)?</p>
          <div className="medicos-grid">
            {MEDICOS.map(m => (
              <button key={m} type="button"
                className={`medico-btn${form.medico === m ? " medico-ativo" : ""}`}
                onClick={() => set("medico", m)}>{m}
              </button>
            ))}
          </div>
          {erros.medico && <p className="erro-msg">Por favor, selecione o(a) doutor(a).</p>}
        </div>

        {/* Q2 – Avaliação do médico */}
        <div className={`bloco${erros.avalMedico ? " bloco-erro" : ""}`}>
          <p className="label"><span className="num">2</span>Como você avalia o atendimento recebido pelo doutor(a)?</p>
          <OpcaoAvaliacao valor={form.avalMedico} onChange={v => set("avalMedico", v)} />
          {erros.avalMedico && <p className="erro-msg">Por favor, selecione uma avaliação.</p>}
        </div>

        {/* Q3 – Avaliação da recepção */}
        <div className={`bloco${erros.avalRecepcao ? " bloco-erro" : ""}`}>
          <p className="label"><span className="num">3</span>Como você avalia o atendimento da recepção / WhatsApp?</p>
          <OpcaoAvaliacao valor={form.avalRecepcao} onChange={v => set("avalRecepcao", v)} />
          {erros.avalRecepcao && <p className="erro-msg">Por favor, selecione uma avaliação.</p>}
        </div>

        {/* Q4 */}
        <div className={`bloco${erros.gostou ? " bloco-erro" : ""}`}>
          <p className="label"><span className="num">4</span>O que você mais gostou na sua experiência em nossa clínica?</p>
          <textarea className="textarea" rows={3} placeholder="Escreva aqui..."
            value={form.gostou} onChange={e => set("gostou", e.target.value)} />
          {erros.gostou && <p className="erro-msg">Por favor, escreva sua resposta.</p>}
        </div>

        {/* Q5 */}
        <div className={`bloco${erros.melhorar ? " bloco-erro" : ""}`}>
          <p className="label"><span className="num">5</span>O que podemos melhorar para atendê-lo(a) ainda melhor?</p>
          <textarea className="textarea" rows={3} placeholder="Sua sugestão é muito valiosa..."
            value={form.melhorar} onChange={e => set("melhorar", e.target.value)} />
          {erros.melhorar && <p className="erro-msg">Por favor, escreva sua sugestão.</p>}
        </div>
      </div>

      <div className="card-footer">
        <button className="btn-admin" onClick={onVerAdmin}>🔐 Admin</button>
        <button className="btn-primario" onClick={enviar} disabled={salvando}>
          {salvando ? "Enviando…" : "Enviar Pesquisa →"}
        </button>
      </div>
    </div>
  );
}

// ─── Login Admin ───────────────────────────────────────────────────────────────
function TelaLogin({ onLogin, onVoltar }) {
  const [senha, setSenha] = useState("");
  const [erro,  setErro]  = useState(false);
  const [show,  setShow]  = useState(false);
  const entrar = () => {
    if (senha === ADMIN_PASSWORD) onLogin();
    else { setErro(true); setSenha(""); }
  };
  return (
    <div className="card">
      <div className="login-wrap">
        <div className="login-icon">🔐</div>
        <h2 className="login-titulo">Acesso Administrativo</h2>
        <p className="login-sub">Clínica Mazon &amp; Bigliazzi</p>
        <label className="campo-label">Senha de acesso</label>
        <div className="senha-wrap">
          <input type={show ? "text" : "password"}
            className={`input${erro ? " input-erro" : ""}`}
            value={senha} placeholder="••••••••"
            onChange={e => { setSenha(e.target.value); setErro(false); }}
            onKeyDown={e => e.key === "Enter" && entrar()} />
          <button className="btn-olho" onClick={() => setShow(!show)}>{show ? "🙈" : "👁️"}</button>
        </div>
        {erro && <p className="erro-msg">Senha incorreta.</p>}
        <button className="btn-primario full" onClick={entrar} style={{marginTop:16}}>Entrar no Dashboard</button>
        <button className="btn-secundario full" style={{marginTop:10}} onClick={onVoltar}>← Voltar à pesquisa</button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function valorParaLabel(v) { return ESCALA.find(e => e.valor === v)?.label ?? "—"; }
function labelCor(v)        { return ESCALA.find(e => e.valor === v)?.cor   ?? "#9ca3af"; }
function notaGeral(media) {
  if (media >= 4.5) return { cor:"#10b981", label:"Ótimo" };
  if (media >= 3.5) return { cor:"#22c55e", label:"Bom" };
  if (media >= 2.5) return { cor:"#eab308", label:"Regular" };
  return { cor:"#ef4444", label:"Ruim" };
}
function BarraMini({ valor, max, cor }) {
  return (
    <div className="barra-bg">
      <div className="barra-fill" style={{ width:`${max?(valor/max)*100:0}%`, background:cor }} />
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onSair }) {
  const [dados,    setDados]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [erro,     setErro]     = useState(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const snap = await getDocs(query(collection(db, "respostas"), orderBy("criadoEm", "asc")));
        setDados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        setErro("Erro ao carregar respostas.");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  // ── Métricas gerais
  const geral = useMemo(() => {
    const n = dados.length;
    if (!n) return null;
    const avgM = dados.reduce((s,r) => s + r.avalMedico,   0) / n;
    const avgR = dados.reduce((s,r) => s + r.avalRecepcao, 0) / n;
    const avgG = (avgM + avgR) / 2;
    const pct  = Math.round(dados.filter(r => r.avalMedico >= 4 && r.avalRecepcao >= 4).length / n * 100);
    const distM = ESCALA.map(({ valor, label, cor }) => ({ label, valor, cor, q: dados.filter(r => r.avalMedico   === valor).length }));
    const distR = ESCALA.map(({ valor, label, cor }) => ({ label, valor, cor, q: dados.filter(r => r.avalRecepcao === valor).length }));
    return { n, avgM: avgM.toFixed(1), avgR: avgR.toFixed(1), avgG: avgG.toFixed(1), pct, distM, distR };
  }, [dados]);

  // ── Por médico
  const porMedico = useMemo(() => {
    return MEDICOS.map(nome => {
      const it = dados.filter(r => r.medico === nome);
      if (!it.length) return null;
      const avg = (it.reduce((s,r) => s + r.avalMedico, 0) / it.length);
      const pct = Math.round(it.filter(r => r.avalMedico >= 4).length / it.length * 100);
      return { nome, n: it.length, avg: avg.toFixed(1), pct };
    }).filter(Boolean).sort((a,b) => parseFloat(b.avg) - parseFloat(a.avg));
  }, [dados]);

  // ── Mensal
  const mensal = useMemo(() => {
    const mapa = {};
    dados.forEach(r => {
      const [ano, mes] = r.data.split("-");
      const chave = `${ano}-${mes}`;
      if (!mapa[chave]) mapa[chave] = { chave, ano, mes, itens:[] };
      mapa[chave].itens.push(r);
    });
    return Object.values(mapa).sort((a,b) => b.chave.localeCompare(a.chave)).map(({ chave, ano, mes, itens }) => {
      const n  = itens.length;
      const avgM = (itens.reduce((s,r) => s + r.avalMedico,   0) / n);
      const avgR = (itens.reduce((s,r) => s + r.avalRecepcao, 0) / n);
      const avgG = (avgM + avgR) / 2;
      const pct  = Math.round(itens.filter(r => r.avalMedico>=4 && r.avalRecepcao>=4).length / n * 100);
      return { chave, mesNome:`${MESES_PT[parseInt(mes,10)-1]}/${ano}`, n,
        avgM:avgM.toFixed(1), avgR:avgR.toFixed(1), avgG:avgG.toFixed(1), pct };
    });
  }, [dados]);

  return (
    <div className="card dash-card">
      <div className="dash-header">
        <div>
          <h2 className="dash-titulo">📊 Dashboard Administrativo</h2>
          <p className="dash-sub">Clínica Mazon &amp; Bigliazzi — {loading ? "carregando…" : `${dados.length} resposta${dados.length!==1?"s":""} no banco`}</p>
        </div>
        <button className="btn-sair" onClick={onSair}>Sair</button>
      </div>

      <div className="dash-body">
        {loading && <div className="loading-box">⏳ Carregando respostas do banco de dados…</div>}
        {erro    && <div className="erro-box">❌ {erro}</div>}

        {!loading && !erro && (
          <>
            {/* ── Cards */}
            <div className="grid4">
              <div className="metrica purple"><p className="m-label">Total de Respostas</p><p className="m-valor">{geral?.n ?? 0}</p><p className="m-sub">📋 respondentes</p></div>
              <div className="metrica green"><p className="m-label">Média do Médico</p><p className="m-valor green-text">{geral?.avgM ?? "—"}</p><p className="m-sub">de 5.0</p></div>
              <div className="metrica blue"><p className="m-label">Média da Recepção</p><p className="m-valor blue-text">{geral?.avgR ?? "—"}</p><p className="m-sub">de 5.0</p></div>
              <div className="metrica orange"><p className="m-label">Avaliações Ótimas</p><p className="m-valor orange-text">{geral?.pct ?? 0}%</p><p className="m-sub">≥ Muito bom em ambos</p></div>
            </div>

            {/* ── Distribuição */}
            {geral && (
              <div className="grid2">
                {[{label:"Atendimento do Médico(a)", dist:geral.distM},{label:"Recepção / WhatsApp", dist:geral.distR}].map(({label,dist}) => (
                  <div key={label}>
                    <h3 className="secao-titulo">{label}</h3>
                    <div className="secao">
                      {dist.map(({label:lb, cor, q}) => (
                        <div key={lb} className="dist-row">
                          <span className="dist-label" style={{color:cor, width:80}}>{lb}</span>
                          <BarraMini valor={q} max={geral.n} cor={cor} />
                          <span className="dist-count">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Por Médico */}
            {porMedico.length > 0 && (
              <div className="secao">
                <h3 className="secao-titulo">👨‍⚕️ Avaliação por Médico(a)</h3>
                <div className="tabela-mensal-wrap">
                  <table className="tabela-mensal">
                    <thead><tr><th style={{textAlign:"left"}}>Médico(a)</th><th>Respostas</th><th>Média</th><th>% Ótimo/Muito bom</th><th>Status</th></tr></thead>
                    <tbody>
                      {porMedico.map(({ nome, n, avg, pct }) => {
                        const nota = notaGeral(parseFloat(avg));
                        return (
                          <tr key={nome}>
                            <td className="td-mes">{nome}</td>
                            <td className="td-center">{n}</td>
                            <td className="td-center">
                              <div className="media-geral-cel">
                                <span className="media-geral-val" style={{color:nota.cor}}>{avg}</span>
                                <div className="mini-barra-bg"><div className="mini-barra-fill" style={{width:`${parseFloat(avg)/5*100}%`,background:nota.cor}}/></div>
                              </div>
                            </td>
                            <td className="td-center"><span className="pct-badge" style={{background:pct>=70?"#dcfce7":pct>=50?"#fef9c3":"#fee2e2",color:pct>=70?"#16a34a":pct>=50?"#92400e":"#dc2626"}}>{pct}%</span></td>
                            <td className="td-center"><span className="status-badge" style={{background:nota.cor+"22",color:nota.cor}}>{nota.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Mensal */}
            <div className="secao">
              <h3 className="secao-titulo">📅 Acompanhamento Mensal</h3>
              {mensal.length === 0
                ? <p style={{color:"#9ca3af",fontSize:14,textAlign:"center",padding:"12px 0"}}>Nenhuma resposta ainda.</p>
                : (
                  <div className="tabela-mensal-wrap">
                    <table className="tabela-mensal">
                      <thead><tr><th>Mês</th><th>Respostas</th><th>Média Médico</th><th>Média Recepção</th><th>Média Geral</th><th>Satisfeitos</th><th>Status</th></tr></thead>
                      <tbody>
                        {mensal.map(row => {
                          const nota = notaGeral(parseFloat(row.avgG));
                          return (
                            <tr key={row.chave}>
                              <td className="td-mes">{row.mesNome}</td>
                              <td className="td-center">{row.n}</td>
                              <td className="td-center"><span style={{fontWeight:700,color:notaGeral(parseFloat(row.avgM)).cor}}>{row.avgM}</span></td>
                              <td className="td-center"><span style={{fontWeight:700,color:notaGeral(parseFloat(row.avgR)).cor}}>{row.avgR}</span></td>
                              <td className="td-center">
                                <div className="media-geral-cel">
                                  <span className="media-geral-val" style={{color:nota.cor}}>{row.avgG}</span>
                                  <div className="mini-barra-bg"><div className="mini-barra-fill" style={{width:`${parseFloat(row.avgG)/5*100}%`,background:nota.cor}}/></div>
                                </div>
                              </td>
                              <td className="td-center"><span className="pct-badge" style={{background:row.pct>=70?"#dcfce7":row.pct>=50?"#fef9c3":"#fee2e2",color:row.pct>=70?"#16a34a":row.pct>=50?"#92400e":"#dc2626"}}>{row.pct}%</span></td>
                              <td className="td-center"><span className="status-badge" style={{background:nota.cor+"22",color:nota.cor}}>{nota.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>

            {/* ── Comentários */}
            <div className="secao">
              <h3 className="secao-titulo">💬 Comentários Recentes</h3>
              {dados.length === 0
                ? <p style={{color:"#9ca3af",fontSize:14,textAlign:"center",padding:"12px 0"}}>Nenhuma resposta ainda.</p>
                : (
                  <div className="comentarios">
                    {[...dados].reverse().slice(0,8).map(r => (
                      <div key={r.id} className="comentario-card">
                        <div className="coment-top">
                          <div className="coment-stars" style={{flexWrap:"wrap",gap:8}}>
                            {r.nome && <span className="coment-nome">👤 {r.nome}</span>}
                            <span className="coment-medico">👨‍⚕️ {r.medico}</span>
                            <span>Médico: <strong style={{color:labelCor(r.avalMedico)}}>{valorParaLabel(r.avalMedico)}</strong></span>
                            <span>Recepção: <strong style={{color:labelCor(r.avalRecepcao)}}>{valorParaLabel(r.avalRecepcao)}</strong></span>
                          </div>
                          <span className="coment-data">{r.data}</span>
                        </div>
                        <div className="coment-body">
                          <div><p className="coment-cat green-cat">✅ O que mais gostou</p><p className="coment-text">{r.gostou}</p></div>
                          <div><p className="coment-cat purple-cat">🔧 O que melhorar</p><p className="coment-text">{r.melhorar}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </>
        )}

        <p className="rodape-privacidade">🔒 Todas as respostas são salvas no banco de dados Firebase — acessíveis de qualquer dispositivo.</p>
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
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
