// data.js

// Data medis berisi penyakit, gejala, dan respons
const medicalData = {
    // Daftar gejala umum yang ditanyakan pertama kali
    commonSymptoms: [
        "Demam",                // Umum
        "Batuk",                // Pernapasan
        "Pilek",                // Pernapasan
        "Diare",                // Pencernaan
        "Muntah",               // Pencernaan
        "Ruam",                 // Kulit (umum)
        "Kulit/mata kuning",    // Spesifik Penyakit Kuning
        "Sesak napas / napas cepat" // Kritis, ada di ISPA, Pneumonia, PJB
    ],

    // Daftar penyakit beserta detailnya
    diseases: [
        { // ISPA
            name: "Infeksi Saluran Pernapasan Akut (ISPA)",
            description: "Infeksi Saluran Pernapasan Akut (ISPA) adalah infeksi yang menyerang saluran pernapasan, khususnya hidung, tenggorokan, dan paru-paru. Pada bayi, ISPA dapat menyebabkan gejala yang lebih serius karena sistem kekebalan tubuh mereka yang belum berkembang sempurna.",
            treatment: "Istirahat yang cukup, pemberian ASI lebih sering, menjaga kelembapan udara, dan konsultasi dengan dokter untuk penanganan lebih lanjut. Jangan memberikan obat batuk tanpa resep dokter pada bayi.",
            prevention: "Menjaga kebersihan, memberikan ASI eksklusif, menghindari paparan asap rokok, dan menjauhkan bayi dari orang yang sedang sakit.",
            severity: "Sedang hingga berat, terutama pada bayi di bawah 6 bulan",
            symptomCategories: {
                "Pernapasan": ["batuk", "pilek", "hidung tersumbat", "sesak napas / napas cepat", "sakit tenggorokan"],
                "Umum": ["demam", "nafsu makan menurun", "rewel"]
            },
            references: [
                {
                    title: "ISPA pada Bayi - Alodokter",
                    url: "https://www.alodokter.com/ispa"
                }
            ]
        },
        { // Demam Tifoid
            name: "Demam Tifoid",
            description: "Demam tifoid adalah infeksi bakteri yang menyebar melalui makanan dan minuman yang terkontaminasi. Pada bayi, gejala demam tifoid bisa berbeda dengan orang dewasa dan cenderung lebih ringan.",
            treatment: "Pemberian antibiotik sesuai resep dokter, istirahat yang cukup, dan pemberian cairan yang cukup untuk mencegah dehidrasi.",
            prevention: "Menjaga kebersihan makanan dan minuman, mencuci tangan sebelum menyiapkan makanan untuk bayi, dan memastikan air yang digunakan untuk formula bayi sudah direbus dengan benar.",
            severity: "Sedang hingga berat, memerlukan penanganan medis",
            symptomCategories: {
                "Umum": ["demam tinggi berkepanjangan", "Demam", "lemas", "nafsu makan menurun"],
                "Pencernaan": ["sakit perut", "diare", "sembelit"],
                "Kepala dan Wajah": ["sakit kepala"]
            },
            references: [
                {
                    title: "Demam Tifoid pada Anak - Alodokter",
                    url: "https://www.alodokter.com/demam-tifoid"
                }
            ]
        },
        { // Diare
            name: "Diare",
            description: "Diare pada bayi ditandai dengan buang air besar yang lebih sering dan encer dari biasanya. Kondisi ini bisa berbahaya karena dapat menyebabkan dehidrasi dengan cepat pada bayi.",
            treatment: "Pemberian cairan lebih banyak (ASI atau oralit jika disarankan dokter), teruskan pemberian ASI, dan konsultasi dengan dokter jika diare berlangsung lebih dari 24 jam, disertai darah, atau tanda dehidrasi berat.",
            prevention: "Menjaga kebersihan botol susu, mencuci tangan sebelum menyentuh bayi, dan memastikan makanan bayi dipersiapkan dengan higienis.",
            severity: "Ringan hingga berat, tergantung tingkat dehidrasi",
            symptomCategories: {
                "Pencernaan": ["buang air besar encer", "buang air besar lebih sering", "Diare", "muntah", "sakit perut", "perut kembung"],
                "Umum": ["demam", "dehidrasi", "mulut kering", "mata cekung", "lemas", "rewel"]
            },
            references: [
                {
                    title: "Diare pada Bayi - Alodokter",
                    url: "https://www.alodokter.com/diare-pada-bayi"
                }
            ]
        },
        { // Penyakit Kuning
            name: "Penyakit Kuning (Neonatal Jaundice)",
            description: "Penyakit kuning (jaundice) pada bayi baru lahir terjadi karena tingginya kadar bilirubin dalam darah. Kondisi ini menyebabkan kulit dan bagian putih mata bayi berwarna kekuningan. Umumnya fisiologis (normal) tapi bisa juga patologis.",
            treatment: "Fototerapi (terapi cahaya), pemberian ASI lebih sering, dan dalam kasus berat mungkin diperlukan penanganan medis lebih lanjut seperti transfusi tukar. Tergantung penyebab dan kadar bilirubin.",
            prevention: "Pemberian ASI yang cukup dan sering, deteksi dini, serta pemeriksaan rutin pada bayi baru lahir.",
            severity: "Ringan hingga berat, tergantung kadar bilirubin dan penyebabnya",
            symptomCategories: {
                "Kulit": ["kulit berwarna kuning", "Kulit/mata kuning"],
                "Kepala dan Wajah": ["bagian putih mata berwarna kuning"],
                "Pencernaan": ["tinja berwarna pucat"],
                "Umum": ["bayi lemas", "tidak mau menyusu", "urine berwarna kuning pekat", "tidur terus"]
            },
            references: [
                {
                    title: "Penyakit Kuning pada Bayi - Alodokter",
                    url: "https://www.alodokter.com/penyakit-kuning-pada-bayi"
                }
            ]
        },
        { // Flu Singapura
            name: "Flu Singapura (HFMD)",
            description: "Flu Singapura atau Hand, Foot, and Mouth Disease (HFMD) adalah infeksi virus yang umumnya menyerang anak-anak di bawah usia 5 tahun. Penyakit ini ditandai dengan ruam atau luka lepuh pada tangan, kaki, dan mulut.",
            treatment: "Istirahat yang cukup, pemberian cairan yang cukup, dan obat pereda nyeri/demam (paracetamol/ibuprofen) jika diperlukan. Biasanya sembuh sendiri dalam 7-10 hari.",
            prevention: "Menjaga kebersihan tangan, menghindari kontak dengan penderita, dan membersihkan mainan atau benda yang sering disentuh bayi.",
            severity: "Ringan hingga sedang, jarang menyebabkan komplikasi serius",
            symptomCategories: {
                "Kulit": ["ruam merah/lepuh di telapak tangan", "ruam merah/lepuh di telapak kaki", "ruam di sekitar bokong", "Ruam"],
                "Kepala dan Wajah": ["luka/sariawan di dalam mulut", "sakit tenggorokan"],
                "Umum": ["demam", "nafsu makan menurun", "rewel"]
            },
            references: [
                {
                    title: "Flu Singapura pada Anak - Alodokter",
                    url: "https://www.alodokter.com/flu-singapura"
                }
            ]
        },
        { // Campak
            name: "Campak",
            description: "Campak adalah penyakit menular yang disebabkan oleh virus. Penyakit ini ditandai dengan demam, batuk, pilek, mata merah, diikuti ruam merah di seluruh tubuh. Sangat menular, terutama pada anak-anak yang belum divaksinasi.",
            treatment: "Istirahat yang cukup, pemberian cairan yang cukup, obat pereda demam, dan vitamin A (sesuai rekomendasi dokter). Perawatan suportif. Waspadai komplikasi.",
            prevention: "Vaksinasi MMR (Measles, Mumps, Rubella) sesuai jadwal imunisasi dan menghindari kontak dengan penderita campak.",
            severity: "Sedang hingga berat, dapat menyebabkan komplikasi serius seperti pneumonia atau ensefalitis",
            symptomCategories: {
                "Kulit": ["ruam merah makulopapular di seluruh tubuh (dimulai dari belakang telinga/wajah)", "Ruam"],
                "Pernapasan": ["batuk", "pilek"],
                "Kepala dan Wajah": ["mata merah dan berair", "bintik putih di dalam mulut (Koplik's spot)"],
                "Umum": ["demam tinggi", "Demam"]
            },
            references: [
                {
                    title: "Campak pada Anak - Alodokter",
                    url: "https://www.alodokter.com/campak"
                }
            ]
        },
        { // TB Anak
            name: "Tuberkulosis (TB Anak)",
            description: "Tuberkulosis (TB) adalah penyakit menular yang disebabkan oleh bakteri Mycobacterium tuberculosis. Pada bayi dan anak, TB bisa menyerang paru-paru (TB paru) atau organ lain (TB ekstra paru) dan gejalanya bisa tidak spesifik.",
            treatment: "Pengobatan TB pada bayi memerlukan kombinasi beberapa antibiotik (OAT - Obat Anti Tuberkulosis) selama minimal 6 bulan di bawah pengawasan ketat dokter.",
            prevention: "Vaksinasi BCG saat lahir, pemberian terapi pencegahan pada kontak erat penderita TB aktif, menjaga lingkungan sehat, dan deteksi dini.",
            severity: "Berat, memerlukan pengobatan jangka panjang dan kepatuhan",
            symptomCategories: {
                "Pernapasan": ["batuk lama (> 2 minggu)", "Batuk"],
                "Umum": ["demam lama (> 2 minggu)", "Demam", "berat badan tidak naik/turun", "lesu/tidak aktif", "berkeringat di malam hari (kurang spesifik pada anak)", "nafsu makan menurun", "pembesaran kelenjar getah bening"]
            },
            references: [
                // Referensi IDAI dihapus
            ]
        },
        { // Demam (Standalone)
            name: "Demam",
            description: "Demam adalah peningkatan suhu tubuh di atas normal (biasanya di atas 38°C), yang merupakan respons umum tubuh terhadap infeksi atau kondisi lain. Pada bayi, demam bisa menjadi tanda penyakit yang perlu diwaspadai dan seringkali merupakan gejala dari penyakit lain.",
            treatment: "Pantau suhu secara berkala, berikan cairan yang cukup (ASI/susu formula), kompres dengan air hangat (bukan dingin) di dahi atau lipatan ketiak/paha, kenakan pakaian tipis. Berikan obat penurun demam (paracetamol atau ibuprofen) HANYA jika diperlukan (suhu sangat tinggi atau bayi tampak sangat tidak nyaman) sesuai dosis anjuran dokter. Segera ke dokter jika demam sangat tinggi (>39°C pada bayi <3 bulan, >40°C pada usia lain), tidak turun dengan obat, berlangsung >3 hari, disertai kejang, sesak napas, dehidrasi, atau bayi tampak sangat sakit/lemas.",
            prevention: "Mengobati penyakit penyebab demam, menjaga kebersihan, melengkapi imunisasi, menghindari kontak dengan orang sakit.",
            severity: "Tergantung penyebab dan tinggi demam. Membutuhkan perhatian khusus pada bayi < 3 bulan.",
            symptomCategories: {
                "Umum": ["suhu tubuh tinggi", "Demam", "rewel", "lemas", "kurang aktif", "nafsu makan menurun", "kulit teraba hangat", "menggigil (kadang-kadang)"]
            },
            references: [
                {
                    title: "Demam pada Anak - Alodokter",
                    url: "https://www.alodokter.com/demam-pada-anak"
                }
            ]
        },
        { // Pneumonia
            name: "Pneumonia",
            description: "Pneumonia adalah infeksi yang menyebabkan peradangan pada kantung udara (alveoli) di satu atau kedua paru-paru. Pada bayi, ini bisa menjadi kondisi serius yang memerlukan perawatan medis segera.",
            treatment: "Membutuhkan diagnosis dan pengobatan dari dokter. Mungkin melibatkan antibiotik (jika disebabkan bakteri), obat antivirus (jika virus), perawatan suportif seperti oksigen, cairan infus, atau perawatan di rumah sakit.",
            prevention: "Melengkapi imunisasi (PCV, Hib, Campak, Pertusis), menjaga kebersihan tangan dan lingkungan, menjauhkan bayi dari asap rokok dan polusi udara, memberikan ASI eksklusif, mengobati ISPA dengan tepat.",
            severity: "Sedang hingga Berat, berpotensi mengancam jiwa terutama pada bayi dan anak kecil.",
            symptomCategories: {
                "Pernapasan": ["batuk", "napas cepat", "sesak napas / napas cepat", "tarikan dinding dada bawah", "napas berbunyi (mengi/grook)"],
                "Umum": ["demam", "menggigil", "lemas", "nafsu makan menurun", "rewel", "nyeri dada"],
                "Kulit": ["bibir atau kuku kebiruan (sianosis)"]
            },
            references: [
                {
                    title: "Pneumonia - Alodokter",
                    url: "https://www.alodokter.com/pneumonia"
                }
            ]
        },
        { // Ruam Popok
            name: "Ruam Popok (Dermatitis Popok)",
            description: "Ruam popok adalah iritasi kulit yang umum terjadi di area yang tertutup popok (pantat, paha, alat kelamin). Biasanya disebabkan oleh kontak lama dengan urin atau feses, gesekan popok, atau infeksi jamur/bakteri sekunder.",
            treatment: "Sering mengganti popok (segera setelah basah/kotor), bersihkan area popok dengan lembut menggunakan air hangat dan kapas (hindari tisu basah beralkohol/parfum), keringkan dengan menepuk lembut (jangan digosok), biarkan area popok terkena udara bebas sesekali (angin-anginkan), gunakan krim pelindung yang mengandung zinc oxide atau petrolatum. Konsultasi dokter jika ruam parah, meluas, melepuh, bernanah, disertai demam, atau tidak membaik dalam 2-3 hari (mungkin perlu krim antijamur atau antibiotik).",
            prevention: "Ganti popok secara teratur, bersihkan area popok dengan benar setiap kali ganti popok, pastikan kulit benar-benar kering sebelum memasang popok baru, pilih popok yang ukurannya pas dan menyerap baik, gunakan krim pelindung secara rutin.",
            severity: "Ringan hingga sedang, biasanya tidak berbahaya tapi bisa sangat mengganggu kenyamanan bayi.",
            symptomCategories: {
                "Kulit": ["kemerahan di area popok", "kulit mengkilap", "kulit lecet", "bintik-bintik merah", "melepuh (kadang)", "Ruam"],
                "Umum": ["tidak nyaman", "rewel saat ganti popok"]
            },
            references: [
                {
                    title: "Ruam Popok - Alodokter",
                    url: "https://www.alodokter.com/ruam-popok"
                }
            ]
        },
        { // Eksim
            name: "Eksim (Dermatitis Atopik)",
            description: "Eksim atau dermatitis atopik adalah kondisi peradangan kulit kronis (jangka panjang) dan kambuhan yang menyebabkan kulit menjadi kering, sangat gatal, kemerahan, dan terkadang pecah-pecah atau mengeluarkan cairan. Sering terkait dengan riwayat alergi (atopi) pada bayi atau keluarga.",
            treatment: "Fokus pada mengontrol gejala dan mencegah kekambuhan. Jaga kelembapan kulit dengan pelembap/emolien hipoalergenik sesering mungkin (terutama setelah mandi), mandi air hangat singkat (5-10 menit) dengan sabun lembut tanpa pewangi, hindari pemicu (alergen, iritan seperti sabun keras, deterjen, bahan pakaian kasar), gunakan obat oles kortikosteroid atau inhibitor kalsineurin sesuai resep dokter untuk meredakan peradangan saat kambuh, antihistamin bisa membantu mengurangi gatal.",
            prevention: "Menggunakan pelembap secara rutin, mengidentifikasi dan menghindari pemicu potensial (makanan, debu, bulu hewan, dll.), menggunakan sabun dan deterjen yang lembut, menjaga kuku bayi tetap pendek untuk mengurangi luka garukan.",
            severity: "Ringan hingga berat, dapat mengganggu tidur dan kualitas hidup bayi serta orang tua.",
            symptomCategories: {
                "Kulit": ["sangat gatal", "kulit kering", "bersisik", "ruam kemerahan", "Ruam", "lepuhan kecil", "kulit basah/berkerak", "kulit menebal"],
                "Lokasi (Bayi)": ["pipi", "dahi", "kulit kepala", "leher", "luar lengan/tungkai"]
            },
            references: [
                {
                    title: "Eksim Atopik - Alodokter",
                    url: "https://www.alodokter.com/eksim-atopik"
                }
            ]
        },
        { // PJB
            name: "Penyakit Jantung Bawaan (PJB)",
            description: "Penyakit Jantung Bawaan (PJB) adalah kelainan pada struktur atau fungsi jantung yang sudah ada sejak lahir. Jenis dan tingkat keparahannya sangat bervariasi, dari yang ringan tanpa gejala hingga yang kompleks dan mengancam jiwa.",
            treatment: "Sangat tergantung pada jenis dan keparahan PJB. Beberapa PJB ringan mungkin hanya perlu pemantauan. Lainnya mungkin memerlukan obat-obatan untuk membantu fungsi jantung atau mencegah komplikasi, prosedur intervensi menggunakan kateter, atau operasi jantung (kadang bertahap). Membutuhkan diagnosis dan penanganan oleh dokter spesialis jantung anak.",
            prevention: "Sebagian besar tidak dapat dicegah karena penyebabnya kompleks (genetik, lingkungan). Namun, perawatan prenatal yang baik oleh ibu (menghindari rokok, alkohol, obat-obatan terlarang, mengelola penyakit kronis seperti diabetes, vaksinasi rubella sebelum hamil) dapat membantu mengurangi risiko beberapa jenis PJB.",
            severity: "Ringan hingga Sangat Berat (kritis), memerlukan diagnosis dini dan penanganan yang tepat.",
            symptomCategories: {
                "Pernapasan": ["napas cepat", "kesulitan bernapas", "sesak napas / napas cepat", "sesak saat menyusu"],
                "Umum": ["mudah lelah saat menyusu", "berkeringat banyak saat menyusu", "pertumbuhan terhambat", "berat badan sulit naik", "bengkak (edema)", "sering sakit (infeksi paru)"],
                "Kulit": ["bibir/kulit/lidah/kuku kebiruan (sianosis)"],
                "Jantung (Tanda Klinis)": ["bunyi jantung abnormal (murmur/bising)"]
            },
            references: [
                {
                    title: "Penyakit Jantung Bawaan - Alodokter",
                    url: "https://www.alodokter.com/penyakit-jantung-bawaan"
                }
            ]
        },
        { // Infeksi Telinga
            name: "Infeksi Telinga Tengah (Otitis Media Akut - OMA)",
            description: "Otitis Media Akut (OMA) adalah peradangan atau infeksi pada telinga bagian tengah (ruang di belakang gendang telinga). Sangat umum terjadi pada bayi dan anak kecil, seringkali dipicu oleh infeksi saluran napas atas (seperti pilek atau flu).",
            treatment: "Tergantung usia anak dan keparahan gejala. Dokter mungkin merekomendasikan: observasi (wait-and-see) untuk kasus ringan pada anak usia tertentu, obat pereda nyeri dan demam (paracetamol atau ibuprofen), atau antibiotik jika dicurigai infeksi bakteri atau gejala berat/tidak membaik. Penting untuk konsultasi dokter untuk diagnosis yang tepat.",
            prevention: "Memberikan ASI eksklusif (minimal 6 bulan), menghindari paparan asap rokok, menjauhkan dari orang yang sakit ISPA, memastikan imunisasi lengkap (terutama PCV dan flu), menjaga kebersihan tangan, posisi menyusui agak tegak (untuk bayi botol).",
            severity: "Umumnya ringan hingga sedang, tetapi bisa menyebabkan nyeri hebat dan komplikasi jika tidak ditangani (misalnya gendang telinga pecah, infeksi menyebar, gangguan pendengaran).",
            symptomCategories: {
                "Telinga": ["menarik/memegang/menggosok telinga", "nyeri telinga", "keluar cairan dari telinga", "kurang respons terhadap suara"],
                "Umum": ["rewel", "menangis (terutama malam/berbaring)", "sulit tidur", "demam", "kehilangan keseimbangan", "nafsu makan menurun", "muntah", "diare"]
            },
            references: [
                {
                    title: "Otitis Media Akut - Alodokter",
                    url: "https://www.alodokter.com/otitis-media-akut"
                }
            ]
        },
        { // Kecacingan
            name: "Infeksi Cacing (Kecacingan)",
            description: "Kecacingan adalah infeksi pada usus yang disebabkan oleh berbagai jenis cacing parasit (yang paling umum pada anak: cacing kremi, cacing gelang, cacing tambang). Infeksi ini dapat mengganggu penyerapan nutrisi, menyebabkan anemia, dan mempengaruhi tumbuh kembang anak.",
            treatment: "Pemberian obat cacing yang sesuai dengan jenis cacing penyebab infeksi, sesuai resep dan dosis dari dokter. Seringkali seluruh anggota keluarga perlu diobati bersamaan untuk mencegah penularan ulang. Mengatasi komplikasi seperti anemia jika ada.",
            prevention: "Menjaga kebersihan diri (cuci tangan pakai sabun sebelum makan, setelah dari toilet, setelah bermain tanah), menjaga kuku tetap pendek dan bersih, mencuci bersih sayuran dan buah sebelum dimakan, memasak daging hingga matang sempurna, minum air bersih yang sudah dimasak, menggunakan alas kaki saat bermain di luar rumah (terutama di tanah), menjaga kebersihan lingkungan dan sanitasi (WC bersih).",
            severity: "Ringan hingga sedang. Infeksi berat atau kronis dapat menyebabkan malnutrisi, anemia, dan gangguan pertumbuhan.",
            symptomCategories: {
                "Pencernaan": ["gatal di sekitar anus (terutama malam)", "sakit perut", "mual", "muntah", "diare", "sulit buang air besar", "terlihat cacing di tinja/anus"],
                "Umum": ["nafsu makan berubah (turun/naik)", "berat badan tidak naik/turun", "pucat (anemia)", "lemas", "lesu", "rewel", "sulit tidur (karena gatal)"],
                "Pernapasan (jarang, cacing gelang)": ["batuk", "sesak napas"]
            },
            references: [
                {
                    title: "Cacingan - Alodokter",
                    url: "https://www.alodokter.com/cacingan"
                }
            ]
        }
    ],

    // Respons umum dari chatbot
    general_responses: {
        greeting: "Halo! Saya adalah asisten kesehatan virtual untuk bayi. Saya akan menanyakan beberapa gejala untuk membantu memperkirakan kemungkinan kondisi kesehatan bayi Anda.",
        disclaimer: "Perlu diingat bahwa informasi ini <strong>hanya bersifat perkiraan</strong> dan <strong>tidak menggantikan diagnosis atau konsultasi langsung dengan dokter anak</strong>. Jika bayi Anda tampak sakit parah, lemas, sulit bernapas, atau Anda sangat khawatir, <strong>segera bawa ke dokter atau fasilitas kesehatan terdekat.</strong>",
        no_match: "Berdasarkan gejala yang Anda berikan, saya tidak dapat mengidentifikasi kemungkinan kondisi spesifik dari database saya. Sebaiknya konsultasikan dengan dokter anak.",
        ask_start_over: "Apakah Anda ingin memulai konsultasi baru?",
        thank_you: "Terima kasih telah menggunakan layanan kami. Semoga bayi Anda lekas sembuh!"
    }
};
