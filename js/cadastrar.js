

div_alerta.style.display = 'none';
let cadastroEmAndamento = false;

function obterBotaoCadastro() {
    return document.getElementById("btn_cadastro");
}

function definirEstadoCadastro(carregando) {
    cadastroEmAndamento = carregando;
    const botao = obterBotaoCadastro();
    if (!botao) return;

    if (!botao.dataset.textoOriginal) {
        botao.dataset.textoOriginal = botao.textContent;
    }

    botao.disabled = carregando;
    botao.textContent = carregando ? "Cadastrando..." : botao.dataset.textoOriginal;
}

// Aplica máscara no campo de data ao carregar
(function () {
    const inputData = document.getElementById("ipt_dataNascimento");
    if (inputData && window.MainAPI && window.MainAPI.aplicarMascaraData) {
        window.MainAPI.aplicarMascaraData(inputData);
    }
})();

function habilitarFecharAlertaAoClicarFora() {
    const divAl = document.getElementById("div_alerta");
    const contAl = document.getElementById("conteudoAlerta");
    if (!divAl || !contAl || divAl.dataset.closeOutsideBound === "1") return;

    divAl.dataset.closeOutsideBound = "1";
    divAl.addEventListener("click", (event) => {
        if (event.target === divAl) {
            divAl.style.display = "none";
        }
    });
}

function alerta(texto) {
    habilitarFecharAlertaAoClicarFora();
    div_alerta.style.display = "flex"
    conteudoAlerta.innerHTML =
        `
        ${texto}
        `
}

async function extrairErroResposta(response) {
    let body = null;

    try {
        body = await response.clone().json();
    } catch (_) {
        try {
            body = await response.clone().text();
        } catch (_) {
            body = null;
        }
    }

    const mensagem = typeof body === "string"
        ? body
        : (body && (body.message || body.error || body.detail || ""));

    return {
        status: response.status,
        mensagem: String(mensagem || "").trim()
    };
}

function mensagemCadastroSegura(erro) {
    const status = Number(erro?.status || 0);
    const mensagem = (erro?.mensagem || "").toLowerCase();

    if (
        status === 409 ||
        (
            mensagem.includes("email") &&
            (
                mensagem.includes("já existe") ||
                mensagem.includes("ja existe") ||
                mensagem.includes("cadastrado") ||
                mensagem.includes("duplicate") ||
                mensagem.includes("duplic")
            )
        )
    ) {
        return "Email inválido <button onclick='div_alerta.style.display=\"none\"'>OK</button>";
    }

    if (mensagem.includes("nascimento")) {
        return "Data de nascimento inválida <button onclick='div_alerta.style.display=\"none\"'>OK</button>";
    }

    if (mensagem.includes("gênero") || mensagem.includes("genero")) {
        return "Gênero inválido <button onclick='div_alerta.style.display=\"none\"'>OK</button>";
    }

    if (mensagem.includes("pronome")) {
        return "Pronome inválido <button onclick='div_alerta.style.display=\"none\"'>OK</button>";
    }

    if (mensagem.includes("senha")) {
        return "Senha inválida <button onclick='div_alerta.style.display=\"none\"'>OK</button>";
    }

    if (mensagem.includes("email")) {
        return "Email inválido <button onclick='div_alerta.style.display=\"none\"'>OK</button>";
    }

    if (status >= 500) {
        return "Não foi possível concluir o cadastro agora. Tente novamente em instantes. <button onclick='div_alerta.style.display=\"none\"'>OK</button>";
    }

    return "Erro ao criar conta. Revise os dados informados e tente novamente. <button onclick='div_alerta.style.display=\"none\"'>OK</button>";
}

function obterGeneroCadastro() {
    return document.getElementById("select_genero").value;
}

function checarDados() {
    if (cadastroEmAndamento) return;

    const nome = document.getElementById("ipt_nome").value.trim();
    const sobrenome = document.getElementById("ipt_sobrenome").value.trim();
    const dataNascimentoBR = document.getElementById("ipt_dataNascimento").value.trim();
    const dataNascimento = window.MainAPI ? window.MainAPI.dataParaISO(dataNascimentoBR) : null;
    const genero = obterGeneroCadastro();
    const email = document.getElementById("ipt_email").value.trim();
    const senha = document.getElementById("ipt_senha").value;
    const confSenha = document.getElementById("ipt_ConfSenha").value;

    console.warn("%cEntrou na função checarDados", "color: orange; font-weight: bold");

    /* =========================
       NOME
    ========================= */
    if (!nome) {
        alerta(`Nome inválido <button onclick='div_alerta.style.display="none"'>OK</button>`);
        console.error("Nome inválido");
        return;
    }
    console.log("%cNome OK", "color: green");

    /* =========================
       SOBRENOME
    ========================= */
    if (!sobrenome) {
        alerta(`Sobrenome inválido <button onclick='div_alerta.style.display="none"'>OK</button>`);
        console.error("Sobrenome inválido");
        return;
    }
    console.log("%cSobrenome OK", "color: green");

    /* =========================
       DATA DE NASCIMENTO
    ========================= */
    if (!dataNascimentoBR || dataNascimentoBR.length < 10 || !dataNascimento) {
        alerta(`Data de nascimento inválida (use dd/mm/aaaa) <button onclick='div_alerta.style.display="none"'>OK</button>`);
        console.error("Data de nascimento inválida");
        return;
    }
    console.log("%cData de nascimento OK", "color: green");

    /* =========================
       GÊNERO
    ========================= */
    if (!genero || genero === "#") {
        alerta(`Selecione uma opção válida <button onclick='div_alerta.style.display="none"'>OK</button>`);
        console.error("Gênero não selecionado");
        return;
    }

    console.log("%cGênero OK → " + genero, "color: green");

    /* =========================
       EMAIL
    ========================= */
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regexEmail.test(email)) {
        alerta(`Email inválido <button onclick='div_alerta.style.display="none"'>OK</button>`);
        console.error("Email inválido");
        return;
    }
    console.log("%cEmail OK", "color: green");

    /* =========================
       SENHA
       - 6 a 25 caracteres
       - 1 letra maiúscula
       - 1 caractere especial
    ========================= */
    const regexSenha = /^(?=.*[A-Z])(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{6,25}$/;

    if (!regexSenha.test(senha)) {
        alerta(`
            Senha inválida<br>
            • 6 a 25 caracteres<br>
            • 1 letra maiúscula<br>
            • 1 caractere especial
            <button onclick='div_alerta.style.display="none"'>OK</button>
        `);
        console.error("Senha inválida");
        return;
    }

    if (senha !== confSenha) {
        alerta(`As senhas não coincidem <button onclick='div_alerta.style.display="none"'>OK</button>`);
        console.error("Senhas diferentes");
        return;
    }

    console.log("%cSenha OK", "color: green");

    /* =========================
       SUCESSO FINAL
    ========================= */
    console.log(
        "%c✔ Todos os dados validados com sucesso!",
        "color: #16a34a; font-weight: bold; font-size: 14px"
    );
    console.warn("Redirecionando para o cadastro!")

    cadastrar(nome, sobrenome, dataNascimento, genero, email, senha);
}

function cadastrar(nome, sobrenome, dataNascimento, genero, email, senha) {
    if (cadastroEmAndamento) return;

    console.warn("Iniciando o cadastro!");
    definirEstadoCadastro(true);

    MainAPI.cadastrarUsuario({
        nome: nome,
        sobrenome: sobrenome,
        dataNascimento: dataNascimento,
        genero: genero,
        email: email,
        senha: senha

    }).then((response) => {
        console.warn("Resposta da tentativa de cadastro:", response);
        if (response.ok) {
            alerta(`Conta criada com sucesso!`);
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } else {
            definirEstadoCadastro(false);
            extrairErroResposta(response).then((erro) => {
                alerta(mensagemCadastroSegura(erro));
            });
        }
    }).catch((error) => {
        definirEstadoCadastro(false);
        console.error("Erro na chamada ao MainAPI:", error);
        alerta(`Erro ao conectar ao servidor. <button onclick='div_alerta.style.display="none"'>OK</button>`);
    });

}