/* ================================================================
   PneumoScan AI — script.js
   Vanilla JS | Async/Await | Chart.js | Modular Architecture
   ================================================================ */

'use strict';

// ---------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------
const API_BASE = 'http://127.0.0.1:5000';
const CHAT_RESPONSES = {
  pneumonia: `Pneumonia is an infection that inflames the air sacs (alveoli) in one or both lungs. These sacs may fill with fluid or pus, causing cough with phlegm, fever, chills, and difficulty breathing. It can be caused by bacteria, viruses, or fungi — and ranges from mild to life-threatening.`,
  serious: `Pneumonia can range from mild ("walking pneumonia") to life-threatening, depending on the pathogen, your age, and overall health. High-risk groups include infants, elderly adults, and immunocompromised individuals. Hospitalization is sometimes required. That said, many healthy adults recover fully with proper antibiotic treatment within 1–3 weeks.`,
  todo: `If pneumonia is suspected, you should:\n1. Consult a licensed physician or pulmonologist immediately\n2. Do not self-medicate — proper treatment depends on the causative pathogen\n3. Rest and stay well-hydrated\n4. Avoid smoking or secondhand smoke exposure\n5. Follow up with a healthcare provider even if symptoms improve`,
  symptoms: `Common symptoms of pneumonia include:\n• Cough (may produce mucus)\n• Fever, sweating, and chills\n• Shortness of breath, especially during activity\n• Sharp or stabbing chest pain worsened by breathing\n• Fatigue and muscle aches\n• Nausea, vomiting, or diarrhea (especially in children)\n\nSome people experience atypical or "walking" pneumonia with milder symptoms.`,
  result: `Based on the AI scan result, the model has flagged a potential indicator in the radiograph. Please note that AI analysis is a screening aid — not a clinical diagnosis. Consult a radiologist or pulmonologist for an official evaluation.`,
  normal_result: `Great news — the AI scan shows a normal radiograph pattern with no detectable pneumonia indicators. However, AI is not infallible. If you're experiencing symptoms, please consult a healthcare professional regardless of the scan result.`,
  default: `I'm PneumoAI, a medical education assistant. I can help explain pneumonia, discuss symptoms, interpret AI scan results, or guide you on next steps. For specific medical advice, always consult a qualified healthcare professional. What would you like to know?`,
};

// ---------------------------------------------------------------
// STATE
// ---------------------------------------------------------------
const state = {
  currentFile: null,
  lastResult: null,
  scanHistory: JSON.parse(sessionStorage.getItem('pneumo_history') || '[]'),
  barChartInstance: null,
  pieChartInstance: null,
  metricsChartInstance: null,
};

// ---------------------------------------------------------------
// DOM REFS
// ---------------------------------------------------------------
const $ = (id) => document.getElementById(id);

const dom = {
  // Nav
  navItems: document.querySelectorAll('.nav-item'),
  panels: document.querySelectorAll('.panel'),
  // Upload
  uploadZone: $('uploadZone'),
  fileInput: $('fileInput'),
  previewWrap: $('previewWrap'),
  previewImg: $('previewImg'),
  fileName: $('fileName'),
  clearBtn: $('clearBtn'),
  analyzeBtn: $('analyzeBtn'),
  // States
  stateIdle: $('stateIdle'),
  stateLoading: $('stateLoading'),
  stateResult: $('stateResult'),
  // Result
  resultBadge: $('resultBadge'),
  badgeIcon: $('badgeIcon'),
  badgeLabel: $('badgeLabel'),
  riskValue: $('riskValue'),
  confValue: $('confValue'),
  confFill: $('confFill'),
  interpText: $('interpText'),
  inferenceTime: $('inferenceTime'),
  resultTimestamp: $('resultTimestamp'),
  downloadBtn: $('downloadBtn'),
  // Steps
  step1: $('step1'),
  step2: $('step2'),
  step3: $('step3'),
  // Metrics
  metricAccuracy: $('metricAccuracy'),
  metricPrecision: $('metricPrecision'),
  metricRecall: $('metricRecall'),
  metricF1: $('metricF1'),
  barAccuracy: $('barAccuracy'),
  barPrecision: $('barPrecision'),
  barRecall: $('barRecall'),
  barF1: $('barF1'),
  // Chat
  chatMessages: $('chatMessages'),
  chatInput: $('chatInput'),
  sendBtn: $('sendBtn'),
  clearChat: $('clearChat'),
  // History
  historyList: $('historyList'),
  historyEmpty: $('historyEmpty'),
  clearHistoryBtn: $('clearHistoryBtn'),
  // Theme
  themeToggle: $('themeToggle'),
};

// ---------------------------------------------------------------
// THEME
// ---------------------------------------------------------------
function initTheme() {
  const saved = localStorage.getItem('pneumo_theme') || 'dark';
  document.documentElement.dataset.theme = saved;
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('pneumo_theme', next);
  if (state.metricsChartInstance) renderMetricsChart(state.lastMetrics);
}

// ---------------------------------------------------------------
// NAVIGATION
// ---------------------------------------------------------------
function initNav() {
  dom.navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const panelId = item.dataset.panel;
      dom.navItems.forEach((n) => n.classList.remove('active'));
      item.classList.add('active');
      dom.panels.forEach((p) => p.classList.remove('active'));
      document.getElementById(`panel-${panelId}`).classList.add('active');
      if (panelId === 'metrics') fetchMetrics();
      if (panelId === 'history') renderHistory();
    });
  });
}

// ---------------------------------------------------------------
// UPLOAD
// ---------------------------------------------------------------
function initUpload() {
  // Patient info validation listeners
  const patientName = document.getElementById('patientName');
  const patientAge = document.getElementById('patientAge');
  const patientSex = document.getElementById('patientSex');
  
  [patientName, patientAge, patientSex].forEach(field => {
    if (field) {
      field.addEventListener('input', updateAnalyzeButtonState);
      field.addEventListener('change', updateAnalyzeButtonState);
    }
  });

  // Drag & drop
  dom.uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.uploadZone.classList.add('drag-over');
  });
  dom.uploadZone.addEventListener('dragleave', () => {
    dom.uploadZone.classList.remove('drag-over');
  });
  dom.uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  });

  dom.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  dom.clearBtn.addEventListener('click', clearFile);
  dom.analyzeBtn.addEventListener('click', runAnalysis);
}

function handleFile(file) {
  state.currentFile = file;
  const url = URL.createObjectURL(file);
  dom.previewImg.src = url;
  dom.fileName.textContent = file.name.length > 28 ? file.name.slice(0, 25) + '…' : file.name;
  dom.previewWrap.classList.remove('hidden');
  dom.uploadZone.style.display = 'none';
  updateAnalyzeButtonState();
  showState('idle');
}

function clearFile() {
  state.currentFile = null;
  dom.previewImg.src = '';
  dom.previewWrap.classList.add('hidden');
  dom.uploadZone.style.display = '';
  updateAnalyzeButtonState();
  dom.fileInput.value = '';
  showState('idle');
}

// ---------------------------------------------------------------
// PATIENT VALIDATION
// ---------------------------------------------------------------
function validatePatientInfo() {
  const name = document.getElementById('patientName').value.trim();
  const age = document.getElementById('patientAge').value.trim();
  const sex = document.getElementById('patientSex').value.trim();
  
  if (!name) return { valid: false, error: 'Patient Full Name is required.' };
  if (!age) return { valid: false, error: 'Patient Age is required.' };
  if (!sex) return { valid: false, error: 'Patient Sex is required.' };
  if (age < 0 || age > 120) return { valid: false, error: 'Age must be between 0 and 120.' };
  
  return { valid: true };
}

function updateAnalyzeButtonState() {
  const hasFile = state.currentFile !== null;
  const validation = validatePatientInfo();
  const canAnalyze = hasFile && validation.valid;
  
  dom.analyzeBtn.disabled = !canAnalyze;
  
  if (!canAnalyze && hasFile && !validation.valid) {
    dom.analyzeBtn.title = validation.error;
  } else if (!hasFile) {
    dom.analyzeBtn.title = 'Please upload an X-ray image first';
  } else {
    dom.analyzeBtn.title = 'Click to analyze X-ray';
  }
}

// ---------------------------------------------------------------
// RESULT STATES
// ---------------------------------------------------------------
function showState(name) {
  dom.stateIdle.classList.add('hidden');
  dom.stateLoading.classList.add('hidden');
  dom.stateResult.classList.add('hidden');
  if (name === 'idle') dom.stateIdle.classList.remove('hidden');
  if (name === 'loading') dom.stateLoading.classList.remove('hidden');
  if (name === 'result') dom.stateResult.classList.remove('hidden');
}

// ---------------------------------------------------------------
// LOADING ANIMATION
// ---------------------------------------------------------------
async function animateLoadingSteps() {
  const steps = [dom.step1, dom.step2, dom.step3];
  steps.forEach((s) => s.classList.remove('active', 'done'));

  for (const step of steps) {
    step.classList.add('active');
    await delay(600);
    step.classList.remove('active');
    step.classList.add('done');
  }
}

// ---------------------------------------------------------------
// PREDICT
// ---------------------------------------------------------------
async function runAnalysis() {
  if (!state.currentFile) return;

  const validation = validatePatientInfo();
  if (!validation.valid) {
    alert('❌ Patient Information Required\n\n' + validation.error + '\n\nPlease enter Full Name, Age, and Sex before proceeding.');
    return;
  }

  showState('loading');
  dom.analyzeBtn.disabled = true;
  dom.resultTimestamp.textContent = '…';

  const stepPromise = animateLoadingSteps();
  const t0 = performance.now();

  const formData = new FormData();
  formData.append('file', state.currentFile);

  try {
    const res = await fetch(`${API_BASE}/predict`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const elapsed = ((performance.now() - t0) / 1000).toFixed(2);

    await stepPromise;
    await delay(300);

    state.lastResult = { ...data, elapsed, fileName: state.currentFile.name };
    renderResult(data, elapsed);
    addToHistory(data, elapsed);
  } catch (err) {
    await stepPromise;
    showState('idle');
    dom.interpText.textContent = `Error: ${err.message}. Ensure the Flask backend is running on ${API_BASE}.`;
    showState('result');
    dom.badgeLabel.textContent = 'Error';
    dom.badgeIcon.textContent = '⚠️';
    dom.resultBadge.className = 'result-badge';
  } finally {
    updateAnalyzeButtonState();
  }
}

function renderResult(data, elapsed) {
  const isPneumonia = data.result === 'PNEUMONIA';
  const conf = Math.round(data.confidence * 100);
  const risk = data.risk_level || (isPneumonia ? 'High' : 'Low');

  // Badge
  dom.resultBadge.className = `result-badge ${isPneumonia ? 'pneumonia' : 'normal'}`;
  dom.badgeIcon.textContent = isPneumonia ? '🔴' : '🟢';
  dom.badgeLabel.textContent = isPneumonia ? 'Pneumonia' : 'Normal';
  dom.badgeLabel.style.color = isPneumonia ? 'var(--danger)' : 'var(--success)';

  // Risk
  dom.riskValue.textContent = risk;
  const riskColor = risk === 'High' ? 'var(--danger)' : (risk === 'Medium' ? 'var(--warning)' : 'var(--success)');
  dom.riskValue.style.color = riskColor;

  // Confidence bar
  dom.confValue.textContent = `${conf}%`;
  dom.confValue.style.color = isPneumonia ? 'var(--danger)' : 'var(--success)';
  dom.confFill.className = `conf-fill${isPneumonia ? ' danger' : ''}`;

  requestAnimationFrame(() => {
    setTimeout(() => { dom.confFill.style.width = `${conf}%`; }, 80);
  });

  // Interpretation
  if (isPneumonia) {
    dom.interpText.textContent = `The AI model detected radiographic patterns consistent with pneumonia in the uploaded chest X-ray with ${conf}% confidence. The risk level is classified as ${risk}. Areas of increased opacity or consolidation may be present. This is an AI-assisted finding — please seek immediate medical evaluation for confirmation and appropriate treatment.`;
  } else {
    dom.interpText.textContent = `The AI model found no significant radiographic indicators of pneumonia in this chest X-ray (${conf}% normal confidence). The lung fields appear clear. If you are experiencing respiratory symptoms despite this result, please consult a physician — imaging alone may not capture all pathologies.`;
  }

  // Meta
  dom.inferenceTime.textContent = `${elapsed}s`;
  dom.resultTimestamp.textContent = new Date().toLocaleTimeString();

  showState('result');

  // Charts
  destroyCharts();
  setTimeout(() => renderMiniCharts(conf, isPneumonia), 200);
}

// ---------------------------------------------------------------
// CHARTS
// ---------------------------------------------------------------
function destroyCharts() {
  if (state.barChartInstance) { state.barChartInstance.destroy(); state.barChartInstance = null; }
  if (state.pieChartInstance) { state.pieChartInstance.destroy(); state.pieChartInstance = null; }
}

function getChartDefaults() {
  const isDark = document.documentElement.dataset.theme !== 'light';
  return {
    gridColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    textColor: isDark ? '#8a9bb5' : '#475569',
  };
}

function renderMiniCharts(conf, isPneumonia) {
  const { gridColor, textColor } = getChartDefaults();
  const normalConf = isPneumonia ? (100 - conf) : conf;
  const pneumoConf = isPneumonia ? conf : (100 - conf);

  // Bar chart
  const barCtx = $('barChart').getContext('2d');
  state.barChartInstance = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Normal', 'Pneumonia'],
      datasets: [{
        data: [normalConf, pneumoConf],
        backgroundColor: ['rgba(52,216,160,0.7)', 'rgba(255,94,94,0.7)'],
        borderColor: ['rgba(52,216,160,1)', 'rgba(255,94,94,1)'],
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, font: { size: 9 } }, grid: { color: gridColor } },
        y: { max: 100, ticks: { color: textColor, font: { size: 9 }, callback: (v) => v + '%' }, grid: { color: gridColor } },
      },
    },
  });

  // Pie chart
  const pieCtx = $('pieChart').getContext('2d');
  state.pieChartInstance = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['Normal', 'Pneumonia'],
      datasets: [{
        data: [normalConf, pneumoConf],
        backgroundColor: ['rgba(52,216,160,0.8)', 'rgba(255,94,94,0.8)'],
        borderColor: ['rgba(52,216,160,1)', 'rgba(255,94,94,1)'],
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}%` } },
      },
    },
  });
}

function renderMetricsChart(metrics) {
  if (!metrics) return;
  state.lastMetrics = metrics;

  if (state.metricsChartInstance) { state.metricsChartInstance.destroy(); state.metricsChartInstance = null; }

  const { gridColor, textColor } = getChartDefaults();
  const vals = [
    Number.parseFloat(metrics.accuracy) * 100,
    Number.parseFloat(metrics.precision) * 100,
    Number.parseFloat(metrics.recall) * 100,
    Number.parseFloat(metrics.f1) * 100,
  ];

  const ctx = $('metricsBarChart').getContext('2d');
  state.metricsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
      datasets: [{
        label: 'Score (%)',
        data: vals,
        backgroundColor: [
          'rgba(61,155,255,0.7)',
          'rgba(52,216,160,0.7)',
          'rgba(244,166,35,0.7)',
          'rgba(139,92,246,0.7)',
        ],
        borderColor: [
          'rgba(61,155,255,1)',
          'rgba(52,216,160,1)',
          'rgba(244,166,35,1)',
          'rgba(139,92,246,1)',
        ],
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw.toFixed(1)}%` } },
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: {
          min: 70, max: 100,
          ticks: { color: textColor, callback: (v) => v + '%' },
          grid: { color: gridColor },
        },
      },
    },
  });
}

// ---------------------------------------------------------------
// METRICS
// ---------------------------------------------------------------
async function fetchMetrics() {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    state.lastMetrics = data;

    const fmt = (v) => (Number.parseFloat(v) * 100).toFixed(1) + '%';
    const pct = (v) => Number.parseFloat(v) * 100;

    dom.metricAccuracy.textContent = fmt(data.accuracy);
    dom.metricPrecision.textContent = fmt(data.precision);
    dom.metricRecall.textContent = fmt(data.recall);
    dom.metricF1.textContent = fmt(data.f1);

    setTimeout(() => {
      dom.barAccuracy.style.width = pct(data.accuracy) + '%';
      dom.barPrecision.style.width = pct(data.precision) + '%';
      dom.barRecall.style.width = pct(data.recall) + '%';
      dom.barF1.style.width = pct(data.f1) + '%';
    }, 100);

    renderMetricsChart(data);
    
    if (data.confusion_matrix) {
      renderConfusionMatrixHeatmap(data.confusion_matrix);
    }
  } catch (err) {
    console.error('Error loading metrics:', err);
    dom.metricAccuracy.textContent = 'N/A';
    dom.metricPrecision.textContent = 'N/A';
    dom.metricRecall.textContent = 'N/A';
    dom.metricF1.textContent = 'N/A';
  }
}

// ---------------------------------------------------------------
// CONFUSION MATRIX HEATMAP
// ---------------------------------------------------------------
function renderConfusionMatrixHeatmap(cmData) {
  const canvas = document.getElementById('confusionMatrixCanvas');
  if (!canvas) return;
  
  const matrix = cmData.matrix;
  const labels = cmData.labels || ['Normal', 'Pneumonia'];
  const ctx = canvas.getContext('2d');
  
  // Dimensions
  const cellSize = 140;
  const padding = 100;
  const colorBarWidth = 50;
  const titleHeight = 40;
  const margin = 30;
  
  canvas.width = padding + matrix[0].length * cellSize + colorBarWidth + margin;
  canvas.height = titleHeight + padding + matrix.length * cellSize + margin;
  
  // Find max for color scaling
  let maxVal = 0;
  matrix.forEach(row => row.forEach(val => { if (val > maxVal) maxVal = val; }));
  
  // Color function: light blue to dark blue
  const getColor = (value) => {
    const ratio = value / maxVal;
    // Interpolate from light blue to dark blue
    const hue = 210; // blue hue
    const lightness = 80 - (ratio * 60); // 80% to 20%
    return `hsl(${hue}, 70%, ${lightness}%)`;
  };
  
  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Title
  ctx.font = 'bold 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText('Confusion Matrix', canvas.width / 2, 25);
  
  // Cell drawing
  const startX = padding;
  const startY = titleHeight + padding;
  
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const x = startX + j * cellSize;
      const y = startY + i * cellSize;
      const value = matrix[i][j];
      
      // Cell background
      ctx.fillStyle = getColor(value);
      ctx.fillRect(x, y, cellSize, cellSize);
      
      // Cell border
      ctx.strokeStyle = '#e0e7ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellSize, cellSize);
      
      // Value text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 48px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value, x + cellSize / 2, y + cellSize / 2);
    }
  }
  
  // Row labels (Actual)
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 14px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < labels.length; i++) {
    const y = startY + i * cellSize + cellSize / 2;
    ctx.fillText(labels[i], padding - 20, y);
  }
  
  // Y-axis label
  ctx.save();
  ctx.translate(25, startY + (matrix.length * cellSize) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Actual', 0, 0);
  ctx.restore();
  
  // Column labels (Predicted)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let j = 0; j < labels.length; j++) {
    const x = startX + j * cellSize + cellSize / 2;
    ctx.fillText(labels[j], x, titleHeight + padding - 30);
  }
  
  // X-axis label
  ctx.textAlign = 'center';
  ctx.fillText('Predicted', startX + (matrix[0].length * cellSize) / 2, titleHeight + padding - 5);
  
  // Colorbar
  const colorBarX = startX + matrix[0].length * cellSize + 25;
  const colorBarHeight = matrix.length * cellSize;
  const colorBarSteps = 100;
  
  for (let i = 0; i < colorBarSteps; i++) {
    const ratio = 1 - (i / colorBarSteps);
    const value = maxVal * ratio;
    ctx.fillStyle = getColor(value);
    ctx.fillRect(colorBarX, startY + (i / colorBarSteps) * colorBarHeight, colorBarWidth - 15, colorBarHeight / colorBarSteps);
  }
  
  // Colorbar border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(colorBarX, startY, colorBarWidth - 15, colorBarHeight);
  
  // Colorbar labels
  ctx.fillStyle = '#475569';
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(maxVal.toString(), colorBarX + colorBarWidth, startY - 5);
  ctx.fillText('0', colorBarX + colorBarWidth, startY + colorBarHeight + 8);
}

// ---------------------------------------------------------------
// HISTORY
// ---------------------------------------------------------------
function addToHistory(data, elapsed) {
  const entry = {
    id: Date.now(),
    result: data.result,
    confidence: data.confidence,
    risk: data.risk_level,
    elapsed,
    fileName: state.currentFile?.name || 'scan.png',
    timestamp: new Date().toISOString(),
  };
  state.scanHistory.unshift(entry);
  sessionStorage.setItem('pneumo_history', JSON.stringify(state.scanHistory));
}

function renderHistory() {
  const list = dom.historyList;
  // Remove old items except the empty state
  [...list.querySelectorAll('.history-item')].forEach((el) => el.remove());

  if (state.scanHistory.length === 0) {
    dom.historyEmpty.classList.remove('hidden');
    return;
  }
  dom.historyEmpty.classList.add('hidden');

  state.scanHistory.forEach((entry) => {
    const isPneu = entry.result === 'PNEUMONIA';
    const conf = Math.round(entry.confidence * 100);
    const date = new Date(entry.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-badge ${isPneu ? 'pneumonia' : 'normal'}">${isPneu ? '🔴' : '🟢'}</div>
      <div class="history-info">
        <div class="history-result ${isPneu ? 'pneumonia' : 'normal'}">${entry.result}</div>
        <div class="history-meta">${entry.fileName} · ${dateStr} ${timeStr} · ${entry.elapsed}s · Risk: ${entry.risk}</div>
      </div>
      <div class="history-conf">${conf}%</div>
    `;
    list.insertBefore(item, dom.historyEmpty);
  });
}

// ---------------------------------------------------------------
// CHAT
// ---------------------------------------------------------------
function initChat() {
  addBotMessage(CHAT_RESPONSES.default, false);

  dom.sendBtn.addEventListener('click', handleSend);
  dom.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  dom.clearChat.addEventListener('click', () => {
    dom.chatMessages.innerHTML = '';
    addBotMessage(CHAT_RESPONSES.default, false);
  });
}

function handleSend() {
  const msg = dom.chatInput.value.trim();
  if (!msg) return;
  dom.chatInput.value = '';
  addUserMessage(msg);
  dom.chatInput.disabled = true;
  dom.sendBtn.disabled = true;
  showTyping();
  const delay = 1000 + Math.random() * 500;
  setTimeout(() => {
    removeTyping();
    addBotMessage(getBotResponse(msg));
    dom.chatInput.disabled = false;
    dom.sendBtn.disabled = false;
    dom.chatInput.focus();
  }, delay);
}

globalThis.sendQuick = function (msg) {
  dom.chatInput.value = msg;
  handleSend();
};

function getBotResponse(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes('pneumonia') && (lower.includes('what') || lower.includes('is'))) return CHAT_RESPONSES.pneumonia;
  if (lower.includes('serious') || lower.includes('dangerous') || lower.includes('fatal') || lower.includes('bad')) return CHAT_RESPONSES.serious;
  if (lower.includes('what should') || lower.includes('do now') || lower.includes('next step') || lower.includes('treatment')) return CHAT_RESPONSES.todo;
  if (lower.includes('symptom') || lower.includes('sign') || lower.includes('feel')) return CHAT_RESPONSES.symptoms;
  if (lower.includes('result') || lower.includes('scan') || lower.includes('my') || lower.includes('analysis')) {
    if (state.lastResult) {
      const isPneu = state.lastResult.result === 'PNEUMONIA';
      return isPneu ? CHAT_RESPONSES.result : CHAT_RESPONSES.normal_result;
    }
    return "I don't see a completed scan yet. Please run an X-ray analysis in the Scan panel first, then come back and I can discuss your results.";
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) return "Hello! I'm PneumoAI, your medical AI assistant. Feel free to ask me about pneumonia, symptoms, treatment, or your scan results. How can I help?";
  if (lower.includes('thank')) return "You're welcome! Stay healthy and remember — always consult a licensed healthcare professional for medical decisions.";
  if (lower.includes('accuracy') || lower.includes('how good') || lower.includes('reliable')) return "Our CNN model achieves approximately 92% accuracy on the validation dataset. However, AI tools are screening aids — not replacements for professional radiological review. Always confirm AI findings with a qualified clinician.";
  if (lower.includes('covid') || lower.includes('corona')) return "COVID-19 pneumonia presents similarly on X-ray to bacterial/viral pneumonia. Both can show ground-glass opacities and consolidation. This model was trained for general pneumonia detection — not specifically COVID-19. A PCR test and clinical evaluation are required for COVID diagnosis.";
  if (lower.includes('chest') || lower.includes('lung') || lower.includes('x-ray') || lower.includes('xray')) return "Chest X-rays are a primary imaging tool for evaluating lung conditions. They can reveal pneumonia, pleural effusion, cardiomegaly, and other pathologies. Our AI model analyzes PA/AP view radiographs to detect pneumonia-consistent patterns.";
  return CHAT_RESPONSES.default;
}

function addUserMessage(text) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el = document.createElement('div');
  el.className = 'chat-msg user';
  el.innerHTML = `
    <div class="msg-bubble">
      ${escapeHtml(text)}
      <div class="msg-time">${time}</div>
    </div>
    <div class="msg-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>
  `;
  dom.chatMessages.appendChild(el);
  scrollChat();
}

function addBotMessage(text, animate = true) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el = document.createElement('div');
  el.className = 'chat-msg';
  el.innerHTML = `
    <div class="msg-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 16v-4M12 8h.01"/></svg>
    </div>
    <div class="msg-bubble">
      ${formatBotText(text)}
      <div class="msg-time">${time}</div>
    </div>
  `;
  dom.chatMessages.appendChild(el);
  scrollChat();
}

let typingEl = null;
function showTyping() {
  typingEl = document.createElement('div');
  typingEl.className = 'chat-msg';
  typingEl.id = 'typingIndicator';
  typingEl.innerHTML = `
    <div class="msg-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 16v-4M12 8h.01"/></svg>
    </div>
    <div class="msg-bubble typing" style="min-width:60px;">
      <span style="display:inline-flex;gap:4px;align-items:center;">
        <span style="width:6px;height:6px;border-radius:50%;background:var(--text-3);animation:pulse 1.2s ease infinite;animation-delay:0s"></span>
        <span style="width:6px;height:6px;border-radius:50%;background:var(--text-3);animation:pulse 1.2s ease infinite;animation-delay:0.2s"></span>
        <span style="width:6px;height:6px;border-radius:50%;background:var(--text-3);animation:pulse 1.2s ease infinite;animation-delay:0.4s"></span>
      </span>
    </div>
  `;
  dom.chatMessages.appendChild(typingEl);
  scrollChat();
}

function removeTyping() {
  if (typingEl) { typingEl.remove(); typingEl = null; }
}

function scrollChat() {
  setTimeout(() => { dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight; }, 50);
}

function formatBotText(text) {
  return escapeHtml(text)
    .replaceAll('\n•', '<br>•')
    .replaceAll(/\n(\d+\.)/g, '<br>$1')
    .replaceAll('\n', '<br>');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ---------------------------------------------------------------
// DOWNLOAD REPORT
// ---------------------------------------------------------------
function downloadReport() {
  if (!state.lastResult) return;
  const r = state.lastResult;
  const conf = Math.round(r.confidence * 100);
  const now = new Date().toLocaleString();
  const content = [
    '═══════════════════════════════════════════════',
    '           PNEUMOSCAN AI — DIAGNOSTIC REPORT   ',
    '═══════════════════════════════════════════════',
    '',
    `Generated: ${now}`,
    `File: ${r.fileName || 'N/A'}`,
    '',
    '───────────────────────────────────────────────',
    'RESULT SUMMARY',
    '───────────────────────────────────────────────',
    `Diagnosis:      ${r.result}`,
    `Confidence:     ${conf}%`,
    `Risk Level:     ${r.risk_level}`,
    `Inference Time: ${r.elapsed}s`,
    '',
    '───────────────────────────────────────────────',
    'AI INTERPRETATION',
    '───────────────────────────────────────────────',
    r.result === 'PNEUMONIA'
      ? `The AI model detected radiographic patterns consistent with pneumonia (${conf}% confidence). Risk level: ${r.risk_level}. Immediate medical evaluation recommended.`
      : `No significant pneumonia indicators detected (${conf}% normal confidence). Lung fields appear clear per AI analysis.`,
    '',
    '───────────────────────────────────────────────',
    'DISCLAIMER',
    '───────────────────────────────────────────────',
    'This report is generated by an AI model for research and educational',
    'purposes ONLY. It is not a clinical diagnosis and should not be used',
    'as the sole basis for medical decisions. Always consult a licensed',
    'radiologist or physician for official evaluation.',
    '',
    '═══════════════════════════════════════════════',
    '   PneumoScan AI v2.4 | CNN Pneumonia Detector ',
    '═══════════════════════════════════════════════',
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PneumoScan_Report_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ---------------------------------------------------------------
// INIT
// ---------------------------------------------------------------
function init() {
  initTheme();
  initNav();
  initUpload();
  initChat();

  dom.themeToggle.addEventListener('click', toggleTheme);
  dom.downloadBtn.addEventListener('click', downloadReport);

  $('refreshMetrics').addEventListener('click', fetchMetrics);
  $('clearHistoryBtn').addEventListener('click', () => {
    state.scanHistory = [];
    sessionStorage.removeItem('pneumo_history');
    renderHistory();
  });

  // Render history on init in case there's session data
  if (document.getElementById('panel-history').classList.contains('active')) renderHistory();
}

document.addEventListener('DOMContentLoaded', init);