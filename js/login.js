
div_alerta.style.display = 'none';

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

function checarDados(){
    const email = document.getElementById("ipt_email").value.trim();
    const senha = document.getElementById("ipt_senha").value;

    console.warn("%cEntrou na função checarDados", "color: orange; font-weight: bold");

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

    console.log("%cSenha OK", "color: green");

     console.log(
        "%c✔ Todos os dados validados com sucesso!",
        "color: #16a34a; font-weight: bold; font-size: 14px"
    );
    console.warn("Redirecionando para o login!")

    login(email, senha);
}

function login(email, senha){
    console.warn("Iniciando o login!");

    MainAPI.loginUsuario({
        email: email,
        senha: senha
    }).then((response) => {
        console.warn("Resposta da tentativa de login:", response);
        if (response.ok) {
            response.json().then(async usuario => {
                const perfis = JSON.parse(localStorage.getItem("perfis") || "[]");
                const idx = perfis.findIndex(p => p.id === usuario.id);
                const perfilAtualizado = { id: usuario.id, nome: usuario.nome, sobrenome: usuario.sobrenome, imagem: usuario.imagem || null };
                if (idx === -1) {
                    perfis.push(perfilAtualizado);
                } else {
                    perfis[idx] = Object.assign({}, perfis[idx], perfilAtualizado);
                }
                const perfisJson = JSON.stringify(perfis);
                localStorage.setItem("perfis", perfisJson);
                localStorage.setItem("usuarioLogado", JSON.stringify(usuario));

                // Persiste em disco via desktopBridge (Java lê/escreve o arquivo diretamente)
                // — mais confiável que localStorage em callbacks async do JavaFX WebView
                if (window.desktopBridge) {
                    try { window.desktopBridge.savePerfis(perfisJson); } catch (_) {}
                }

                // Também persiste via HTTP (backup)
                fetch("https://my-finance-api-eqdubfc7bvg6brdw.brazilsouth-01.azurewebsites.net/perfis", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ perfis: perfisJson })
                }).catch(() => {});

                alerta(`Logado com sucesso!`);
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1500);
            }).catch(() => {
                alerta(`Erro ao processar resposta do servidor. <button onclick='div_alerta.style.display="none"'>OK</button>`);
            });
        } else {
            alerta(`Email ou senha incorretos. <button onclick='div_alerta.style.display="none"'>OK</button>`);
        }
    }).catch((error) => {
        console.error("Erro na chamada ao MainAPI:", error);
        alerta(`Erro ao conectar ao servidor. <button onclick='div_alerta.style.display="none"'>OK</button>`);
    });

}