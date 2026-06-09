/* ========================================
   TATAME STORE – JavaScript Principal
   Gerencia dados, sessão e carrinho
   ======================================== */

/* -------- DADOS INICIAIS -------- */
const PRODUTOS = [
  { id: "P001", nome: "Kimono Adulto A2", preco: 289.90, emoji: "🥋", categoria: "kimono", desc: "Kimono 100% algodão ripstop, reforçado nos joelhos." },
  { id: "P002", nome: "Kimono Infantil M2", preco: 199.90, emoji: "🥋", categoria: "kimono", desc: "Kimono infantil leve, ideal para iniciantes." },
  { id: "P003", nome: "Faixa Azul", preco: 39.90, emoji: "🩵", categoria: "faixa", desc: "Faixa azul oficial, comprimento A2." },
  { id: "P004", nome: "Faixa Branca", preco: 29.90, emoji: "🤍", categoria: "faixa", desc: "Faixa branca para iniciantes, resistente." },
  { id: "P005", nome: "Protetor Bucal", preco: 49.90, emoji: "🦷", categoria: "protetor", desc: "Protetor bucal termomoldável, alta proteção." },
  { id: "P006", nome: "Bolsa de Treino", preco: 129.90, emoji: "🎒", categoria: "acessorio", desc: "Bolsa espaçosa com compartimento para kimono molhado." },
  { id: "P007", nome: "Rash Guard Manga Longa", preco: 119.90, emoji: "👕", categoria: "vestuario", desc: "Rash guard compressão, proteção UV 50+." },
  { id: "P008", nome: "Shorts BJJ Azul", preco: 89.90, emoji: "🩳", categoria: "vestuario", desc: "Shorts sem bolso, tecido elástico resistente." },
  { id: "P009", nome: "Joelheira Profissional", preco: 79.90, emoji: "🦵", categoria: "protetor", desc: "Joelheira de compressão para treinos intensos." },
  { id: "P010", nome: "Protetor de Ouvido", preco: 59.90, emoji: "👂", categoria: "protetor", desc: "Protetor auricular regulável, evita couve-flor." },
  { id: "P011", nome: "Grip Trainers", preco: 44.90, emoji: "✊", categoria: "acessorio", desc: "Conjunto de pegadas para fortalecer a garra." },
  { id: "P012", nome: "Faixa Roxa", preco: 39.90, emoji: "💜", categoria: "faixa", desc: "Faixa roxa bordada com nome, A2." },
];

/* -------- HELPERS LOCALSTORAGE -------- */
function salvar(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function carregar(chave, padrao) {
  try {
    const v = localStorage.getItem(chave);
    return v ? JSON.parse(v) : padrao;
  } catch { return padrao; }
}

/* -------- CLIENTES -------- */
function gerarIdCliente() {
  const clientes = carregar("clientes", []);
  const num = clientes.length + 1;
  return "C" + String(num).padStart(3, "0");
}

function cadastrarCliente(dados) {
  const clientes = carregar("clientes", []);
  if (clientes.find(c => c.email === dados.email)) {
    return { ok: false, msg: "E-mail já cadastrado." };
  }
  if (dados.cpf && clientes.find(c => c.cpf === dados.cpf)) {
    return { ok: false, msg: "CPF já cadastrado." };
  }
  const cliente = {
    id: gerarIdCliente(),
    nome: dados.nome,
    email: dados.email,
    senha: dados.senha,
    cpf: dados.cpf,
    dataCadastro: new Date().toLocaleDateString("pt-BR"),
  };
  clientes.push(cliente);
  salvar("clientes", clientes);
  return { ok: true, cliente };
}

function editarCliente(id, dados) {
  const clientes = carregar("clientes", []);
  const idx = clientes.findIndex(c => c.id === id);
  if (idx === -1) return false;
  clientes[idx] = { ...clientes[idx], ...dados, id: clientes[idx].id };
  salvar("clientes", clientes);
  return true;
}

function buscarClientes(termo) {
  const clientes = carregar("clientes", []);
  if (!termo) return clientes;
  const t = termo.toLowerCase();
  return clientes.filter(c =>
    c.nome.toLowerCase().includes(t) ||
    c.email.toLowerCase().includes(t) ||
    c.id.toLowerCase().includes(t) ||
    (c.cpf && c.cpf.includes(t))
  );
}

/* -------- SESSÃO -------- */
function loginCliente(email, senha) {
  const clientes = carregar("clientes", []);
  const cliente = clientes.find(c => c.email === email && c.senha === senha);
  if (!cliente) return false;
  salvar("sessao", { id: cliente.id, nome: cliente.nome, email: cliente.email });
  return true;
}

function getSessao() {
  return carregar("sessao", null);
}

function logout() {
  localStorage.removeItem("sessao");
  window.location.href = "index.html";
}

function exigirLogin(redirectUrl) {
  if (!getSessao()) {
    window.location.href = redirectUrl || "login.html";
    return false;
  }
  return true;
}

/* -------- CARRINHO -------- */
function getCarrinho() {
  return carregar("carrinho", []);
}

function salvarCarrinho(carrinho) {
  salvar("carrinho", carrinho);
}

function adicionarAoCarrinho(produtoId) {
  const produto = PRODUTOS.find(p => p.id === produtoId);
  if (!produto) return;
  const carrinho = getCarrinho();
  const idx = carrinho.findIndex(i => i.id === produtoId);
  if (idx >= 0) {
    carrinho[idx].qtd++;
  } else {
    carrinho.push({ ...produto, qtd: 1 });
  }
  salvarCarrinho(carrinho);
  atualizarBadgeCarrinho();
  mostrarToast("✅ " + produto.nome + " adicionado ao carrinho!");
}

function removerDoCarrinho(produtoId) {
  const carrinho = getCarrinho();
  const novo = carrinho.filter(i => i.id !== produtoId);
  salvarCarrinho(novo);
  atualizarBadgeCarrinho();
  renderizarCarrinho();
}

function alterarQtd(produtoId, delta) {
  const carrinho = getCarrinho();
  const idx = carrinho.findIndex(i => i.id === produtoId);
  if (idx < 0) return;
  carrinho[idx].qtd += delta;
  if (carrinho[idx].qtd <= 0) carrinho.splice(idx, 1);
  salvarCarrinho(carrinho);
  atualizarBadgeCarrinho();
  renderizarCarrinho();
}

function totalCarrinho() {
  return getCarrinho().reduce((s, i) => s + i.preco * i.qtd, 0);
}

function qtdCarrinho() {
  return getCarrinho().reduce((s, i) => s + i.qtd, 0);
}

function atualizarBadgeCarrinho() {
  const badge = document.getElementById("carrinho-badge");
  const qtd = qtdCarrinho();
  if (badge) {
    badge.textContent = qtd;
    badge.style.display = qtd > 0 ? "flex" : "none";
  }
}

function renderizarCarrinho() {
  const lista = document.getElementById("carrinho-itens");
  const totalEl = document.getElementById("carrinho-total");
  if (!lista) return;
  const carrinho = getCarrinho();
  if (carrinho.length === 0) {
    lista.innerHTML = '<div class="carrinho-vazio">🛒<br>Seu carrinho está vazio.<br>Explore a loja!</div>';
  } else {
    lista.innerHTML = carrinho.map(item => `
      <div class="item-carrinho">
        <div class="item-carrinho-emoji">${item.emoji}</div>
        <div class="item-carrinho-info">
          <div class="item-carrinho-nome">${item.nome}</div>
          <div class="item-carrinho-preco">R$ ${(item.preco * item.qtd).toFixed(2).replace(".", ",")}</div>
        </div>
        <div class="item-carrinho-qtd">
          <button onclick="alterarQtd('${item.id}', -1)">−</button>
          <span>${item.qtd}</span>
          <button onclick="alterarQtd('${item.id}', 1)">+</button>
        </div>
        <button onclick="removerDoCarrinho('${item.id}')" style="background:none;border:none;cursor:pointer;color:#e53e3e;font-size:1.1rem;margin-left:0.3rem;">🗑</button>
      </div>
    `).join("");
  }
  if (totalEl) totalEl.textContent = "R$ " + totalCarrinho().toFixed(2).replace(".", ",");
}

function toggleCarrinho() {
  const painel = document.getElementById("painel-carrinho");
  const overlay = document.getElementById("overlay-carrinho");
  if (painel) painel.classList.toggle("aberto");
  if (overlay) overlay.classList.toggle("visivel");
  renderizarCarrinho();
}

function fecharCarrinho() {
  document.getElementById("painel-carrinho")?.classList.remove("aberto");
  document.getElementById("overlay-carrinho")?.classList.remove("visivel");
}

/* -------- COMPRAS -------- */
function gerarIdCompra() {
  const compras = carregar("compras", []);
  const num = compras.length + 1;
  return "CP" + String(num).padStart(3, "0");
}

function finalizarCompra() {
  const sessao = getSessao();
  if (!sessao) {
    mostrarToast("⚠️ Faça login para finalizar a compra!", "erro");
    setTimeout(() => window.location.href = "login.html", 1500);
    return;
  }
  const carrinho = getCarrinho();
  if (carrinho.length === 0) {
    mostrarToast("⚠️ Carrinho vazio!", "erro");
    return;
  }
  const compras = carregar("compras", []);
  const compra = {
    id: gerarIdCompra(),
    clienteId: sessao.id,
    clienteNome: sessao.nome,
    produtos: carrinho.map(i => ({ id: i.id, nome: i.nome, qtd: i.qtd, preco: i.preco })),
    valorTotal: totalCarrinho(),
    data: new Date().toLocaleDateString("pt-BR"),
    hora: new Date().toLocaleTimeString("pt-BR"),
  };
  compras.push(compra);
  salvar("compras", compras);
  salvarCarrinho([]);
  atualizarBadgeCarrinho();
  fecharCarrinho();
  mostrarToast("🎉 Compra finalizada! Pedido " + compra.id);
}

function buscarCompras(termo) {
  const compras = carregar("compras", []);
  if (!termo) return compras;
  const t = termo.toLowerCase();
  return compras.filter(c =>
    c.id.toLowerCase().includes(t) ||
    c.clienteNome.toLowerCase().includes(t) ||
    c.clienteId.toLowerCase().includes(t) ||
    c.data.includes(t) ||
    String(c.valorTotal).includes(t) ||
    c.produtos.some(p => p.nome.toLowerCase().includes(t))
  );
}

/* -------- TOAST -------- */
function mostrarToast(msg, tipo) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.className = "toast " + (tipo === "erro" ? "toast-erro" : "toast-ok");
  toast.classList.add("visivel");
  setTimeout(() => toast.classList.remove("visivel"), 3000);
}

/* -------- NAV HAMBURGER -------- */
function toggleMenu() {
  document.getElementById("nav-principal")?.classList.toggle("aberto");
}

/* -------- HEADER DINAMICO -------- */
function iniciarHeader() {
  const sessao = getSessao();
  const areaUser = document.getElementById("area-usuario");
  if (!areaUser) return;
  if (sessao) {
    areaUser.innerHTML = `
      <div class="user-info">
        <span>Olá, <strong>${sessao.nome.split(" ")[0]}</strong></span>
        <button class="btn-sair" onclick="logout()">Sair</button>
      </div>
    `;
  } else {
    areaUser.innerHTML = `
      <a href="login.html" class="btn-nav-login">Entrar</a>
    `;
  }
}

/* -------- CPF MASK -------- */
function mascaraCPF(input) {
  let v = input.value.replace(/\D/g, "");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  input.value = v;
}

/* -------- VALIDAÇÕES -------- */
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  return cpf.length === 11;
}

/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {
  iniciarHeader();
  atualizarBadgeCarrinho();

  // Fechar carrinho ao clicar no overlay
  document.getElementById("overlay-carrinho")?.addEventListener("click", fecharCarrinho);
});
