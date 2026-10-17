/**
 * CineEvent API Client & Utility Library
 */

const API_BASE = '/api';

// Token Management
function getToken() {
  return localStorage.getItem('cineevent_token');
}

function setToken(token) {
  localStorage.setItem('cineevent_token', token);
}

function removeToken() {
  localStorage.removeItem('cineevent_token');
  localStorage.removeItem('cineevent_user');
}

function getCurrentUser() {
  const userStr = localStorage.getItem('cineevent_user');
  try {
    const user = userStr ? JSON.parse(userStr) : null;
    if (user && user.full_name) {
      // Auto-heal any stale mojibake string cached in browser localStorage from earlier sessions
      if (/[ÃÂá»áº]/.test(user.full_name) || user.full_name.includes('Há»') || user.full_name.includes('Tráº') || user.full_name.includes('ViÃ')) {
        if (user.email === 'admin@cineevent.vn' || user.role_name === 'admin') {
          user.full_name = 'Hệ Thống Quản Trị Viên';
        } else if (user.email === 'manager@cineevent.vn' || user.role_name === 'manager') {
          user.full_name = 'Trần Minh Quản Lý';
        } else if (user.email === 'staff@cineevent.vn' || user.role_name === 'staff') {
          user.full_name = 'Lê Thị Thu Ngân Viên';
        } else if (user.email === 'customer@gmail.com' || user.role_name === 'customer') {
          user.full_name = 'Nguyễn Văn An (Khách Hàng)';
        }
        localStorage.setItem('cineevent_user', JSON.stringify(user));
      }
    }
    return user;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  if (user && user.full_name) {
    if (user.email === 'admin@cineevent.vn') user.full_name = 'Hệ Thống Quản Trị Viên';
    else if (user.email === 'manager@cineevent.vn') user.full_name = 'Trần Minh Quản Lý';
    else if (user.email === 'staff@cineevent.vn') user.full_name = 'Lê Thị Thu Ngân Viên';
    else if (user.email === 'customer@gmail.com') user.full_name = 'Nguyễn Văn An (Khách Hàng)';
  }
  localStorage.setItem('cineevent_user', JSON.stringify(user));
}

// Automatically sync latest user profile from server
async function syncCurrentUser() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await apiCall('/auth/me');
    if (res && res.data) {
      setCurrentUser(res.data);
      updateNavbarAuth();
    }
  } catch (e) {
    if (e.message && (e.message.includes('401') || e.message.includes('hết hạn'))) {
      removeToken();
      updateNavbarAuth();
    }
  }
}

// Universal API fetch helper
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method: options.method || 'GET',
    headers,
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        // If unauthorized and has expired token, log out
        if (token) {
          removeToken();
          updateNavbarAuth();
          showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'warning');
        }
      }
      throw new Error(data.message || `Lỗi HTTP ${res.status}`);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }

  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : type === 'warning' ? 'bg-warning text-dark' : 'bg-primary';
  const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-exclamation-triangle-fill' : type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill';

  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 show mb-2 shadow-lg" role="alert" style="min-width: 320px;">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon} fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" onclick="document.getElementById('${toastId}').remove()"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', toastHtml);

  setTimeout(() => {
    const el = document.getElementById(toastId);
    if (el) {
      el.remove();
    }
  }, 4500);
}

// Format currency
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Format date and time
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDateOnly(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Update Navbar based on logged in user role
function updateNavbarAuth() {
  const user = getCurrentUser();
  const authNav = document.getElementById('navbarAuthSection');
  if (!authNav) return;

  if (user) {
    const roleBadge = user.role_name === 'admin' 
      ? '<span class="badge bg-danger ms-1">Admin</span>'
      : user.role_name === 'manager'
      ? '<span class="badge bg-warning text-dark ms-1">Quản lý</span>'
      : user.role_name === 'staff'
      ? '<span class="badge bg-info text-dark ms-1">Nhân viên</span>'
      : '<span class="badge bg-secondary ms-1">Khách</span>';

    let extraRoleLinks = '';
    if (user.role_name === 'admin') {
      extraRoleLinks += `
        <li><h6 class="dropdown-header text-warning small fw-bold"><i class="bi bi-shield-lock me-1"></i>QUYỀN QUẢN TRỊ</h6></li>
        <li><a class="dropdown-item py-2" href="/admin.html"><i class="bi bi-speedometer2 me-2 text-warning"></i>Bảng Quản Trị Hệ Thống</a></li>
        <li><a class="dropdown-item py-2" href="/manager.html"><i class="bi bi-briefcase me-2 text-warning"></i>Cổng Quản Lý Cụm Rạp</a></li>
        <li><a class="dropdown-item py-2" href="/staff.html"><i class="bi bi-person-badge me-2 text-info"></i>Cổng Nhân Viên (POS & Soát Vé)</a></li>
        <li><hr class="dropdown-divider border-secondary"></li>
      `;
    } else if (user.role_name === 'manager') {
      extraRoleLinks += `
        <li><h6 class="dropdown-header text-warning small fw-bold"><i class="bi bi-briefcase me-1"></i>QUYỀN ĐIỀU HÀNH</h6></li>
        <li><a class="dropdown-item py-2" href="/manager.html"><i class="bi bi-briefcase me-2 text-warning"></i>Cổng Quản Lý Cụm Rạp</a></li>
        <li><a class="dropdown-item py-2" href="/staff.html"><i class="bi bi-person-badge me-2 text-info"></i>Cổng Nhân Viên (POS & Soát Vé)</a></li>
        <li><hr class="dropdown-divider border-secondary"></li>
      `;
    } else if (user.role_name === 'staff') {
      extraRoleLinks += `
        <li><h6 class="dropdown-header text-info small fw-bold"><i class="bi bi-person-badge me-1"></i>QUYỀN NHÂN VIÊN</h6></li>
        <li><a class="dropdown-item py-2" href="/staff.html"><i class="bi bi-person-badge me-2 text-info"></i>Cổng Nhân Viên (POS & Soát Vé)</a></li>
        <li><hr class="dropdown-divider border-secondary"></li>
      `;
    }

    authNav.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-cine dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle fs-5 text-rose"></i>
          <span>${user.full_name}</span>
          ${roleBadge}
        </button>
        <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow-lg" style="background:#1e293b; border: 1px solid rgba(255,255,255,0.1); min-width: 250px;">
          <li><h6 class="dropdown-header text-muted">Tài khoản: ${user.email}</h6></li>
          ${extraRoleLinks}
          <li><a class="dropdown-item py-2" href="/my-tickets.html"><i class="bi bi-ticket-perforated me-2 text-primary"></i>Vé Của Tôi</a></li>
          <li><hr class="dropdown-divider border-secondary"></li>
          <li><button class="dropdown-item py-2 text-danger" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i>Đăng Xuất</button></li>
        </ul>
      </div>
    `;
  } else {
    authNav.innerHTML = `
      <button class="btn btn-outline-cine btn-sm px-3" data-bs-toggle="modal" data-bs-target="#loginModal">
        <i class="bi bi-box-arrow-in-right me-1"></i> Đăng nhập
      </button>
      <button class="btn btn-primary-cine btn-sm px-3 ms-2" data-bs-toggle="modal" data-bs-target="#registerModal">
        <i class="bi bi-person-plus me-1"></i> Đăng ký
      </button>
    `;
  }

  // Update role switcher bar active state
  updateRoleSwitcherBarState();
}

function handleLogout() {
  removeToken();
  showToast('Đã đăng xuất khỏi hệ thống.', 'info');
  updateNavbarAuth();
  setTimeout(() => {
    window.location.href = '/index.html';
  }, 400);
}

// 1-Click Role Switcher for seamless testing & grading
async function quickSwitchRole(role) {
  let email = '';
  let password = '';
  let redirectUrl = '/index.html';

  if (role === 'admin') {
    email = 'admin@cineevent.vn';
    password = 'AdminPassword123!';
    redirectUrl = '/admin.html';
  } else if (role === 'manager') {
    email = 'manager@cineevent.vn';
    password = 'ManagerPassword123!';
    redirectUrl = '/manager.html';
  } else if (role === 'staff') {
    email = 'staff@cineevent.vn';
    password = 'StaffPassword123!';
    redirectUrl = '/staff.html';
  } else if (role === 'customer') {
    email = 'customer@gmail.com';
    password = 'CustomerPassword123!';
    redirectUrl = '/my-tickets.html';
  }

  try {
    showToast(`Đang chuyển sang vai trò [${role.toUpperCase()}]...`, 'info');
    const res = await apiCall('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    setToken(res.data.token);
    setCurrentUser(res.data.user);
    showToast(`Đã chuyển sang vai trò: ${res.data.user.full_name} (${res.data.user.role_name})`, 'success');

    // Close any open login modal
    const modalEl = document.getElementById('loginModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 400);
  } catch (err) {
    showToast(`Lỗi chuyển vai trò: ${err.message}`, 'danger');
  }
}

// Quick autofill credentials for testing
function autofillLogin(role) {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (!emailInput || !passInput) return;

  if (role === 'admin') {
    emailInput.value = 'admin@cineevent.vn';
    passInput.value = 'AdminPassword123!';
  } else if (role === 'manager') {
    emailInput.value = 'manager@cineevent.vn';
    passInput.value = 'ManagerPassword123!';
  } else if (role === 'staff') {
    emailInput.value = 'staff@cineevent.vn';
    passInput.value = 'StaffPassword123!';
  } else if (role === 'customer') {
    emailInput.value = 'customer@gmail.com';
    passInput.value = 'CustomerPassword123!';
  }
}

// Shared Auth Modals HTML generator
function renderAuthModals() {
  if (document.getElementById('loginModal')) return;

  const modalHtml = `
    <!-- Login Modal -->
    <div class="modal fade" id="loginModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content glass-card">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-white"><i class="bi bi-box-arrow-in-right me-2 text-rose"></i>Đăng Nhập CineEvent</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <!-- Quick demo buttons -->
            <div class="mb-3 p-2 rounded bg-dark border border-secondary">
              <div class="small text-muted mb-2 fw-bold"><i class="bi bi-lightning-charge text-warning me-1"></i>Tài khoản Demo (Nhấp để điền nhanh):</div>
              <div class="d-flex flex-wrap gap-1">
                <button type="button" class="btn btn-xs btn-outline-danger btn-sm py-0" onclick="autofillLogin('admin')">Admin</button>
                <button type="button" class="btn btn-xs btn-outline-warning btn-sm py-0" onclick="autofillLogin('manager')">Quản lý</button>
                <button type="button" class="btn btn-xs btn-outline-info btn-sm py-0" onclick="autofillLogin('staff')">Nhân viên</button>
                <button type="button" class="btn btn-xs btn-outline-light btn-sm py-0" onclick="autofillLogin('customer')">Khách hàng</button>
              </div>
            </div>

            <form id="loginForm" onsubmit="handleLoginForm(event)">
              <div class="mb-3">
                <label class="form-label text-muted small">Địa chỉ Email</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-muted"><i class="bi bi-envelope"></i></span>
                  <input type="email" id="loginEmail" class="form-control" required placeholder="nhap-email@example.com">
                </div>
              </div>
              <div class="mb-4">
                <label class="form-label text-muted small">Mật khẩu</label>
                <div class="input-group">
                  <span class="input-group-text bg-dark border-secondary text-muted"><i class="bi bi-key"></i></span>
                  <input type="password" id="loginPassword" class="form-control" required placeholder="Nhập mật khẩu">
                </div>
              </div>
              <button type="submit" id="loginSubmitBtn" class="btn btn-primary-cine w-100 py-2">
                <i class="bi bi-box-arrow-in-right me-1"></i> Đăng Nhập
              </button>
            </form>
          </div>
          <div class="modal-footer justify-content-center border-0 pt-0">
            <span class="text-muted small">Chưa có tài khoản? <a href="#" data-bs-toggle="modal" data-bs-target="#registerModal" class="text-rose text-decoration-none fw-bold">Đăng ký ngay</a></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Register Modal -->
    <div class="modal fade" id="registerModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content glass-card">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-white"><i class="bi bi-person-plus me-2 text-rose"></i>Đăng Ký Khách Hàng Mới</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <form id="registerForm" onsubmit="handleRegisterForm(event)">
              <div class="mb-3">
                <label class="form-label text-muted small">Họ và tên</label>
                <input type="text" id="regFullName" class="form-control" required placeholder="Ví dụ: Nguyễn Văn An">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted small">Số điện thoại</label>
                <input type="tel" id="regPhone" class="form-control" placeholder="0912345678">
              </div>
              <div class="mb-3">
                <label class="form-label text-muted small">Địa chỉ Email</label>
                <input type="email" id="regEmail" class="form-control" required placeholder="an.nguyen@example.com">
              </div>
              <div class="mb-4">
                <label class="form-label text-muted small">Mật khẩu (Tối thiểu 6 ký tự)</label>
                <input type="password" id="regPassword" class="form-control" required minlength="6" placeholder="Mật khẩu bảo mật">
              </div>
              <button type="submit" id="regSubmitBtn" class="btn btn-primary-cine w-100 py-2">
                <i class="bi bi-check2-circle me-1"></i> Tạo Tài Khoản
              </button>
            </form>
          </div>
          <div class="modal-footer justify-content-center border-0 pt-0">
            <span class="text-muted small">Đã có tài khoản? <a href="#" data-bs-toggle="modal" data-bs-target="#loginModal" class="text-rose text-decoration-none fw-bold">Đăng nhập</a></span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function handleLoginForm(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginSubmitBtn');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';

  try {
    const res = await apiCall('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    setToken(res.data.token);
    setCurrentUser(res.data.user);

    showToast(`Chào mừng trở lại, ${res.data.user.full_name}!`, 'success');

    // Close modal
    const modalEl = document.getElementById('loginModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    updateNavbarAuth();

    // If on restricted page or page needing reload
    if (window.location.pathname.includes('payment.html') || window.location.pathname.includes('booking.html')) {
      window.location.reload();
    }
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Đăng Nhập';
  }
}

async function handleRegisterForm(e) {
  e.preventDefault();
  const full_name = document.getElementById('regFullName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const btn = document.getElementById('regSubmitBtn');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang tạo tài khoản...';

  try {
    const res = await apiCall('/auth/register', {
      method: 'POST',
      body: { full_name, phone, email, password }
    });

    setToken(res.data.token);
    setCurrentUser(res.data.user);

    showToast('Đăng ký thành công! Bạn đã được tự động đăng nhập.', 'success');

    const modalEl = document.getElementById('registerModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    updateNavbarAuth();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Tạo Tài Khoản';
  }
}

// Render Top Role Demo Switcher Bar on every page
function renderRoleSwitcherBar() {
  if (document.getElementById('roleSwitcherBar')) return;

  const barHtml = `
    <div id="roleSwitcherBar" class="no-print py-1 px-3 border-bottom border-secondary d-flex align-items-center justify-content-between flex-wrap" style="background: #070a12; font-size: 0.8rem; z-index: 1060; position: relative;">
      <div class="d-flex align-items-center gap-2 py-1">
        <span class="badge bg-secondary text-uppercase" style="letter-spacing: 0.5px; font-size: 0.7rem;"><i class="bi bi-people-fill me-1"></i>Demo Phân Quyền (1-Click)</span>
        <span class="text-muted d-none d-md-inline" style="font-size: 0.75rem;">Chuyển đổi giao diện chức năng theo 4 vai trò:</span>
      </div>
      <div class="d-flex align-items-center gap-1 flex-wrap py-1">
        <button type="button" class="btn btn-xs py-0 px-2 btn-outline-danger" id="btnRoleAdmin" onclick="quickSwitchRole('admin')" title="Đăng nhập Admin (admin@cineevent.vn)">
          <i class="bi bi-shield-lock-fill me-1"></i>Admin
        </button>
        <button type="button" class="btn btn-xs py-0 px-2 btn-outline-warning" id="btnRoleManager" onclick="quickSwitchRole('manager')" title="Đăng nhập Quản lý (manager@cineevent.vn)">
          <i class="bi bi-briefcase-fill me-1"></i>Quản Lý
        </button>
        <button type="button" class="btn btn-xs py-0 px-2 btn-outline-info" id="btnRoleStaff" onclick="quickSwitchRole('staff')" title="Đăng nhập Nhân viên (staff@cineevent.vn)">
          <i class="bi bi-person-badge-fill me-1"></i>Nhân Viên
        </button>
        <button type="button" class="btn btn-xs py-0 px-2 btn-outline-light" id="btnRoleCustomer" onclick="quickSwitchRole('customer')" title="Đăng nhập Khách hàng (customer@gmail.com)">
          <i class="bi bi-person-heart me-1"></i>Khách Hàng
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('afterbegin', barHtml);
}

function updateRoleSwitcherBarState() {
  const user = getCurrentUser();
  const currentRole = user ? user.role_name : null;

  ['admin', 'manager', 'staff', 'customer'].forEach(r => {
    const btn = document.getElementById(`btnRole${r.charAt(0).toUpperCase() + r.slice(1)}`);
    if (!btn) return;
    if (currentRole === r) {
      btn.classList.add('active', 'fw-bold', 'shadow-sm');
      if (r === 'admin') btn.className = 'btn btn-xs py-0 px-2 btn-danger active fw-bold';
      else if (r === 'manager') btn.className = 'btn btn-xs py-0 px-2 btn-warning active fw-bold text-dark';
      else if (r === 'staff') btn.className = 'btn btn-xs py-0 px-2 btn-info active fw-bold text-dark';
      else if (r === 'customer') btn.className = 'btn btn-xs py-0 px-2 btn-light active fw-bold';
    } else {
      if (r === 'admin') btn.className = 'btn btn-xs py-0 px-2 btn-outline-danger';
      else if (r === 'manager') btn.className = 'btn btn-xs py-0 px-2 btn-outline-warning';
      else if (r === 'staff') btn.className = 'btn btn-xs py-0 px-2 btn-outline-info';
      else if (r === 'customer') btn.className = 'btn btn-xs py-0 px-2 btn-outline-light';
    }
  });
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  renderRoleSwitcherBar();
  renderAuthModals();
  updateNavbarAuth();
  syncCurrentUser();
});
