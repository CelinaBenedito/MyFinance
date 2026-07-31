

div_alerta.style.display = 'none';

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

function checarDados() {
    const nome = document.getElementById("ipt_nome").value.trim();
    const sobrenome = document.getElementById("ipt_sobrenome").value.trim();
    const dataNascimentoBR = document.getElementById("ipt_dataNascimento").value.trim();
    const dataNascimento = window.MainAPI ? window.MainAPI.dataParaISO(dataNascimentoBR) : null;
    let sexo = document.getElementById("select_sexo").value;
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
       DATA DE NASCIMENTO (>= 16 anos)
    ========================= */
    if (!dataNascimentoBR || dataNascimentoBR.length < 10 || !dataNascimento) {
        alerta(`Data de nascimento inválida (use dd/mm/aaaa) <button onclick='div_alerta.style.display="none"'>OK</button>`);
        console.error("Data de nascimento inválida");
        return;
    }

    const hoje = new Date();
    const nascimento = new Date(dataNascimento + "T00:00:00");
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();

    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    if (idade < 16) {
        alerta(`Você precisa ter pelo menos 16 anos <button onclick='div_alerta.style.display="none"'>OK</button>`);
        console.error("Idade menor que 16");
        return;
    }
    console.log(`%cIdade OK (${idade} anos)`, "color: green");

    /* =========================
       SEXO (tratamento de valores)
    ========================= */
    switch (sexo) {
        case "Feminino":
            sexo = 1;
            break;

        case "Masculino":
            sexo = 2;
            break;

        case "Nao":
            sexo = 3;
            break;

        default:
            alerta(`Selecione uma opção válida <button onclick='div_alerta.style.display="none"'>OK</button>`);
            console.error("Sexo não selecionado");
            return;
    }

    console.log("%cSexo OK → " + sexo, "color: green");

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

    cadastrar(nome, sobrenome, dataNascimento, sexo, email, senha);
}

function cadastrar(nome, sobrenome, dataNascimento, sexo, email, senha) {
    console.warn("Iniciando o cadastro!");

    MainAPI.cadastrarUsuario({
        nome: nome,
        sobrenome: sobrenome,
        dataNascimento: dataNascimento,
        sexo: sexo,
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
            alerta(`Erro ao criar conta. Verifique os dados e tente novamente. <button onclick='div_alerta.style.display="none"'>OK</button>`);
        }
    }).catch((error) => {
        console.error("Erro na chamada ao MainAPI:", error);
        alerta(`Erro ao conectar ao servidor. <button onclick='div_alerta.style.display="none"'>OK</button>`);
    });

}