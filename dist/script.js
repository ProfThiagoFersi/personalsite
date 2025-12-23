// ==========================================
// 1. CONFIGURAÇÕES INICIAIS E VARIÁREIS
// ==========================================
const SENHA_MESTRA = "1234"; 
let treinoAtual = '';
let intervaloTimer;
let meuGrafico;

// Som para o final do cronómetro (Beep curto)
const somAlerta = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

// ==========================================
// 2. SISTEMA DE ACESSO (LOGIN)
// ==========================================
function verificarSenha() {
    const input = document.getElementById('senhaInput').value;
    const loginArea = document.getElementById('loginArea');
    const appConteudo = document.getElementById('appConteudo');

    if (input === SENHA_MESTRA) {
        loginArea.style.display = 'none';
        appConteudo.style.display = 'block';
        carregarDadosIniciais(); // Carrega o que estiver no LocalStorage
    } else {
        alert("Senha incorreta! Tente novamente.");
    }
}

// ==========================================
// 3. CÁLCULOS BIOMÉTRICOS E NUTRICIONAIS
// ==========================================
function calcularTudo() {
    const d = {
        nome: document.getElementById('nome').value,
        idade: parseInt(document.getElementById('idade').value) || 0,
        genero: document.getElementById('genero').value,
        peso: parseFloat(document.getElementById('peso').value) || 0,
        altura: parseFloat(document.getElementById('altura').value) || 0,
        atividade: parseFloat(document.getElementById('atividade').value),
        cintura: parseFloat(document.getElementById('cintura').value) || 0,
        pescoco: parseFloat(document.getElementById('pescoco').value) || 0
    };

    if (d.peso <= 0 || d.altura <= 0) {
        alert("Por favor, preencha Peso e Altura corretamente.");
        return;
    }

    // Guardar dados no navegador
    localStorage.setItem('dadosAtleta', JSON.stringify(d));
    
    // Executar Cálculos Visuais
    const imc = d.peso / ((d.altura / 100) ** 2);
    document.getElementById('resIMC').innerText = imc.toFixed(2);

    // Calorias (Fórmula Harris-Benedict)
    let tmb = d.genero === "masculino" 
        ? 66.47 + (13.75 * d.peso) + (5.003 * d.altura) - (6.755 * d.idade)
        : 655.1 + (9.563 * d.peso) + (1.85 * d.altura) - (4.676 * d.idade);
    
    const caloriasManutencao = Math.round(tmb * d.atividade);
    document.getElementById('resCalorias').innerText = caloriasManutencao;

    // Gordura Corporal (Estimativa Marinha)
    const gordura = ((d.cintura - d.pescoco) * 0.5);
    document.getElementById('resGordura').innerText = gordura.toFixed(1) + "%";

    // Atualizar Gráfico de Evolução
    salvarNoHistorico(d.peso);
}

// ==========================================
// 4. HISTÓRICO E GRÁFICO (Chart.js)
// ==========================================
function salvarNoHistorico(peso) {
    let historico = JSON.parse(localStorage.getItem('histPeso')) || [];
    const dataHoje = new Date().toLocaleDateString();

    // Evita duplicar registos no mesmo dia
    if (historico.length === 0 || historico[historico.length - 1].data !== dataHoje) {
        historico.push({ data: dataHoje, peso: peso });
    } else {
        historico[historico.length - 1].peso = peso; // Atualiza o peso se for o mesmo dia
    }

    if (historico.length > 7) historico.shift(); // Mantém apenas os últimos 7 registos
    
    localStorage.setItem('histPeso', JSON.stringify(historico));
    desenharGrafico(historico);
}

function desenharGrafico(dados) {
    const ctx = document.getElementById('graficoPeso').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();

    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dados.map(item => item.data),
            datasets: [{
                label: 'Evolução de Peso (kg)',
                data: dados.map(item => item.peso),
                borderColor: '#adff2f',
                backgroundColor: 'rgba(173, 255, 47, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: false } }
        }
    });
}

// ==========================================
// 5. GESTÃO DE TREINOS (A, B, C)
// ==========================================
function configurarTreino(tipo) {
    treinoAtual = tipo;
    const areaEditor = document.getElementById('areaEditor');
    const titulo = document.getElementById('tituloTreino');
    const editor = document.getElementById('textoTreino');

    areaEditor.style.display = 'block';
    titulo.innerText = "Editando Treino " + tipo;
    
    // Carregar texto guardado
    editor.value = localStorage.getItem('treino_' + tipo) || '';
    
    atualizarVisualizacaoTreino(tipo);
}

function salvarTreino() {
    const texto = document.getElementById('textoTreino').value;
    if (!treinoAtual) return alert("Escolha um treino primeiro!");

    localStorage.setItem('treino_' + treinoAtual, texto);
    atualizarVisualizacaoTreino(treinoAtual);
    alert("Treino " + treinoAtual + " guardado com sucesso!");
}

function atualizarVisualizacaoTreino(tipo) {
    const display = document.getElementById('exibicaoTreino');
    const conteudo = localStorage.getItem('treino_' + tipo) || "Nenhum exercício registado.";
    display.innerText = conteudo; // O CSS cuidará das quebras de linha com white-space: pre-line
}

// ==========================================
// 6. CRONÓMETRO DE DESCANSO
// ==========================================
function iniciarTimer(segundos) {
    pararTimer();
    let tempo = segundos;
    const display = document.getElementById('timerDisplay');

    intervaloTimer = setInterval(() => {
        tempo--;
        const min = Math.floor(tempo / 60);
        const seg = tempo % 60;
        display.innerText = `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;

        if (tempo <= 0) {
            pararTimer();
            somAlerta.play();
            alert("Descanso Terminado! Próxima série!");
        }
    }, 1000);
}

function pararTimer() {
    clearInterval(intervaloTimer);
}

// ==========================================
// 7. EXPORTAÇÃO PDF (RESOLUÇÃO DE ERRO)
// ==========================================
function gerarPDF() {
    const nome = document.getElementById('nome').value || "Atleta";
    const imc = document.getElementById('resIMC').innerText;
    const gordura = document.getElementById('resGordura').innerText;
    const cal = document.getElementById('resCalorias').innerText;
    const exercicios = document.getElementById('exibicaoTreino').innerText;

    // Criar elemento de impressão forçando cores legíveis
    const printArea = document.createElement('div');
    Object.assign(printArea.style, {
        padding: '40px',
        color: 'black',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif'
    });

    printArea.innerHTML = `
        <div style="border: 2px solid #adff2f; padding: 20px;">
            <h1 style="text-align: center; color: #1a1a1a;">RELATÓRIO DE TREINO</h1>
            <hr>
            <p><strong>NOME:</strong> ${nome.toUpperCase()}</p>
            <p><strong>DATA:</strong> ${new Date().toLocaleDateString()}</p>
            <div style="background: #f4f4f4; padding: 10px; margin: 15px 0;">
                <p><strong>IMC:</strong> ${imc} | <strong>Gordura:</strong> ${gordura} | <strong>Calorias:</strong> ${cal} kcal</p>
            </div>
            <h2 style="border-bottom: 2px solid #adff2f;">TREINO SELECIONADO</h2>
            <p style="white-space: pre-line; font-size: 14px;">${exercicios}</p>
            <footer style="margin-top: 50px; text-align: center; color: #888; font-size: 10px;">
                Gerado por Personal Pro App
            </footer>
        </div>
    `;

    // Gerar o PDF
    html2pdf().set({
        margin: 10,
        filename: `Ficha_${nome}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(printArea).save();
}

// ==========================================
// 8. UTILITÁRIOS E INICIALIZAÇÃO
// ==========================================
function novoAluno() {
    if (confirm("Deseja apagar todos os dados para iniciar um novo aluno?")) {
        localStorage.clear();
        location.reload();
    }
}

function carregarDadosIniciais() {
    const dados = JSON.parse(localStorage.getItem('dadosAtleta'));
    if (dados) {
        document.getElementById('nome').value = dados.nome || '';
        document.getElementById('idade').value = dados.idade || '';
        document.getElementById('peso').value = dados.peso || '';
        document.getElementById('altura').value = dados.altura || '';
        document.getElementById('cintura').value = dados.cintura || '';
        document.getElementById('pescoco').value = dados.pescoco || '';
        document.getElementById('genero').value = dados.genero || 'masculino';
        document.getElementById('atividade').value = dados.atividade || '1.2';
        calcularTudo(); // Atualiza resultados e gráfico
    }
}