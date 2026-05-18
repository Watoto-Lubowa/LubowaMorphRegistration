<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1 style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
        <img src="/watoto.svg" alt="Watoto Logo" style="height: 1.2em; width: auto; filter: brightness(0) invert(1);">
        <span>Admin Panel</span>
      </h1>
      <p class="admin-subtitle">Lubowa Morph Registration System</p>
    </div>

    <!-- Pending Approval Screen -->
    <div v-if="authStore.isPendingApproval" class="auth-section">
      <div class="auth-card" style="max-width: 600px; text-align: center; padding: 45px; border-radius: 25px; box-shadow: 0 20px 60px rgba(0,0,0,0.12); margin: 40px auto; animation: fadeInUp 0.5s ease-out;">
        <div style="font-size: 4.5em; margin-bottom: 25px; animation: pulse 2s infinite;">⏳</div>
        <h2 style="font-size: 1.8em; margin-bottom: 15px; color: #2d3748; background: none; -webkit-text-fill-color: initial; padding: 0;">Access Pending Approval</h2>
        <p style="color: #4a5568; font-size: 1.15em; line-height: 1.65; margin-bottom: 30px;">
          Your account <br>
          <span style="display: inline-block; background: rgba(0, 0, 0, 0.05); border: 1px solid rgba(0, 0, 0, 0.08); padding: 8px 18px; border-radius: 50px; color: #1a202c; font-weight: 600; font-size: 0.95em; margin: 10px 0; word-break: break-all;">
            {{ authStore.userEmail }}
          </span> <br>
          is currently pending administrator approval.
          <br><br>
          Please contact your system administrator to authorize your access to the Morph portal.
        </p>
        
        <div style="border-top: 1px solid #edf2f7; padding-top: 25px; margin-top: 20px; display: flex; justify-content: center;">
          <button 
            @click="authStore.signOutUser" 
            style="width: 100%; padding: 14px 20px; font-size: 1.05em; border-radius: 12px; font-weight: 600; background: #e2e8f0; color: #4a5568; display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);"
          >
            🚪 Sign Out / Use Another Account
          </button>
        </div>
      </div>
    </div>

    <!-- Authentication Section -->
    <div v-else-if="!isAuthenticated || !isAdmin" class="auth-section">
      <div class="auth-card">
        <div class="auth-icon">🛡️</div>
        <h2>Admin Sign In</h2>
        <p class="auth-description">Secure access to your admin dashboard</p>
        
        <div class="field email-field">
          <label for="adminEmail">
            <span class="field-icon">📧</span>
            <span class="field-text">Admin Email Address</span>
          </label>
          <input 
            type="email" 
            id="adminEmail" 
            v-model="adminEmail"
            placeholder="admin@example.com" 
            required
            @keyup.enter="signInWithPassword"
          >
          <small class="field-help">Enter your authorized admin email address</small>
        </div>
        
        <div class="field password-field">
          <label for="adminPassword">
            <span class="field-icon">🔐</span>
            <span class="field-text">Password</span>
          </label>
          <input 
            type="password" 
            id="adminPassword" 
            v-model="adminPassword"
            placeholder="••••••••••" 
            required
            @keyup.enter="signInWithPassword"
          >
          <small class="field-help">Enter your secure admin password</small>
        </div>
        
        <div class="button-container">
          <button 
            @click="signInWithPassword" 
            :disabled="isSigningIn || isSigningInGoogle"
            :class="{ loading: isSigningIn }"
          >
            <span v-if="!isSigningIn">🚀 Sign In</span>
            <span v-else style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
              <span style="display: inline-block; width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
              <span>Signing In...</span>
            </span>
          </button>
        </div>

        <!-- Google Sign-In Option -->
        <div class="auth-divider">
          <span>or</span>
        </div>
        
        <div class="google-btn-container">
          <button 
            @click="signInWithGoogle" 
            :disabled="isSigningIn || isSigningInGoogle"
            class="google-signin-btn"
            :class="{ loading: isSigningInGoogle }"
          >
            <span class="google-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </span>
            <span v-if="!isSigningInGoogle" class="google-btn-text">Sign in with Gmail</span>
            <span v-else class="google-btn-text">Signing in...</span>
          </button>
        </div>
        
        <div class="auth-options">
          <button @click="resetPassword" class="link-btn">
            Forgot Password?
          </button>
        </div>
        
        <div class="security-notice">
          <small>🔒 For security: You'll be automatically logged out when you close your browser tab/window.</small>
        </div>
        
        <div class="auth-status" :class="authStatusClass" v-if="authStatusMessage">
          {{ authStatusMessage }}
        </div>
      </div>
    </div>

    <!-- Admin Dashboard -->
    <div v-else class="admin-dashboard">
      <div class="dashboard-header">
        <div class="admin-info">
          <div class="admin-avatar">👤</div>
          <div class="admin-details">
            <h3>{{ authStore.userEmail }}</h3>
            <p>Authenticated Admin</p>
          </div>
        </div>
        
        <div class="header-actions">
          <Transition name="slide-fade">
            <div class="global-date-picker" v-show="activeTab === 'stats'">
              <span class="date-icon">📅</span>
              <input 
                type="date" 
                v-model="selectedDate"
                class="header-date-input"
              >
            </div>
          </Transition>
          <button @click="handleSignOut" class="sign-out-btn">
            🚪 Sign Out
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="dashboard-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'stats' }" 
          @click="activeTab = 'stats'"
        >
          📊 Stats & Controls
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'access' }" 
          @click="activeTab = 'access'"
        >
          🛡️ Access Management
        </button>
      </div>

      <div class="dashboard-content">
        <Transition name="section-fade" mode="out-in">
          <div v-if="activeTab === 'stats'" key="stats">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <h3>{{ totalRecords }}</h3>
                <p>Total Morphers</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <h3>{{ serviceAttendance }}</h3>
                <p>Total Service Attendance</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">👋</div>
              <div class="stat-info">
                <h3>{{ newGuestsCount }}</h3>
                <p>New Guests</p>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="charts-grid">
            <div class="chart-card">
              <h3>Service Distribution</h3>
              <!-- Date picker removed (using global one) -->
              <div class="chart-container">
                <canvas ref="attendanceChart"></canvas>
              </div>
            </div>
          </div>

          <div class="actions-grid">
            <div class="action-card">
              <div class="action-icon">♻️</div>
              <h3>Force Info Update Flow</h3>
              <p>Toggle whether morphers must update their info on every check-in</p>
              <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px;">
                <span style="font-weight: bold;">{{ forceUpdateStatusText }}</span>
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="forceUpdateFlow"
                    @change="toggleForceUpdateFlow"
                  >
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="action-card">
              <div class="action-icon">📍</div>
              <h3>GPS Enforcement</h3>
              <p>Toggle whether QR check-in requires GPS location validation</p>
              <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px;">
                <span style="font-weight: bold;">{{ gpsEnforcementStatusText }}</span>
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="enforceGPS"
                    @change="toggleGPSEnforcement"
                  >
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="action-card">
              <div class="action-icon">📱</div>
              <h3>Generate QR Codes</h3>
              <p>Generate QR codes for all three Sunday services</p>
              <button @click="generateAllQRCodes" class="action-btn" :disabled="isGeneratingQRs">
                <span v-if="!isGeneratingQRs">📱 Generate & Print</span>
                <span v-else style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                  <span style="display: inline-block; width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                  <span>Generating QR Codes...</span>
                </span>
              </button>
            </div>

            <div class="action-card">
              <div class="action-icon">📥</div>
              <h3>Download Data</h3>
              <p>Export all morpher records to CSV format</p>
              <button @click="downloadAll" class="action-btn" :disabled="isDownloading">
                <span v-if="!isDownloading">📥 Download CSV</span>
                <span v-else style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                  <span style="display: inline-block; width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
                  <span>Downloading...</span>
                </span>
              </button>
            </div>

            <!-- <div class="action-card">
              <div class="action-icon">📤</div>
              <h3>Upload Data</h3>
              <p>Import morphers records from CSV file</p>
              <label class="action-btn file-upload-btn">
                <span class="btn-text">Upload CSV</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  style="display: none;" 
                  @change="handleCSVFileInput"
                  ref="csvFileInput"
                >
              </label>
            </div> -->

            <!-- <div class="action-card">
              <div class="action-icon">🧹</div>
              <h3>Clear All Data</h3>
              <p class="danger-text">Permanently delete all records</p>
              <button @click="clearAllData" class="action-btn danger">
                Clear All Data
              </button>
            </div> -->
          </div>
        </div>

        <div v-else-if="activeTab === 'access'" class="access-management-section" key="access">
          <div class="access-card">
            <div class="access-header">
              <h2>🛡️ Access Management</h2>
              <p>Authorize, search, and manage email addresses allowed to access the system.</p>
            </div>
            
            <!-- Authorize New Email Form -->
            <div class="authorize-form-container">
              <h3>Add Authorized User</h3>
              <form @submit.prevent="authorizeNewEmail" class="authorize-form">
                <div class="form-row">
                  <div class="field email-input-field">
                    <input 
                      type="email" 
                      v-model="newAuthEmail"
                      placeholder="user@example.com" 
                      required
                    >
                  </div>
                  <div class="field role-select-field">
                    <select v-model="newAuthRole">
                      <option value="user">User (Registration Volunteer)</option>
                      <option value="admin">Admin (System Manager)</option>
                    </select>
                  </div>
                  <button type="submit" class="submit-btn" :disabled="isAddingAuth">
                    <span v-if="!isAddingAuth">➕ Authorize</span>
                    <span v-else>Adding...</span>
                  </button>
                </div>
              </form>
            </div>
            
            <!-- Search & Filter -->
            <div class="filter-container">
              <div class="search-field">
                <span class="search-icon">🔍</span>
                <input 
                  type="text" 
                  v-model="authSearchQuery" 
                  placeholder="Search emails..."
                >
              </div>
            </div>
            
            <!-- Authorized Emails Table -->
            <div class="table-container">
              <table class="access-table">
                <thead>
                  <tr>
                    <th>Email Address</th>
                    <th style="width: 120px; white-space: nowrap;">Status</th>
                    <th style="width: 130px; white-space: nowrap;">Role</th>
                    <th style="width: 160px; white-space: nowrap;">Added By</th>
                    <th style="width: 170px; white-space: nowrap;">Added At</th>
                    <th style="width: 180px; text-align: center; white-space: nowrap;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredAuthorizedEmails.length === 0">
                    <td colspan="6" class="empty-table-cell">
                      No matching authorized email records found.
                    </td>
                  </tr>
                  <tr v-for="record in paginatedAuthorizedEmails" :key="record.email" :style="editingEmail === record.email ? 'background: #f7fafc;' : ''">
                    <td>
                      <div class="email-cell" style="display: flex; align-items: center; gap: 8px; max-width: 160px; min-width: 0;">
                        <span class="envelope-icon" style="flex-shrink: 0;">📧</span>
                        <span 
                          :title="record.email" 
                          style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; display: block; font-weight: 500;"
                        >
                          {{ record.email }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <!-- Dedicated Status Column Badge -->
                      <span v-if="isPermanentAdmin(record.email)" class="role-badge" style="background: #edf2f7; color: #4a5568; font-weight: 700; padding: 6px 12px; border-radius: 50px; font-size: 0.8em; display: inline-flex; align-items: center; gap: 4px; border: 1px dashed #cbd5e0; white-space: nowrap;">
                        🔒 Protected
                      </span>
                      <span v-else-if="record.status === 'pending'" class="role-badge pending" style="background: #fffaf0; color: #dd6b20; border: 1px solid #fbd38d; font-weight: 700; padding: 6px 12px; border-radius: 50px; font-size: 0.8em; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">
                        ⏳ Pending
                      </span>
                      <span v-else class="role-badge user" style="background: #e6fffa; color: #047481; border: 1px solid #b2f5ea; font-weight: 700; padding: 6px 12px; border-radius: 50px; font-size: 0.8em; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">
                        🟢 Active
                      </span>
                    </td>
                    <td>
                      <!-- Editable Role Column Cell-Linked Popover Select Box -->
                      <template v-if="editingEmail === record.email">
                        <select 
                          v-model="editingRole"
                          style="background: #ffffff; border: 2px solid #3182ce; padding: 6px 10px; border-radius: 8px; font-weight: 600; font-size: 0.85em; color: #2d3748; outline: none; cursor: pointer; font-family: inherit; white-space: nowrap;"
                        >
                          <option value="user">👤 User</option>
                          <option value="admin">🔑 Admin</option>
                        </select>
                      </template>
                      <template v-else>
                        <span 
                          v-if="!isPermanentAdmin(record.email)"
                          @click="startEditingRole(record)"
                          class="role-badge clickable" 
                          :class="record.role"
                          title="Click to edit role"
                          style="cursor: pointer; padding: 6px 12px; border-radius: 50px; font-size: 0.85em; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s; white-space: nowrap;"
                        >
                          {{ record.role === 'admin' ? '🔑 Admin ✏️' : '👤 User ✏️' }}
                        </span>
                        <span 
                          v-else
                          class="role-badge" 
                          :class="record.role"
                          style="white-space: nowrap; padding: 6px 12px; border-radius: 50px; font-size: 0.85em; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"
                        >
                          {{ record.role === 'admin' ? '🔑 Admin' : '👤 User' }}
                        </span>
                      </template>
                    </td>
                    <td class="added-by-cell">
                      <div 
                        :title="record.addedBy"
                        style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 150px; font-weight: 500;"
                      >
                        {{ record.addedBy }}
                      </div>
                    </td>
                    <td style="white-space: nowrap;">{{ formatDateTime(record.addedAt) }}</td>
                    <td style="text-align: center;">
                      <!-- Inline Editing Actions -->
                      <template v-if="editingEmail === record.email">
                        <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                          <button 
                            @click="saveEditingRole(record.email)" 
                            class="approve-btn"
                            style="background: #38a169; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 0.85em; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 4px;"
                          >
                            ✔️ Save
                          </button>
                          <button 
                            @click="cancelEditingRole" 
                            style="background: #edf2f7; color: #4a5568; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 0.85em; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 4px;"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </template>
                      
                      <!-- Default Access Management Actions -->
                      <template v-else-if="!isPermanentAdmin(record.email)">
                        <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                          <button 
                            v-if="record.status === 'pending'"
                            @click="approvePendingAccess(record.email)" 
                            class="approve-btn"
                            style="background: #38a169; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 0.85em; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 4px;"
                          >
                            ✔️ Approve
                          </button>
                          <button 
                            @click="confirmRevokeAccess(record.email)" 
                            class="revoke-btn"
                            :title="record.status === 'pending' ? 'Reject Access' : 'Revoke Access'"
                          >
                            🗑️ {{ record.status === 'pending' ? 'Reject' : 'Revoke' }}
                          </button>
                        </div>
                      </template>
                      
                      <!-- Hardcoded accounts cannot be modified -->
                      <span v-else class="permanent-badge" title="Permanent Fallback Account" style="margin: 0 auto; display: inline-flex; white-space: nowrap;">
                        🔒 Protected
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Responsive Table Pagination Footer -->
            <div v-if="filteredAuthorizedEmails.length > 0" class="pagination-footer">
              <span class="pagination-info">
                Showing {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, filteredAuthorizedEmails.length) }} of {{ filteredAuthorizedEmails.length }} records
              </span>
              
              <div v-if="totalPages > 1" class="pagination-controls">
                <button 
                  @click="currentPage > 1 && currentPage--" 
                  :disabled="currentPage === 1"
                  class="page-action-btn prev"
                >
                  ⏮️ Prev
                </button>
                
                <div class="pagination-pages">
                  <button 
                    v-for="pageNum in totalPages" 
                    :key="pageNum"
                    @click="currentPage = pageNum"
                    class="page-num-btn"
                    :class="{ active: currentPage === pageNum }"
                  >
                    {{ pageNum }}
                  </button>
                </div>

                <button 
                  @click="currentPage < totalPages && currentPage++" 
                  :disabled="currentPage === totalPages"
                  class="page-action-btn next"
                >
                  Next ⏭️
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
    </div>
    <!-- Export Options Modal -->
    <Transition name="fade">
      <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
        <div class="settings-card" style="background-color: #f8f9fa;">
          <div class="settings-header">
            <h3>Export Options</h3>
            <button @click="closeExportModal" class="close-btn">✕</button>
          </div>
          
          <div class="settings-content">
            <p class="settings-description">
              Select a date range to filter the attendance records.
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
              <div class="field">
                <label for="exportStartDate">Start Date (Inclusive)</label>
                <input 
                  type="date" 
                  id="exportStartDate" 
                  v-model="exportStartDate"
                  :max="exportEndDate || undefined"
                  style="background: #fff; border: 1px solid #e1e5e9; padding: 12px; border-radius: 8px; width: 100%;"
                >
              </div>
              
              <div class="field">
                <label for="exportEndDate">End Date (Inclusive)</label>
                <input 
                  type="date" 
                  id="exportEndDate" 
                  v-model="exportEndDate"
                  :min="exportStartDate || undefined"
                  style="background: #fff; border: 1px solid #e1e5e9; padding: 12px; border-radius: 8px; width: 100%;"
                >
              </div>

              <!-- Test Mode Toggle -->
              <!-- <div class="action-card" style="padding: 15px; margin: 0; background: #fff; border: 1px solid #e1e5e9; border-radius: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; flex-direction: column; justify-content: center; align-items: flex-start;">
                    <h4 style="margin: 0; font-size: 1rem; line-height: 1.4;">Test Mode</h4>
                    <p style="margin: 0; font-size: 0.85rem; color: #666; line-height: 1.4;">Limit to first 100 records</p>
                  </div>
                  <label class="toggle-switch" style="margin: 0;">
                    <input 
                      type="checkbox" 
                      v-model="exportLimit100"
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div> -->
            </div>

            <div class="settings-footer" style="display: flex; gap: 10px;">
               <button 
                @click="executeDownload" 
                class="btn-primary" 
                style="flex: 1;"
                :disabled="isDownloading || !exportStartDate || !exportEndDate"
               >
                 <span v-if="!isDownloading">Download</span>
                 <span v-else>Downloading...</span>
               </button>
               <button @click="closeExportModal" class="btn-secondary" style="flex: 1;">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Revoke Access Confirmation Modal -->
    <Transition name="fade">
      <div v-if="showDeleteConfirmModal" class="modal-overlay" @click.self="showDeleteConfirmModal = false">
        <div class="settings-card" style="background-color: #fff; max-width: 420px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15); border: 1px solid rgba(0,0,0,0.05); overflow: hidden; padding: 0;">
          <div class="settings-header" style="border-bottom: none; padding: 24px 24px 8px 24px; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.35em; color: #1a202c; display: flex; align-items: center; gap: 8px; margin: 0;">
              <span>⚠️</span> Revoke Access?
            </h3>
            <button @click="showDeleteConfirmModal = false" class="close-btn" style="background: none; border: none; font-size: 1.2em; color: #a0aec0; cursor: pointer; transition: color 0.2s;">✕</button>
          </div>
          
          <div class="settings-content" style="padding: 8px 24px 28px 24px; text-align: center;">
            <p style="color: #4a5568; margin-bottom: 24px; line-height: 1.6; font-size: 0.98em;">
              Are you absolutely sure you want to revoke access for <br>
              <strong style="color: #1a202c; display: inline-block; background: rgba(0,0,0,0.05); padding: 6px 14px; border-radius: 6px; margin: 8px 0; word-break: break-all; font-weight: 700;">
                {{ emailToRevoke }}
              </strong>?<br>
              They will no longer be able to log into the system with this email address.
            </p>
            
            <div style="display: flex; gap: 12px;">
              <button 
                @click="executeRevokeAccess" 
                style="flex: 1; padding: 12px 20px; border-radius: 10px; border: none; background: #e53e3e; color: white; cursor: pointer; font-weight: 600; font-size: 0.95em; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;"
              >
                Yes, Revoke
              </button>
              <button 
                @click="showDeleteConfirmModal = false" 
                style="flex: 1; padding: 12px 20px; background: #edf2f7; color: #4a5568; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; font-size: 0.95em; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'
import { useUIStore } from '@/stores/ui'
import { generateServiceQRForService } from '@/utils/cloudflareWorker'
import QRCode from 'qrcode'

// Chart.js import
import Chart from 'chart.js/auto'

const authStore = useAuthStore()
const membersStore = useMembersStore()
const uiStore = useUIStore()

const { isAuthenticated, isAdmin } = storeToRefs(authStore)
const { members } = storeToRefs(membersStore)

// Tab state
const activeTab = ref('stats')

// Authentication state
const adminEmail = ref('')
const adminPassword = ref('')
const isSigningIn = ref(false)
const isSigningInGoogle = ref(false)
const authStatusMessage = ref('')
const authStatusClass = ref('')

// Dashboard data
const totalRecords = ref('Loading...')
const serviceAttendance = ref('Loading...')
const newGuestsCount = ref('Loading...')
const selectedDate = ref('')
const forceUpdateFlow = ref(false)
const forceUpdateStatusText = ref('Loading...')
const enforceGPS = ref(true)
const gpsEnforcementStatusText = ref('Loading...')
const isDownloading = ref(false)
const isGeneratingQRs = ref(false)

// Access Management State
const authorizedEmails = ref<{ email: string; role: string; status: string; addedBy: string; addedAt: string }[]>([])
const newAuthEmail = ref('')
const newAuthRole = ref('user')
const editingEmail = ref<string | null>(null)
const editingRole = ref<string>('user')
const authSearchQuery = ref('')
const isAddingAuth = ref(false)
const showDeleteConfirmModal = ref(false)
const emailToRevoke = ref('')

// Export Modal State
const showExportModal = ref(false)
const exportStartDate = ref('')
const exportEndDate = ref('')
const exportLimit100 = ref(false)

// Chart instance
const attendanceChart = ref<HTMLCanvasElement>()
let chartInstance: Chart | null = null

// // File input ref
// const csvFileInput = ref<HTMLInputElement>()

onMounted(async () => {
  if (isAuthenticated.value && isAdmin.value) {
    await loadDashboardStats()
    await loadForceUpdateFlowState()
    await loadAuthorizedEmails()
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0]
    selectedDate.value = today

    // Load initial data
    await updateDashboardData()
  }
})

// Watch for authentication changes and load dashboard when user signs in
watch([isAuthenticated, isAdmin], async ([authenticated, admin]) => {
  if (authenticated && admin) {
    await loadDashboardStats()
    await loadForceUpdateFlowState()
    await loadAuthorizedEmails()
    
    // Set default dates if not already set
    if (!selectedDate.value) {
      const today = new Date().toISOString().split('T')[0]
      selectedDate.value = today
    }
    
    // Load initial data
    await updateDashboardData()
  }
})

// Watch for date changes and update data
watch(selectedDate, async (newDate) => {
  if (newDate && isAuthenticated.value && isAdmin.value) {
    await updateDashboardData()
  }
})

// Watch for activeTab changes to re-initialize stats and charts upon returning to the Stats tab
watch(activeTab, async (newTab) => {
  if (newTab === 'stats' && isAuthenticated.value && isAdmin.value) {
    await nextTick()
    await updateDashboardData()
  }
})

async function updateDashboardData() {
  await fetchDailyStats()
}

// Authentication functions
async function signInWithPassword() {
  if (!adminEmail.value) {
    showAuthStatus('Please enter your email address', 'error')
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(adminEmail.value)) {
    showAuthStatus('Please enter a valid email address', 'error')
    return
  }
  
  if (!adminPassword.value) {
    showAuthStatus('Please enter your password', 'error')
    return
  }
  
  isSigningIn.value = true
  authStatusMessage.value = ''
  
  try {
    await authStore.signInWithEmailAndPassword(adminEmail.value, adminPassword.value)
    
    if (isAdmin.value) {
      showAuthStatus('Welcome Admin! Loading dashboard...', 'success')
      await loadDashboardStats()
      await loadForceUpdateFlowState()
    } else {
      showAuthStatus('Access denied: Admin privileges required', 'error')
      await authStore.signOutUser()
    }
  } catch (error: any) {
    console.error('Sign in error:', error)
    
    let errorMessage = 'Sign in failed. Please try again.'
    if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password. Please check your credentials.'
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.'
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.'
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.'
    }
    
    showAuthStatus(errorMessage, 'error')
  } finally {
    isSigningIn.value = false
  }
}

async function signInWithGoogle() {
  isSigningInGoogle.value = true
  authStatusMessage.value = ''
  
  try {
    const success = await authStore.signInWithGoogle()
    if (success) {
      if (isAdmin.value) {
        showAuthStatus('Welcome Admin! Loading dashboard...', 'success')
        await loadDashboardStats()
        await loadForceUpdateFlowState()
        await loadAuthorizedEmails()
      } else {
        showAuthStatus('Access denied: Admin privileges required', 'error')
        await authStore.signOutUser()
      }
    }
  } catch (error: any) {
    console.error('Google Sign-In Error:', error)
    showAuthStatus('Failed to sign in with Google.', 'error')
  } finally {
    isSigningInGoogle.value = false
  }
}

// Access Management Functions
async function loadAuthorizedEmails() {
  try {
    const { getFirebaseInstances } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    if (!db) return
    
    const { collection, getDocs } = await import('@/utils/firebase')
    const querySnapshot = await getDocs(collection(db, 'authorized_emails'))
    
    const list: any[] = []
    
    // Seed hardcoded records to the table display for transparency
    list.push({
      email: 'jeromessenyonjo@gmail.com',
      role: 'admin',
      status: 'allowed',
      addedBy: 'System',
      addedAt: new Date('2026-01-01T00:00:00.000Z').toISOString()
    })
    list.push({
      email: 'denis.omoding@watotochurch.com',
      role: 'admin',
      status: 'allowed',
      addedBy: 'System',
      addedAt: new Date('2026-01-01T00:00:00.000Z').toISOString()
    })
    list.push({
      email: 'volunteer.lubowa@watotochurch.com',
      role: 'user',
      status: 'allowed',
      addedBy: 'System',
      addedAt: new Date('2026-01-01T00:00:00.000Z').toISOString()
    })
    
    querySnapshot.forEach(docSnap => {
      const email = docSnap.id
      const data = docSnap.data()
      // Avoid duplicating if they are in the hardcoded list
      if (!list.some(item => item.email.toLowerCase().trim() === email.toLowerCase().trim())) {
        list.push({
          email: email,
          role: data.role || 'user',
          status: data.status || 'allowed',
          addedBy: data.addedBy || 'Admin',
          addedAt: data.addedAt || new Date().toISOString()
        })
      }
    })
    
    authorizedEmails.value = list
  } catch (error) {
    console.error('Failed to load authorized emails:', error)
  }
}

async function authorizeNewEmail() {
  if (!newAuthEmail.value) {
    uiStore.warning('Please enter an email address')
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newAuthEmail.value)) {
    uiStore.warning('Please enter a valid email address')
    return
  }
  
  const targetEmail = newAuthEmail.value.toLowerCase().trim()
  
  if (authorizedEmails.value.some(record => record.email.toLowerCase().trim() === targetEmail)) {
    uiStore.warning('This email is already authorized!')
    return
  }
  
  isAddingAuth.value = true
  try {
    const { getFirebaseInstances } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    if (!db) throw new Error('Database not initialized')
    
    const { doc, setDoc } = await import('@/utils/firebase')
    const docRef = doc(db, 'authorized_emails', targetEmail)
    
    const timestamp = new Date().toISOString()
    const adminEmailStr = authStore.userEmail || 'Admin'
    
    await setDoc(docRef, {
      role: newAuthRole.value,
      addedBy: adminEmailStr,
      addedAt: timestamp,
      status: 'allowed'
    })
    
    uiStore.success(`Successfully authorized ${targetEmail} as a ${newAuthRole.value}`)
    
    // Reset form
    newAuthEmail.value = ''
    newAuthRole.value = 'user' // Default role is user
    
    // Reload list
    await loadAuthorizedEmails()
  } catch (error) {
    console.error('Failed to authorize email:', error)
    uiStore.error('Failed to authorize email address')
  } finally {
    isAddingAuth.value = false
  }
}

async function approvePendingAccess(email: string) {
  const targetEmail = email.toLowerCase().trim()
  try {
    const { getFirebaseInstances } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    if (!db) throw new Error('Database not initialized')
    
    const { doc, updateDoc } = await import('@/utils/firebase')
    const docRef = doc(db, 'authorized_emails', targetEmail)
    
    await updateDoc(docRef, {
      status: 'allowed',
      addedBy: authStore.userEmail || 'Admin',
      addedAt: new Date().toISOString()
    })
    
    uiStore.success(`Successfully approved access for ${targetEmail}`)
    
    // Reload list
    await loadAuthorizedEmails()
  } catch (error) {
    console.error('Failed to approve access:', error)
    uiStore.error('Failed to approve access')
  }
}

function startEditingRole(record: any) {
  if (isPermanentAdmin(record.email)) return
  editingEmail.value = record.email
  editingRole.value = record.role
}

function cancelEditingRole() {
  editingEmail.value = null
  editingRole.value = 'user'
}

async function saveEditingRole(email: string) {
  const targetEmail = email.toLowerCase().trim()
  try {
    const { getFirebaseInstances } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    if (!db) throw new Error('Database not initialized')
    
    const { doc, updateDoc } = await import('@/utils/firebase')
    const docRef = doc(db, 'authorized_emails', targetEmail)
    
    await updateDoc(docRef, {
      role: editingRole.value,
      lastUpdatedBy: authStore.userEmail || 'Admin',
      lastUpdatedAt: new Date().toISOString()
    })
    
    uiStore.success(`Successfully updated role for ${targetEmail} to ${editingRole.value === 'admin' ? 'Admin' : 'User'}`)
    cancelEditingRole()
    await loadAuthorizedEmails()
  } catch (error) {
    console.error('Failed to update role:', error)
    uiStore.error('Failed to update role')
  }
}

function confirmRevokeAccess(email: string) {
  emailToRevoke.value = email
  showDeleteConfirmModal.value = true
}

async function executeRevokeAccess() {
  if (!emailToRevoke.value) return
  
  const targetEmail = emailToRevoke.value.toLowerCase().trim()
  
  try {
    const { getFirebaseInstances } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    if (!db) throw new Error('Database not initialized')
    
    const { doc, deleteDoc } = await import('@/utils/firebase')
    const docRef = doc(db, 'authorized_emails', targetEmail)
    
    await deleteDoc(docRef)
    
    uiStore.success(`Revoked access for ${targetEmail}`)
    showDeleteConfirmModal.value = false
    emailToRevoke.value = ''
    
    // Reload list
    await loadAuthorizedEmails()
  } catch (error) {
    console.error('Failed to revoke access:', error)
    uiStore.error('Failed to revoke access')
  }
}

function isPermanentAdmin(email: string): boolean {
  const normalized = email.toLowerCase().trim()
  return ['jeromessenyonjo@gmail.com', 'denis.omoding@watotochurch.com', 'volunteer.lubowa@watotochurch.com'].includes(normalized)
}

function formatDateTime(val: any): string {
  if (!val) return 'N/A'
  try {
    const date = new Date(val)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

const filteredAuthorizedEmails = computed(() => {
  const query = authSearchQuery.value.toLowerCase().trim()
  if (!query) return authorizedEmails.value
  
  return authorizedEmails.value.filter(record => 
    record.email.toLowerCase().includes(query) || 
    record.role.toLowerCase().includes(query)
  )
})

// Responsive Pagination State
const windowWidth = ref(window.innerWidth)
const handleResize = () => {
  windowWidth.value = window.innerWidth
}
onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const itemsPerPage = computed(() => {
  return windowWidth.value <= 768 ? 5 : 10
})

const currentPage = ref(1)

watch([filteredAuthorizedEmails, itemsPerPage], () => {
  currentPage.value = 1
})

const totalPages = computed(() => {
  return Math.ceil(filteredAuthorizedEmails.value.length / itemsPerPage.value)
})

const paginatedAuthorizedEmails = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredAuthorizedEmails.value.slice(start, end)
})

async function resetPassword() {
  if (!adminEmail.value) {
    showAuthStatus('Please enter your email address first', 'error')
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(adminEmail.value)) {
    showAuthStatus('Please enter a valid email address', 'error')
    return
  }
  
  try {
    await authStore.sendPasswordResetEmail(adminEmail.value)
    showAuthStatus('Password reset email sent! Check your inbox.', 'success')
  } catch (error: any) {
    console.error('Password reset error:', error)
    
    let errorMessage = 'Failed to send password reset email.'
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.'
    }
    
    showAuthStatus(errorMessage, 'error')
  }
}

function showAuthStatus(message: string, type: 'success' | 'error' | 'info') {
  authStatusMessage.value = message
  authStatusClass.value = type
}

async function handleSignOut() {
  await authStore.signOutUser()
  // Reset form
  adminEmail.value = ''
  adminPassword.value = ''
  authStatusMessage.value = ''
}

// Dashboard functions
async function loadDashboardStats() {
  try {
    await membersStore.getAllMembers()
    totalRecords.value = members.value.length.toString()
    console.log('📋 Admin loaded total records:', totalRecords.value)
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
    uiStore.error('Failed to load dashboard statistics')
  }
}

async function fetchDailyStats() {
  if (!selectedDate.value) return
  
  // Reset states
  serviceAttendance.value = 'Loading...'
  newGuestsCount.value = 'Loading...'
  
  try {
    const [year, month, day] = selectedDate.value.split('-')
    const dateKey = `${day}_${month}_${year}`
    const queryDate = selectedDate.value.replace(/-/g, '/') // YYYY/MM/DD
    
    console.log('📅 Fetching stats for:', selectedDate.value, '(key:', dateKey, ')')
    
    const { getFirebaseInstances, collection, query, where, getDocs } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    // Query only documents that have attendance for the specific date
    // This is much more efficient than fetching all documents
    const morphersCollection = collection(db, 'morphers')
    const attendanceQuery = query(morphersCollection, where(`attendance.${dateKey}`, '>', ''))
    const snapshot = await getDocs(attendanceQuery)
    
    // 1. Total Attendance
    const attendanceCount = snapshot.size
    serviceAttendance.value = attendanceCount.toString()
    
    // 2. Process records for Service Distribution and New Guests
    const serviceDistribution: Record<string, number> = {}
    let guestsCount = 0
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      
      // Count service distribution
      if (data.attendance && data.attendance[dateKey]) {
        const service = data.attendance[dateKey]
        const serviceName = getServiceName(service)
        serviceDistribution[serviceName] = (serviceDistribution[serviceName] || 0) + 1
      }
      
      // Count new guests
      // transform queryDate to match storage format if needed, but assuming firstTimeOn is YYYY/MM/DD
      if (data.firstTimeOn === queryDate) {
        guestsCount++
      }
    })
    
    newGuestsCount.value = guestsCount.toString()
    
    console.log('✅ Stats updated:', {
      attendance: attendanceCount,
      guests: guestsCount,
      distribution: serviceDistribution
    })
    
    // 3. Update Chart
    await nextTick()
    renderServiceDistributionChart(serviceDistribution)
    
  } catch (error) {
    console.error('Failed to update dashboard stats:', error)
    serviceAttendance.value = 'Error'
    newGuestsCount.value = 'Error'
  }
}

function renderServiceDistributionChart(serviceDistribution: Record<string, number>) {
  if (!attendanceChart.value) return
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const ctx = attendanceChart.value.getContext('2d')
  if (!ctx) return
  
  const labels = Object.keys(serviceDistribution)
  const data = Object.values(serviceDistribution)
  
  // If no data for the selected date, show empty chart
  if (labels.length === 0) {
    labels.push('No Attendance Data')
    data.push(0)
  }
  
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#163A59',  // First Service
          '#0F2D47',  // Second Service
          '#1E4D75',  // Third Service
          '#2D5A7B',  // Fourth Service
          '#78A5C4',  // Fifth Service
          '#0f172a',  // Additional (Dark Slate)
          '#A8C5D9',  // Light variant
          '#C5D9E8'   // Lightest variant
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'easeOutQuart',
        animateScale: true,
        animateRotate: true
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.label || ''
              const value = context.parsed
              if (value === 0) {
                return 'No attendance recorded for this date'
              }
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${label}: ${value} attendees (${percentage}%)`
            }
          }
        },
        title: {
          display: true,
          text: `Service Distribution - ${formatDate(selectedDate.value)}`,
          font: {
            size: 14
          },
          padding: {
            bottom: 20
          }
        }
      }
    }
  })
}

// Helper function to get service name from service number
function getServiceName(serviceNumber: string): string {
  const serviceNames: Record<string, string> = {
    '1': 'First Service',
    '2': 'Second Service', 
    '3': 'Third Service',
    '4': 'Fourth Service',
    '5': 'Fifth Service'
  }
  
  return serviceNames[serviceNumber] || `Service ${serviceNumber}`
}

// Helper function to format date for display
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Force update flow functions
async function loadForceUpdateFlowState() {
  try {
    // Load the state using the members store function
    const currentState = await membersStore.loadForceUpdateFlowState()
    forceUpdateFlow.value = currentState
    forceUpdateStatusText.value = currentState ? 'Enabled' : 'Disabled'
    
    // Also load GPS enforcement state
    enforceGPS.value = membersStore.enforceGPS
    gpsEnforcementStatusText.value = enforceGPS.value ? 'Enabled' : 'Disabled'
    
    console.log('📋 Admin loaded forceUpdateFlow state:', currentState)
    console.log('📍 Admin loaded enforceGPS state:', enforceGPS.value)
  } catch (error) {
    console.error('Failed to load force update state:', error)
    forceUpdateStatusText.value = 'Error'
  }
}

async function toggleForceUpdateFlow() {
  try {
    // Import Firestore functions for config update
    const { getFirebaseInstances } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    if (!db) {
      throw new Error('Database not initialized')
    }

    // Update Firestore config
    const { doc, setDoc } = await import('@/utils/firebase')
    const configDocRef = doc(db, 'config', 'appSettings')
    await setDoc(configDocRef, {
      forceUpdateFlow: forceUpdateFlow.value,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    // Update local state and sync with members store
    forceUpdateStatusText.value = forceUpdateFlow.value ? 'Enabled' : 'Disabled'
    membersStore.forceUpdateFlow = forceUpdateFlow.value
    
    const statusText = forceUpdateFlow.value 
      ? 'Force Info Update Flow is now ON - users must update info on every check-in'
      : 'Force Info Update Flow is now OFF - users can quickly check-in without updating info'
    
    uiStore.success(statusText)
    console.log('📋 Admin updated forceUpdateFlow to:', forceUpdateFlow.value)
  } catch (error) {
    console.error('Failed to toggle force update flow:', error)
    uiStore.error('Failed to update force update flow setting')
    
    // Revert toggle if failed
    forceUpdateFlow.value = !forceUpdateFlow.value
  }
}

async function toggleGPSEnforcement() {
  try {
    // Import Firestore functions for config update
    const { getFirebaseInstances } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    if (!db) {
      throw new Error('Database not initialized')
    }

    // Update Firestore config
    const { doc, setDoc } = await import('@/utils/firebase')
    const configDocRef = doc(db, 'config', 'appSettings')
    await setDoc(configDocRef, {
      enforceGPS: enforceGPS.value,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    // Update local state and sync with members store
    gpsEnforcementStatusText.value = enforceGPS.value ? 'Enabled' : 'Disabled'
    membersStore.enforceGPS = enforceGPS.value
    
    const statusText = enforceGPS.value 
      ? 'GPS Enforcement is now ON - QR check-in requires location validation'
      : 'GPS Enforcement is now OFF - QR check-in will skip location checks'
    
    uiStore.success(statusText)
    console.log('📍 Admin updated enforceGPS to:', enforceGPS.value)
  } catch (error) {
    console.error('Failed to toggle GPS enforcement:', error)
    uiStore.error('Failed to update GPS enforcement setting')
    
    // Revert toggle if failed
    enforceGPS.value = !enforceGPS.value
  }
}

// QR Code generation functions
interface ServiceQRData {
  serviceNumber: number
  serviceName: string
  serviceTime: string
  qrCodeDataUrl: string
  validDate: string // Human-readable date (e.g., "Sunday, December 15, 2025")
}

/**
 * Generate QR code for a specific service
 * @param serviceNumber - The service number (1, 2, or 3)
 * @returns Promise with QR code data URL and service info
 */
async function generateServiceQR(serviceNumber: number): Promise<ServiceQRData> {
  const serviceInfo = {
    1: { name: 'First Service', time: '8:00 AM - 10:00 AM' },
    2: { name: 'Second Service', time: '10:00 AM - 12:00 PM' },
    3: { name: 'Third Service', time: '12:00 PM - 2:00 PM' }
  }

  const service = serviceInfo[serviceNumber as keyof typeof serviceInfo]
  if (!service) {
    throw new Error(`Invalid service number: ${serviceNumber}`)
  }

  // Get encrypted QR data from Cloudflare Worker for next Sunday's service
  const workerResponse = await generateServiceQRForService(serviceNumber)
  
  if (!workerResponse.success || !workerResponse.qrData || !workerResponse.serviceInfo) {
    throw new Error(workerResponse.error || 'Failed to generate QR code from worker')
  }

  // Extract and format the valid date from service info
  const validDate = new Date(workerResponse.serviceInfo.startTime)
  const formattedDate = validDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Generate QR code with full URL including encrypted data (same format as QRView expects)
  // URL-encode the QR data to handle special characters in base64 (+, /, =)
  const encodedQrData = encodeURIComponent(workerResponse.qrData)
  const qrUrl = `${window.location.origin}?qr=${encodedQrData}`
  const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'H'
  })

  return {
    serviceNumber,
    serviceName: service.name,
    serviceTime: service.time,
    qrCodeDataUrl,
    validDate: formattedDate
  }
}

/**
 * Create print-ready HTML layout with all QR codes
 * @param qrDataArray - Array of QR code data for all services
 * @returns HTML string ready for printing
 */
function createPrintLayout(qrDataArray: ServiceQRData[]): string {
  // Format date as YYYYMMDD
  const today = new Date()
  const dateStr = today.getFullYear().toString() + 
                  (today.getMonth() + 1).toString().padStart(2, '0') + 
                  today.getDate().toString().padStart(2, '0')
  
  const pages = qrDataArray.map((data, index) => `
    <div class="qr-print-page" ${index === 0 ? 'style="page-break-before: auto;"' : ''}>
      <div class="qr-print-content">
        <div class="qr-logo-container">
          <img src="/watoto.svg" alt="Watoto Church" class="qr-logo" />
        </div>
        <div class="qr-service-info">
          <h1 class="qr-service-name">${data.serviceName}</h1>
          <p class="qr-service-time">${data.serviceTime}</p>
          <p class="qr-location">Watoto Church Lubowa</p>
        </div>
        <div class="qr-code-container">
          <img src="${data.qrCodeDataUrl}" alt="QR Code for ${data.serviceName}" class="qr-code-image" />
        </div>
        <div class="qr-valid-date">
          <p style="font-size: 1rem; color: #666; font-weight: 600; margin: 1rem 0;">Valid: ${data.validDate}</p>
        </div>
        <div class="qr-instructions">
          <p>Scan this QR code to check in for ${data.serviceName}</p>
        </div>
      </div>
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Service QR Codes - Watoto Church Lubowa (${dateStr})</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
        }
        
        .qr-print-page {
          width: 210mm;
          min-height: 297mm;
          page-break-after: always;
          page-break-inside: avoid;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          position: relative;
        }
        
        .qr-print-page:last-child {
          page-break-after: avoid;
        }
        
        .qr-print-content {
          text-align: center;
          padding: 2rem;
          max-width: 600px;
        }
        
        .qr-logo-container {
          margin-bottom: 2rem;
        }
        
        .qr-logo {
          height: 80px;
          width: auto;
        }
        
        .qr-service-info {
          margin-bottom: 2rem;
        }
        
        .qr-service-name {
          font-size: 2.5rem;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }
        
        .qr-service-time {
          font-size: 1.5rem;
          color: #666;
          margin-bottom: 0.25rem;
        }
        
        .qr-location {
          font-size: 1.2rem;
          color: #888;
        }
        
        .qr-code-container {
          margin: 2rem 0;
          display: flex;
          justify-content: center;
        }
        
        .qr-code-image {
          max-width: 400px;
          width: 100%;
          height: auto;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
          background: white;
        }
        
        .qr-instructions {
          margin-top: 2rem;
          font-size: 1.1rem;
          color: #666;
        }
        
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          
          .qr-print-page {
            page-break-after: always;
            page-break-inside: avoid;
            width: 100%;
            min-height: 100vh;
          }
          
          .qr-print-page:last-child {
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      ${pages}
    </body>
    </html>
  `
}

/**
 * Open print dialog with generated QR codes
 * @param htmlContent - HTML content to print
 */
function printQRCodes(htmlContent: string): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Failed to open print window. Please check your popup blocker settings.')
  }
  
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  // Wait for images to load before printing
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
  }
}

/**
 * Main function to generate all QR codes and trigger print
 * Orchestrates the entire QR generation workflow
 */
async function generateAllQRCodes(): Promise<void> {
  if (!isAuthenticated.value || !isAdmin.value) {
    uiStore.error('Access denied: Admin privileges required')
    return
  }

  isGeneratingQRs.value = true

  try {
    // Generate QR codes for all three services in parallel
    const qrPromises = [1, 2, 3].map(serviceNum => generateServiceQR(serviceNum))
    const qrDataArray = await Promise.all(qrPromises)

    // Create print layout
    const htmlContent = createPrintLayout(qrDataArray)

    // Trigger print dialog
    printQRCodes(htmlContent)

    uiStore.success('QR codes generated successfully. Print dialog opened.')
    console.log('📱 Generated QR codes for all 3 services')
  } catch (error) {
    console.error('Failed to generate QR codes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    uiStore.error(`Failed to generate QR codes: ${errorMessage}`)
  } finally {
    isGeneratingQRs.value = false
  }
}

// Data management functions
async function downloadAll() {
  if (!isAuthenticated.value || !isAdmin.value) {
    uiStore.error('Access denied: Admin privileges required')
    return
  }
  
  // Set default dates if not set (e.g., this month)
  if (!exportStartDate.value) {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    exportStartDate.value = firstDay.toISOString().split('T')[0]
    exportEndDate.value = today.toISOString().split('T')[0]
  }

  showExportModal.value = true
}

function closeExportModal() {
  showExportModal.value = false
}

async function executeDownload() {
  if (!isAuthenticated.value || !isAdmin.value) {
    uiStore.error('Access denied: Admin privileges required')
    return
  }

  if (!exportStartDate.value || !exportEndDate.value) {
    uiStore.error('Please select both start and end dates')
    return
  }

  if (exportStartDate.value > exportEndDate.value) {
     uiStore.error('Start date cannot be after end date')
     return
  }
  
  isDownloading.value = true
  
  try {
    const { getFirebaseInstances } = await import('@/utils/firebase')
    const { db } = getFirebaseInstances()
    
    if (!db) {
      throw new Error('Database not initialized')
    }
    
    const { collection, getDocs, Timestamp, query, limit } = await import('@/utils/firebase')
    let morphersCollection: any = collection(db, 'morphers')
    
    // Apply limit if test mode is enabled
    if (exportLimit100.value) {
       morphersCollection = query(morphersCollection, limit(100))
    }

    const snapshot = await getDocs(morphersCollection)
    
    if (snapshot.empty) {
      uiStore.info('No records to download')
      return
    }

    // Parse date range for filtering
    const startObj = new Date(exportStartDate.value)
    const endObj = new Date(exportEndDate.value)
    // Set time to ensure inclusive boundaries
    startObj.setHours(0, 0, 0, 0)
    endObj.setHours(23, 59, 59, 999)
    
    const data = snapshot.docs.map(doc => {
      const record = doc.data() as Record<string, any>
      const flatRecord: Record<string, any> = {}
      
      // Handle basic fields
      Object.keys(record).forEach(key => {
        if (key === 'attendance') {
          // Flatten attendance object - convert each attendance date to a column
          if (record.attendance && typeof record.attendance === 'object') {
            Object.keys(record.attendance).forEach(dateKey => {
               // dateKey format is "DD_MM_YYYY"
               // Parse date key to Date object for comparison
               const parts = dateKey.split('_')
               if (parts.length === 3) {
                  const day = parseInt(parts[0])
                  const month = parseInt(parts[1]) - 1 // JS months are 0-based
                  const year = parseInt(parts[2])
                  const attDate = new Date(year, month, day)
                  
                  // Filter by date range
                  if (attDate >= startObj && attDate <= endObj) {
                     flatRecord[`attendance_${dateKey}`] = record.attendance[dateKey]
                  }
               }
            })
          }
        } else if (record[key] && typeof record[key] === 'object') {
          // Handle Firestore Timestamps and other objects
          if (record[key].seconds !== undefined) {
            // Firestore Timestamp
            const timestamp = new Timestamp(record[key].seconds, record[key].nanoseconds || 0)
            flatRecord[key] = timestamp.toDate().toISOString()
          } else {
            // Other objects - convert to string
            flatRecord[key] = JSON.stringify(record[key])
          }
        } else {
          // Simple values
          flatRecord[key] = record[key] || ''
        }
      })
      
      return flatRecord
    })
    
    if (data.length === 0) {
      uiStore.info('No records to download')
      return
    }
    
    // Get all unique column headers from all records
    const allHeaders = new Set<string>()
    data.forEach(record => {
      Object.keys(record).forEach(key => allHeaders.add(key))
    })
    
    const attendanceHeaders: string[] = []
    const otherHeaders: string[] = []
    
    allHeaders.forEach(header => {
      if (header.startsWith('attendance_')) {
        attendanceHeaders.push(header)
      } else {
        otherHeaders.push(header)
      }
    })
    
    // Sort others alphabetically
    otherHeaders.sort()

    // Special Requirement: firstTimeOn should come before attendanceCount
    const ftoIndex = otherHeaders.indexOf('firstTimeOn')
    if (ftoIndex !== -1) {
      otherHeaders.splice(ftoIndex, 1) // Remove firstTimeOn
      const acIndex = otherHeaders.indexOf('attendanceCount')
      if (acIndex !== -1) {
        otherHeaders.splice(acIndex, 0, 'firstTimeOn') // Insert before attendanceCount
      } else {
        otherHeaders.push('firstTimeOn') // Fallback if attendanceCount missing
      }
    }

    // Sort attendance headers chronologically
    attendanceHeaders.sort((a, b) => {
      const getDateParts = (str: string) => {
        const parts = str.replace('attendance_', '').split('_')
        return {
          day: parseInt(parts[0]),
          month: parseInt(parts[1]),
          year: parseInt(parts[2])
        }
      }
      const dateA = getDateParts(a)
      const dateB = getDateParts(b)
      if (dateA.year !== dateB.year) return dateA.year - dateB.year
      if (dateA.month !== dateB.month) return dateA.month - dateB.month
      return dateA.day - dateB.day
    })

    // Construct final headers: Insert attendance headers after 'attendanceCount'
    const headers: string[] = []
    const countIndex = otherHeaders.indexOf('attendanceCount')
    
    if (countIndex !== -1) {
      // Insert attendance columns right after attendanceCount
      headers.push(...otherHeaders.slice(0, countIndex + 1))
      headers.push(...attendanceHeaders)
      headers.push(...otherHeaders.slice(countIndex + 1))
    } else {
      // Fallback if attendanceCount not found (shouldn't happen on standard records)
      headers.push(...otherHeaders)
      headers.push(...attendanceHeaders)
    }

    const headerRow = headers.join(',') + '\n'
    
    const rows = data.map(record => {
      return headers.map(header => {
        const value = record[header] || ''
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return '"' + value.replace(/"/g, '""') + '"'
        }
        return value
      }).join(',')
    }).join('\n')
    
    const csv = headerRow + rows
    
    // Download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `morphers-data-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    uiStore.success(`Downloaded ${data.length} records successfully`)
    closeExportModal()
  } catch (error) {
    console.error('Download error:', error)
    uiStore.error('Failed to download data')
  } finally {
    isDownloading.value = false
  }
}

// async function handleCSVFileInput(event: Event) {
  
//   const target = event.target as HTMLInputElement
//   const file = target.files?.[0]
  
//   if (!file) return
  
//   if (!file.name.toLowerCase().endsWith('.csv')) {
//     uiStore.error('Please select a CSV file')
//     return
//   }
  
//   try {
//     await uploadCSV(file)
//     // Reset file input
//     if (csvFileInput.value) {
//       csvFileInput.value.value = ''
//     }
//   } catch (error) {
//     console.error('Upload error:', error)
//     uiStore.error('Failed to upload CSV file')
//   }
// }

// async function uploadCSV(_file: File) {
//   if (!isAuthenticated.value || !isAdmin.value) {
//     uiStore.error('Access denied: Admin privileges required')
//     return
//   }
  
//   uiStore.info('CSV upload functionality not yet implemented')
//   // Implementation would go here
//   // TODO: Use _file parameter when implementing CSV upload
// }

// async function clearAllData() {
//   if (!isAuthenticated.value || !isAdmin.value) {
//     uiStore.error('Access denied: Admin privileges required')
//     return
//   }
  
//   const confirmed = confirm('⚠️ WARNING: This will permanently delete ALL morpher records!\n\nThis action cannot be undone. Are you absolutely sure?')
//   if (!confirmed) return
  
//   const doubleConfirm = confirm('This is your final warning! All data will be lost forever.\n\nType "DELETE" in the next prompt to confirm.')
//   if (!doubleConfirm) return
  
//   const finalConfirm = prompt('Type "DELETE" to confirm deletion of all data:')
//   if (finalConfirm !== 'DELETE') {
//     uiStore.info('Data deletion cancelled')
//     return
//   }
  
//   try {
//     // This would need to be implemented in the members store
//     uiStore.info('Clear all data functionality not yet implemented')
//   } catch (error) {
//     console.error('Clear data error:', error)
//     uiStore.error('Failed to clear data')
//   }
// }

// No longer need manual toast functions - using UI store
</script>

<style scoped>
/* Import admin styles directly */
@import '@/assets/admin-styles.css';

/* Ensure proper body styling for admin view */
html, body {
  background: linear-gradient(135deg, #163A59 0%, #0F2D47 100%);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Ensure the admin container takes full viewport */
.admin-container {
  min-height: 100vh;
}

/* Loading spinner animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
