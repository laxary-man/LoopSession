const sessionContainer = document.getElementById("session-container");
const addTaskBtn = document.getElementById("add-task-btn");
const addBreakBtn = document.getElementById("add-break-btn");
const taskDescInput = document.getElementById("task-desc");
const taskDurationInput = document.getElementById("task-duration");
const breakDurationInput = document.getElementById("break-duration");
const startSessionBtn = document.getElementById("start-session-btn");
const pauseSessionBtn = document.getElementById("pause-session-btn");
const resetSessionBtn = document.getElementById("reset-session-btn");
const repetitionsInput = document.getElementById("repetitions");
const currentBlockTypeSpan = document.getElementById("current-block-type");
const timeLeftSpan = document.getElementById("time-left");
// TODO: Get progress bar elements
const openConfigBtn = document.getElementById("open-config-btn");
const closeConfigBtn = document.getElementById("close-config-btn");
const configPopup = document.getElementById("config-popup");

let sessionBlocks = []; // Array to hold block objects { type: 'task'/'break', description: '...', duration: seconds }
let currentBlockIndex = -1;
let timerInterval = null;
let remainingTime = 0; // in seconds
let isPaused = false;
let currentRepetition = 1;
let totalRepetitions = 1;

// --- Block Management ---

function addBlock(type) {
  const block = { type };
  let durationMinutes;

  if (type === "task") {
    const description =
      taskDescInput.value.trim() ||
      `Task ${sessionBlocks.filter((b) => b.type === "task").length + 1}`;
    durationMinutes = parseInt(taskDurationInput.value, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      alert("유효한 Task 시간을 입력하세요.");
      return;
    }
    block.description = description;
    taskDescInput.value = ""; // Clear input
    taskDurationInput.value = ""; // Clear input
  } else {
    // break
    durationMinutes = parseInt(breakDurationInput.value, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      alert("유효한 Break 시간을 입력하세요.");
      return;
    }
    block.description = `Break`;
  }

  block.duration = durationMinutes * 60; // Store duration in seconds
  sessionBlocks.push(block);
  renderSession();
}

function removeBlock(index) {
  sessionBlocks.splice(index, 1);
  renderSession();
}

// TODO: Implement moveBlockUp(index) and moveBlockDown(index) for reordering
// TODO: Implement drag and drop reordering

function renderSession() {
  // Clear current view
  sessionContainer.innerHTML = "";

  if (sessionBlocks.length === 0) {
    sessionContainer.innerHTML =
      "<p>세션을 구성하세요. Task 또는 Break 블록을 추가할 수 있습니다.</p>";
    startSessionBtn.disabled = true;
    return;
  }

  sessionBlocks.forEach((block, index) => {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block", block.type);
    // TODO: Add draggable attribute and event listeners for drag/drop

    const descriptionSpan = document.createElement("span");
    descriptionSpan.textContent = `${block.description} (${Math.floor(
      block.duration / 60
    )}분)`;

    const controlsDiv = document.createElement("div");
    controlsDiv.classList.add("block-controls");

    // TODO: Add Up/Down buttons if not using drag/drop
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "삭제";
    removeBtn.onclick = () => removeBlock(index);

    controlsDiv.appendChild(removeBtn);
    blockElement.appendChild(descriptionSpan);
    blockElement.appendChild(controlsDiv);
    sessionContainer.appendChild(blockElement);
  });

  // Enable start button only if valid session (at least 1 task, ends with break)
  const hasTask = sessionBlocks.some((b) => b.type === "task");
  const endsWithBreak =
    sessionBlocks.length > 0 &&
    sessionBlocks[sessionBlocks.length - 1].type === "break";
  startSessionBtn.disabled = !(hasTask && endsWithBreak);
}

// --- Timer Logic ---

function startSession() {
  if (sessionBlocks.length === 0) return;
  // Validate session structure (redundant check, but good practice)
  const hasTask = sessionBlocks.some((b) => b.type === "task");
  const endsWithBreak =
    sessionBlocks.length > 0 &&
    sessionBlocks[sessionBlocks.length - 1].type === "break";
  if (!hasTask || !endsWithBreak) {
    alert("세션은 최소 1개의 Task를 포함하고 Break로 끝나야 합니다.");
    return;
  }

  totalRepetitions = parseInt(repetitionsInput.value, 10) || 1;
  currentRepetition = 1;
  currentBlockIndex = 0;
  isPaused = false;
  startBlock(currentBlockIndex);

  // Update UI state
  startSessionBtn.disabled = true;
  pauseSessionBtn.disabled = false;
  resetSessionBtn.disabled = false;
  disableEditing(true);
  // TODO: Show progress bar
}

function startBlock(index) {
  if (index >= sessionBlocks.length) {
    sessionFinished();
    return;
  }

  const block = sessionBlocks[index];
  remainingTime = block.duration;
  updateTimerDisplay();
  highlightCurrentBlock(index);
  currentBlockTypeSpan.textContent =
    block.type === "task" ? block.description : "Break";

  clearInterval(timerInterval); // Clear any existing interval
  timerInterval = setInterval(() => {
    if (isPaused) return;

    remainingTime--;
    updateTimerDisplay();

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      // TODO: Play notification sound/show popup
      // alert(`${block.description} 완료!`); // Simple alert for now
      moveToNextBlock();
    }
  }, 1000);
}

function moveToNextBlock() {
  highlightCurrentBlock(-1); // Remove highlight from finished block
  currentBlockIndex++;
  if (currentBlockIndex < sessionBlocks.length) {
    startBlock(currentBlockIndex);
  } else {
    // Current repetition finished
    if (currentRepetition < totalRepetitions) {
      currentRepetition++;
      currentBlockIndex = 0;
      // TODO: Maybe add a short pause between repetitions?
      startBlock(currentBlockIndex);
    } else {
      sessionFinished();
    }
  }
}

function sessionFinished() {
  clearInterval(timerInterval);
  alert("세션 완료!");
  resetSession();
  // TODO: Record statistics
}

function pauseSession() {
  isPaused = !isPaused;
  pauseSessionBtn.textContent = isPaused ? "계속" : "일시정지";
  // Optionally dim the timer display or show a pause indicator
}

function resetSession() {
  clearInterval(timerInterval);
  currentBlockIndex = -1;
  remainingTime = 0;
  isPaused = false;
  currentRepetition = 1;
  updateTimerDisplay();
  currentBlockTypeSpan.textContent = "대기 중";
  highlightCurrentBlock(-1); // Clear highlight

  // Update UI state
  startSessionBtn.disabled = !(
    sessionBlocks.some((b) => b.type === "task") &&
    sessionBlocks.length > 0 &&
    sessionBlocks[sessionBlocks.length - 1].type === "break"
  );
  pauseSessionBtn.disabled = true;
  pauseSessionBtn.textContent = "일시정지";
  resetSessionBtn.disabled = true;
  disableEditing(false);
  // TODO: Hide/reset progress bar
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  timeLeftSpan.textContent = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
  // TODO: Update progress bar
}

function highlightCurrentBlock(index) {
  const blockElements = sessionContainer.querySelectorAll(".block");
  blockElements.forEach((el, i) => {
    if (i === index) {
      el.style.backgroundColor = "#c0c0c0"; // Highlight color
      el.style.fontWeight = "bold";
    } else {
      el.style.backgroundColor = ""; // Reset background
      el.style.fontWeight = "normal";
    }
  });
}

function disableEditing(disabled) {
  addTaskBtn.disabled = disabled;
  addBreakBtn.disabled = disabled;
  taskDescInput.disabled = disabled;
  taskDurationInput.disabled = disabled;
  breakDurationInput.disabled = disabled;
  repetitionsInput.disabled = disabled;

  const removeButtons = sessionContainer.querySelectorAll(
    ".block-controls button"
  );
  removeButtons.forEach((btn) => (btn.disabled = disabled));
  // TODO: Disable drag/drop if implemented
}

// --- Event Listeners ---
openConfigBtn.addEventListener("click", () => {
  configPopup.classList.add("show");
  // Optional: Show backdrop if implemented
  // document.getElementById('popup-backdrop').classList.add('show');
});

closeConfigBtn.addEventListener("click", () => {
  configPopup.classList.remove("show");
  // Optional: Hide backdrop if implemented
  // document.getElementById('popup-backdrop').classList.remove('show');
});

// --- Block Management (Ensure these work within the popup context) ---
addTaskBtn.addEventListener("click", () => {
  const description = taskDescInput.value.trim();
  const duration = parseInt(taskDurationInput.value, 10);
  const repetitions = parseInt(repetitionsInput.value, 10);

  if (description && duration > 0 && repetitions > 0) {
    addBlock("Task", duration * 60, description, repetitions);
    taskDescInput.value = ""; // Clear input after adding
    taskDurationInput.value = ""; // Clear input after adding
    // Keep repetitions value
  } else {
    alert("유효한 태스크 설명, 시간, 반복 횟수를 입력하세요."); // TODO: Use a more user-friendly notification
  }
});

addBreakBtn.addEventListener("click", () => {
  const duration = parseInt(breakDurationInput.value, 10);
  const repetitions = parseInt(repetitionsInput.value, 10);

  if (duration > 0 && repetitions > 0) {
    addBlock("Break", duration * 60, `휴식 (${duration}분)`, repetitions);
    // Keep break duration and repetitions value
  } else {
    alert("유효한 휴식 시간과 반복 횟수를 입력하세요."); // TODO: Use a more user-friendly notification
  }
});

// ... rest of the existing code (addBlock, updateSessionUI, startSession, etc.) ...

// Initial UI update
updateSessionUI();
