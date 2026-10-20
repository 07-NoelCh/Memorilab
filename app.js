// app.js - Controlador principal de la interfaz y máquina de estados del juego

let state = {
    screen: 'home', // 'home' | 'l1' | 'l2' | 'l3' | 'l4' | 'fin'
    username: '',
    score: 0,
    // Nivel 1 State
    l1: { P: [], t: 0, good: 0, timer: null, RAM: 16 },
    // Nivel 2 State
    l2: { round: 0, scores: 0, currentSizeIndex: 2, done: false },
    // Nivel 3 State
    l3: { step: 0, shared: [true, true, true, true], sc: 0, answered: false },
    // Nivel 4 State
    l4: { index: 0, sc: 0, answered: false, startTime: 0 }
};

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];
const SIZES_L2 = [
    { bytes: 1024, label: '1 KB' },
    { bytes: 2048, label: '2 KB' },
    { bytes: 4096, label: '4 KB' },
    { bytes: 8192, label: '8 KB' },
    { bytes: 16384, label: '16 KB' }
];

document.addEventListener('DOMContentLoaded', () => {
    render();
});

function navigate(screenName) {
    clearActiveTimers();
    state.screen = screenName;
    render();
}

function clearActiveTimers() {
    if (state.l1.timer !== null) {
        clearInterval(state.l1.timer);
        state.l1.timer = null;
    }
}

function render() {
    const root = document.getElementById('app-root');
    const navBadge = document.getElementById('user-badge');
    const navUsername = document.getElementById('nav-username');

    if (state.username) {
        navBadge.classList.remove('hidden');
        navUsername.textContent = state.username;
    } else {
        navBadge.classList.add('hidden');
    }

    switch (state.screen) {
        case 'home':
            root.innerHTML = renderHome();
            initHomeEvents();
            break;
        case 'l1':
            root.innerHTML = renderL1();
            initL1Events();
            break;
        case 'l2':
            root.innerHTML = renderL2();
            initL2Events();
            break;
        case 'l3':
            root.innerHTML = renderL3();
            initL3Events();
            break;
        case 'l4':
            root.innerHTML = renderL4();
            initL4Events();
            break;
        case 'fin':
            root.innerHTML = renderFin();
            break;
    }
}

// --- PANTALLA INICIO ---
function renderHome() {
    const ranking = RankingManager.getRanking();
    return `
        <div class="space-y-6">
            <div class="text-center space-y-3 py-4">
                <span class="bg-indigo-500/10 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/20">Simulador Interactivo</span>
                <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">Memory Lab Challenge</h1>
                <p class="text-slate-400 max-w-lg mx-auto text-sm sm:text-base">Cuatro retos prácticos sobre gestión de memoria virtual (Tanenbaum Cap. 3.5): thrashing, tamaño de página óptimo, Copy-on-Write y evaluación final.</p>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <h2 class="text-lg font-bold text-slate-200">Identificación</h2>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1.5" for="input-name">Tu nombre o apodo para el ranking</label>
                    <input type="text" id="input-name" maxlength="20" value="${escapeHtml(state.username)}" placeholder="Ej. Ana Dev" 
                        class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition font-medium">
                </div>
                <button id="btn-start" class="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2">
                    <span>Comenzar Retos</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <h2 class="text-lg font-bold text-slate-200">Ranking General del Curso</h2>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="text-xs uppercase text-slate-500 border-b border-slate-800">
                            <tr>
                                <th class="pb-2 font-semibold">#</th>
                                <th class="pb-2 font-semibold">Nombre</th>
                                <th class="pb-2 font-semibold text-right">Puntaje</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/50">
                            ${ranking.length ? ranking.map((r, i) => `
                                <tr class="${r.name === state.username ? 'bg-indigo-950/40 text-indigo-300 font-bold' : 'text-slate-300'}">
                                    <td class="py-2.5 text-slate-500 font-mono">${i + 1}</td>
                                    <td class="py-2.5 truncate max-w-[150px]">${escapeHtml(r.name)}</td>
                                    <td class="py-2.5 text-right font-mono font-bold">${r.score} pts</td>
                                </tr>
                            `).join('') : `<tr><td colspan="3" class="py-4 text-center text-slate-500 text-xs">Aún no hay registros en el ranking. ¡Sé el primero!</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function initHomeEvents() {
    const btn = document.getElementById('btn-start');
    const input = document.getElementById('input-name');
    btn.addEventListener('click', () => {
        const val = input.value.trim();
        state.username = val || 'Estudiante Anónimo';
        state.score = 0;
        startL1();
    });
}

// --- NIVEL 1: THRASHING ---
function startL1() {
    state.l1 = {
        P: [
            { id: 0, ws: 4, on: true },
            { id: 1, ws: 5, on: true }
        ],
        t: 0,
        good: 0,
        RAM: 16,
        timer: null
    };
    navigate('l1');
    state.l1.timer = setInterval(tickL1, 1000);
}

function getL1Stats() {
    const active = state.l1.P.filter(p => p.on);
    const demand = active.reduce((sum, p) => sum + p.ws, 0);
    const count = active.length;
    let cpuUtil = count ? Math.round(100 * (1 - Math.pow(0.35, count))) : 0;
    if (demand > state.l1.RAM) {
        cpuUtil = Math.round(cpuUtil * Math.pow(state.l1.RAM / demand, 3));
    }
    const thrashing = demand > state.l1.RAM;
    return { demand, count, cpuUtil, thrashing };
}

function tickL1() {
    if (state.screen !== 'l1' || state.l1.t >= 30) {
        clearActiveTimers();
        return;
    }

    state.l1.t++;
    // Agregar un proceso cada 5 segundos si hay menos de 6
    if (state.l1.t % 5 === 0 && state.l1.P.length < 6) {
        state.l1.P.push({
            id: state.l1.P.length,
            ws: 3 + Math.floor(Math.random() * 3),
            on: true
        });
    }
    const stats = getL1Stats();
    if (stats.cpuUtil >= 70) {
        state.l1.good++;
    }

    updateL1DOM();

    if (state.l1.t >= 30) {
        clearActiveTimers();
        endL1();
    }
}

function renderL1() {
    return `
        <div class="space-y-6">
            <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div>
                    <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Nivel 1 de 4</span>
                    <h2 class="text-xl font-bold">Control de Carga & Thrashing</h2>
                </div>
                <div class="text-right font-mono font-bold text-lg" id="l1-timer">
                    ${state.l1.t}/30s
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <p class="text-sm text-slate-300">Mantén la CPU útil al <strong>70% o más</strong> durante 30 segundos. Si la demanda supera los 16 marcos de RAM, ocurre <em>thrashing</em>. Activa o desactiva procesos enviándolos al disco (swap).</p>

                <!-- Visualizador de Marcos RAM -->
                <div>
                    <div class="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                        <span>Memoria Física (RAM: 16 Marcos)</span>
                        <span id="l1-demand-label">Demanda total: --</span>
                    </div>
                    <div class="grid grid-cols-4 sm:grid-cols-8 gap-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800" id="l1-ram-grid">
                        <!-- Generado dinámicamente -->
                    </div>
                </div>

                <!-- Barras de Rendimiento -->
                <div class="space-y-3 pt-2">
                    <div>
                        <div class="flex justify-between text-xs font-semibold mb-1">
                            <span class="text-slate-300">CPU Útil</span>
                            <span id="l1-cpu-val" class="font-mono">0%</span>
                        </div>
                        <div class="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div id="l1-cpu-bar" class="h-full bg-emerald-500 transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between text-xs font-semibold mb-1">
                            <span class="text-slate-300">Actividad de Intercambio (Swap Disk)</span>
                            <span id="l1-disk-val" class="font-mono">0%</span>
                        </div>
                        <div class="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div id="l1-disk-bar" class="h-full bg-amber-500 transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <!-- Chips de Procesos -->
                <div class="pt-2">
                    <span class="text-xs font-semibold text-slate-400 block mb-2">Procesos Activos (Click para hacer Swap In / Out)</span>
                    <div class="flex flex-wrap gap-2.5" id="l1-chips-container">
                        <!-- Chips dinámicos -->
                    </div>
                </div>
            </div>

            <div id="l1-status-msg" class="text-center font-semibold text-sm text-slate-400 min-h-[30px]"></div>
        </div>
    `;
}

function initL1Events() {
    updateL1DOM();
}

function updateL1DOM() {
    const stats = getL1Stats();
    const timerEl = document.getElementById('l1-timer');
    if (timerEl) timerEl.textContent = `${state.l1.t}/30s (Buenos: ${state.l1.good})`;

    const demandLabel = document.getElementById('l1-demand-label');
    if (demandLabel) {
        demandLabel.textContent = `Demanda: ${stats.demand}/${state.l1.RAM} marcos` + (stats.thrashing ? ' ⚠️ [THRASHING]' : '');
        demandLabel.className = stats.thrashing ? 'text-rose-400 font-bold' : 'text-slate-400';
    }

    // Grid de RAM
    const ramGrid = document.getElementById('l1-ram-grid');
    if (ramGrid) {
        let html = '';
        let filled = 0;
        state.l1.P.filter(p => p.on).forEach(p => {
            for (let i = 0; i < p.ws && filled < state.l1.RAM; i++) {
                html += `<div class="h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm" style="background-color: ${COLORS[p.id]}">P${p.id+1}</div>`;
                filled++;
            }
        });
        while (filled < state.l1.RAM) {
            html += `<div class="h-8 rounded-lg bg-slate-900 border border-slate-800/60"></div>`;
            filled++;
        }
        ramGrid.innerHTML = html;
    }

    // Barras
    const cpuBar = document.getElementById('l1-cpu-bar');
    const cpuVal = document.getElementById('l1-cpu-val');
    if (cpuBar && cpuVal) {
        cpuVal.textContent = stats.cpuUtil + '%';
        cpuBar.style.width = stats.cpuUtil + '%';
        cpuBar.className = `h-full transition-all duration-300 ${stats.cpuUtil >= 70 ? 'bg-emerald-500' : 'bg-rose-500'}`;
    }

    const diskBar = document.getElementById('l1-disk-bar');
    const diskVal = document.getElementById('l1-disk-val');
    if (diskBar && diskVal) {
        const diskPct = stats.thrashing ? Math.min(100, 40 + (stats.demand - state.l1.RAM) * 12) : stats.count * 6;
        diskVal.textContent = diskPct + '%';
        diskBar.style.width = diskPct + '%';
    }

    // Chips
    const chipsContainer = document.getElementById('l1-chips-container');
    if (chipsContainer) {
        chipsContainer.innerHTML = state.l1.P.map(p => `
            <button onclick="toggleProcessL1(${p.id})" class="px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center space-x-2 ${p.on ? 'bg-slate-800 border-slate-700 text-white shadow-md' : 'bg-slate-950 border-dashed border-slate-800 text-slate-500'}">
                <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${p.on ? COLORS[p.id] : '#475569'}"></span>
                <span>Proceso P${p.id + 1} (${p.ws} marcos) ${p.on ? '' : ' [En Disco]'}</span>
            </button>
        `).join('');
    }

    const statusMsg = document.getElementById('l1-status-msg');
    if (statusMsg) {
        statusMsg.textContent = stats.thrashing ? '⚠️ Alerta: Demanda excesiva de marcos. Despacha procesos al disco.' : (stats.cpuUtil < 70 ? '⚡ CPU desaprovechada. Trae más procesos a la RAM.' : '✅ Excelente rendimiento de carga.');
    }
}

function toggleProcessL1(id) {
    state.l1.P[id].on = !state.l1.P[id].on;
    updateL1DOM();
}

function endL1() {
    const sc1 = Math.min(300, state.l1.good * 10);
    state.score += sc1;
    const root = document.getElementById('app-root');
    root.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div class="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 class="text-2xl font-bold">¡Nivel 1 Completado!</h2>
            <p class="text-slate-300 text-sm">Mantuviste la CPU útil en niveles óptimos durante <span class="font-bold text-white">${state.l1.good}</span> segundos.</p>
            <div class="bg-slate-950 py-3 rounded-xl border border-slate-800 font-mono text-xl font-bold text-emerald-400">+${sc1} Puntos</div>
            <button onclick="startL2()" class="w-full bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl font-bold transition shadow-lg shadow-indigo-600/30">Continuar al Nivel 2</button>
        </div>
    `;
}

// --- NIVEL 2: TAMAÑO DE PÁGINA ---
function startL2() {
    state.l2 = { round: 0, scores: 0, currentSizeIndex: 2, done: false };
    renderL2View();
}

const L2_DATA = [
    { segSize: 524288, label: '512 KB' },
    { segSize: 2097152, label: '2 MB' },
    { segSize: 8388608, label: '8 MB' }
];

function calcOverhead(pageSize, segSize) {
    const entrySize = 8; // bytes por entrada en tabla de páginas
    const tableOverhead = (segSize / pageSize) * entrySize;
    const internalFragmentation = pageSize / 2;
    return { tableOverhead, internalFragmentation, total: tableOverhead + internalFragmentation };
}

function renderL2() {
    const cur = L2_DATA[state.l2.round];
    const pageSize = SIZES_L2[state.l2.currentSizeIndex].bytes;
    const oh = calcOverhead(pageSize, cur.segSize);
    
    return `
        <div class="space-y-6">
            <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div>
                    <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Nivel 2 de 4 · Ronda ${state.l2.round + 1}/3</span>
                    <h2 class="text-xl font-bold">Tamaño Óptimo de Página</h2>
                </div>
                <div class="font-mono text-sm bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
                    Proceso: <span class="text-white font-bold">${cur.label}</span>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <p class="text-sm text-slate-300">Ajusta el tamaño de página para minimizar la sobrecarga total (Tabla de páginas + Fragmentación interna).</p>
                
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="text-xs font-semibold text-slate-400">Seleccionar Tamaño de Página (p)</label>
                        <span id="l2-sel-val" class="font-mono font-bold text-indigo-400 text-sm">${SIZES_L2[state.l2.currentSizeIndex].label}</span>
                    </div>
                    <input type="range" id="l2-range" min="0" max="${SIZES_L2.length - 1}" value="${state.l2.currentSizeIndex}" 
                        class="w-full accent-indigo-500 bg-slate-950 cursor-pointer h-2 rounded-lg">
                </div>

                <div class="space-y-3 pt-2">
                    <div>
                        <div class="flex justify-between text-xs font-semibold mb-1">
                            <span class="text-slate-300">Sobrecarga por Tabla de Páginas</span>
                            <span id="l2-table-val" class="font-mono">--</span>
                        </div>
                        <div class="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div id="l2-table-bar" class="h-full bg-amber-500 transition-all duration-200" style="width: 30%"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between text-xs font-semibold mb-1">
                            <span class="text-slate-300">Fragmentación Interna Promedio</span>
                            <span id="l2-frag-val" class="font-mono">--</span>
                        </div>
                        <div class="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div id="l2-frag-bar" class="h-full bg-indigo-500 transition-all duration-200" style="width: 50%"></div>
                        </div>
                    </div>
                </div>

                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span class="text-sm font-semibold text-slate-300">Sobrecarga Total:</span>
                    <span id="l2-total-val" class="font-mono text-lg font-bold text-indigo-300">--</span>
                </div>

                <button id="l2-confirm-btn" class="w-full bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl font-bold transition shadow-lg shadow-indigo-600/30">Confirmar Tamaño</button>
            </div>
            <div id="l2-feedback" class="text-center font-semibold text-sm"></div>
        </div>
    `;
}

function renderL2View() {
    clearActiveTimers();
    state.screen = 'l2';
    document.getElementById('app-root').innerHTML = renderL2();
    initL2Events();
    updateL2UI();
}

function updateL2UI() {
    const cur = L2_DATA[state.l2.round];
    const idx = parseInt(document.getElementById('l2-range').value);
    state.l2.currentSizeIndex = idx;
    const pageSize = SIZES_L2[idx].bytes;

    document.getElementById('l2-sel-val').textContent = SIZES_L2[idx].label;
    const oh = calcOverhead(pageSize, cur.segSize);

    const fmt = b => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b >= 1024 ? (b / 1024).toFixed(1) + ' KB' : Math.round(b) + ' B');

    document.getElementById('l2-table-val').textContent = fmt(oh.tableOverhead);
    document.getElementById('l2-frag-val').textContent = fmt(oh.internalFragmentation);
    document.getElementById('l2-total-val').textContent = fmt(oh.total);

    const maxScale = Math.max(
        ...SIZES_L2.map(size => {
            const overhead = calcOverhead(size.bytes, cur.segSize);
            return overhead.tableOverhead + overhead.internalFragmentation;
        })
    );
    document.getElementById('l2-table-bar').style.width = Math.min(100, (oh.tableOverhead / maxScale) * 100) + '%';
    document.getElementById('l2-frag-bar').style.width = Math.min(100, (oh.internalFragmentation / maxScale) * 100) + '%';
}

function initL2Events() {
    const range = document.getElementById('l2-range');
    range.addEventListener('input', updateL2UI);

    const btn = document.getElementById('l2-confirm-btn');
    btn.addEventListener('click', () => {
        if (state.l2.done) return;
        state.l2.done = true;

        const cur = L2_DATA[state.l2.round];
        const selectedPageSize = SIZES_L2[state.l2.currentSizeIndex].bytes;
        const optimalP = Math.sqrt(2 * cur.segSize * 8);

        // Encontrar cuál tamaño de página de SIZES_L2 es el más cercano al óptimo matemático
        let bestIdx = 0;
        let minDiff = Infinity;
        SIZES_L2.forEach((s, i) => {
            const diff = Math.abs(s.bytes - optimalP);
            if (diff < minDiff) {
                minDiff = diff;
                bestIdx = i;
            }
        });

        const isOptimal = state.l2.currentSizeIndex === bestIdx;
        const roundPts = isOptimal ? 100 : 40;
        state.l2.scores += roundPts;

        const fb = document.getElementById('l2-feedback');
        fb.innerHTML = `
            <div class="bg-slate-900 border ${isOptimal ? 'border-emerald-500/30 text-emerald-400' : 'border-amber-500/30 text-amber-400'} p-4 rounded-xl space-y-2">
                <p class="font-bold">${isOptimal ? '🎉 ¡Opción más cercana al óptimo!' : '⚠️ No seleccionaste la opción más cercana.'}</p>
                <p class="text-xs text-slate-300">El óptimo teórico según p = √(2·s·e) es ${(optimalP / 1024).toFixed(2)} KB; la opción disponible más cercana es <strong>${SIZES_L2[bestIdx].label}</strong>. Ganaste <span class="font-bold text-white">+${roundPts} pts</span>.</p>
                <button id="l2-next-btn" class="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg transition text-xs">${state.l2.round < 2 ? 'Siguiente Ronda' : 'Avanzar al Nivel 3'}</button>
            </div>
        `;

        document.getElementById('l2-next-btn').addEventListener('click', () => {
            if (state.l2.round < 2) {
                state.l2.round++;
                state.l2.done = false;
                renderL2View();
            } else {
                state.score += state.l2.scores;
                startL3();
            }
        });
    });
}

// --- NIVEL 3: COPY-ON-WRITE ---
const COW_OPS = [
    { actor: 'Hijo', op: 'lee', page: 1 },
    { actor: 'Padre', op: 'escribe', page: 2 },
    { actor: 'Hijo', op: 'escribe', page: 2 },
    { actor: 'Hijo', op: 'escribe', page: 3 },
    { actor: 'Padre', op: 'lee', page: 0 },
    { actor: 'Hijo', op: 'escribe', page: 1 }
];

function startL3() {
    state.l3 = { step: 0, shared: [true, true, true, true], sc: 0, answered: false };
    renderL3View();
}

function renderL3() {
    const op = COW_OPS[state.l3.step];
    return `
        <div class="space-y-6">
            <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div>
                    <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Nivel 3 de 4 · Paso ${state.l3.step + 1}/6</span>
                    <h2 class="text-xl font-bold">Copy-on-Write (CoW)</h2>
                </div>
                <div class="font-mono text-sm bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
                    Marcos en uso: <span id="l3-frames-count" class="text-white font-bold">${4 + state.l3.shared.filter(s => !s).length}</span>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <p class="text-sm text-slate-300">Tras un <code>fork()</code>, padre e hijo comparten 4 páginas en solo lectura. Decide si la operación del sistema operativo requiere duplicar la página.</p>

                <!-- Estado de Páginas -->
                <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-900 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th class="p-3 font-semibold">Página</th>
                                <th class="p-3 font-semibold">Estado de Memoria</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60" id="l3-table-body">
                            ${state.l3.shared.map((s, i) => `
                                <tr>
                                    <td class="p-3 font-mono font-bold text-slate-300">Página P${i}</td>
                                    <td class="p-3 ${s ? 'text-indigo-400 font-semibold' : 'text-emerald-400 font-semibold'}">${s ? 'Compartida (Solo Lectura)' : 'Separada (Lectura / Escritura)'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Operación Solicitada</span>
                    <div class="text-xl font-bold text-white">${op.actor} <span class="text-indigo-400">${op.op}</span> en la página <span class="font-mono text-amber-400">P${op.page}</span></div>
                </div>

                <div class="grid grid-cols-2 gap-3" id="l3-actions">
                    <button onclick="answerL3(true)" class="bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl font-bold text-sm transition shadow-lg shadow-indigo-600/20">Sí, se copia</button>
                    <button onclick="answerL3(false)" class="bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl font-bold text-sm transition border border-slate-700">No se copia</button>
                </div>
            </div>
            <div id="l3-feedback" class="text-center font-semibold text-sm"></div>
        </div>
    `;
}

function renderL3View() {
    clearActiveTimers();
    state.screen = 'l3';
    document.getElementById('app-root').innerHTML = renderL3();
}

function answerL3(userSaysCopy) {
    if (state.l3.answered) return;
    state.l3.answered = true;

    const op = COW_OPS[state.l3.step];
    const needCopy = op.op === 'escribe' && state.l3.shared[op.page];
    const correct = userSaysCopy === needCopy;

    if (correct) state.l3.sc += 50;
    if (needCopy) {
        state.l3.shared[op.page] = false;
    }

    const fb = document.getElementById('l3-feedback');
    fb.innerHTML = `
        <div class="bg-slate-900 border ${correct ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'} p-4 rounded-xl space-y-2 shadow-lg">
            <p class="font-bold">${correct ? '✅ ¡Correcto!' : '❌ Incorrecto.'}</p>
            <p class="text-xs text-slate-300">${needCopy ? 'Escribir sobre una página compartida genera un trap: el SO duplica la página de forma privada.' : (op.op === 'lee' ? 'Las operaciones de lectura nunca requieren copiar páginas compartidas.' : 'La página ya estaba previamente separada, por lo que se escribe sin interrupción.')}</p>
            <button onclick="nextL3Step()" class="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg transition text-xs">${state.l3.step < 5 ? 'Siguiente Operación' : 'Ir a la Trivia Final'}</button>
        </div>
    `;
    
    // Actualizar tabla visual
    document.getElementById('l3-table-body').innerHTML = state.l3.shared.map((s, i) => `
        <tr>
            <td class="p-3 font-mono font-bold text-slate-300">Página P${i}</td>
            <td class="p-3 ${s ? 'text-indigo-400 font-semibold' : 'text-emerald-400 font-semibold'}">${s ? 'Compartida (Solo Lectura)' : 'Separada (Lectura / Escritura)'}</td>
        </tr>
    `).join('');
    document.getElementById('l3-frames-count').textContent = 4 + state.l3.shared.filter(s => !s).length;
    document.getElementById('l3-actions').classList.add('hidden');
}

function nextL3Step() {
    if (state.l3.step < 5) {
        state.l3.step++;
        state.l3.answered = false;
        renderL3View();
    } else {
        state.score += state.l3.sc;
        startL4();
    }
}

// --- NIVEL 4: TRIVIA FINAL ---
function startL4() {
    state.l4 = { index: 0, sc: 0, answered: false, startTime: Date.now() };
    renderL4View();
}

function renderL4() {
    const q = TRIVIA_QUESTIONS[state.l4.index];
    return `
        <div class="space-y-6">
            <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div>
                    <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Nivel 4 de 4 · Pregunta ${state.l4.index + 1}/8</span>
                    <h2 class="text-xl font-bold">Trivia de Memoria Virtual</h2>
                </div>
                <div class="font-mono text-sm bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-indigo-400 font-bold">
                    ${state.l4.sc} Pts
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                <h3 class="text-base sm:text-lg font-bold text-slate-100 leading-snug">${q.q}</h3>
                
                <div class="grid grid-cols-1 gap-3" id="l4-options">
                    ${q.options.map((opt, i) => `
                        <button onclick="answerL4(${i})" class="w-full text-left p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 transition text-sm font-medium text-slate-200 flex items-start space-x-3 group">
                            <span class="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition shrink-0">${['A', 'B', 'C', 'D'][i]}</span>
                            <span>${opt}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div id="l4-feedback" class="text-center font-semibold text-sm"></div>
        </div>
    `;
}

function renderL4View() {
    clearActiveTimers();
    state.screen = 'l4';
    document.getElementById('app-root').innerHTML = renderL4();
    state.l4.startTime = Date.now();
}

function answerL4(idx) {
    if (state.l4.answered) return;
    state.l4.answered = true;

    const q = TRIVIA_QUESTIONS[state.l4.index];
    const correct = idx === q.answer;
    const elapsedSec = (Date.now() - state.l4.startTime) / 1000;
    const bonus = correct ? Math.max(0, 10 - Math.floor(elapsedSec)) : 0;
    const pts = correct ? (25 + bonus) : 0;

    state.l4.sc += pts;

    // Colorear botones
    const buttons = document.querySelectorAll('#l4-options button');
    buttons.forEach((b, i) => {
        b.disabled = true;
        if (i === q.answer) {
            b.className = 'w-full text-left p-4 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-200 text-sm font-bold flex items-start space-x-3';
        } else if (i === idx && !correct) {
            b.className = 'w-full text-left p-4 rounded-xl bg-rose-950/40 border border-rose-500 text-rose-200 text-sm font-bold flex items-start space-x-3';
        } else {
            b.className = 'w-full text-left p-4 rounded-xl bg-slate-950/40 border border-slate-900 opacity-50 text-slate-500 text-sm flex items-start space-x-3';
        }
    });

    const fb = document.getElementById('l4-feedback');
    fb.innerHTML = `
        <div class="bg-slate-900 border ${correct ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'} p-4 rounded-xl space-y-2 shadow-lg">
            <p class="font-bold">${correct ? `🎉 ¡Correcto! (+${pts} pts)` : '❌ Respuesta Incorrecta.'}</p>
            <p class="text-xs text-slate-300">${q.explanation}</p>
            <button id="l4-next-btn" class="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg transition text-xs">${state.l4.index < 7 ? 'Siguiente Pregunta' : 'Ver Resultado Final'}</button>
        </div>
    `;

    document.getElementById('l4-next-btn').addEventListener('click', () => {
        if (state.l4.index < 7) {
            state.l4.index++;
            state.l4.answered = false;
            renderL4View();
        } else {
            state.score += state.l4.sc;
            finishGame();
        }
    });
}

// --- PANTALLA FINAL ---
function finishGame() {
    // Guardar en el ranking persistente
    const updatedRanking = RankingManager.saveScore(state.username, state.score);
    navigate('fin');
}

function renderFin() {
    const ranking = RankingManager.getRanking();
    return `
        <div class="space-y-6 text-center">
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-xl">
                <div class="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20 shadow-lg shadow-indigo-500/20">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                </div>
                <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">¡Desafío Concluido!</span>
                <h2 class="text-3xl font-extrabold text-white">Puntaje Total: <span class="text-indigo-400 font-mono">${state.score}</span> Pts</h2>
                <p class="text-slate-300 text-sm max-w-md mx-auto">Has completado con éxito todos los módulos de gestión de memoria virtual basados en la obra de Andrew Tanenbaum.</p>
                
                <button onclick="navigate('home')" class="w-full bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl font-bold transition shadow-lg shadow-indigo-600/30">Jugar Nuevamente</button>
            </div>

            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left shadow-xl space-y-4">
                <h3 class="text-lg font-bold text-slate-200">Ranking Actualizado del Curso</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="text-xs uppercase text-slate-500 border-b border-slate-800">
                            <tr>
                                <th class="pb-2 font-semibold">#</th>
                                <th class="pb-2 font-semibold">Nombre</th>
                                <th class="pb-2 font-semibold text-right">Puntaje</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/50">
                            ${ranking.map((r, i) => `
                                <tr class="${r.name === state.username ? 'bg-indigo-950/40 text-indigo-300 font-bold' : 'text-slate-300'}">
                                    <td class="py-2.5 text-slate-500 font-mono">${i + 1}</td>
                                    <td class="py-2.5 truncate max-w-[150px]">${escapeHtml(r.name)}</td>
                                    <td class="py-2.5 text-right font-mono font-bold">${r.score} pts</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Utilidad de escape XSS
function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}