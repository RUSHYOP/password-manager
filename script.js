// Password Manager Application with JSON File Storage
class PasswordManager {
  constructor() {
    this.groups = [];
    this.showPasswords = {};
    this.expandedGroups = {};
    this.currentGroupId = null; // Track currently selected group
    this.fileHandles = new Map(); // Store file handles for each group
    this.storageDirectory = null;
    this.init();
  }

  async init() {
    await this.initializeStorage();
    this.bindEvents();
    await this.loadAllGroups();
    this.updateUI();
  }

  async initializeStorage() {
    // Check if File System Access API is supported
    if ("showDirectoryPicker" in window) {
      try {
        // Try to get previously stored directory handle
        const storedHandle = localStorage.getItem(
          "passwordManager_directoryHandle"
        );
        if (storedHandle) {
          // For security reasons, we can't restore handles, so we'll ask user to select again
          this.showToast("Please select your password storage folder");
          await this.selectStorageDirectory();
        }
      } catch (error) {
        console.log("File System Access API available but not initialized");
      }
    } else {
      // Fallback to localStorage for browsers without File System Access API
      this.showToast("Using browser storage (File System API not supported)");
      this.loadFromLocalStorage();
    }
  }

  async selectStorageDirectory() {
    try {
      if ("showDirectoryPicker" in window) {
        this.storageDirectory = await window.showDirectoryPicker({
          mode: "readwrite",
          startIn: "documents",
        });
        localStorage.setItem("passwordManager_hasDirectory", "true");
        this.showToast("Storage directory selected successfully!");
        await this.loadAllGroups();
        this.updateUI();
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        this.showToast("Error selecting directory: " + error.message);
      }
    }
  }

  bindEvents() {
    // Group form events
    document
      .getElementById("showGroupForm")
      .addEventListener("click", () => this.showGroupForm());
    document
      .getElementById("addGroupBtn")
      .addEventListener("click", () => this.addGroup());
    document
      .getElementById("cancelGroupBtn")
      .addEventListener("click", () => this.hideGroupForm());
    document
      .getElementById("groupNameInput")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.addGroup();
      });

    // File operations
    document
      .getElementById("loadGroupBtn")
      .addEventListener("click", () => this.selectStorageDirectory());
  }

  showGroupForm() {
    document.getElementById("showGroupForm").classList.add("hidden");
    document.getElementById("newGroupForm").classList.remove("hidden");
    document.getElementById("groupNameInput").focus();
  }

  hideGroupForm() {
    document.getElementById("showGroupForm").classList.remove("hidden");
    document.getElementById("newGroupForm").classList.add("hidden");
    document.getElementById("groupNameInput").value = "";
  }

  async addGroup() {
    const input = document.getElementById("groupNameInput");
    const groupName = input.value.trim();

    if (groupName) {
      const newGroup = {
        id: Date.now(),
        name: groupName,
        passwords: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.groups.push(newGroup);
      this.expandedGroups[newGroup.id] = true;

      // Save to JSON file
      await this.saveGroupToFile(newGroup);

      this.hideGroupForm();
      this.updateUI();
      this.showToast("Group created successfully!");
    }
  }

  async deleteGroup(groupId) {
    if (
      confirm(
        "Are you sure you want to delete this group and all its passwords?"
      )
    ) {
      const group = this.groups.find((g) => g.id === groupId);
      if (group) {
        // Delete the JSON file
        await this.deleteGroupFile(group);

        // Remove from memory
        this.groups = this.groups.filter((g) => g.id !== groupId);
        delete this.expandedGroups[groupId];
        this.fileHandles.delete(groupId);

        this.updateUI();
        this.showToast("Group deleted successfully!");
      }
    }
  }

  toggleGroup(groupId) {
    this.expandedGroups[groupId] = !this.expandedGroups[groupId];
    this.updateUI();
  }

  async addPassword(groupId, passwordData) {
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      const newPassword = {
        id: Date.now(),
        ...passwordData,
        createdAt: new Date().toISOString(),
      };

      group.passwords.push(newPassword);
      group.updatedAt = new Date().toISOString();

      // Save to JSON file
      await this.saveGroupToFile(group);

      this.updateUI();
      this.showToast("Password added successfully!");
    }
  }

  async deletePassword(groupId, passwordId) {
    if (confirm("Are you sure you want to delete this password?")) {
      const group = this.groups.find((g) => g.id === groupId);
      if (group) {
        group.passwords = group.passwords.filter((p) => p.id !== passwordId);
        group.updatedAt = new Date().toISOString();
        delete this.showPasswords[passwordId];

        // Save to JSON file
        await this.saveGroupToFile(group);

        this.updateUI();
        this.showToast("Password deleted successfully!");
      }
    }
  }

  // File operations
  async saveGroupToFile(group) {
    const fileName = this.sanitizeFilename(group.name) + "_passwords.json";
    const data = {
      groupName: group.name,
      groupId: group.id,
      passwords: group.passwords,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      version: "1.0",
    };

    try {
      if (this.storageDirectory && "showDirectoryPicker" in window) {
        // Use File System Access API
        let fileHandle = this.fileHandles.get(group.id);

        if (!fileHandle) {
          // Create new file
          fileHandle = await this.storageDirectory.getFileHandle(fileName, {
            create: true,
          });
          this.fileHandles.set(group.id, fileHandle);
        }

        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();

        console.log(`Saved group "${group.name}" to ${fileName}`);
      } else {
        // Fallback to localStorage
        this.saveToLocalStorage();
      }
    } catch (error) {
      console.error("Error saving group to file:", error);
      this.showToast("Error saving to file: " + error.message);
      // Fallback to localStorage
      this.saveToLocalStorage();
    }
  }

  async deleteGroupFile(group) {
    const fileName = this.sanitizeFilename(group.name) + "_passwords.json";

    try {
      if (this.storageDirectory && "showDirectoryPicker" in window) {
        const fileHandle = this.fileHandles.get(group.id);
        if (fileHandle) {
          await this.storageDirectory.removeEntry(fileName);
          console.log(`Deleted file: ${fileName}`);
        }
      }
    } catch (error) {
      console.error("Error deleting group file:", error);
      // File might not exist, which is okay
    }
  }

  async loadAllGroups() {
    try {
      if (this.storageDirectory && "showDirectoryPicker" in window) {
        // Load from JSON files
        this.groups = [];
        this.fileHandles.clear();

        for await (const [name, handle] of this.storageDirectory.entries()) {
          if (name.endsWith("_passwords.json")) {
            try {
              const file = await handle.getFile();
              const text = await file.text();
              const data = JSON.parse(text);

              const group = {
                id: data.groupId || Date.now(),
                name: data.groupName,
                passwords: data.passwords || [],
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
              };

              this.groups.push(group);
              this.fileHandles.set(group.id, handle);
              this.expandedGroups[group.id] = false;
            } catch (error) {
              console.error(`Error loading ${name}:`, error);
            }
          }
        }

        console.log(`Loaded ${this.groups.length} groups from JSON files`);
      } else {
        // Load from localStorage
        this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error("Error loading groups:", error);
      this.loadFromLocalStorage();
    }
  }

  // LocalStorage fallback methods
  saveToLocalStorage() {
    const data = {
      groups: this.groups,
      expandedGroups: this.expandedGroups,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem("passwordManager_data", JSON.stringify(data));
  }

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem("passwordManager_data");
      if (stored) {
        const data = JSON.parse(stored);
        this.groups = data.groups || [];
        this.expandedGroups = data.expandedGroups || {};
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      this.groups = [];
      this.expandedGroups = {};
    }
  }

  togglePasswordVisibility(passwordId) {
    this.showPasswords[passwordId] = !this.showPasswords[passwordId];
    this.updatePasswordVisibility(passwordId);
  }

  updatePasswordVisibility(passwordId) {
    const passwordElement = document.querySelector(
      `[data-password-id="${passwordId}"] .password-value[data-password-id="${passwordId}"]`
    );
    const toggleButton = document.querySelector(
      `[data-password-id="${passwordId}"] .toggle-password`
    );

    if (passwordElement && toggleButton) {
      const password = passwordElement.dataset.password;
      const isVisible = this.showPasswords[passwordId];

      passwordElement.textContent = isVisible
        ? password
        : "•".repeat(password.length);
      toggleButton.innerHTML = isVisible
        ? this.getEyeOffIcon()
        : this.getEyeIcon();
      toggleButton.title = isVisible ? "Hide password" : "Show password";
    }
  }

  copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.showToast("Copied to clipboard!");
      })
      .catch(() => {
        this.showToast("Failed to copy to clipboard");
      });
  }

  updateUI() {
    const container = document.getElementById("groupsContainer");
    const emptyState = document.getElementById("emptyState");

    // Update sidebar
    this.updateSidebar();

    // Update main content based on selected group
    if (this.currentGroupId) {
      const currentGroup = this.groups.find(
        (g) => g.id === this.currentGroupId
      );
      if (currentGroup) {
        this.showGroupContent(currentGroup);
      } else {
        // Group was deleted, show all groups view
        this.showAllGroupsView();
      }
    } else {
      this.showAllGroupsView();
    }

    // Update stats
    this.updateStats();

    // Update load button text based on storage method
    const loadBtn = document.getElementById("loadGroupBtn");
    if (this.storageDirectory) {
      loadBtn.innerHTML = `${this.getFolderIcon()} Change Folder`;
    } else {
      loadBtn.innerHTML = `${this.getFolderIcon()} Storage Folder`;
    }
  }

  showAllGroupsView() {
    const container = document.getElementById("groupsContainer");
    const emptyState = document.getElementById("emptyState");
    const currentView = document.getElementById("currentView");
    const currentViewSubtitle = document.getElementById("currentViewSubtitle");

    this.currentGroupId = null;
    currentView.textContent = "All Groups";
    currentViewSubtitle.textContent = "Manage your password groups and entries";

    if (this.groups.length === 0) {
      container.innerHTML = "";
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      container.innerHTML = `
                <div class="groups-overview">
                    <div class="overview-grid">
                        ${this.groups
                          .map((group) => this.renderGroupOverviewCard(group))
                          .join("")}
                    </div>
                </div>
            `;
    }

    // Remove active state from sidebar groups
    document.querySelectorAll(".sidebar-group-item").forEach((item) => {
      item.classList.remove("active");
    });
  }

  showGroupContent(group) {
    const container = document.getElementById("groupsContainer");
    const emptyState = document.getElementById("emptyState");
    const currentView = document.getElementById("currentView");
    const currentViewSubtitle = document.getElementById("currentViewSubtitle");

    emptyState.classList.add("hidden");
    currentView.textContent = group.name;
    currentViewSubtitle.textContent = `${group.passwords.length} passwords in this group`;

    container.innerHTML = `
            <div class="group-content-view">
                <div class="group-header-actions">
                    <button class="btn btn-primary" onclick="passwordManager.showPasswordForm(${
                      group.id
                    })">
                        ${this.getPlusIcon()}
                        Add New Password
                    </button>
                    <button class="btn btn-secondary" onclick="passwordManager.showAllGroupsView()">
                        ${this.getBackIcon()}
                        Back to All Groups
                    </button>
                </div>
                
                <div id="passwordForm-${group.id}" class="password-form hidden">
                    <div class="password-form-grid">
                        <div class="form-group">
                            <label for="title-${group.id}">Title</label>
                            <input type="text" id="title-${
                              group.id
                            }" placeholder="e.g., Gmail, Facebook, Bank Account" class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="username-${
                              group.id
                            }">Username/Email</label>
                            <input type="text" id="username-${
                              group.id
                            }" placeholder="your.email@example.com" class="form-input">
                        </div>
                        <div class="form-group">
                            <label for="password-${group.id}">Password</label>
                            <input type="password" id="password-${
                              group.id
                            }" placeholder="Enter your password" class="form-input">
                        </div>
                    </div>
                    <div class="password-form-actions">
                        <button class="btn btn-success" onclick="passwordManager.submitPassword(${
                          group.id
                        })">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>
                            Add Password
                        </button>
                        <button class="btn btn-secondary" onclick="passwordManager.hidePasswordForm(${
                          group.id
                        })">Cancel</button>
                    </div>
                </div>
                
                <div class="passwords-grid">
                    ${
                      group.passwords.length > 0
                        ? group.passwords
                            .map((password) =>
                              this.renderPasswordCard(group.id, password)
                            )
                            .join("")
                        : this.renderEmptyPasswordList()
                    }
                </div>
            </div>
        `;

    this.bindGroupEvents();
  }

  selectGroup(groupId) {
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      this.currentGroupId = groupId;
      this.showGroupContent(group);

      // Update sidebar active state
      document.querySelectorAll(".sidebar-group-item").forEach((item) => {
        item.classList.remove("active");
      });
      document
        .querySelector(`[data-group-id="${groupId}"]`)
        ?.classList.add("active");
    }
  }

  renderGroupOverviewCard(group) {
    return `
            <div class="group-overview-card" onclick="passwordManager.selectGroup(${
              group.id
            })">
                <div class="group-overview-header">
                    <div class="group-overview-icon">
                        ${this.getFolderIcon()}
                    </div>
                    <div class="group-overview-actions">
                        <button class="btn-icon" onclick="event.stopPropagation(); passwordManager.deleteGroup(${
                          group.id
                        })" title="Delete group">
                            ${this.getTrashIcon()}
                        </button>
                    </div>
                </div>
                <div class="group-overview-content">
                    <h3 class="group-overview-name">${this.escapeHtml(
                      group.name
                    )}</h3>
                    <p class="group-overview-count">${
                      group.passwords.length
                    } password${group.passwords.length !== 1 ? "s" : ""}</p>
                    <div class="group-overview-preview">
                        ${group.passwords
                          .slice(0, 3)
                          .map(
                            (p) => `
                            <div class="password-preview-item">
                                <span class="password-preview-title">${this.escapeHtml(
                                  p.title
                                )}</span>
                            </div>
                        `
                          )
                          .join("")}
                        ${
                          group.passwords.length > 3
                            ? `
                            <div class="password-preview-item more">
                                +${group.passwords.length - 3} more
                            </div>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
        `;
  }

  renderPasswordCard(groupId, password) {
    const isVisible = this.showPasswords[password.id];
    const maskedPassword = "••••••••";
    const escapedPassword = this.escapeHtml(password.password);
    const escapedUsername = this.escapeHtml(password.username);

    return `
            <div class="password-card" data-password-id="${password.id}">
                <div class="password-card-header">
                    <div class="password-card-title">
                        <h4>${this.escapeHtml(password.title)}</h4>
                        <span class="password-card-username">${escapedUsername}</span>
                    </div>
                    <div class="password-card-actions">
                        <button class="btn-icon" onclick="passwordManager.copyToClipboard(\`${
                          password.username
                        }\`)" title="Copy username">
                            ${this.getCopyIcon()}
                        </button>
                        <button class="btn-icon toggle-password" onclick="passwordManager.togglePasswordVisibility(${
                          password.id
                        })" title="${
      isVisible ? "Hide password" : "Show password"
    }">
                            ${
                              isVisible
                                ? this.getEyeOffIcon()
                                : this.getEyeIcon()
                            }
                        </button>
                        <button class="btn-icon" onclick="passwordManager.copyToClipboard(\`${
                          password.password
                        }\`)" title="Copy password">
                            ${this.getCopyIcon()}
                        </button>
                        <button class="btn-icon btn-danger-icon" onclick="passwordManager.deletePassword(${groupId}, ${
      password.id
    })" title="Delete password">
                            ${this.getTrashIcon()}
                        </button>
                    </div>
                </div>
                <div class="password-card-content">
                    <div class="password-display">
                        <span class="password-value" data-password="${escapedPassword}" data-password-id="${
      password.id
    }">${isVisible ? escapedPassword : maskedPassword}</span>
                    </div>
                </div>
            </div>
        `;
  }

  updateSidebar() {
    const sidebarGroupsList = document.getElementById("sidebarGroupsList");

    if (this.groups.length === 0) {
      sidebarGroupsList.innerHTML =
        '<p style="color: var(--dark-text-secondary); font-size: 0.875rem; text-align: center; padding: var(--space-4);">No groups yet</p>';
    } else {
      sidebarGroupsList.innerHTML = this.groups
        .map((group) => this.renderSidebarGroup(group))
        .join("");
    }
  }

  updateStats() {
    const totalGroups = document.getElementById("totalGroups");
    const totalPasswords = document.getElementById("totalPasswords");

    const passwordCount = this.groups.reduce(
      (total, group) => total + group.passwords.length,
      0
    );

    totalGroups.textContent = this.groups.length;
    totalPasswords.textContent = passwordCount;
  }

  renderSidebarGroup(group) {
    return `
            <div class="sidebar-group-item" data-group-id="${
              group.id
            }" onclick="passwordManager.selectGroup(${group.id})">
                <div class="sidebar-group-info">
                    ${this.getFolderIcon()}
                    <span>${this.escapeHtml(group.name)}</span>
                </div>
                <span class="sidebar-group-count">${
                  group.passwords.length
                }</span>
            </div>
        `;
  }

  renderGroupCard(group) {
    const isExpanded = this.expandedGroups[group.id];
    return `
            <div class="group-card" id="group-${group.id}">
                <div class="group-header" onclick="passwordManager.toggleGroup(${
                  group.id
                })">
                    <div class="group-title">
                        <div class="group-info">
                            <svg class="group-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
                            </svg>
                            <div>
                                <div class="group-name">${this.escapeHtml(
                                  group.name
                                )}</div>
                                <span class="group-count">${
                                  group.passwords.length
                                } passwords</span>
                            </div>
                        </div>
                        <div class="group-actions">
                            <button class="btn-icon" onclick="event.stopPropagation(); passwordManager.showPasswordForm(${
                              group.id
                            })" title="Add password">
                                ${this.getPlusIcon()}
                            </button>
                            <button class="btn-danger" onclick="event.stopPropagation(); passwordManager.deleteGroup(${
                              group.id
                            })" title="Delete group">
                                ${this.getTrashIcon()}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="group-content ${isExpanded ? "" : "hidden"}">
                    ${this.renderGroupContent(group)}
                </div>
            </div>
        `;
  }

  renderGroupContent(group) {
    return `
            <div id="passwordForm-${group.id}" class="password-form hidden">
                <div class="password-form-grid">
                    <div class="form-group">
                        <label for="title-${group.id}">Title</label>
                        <input type="text" id="title-${
                          group.id
                        }" placeholder="e.g., Gmail, Facebook, Bank Account" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="username-${group.id}">Username/Email</label>
                        <input type="text" id="username-${
                          group.id
                        }" placeholder="your.email@example.com" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="password-${group.id}">Password</label>
                        <input type="password" id="password-${
                          group.id
                        }" placeholder="Enter your password" class="form-input">
                    </div>
                </div>
                <div class="password-form-actions">
                    <button class="btn btn-success" onclick="passwordManager.submitPassword(${
                      group.id
                    })">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        Add Password
                    </button>
                    <button class="btn btn-secondary" onclick="passwordManager.hidePasswordForm(${
                      group.id
                    })">Cancel</button>
                </div>
            </div>
            <div class="password-list">
                ${
                  group.passwords.length > 0
                    ? group.passwords
                        .map((password) =>
                          this.renderPassword(group.id, password)
                        )
                        .join("")
                    : this.renderEmptyPasswordList()
                }
            </div>
        `;
  }

  scrollToGroup(groupId) {
    const groupElement = document.getElementById(`group-${groupId}`);
    if (groupElement) {
      groupElement.scrollIntoView({ behavior: "smooth", block: "start" });

      // Expand the group if it's not already expanded
      if (!this.expandedGroups[groupId]) {
        this.toggleGroup(groupId);
      }
    }
  }

  showPasswordModal(groupId, password) {
    const modal = document.getElementById("passwordModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    modalTitle.textContent = password.title;
    modalBody.innerHTML = `
            <div class="password-fields">
                <div class="password-field">
                    <span class="password-label">Username</span>
                    <span class="password-value">${this.escapeHtml(
                      password.username
                    )}</span>
                    <div class="password-actions">
                        <button class="btn-icon" onclick="passwordManager.copyToClipboard(\`${
                          password.username
                        }\`)" title="Copy username">
                            ${this.getCopyIcon()}
                        </button>
                    </div>
                </div>
                <div class="password-field">
                    <span class="password-label">Password</span>
                    <span class="password-value" data-password="${this.escapeHtml(
                      password.password
                    )}" data-password-id="${password.id}">••••••••</span>
                    <div class="password-actions">
                        <button class="btn-icon toggle-password" onclick="passwordManager.togglePasswordVisibility(${
                          password.id
                        })" title="Show password">
                            ${this.getEyeIcon()}
                        </button>
                        <button class="btn-icon" onclick="passwordManager.copyToClipboard(\`${
                          password.password
                        }\`)" title="Copy password">
                            ${this.getCopyIcon()}
                        </button>
                    </div>
                </div>
            </div>
            <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--dark-border);">
                <button class="btn btn-danger" onclick="passwordManager.deletePassword(${groupId}, ${
      password.id
    }); passwordManager.closePasswordModal()">
                    ${this.getTrashIcon()}
                    Delete Password
                </button>
            </div>
        `;

    modal.classList.remove("hidden");
  }

  closePasswordModal() {
    const modal = document.getElementById("passwordModal");
    modal.classList.add("hidden");
  }

  renderPassword(groupId, password) {
    const isVisible = this.showPasswords[password.id];
    const maskedPassword = "••••••••";
    const escapedPassword = this.escapeHtml(password.password);
    const escapedUsername = this.escapeHtml(password.username);

    return `
            <div class="password-item" data-password-id="${
              password.id
            }" onclick="passwordManager.showPasswordModal(${groupId}, ${JSON.stringify(
      password
    ).replace(/"/g, "&quot;")})">
                <div class="password-header">
                    <h4 class="password-title">${this.escapeHtml(
                      password.title
                    )}</h4>
                    <button class="btn-danger" onclick="event.stopPropagation(); passwordManager.deletePassword(${groupId}, ${
      password.id
    })">
                        ${this.getTrashIcon()}
                    </button>
                </div>
                <div class="password-fields">
                    <div class="password-field">
                        <span class="password-label">Username</span>
                        <span class="password-value">${escapedUsername}</span>
                        <div class="password-actions">
                            <button class="btn-icon" onclick="event.stopPropagation(); passwordManager.copyToClipboard(\`${
                              password.username
                            }\`)" title="Copy username">
                                ${this.getCopyIcon()}
                            </button>
                        </div>
                    </div>
                    <div class="password-field">
                        <span class="password-label">Password</span>
                        <span class="password-value" data-password="${escapedPassword}" data-password-id="${
      password.id
    }">${isVisible ? escapedPassword : maskedPassword}</span>
                        <div class="password-actions">
                            <button class="btn-icon toggle-password" onclick="event.stopPropagation(); passwordManager.togglePasswordVisibility(${
                              password.id
                            })" title="${
      isVisible ? "Hide password" : "Show password"
    }">
                                ${
                                  isVisible
                                    ? this.getEyeOffIcon()
                                    : this.getEyeIcon()
                                }
                            </button>
                            <button class="btn-icon" onclick="event.stopPropagation(); passwordManager.copyToClipboard(\`${
                              password.password
                            }\`)" title="Copy password">
                                ${this.getCopyIcon()}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");
    const toastContent = toast.querySelector(".toast-content");

    // Update icon based on type
    const iconMap = {
      success: `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
            </svg>`,
      error: `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>`,
      info: `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>`,
    };

    toastContent.innerHTML = `
            ${iconMap[type] || iconMap.success}
            <span>${message}</span>
        `;

    // Update styles based on type
    const colorMap = {
      success: "linear-gradient(135deg, var(--success-600), #10b981)",
      error: "linear-gradient(135deg, var(--danger-600), #ef4444)",
      info: "linear-gradient(135deg, var(--secondary-600), var(--primary-600))",
    };

    toastContent.style.background = colorMap[type] || colorMap.success;

    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hidden");
    }, 3000);
  }

  renderEmptyPasswordList() {
    return `
            <div class="password-empty">
                ${this.getLockIcon()}
                <p>No passwords in this group yet</p>
            </div>
        `;
  }

  showPasswordForm(groupId) {
    const form = document.getElementById(`passwordForm-${groupId}`);
    form.classList.remove("hidden");
    document.getElementById(`title-${groupId}`).focus();
  }

  hidePasswordForm(groupId) {
    const form = document.getElementById(`passwordForm-${groupId}`);
    form.classList.add("hidden");
    this.clearPasswordForm(groupId);
  }

  clearPasswordForm(groupId) {
    document.getElementById(`title-${groupId}`).value = "";
    document.getElementById(`username-${groupId}`).value = "";
    document.getElementById(`password-${groupId}`).value = "";
  }

  async submitPassword(groupId) {
    const title = document.getElementById(`title-${groupId}`).value.trim();
    const username = document
      .getElementById(`username-${groupId}`)
      .value.trim();
    const password = document
      .getElementById(`password-${groupId}`)
      .value.trim();

    if (title && username && password) {
      await this.addPassword(groupId, { title, username, password });
      this.hidePasswordForm(groupId);
    } else {
      alert("Please fill in all fields");
    }
  }

  bindGroupEvents() {
    // Add event listeners for Enter key in password forms
    this.groups.forEach((group) => {
      const inputs = [
        document.getElementById(`title-${group.id}`),
        document.getElementById(`username-${group.id}`),
        document.getElementById(`password-${group.id}`),
      ];

      inputs.forEach((input) => {
        if (input) {
          input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
              this.submitPassword(group.id);
            }
          });
        }
      });
    });
  }

  showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    toastMessage.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hidden");
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-z0-9\s]/gi, "_")
      .replace(/\s+/g, "_")
      .toLowerCase();
  }

  // Icon methods
  getFolderIcon() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        </svg>`;
  }

  getTrashIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>`;
  }

  getPlusIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
        </svg>`;
  }

  getEyeIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>`;
  }

  getEyeOffIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68"/>
            <path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61"/>
            <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>`;
  }

  getCopyIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>`;
  }

  getLockIcon() {
    return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>`;
  }

  getBackIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
        </svg>`;
  }
}

// Initialize the password manager when the page loads
let passwordManager;
document.addEventListener("DOMContentLoaded", () => {
  passwordManager = new PasswordManager();
});
