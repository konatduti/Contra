// Main JavaScript for Contra

document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const htmlEl = document.documentElement;
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
        htmlEl.setAttribute('data-bs-theme', storedTheme);
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = htmlEl.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
            htmlEl.setAttribute('data-bs-theme', current);
            localStorage.setItem('theme', current);
        });
    }

    const languageOptions = document.querySelectorAll('.language-option');
    if (languageOptions.length) {
        languageOptions.forEach((option) => {
            option.addEventListener('click', async (event) => {
                event.preventDefault();
                const language = option.getAttribute('data-lang');
                if (!language || language === htmlEl.getAttribute('lang')) {
                    return;
                }

                try {
                    localStorage.setItem('lang', language);
                } catch (err) {
                    console.warn('Unable to persist language in localStorage', err);
                }

                document.cookie = `lang=${language};path=/;max-age=31536000;samesite=Lax`;

                try {
                    const response = await fetch('/api/user/language', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ language }),
                    });
                    if (!response.ok && response.status !== 401) {
                        console.error('Failed to persist language preference', await response.text());
                    }
                } catch (error) {
                    console.error('Language preference request failed', error);
                }

                window.location.reload();
            });
        });
    }
    // File upload handling
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('file');
    const filePreview = document.getElementById('filePreview');
    const submitBtn = document.getElementById('submitBtn');
    const uploadForm = document.getElementById('uploadForm');
    const uploadMessages = uploadForm
        ? {
              missing: uploadForm.dataset.errorMissing || 'Please select a file to upload.',
              invalidType: uploadForm.dataset.errorType || 'Invalid file type.',
              tooLarge: uploadForm.dataset.errorSize || 'File is too large (max 50MB).',
              loading: uploadForm.dataset.loading || 'Uploading and Analyzing...'
          }
        : null;
    const fileError = document.getElementById('fileError');
    const allowTrainingSwitch = document.getElementById('allowTraining');
    const creditHelp = document.getElementById('creditHelp');
    const creditSelect = document.getElementById('credit_type');

    if (allowTrainingSwitch) {
        allowTrainingSwitch.addEventListener('change', function() {
            if (creditHelp) {
                creditHelp.classList.toggle('text-success', this.checked);
                creditHelp.classList.toggle('fw-semibold', this.checked);
            }
            if (this.checked && creditSelect && creditSelect.options.length) {
                creditSelect.value = creditSelect.options[0].value;
            }
        });
    }

    if (uploadZone && fileInput) {
        // Drag and drop functionality
        uploadZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileSelection(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                clearFileError();
                handleFileSelection(e.target.files[0]);
            }
        });

        // Form submission
        if (uploadForm) {
            uploadForm.addEventListener('submit', function(e) {
                const file = fileInput.files[0];
                const allowed = ['pdf','docx','png','jpg','jpeg','gif','bmp','tiff','tif'];
                if (!file) {
                    e.preventDefault();
                    showFileError(uploadMessages?.missing || 'Please select a file to upload.');
                    return;
                }
                const ext = file.name.split('.').pop().toLowerCase();
                if (!allowed.includes(ext)) {
                    e.preventDefault();
                    showFileError(uploadMessages?.invalidType || 'Invalid file type.');
                    return;
                }
                if (file.size > 50 * 1024 * 1024) {
                    e.preventDefault();
                    showFileError(uploadMessages?.tooLarge || 'File is too large (max 50MB).');
                    return;
                }
                clearFileError();
                showLoading(submitBtn, uploadMessages?.loading || 'Uploading and Analyzing...');
            });
        }
    }

    document.querySelectorAll('.document-delete-form').forEach(form => {
        form.addEventListener('submit', event => {
            const message = form.dataset.confirmMessage || 'Are you sure? This action cannot be undone.';
            if (!window.confirm(message)) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    });

    // Auto-refresh for pending analyses
    if (window.location.pathname.includes('/analysis/')) {
        const statusElements = document.querySelectorAll('[data-status]');
        statusElements.forEach(function(element) {
            const status = (element.dataset.status || '').toLowerCase();
            if (status === 'pending') {
                // Auto-refresh after 5 seconds
                setTimeout(function() {
                    location.reload();
                }, 5000);
            }
        });
    }

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(function(tooltip) {
        new bootstrap.Tooltip(tooltip);
    });

    // Initialize popovers
    const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
    popovers.forEach(function(popover) {
        new bootstrap.Popover(popover);
    });

    // Member search/filter
    const memberSearch = document.getElementById('memberSearch');
    const roleFilter = document.getElementById('roleFilter');
    function filterMembers() {
        const search = memberSearch ? memberSearch.value.toLowerCase() : '';
        const roleVal = roleFilter ? roleFilter.value : '';
        document.querySelectorAll('#membersTable tbody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            const role = row.getAttribute('data-role');
            const matchSearch = !search || text.includes(search);
            const matchRole = !roleVal || role === roleVal;
            row.style.display = matchSearch && matchRole ? '' : 'none';
        });
    }
    if (memberSearch) {
        memberSearch.addEventListener('input', filterMembers);
    }
    if (roleFilter) {
        roleFilter.addEventListener('change', filterMembers);
    }

    const visitTypeFilter = document.getElementById('visitTypeFilter');
    const visitDateFilter = document.getElementById('visitDateFilter');
    function filterVisits() {
        const type = visitTypeFilter ? (visitTypeFilter.value || 'all').toLowerCase() : 'all';
        const date = visitDateFilter ? visitDateFilter.value : '';
        document.querySelectorAll('#recentVisitsTable tbody tr[data-visit-type]').forEach((row) => {
            const rowType = (row.dataset.visitType || 'unknown').toLowerCase();
            const rowDate = row.dataset.visitDate || '';
            const typeMatch = type === 'all' || rowType === type;
            const dateMatch = !date || rowDate === date;
            const isVisible = typeMatch && dateMatch;
            row.classList.toggle('d-none', !isVisible);
            const detailsRow = row.nextElementSibling;
            if (detailsRow && detailsRow.dataset.visitDetailsFor === row.dataset.visitId) {
                if (!isVisible && detailsRow.classList.contains('show')) {
                    const collapseInstance = bootstrap.Collapse.getInstance(detailsRow);
                    if (collapseInstance) {
                        collapseInstance.hide();
                    } else {
                        new bootstrap.Collapse(detailsRow, { toggle: false }).hide();
                    }
                }
                detailsRow.classList.toggle('d-none', !isVisible);
            }
        });
    }
    if (visitTypeFilter) {
        visitTypeFilter.addEventListener('change', filterVisits);
    }
    if (visitDateFilter) {
        visitDateFilter.addEventListener('change', filterVisits);
    }

    // Increment/decrement buttons for credit inputs
    document.querySelectorAll('.increment').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.closest('.input-group').querySelector('input');
            input.stepUp();
        });
    });
    document.querySelectorAll('.decrement').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.closest('.input-group').querySelector('input');
            input.stepDown();
        });
    });
});

function handleFileSelection(file) {
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileIcon = document.getElementById('fileIcon');
    const uploadZone = document.getElementById('uploadZone');
    const fileLabel = document.getElementById('fileLabel');
    const fileHelp = document.getElementById('fileHelp');

    if (filePreview && fileName && fileSize && fileIcon) {
        // Update file info
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);

        // Update icon based on file type
        const extension = file.name.split('.').pop().toLowerCase();
        fileIcon.className = 'fas fa-2x';
        
        if (extension === 'pdf') {
            fileIcon.classList.add('fa-file-pdf', 'text-danger');
        } else if (extension === 'docx') {
            fileIcon.classList.add('fa-file-word', 'text-primary');
        } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'tif'].includes(extension)) {
            fileIcon.classList.add('fa-file-image', 'text-info');
        } else {
            fileIcon.classList.add('fa-file', 'text-secondary');
        }

        // Show preview
        filePreview.classList.remove('d-none');

        // Hide upload zone content
        const uploadContent = document.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.style.display = 'none';
        }
        if (uploadZone) {
            uploadZone.classList.add('d-none');
            uploadZone.setAttribute('aria-hidden', 'true');
        }
        if (fileLabel) {
            fileLabel.classList.add('d-none');
        }
        if (fileHelp) {
            fileHelp.classList.add('d-none');
        }
    }
}

function clearFile() {
    const fileInput = document.getElementById('file');
    const filePreview = document.getElementById('filePreview');
    const uploadContent = document.querySelector('.upload-content');
    const uploadZone = document.getElementById('uploadZone');
    const fileLabel = document.getElementById('fileLabel');
    const fileHelp = document.getElementById('fileHelp');

    if (fileInput) {
        fileInput.value = '';
    }

    if (filePreview) {
        filePreview.classList.add('d-none');
    }

    if (uploadContent) {
        uploadContent.style.display = 'block';
    }

    if (uploadZone) {
        uploadZone.classList.remove('d-none');
        uploadZone.removeAttribute('aria-hidden');
    }
    if (fileLabel) {
        fileLabel.classList.remove('d-none');
    }
    if (fileHelp) {
        fileHelp.classList.remove('d-none');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showFileError(message) {
    const fileError = document.getElementById('fileError');
    const fileInput = document.getElementById('file');
    if (fileError && fileInput) {
        fileError.textContent = message;
        fileError.classList.remove('d-none');
        fileInput.classList.add('is-invalid');
    }
}

function clearFileError() {
    const fileError = document.getElementById('fileError');
    const fileInput = document.getElementById('file');
    if (fileError && fileInput) {
        fileError.textContent = '';
        fileError.classList.add('d-none');
        fileInput.classList.remove('is-invalid');
    }
}

// Loading animation for buttons
function showLoading(button, text) {
    button.innerHTML = `<span class="loading me-2"></span>${text}`;
    button.disabled = true;
}

function hideLoading(button, text) {
    button.innerHTML = text;
    button.disabled = false;
}

// Utility function for API calls
function makeRequest(url, options = {}) {
    return fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error('Request failed:', error);
        throw error;
    });
}

// Flash message handling
function showFlashMessage(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
});

// Unhandled promise rejection
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
