const sessionContainer = document.getElementById("session-container");
// --- 주석 처리 또는 삭제 ---
// const taskDescInput = document.getElementById("task-desc");
// const taskDurationInput = document.getElementById("task-duration");
// const breakDurationInput = document.getElementById("break-duration");
// const addTaskBtn = document.getElementById("add-task-btn"); // Assuming this ID exists
// const addBreakBtn = document.getElementById("add-break-btn"); // Assuming this ID exists
// --- ---
const startSessionBtn = document.getElementById("start-session-btn");
const pauseSessionBtn = document.getElementById("pause-session-btn");
const resetSessionBtn = document.getElementById("reset-session-btn");
const repetitionsInput = document.getElementById("repetitions");
const currentBlockTypeSpan = document.getElementById("current-block-type");
const timeLeftSpan = document.getElementById("time-left");
// TODO: Get progress bar elements
const openConfigBtn = document.getElementById("open-config-btn");

let sessionBlocks = []; // Array to hold block objects { type: 'task'/'break', description: '...', duration: seconds }
let currentBlockIndex = -1;
let timerInterval = null;
let remainingTime = 0; // in seconds
let isPaused = false;
let currentRepetition = 1;
let totalRepetitions = 1;
let isInfinite = false; // Flag for infinite repetitions

// --- Block Management (Now primarily driven by config) ---

// --- 주석 처리 또는 삭제 ---
/*
function addBlock(type) {
  // ... (original addBlock logic) ...
}

function removeBlock(index) {
  sessionBlocks.splice(index, 1);
  renderSession();
}
*/
// --- ---

// TODO: Implement moveBlockUp(index) and moveBlockDown(index) for reordering (if needed in main view)
// TODO: Implement drag and drop reordering (if needed in main view)

function renderSession() {
  // Clear current view
  sessionContainer.innerHTML = "";

  if (sessionBlocks.length === 0) {
    sessionContainer.innerHTML = "<p>세션을 구성하려면 설정(⚙️)을 여세요.</p>"; // Updated message
    startSessionBtn.disabled = true;
    return;
  }

  sessionBlocks.forEach((block, index) => {
    const blockElement = document.createElement("div");
    // Use block.name as description, assume all are 'task' type for now
    // TODO: Adapt if config.js adds a 'type' field to blocks.
    blockElement.classList.add("block", "task"); // Assuming all blocks from config are tasks
    // TODO: Add draggable attribute and event listeners for drag/drop if reordering in main view is desired

    const descriptionSpan = document.createElement("span");
    // Display name and duration in minutes
    descriptionSpan.textContent = `${block.description} (${Math.floor(
      block.duration / 60
    )}분)`;

    // --- 주석 처리 또는 삭제 (Remove button) ---
    /*
    const controlsDiv = document.createElement("div");
    controlsDiv.classList.add("block-controls");
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "삭제";
    // removeBtn.onclick = () => removeBlock(index); // removeBlock is removed/commented
    controlsDiv.appendChild(removeBtn);
    */
    // --- ---

    blockElement.appendChild(descriptionSpan);
    // blockElement.appendChild(controlsDiv); // Removed controls
    sessionContainer.appendChild(blockElement);
  });

  // Enable start button if there are blocks
  startSessionBtn.disabled = sessionBlocks.length === 0;
}

// --- Timer Logic ---

function startSession() {
  if (sessionBlocks.length === 0) return;

  // TODO: Re-evaluate session validation logic based on config structure.
  // The old validation (task + ends with break) might not apply directly.
  // For now, allow starting if there's at least one block.

  totalRepetitions = parseInt(repetitionsInput.value, 10) || 1;
  currentRepetition = 1;
  currentBlockIndex = 0;
  isPaused = false;
  startBlock(currentBlockIndex);

  // Update UI state
  startSessionBtn.disabled = true;
  pauseSessionBtn.disabled = false;
  resetSessionBtn.disabled = false;
  disableEditing(true); // Disable repetitions input during session
  // TODO: Show progress bar
}

function startBlock(index) {
  if (index >= sessionBlocks.length) {
    // Finished all blocks in the current repetition
    // TODO: Decide if a break (using configBreakDuration) should happen *between* repetitions.
    // For now, just move to the next repetition or finish.
    handleRepetitionEnd();
    return;
  }

  const block = sessionBlocks[index];
  remainingTime = block.duration; // Duration is already in seconds
  updateTimerDisplay();
  highlightCurrentBlock(index);
  currentBlockTypeSpan.textContent = block.description; // Use block name

  clearInterval(timerInterval); // Clear any existing interval
  timerInterval = setInterval(() => {
    if (isPaused) return;

    remainingTime--;
    updateTimerDisplay();
    // TODO: Update progress bar based on remainingTime / block.duration

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      // TODO: Play notification sound/show popup using a more user-friendly method than alert.
      // alert(`${block.description} 완료!`); // Simple alert for now
      moveToNextBlock();
    }
  }, 1000);
}

function handleRepetitionEnd() {
  if (currentRepetition < totalRepetitions) {
    currentRepetition++;
    currentBlockIndex = 0;
    // TODO: Optionally insert a break period here using configBreakDuration before starting the next repetition.
    console.log(`Starting repetition ${currentRepetition}/${totalRepetitions}`); // Debug log
    startBlock(currentBlockIndex); // Start next repetition
  } else {
    sessionFinished(); // All repetitions done
  }
}

function moveToNextBlock() {
  highlightCurrentBlock(-1); // Remove highlight from finished block
  currentBlockIndex++;
  startBlock(currentBlockIndex); // Will handle index >= length case
}

function sessionFinished() {
  clearInterval(timerInterval);
  // TODO: Use a less intrusive notification method.
  alert("세션 완료!");
  resetSession();
  // TODO: Record statistics (e.g., total time, blocks completed).
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
  startSessionBtn.disabled = sessionBlocks.length === 0; // Enable if blocks exist
  pauseSessionBtn.disabled = true;
  pauseSessionBtn.textContent = "일시정지";
  resetSessionBtn.disabled = true;
  disableEditing(false); // Enable repetitions input
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
  // --- 주석 처리 또는 삭제 ---
  // const addTaskBtn = document.getElementById("add-task-btn");
  // const addBreakBtn = document.getElementById("add-break-btn");
  // addTaskBtn.disabled = disabled;
  // addBreakBtn.disabled = disabled;
  // taskDescInput.disabled = disabled;
  // taskDurationInput.disabled = disabled;
  // breakDurationInput.disabled = disabled;
  // --- ---
  repetitionsInput.disabled = disabled; // Only disable repetitions input

  // --- 주석 처리 또는 삭제 (Remove buttons) ---
  /*
  const removeButtons = sessionContainer.querySelectorAll(
    ".block-controls button"
  );
  removeButtons.forEach((btn) => (btn.disabled = disabled));
  */
  // --- ---
  // TODO: Disable drag/drop if implemented and editing is disabled
}

// --- Event Listeners ---
openConfigBtn.addEventListener("click", () => {
  // configPopup.classList.add("show"); // <-- 삭제
  // Optional: Show backdrop if implemented
  // document.getElementById('popup-backdrop').classList.add('show');
  // --- 추가 ---
  // Check if the electronAPI is exposed via preload script
  if (
    window.electronAPI &&
    typeof window.electronAPI.openConfigWindow === "function"
  ) {
    window.electronAPI.openConfigWindow(); // Send message to main process
  } else {
    console.error(
      "electronAPI.openConfigWindow is not available. Check preload.js."
    );
    alert("설정 창을 열 수 없습니다. preload 스크립트를 확인하세요."); // Provide user feedback
  }
});

// Listen for config data updates from the main process
if (
  window.electronAPI &&
  typeof window.electronAPI.onConfigData === "function"
) {
  window.electronAPI.onConfigData((configData) => {
    console.log("Received config data from main process:", configData); // Debug log

    // TODO: Add validation for the received configData structure.
    if (!configData || !Array.isArray(configData.blocks)) {
      console.error("Invalid config data received:", configData);
      // TODO: Show an error message to the user.
      return;
    }

    // Update break duration (convert minutes to seconds)
    configBreakDuration = (configData.breakDuration || 5) * 60;

    // Transform blocks from config format to timer format
    // Assuming all blocks from config are 'task' type for now.
    // TODO: Adapt this transformation if config.js adds a 'type' field to blocks.
    sessionBlocks = configData.blocks.map((block) => ({
      // TODO: Define a clear mapping between config block properties and timer block properties.
      type: "task", // Hardcoded assumption
      description: block.name,
      duration: block.duration * 60, // Convert minutes to seconds
    }));

    console.log("Transformed session blocks:", sessionBlocks); // Debug log

    // Update the UI and reset the timer state
    renderSession();
    resetSession();

    // Optional: Provide user feedback that settings were updated.
    // alert("세션 구성이 업데이트되었습니다."); // Can be annoying, consider a less intrusive notification.
  });
} else {
  console.error("electronAPI.onConfigData is not available. Check preload.js.");
  // TODO: Display a persistent error message in the UI if the API is unavailable.
}

// Initial render on load (might be empty until config is opened/saved)
renderSession();
resetSession(); // Ensure initial state is correct

// --- 추가: 세션 시작, 일시정지, 초기화 버튼 이벤트 리스너 ---
startSessionBtn.addEventListener("click", startSession);
pauseSessionBtn.addEventListener("click", pauseSession); // 일시정지 버튼 리스너 추가
resetSessionBtn.addEventListener("click", resetSession); // 초기화 버튼 리스너 추가
// --- ---
