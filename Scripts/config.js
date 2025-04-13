// Ensure the preload script has exposed the API
if (window.electronAPI) {
  const configForm = document.getElementById("config-form");
  const cancelButton = document.getElementById("cancel-button");

  const blockListElement = document.getElementById("block-list");
  const addBlockButton = document.getElementById("add-block-button");
  const addBreakButton = document.getElementById("add-break-button"); // Added for break button
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
      // Add a class if it's a break block for potential styling
      if (block.isBreak) {
        li.classList.add("break-block");
      }
      li.dataset.id = block.id; // Store ID on the element

      // View elements
      const viewSpan = document.createElement("span");
      // Display '휴식' if it's a break block
      viewSpan.textContent = block.isBreak
        ? `휴식 (${block.duration}분)`
        : `${block.name} (${block.duration}분)`;
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
      // Disable name editing for break blocks
      if (block.isBreak) {
        editNameInput.disabled = true;
        editNameInput.style.display = "none"; // Hide name input for breaks in edit mode too
      }
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
      // Only add name input if not a break block
      if (!block.isBreak) {
        li.appendChild(editNameInput);
      }
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
        // Only show name input if not a break block
        if (!block.isBreak) {
          editNameInput.style.display = "inline-block";
        }
        editDurationInput.style.display = "inline-block";
        editControls.style.display = "flex";
        // Focus duration input for breaks, name input otherwise
        if (block.isBreak) {
          editDurationInput.focus();
        } else {
          editNameInput.focus();
        }
      });

      cancelEditButton.addEventListener("click", () => {
        // Switch back to view mode, discard changes
        li.classList.remove("editing");
        viewSpan.style.display = "inline-block"; // Or flex/block depending on layout needs
        viewControls.style.display = "flex";
        if (!block.isBreak) {
          editNameInput.style.display = "none";
        }
        editDurationInput.style.display = "none";
        editControls.style.display = "none";
        // Reset input values to original block data
        if (!block.isBreak) {
          editNameInput.value = block.name;
        }
        editDurationInput.value = block.duration;
      });

      saveEditButton.addEventListener("click", () => {
        // For breaks, only update duration. For regular blocks, update name and duration.
        const newDuration = parseInt(editDurationInput.value, 10);
        let newName = block.name; // Keep original name by default

        if (!block.isBreak) {
          newName = editNameInput.value.trim();
        }

        // TODO: Implement robust validation chain for name (if applicable) and duration
        if ((block.isBreak || newName) && newDuration > 0) {
          // Find the block in the array and update it
          const blockIndex = currentBlocks.findIndex((b) => b.id === block.id);
          if (blockIndex > -1) {
            if (!block.isBreak) {
              currentBlocks[blockIndex].name = newName;
            }
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
      // Add isBreak: false for regular blocks
      currentBlocks.push({ id: nextBlockId++, name, duration, isBreak: false });
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

  // Add new break block
  addBreakButton.addEventListener("click", () => {
    // TODO: Consider making the default break duration configurable
    const breakDuration = 5; // Default break duration
    currentBlocks.push({
      id: nextBlockId++,
      name: "휴식",
      duration: breakDuration,
      isBreak: true,
    });
    renderBlockList();
    // Optionally clear or reset the main input fields as well
    blockNameInput.value = "";
    blockDurationInput.value = "25";
    blockNameInput.focus(); // Keep focus on name input
  });

  // Save configuration
  configForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent default form submission

    // TODO: Add input validation for session/break durations before sending
    const configData = {
      blocks: currentBlocks, // Include the current blocks
      // TODO: Retrieve other config values if added
    };

    console.log("Sending config data:", configData); // Debug log
    // TODO: Consider adding data validation before sending using window.electronAPI.sendConfigData.
    window.electronAPI.sendConfigData(configData); // Use exposed API
  });

  // Cancel button
  cancelButton.addEventListener("click", () => {
    window.electronAPI.closeConfigWindow(); // Use exposed API
  });

  // Listen for initial config data from main process (renamed)
  window.electronAPI.onInitialConfigData((initialConfigData) => {
    console.log("Received initial config:", initialConfigData); // Debug log

    // TODO: Validate received initialConfigData structure rigorously (e.g., using a schema validation library).
    // TODO: Consider privacy implications if block names contain sensitive info - potentially sanitize or anonymize.
    if (initialConfigData) {
      // Populate form fields - Remove references to non-existent elements
      // sessionDurationInput.value = initialConfigData.sessionDuration || 25; // Use default if missing
      // breakDurationInput.value = initialConfigData.breakDuration || 5; // Use default if missing

      // Populate blocks
      currentBlocks =
        initialConfigData.blocks && Array.isArray(initialConfigData.blocks)
          ? initialConfigData.blocks.map((b) => ({
              ...b,
              isBreak: b.isBreak || false,
            })) // Ensure isBreak exists
          : [];

      // Ensure blocks have unique IDs and valid structure (reuse existing validation logic)
      let maxId = -1;
      const existingIds = new Set();
      currentBlocks.forEach((b) => {
        // TODO: Refactor ID assignment and validation into a reusable function.
        if (typeof b.id === "number" && !isNaN(b.id)) {
          if (existingIds.has(b.id)) {
            console.warn(
              `Duplicate block ID ${b.id} found. Assigning a new ID.`
            );
            // TODO: Decide on a strategy for handling duplicate IDs (re-assign, error?) - Re-assigning for now.
            b.id = undefined; // Mark for reassignment
          } else {
            existingIds.add(b.id);
            maxId = Math.max(maxId, b.id);
          }
        } else {
          b.id = undefined; // Mark for assignment
        }
        // TODO: Implement stricter validation for block name (e.g., length limits, allowed characters) and duration (e.g., reasonable range).
        // Ensure name exists even for breaks, though it might not be editable
        if (typeof b.name !== "string" || (!b.isBreak && b.name.trim() === ""))
          b.name = b.isBreak ? "휴식" : "Unnamed Block";
        if (typeof b.duration !== "number" || b.duration <= 0)
          b.duration = b.isBreak ? 5 : 25; // Default duration based on type
        // Ensure isBreak is a boolean
        b.isBreak = !!b.isBreak;
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
    } else {
      // Handle case where no initial data is received (e.g., first run)
      currentBlocks = [];
      nextBlockId = 0;
    }

    renderBlockList(); // Initial render based on received or default data
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
