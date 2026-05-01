const STORAGE_KEYS = {
  exercises: "muscleMemory.exercises",
  records: "muscleMemory.records",
};

const defaultExercises = [
  { id: "bench-press", name: "ベンチプレス", category: "胸・プッシュ" },
  { id: "push-up", name: "腕立て伏せ", category: "胸・プッシュ" },
  { id: "squat", name: "スクワット", category: "脚" },
  { id: "leg-press", name: "レッグプレス", category: "脚" },
  { id: "deadlift", name: "デッドリフト", category: "背中・プル" },
  { id: "lat-pulldown", name: "ラットプルダウン", category: "背中・プル" },
  { id: "pull-up", name: "懸垂", category: "背中・プル" },
  { id: "shoulder-press", name: "ショルダープレス", category: "肩・腕" },
  { id: "dumbbell-curl", name: "ダンベルカール", category: "肩・腕" },
  { id: "plank", name: "プランク", category: "自重・体幹" },
];

const categoryOrder = ["胸・プッシュ", "脚", "背中・プル", "肩・腕", "自重・体幹", "その他"];

const elements = {
  recordForm: document.querySelector("#recordForm"),
  exerciseForm: document.querySelector("#exerciseForm"),
  exerciseSelect: document.querySelector("#exerciseSelect"),
  filterSelect: document.querySelector("#filterSelect"),
  analysisExerciseSelect: document.querySelector("#analysisExerciseSelect"),
  dateInput: document.querySelector("#dateInput"),
  weightInput: document.querySelector("#weightInput"),
  repsInput: document.querySelector("#repsInput"),
  setsInput: document.querySelector("#setsInput"),
  noteInput: document.querySelector("#noteInput"),
  newExerciseName: document.querySelector("#newExerciseName"),
  newExerciseCategory: document.querySelector("#newExerciseCategory"),
  exerciseChips: document.querySelector("#exerciseChips"),
  summaryCards: document.querySelector("#summaryCards"),
  recordsList: document.querySelector("#recordsList"),
  recordTemplate: document.querySelector("#recordTemplate"),
  entryTitle: document.querySelector("#entryTitle"),
  saveRecordButton: document.querySelector("#saveRecordButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  totalRecords: document.querySelector("#totalRecords"),
  weeklyVolume: document.querySelector("#weeklyVolume"),
  trendBadge: document.querySelector("#trendBadge"),
  weightChart: document.querySelector("#weightChart"),
  repsChart: document.querySelector("#repsChart"),
  insightList: document.querySelector("#insightList"),
  tabButtons: document.querySelectorAll(".tab-button"),
  viewPanels: document.querySelectorAll("[data-view-panel]"),
};

let exercises = loadFromStorage(STORAGE_KEYS.exercises, defaultExercises);
let records = loadFromStorage(STORAGE_KEYS.records, []);
let editingRecordId = null;

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEYS.exercises, JSON.stringify(exercises));
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayString() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getExerciseName(id) {
  return exercises.find((exercise) => exercise.id === id)?.name || "不明なメニュー";
}

function getVolume(record) {
  const weight = Number(record.weight) || 0;
  const reps = Number(record.reps) || 0;
  const sets = Number(record.sets) || 0;
  return weight > 0 ? weight * reps * sets : reps * sets;
}

function getExerciseRecords(exerciseId) {
  return records
    .filter((record) => record.exerciseId === exerciseId)
    .sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      return dateDiff || a.createdAt - b.createdAt;
    });
}

function formatNumber(value) {
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(value);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function sortedExercises() {
  return [...exercises].sort((a, b) => {
    const categoryDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    return categoryDiff || a.name.localeCompare(b.name, "ja");
  });
}

function groupedExercises() {
  return sortedExercises().reduce((groups, exercise) => {
    if (!groups[exercise.category]) groups[exercise.category] = [];
    groups[exercise.category].push(exercise);
    return groups;
  }, {});
}

function renderExerciseOptions() {
  const selectedExercise = elements.exerciseSelect.value;
  const selectedFilter = elements.filterSelect.value || "all";
  const selectedAnalysis = elements.analysisExerciseSelect.value;
  const groups = groupedExercises();

  elements.exerciseSelect.innerHTML = "";
  elements.filterSelect.innerHTML = '<option value="all">すべて</option>';
  elements.analysisExerciseSelect.innerHTML = "";

  categoryOrder.forEach((category) => {
    const group = groups[category];
    if (!group?.length) return;

    const optgroup = document.createElement("optgroup");
    optgroup.label = category;

    group.forEach((exercise) => {
      const option = document.createElement("option");
      option.value = exercise.id;
      option.textContent = exercise.name;
      optgroup.append(option);

      const filterOption = document.createElement("option");
      filterOption.value = exercise.id;
      filterOption.textContent = exercise.name;
      elements.filterSelect.append(filterOption);

      const analysisOption = document.createElement("option");
      analysisOption.value = exercise.id;
      analysisOption.textContent = exercise.name;
      elements.analysisExerciseSelect.append(analysisOption);
    });

    elements.exerciseSelect.append(optgroup);
  });

  if (exercises.some((exercise) => exercise.id === selectedExercise)) {
    elements.exerciseSelect.value = selectedExercise;
  }

  elements.filterSelect.value = exercises.some((exercise) => exercise.id === selectedFilter)
    ? selectedFilter
    : "all";

  const fallbackExercise =
    records.find((record) => exercises.some((exercise) => exercise.id === record.exerciseId))?.exerciseId ||
    exercises[0]?.id;
  elements.analysisExerciseSelect.value = exercises.some((exercise) => exercise.id === selectedAnalysis)
    ? selectedAnalysis
    : fallbackExercise;
}

function renderExerciseChips() {
  elements.exerciseChips.innerHTML = "";
  sortedExercises().forEach((exercise) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `${exercise.name} / ${exercise.category}`;
    elements.exerciseChips.append(chip);
  });
}

function renderSummary() {
  elements.summaryCards.innerHTML = "";
  elements.totalRecords.textContent = String(records.length);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyVolume = records
    .filter((record) => new Date(`${record.date}T00:00:00`) >= sevenDaysAgo)
    .reduce((sum, record) => sum + getVolume(record), 0);

  elements.weeklyVolume.textContent = formatNumber(weeklyVolume);

  const summaries = exercises
    .map((exercise) => {
      const exerciseRecords = records
        .filter((record) => record.exerciseId === exercise.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (!exerciseRecords.length) return null;

      const maxWeight = Math.max(...exerciseRecords.map((record) => Number(record.weight) || 0));
      const totalVolume = exerciseRecords.reduce((sum, record) => sum + getVolume(record), 0);
      const latest = exerciseRecords[0];

      return { exercise, maxWeight, totalVolume, latest };
    })
    .filter(Boolean)
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 6);

  if (!summaries.length) {
    elements.summaryCards.innerHTML =
      '<div class="empty-state">最初の記録を保存すると、ここに進捗が表示されます。</div>';
    return;
  }

  summaries.forEach(({ exercise, maxWeight, totalVolume, latest }) => {
    const card = document.createElement("article");
    card.className = "summary-card";
    card.innerHTML = `
      <strong>${exercise.name}</strong>
      <dl>
        <div><dt>最高重量</dt><dd>${maxWeight > 0 ? `${formatNumber(maxWeight)}kg` : "自重"}</dd></div>
        <div><dt>合計ボリューム</dt><dd>${formatNumber(totalVolume)}</dd></div>
        <div><dt>直近</dt><dd>${formatDate(latest.date)}</dd></div>
      </dl>
    `;
    elements.summaryCards.append(card);
  });
}

function getTrend(recordsForExercise, key) {
  if (recordsForExercise.length < 4) {
    return { state: "neutral", label: "記録を蓄積中", percent: 0 };
  }

  const recent = recordsForExercise.slice(-3);
  const previous = recordsForExercise.slice(-6, -3);
  if (previous.length < 2) {
    return { state: "neutral", label: "記録を蓄積中", percent: 0 };
  }

  const average = (items) => items.reduce((sum, record) => sum + Number(record[key] || 0), 0) / items.length;
  const previousAverage = average(previous);
  const recentAverage = average(recent);
  const percent = previousAverage > 0 ? ((recentAverage - previousAverage) / previousAverage) * 100 : 0;

  if (percent >= 3) return { state: "growth", label: "成長中", percent };
  if (percent <= -3) return { state: "down", label: "落ち気味", percent };
  return { state: "stall", label: "停滞気味", percent };
}

function buildChart(container, points, options) {
  const { color, emptyText, unit } = options;
  container.innerHTML = "";

  if (!points.length) {
    container.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }

  const width = 760;
  const height = 300;
  const padding = { top: 26, right: 24, bottom: 46, left: 54 };
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const yMin = Math.max(0, minValue - range * 0.18);
  const yMax = maxValue + range * 0.18;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index) =>
    padding.left + (points.length === 1 ? chartWidth / 2 : (chartWidth / (points.length - 1)) * index);
  const getY = (value) => padding.top + chartHeight - ((value - yMin) / (yMax - yMin || 1)) * chartHeight;
  const coordinates = points.map((point, index) => ({ ...point, x: getX(index), y: getY(point.value) }));
  const path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${path} L ${coordinates.at(-1).x} ${padding.top + chartHeight} L ${coordinates[0].x} ${
    padding.top + chartHeight
  } Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const y = padding.top + chartHeight * ratio;
      const value = yMax - (yMax - yMin) * ratio;
      return `
        <line class="chart-grid" x1="${padding.left}" x2="${width - padding.right}" y1="${y}" y2="${y}" />
        <text class="chart-label" x="14" y="${y + 4}">${formatNumber(value)}</text>
      `;
    })
    .join("");
  const xLabels = coordinates
    .filter((_, index) => index === 0 || index === coordinates.length - 1 || coordinates.length <= 4)
    .map(
      (point) =>
        `<text class="chart-label" x="${point.x}" y="${height - 16}" text-anchor="middle">${point.shortDate}</text>`,
    )
    .join("");
  const dots = coordinates
    .map(
      (point) => `
        <circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="6" fill="${color}" />
        <text class="chart-value" x="${point.x}" y="${point.y - 12}" text-anchor="middle">${formatNumber(
          point.value,
        )}${unit}</text>
      `,
    )
    .join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      ${gridLines}
      <line class="chart-axis" x1="${padding.left}" x2="${padding.left}" y1="${padding.top}" y2="${padding.top + chartHeight}" />
      <line class="chart-axis" x1="${padding.left}" x2="${width - padding.right}" y1="${padding.top + chartHeight}" y2="${padding.top + chartHeight}" />
      <path class="chart-area" d="${areaPath}" fill="${color}" />
      <path class="chart-line" d="${path}" stroke="${color}" />
      ${dots}
      ${xLabels}
    </svg>
  `;
}

function renderAnalysis() {
  const exerciseId = elements.analysisExerciseSelect.value;
  const exercise = exercises.find((item) => item.id === exerciseId);
  const recordsForExercise = getExerciseRecords(exerciseId);

  elements.trendBadge.className = "trend-badge";

  if (!exercise || !recordsForExercise.length) {
    elements.trendBadge.textContent = "記録待ち";
    elements.weightChart.innerHTML = '<div class="empty-state">このメニューの記録がまだありません。</div>';
    elements.repsChart.innerHTML = '<div class="empty-state">記録を追加すると回数の推移が表示されます。</div>';
    elements.insightList.innerHTML = '<div class="insight-item">記録画面でトレーニングを保存すると、ここに分析が表示されます。</div>';
    return;
  }

  const maxWeight = Math.max(...recordsForExercise.map((record) => Number(record.weight) || 0));
  const maxReps = Math.max(...recordsForExercise.map((record) => Number(record.reps) || 0));
  const totalVolume = recordsForExercise.reduce((sum, record) => sum + getVolume(record), 0);
  const latest = recordsForExercise.at(-1);
  const weightTrend = getTrend(recordsForExercise, "weight");
  const repsTrend = getTrend(recordsForExercise, "reps");
  const primaryTrend = maxWeight > 0 ? weightTrend : repsTrend;

  elements.trendBadge.classList.add(primaryTrend.state);
  elements.trendBadge.textContent = `${primaryTrend.label} ${primaryTrend.percent >= 0 ? "+" : ""}${formatNumber(
    primaryTrend.percent,
  )}%`;

  const dateFormatter = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" });
  const weightPoints = recordsForExercise.map((record) => ({
    shortDate: dateFormatter.format(new Date(`${record.date}T00:00:00`)),
    value: Number(record.weight) || 0,
  }));
  const repsPoints = recordsForExercise.map((record) => ({
    shortDate: dateFormatter.format(new Date(`${record.date}T00:00:00`)),
    value: Number(record.reps) || 0,
  }));

  buildChart(elements.weightChart, weightPoints, {
    color: "#18d7ff",
    emptyText: "重量の記録がまだありません。",
    unit: "kg",
  });
  buildChart(elements.repsChart, repsPoints, {
    color: "#b7ff2a",
    emptyText: "回数の記録がまだありません。",
    unit: "回",
  });

  const weightInsight =
    maxWeight > 0
      ? `<strong>重量:</strong> 最高重量は ${formatNumber(maxWeight)}kg。直近3回の平均はその前と比べて ${
          weightTrend.percent >= 0 ? "+" : ""
        }${formatNumber(weightTrend.percent)}% です。`
      : "<strong>重量:</strong> 自重メニューとして記録されています。回数の伸びを主指標に見るのがよさそうです。";
  const repsInsight = `<strong>回数:</strong> 最高回数は ${formatNumber(maxReps)}回。直近3回の平均はその前と比べて ${
    repsTrend.percent >= 0 ? "+" : ""
  }${formatNumber(repsTrend.percent)}% です。`;
  const volumeInsight = `<strong>直近:</strong> ${formatDate(latest.date)} は ${formatNumber(
    latest.weight || 0,
  )}kg / ${latest.reps}回 / ${latest.sets}セット、ボリューム ${formatNumber(getVolume(latest))}。累計ボリュームは ${formatNumber(
    totalVolume,
  )} です。`;

  elements.insightList.innerHTML = [weightInsight, repsInsight, volumeInsight]
    .map((text) => `<div class="insight-item">${text}</div>`)
    .join("");
}

function switchView(viewName, updateHash = true) {
  const nextView = viewName === "analysis" ? "analysis" : "log";
  elements.tabButtons.forEach((tabButton) => {
    tabButton.classList.toggle("active", tabButton.dataset.view === nextView);
  });
  elements.viewPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === nextView);
  });
  if (nextView === "analysis") renderAnalysis();
  if (updateHash) {
    history.replaceState(null, "", nextView === "analysis" ? "#analysis" : "#log");
  }
}

function renderRecords() {
  elements.recordsList.innerHTML = "";
  const filter = elements.filterSelect.value;
  const visibleRecords = records
    .filter((record) => filter === "all" || record.exerciseId === filter)
    .sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      return dateDiff || b.createdAt - a.createdAt;
    });

  if (!visibleRecords.length) {
    elements.recordsList.innerHTML = '<div class="empty-state">まだ記録がありません。</div>';
    return;
  }

  visibleRecords.forEach((record) => {
    const node = elements.recordTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = record.id;
    node.querySelector(".record-date").textContent = formatDate(record.date);
    node.querySelector("h3").textContent = getExerciseName(record.exerciseId);
    node.querySelector(".record-note").textContent = record.note || "";

    const weightLabel = Number(record.weight) > 0 ? `${formatNumber(record.weight)}kg` : "自重 / 0kg";
    node.querySelector(".stat-row").innerHTML = `
      <span class="stat-pill">${weightLabel}</span>
      <span class="stat-pill">${record.reps} reps</span>
      <span class="stat-pill">${record.sets} sets</span>
      <span class="stat-pill">Vol ${formatNumber(getVolume(record))}</span>
    `;

    node.querySelector(".edit-record").addEventListener("click", () => startEdit(record.id));
    node.querySelector(".delete-record").addEventListener("click", () => deleteRecord(record.id));
    elements.recordsList.append(node);
  });
}

function render() {
  renderExerciseOptions();
  renderExerciseChips();
  renderSummary();
  renderRecords();
  renderAnalysis();
}

function resetRecordForm() {
  editingRecordId = null;
  elements.recordForm.reset();
  elements.dateInput.value = todayString();
  elements.weightInput.value = "0";
  elements.repsInput.value = "10";
  elements.setsInput.value = "3";
  elements.entryTitle.textContent = "記録を追加";
  elements.saveRecordButton.textContent = "記録を保存";
  elements.cancelEditButton.classList.add("hidden");
}

function startEdit(recordId) {
  const record = records.find((item) => item.id === recordId);
  if (!record) return;

  editingRecordId = recordId;
  elements.exerciseSelect.value = record.exerciseId;
  elements.dateInput.value = record.date;
  elements.weightInput.value = record.weight || "";
  elements.repsInput.value = record.reps;
  elements.setsInput.value = record.sets;
  elements.noteInput.value = record.note || "";
  elements.entryTitle.textContent = "記録を編集";
  elements.saveRecordButton.textContent = "更新する";
  elements.cancelEditButton.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteRecord(recordId) {
  records = records.filter((item) => item.id !== recordId);
  if (editingRecordId === recordId) resetRecordForm();
  saveToStorage();
  render();
}

elements.recordForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formRecord = {
    exerciseId: elements.exerciseSelect.value,
    date: elements.dateInput.value,
    weight: Number(elements.weightInput.value) || 0,
    reps: Number(elements.repsInput.value),
    sets: Number(elements.setsInput.value),
    note: elements.noteInput.value.trim(),
  };

  if (editingRecordId) {
    records = records.map((record) =>
      record.id === editingRecordId ? { ...record, ...formRecord, updatedAt: Date.now() } : record,
    );
  } else {
    records.push({
      id: makeId("record"),
      ...formRecord,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  saveToStorage();
  resetRecordForm();
  render();
});

elements.exerciseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = elements.newExerciseName.value.trim();
  const category = elements.newExerciseCategory.value;
  const alreadyExists = exercises.some((exercise) => exercise.name === name);

  if (!name || alreadyExists) {
    elements.newExerciseName.focus();
    return;
  }

  const exercise = { id: makeId("exercise"), name, category };
  exercises.push(exercise);
  saveToStorage();
  render();
  elements.exerciseSelect.value = exercise.id;
  elements.newExerciseName.value = "";
});

elements.filterSelect.addEventListener("change", renderRecords);
elements.analysisExerciseSelect.addEventListener("change", renderAnalysis);
elements.cancelEditButton.addEventListener("click", resetRecordForm);
elements.tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchView(button.dataset.view);
  });
});
window.addEventListener("hashchange", () => switchView(location.hash.replace("#", ""), false));
document.querySelectorAll("[data-adjust]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.querySelector(`#${button.dataset.adjust}`);
    const step = Number(button.dataset.step);
    const min = Number(input.min || 0);
    const fallback = input.value === "" ? min : Number(input.value);
    const nextValue = Math.max(min, fallback + step);
    input.value = Number.isInteger(nextValue) ? String(nextValue) : nextValue.toFixed(1);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
});

resetRecordForm();
render();
switchView(location.hash.replace("#", ""), false);
