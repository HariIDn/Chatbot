// auth.js

// --- 1. Inisialisasi Firebase ---
async function initializeFirebase() {
    if (window.firebaseApp) {
        console.log("Firebase sudah diinisialisasi sebelumnya.");
        if (window.firebaseAuth && !window.authObserverSet) {
            setupAuthObserver();
        }
        return;
    }

    try {
        const response = await fetch('/api/firebase-client-config');
        if (!response.ok) {
            throw new Error(`Gagal mengambil konfigurasi Firebase: ${response.statusText}`);
        }
        const firebaseConfig = await response.json();

        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.error("Konfigurasi Firebase dari API tidak lengkap:", firebaseConfig);
            Swal.fire('Error Konfigurasi', 'Gagal memuat konfigurasi Firebase dari server.', 'error');
            return;
        }

        window.firebaseApp = firebase.initializeApp(firebaseConfig);
        window.firebaseAuth = firebase.auth();
        window.firestoreDB = firebase.firestore();
        window.firebaseServicesReady = true;

        console.log("Firebase SDK berhasil diinisialisasi. Variabel global (window.firebaseAuth, window.firestoreDB) dan flag kesiapan telah diatur.");

        setupAuthObserver();

    } catch (error) {
        console.error("Error saat inisialisasi Firebase:", error);
        Swal.fire('Error Kritis', `Gagal menginisialisasi Firebase: ${error.message}`, 'error');
        window.firebaseServicesReady = false;
    }
}

// --- 2. Observer Status Autentikasi ---
function setupAuthObserver() {
    if (!window.firebaseAuth) {
        console.error("Firebase Auth belum siap untuk setupAuthObserver.");
        return;
    }
    if (window.authObserverSet) {
        console.log("Auth observer sudah di-set sebelumnya.");
        return;
    }

    window.firebaseAuth.onAuthStateChanged(async user => {
        window.authObserverSet = true;
        const currentPath = window.location.pathname;

        if (user) {
            console.log("Auth.js: Pengguna login:", user.uid, user.email);
            try {
                const idTokenResult = await user.getIdTokenResult(true);
                const isAdmin = idTokenResult.claims.admin === true;
                const isDoctor = (idTokenResult.claims.role === 'doctor' || idTokenResult.claims.doctor === true) && !isAdmin;

                if (currentPath === '/login' || currentPath.endsWith('/login.html')) {
                    if (isAdmin) {
                        window.location.href = '/admin';
                    } else if (isDoctor) {
                        window.location.href = '/doctor';
                    } else {
                        console.warn("Auth.js: Peran pengguna tidak dikenali:", idTokenResult.claims);
                        Swal.fire('Peran Tidak Dikenali', 'Tidak dapat menentukan peran Anda.', 'warning').then(() => {
                            if (window.firebaseAuth) window.firebaseAuth.signOut();
                        });
                    }
                } else if (currentPath === '/doctor' || currentPath.endsWith('/dashboard_doctor.html') || currentPath.endsWith('/doctor.html')) {
                    if (!isDoctor && !isAdmin) {
                        if (window.firebaseAuth) await window.firebaseAuth.signOut();
                        window.location.href = '/login';
                    } else {
                        console.log("Auth.js: Pengguna adalah DOKTER, di halaman dokter.");
                        if (typeof displayDoctorInfo === 'function') displayDoctorInfo(user);

                        let activeTabDoctor = 'dashboardSaya';
                        if (window.location.hash) {
                            const hashTarget = window.location.hash.substring(1);
                            if (document.getElementById(hashTarget)) {
                                activeTabDoctor = hashTarget;
                            }
                        }
                        if (typeof showContent === 'function') { // Fungsi dari dashboard_doctor.html
                            showContent(activeTabDoctor); // Ini akan memicu load data di dashboard_doctor.html
                        }
                    }
                } else if (currentPath === '/admin' || currentPath.endsWith('/dashboard_admin.html') || currentPath.endsWith('/admin.html')) {
                    if (!isAdmin) {
                        if (window.firebaseAuth) await window.firebaseAuth.signOut();
                        window.location.href = '/login';
                    } else {
                        console.log("Auth.js: Pengguna adalah ADMIN, di halaman admin.");
                        if (typeof displayAdminInfo === 'function') displayAdminInfo(user);

                        let activeTabAdmin = 'daftarPemeriksaan';
                        if (window.location.hash) {
                            const hashTarget = window.location.hash.substring(1);
                            if (document.getElementById(hashTarget) && hashTarget !== 'infoAdmin') {
                                activeTabAdmin = hashTarget;
                            }
                        }
                        if (activeTabAdmin !== 'infoAdmin' && document.getElementById('infoAdmin') && document.getElementById('infoAdmin').classList.contains('active')) {
                            document.getElementById('infoAdmin').classList.remove('active');
                        }

                        // Panggil showContent untuk mengatur UI tab
                        if (typeof showContent === 'function') { // Fungsi dari dashboard_admin.html
                            console.log("Auth.js: Memanggil showContent untuk tab:", activeTabAdmin, "dengan skipDataLoad=true");
                            showContent(activeTabAdmin, true); // Panggil showContent HANYA untuk UI, data dimuat di bawah
                        }

                        // Panggil fungsi pemuatan data secara eksplisit SETELAH memastikan layanan siap
                        if (window.firebaseServicesReady && window.firestoreDB) {
                            console.log("Auth.js: Layanan Firebase siap, memuat data untuk tab:", activeTabAdmin);
                            if (activeTabAdmin === "daftarPemeriksaan" && typeof fetchAndDisplayAppointments === 'function') {
                                console.log("Auth.js: Memanggil fetchAndDisplayAppointments.");
                                fetchAndDisplayAppointments();
                            } else if (activeTabAdmin === "kelolaDokter" && typeof loadDoctorAccounts === 'function') {
                                console.log("Auth.js: Memanggil loadDoctorAccounts.");
                                loadDoctorAccounts();
                            }
                            // Tambahkan else if untuk tab lain yang butuh pemuatan data awal
                        } else {
                            console.error("Auth.js: Layanan Firebase TIDAK SIAP saat mencoba memuat data awal untuk admin.");
                            // Mungkin tampilkan pesan error di UI dashboard
                            const appointmentsTableBody = document.getElementById('appointmentsTableBody');
                            if (appointmentsTableBody) appointmentsTableBody.innerHTML = '<tr><td colspan="7" class="text-center p-5">Gagal memuat layanan database. Coba muat ulang.</td></tr>';
                        }
                    }
                }
            } catch (error) {
                console.error("Auth.js: Error mendapatkan custom claims:", error);
                if (currentPath !== '/login' && !currentPath.endsWith('/login.html')) {
                    Swal.fire('Error Autentikasi', 'Gagal memverifikasi sesi Anda.', 'error');
                }
            }
        } else {
            console.log("Auth.js: Pengguna belum login.");
            const protectedPaths = ['/doctor', '/admin'];
            if (protectedPaths.some(p => currentPath === p ||
                currentPath.endsWith(p + ".html") ||
                currentPath.endsWith(p.substring(1) + ".html") ||
                currentPath.endsWith("dashboard_admin.html") ||
                currentPath.endsWith("dashboard_doctor.html"))) {
                window.location.href = '/login';
            }
        }
    });
}

// --- 3. Fungsi Login (handleLoginWithFirebase) ---
// ... (Tetap sama seperti di auth_js_with_ready_flag)
async function handleLoginWithFirebase() {
    if (!window.firebaseAuth) {
        Swal.fire('Error', 'Layanan autentikasi belum siap. Coba lagi.', 'error');
        return;
    }
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        Swal.fire('Input Diperlukan', 'Silakan masukkan email dan password.', 'warning');
        return;
    }

    Swal.fire({ title: 'Logging in...', text: 'Memverifikasi kredensial Anda...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        // onAuthStateChanged akan menangani pengalihan
    } catch (error) {
        console.error("Error login:", error);
        Swal.fire('Login Gagal', getFirebaseErrorMessage(error), 'error');
    }
}

// --- 4. Fungsi Logout ---
// ... (Tetap sama seperti di auth_js_with_ready_flag)
async function handleLogout(redirectTo = '/login') {
    if (!window.firebaseAuth) return;
    try {
        await window.firebaseAuth.signOut();
        console.log("Logout berhasil. Pengalihan akan ditangani oleh onAuthStateChanged.");
    } catch (error) {
        console.error("Error logout:", error);
        Swal.fire('Logout Gagal', error.message, 'error');
    }
}

// --- 5. Fungsi Lupa Password ---
// ... (Tetap sama seperti di auth_js_with_ready_flag)
async function handleForgotPassword(emailFieldId = 'email') {
    if (!window.firebaseAuth) {
        Swal.fire('Error', 'Layanan autentikasi belum siap. Coba lagi.', 'error');
        return;
    }
    const emailInput = document.getElementById(emailFieldId);
    if (!emailInput || !emailInput.value) {
        Swal.fire('Input Diperlukan', 'Silakan masukkan alamat email Anda.', 'warning');
        return;
    }
    const email = emailInput.value;

    Swal.fire({
        title: 'Mengirim Email Reset Password...',
        text: `Email akan dikirim ke ${email} jika terdaftar.`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        await window.firebaseAuth.sendPasswordResetEmail(email);
        Swal.fire('Email Terkirim!', 'Silakan periksa inbox email Anda (dan folder spam).', 'success');
    } catch (error) {
        console.error("Error kirim email reset password:", error);
        Swal.fire('Gagal Mengirim Email', getFirebaseErrorMessage(error), 'error');
    }
}

// --- 6. Fungsi untuk Dashboard (didefinisikan di HTML dashboard masing-masing) ---
// function updateDoctorDashboardInfo(user) { /* ... */ }
// function updateAdminDashboardInfo(user) { /* ... */ }
// function displayAdminInfo(user) { /* ... */ }
// function displayDoctorInfo(user) { /* ... */ }
// function showContent(targetId, skipDataLoad) { /* ... */ }


// --- 7. Fungsi Pengelolaan Akun Dokter (oleh Admin) ---
// ... (Semua fungsi pengelolaan dokter: handleAddDoctor, loadDoctorAccounts, dll. tetap sama, 
//      pastikan mereka menggunakan window.firebaseAuth.currentUser untuk token dan window.firestoreDB untuk database)
async function handleAddDoctor() {
    if (!window.firebaseAuth || !window.firestoreDB || !window.firebaseServicesReady) {
        Swal.fire('Error', 'Layanan autentikasi atau database belum siap.', 'error');
        return;
    }
    const email = document.getElementById('newDoctorEmail').value;
    const password = document.getElementById('newDoctorPassword').value;
    const displayName = document.getElementById('newDoctorDisplayName').value;

    if (!email || !password) {
        Swal.fire('Input Kurang', 'Email dan Password awal dokter wajib diisi.', 'warning');
        return;
    }
    Swal.fire({ title: 'Menambahkan Dokter...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        const adminUser = window.firebaseAuth.currentUser;
        if (!adminUser) {
            Swal.fire('Otentikasi Gagal', 'Sesi admin tidak ditemukan.', 'error');
            return;
        }
        const idToken = await adminUser.getIdToken();
        const response = await fetch('/api/admin/create-doctor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ email, password, displayName })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Gagal membuat akun: Server merespons ${response.status}`);
        }
        const result = await response.json();
        Swal.fire('Berhasil!', `Akun dokter untuk ${email} telah dibuat.`, 'success');
        const modalElement = document.getElementById('addDoctorModal');
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
        }
        const addDoctorForm = document.getElementById('addDoctorForm');
        if (addDoctorForm) addDoctorForm.reset();
        if (typeof loadDoctorAccounts === 'function') loadDoctorAccounts();
    } catch (error) {
        Swal.fire('Gagal Menambah Dokter', error.message, 'error');
    }
}

async function loadDoctorAccounts() {
    const tableBody = document.getElementById('doctorAccountsTableBody');
    if (!tableBody) return;
    if (!window.firebaseServicesReady || !window.firebaseAuth || !window.firebaseAuth.currentUser) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-warning p-4">Layanan autentikasi belum siap atau admin belum login.</td></tr>';
        return;
    }
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4"><div class="spinner-border text-primary"></div> Memuat...</td></tr>';
    try {
        const adminUser = window.firebaseAuth.currentUser;
        const idToken = await adminUser.getIdToken();
        const response = await fetch('/api/admin/list-doctors', {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Gagal mengambil daftar dokter: ${response.statusText}`);
        }
        const { users } = await response.json();
        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Belum ada akun dokter.</td></tr>';
            return;
        }
        let html = "";
        let doctorCounter = 0;
        users.forEach((doctor) => {
            const isActuallyDoctor = doctor.customClaims && (doctor.customClaims.role === 'doctor');
            if (!isActuallyDoctor) return;
            doctorCounter++;
            html += `
                <tr>
                    <th scope="row">${doctorCounter}</th>
                    <td>${doctor.displayName || 'N/A'}</td> 
                    <td>${doctor.email || 'N/A'}</td>
                    <td>${doctor.uid}</td>
                    <td><span class="badge ${doctor.disabled ? 'bg-secondary' : 'bg-success'}">${doctor.disabled ? 'Nonaktif' : 'Aktif'}</span></td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary" onclick="handleResetDoctorPassword('${doctor.email}')" title="Reset Password"><i class="fas fa-key"></i></button>
                        <button class="btn btn-sm ${doctor.disabled ? 'btn-outline-success' : 'btn-outline-warning'}" onclick="handleToggleDoctorStatus('${doctor.uid}', ${doctor.disabled})" title="${doctor.disabled ? 'Aktifkan' : 'Nonaktifkan'}"><i class="fas ${doctor.disabled ? 'fa-check-circle' : 'fa-ban'}"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="handleDeleteDoctorAccount('${doctor.uid}', '${doctor.email}')" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `;
        });
        if (!html) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Tidak ada akun dengan peran dokter.</td></tr>';
        } else {
            tableBody.innerHTML = html;
        }
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger p-4">Gagal: ${error.message}.</td></tr>`;
    }
}

async function handleResetDoctorPassword(email) {
    if (!window.firebaseAuth || !window.firebaseServicesReady) { Swal.fire('Error', 'Layanan autentikasi belum siap.', 'error'); return; }
    if (!email) { Swal.fire('Error', 'Email dokter tidak ditemukan.', 'error'); return; }
    Swal.fire({
        title: 'Reset Password Dokter', text: `Kirim email reset password ke ${email}?`,
        icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Kirim!', cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Mengirim Email...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                await window.firebaseAuth.sendPasswordResetEmail(email);
                Swal.fire('Email Terkirim!', `Email reset password telah dikirim ke ${email}.`, 'success');
            } catch (error) { Swal.fire('Gagal Reset', getFirebaseErrorMessage(error), 'error'); }
        }
    });
}

async function handleToggleDoctorStatus(uid, isDisabled) {
    if (!window.firebaseAuth || !window.firebaseAuth.currentUser || !window.firebaseServicesReady) {
        Swal.fire('Error', 'Sesi admin tidak valid atau layanan belum siap.', 'error'); return;
    }
    const actionText = isDisabled ? "mengaktifkan" : "menonaktifkan";
    Swal.fire({
        title: `Konfirmasi ${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Akun`,
        text: `Anda yakin ingin ${actionText} akun dokter ini (UID: ${uid})?`,
        icon: 'warning', showCancelButton: true, confirmButtonText: `Ya, ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}!`, cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const adminUser = window.firebaseAuth.currentUser;
                const idToken = await adminUser.getIdToken();
                const response = await fetch(`/api/admin/user/${uid}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ disabled: !isDisabled })
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Gagal: Server merespons ${response.status}`);
                }
                Swal.fire('Berhasil!', `Akun dokter telah di-${actionText}.`, 'success');
                if (typeof loadDoctorAccounts === 'function') loadDoctorAccounts();
            } catch (error) { Swal.fire('Gagal', `Tidak dapat ${actionText} akun: ${error.message}.`, 'error'); }
        }
    });
}

async function handleDeleteDoctorAccount(uid, email) {
    if (!window.firebaseAuth || !window.firebaseAuth.currentUser || !window.firebaseServicesReady) {
        Swal.fire('Error', 'Sesi admin tidak valid atau layanan belum siap.', 'error'); return;
    }
    Swal.fire({
        title: 'Hapus Akun Dokter',
        html: `Yakin hapus akun <strong>${email || uid}</strong> permanen? <br><strong class='text-danger'>Tidak dapat diurungkan!</strong>`,
        icon: 'error', showCancelButton: true, confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal', confirmButtonColor: '#dc3545'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus Akun...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const adminUser = window.firebaseAuth.currentUser;
                const idToken = await adminUser.getIdToken();
                const response = await fetch(`/api/admin/user/${uid}`, {
                    method: 'DELETE', headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Gagal menghapus: Server merespons ${response.status}`);
                }
                Swal.fire('Berhasil Dihapus!', `Akun dokter ${email || uid} telah dihapus.`, 'success');
                if (typeof loadDoctorAccounts === 'function') loadDoctorAccounts();
            } catch (error) { Swal.fire('Gagal Menghapus', `Tidak dapat menghapus akun: ${error.message}.`, 'error'); }
        }
    });
}

// --- Helper untuk pesan error Firebase ---
function getFirebaseErrorMessage(error) {
    // ... (fungsi getFirebaseErrorMessage Anda tetap sama)
    switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential': return 'Email atau password yang Anda masukkan salah.';
        case 'auth/wrong-password': return 'Password yang Anda masukkan salah.';
        case 'auth/invalid-email': return 'Format email tidak valid.';
        case 'auth/email-already-in-use': return 'Email ini sudah digunakan oleh akun lain.';
        case 'auth/weak-password': return 'Password terlalu lemah. Minimal 6 karakter.';
        case 'auth/requires-recent-login': return 'Operasi ini sensitif dan memerlukan login ulang.';
        case 'auth/too-many-requests': return 'Terlalu banyak percobaan gagal. Akun Anda mungkin terkunci sementara.';
        default: console.error("Firebase Auth Error:", error); return error.message || 'Terjadi kesalahan.';
    }
}

// --- Panggil Inisialisasi Firebase saat DOM siap ---
document.addEventListener('DOMContentLoaded', initializeFirebase);
