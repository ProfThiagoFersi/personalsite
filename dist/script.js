const SENHA_MESTRA = "1234"; 
let treinoAtual = '';
let intervaloTimer;
let meuGrafico;
const somAlerta = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

// 1. ACESSO
function verificarSenha() {
    const input = document.getElementById('senhaInput').value;
    if (input === SENHA_MESTRA) {
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('appConteudo').style.display = 'block';
        carregarTudo();
    } else {
        alert("Senha incorreta!");
    }
}

// 2. CÁLCULOS
function calcularTudo() {
    const d = {
        nome: document.getElementById('nome').value,
        idade: parseInt(document.getElementById('idade').value),
        genero: document.getElementById('genero').value,
        peso: parseFloat(document.getElementById('peso').value),
        altura: parseFloat(document.getElementById('altura').value),
        atividade: parseFloat(document.getElementById('atividade').value),
        cintura: parseFloat(document.getElementById('cintura').value),
        pescoco: parseFloat(document.getElementById('pescoco').value)
    };

    if(!d.peso || !d.altura) return alert("Preencha Peso e Altura!");

    localStorage.setItem('dadosAtleta', JSON.stringify(d));
    
    // IMC
    const imc = d.peso / ((d.altura/100) ** 2);
    document.getElementById('resIMC').innerText = imc.toFixed(2);

    // CALORIAS (Harris-Benedict)
    let tmb = d.genero === "masculino" 
        ? 66.47 + (13.75 * d.peso) + (5.003 * d.altura) - (6.755 * d.idade)
        : 655.1 + (9.563 * d.peso) + (1.85 * d.altura) - (4.676 * d.idade);
    document.getElementById('resCalorias').innerText = Math.round(tmb * d.atividade);

    // GORDURA (Simplificada)
    document.getElementById('resGordura').innerText = ((d.cintura - d.pescoco) * 0.5).toFixed(1) + "%";

    salvarHistorico(d.peso);
}

// 3. GRÁFICO
function salvarHistorico(peso) {
    let hist = JSON.parse(localStorage.getItem('histPeso')) || [];
    hist.push({ data: new Date().toLocaleDateString(), peso: peso });
    if(hist.length > 7) hist.shift();
    localStorage.setItem('histPeso', JSON.stringify(hist));
    desenharGrafico(hist);
}

function desenharGrafico(dados) {
    const ctx = document.getElementById('graficoPeso').getContext('2d');
    if(meuGrafico) meuGrafico.destroy();
    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dados.map(i => i.data),
            datasets: [{ label: 'Peso (kg)', data: dados.map(i => i.peso), borderColor: '#adff2f', tension: 0.3 }]
        },
        options: { scales: { y: { beginAtZero: false } } }
    });
}

// 4. TREINOS
function configurarTreino(t) {
    treinoAtual = t;
    document.getElementById('areaEditor').style.display = 'block';
    document.getElementById('tituloTreino').innerText = "Editar Treino " + t;
    document.getElementById('textoTreino').value = localStorage.getItem('t_'+t) || '';
    atualizarDisplayTreino(t);
}

function salvarTreino() {
    localStorage.setItem('t_'+treinoAtual, document.getElementById('textoTreino').value);
    atualizarDisplayTreino(treinoAtual);
    alert("Treino " + treinoAtual + " guardado!");
}

function atualizarDisplayTreino(t) {
    const val = localStorage.getItem('t_'+t) || "Nenhum exercício.";
    document.getElementById('exibicaoTreino').innerText = val;
}

// 5. PDF (CORRIGIDO: Resolve a página em branco)
function gerarPDF() {
    const nome = document.getElementById('nome').value || "Atleta";
    const imc = document.getElementById('resIMC').innerText;
    const cal = document.getElementById('resCalorias').innerText;
    const treino = document.getElementById('exibicaoTreino').innerText;

    const tempDiv = document.createElement('div');
    tempDiv.style.padding = "30px";
    tempDiv.style.color = "black";
    tempDiv.style.background = "white";
    
    tempDiv.innerHTML = `
        <h1 style="color: green; text-align: center;">FICHA DE TREINO</h1>
        <hr>
        <p><strong>Atleta:</strong> ${nome}</p>
        <p><strong>Avaliação:</strong> IMC: ${imc} | Calorias Diárias: ${cal} kcal</p>
        <div style="margin-top: 20px; border: 1px solid #ccc; padding: 15px;">
            <h3>TREINO ${treinoAtual}</h3>
            <p style="white-space: pre-line;">${treino}</p>
        </div>
    `;

    html2pdf().set({
        margin: 10,
        filename: `Treino_${nome}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(tempDiv).save();
}

// 6. TIMER
function iniciarTimer(seg) {
    pararTimer();
    intervaloTimer = setInterval(() => {
        seg--;
        let m = Math.floor(seg/60);
        let s = seg%60;
        document.getElementById('timerDisplay').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        if(seg <= 0) { pararTimer(); somAlerta.play(); alert("Descanso Terminado!"); }
    }, 1000);
}
function pararTimer() { clearInterval(intervaloTimer); }

function novoAluno() {
    if(confirm("Deseja apagar todos os dados para um novo aluno?")) {
        localStorage.clear();
        location.reload();
    }
}

function carregarTudo() {
    const d = JSON.parse(localStorage.getItem('dadosAtleta'));
    if(d) {
        document.getElementById('nome').value = d.nome;
        document.getElementById('idade').value = d.idade;
        document.getElementById('peso').value = d.peso;
        document.getElementById('altura').value = d.altura;
        document.getElementById('cintura').value = d.cintura;
        document.getElementById('pescoco').value = d.pescoco;
        document.getElementById('genero').value = d.genero;
        document.getElementById('atividade').value = d.atividade;
        calcularTudo();
    }
}