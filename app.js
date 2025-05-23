// ------------------- app.js (Gabungan & Terproteksi) -------------------
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

const indexRouter = require('./routes/index');

const app = express();

try {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error("Variabel GOOGLE_APPLICATION_CREDENTIALS belum diatur di file .env. Pastikan path ke file serviceAccountKey.json sudah benar.");
    }
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin SDK berhasil diinisialisasi.");
} catch (error) {
    console.error("Error inisialisasi Firebase Admin SDK:", error.message);
    process.exit(1);
}

const db = admin.firestore();

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Map untuk mengkonversi kunci hari ke nama hari yang ditampilkan
const dayKeyToNameMap = {
    "senin": "Senin",
    "selasa": "Selasa",
    "rabu": "Rabu",
    "kamis": "Kamis",
    "jumat": "Jumat",
    "sabtu": "Sabtu"
};

async function verifyAdminToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak disediakan atau format salah.' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        if (decodedToken.admin === true) {
            return next();
        } else {
            return res.status(403).json({ success: false, message: 'Akses ditolak. Anda tidak memiliki hak akses admin.' });
        }
    } catch (error) {
        console.error('Error verifikasi token:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ success: false, message: 'Token sudah kedaluwarsa. Silakan login kembali.' });
        }
        return res.status(401).json({ success: false, message: 'Token tidak valid atau gagal diverifikasi.' });
    }
}

app.use('/', indexRouter);

/**
 * Endpoint untuk submit janji temu pasien.
 */
app.post('/api/submit-appointment', async (req, res) => {
    console.log("APP.JS: Received data for /api/submit-appointment:", JSON.stringify(req.body, null, 2));

    try {
        const {
            patientName, visitType, appointmentFullDateTime, doctorUID, doctorDisplayName,
            serviceDetails, appointmentDayName, appointmentTimeSlot // Ditambahkan secara eksplisit
        } = req.body;

        // Validasi data yang diterima
        if (!patientName) {
            console.error("APP.JS: Validation failed: patientName is missing.");
            return res.status(400).json({ success: false, message: "Data yang dikirim tidak lengkap: Nama Pasien tidak ada." });
        }
        if (!visitType) {
            console.error("APP.JS: Validation failed: visitType is missing.");
            return res.status(400).json({ success: false, message: "Data yang dikirim tidak lengkap: Jenis Kunjungan tidak ada." });
        }
        if (!appointmentFullDateTime) {
            console.error("APP.JS: Validation failed: appointmentFullDateTime is missing.");
            return res.status(400).json({ success: false, message: "Data yang dikirim tidak lengkap: Waktu Janji Temu tidak ada." });
        }
        if (!doctorUID) {
            console.error("APP.JS: Validation failed: doctorUID is missing.");
            return res.status(400).json({ success: false, message: "Data yang dikirim tidak lengkap: ID Dokter tidak ada." });
        }
        if (!appointmentDayName || !appointmentTimeSlot) {
            console.error("APP.JS: Validation failed: appointmentDayName or appointmentTimeSlot is missing.");
            return res.status(400).json({ success: false, message: "Data yang dikirim tidak lengkap: Hari atau Jam Janji Temu tidak ada." });
        }

        if (visitType === 'bayi') {
            if (!serviceDetails || !serviceDetails.type) {
                console.error("APP.JS: Validation failed: babyService type is missing from serviceDetails.");
                return res.status(400).json({ success: false, message: "Layanan bayi harus dipilih." });
            }
        } else if (visitType === 'keluhan') {
            if (!serviceDetails || !serviceDetails.description) {
                console.error("APP.JS: Validation failed: complaint description is missing from serviceDetails.");
                return res.status(400).json({ success: false, message: "Deskripsi keluhan harus diisi." });
            }
        }

        let appointmentTimestamp = null;
        try {
            const timeParts = appointmentTimeSlot.split(' - ')[0].split(':');
            // Gunakan appointmentDayName yang sudah divalidasi
            if (appointmentDayName && timeParts.length === 2) {
                const now = new Date();
                const dayOfWeekMap = { "minggu": 0, "senin": 1, "selasa": 2, "rabu": 3, "kamis": 4, "jumat": 5, "sabtu": 6 };
                const targetDay = dayOfWeekMap[appointmentDayName.toLowerCase()];
                if (targetDay !== undefined) {
                    let dateToSet = new Date(now);
                    dateToSet.setDate(now.getDate() + (targetDay + 7 - now.getDay()) % 7);
                    dateToSet.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
                    appointmentTimestamp = admin.firestore.Timestamp.fromDate(dateToSet);
                } else {
                    console.warn("APP.JS: Nama hari tidak valid untuk membuat timestamp:", appointmentDayName);
                }
            }
        } catch (e) {
            console.error("APP.JS: Error creating timestamp for appointment:", e);
        }

        const appointmentData = {
            patientName,
            visitType,
            serviceDetails,
            appointmentFullDateTime: appointmentFullDateTime,
            appointmentDayName,
            appointmentTimeSlot,
            doctorUID: doctorUID,
            doctorDisplayName: doctorDisplayName || null,
            appointmentTimestamp: appointmentTimestamp,
            status: "Menunggu", // Status awal janji temu
            submittedAt: admin.firestore.FieldValue.serverTimestamp() // Timestamp saat data disubmit
        };

        console.log("APP.JS: Attempting to add appointment data to Firestore:", JSON.stringify(appointmentData, null, 2));
        const docRef = await db.collection('janjiTemu').add(appointmentData);
        console.log("APP.JS: Dokumen janji temu berhasil ditulis dengan ID: ", docRef.id);

        res.status(201).json({
            success: true, message: 'Janji temu berhasil didaftarkan!', appointmentId: docRef.id
        });
    } catch (error) {
        console.error("APP.JS: Error saat menyimpan janji temu ke Firestore: ", error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menyimpan janji temu.' });
    }
});

/**
 * Endpoint baru untuk mendapatkan daftar dokter yang tersedia pada hari dan jam tertentu.
 */
app.get('/api/available-doctors', async (req, res) => {
    const { dayKey, timeSlot } = req.query; // Dapatkan dayKey (e.g., 'senin') dan timeSlot (e.g., '08:00 - 09:00') dari query
    console.log(`APP.JS: Request for available doctors for day: ${dayKey}, time: ${timeSlot}`);

    if (!dayKey || !timeSlot) {
        return res.status(400).json({ success: false, message: "Day and time slot are required." });
    }

    try {
        const availableDoctors = [];
        // Ambil semua jadwal dokter dari koleksi 'doctorSchedules'
        const doctorSchedulesSnapshot = await db.collection('doctorSchedules').get();

        for (const doc of doctorSchedulesSnapshot.docs) {
            const doctorUID = doc.id;
            const scheduleData = doc.data();
            const doctorDisplayName = scheduleData.doctorName || doctorUID; // Gunakan nama dokter dari jadwal atau UID

            // Periksa apakah dokter memiliki slot 'available' untuk hari dan jam yang diminta
            if (scheduleData.schedules &&
                scheduleData.schedules[dayKey] && // Pastikan hari ada dalam jadwal
                scheduleData.schedules[dayKey][timeSlot] === 'available') {

                const BOOKING_LIMIT_PER_SLOT = 2; // Batas booking per slot, harus konsisten dengan frontend

                // Selanjutnya, periksa jumlah booking yang sudah ada untuk dokter dan slot ini
                const bookingsSnapshot = await db.collection("janjiTemu")
                    .where("appointmentDayName", "==", dayKeyToNameMap[dayKey]) // Gunakan nama hari lengkap
                    .where("appointmentTimeSlot", "==", timeSlot)
                    .where("doctorUID", "==", doctorUID)
                    .where("status", "in", ["Menunggu", "Diproses"]) // Hanya hitung booking yang masih aktif
                    .get();

                // Jika jumlah booking saat ini kurang dari batas, tambahkan dokter ke daftar yang tersedia
                if (bookingsSnapshot.size < BOOKING_LIMIT_PER_SLOT) {
                    availableDoctors.push({
                        uid: doctorUID,
                        displayName: doctorDisplayName
                    });
                }
            }
        }
        console.log(`APP.JS: Found ${availableDoctors.length} available doctors for ${dayKey}, ${timeSlot}.`);
        res.status(200).json({ success: true, doctors: availableDoctors });

    } catch (error) {
        console.error("APP.JS: Error fetching available doctors:", error);
        res.status(500).json({ success: false, message: "Failed to fetch available doctors." });
    }
});


app.post('/api/admin/create-doctor', verifyAdminToken, async (req, res) => {
    console.log(`APP.JS: Permintaan pembuatan dokter oleh admin: ${req.user.email} (UID: ${req.user.uid})`);
    const { email, password, displayName } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email dan password dokter wajib diisi." });
    }
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: displayName,
            emailVerified: false,
            disabled: false
        });
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'doctor' });
        res.status(201).json({ success: true, uid: userRecord.uid, message: 'Akun dokter berhasil dibuat dengan peran dokter.' });
    } catch (error) {
        console.error('APP.JS: Error creating new user:', error);
        let errorMessage = 'Gagal membuat akun dokter.';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'Email yang Anda masukkan sudah terdaftar.';
        } else if (error.code === 'auth/invalid-password') {
            errorMessage = 'Password tidak valid. Password harus terdiri dari minimal 6 karakter.';
        }
        res.status(500).json({ success: false, message: errorMessage });
    }
});

app.get('/api/admin/list-doctors', verifyAdminToken, async (req, res) => {
    console.log(`APP.JS: Permintaan daftar dokter oleh admin: ${req.user.email}`);
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const doctors = listUsersResult.users
            .filter(user => user.customClaims && user.customClaims.role === 'doctor')
            .map(user => ({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                disabled: user.disabled,
                customClaims: user.customClaims
            }));
        console.log("APP.JS: Mengirim daftar dokter aktif:", doctors.length, "dokter.");
        res.status(200).json({ success: true, users: doctors });
    } catch (error) {
        console.error('APP.JS: Error listing doctors:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil daftar dokter.' });
    }
});

app.put('/api/admin/user/:uid/status', verifyAdminToken, async (req, res) => {
    const { uid } = req.params;
    const { disabled } = req.body;
    console.log(`APP.JS: Permintaan ubah status UID ${uid} oleh admin: ${req.user.email}, set disabled: ${disabled}`);
    if (typeof disabled !== 'boolean') {
        return res.status(400).json({ success: false, message: 'Status "disabled" harus berupa nilai boolean.' });
    }
    try {
        await admin.auth().updateUser(uid, { disabled: disabled });
        res.status(200).json({ success: true, message: `Status akun UID ${uid} berhasil diperbarui.` });
    } catch (error) {
        console.error(`APP.JS: Error updating user ${uid} status:`, error);
        res.status(500).json({ success: false, message: `Gagal memperbarui status akun: ${error.message}` });
    }
});

app.delete('/api/admin/user/:uid', verifyAdminToken, async (req, res) => {
    const { uid } = req.params;
    console.log(`APP.JS: Permintaan hapus UID ${uid} oleh admin: ${req.user.email}`);
    try {
        await admin.auth().deleteUser(uid);
        res.status(200).json({ success: true, message: `Akun UID ${uid} berhasil dihapus.` });
    } catch (error) {
        console.error(`APP.JS: Error deleting user ${uid}:`, error);
        res.status(500).json({ success: false, message: `Gagal menghapus akun: ${error.message}` });
    }
});

app.get('/api/admin/doctor-schedule/:doctorId', verifyAdminToken, async (req, res) => {
    const { doctorId } = req.params;
    console.log(`APP.JS: GET /api/admin/doctor-schedule/${doctorId} - Diminta oleh admin: ${req.user.email}`);
    try {
        const scheduleDocRef = db.collection('doctorSchedules').doc(doctorId);
        console.log(`APP.JS: Mencoba mengambil dokumen dari doctorSchedules/${doctorId}`);
        const docSnap = await scheduleDocRef.get();

        if (docSnap.exists) {
            console.log(`APP.JS: Jadwal ditemukan untuk ${doctorId}:`, docSnap.data());
            res.status(200).json({ success: true, schedule: docSnap.data() });
        } else {
            console.log(`APP.JS: Jadwal TIDAK ditemukan untuk dokter UID: ${doctorId}. Mengirim 404.`);
            res.status(404).json({ success: false, message: 'Jadwal belum diatur untuk dokter ini.' });
        }
    } catch (error) {
        console.error(`APP.JS: Error fetching doctor schedule for ${doctorId}:`, error);
        res.status(500).json({ success: false, message: 'Gagal mengambil jadwal dokter.', error: error.message });
    }
});

app.post('/api/admin/doctor-schedule/:doctorId', verifyAdminToken, async (req, res) => {
    const { doctorId } = req.params;
    const newScheduleData = req.body;
    console.log(`APP.JS: POST /api/admin/doctor-schedule/${doctorId} - Diminta oleh admin: ${req.user.email}`);
    console.log(`APP.JS: Data jadwal yang diterima:`, JSON.stringify(newScheduleData, null, 2));

    if (!newScheduleData || typeof newScheduleData.schedules !== 'object' || Object.keys(newScheduleData.schedules).length === 0) {
        console.warn("APP.JS: Data jadwal tidak valid atau field 'schedules' kosong/tidak ada.");
        return res.status(400).json({ success: false, message: 'Data jadwal tidak valid atau field "schedules" kosong/tidak ada.' });
    }

    try {
        const scheduleDocRef = db.collection('doctorSchedules').doc(doctorId);
        let doctorDisplayName = 'Dokter';
        try {
            const doctorUserRecord = await admin.auth().getUser(doctorId);
            doctorDisplayName = doctorUserRecord.displayName || doctorUserRecord.email.split('@')[0];
            console.log(`APP.JS: Nama dokter untuk jadwal: ${doctorDisplayName}`);
        } catch (e) {
            console.warn(`APP.JS: Tidak dapat mengambil displayName untuk dokter UID: ${doctorId}`, e.message);
        }

        const dataToSet = {
            schedules: newScheduleData.schedules,
            doctorId: doctorId,
            doctorName: doctorDisplayName,
            lastUpdatedBy: req.user.uid,
            lastUpdatedByName: req.user.email,
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        console.log(`APP.JS: Data yang akan disimpan ke Firestore:`, JSON.stringify(dataToSet, null, 2));

        await scheduleDocRef.set(dataToSet, { merge: true });
        console.log(`APP.JS: Jadwal untuk ${doctorId} berhasil disimpan/diperbarui.`);
        res.status(200).json({ success: true, message: 'Jadwal dokter berhasil disimpan.' });
    } catch (error) {
        console.error(`APP.JS: Error saving doctor schedule for ${doctorId}:`, error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan jadwal dokter.', error: error.message });
    }
});

app.get('/api/public/doctor-schedule/:doctorId', async (req, res) => {
    const { doctorId } = req.params;
    console.log(`APP.JS: RESERVATION FORM: Meminta jadwal untuk dokter UID: ${doctorId}`);
    try {
        const scheduleDocRef = db.collection('doctorSchedules').doc(doctorId);
        const docSnap = await scheduleDocRef.get();

        if (docSnap.exists) {
            const scheduleData = docSnap.data();
            const availableSchedule = { schedules: {} };
            if (scheduleData && scheduleData.schedules) {
                for (const day in scheduleData.schedules) {
                    availableSchedule.schedules[day] = {};
                    for (const slot in scheduleData.schedules[day]) {
                        if (scheduleData.schedules[day][slot] === 'available') {
                            availableSchedule.schedules[day][slot] = 'available';
                        }
                    }
                    if (Object.keys(availableSchedule.schedules[day]).length === 0) {
                        delete availableSchedule.schedules[day];
                    }
                }
            }
            if (Object.keys(availableSchedule.schedules).length > 0) {
                console.log(`APP.JS: RESERVATION FORM: Jadwal tersedia ditemukan untuk ${doctorId}:`, availableSchedule);
                res.status(200).json({ success: true, schedule: availableSchedule });
            } else {
                console.log(`APP.JS: RESERVATION FORM: Tidak ada slot tersedia dalam jadwal dokter UID: ${doctorId}.`);
                res.status(404).json({ success: false, message: 'Tidak ada jadwal tersedia untuk dokter ini saat ini.' });
            }
        } else {
            console.log(`APP.JS: RESERVATION FORM: Jadwal TIDAK ditemukan untuk dokter UID: ${doctorId}.`);
            res.status(404).json({ success: false, message: 'Jadwal tidak tersedia untuk dokter ini.' });
        }
    } catch (error) {
        console.error(`APP.JS: RESERVATION FORM: Error fetching doctor schedule for ${doctorId}:`, error);
        res.status(500).json({ success: false, message: 'Gagal mengambil jadwal dokter.', error: error.message });
    }
});

app.get('/api/doctors-list', async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const activeDoctors = listUsersResult.users
            .filter(user =>
                user.customClaims &&
                user.customClaims.role === 'doctor' &&
                !user.disabled
            )
            .map(user => ({
                uid: user.uid,
                displayName: user.displayName || user.email.split('@')[0]
            }));

        console.log("APP.JS: Mengirim daftar dokter aktif:", activeDoctors.length, "dokter.");
        res.status(200).json({ success: true, doctors: activeDoctors });

    } catch (error) {
        console.error('APP.JS: Error fetching doctors list:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil daftar dokter.', error: error.message });
    }
});

app.get('/api/firebase-client-config', (req, res) => {
    const clientConfig = {
        apiKey: process.env.FRONTEND_FIREBASE_API_KEY,
        authDomain: process.env.FRONTEND_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FRONTEND_FIREBASE_PROJECT_ID,
        storageBucket: process.env.FRONTEND_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FRONTEND_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FRONTEND_FIREBASE_APP_ID,
    };
    if (!clientConfig.apiKey || !clientConfig.projectId) {
        console.error("APP.JS: Konfigurasi Firebase Client tidak lengkap di .env.");
        return res.status(500).json({ success: false, message: "Konfigurasi server tidak lengkap." });
    }
    res.json(clientConfig);
});

async function searchAlodokter(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://www.alodokter.com/cari?q=${encodedQuery}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        let result = '';
        $('.card-post').each((i, el) => {
            if (i < 1) {
                const title = $(el).find('.card-post-title').text().trim();
                const snippet = $(el).find('.card-post-excerpt').text().trim();
                if (title && snippet) {
                    result = `Dari Alodokter - ${title}: ${snippet}`;
                }
            }
        });
        return result || "Tidak ada hasil ditemukan di Alodokter.";
    } catch (error) {
        console.error('APP.JS: Error searching Alodokter:', error);
        return "Gagal mencari informasi di Alodokter.";
    }
}

async function fetchAlodokterInfo(url, diseaseName) {
    try {
        if (!url.startsWith('https://www.alodokter.com/')) {
            return `Hanya informasi dari Alodokter yang didukung. URL yang diberikan: ${url}`;
        }
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const articleContent = $('.post-content p').first().text().trim();
        if (articleContent) {
            return `Informasi tambahan tentang ${diseaseName} dari Alodokter: ${articleContent}`;
        } else {
            return `Tidak dapat mengekstrak informasi dari halaman Alodokter untuk ${diseaseName}.`;
        }
    } catch (error) {
        console.error('APP.JS: Error fetching Alodokter info:', error);
        return `Gagal mengambil informasi detail dari Alodokter untuk ${diseaseName}.`;
    }
}

app.get('/api/fetch-medical-info', async (req, res) => {
    const { url, diseaseName } = req.query;
    if (!url || !diseaseName) {
        return res.status(400).json({ error: 'URL dan nama penyakit dibutuhkan.' });
    }
    try {
        const additionalInfo = await fetchAlodokterInfo(url, diseaseName);
        res.json({ info: additionalInfo });
    } catch (error) {
        console.error('APP.JS: Error fetching medical info:', error);
        res.status(500).json({ error: 'Gagal mengambil informasi medis.' });
    }
});

app.get('/api/search-external', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Query pencarian dibutuhkan.' });
    }
    try {
        const alodokterResults = await searchAlodokter(query);
        res.json({ results: alodokterResults });
    } catch (error) {
        console.error('APP.JS: Error searching Alodokter:', error);
        res.status(500).json({ error: 'Gagal melakukan pencarian di Alodokter.' });
    }
});

app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

module.exports = app;
