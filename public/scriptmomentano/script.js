// Adiciona um "ouvinte" que espera toda a estrutura HTML da página carregar antes de executar o script.
// Isso evita erros de "elemento não encontrado".
document.addEventListener('DOMContentLoaded', () => {
    
    // --- SELEÇÃO DOS ELEMENTOS GLOBAIS DA PÁGINA ---
    // Criamos uma função auxiliar para pegar elementos pelo ID de forma mais curta.
    const getEl = (id) => document.getElementById(id);
    
    // Telas principais
    const mainView = getEl('mainView');
    const campeonatoArea = getEl('campeonatoArea');

    // Containers dinâmicos
    const roundsContainer = getEl('roundsContainer');
    const eventResultContainer = getEl('eventResultContainer');

    // Seções e inputs
    const addParticipantSection = getEl('addParticipantSection');
    const nomeParticipanteInput = getEl('nomeParticipante');
    const eventTitleContainer = getEl('eventTitle');

    // Tabelas
    const rankingTableBody = getEl('rankingTable').querySelector('tbody');
    const historyTableBody = getEl('historyTable').querySelector('tbody');

    // Botões
    const btnVoltarPrincipal = getEl('btnVoltarPrincipal');
    const btnNovaEdicao = getEl('btnNovaEdicao');
    const btnAdicionarParticipante = getEl('btnAdicionarParticipante');
    
    // --- ESTADO DA APLICAÇÃO ---
    // Objeto principal que guarda todos os dados que serão salvos no navegador.
    let appData = { ranking: [], eventHistory: [] };
    // Objeto temporário para guardar os dados do evento que está acontecendo agora.
    let currentEventData = {};
    
    // --- INICIALIZAÇÃO E EVENTOS PRINCIPAIS ---
    // Associa as funções aos eventos de clique dos botões.
    btnNovaEdicao.addEventListener('click', iniciarCampeonato);
    btnAdicionarParticipante.addEventListener('click', adicionarParticipante);
    btnVoltarPrincipal.addEventListener('click', showMainView);

    // --- FUNÇÕES DE DADOS (LocalStorage) ---
    // Carrega os dados salvos no navegador. Se não houver, começa com um objeto vazio.
    function loadData() {
        const data = localStorage.getItem('campeonatoPoesiaData');
        appData = data ? JSON.parse(data) : { ranking: [], eventHistory: [] };
    }

    // Salva o estado atual da aplicação no navegador.
    function saveData() {
        localStorage.setItem('campeonatoPoesiaData', JSON.stringify(appData));
    }

    // --- FUNÇÕES DE NAVEGAÇÃO E VISUALIZAÇÃO ---
    // Mostra a tela principal (ranking e histórico) e esconde a do campeonato.
    function showMainView() {
        mainView.classList.remove('hidden');
        campeonatoArea.classList.add('hidden');
        renderAll(); // Atualiza as tabelas de ranking e histórico.
    }

    // Mostra a tela do campeonato e esconde a principal.
    function showCampeonatoView() {
        mainView.classList.add('hidden');
        campeonatoArea.classList.remove('hidden');
        btnVoltarPrincipal.classList.remove('hidden');
    }

    // Função "mestra" que renderiza (desenha) as tabelas de ranking e histórico.
    function renderAll() {
        renderRanking();
        renderHistory();
    }

    // --- LÓGICA DO CAMPEONATO ---

    // Prepara o sistema para um novo evento.
    function iniciarCampeonato() {
        // Reseta o objeto do evento atual com dados iniciais.
        currentEventData = {
            id: Date.now(), // Gera um ID único baseado na data e hora.
            name: '',
            date: new Date().toLocaleDateString('pt-BR'),
            participants: [],
            rounds: {},
            podium: {},
            thirdPlaceFromPhase2: null
        };
        // Limpa a interface de qualquer evento anterior.
        roundsContainer.innerHTML = '';
        eventResultContainer.innerHTML = '';
        eventResultContainer.classList.add('hidden');
        addParticipantSection.classList.remove('hidden');
        // Cria o campo para digitar o nome do evento.
        eventTitleContainer.innerHTML = `<label>Nome do Evento: <span style="color: red;">*</span></label><input type="text" id="nomeEventoInput" placeholder="Digite o nome do campeonato">`;
        showCampeonatoView();
        createNewRoundUI(1, []); // Cria a interface para a 1ª Fase.
    }

    // Adiciona um participante à lista e à tabela da 1ª Fase.
    function adicionarParticipante() {
        const nome = nomeParticipanteInput.value.trim();
        if (!nome) return alert("Digite um nome válido!");
        if (currentEventData.participants.find(p => p.toLowerCase() === nome.toLowerCase())) return alert("Participante já adicionado!");
        
        currentEventData.participants.push(nome);
        const tableBody = getEl(`round-1-body`);
        const newRow = document.createElement('tr');
        newRow.innerHTML = `<td>${nome}</td>${Array.from({ length: 5 }, () => `<td><input type="number" step="0.1" min="0" max="10" class="nota-input"></td>`).join('')}`;
        tableBody.appendChild(newRow);
        
        nomeParticipanteInput.value = '';
        nomeParticipanteInput.focus();
    }

    // Função que cria a interface de uma nova fase (tabela e controles).
    function createNewRoundUI(roundNumber, participants, isReadOnly = false, eventData = null) {
        const roundSection = document.createElement('div');
        roundSection.className = 'round-section';
        roundSection.id = `round-${roundNumber}-section`;
        
        // Define quais controles aparecerão (Finalizar Rodada ou Finalizar Campeonato).
        let controlsHTML = '';
        if (!isReadOnly) {
            controlsHTML = (roundNumber < 3)
                ? `<div class="round-controls"><label>Quantos poetas passam?</label><input type="number" id="quantosPassam-${roundNumber}" min="1"><button id="btnFinalizarFase-${roundNumber}">Finalizar Rodada</button></div>`
                : `<div class="round-controls"><button id="btnFinalizarCampeonato">Finalizar Campeonato</button></div>`;
        }
        
        // Cria as linhas da tabela para cada participante.
        let tableRows = participants.map(p => {
            let name = p.name || p;
            let notes = ['','','','',''];
            // Se for modo "somente leitura" (histórico), preenche as notas salvas.
            if(isReadOnly && eventData) {
                const roundInfo = eventData.rounds[roundNumber];
                const participantInfo = roundInfo.find(player => player.name === name);
                if (participantInfo) notes = participantInfo.notes;
            }
            return `<tr><td>${name}</td>${notes.map(note => `<td><input type="number" value="${note}" class="nota-input" ${isReadOnly ? 'disabled' : ''}></td>`).join('')}</tr>`;
        }).join('');
        
        // Monta o HTML final da seção e o adiciona na página.
        roundSection.innerHTML = `<h3>${roundNumber}ª Fase</h3><table><thead><tr><th>Participante</th><th colspan="5">Notas dos Jurados</th></tr></thead><tbody id="round-${roundNumber}-body">${tableRows}</tbody></table>${controlsHTML}`;
        roundsContainer.appendChild(roundSection);

        // Adiciona o listener de clique ao botão da fase criada.
        if (!isReadOnly) {
            if (roundNumber < 3) {
                getEl(`btnFinalizarFase-${roundNumber}`).addEventListener('click', () => handleFinalizeRound(roundNumber));
            } else {
                getEl('btnFinalizarCampeonato').addEventListener('click', () => handleFinalizeRound(3));
            }
        }
    }

    // Pega as notas da tabela, calcula os scores e retorna uma lista ordenada.
    function calculateScores(roundNumber) {
        const tableBody = getEl(`round-${roundNumber}-body`);
        const rows = tableBody.querySelectorAll('tr');
        let participantsData = [];
        for (const row of rows) {
            const name = row.cells[0].textContent;
            const notes = Array.from(row.querySelectorAll('.nota-input')).map(input => parseFloat(input.value));
            // Validação das notas.
            for (const note of notes) {
                if (isNaN(note) || note < 0 || note > 10) {
                    throw new Error(`Erro para ${name}: Todas as notas devem ser preenchidas com valores entre 0 e 10.`);
                }
            }
            participantsData.push({ name, notes });
        }

        // Calcula os scores de cada participante.
        participantsData.forEach(p => {
            const sortedNotes = [...p.notes].sort((a, b) => a - b);
            p.primaryScore = sortedNotes[1] + sortedNotes[2] + sortedNotes[3]; // Soma das 3 notas do meio.
            p.tieBreakerScore = p.notes.reduce((sum, note) => sum + note, 0); // Soma de todas as 5 notas.
        });

        // Retorna a lista de participantes ordenada pelos scores.
        return participantsData.sort((a, b) => b.primaryScore - a.primaryScore || b.tieBreakerScore - a.tieBreakerScore);
    }
    
    // Função principal que orquestra a finalização de uma rodada.
    function handleFinalizeRound(roundNumber) {
        // Validação do nome do evento.
        if (roundNumber === 1) {
            const nomeEvento = getEl('nomeEventoInput').value.trim();
            if (!nomeEvento) return alert("Por favor, digite o nome do evento antes de finalizar a primeira rodada.");
            currentEventData.name = nomeEvento;
        }
        
        try {
            let participantsData = calculateScores(roundNumber);
            currentEventData.rounds[roundNumber] = participantsData; // Salva os dados da rodada no histórico do evento.
            
            if (roundNumber === 1) addParticipantSection.classList.add('hidden');

            // Lógica especial para definir o 3º lugar antecipadamente.
            if (roundNumber === 2) {
                const quantosPassam = parseInt(getEl(`quantosPassam-2`).value);
                if (quantosPassam === 2 && participantsData.length > 2) {
                    currentEventData.thirdPlaceFromPhase2 = participantsData[2].name; 
                }
            }

            // Lógica para a fase Final.
            if (roundNumber === 3) {
                lockRoundInputs(roundNumber);
                const winner = participantsData[0];
                const tiesForFirst = participantsData.filter(p => p.primaryScore === winner.primaryScore && p.tieBreakerScore === winner.tieBreakerScore);
                
                if (tiesForFirst.length > 1) {
                    handleManualChampionTieBreaker(tiesForFirst, participantsData);
                } else {
                    displayChampion(winner, participantsData);
                }
            } else { // Lógica para as fases 1 e 2.
                const quantosPassam = parseInt(getEl(`quantosPassam-${roundNumber}`).value);
                if (!quantosPassam || quantosPassam <= 0 || quantosPassam >= participantsData.length) {
                    throw new Error("Digite um número válido de classificados!");
                }
                const cutoffScore = participantsData[quantosPassam - 1];
                const advancing = participantsData.slice(0, quantosPassam);
                const tiedOnCutoff = participantsData.filter(p => p.primaryScore === cutoffScore.primaryScore && p.tieBreakerScore === cutoffScore.tieBreakerScore);
                
                // Verifica se há um empate na nota de corte que precisa de intervenção manual.
                if (advancing.length > quantosPassam || (tiedOnCutoff.length > 1 && advancing.includes(tiedOnCutoff[0]))) {
                    const strictlyAdvancing = advancing.filter(p => p.primaryScore > cutoffScore.primaryScore || p.tieBreakerScore > cutoffScore.tieBreakerScore);
                    const spotsLeft = quantosPassam - strictlyAdvancing.length;
                    handleManualTieBreaker(roundNumber, tiedOnCutoff, spotsLeft, strictlyAdvancing);
                } else {
                    startNextRound(roundNumber, advancing);
                }
            }
        } catch (error) {
            alert(error.message);
        }
    }
    
    // Desabilita os campos de uma rodada após ela ser finalizada.
    function lockRoundInputs(roundNumber) {
        const roundSection = getEl(`round-${roundNumber}-section`);
        roundSection.querySelectorAll('input, button').forEach(input => input.disabled = true);
    }

    // Cria a interface para o usuário resolver um desempate manualmente.
    function handleManualTieBreaker(roundNumber, tiedPlayers, spotsLeft, alreadyAdvancing) {
        lockRoundInputs(roundNumber);
        const section = getEl(`round-${roundNumber}-section`);
        let tieBreakerDiv = section.querySelector('.tie-breaker');
        if (!tieBreakerDiv) {
            tieBreakerDiv = document.createElement('div');
            tieBreakerDiv.className = 'tie-breaker';
            section.appendChild(tieBreakerDiv);
        }
        tieBreakerDiv.innerHTML = `<h4>Desempate Manual Necessário!</h4><p>Selecione ${spotsLeft} poeta(s) para passar:</p>${tiedPlayers.map(p => `<button data-name="${p.name}">${p.name}</button>`).join('')}<br><br><button id="confirmTieBreak-${roundNumber}">Confirmar Seleção</button>`;
        const buttons = tieBreakerDiv.querySelectorAll('button[data-name]');
        buttons.forEach(btn => btn.addEventListener('click', () => {
            const selectedCount = tieBreakerDiv.querySelectorAll('.selected').length;
            if (!btn.classList.contains('selected') && selectedCount >= spotsLeft) {
                alert(`Você só pode selecionar ${spotsLeft} poeta(s).`);
            } else {
                btn.classList.toggle('selected');
            }
        }));
        getEl(`confirmTieBreak-${roundNumber}`).addEventListener('click', () => {
            const selected = tieBreakerDiv.querySelectorAll('.selected');
            if (selected.length !== spotsLeft) return alert(`Seleção inválida. Escolha ${spotsLeft} poeta(s).`);
            const selectedNames = Array.from(selected).map(b => b.dataset.name);
            const manuallyAdvanced = tiedPlayers.filter(p => selectedNames.includes(p.name));
            startNextRound(roundNumber, [...alreadyAdvancing, ...manuallyAdvanced]);
        });
    };

    // Cria a interface para o desempate manual do campeão.
    function handleManualChampionTieBreaker(tiedChampions, finalRanking) {
        let tieBreakerDiv = getEl('eventResultContainer');
        tieBreakerDiv.classList.remove('hidden');
        tieBreakerDiv.innerHTML = `<h4>Empate na Final!</h4><p>Selecione quem ganhou:</p><div class="tie-breaker">${tiedChampions.map(p => `<button data-name="${p.name}">${p.name}</button>`).join('')}</div>`;
        tieBreakerDiv.querySelectorAll('button').forEach(btn => btn.addEventListener('click', (e) => {
            const championName = e.target.dataset.name;
            const champion = tiedChampions.find(p => p.name === championName);
            displayChampion(champion, finalRanking);
        }));
    };

    // Inicia a próxima rodada com os participantes que avançaram.
    function startNextRound(roundNumber, advancingPlayers) {
        lockRoundInputs(roundNumber);
        const tieBreakerDiv = getEl(`round-${roundNumber}-section`).querySelector('.tie-breaker');
        if (tieBreakerDiv) tieBreakerDiv.innerHTML = "<p>Desempate resolvido.</p>";
        createNewRoundUI(roundNumber + 1, advancingPlayers);
    };

    // --- LÓGICA DE RANKING ---

    // Atualiza o ranking geral com os dados do evento finalizado.
    function updateGlobalRanking(podium) {
        currentEventData.participants.forEach(name => {
            let player = appData.ranking.find(p => p.name === name);
            if (!player) {
                player = { name, gold: 0, silver: 0, bronze: 0, editions: 0, totalNotesSum: 0, totalNotesCount: 0 };
                appData.ranking.push(player);
            }
            player.editions += 1;
            
            let totalNotesForEvent = 0;
            let totalNoteCountForEvent = 0;
            for(const round in currentEventData.rounds) {
                const participantInRound = currentEventData.rounds[round].find(p => p.name === name);
                if(participantInRound) {
                    totalNotesForEvent += participantInRound.notes.reduce((sum, note) => sum + note, 0);
                    totalNoteCountForEvent += participantInRound.notes.length;
                }
            }
            player.totalNotesSum += totalNotesForEvent;
            player.totalNotesCount += totalNoteCountForEvent;
        });

        // Adiciona as medalhas para o pódio.
        if (podium.gold) { appData.ranking.find(p => p.name === podium.gold).gold += 1; }
        if (podium.silver) { appData.ranking.find(p => p.name === podium.silver).silver += 1; }
        if (podium.bronze) { appData.ranking.find(p => p.name === podium.bronze).bronze += 1; }
    }

    // Exibe o campeão na tela.
    function displayChampion(champion, finalRanking) {
        // Define o pódio completo.
        const podium = { gold: champion.name };
        const silverPlayer = finalRanking.find(p => p.name !== champion.name);
        podium.silver = silverPlayer ? silverPlayer.name : null;
        
        if (currentEventData.thirdPlaceFromPhase2) {
            podium.bronze = currentEventData.thirdPlaceFromPhase2;
        } else if (finalRanking.length > 2) {
            const bronzePlayer = finalRanking.find(p => p.name !== podium.gold && p.name !== podium.silver);
            podium.bronze = bronzePlayer ? bronzePlayer.name : null;
        }
        currentEventData.podium = podium;

        // Atualiza os dados do ranking e salva tudo.
        updateGlobalRanking(podium);
        appData.eventHistory.push(currentEventData);
        saveData();
        
        // Mostra o resultado na tela.
        eventResultContainer.classList.remove('hidden');
        eventResultContainer.innerHTML = `<h3>🏆 Campeão: ${champion.name} 🏆</h3>`;
    }
    
    // Desenha a tabela de Ranking Geral.
    function renderRanking() {
        rankingTableBody.innerHTML = '';
        if (appData.ranking.length === 0) {
            rankingTableBody.innerHTML = `<tr><td colspan="7">Nenhum evento realizado</td></tr>`;
            return;
        }
        
        // Ordena o ranking com os 5 critérios.
        appData.ranking.sort((a, b) => {
            if (b.gold !== a.gold) return b.gold - a.gold;
            if (b.silver !== a.silver) return b.silver - a.silver;
            if (b.bronze !== a.bronze) return b.bronze - a.bronze;
            if (b.editions !== a.editions) return b.editions - a.editions;
            const avgA = a.totalNotesCount > 0 ? a.totalNotesSum / a.totalNotesCount : 0;
            const avgB = b.totalNotesCount > 0 ? b.totalNotesSum / b.totalNotesCount : 0;
            return avgB - avgA;
        });
        
        // Cria as linhas da tabela.
        appData.ranking.forEach((player, index) => {
            const avgGrade = player.totalNotesCount > 0 ? (player.totalNotesSum / player.totalNotesCount).toFixed(2) : '0.00';
            const row = document.createElement('tr');
            row.innerHTML = `<td>${index + 1}º</td><td>${player.name}</td><td>${player.gold}</td><td>${player.silver}</td><td>${player.bronze}</td><td>${player.editions}</td><td>${avgGrade}</td>`;
            rankingTableBody.appendChild(row);
        });
    }

    // Desenha a tabela de Histórico de Edições.
    function renderHistory() {
        historyTableBody.innerHTML = '';
        if (appData.eventHistory.length === 0) {
            historyTableBody.innerHTML = `<tr><td colspan="3">Nenhuma edição anterior</td></tr>`;
            return;
        }

        // Ordena para mostrar os eventos mais recentes primeiro.
        appData.eventHistory.sort((a, b) => b.id - a.id); 

        appData.eventHistory.forEach(event => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${event.name}</td><td>${event.date}</td><td><button class="view-history-btn" data-id="${event.id}">Ver Detalhes</button></td>`;
            historyTableBody.appendChild(row);
        });
    }
    
    // Listener para os botões "Ver Detalhes" da tabela de histórico.
    historyTableBody.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('view-history-btn')) {
            const eventId = parseInt(e.target.dataset.id, 10);
            showEventDetails(eventId);
        }
    });

    // Mostra os detalhes de um evento passado em modo somente leitura.
    function showEventDetails(eventId) {
        const eventData = appData.eventHistory.find(event => event.id === eventId);
        if (!eventData) return;

        showCampeonatoView();
        addParticipantSection.classList.add('hidden');
        eventResultContainer.classList.add('hidden');
        roundsContainer.innerHTML = '';
        eventTitleContainer.innerHTML = `<h2>Histórico: ${eventData.name}</h2>`;

        // Cria a visualização de cada fase do evento passado.
        Object.keys(eventData.rounds).sort().forEach(roundNumber => {
            const participantsOfRound = eventData.rounds[roundNumber].map(p => p.name);
            createNewRoundUI(parseInt(roundNumber, 10), participantsOfRound, true, eventData);
        });
        
        // Mostra o pódio do evento.
        const podium = eventData.podium;
        eventResultContainer.innerHTML = `
            <h3>Pódio da Edição</h3>
            <p><strong>🥇 Ouro:</strong> ${podium.gold || 'N/A'}</p>
            <p><strong>🥈 Prata:</strong> ${podium.silver || 'N/A'}</p>
            <p><strong>🥉 Bronze:</strong> ${podium.bronze || 'N/A'}</p>
        `;
        eventResultContainer.classList.remove('hidden');
    }
    
    // --- INICIALIZAÇÃO DA APLICAÇÃO ---
    // Carrega os dados salvos e renderiza as tabelas ao abrir a página.
    loadData();
    renderAll();
});