// Ensure the preload script has exposed the API
if (window.electronAPI) {
  const configForm = document.getElementById("config-form");
  const cancelButton = document.getElementById("cancel-button");
  const sessionDurationInput = document.getElementById("session-duration");
  const breakDurationInput = document.getElementById("break-duration");

  const blockListElement = document.getElementById("block-list");
  const addBlockButton = document.getElementById("add-block-button");
  const blockNameInput = document.getElementById("block-name");
  const blockDurationInput = document.getElementById("block-duration");

  let currentBlocks = []; // Store blocks in memory
  let nextBlockId = 0; // Simple ID generator

  // Function to render the block list
  function renderBlockList() {
    blockListElement.innerHTML = ""; // Clear existing list
    currentBlocks.forEach((block) => {
      const li = document.createElement("li");
      li.classList.add("block-item");
      li.dataset.id = block.id; // Store ID on the element

      // View elements
      const viewSpan = document.createElement("span");
      viewSpan.textContent = `${block.name} (${block.duration}분)`;
      const viewControls = document.createElement("div");
      viewControls.classList.add("view-controls");
      const editButton = document.createElement("button");
      editButton.textContent = "수정";
      editButton.classList.add("edit-button");
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "삭제";
      deleteButton.classList.add("delete-button");
      viewControls.appendChild(editButton);
      viewControls.appendChild(deleteButton);

      // Edit elements (initially hidden)
      const editNameInput = document.createElement("input");
      editNameInput.type = "text";
      editNameInput.value = block.name;
      editNameInput.classList.add("edit-name-input");
      const editDurationInput = document.createElement("input");
      editDurationInput.type = "number";
      editDurationInput.value = block.duration;
      editDurationInput.min = "1";
      editDurationInput.classList.add("edit-duration-input");
      const editControls = document.createElement("div");
      editControls.classList.add("edit-controls");
      const saveEditButton = document.createElement("button");
      saveEditButton.textContent = "저장";
      saveEditButton.classList.add("save-edit-button");
      const cancelEditButton = document.createElement("button");
      cancelEditButton.textContent = "취소";
      cancelEditButton.classList.add("cancel-edit-button");
      editControls.appendChild(saveEditButton);
      editControls.appendChild(cancelEditButton);

      // Assemble list item
      li.appendChild(viewSpan);
      li.appendChild(editNameInput); // Add edit inputs (hidden)
      li.appendChild(editDurationInput);
      li.appendChild(viewControls);
      li.appendChild(editControls); // Add edit controls (hidden)
      blockListElement.appendChild(li);

      // --- Event Listeners for this block ---
      deleteButton.addEventListener("click", () => {
        currentBlocks = currentBlocks.filter((b) => b.id !== block.id);
        renderBlockList(); // Re-render the list
      });

      editButton.addEventListener("click", () => {
        // Switch to edit mode for this item
        li.classList.add("editing");
        viewSpan.style.display = "none";
        viewControls.style.display = "none";
        editNameInput.style.display = "inline-block";
        editDurationInput.style.display = "inline-block";
        editControls.style.display = "flex";
        editNameInput.focus(); // Focus the name input
      });

      cancelEditButton.addEventListener("click", () => {
        // Switch back to view mode, discard changes
        li.classList.remove("editing");
        viewSpan.style.display = "inline-block"; // Or flex/block depending on layout needs
        viewControls.style.display = "flex";
        editNameInput.style.display = "none";
        editDurationInput.style.display = "none";
        editControls.style.display = "none";
        // Reset input values to original block data
        editNameInput.value = block.name;
        editDurationInput.value = block.duration;
      });

      saveEditButton.addEventListener("click", () => {
        const newName = editNameInput.value.trim();
        const newDuration = parseInt(editDurationInput.value, 10);

        // TODO: Implement robust validation chain for name and duration
        if (newName && newDuration > 0) {
          // Find the block in the array and update it
          const blockIndex = currentBlocks.findIndex((b) => b.id === block.id);
          if (blockIndex > -1) {
            currentBlocks[blockIndex].name = newName;
            currentBlocks[blockIndex].duration = newDuration;
          }
          renderBlockList(); // Re-render to show updated view and exit edit mode
        } else {
          // TODO: Show validation error to the user (e.g., highlight fields, display message)
          console.error("Invalid name or duration for block edit.");
        }
      });
    });

    // Update nextBlockId if needed
    if (currentBlocks.length > 0) {
      nextBlockId = Math.max(...currentBlocks.map((b) => b.id)) + 1;
    } else {
      nextBlockId = 0;
    }
  }

  // --- Event Listeners ---

  // Add new block
  addBlockButton.addEventListener("click", () => {
    const name = blockNameInput.value.trim();
    const duration = parseInt(blockDurationInput.value, 10);

    // TODO: Implement robust validation chain for name and duration
    if (name && duration > 0) {
      currentBlocks.push({ id: nextBlockId++, name, duration });
      renderBlockList(); // Update the list display
      // Clear input fields
      blockNameInput.value = "";
      blockDurationInput.value = "25"; // Reset to default or keep last value? Resetting.
      blockNameInput.focus(); // Focus name input for next entry
    } else {
      // TODO: Provide user feedback (e.g., highlight fields, display message)
      console.error("Please enter a valid name and duration > 0.");
    }
  });

  // Save configuration
  configForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent default form submission

    const sessionDuration = parseInt(sessionDurationInput.value, 10);
    const breakDuration = parseInt(breakDurationInput.value, 10);

    // TODO: Add input validation for session/break durations before sending
    if (
      isNaN(sessionDuration) ||
      sessionDuration <= 0 ||
      isNaN(breakDuration) ||
      breakDuration <= 0
    ) {
      console.error("Invalid session or break duration.");
      // TODO: Display error message to the user
      return; // Prevent sending invalid data
    }

    const configData = {
      sessionDuration: sessionDuration,
      breakDuration: breakDuration,
      blocks: currentBlocks, // Include the current blocks
      // TODO: Retrieve other config values if added
    };

    console.log("Sending config data:", configData); // Debug log
    window.electronAPI.sendConfigData(configData); // Use exposed API
  });

  // Cancel button
  cancelButton.addEventListener("click", () => {
    window.electronAPI.closeConfigWindow(); // Use exposed API
  });

  // Listen for initial block data from main process
  window.electronAPI.onInitialBlocksData((blocks) => {
    console.log("Received initial blocks:", blocks); // Debug log
    // TODO: Validate received blocks structure rigorously (schema validation?)
    // TODO: Consider privacy implications if block names contain sensitive info.
    currentBlocks = blocks && Array.isArray(blocks) ? blocks : [];
    // Ensure blocks have unique IDs if they don't already
    let maxId = -1;
    const existingIds = new Set();
    currentBlocks.forEach((b) => {
      if (typeof b.id === "number" && !isNaN(b.id)) {
        if (existingIds.has(b.id)) {
          console.warn(`Duplicate block ID ${b.id} found. Assigning a new ID.`);
          // TODO: Decide on a strategy for handling duplicate IDs (re-assign, error?)
          b.id = undefined; // Mark for reassignment
        } else {
          existingIds.add(b.id);
          maxId = Math.max(maxId, b.id);
        }
      } else {
        b.id = undefined; // Mark for assignment
      }
      // TODO: Validate block name and duration types/values
      if (typeof b.name !== "string") b.name = "Unnamed Block";
      if (typeof b.duration !== "number" || b.duration <= 0) b.duration = 25; // Default duration
    });

    // Assign new IDs where needed
    currentBlocks.forEach((b) => {
      if (b.id === undefined) {
        do {
          maxId++;
        } while (existingIds.has(maxId));
        b.id = maxId;
        existingIds.add(maxId);
      }
    });

    nextBlockId = maxId + 1; // Set next ID correctly

    // TODO: Potentially load session/break duration from initial data too if needed
    // Example: if (initialConfig && initialConfig.sessionDuration) sessionDurationInput.value = initialConfig.sessionDuration;
    renderBlockList(); // Initial render
  });
} else {
  console.error(
    "electronAPI is not available. Check preload.js and contextIsolation settings."
  );
  // Optionally, display an error message to the user in the config window itself
  const body = document.querySelector("body");
  if (body) {
    // Check if body exists before appending
    const errorDiv = document.createElement("div");
    errorDiv.textContent =
      "오류: 설정을 저장하거나 창을 닫을 수 없습니다. preload 스크립트를 확인하세요.";
    errorDiv.style.color = "red";
    errorDiv.style.marginTop = "20px";
    body.appendChild(errorDiv);
  } else {
    // Fallback if body isn't available yet (less likely with defer)
    alert(
      "오류: 설정을 저장하거나 창을 닫을 수 없습니다. preload 스크립트를 확인하세요."
    );
  }
}
