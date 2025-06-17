// script.js

// DOM Elements
const chatLog = document.getElementById('chat-log');

// Conversation state
const conversationState = {
    stage: 'initial_choice', // initial_choice, symptom_consultation_started, initial_symptom_selection, follow_up, diagnosis, offering_reservation, finished
    initialSymptomsSelected: [],
    possibleDiseases: [],
    askedFollowUpSymptoms: [],
    negativeSymptoms: [],
    followUpCount: 0,
    maxFollowUps: 5
};

// --- Initialization ---
window.onload = function () {
    displayBotMessage(medicalData.general_responses.greeting);
    setTimeout(() => {
        showInitialOptions();
    }, 1000);
};

// --- Fungsi: Menampilkan Pilihan Awal (Reservasi / Konsultasi) ---
function showInitialOptions() {
    conversationState.stage = 'initial_choice';
    conversationState.initialSymptomsSelected = [];
    conversationState.possibleDiseases = [];
    conversationState.askedFollowUpSymptoms = [];
    conversationState.negativeSymptoms = [];
    conversationState.followUpCount = 0;

    displayBotMessage("Selamat datang di Klinik Si Kecil! Apa yang bisa kami bantu hari ini?", false);

    const choiceWrapper = createChoiceWrapper();
    const buttonContainer = choiceWrapper.querySelector('.choice-buttons');

    const reservationButton = document.createElement('button');
    reservationButton.className = 'choice-button primary-action-button';
    reservationButton.textContent = "Buat Reservasi";
    reservationButton.addEventListener('click', () => {
        disableChoiceButtons(buttonContainer, true);
        displayUserMessage("Saya ingin membuat reservasi.");
        displayBotMessage("Baik, Anda akan diarahkan ke halaman reservasi kami.");
        setTimeout(() => {
            window.location.href = 'reservation'; // GANTI DENGAN URL FORMULIR RESERVASI ANDA
        }, 1500);
    });
    buttonContainer.appendChild(reservationButton);

    const consultationButton = document.createElement('button');
    consultationButton.className = 'choice-button secondary-action-button';
    consultationButton.textContent = "Konsultasi Gejala Bayi";
    consultationButton.addEventListener('click', () => {
        disableChoiceButtons(buttonContainer, true);
        displayUserMessage("Saya ingin konsultasi gejala bayi.");
        conversationState.stage = 'symptom_consultation_started';
        displayBotMessage(medicalData.general_responses.disclaimer, true);
        setTimeout(() => {
            startInitialSymptomSelection();
        }, 1500);
    });
    buttonContainer.appendChild(consultationButton);

    chatLog.appendChild(choiceWrapper);
    scrollToBottom();
}


// --- Core Logic Functions ---

// 1. Start: Ask for initial common symptoms
function startInitialSymptomSelection() {
    conversationState.stage = 'initial_symptom_selection';
    if (conversationState.initialSymptomsSelected.length > 0 || conversationState.possibleDiseases.length > 0) {
        conversationState.initialSymptomsSelected = [];
        conversationState.possibleDiseases = [];
        conversationState.askedFollowUpSymptoms = [];
        conversationState.negativeSymptoms = [];
        conversationState.followUpCount = 0;
    }

    displayBotMessage("Silakan pilih <strong>satu atau lebih</strong> gejala umum utama yang paling menonjol pada bayi Anda:", true);

    const symptomsChoiceWrapper = createChoiceWrapper(); // Wrapper untuk tombol gejala
    const symptomButtonContainer = symptomsChoiceWrapper.querySelector('.choice-buttons');
    // Tidak perlu ID global untuk symptomButtonContainer jika kita selalu mereferensikannya secara lokal

    medicalData.commonSymptoms.forEach(symptom => {
        const button = document.createElement('button');
        button.className = 'choice-button initial-symptom-button';
        button.textContent = symptom;
        button.dataset.symptom = symptom;
        button.addEventListener('click', () => {
            // Kirimkan referensi ke symptomButtonContainer dan actionButtonContainer
            toggleInitialSymptom(button, actionButtonContainer);
        });
        symptomButtonContainer.appendChild(button);
    });
    chatLog.appendChild(symptomsChoiceWrapper);

    const actionButtonContainer = document.createElement('div');
    actionButtonContainer.className = 'action-buttons-container animate__animated animate__fadeInUp';
    // Tidak perlu ID global untuk actionButtonContainer

    const proceedButton = document.createElement('button');
    proceedButton.className = 'choice-button proceed-button';
    // ID 'proceed-initial-button' tidak lagi krusial untuk seleksi, tapi bisa dipertahankan untuk styling
    proceedButton.id = 'proceed-initial-button';
    proceedButton.textContent = "Lanjutkan";
    proceedButton.disabled = true;
    proceedButton.addEventListener('click', () => {
        // Nonaktifkan tombol gejala yang ada di dalam symptomsChoiceWrapper
        if (symptomsChoiceWrapper) {
            const actualSymptomButtons = symptomsChoiceWrapper.querySelector('.choice-buttons');
            if (actualSymptomButtons) {
                disableChoiceButtons(actualSymptomButtons);
            }
        }
        // Nonaktifkan tombol di actionButtonContainer ini
        disableChoiceButtons(actionButtonContainer, true);
        proceedAfterInitialSelection();
    });
    actionButtonContainer.appendChild(proceedButton);

    const noSymptomsButton = document.createElement('button');
    noSymptomsButton.className = 'choice-button';
    noSymptomsButton.textContent = "Tidak ada gejala di atas";
    noSymptomsButton.addEventListener('click', () => {
        if (symptomsChoiceWrapper) {
            const actualSymptomButtons = symptomsChoiceWrapper.querySelector('.choice-buttons');
            if (actualSymptomButtons) {
                disableChoiceButtons(actualSymptomButtons);
            }
        }
        disableChoiceButtons(actionButtonContainer, true);
        displayUserMessage("Tidak ada gejala di atas");
        displayBotMessage("Jika bayi Anda tidak menunjukkan gejala yang disebutkan, namun Anda tetap khawatir, sangat disarankan untuk berkonsultasi langsung dengan dokter anak.");
        offerReservationOrRestart();
    });
    actionButtonContainer.appendChild(noSymptomsButton);

    chatLog.appendChild(actionButtonContainer);
    scrollToBottom();
}

// 2. Handle selection of initial symptoms (toggle)
// Sekarang menerima actionContainer sebagai argumen untuk menemukan tombol "Lanjutkan" yang benar
function toggleInitialSymptom(symptomButton, currentActionContainer) {
    const symptom = symptomButton.dataset.symptom;
    let proceedButton = null;

    if (currentActionContainer) {
        proceedButton = currentActionContainer.querySelector('.proceed-button');
    }

    if (!proceedButton) {
        console.error("Tombol Lanjutkan tidak ditemukan dalam actionContainer yang diberikan.");
        return;
    }

    if (conversationState.initialSymptomsSelected.includes(symptom)) {
        conversationState.initialSymptomsSelected = conversationState.initialSymptomsSelected.filter(s => s !== symptom);
        symptomButton.classList.remove('selected');
    } else {
        conversationState.initialSymptomsSelected.push(symptom);
        symptomButton.classList.add('selected');
    }
    proceedButton.disabled = conversationState.initialSymptomsSelected.length === 0;
}

// 3. Proceed after initial symptoms are selected
function proceedAfterInitialSelection() {
    if (conversationState.initialSymptomsSelected.length === 0) {
        displayBotMessage("Anda belum memilih gejala awal. Silakan pilih gejala atau mulai lagi.");
        resetChat();
        return;
    }
    displayUserMessage(`Gejala awal yang dipilih: ${conversationState.initialSymptomsSelected.join(', ')}`);

    // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
    console.log("DEBUG: proceedAfterInitialSelection - Gejala awal yang dipilih:", conversationState.initialSymptomsSelected);

    updatePossibleDiseases();

    // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
    console.log("DEBUG: proceedAfterInitialSelection - Penyakit potensial setelah pemilihan awal:", conversationState.possibleDiseases.map(d => d.name));


    if (conversationState.possibleDiseases.length === 0) {
        displayBotMessage(medicalData.general_responses.no_match);
        showGeneralSymptomInfo(conversationState.initialSymptomsSelected);
    } else if (conversationState.possibleDiseases.length === 1) {
        showDiagnosis(conversationState.possibleDiseases[0]);
    } else {
        conversationState.stage = 'follow_up';
        askFollowUpQuestion();
    }
}

// 4. Update possible diseases
function updatePossibleDiseases() {
    // Pastikan semua gejala yang diproses di-trim
    const initialSymptomsLower = conversationState.initialSymptomsSelected.map(s => s.toLowerCase().trim());
    const positiveFollowUps = conversationState.askedFollowUpSymptoms.filter(s => !conversationState.negativeSymptoms.includes(s)).map(s => s.toLowerCase().trim());
    const currentSelectedSymptomsLower = conversationState.initialSymptomsSelected.concat(positiveFollowUps).map(s => s.toLowerCase().trim());
    const negativeSymptomsLower = conversationState.negativeSymptoms.map(s => s.toLowerCase().trim());
    const isInitialFilter = conversationState.askedFollowUpSymptoms.length === 0 && conversationState.negativeSymptoms.length === 0;

    let potentialDiseases = [];

    // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
    console.log("DEBUG: updatePossibleDiseases - Gejala positif saat ini:", currentSelectedSymptomsLower);
    console.log("DEBUG: updatePossibleDiseases - Gejala negatif saat ini:", negativeSymptomsLower);
    console.log("DEBUG: updatePossibleDiseases - Apakah filter awal?", isInitialFilter);

    // Deklarasikan variabel di luar blok if/else
    let hasAllSelected = true;
    let hasDisprovedSymptom = false;


    medicalData.diseases.forEach(disease => {
        const allDiseaseSymptoms = [];
        for (const category in disease.symptomCategories) {
            // Pastikan semua gejala dari data.js juga di-trim
            disease.symptomCategories[category].forEach(symptom => {
                allDiseaseSymptoms.push(symptom.toLowerCase().trim());
            });
        }
        const allDiseaseSymptomsLower = allDiseaseSymptoms; // Sudah di-lowercase dan trim di atas
        let isPossible = false;

        // --- Log tambahan untuk setiap penyakit ---
        console.log(`DEBUG: updatePossibleDiseases - Memproses penyakit: ${disease.name}`);
        console.log(`  Gejala penyakit (lowercased & trimmed):`, allDiseaseSymptomsLower);


        if (isInitialFilter) {
            if (initialSymptomsLower.length > 0) {
                isPossible = initialSymptomsLower.some(initialSymptom =>
                    // Reverted to flexible check: does the disease's symptom list contain the initial symptom, or vice versa?
                    allDiseaseSymptomsLower.some(ds => ds.includes(initialSymptom) || initialSymptom.includes(ds))
                );
            }
        } else {
            // Reset for each disease in the loop
            hasAllSelected = true;
            hasDisprovedSymptom = false;

            if (currentSelectedSymptomsLower.length > 0) {
                for (const selected of currentSelectedSymptomsLower) {
                    // Periksa apakah gejala yang dipilih ada di antara gejala penyakit (fleksibel)
                    const foundMatch = allDiseaseSymptomsLower.some(ds => ds.includes(selected) || selected.includes(ds));
                    console.log(`    Checking positive symptom: "${selected}" in ${disease.name}. Found: ${foundMatch}`);
                    if (!foundMatch) {
                        hasAllSelected = false;
                        break;
                    }
                }
            }

            // Kita ingin memastikan bahwa penyakit TIDAK memiliki gejala yang disangkal (negatif).
            // Jika ada gejala negatif yang ditemukan dalam daftar gejala penyakit, maka penyakit tersebut TIDAK mungkin.
            if (negativeSymptomsLower.length > 0) {
                for (const negative of negativeSymptomsLower) {
                    // Jika gejala negatif ADA di antara gejala penyakit (fleksibel), maka penyakit ini dikesampingkan.
                    const foundNegativeMatch = allDiseaseSymptomsLower.some(ds => ds.includes(negative) || negative.includes(ds));
                    console.log(`    Checking negative symptom: "${negative}" in ${disease.name}. Found: ${foundNegativeMatch}`);
                    if (foundNegativeMatch) {
                        hasDisprovedSymptom = true;
                        break;
                    }
                }
            }

            isPossible = hasAllSelected && !hasDisprovedSymptom; // Menggunakan hasDisprovedSymptom
        }

        if (isPossible) {
            let matchScore = 0;
            currentSelectedSymptomsLower.forEach(selected => {
                // Flexible check for scoring
                if (allDiseaseSymptomsLower.some(ds => ds.includes(selected) || selected.includes(ds))) {
                    matchScore++;
                }
            });
            potentialDiseases.push({ disease: disease, score: matchScore });
        }
        // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
        console.log(`DEBUG: updatePossibleDiseases - Hasil untuk ${disease.name}. isPossible: ${isPossible}`);
        if (!isPossible) {
            console.log(`  Alasan tidak mungkin: hasAllSelected=${hasAllSelected}, hasDisprovedSymptom=${hasDisprovedSymptom}`);
        }
    });

    potentialDiseases.sort((a, b) => b.score - a.score);
    conversationState.possibleDiseases = potentialDiseases.map(item => item.disease);
    console.log("Updated Possible Diseases:", conversationState.possibleDiseases.map(d => d.name)); // Ini sudah ada, bagus!
}

// 5. Ask follow-up questions
function askFollowUpQuestion() {
    // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
    console.log("DEBUG: askFollowUpQuestion - Memulai pertanyaan lanjutan. possibleDiseases.length:", conversationState.possibleDiseases.length);
    console.log("DEBUG: askFollowUpQuestion - followUpCount:", conversationState.followUpCount, "maxFollowUps:", conversationState.maxFollowUps);


    if (conversationState.followUpCount >= conversationState.maxFollowUps ||
        conversationState.possibleDiseases.length <= 1) {
        if (conversationState.possibleDiseases.length > 0) {
            showDiagnosis(conversationState.possibleDiseases[0]);
        } else {
            displayBotMessage(medicalData.general_responses.no_match);
            showGeneralSymptomInfo(conversationState.initialSymptomsSelected);
        }
        return;
    }

    const distinguishingSymptom = getDistinguishingSymptoms();

    // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
    console.log("DEBUG: askFollowUpQuestion - Gejala pembeda yang ditemukan:", distinguishingSymptom);

    if (!distinguishingSymptom) {
        // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
        console.log("DEBUG: askFollowUpQuestion - Tidak ada gejala pembeda yang ditemukan. Mengarah ke diagnosis atau no_match.");

        if (conversationState.possibleDiseases.length > 0) {
            showDiagnosis(conversationState.possibleDiseases[0]);
        } else {
            displayBotMessage(medicalData.general_responses.no_match);
            showGeneralSymptomInfo(conversationState.initialSymptomsSelected);
        }
        return;
    }

    conversationState.followUpCount++;
    conversationState.askedFollowUpSymptoms.push(distinguishingSymptom);
    displayBotMessage(`Apakah bayi Anda juga mengalami: <strong>${distinguishingSymptom}</strong>?`, true);

    const choiceWrapper = createChoiceWrapper();
    const buttonContainer = choiceWrapper.querySelector('.choice-buttons');

    const yesButton = document.createElement('button');
    yesButton.className = 'choice-button';
    yesButton.textContent = "Ya";
    yesButton.addEventListener('click', () => {
        disableChoiceButtons(buttonContainer, true);
        displayUserMessage("Ya");
        updatePossibleDiseases();
        askFollowUpQuestion();
    });
    buttonContainer.appendChild(yesButton);

    const noButton = document.createElement('button');
    noButton.className = 'choice-button';
    noButton.textContent = "Tidak";
    noButton.addEventListener('click', () => {
        disableChoiceButtons(buttonContainer, true);
        displayUserMessage("Tidak");
        conversationState.negativeSymptoms.push(distinguishingSymptom);
        updatePossibleDiseases();
        askFollowUpQuestion();
    });
    buttonContainer.appendChild(noButton);

    chatLog.appendChild(choiceWrapper);
    scrollToBottom();
}

// 6. Get distinguishing symptoms
function getDistinguishingSymptoms() {
    const possibleDiseases = conversationState.possibleDiseases;
    if (possibleDiseases.length <= 1) return null;

    const symptomFrequency = {};
    const allPossibleSymptoms = new Set();
    const positiveSymptomsLower = conversationState.initialSymptomsSelected.concat(
        conversationState.askedFollowUpSymptoms.filter(s => !conversationState.negativeSymptoms.includes(s))
    ).map(s => s.toLowerCase().trim()); // Tambahkan trim
    const askedFollowUpsLower = conversationState.askedFollowUpSymptoms.map(s => s.toLowerCase().trim()); // Tambahkan trim

    // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
    console.log("DEBUG: getDistinguishingSymptoms - Penyakit yang sedang dipertimbangkan:", possibleDiseases.map(d => d.name));
    console.log("DEBUG: getDistinguishingSymptoms - Gejala positif yang sudah dikonfirmasi:", positiveSymptomsLower);
    console.log("DEBUG: getDistinguishingSymptoms - Gejala yang sudah ditanyakan:", askedFollowUpsLower);


    possibleDiseases.forEach(disease => {
        for (const category in disease.symptomCategories) {
            disease.symptomCategories[category].forEach(symptom => {
                const symptomLower = symptom.toLowerCase().trim(); // Tambahkan trim
                // Hanya pertimbangkan gejala yang belum dikonfirmasi positif dan belum ditanyakan
                if (!positiveSymptomsLower.some(ps => ps.includes(symptomLower) || symptomLower.includes(ps)) &&
                    !askedFollowUpsLower.some(as => as.includes(symptomLower) || symptomLower.includes(as))) {
                    allPossibleSymptoms.add(symptom); // Tambahkan gejala asli (tidak di-trim/lowercase) ke Set
                    symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
                }
            });
        }
    });

    // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
    console.log("DEBUG: getDistinguishingSymptoms - Semua gejala potensial yang belum ditanyakan:", Array.from(allPossibleSymptoms));
    console.log("DEBUG: getDistinguishingSymptoms - Frekuensi gejala potensial:", symptomFrequency);


    let bestSymptom = null;
    let minDifference = possibleDiseases.length;

    for (const symptom of allPossibleSymptoms) {
        const frequency = symptomFrequency[symptom];
        // Gejala pembeda yang baik harus ada di lebih dari 0 penyakit tapi kurang dari semua penyakit
        if (frequency > 0 && frequency < possibleDiseases.length) {
            const difference = Math.abs(frequency - possibleDiseases.length / 2);
            if (difference < minDifference) {
                minDifference = difference;
                bestSymptom = symptom;
            } else if (difference === minDifference) {
                // Jika perbedaan sama, pilih yang frekuensinya lebih tinggi (lebih umum di antara yang tersisa)
                if (frequency > (symptomFrequency[bestSymptom] || 0)) {
                    bestSymptom = symptom;
                }
            }
        }
    }
    // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
    console.log("DEBUG: getDistinguishingSymptoms - Gejala pembeda terbaik yang dipilih:", bestSymptom);

    return bestSymptom;
}

// 7. Show diagnosis
function showDiagnosis(disease) {
    conversationState.stage = 'diagnosis';
    const currentSelectedSymptoms = conversationState.initialSymptomsSelected.concat(
        conversationState.askedFollowUpSymptoms.filter(s => !conversationState.negativeSymptoms.includes(s))
    );

    displayBotMessage(`Berdasarkan gejala yang Anda sampaikan (${currentSelectedSymptoms.join(', ')}), ada kemungkinan bayi Anda mengalami: <strong>${disease.name}</strong>.`, true);

    let diseaseInfo = `<details><summary><strong>Klik untuk info lebih lanjut tentang ${disease.name}</strong></summary>`;
    diseaseInfo += `<p><strong>Deskripsi:</strong> ${disease.description}</p>`;
    const displaySymptoms = [];
    for (const category in disease.symptomCategories) {
        displaySymptoms.push(...disease.symptomCategories[category]);
    }
    diseaseInfo += `<p><strong>Gejala Umum Terkait:</strong> ${displaySymptoms.join(', ')}.</p>`;
    diseaseInfo += `<p><strong>Penanganan Umum:</strong> ${disease.treatment}</p>`;
    if (disease.prevention) {
        diseaseInfo += `<p><strong>Pencegahan:</strong> ${disease.prevention}</p>`;
    }
    if (disease.severity) {
        diseaseInfo += `<p><strong>Tingkat Keparahan:</strong> ${disease.severity}</p>`;
    }
    diseaseInfo += `</details>`;
    displayBotMessage(diseaseInfo, true);

    if (disease.references && disease.references.length > 0) {
        let referencesText = "<strong>Referensi Eksternal:</strong><br>";
        disease.references.forEach(reference => {
            referencesText += `<a href="${reference.url}" target="_blank" rel="noopener noreferrer">${reference.title}</a><br>`;
        });
        displayBotMessage(referencesText, true);
    }

    setTimeout(() => {
        displayBotMessage(medicalData.general_responses.disclaimer, true);
        offerReservationOrRestart();
    }, 500);
}

// 8. Show general symptom info
function showGeneralSymptomInfo(symptoms) {
    // --- TAMBAHKAN CONSOLE.LOG DI SINI ---
    console.log("DEBUG: showGeneralSymptomInfo dipanggil. Gejala yang diberikan:", symptoms);

    if (!symptoms || symptoms.length === 0) {
        offerReservationOrRestart();
        return;
    }
    displayBotMessage("Berikut adalah informasi umum mengenai gejala yang Anda pilih:");
    let infoText = "<ul>";
    symptoms.forEach(symptom => {
        let symptomInfo = "";
        switch (symptom.toLowerCase()) {
            case "demam": symptomInfo = "Demam pada bayi bisa disebabkan oleh infeksi, tumbuh gigi, atau pasca imunisasi. Ukur suhu secara berkala. Berikan cukup cairan (ASI/susu). Jika demam tinggi (>38°C pada bayi < 3 bulan, >39°C pada bayi lebih tua), tidak turun dengan obat, atau disertai kejang/lemas, segera ke dokter."; break;
            case "batuk": symptomInfo = "Batuk bisa karena ISPA, alergi, atau iritasi. Jaga kelembaban udara, berikan cukup cairan. Jika batuk terus-menerus, disertai sesak napas, demam tinggi, atau dahak kental/berwarna, konsultasikan ke dokter. Hindari obat batuk bebas tanpa resep dokter."; break;
            case "pilek": symptomInfo = "Pilek umumnya karena virus (common cold). Bersihkan hidung bayi dengan saline drop dan penyedot ingus bayi. Jaga asupan cairan. Jika pilek sangat mengganggu, berwarna hijau/kuning kental, disertai demam tinggi atau sesak, periksakan ke dokter."; break;
            case "diare": symptomInfo = "Diare ditandai BAB cair >3 kali sehari. Penyebab tersering adalah infeksi virus (rotavirus). Fokus utama adalah mencegah dehidrasi: beri ASI/susu lebih sering, berikan oralit jika disarankan dokter. Jika ada tanda dehidrasi (lemas, mata cekung, jarang pipis), BAB berdarah/lendir, atau demam tinggi, segera ke dokter."; break;
            case "muntah": symptomInfo = "Muntah bisa karena infeksi pencernaan, terlalu banyak minum susu, atau refluks. Berikan minum sedikit tapi sering. Jika muntah terus-menerus, menyemprot, berwarna hijau/kuning/darah, disertai diare hebat atau tanda dehidrasi, segera ke dokter."; break;
            case "ruam": symptomInfo = "Ruam bisa banyak penyebabnya: iritasi (ruam popok), alergi, biang keringat, infeksi virus (campak, flu singapura), atau infeksi bakteri. Jaga kebersihan kulit, gunakan pakaian katun longgar. Jika ruam menyebar cepat, melepuh, disertai demam tinggi, atau gatal hebat, periksakan ke dokter."; break;
            case "kulit/mata kuning": symptomInfo = "Kulit atau bagian putih mata yang tampak kuning pada bayi bisa menjadi tanda penyakit kuning (jaundice). Kondisi ini memerlukan perhatian medis untuk menentukan penyebab dan penanganannya. Segera konsultasikan dengan dokter, terutama jika muncul pada bayi baru lahir atau disertai gejala lain seperti lemas atau sulit menyusu."; break;
            case "sesak napas / napas cepat": symptomInfo = "Sesak napas atau napas yang sangat cepat pada bayi adalah tanda bahaya dan memerlukan evaluasi medis segera. Ini bisa disebabkan oleh berbagai kondisi serius seperti infeksi paru (pneumonia), masalah jantung, atau sumbatan saluran napas. Jangan tunda untuk membawa bayi ke dokter atau unit gawat darurat."; break;
            default: symptomInfo = `Informasi umum untuk ${symptom} belum tersedia secara spesifik.`
        }
        if (symptomInfo) infoText += `<li><strong>${symptom}:</strong> ${symptomInfo}</li>`;
    });
    infoText += "</ul>";
    displayBotMessage(infoText, true);
    displayBotMessage("Jika gejala berlanjut, memburuk, atau Anda khawatir, jangan ragu untuk berkonsultasi dengan dokter anak.");
    offerReservationOrRestart();
}

// --- Utility Functions ---

function offerReservationOrRestart() {
    conversationState.stage = 'offering_reservation';
    setTimeout(() => {
        displayBotMessage("Apakah Anda ingin membuat reservasi untuk konsultasi lebih lanjut dengan dokter kami, atau ada hal lain yang bisa dibantu?");

        const choiceWrapper = createChoiceWrapper();
        const buttonContainer = choiceWrapper.querySelector('.choice-buttons');

        const reservationButton = document.createElement('button');
        reservationButton.className = 'choice-button primary-action-button';
        reservationButton.textContent = "Ya, buat reservasi";
        reservationButton.addEventListener('click', () => {
            disableChoiceButtons(buttonContainer, true);
            displayUserMessage("Ya, saya ingin membuat reservasi.");
            displayBotMessage("Baik, Anda akan diarahkan ke halaman reservasi kami.");
            setTimeout(() => {
                window.location.href = 'reservation'; // GANTI DENGAN URL FORMULIR RESERVASI ANDA
            }, 1500);
        });
        buttonContainer.appendChild(reservationButton);

        const noReservationButton = document.createElement('button');
        noReservationButton.className = 'choice-button';
        noReservationButton.textContent = "Lain kali / Tanya lagi";
        noReservationButton.addEventListener('click', () => {
            disableChoiceButtons(buttonContainer, true);
            displayUserMessage("Lain kali untuk reservasi.");
            askToStartOver();
        });
        buttonContainer.appendChild(noReservationButton);

        chatLog.appendChild(choiceWrapper);
        scrollToBottom();
    }, 1500);
}

function askToStartOver() {
    conversationState.stage = 'finished_or_restarting';
    setTimeout(() => {
        displayBotMessage(medicalData.general_responses.ask_start_over);

        const choiceWrapper = createChoiceWrapper();
        const buttonContainer = choiceWrapper.querySelector('.choice-buttons');

        const yesButton = document.createElement('button');
        yesButton.className = 'choice-button';
        yesButton.textContent = "Ya, mulai konsultasi baru";
        yesButton.addEventListener('click', () => {
            disableChoiceButtons(buttonContainer, true);
            displayUserMessage("Ya, mulai konsultasi baru");
            resetChat();
        });
        buttonContainer.appendChild(yesButton);

        const noButton = document.createElement('button');
        noButton.className = 'choice-button';
        noButton.textContent = "Tidak, terima kasih";
        noButton.addEventListener('click', () => {
            disableChoiceButtons(buttonContainer, true);
            displayUserMessage("Tidak, terima kasih");
            displayBotMessage(medicalData.general_responses.thank_you);
            conversationState.stage = 'finished';
        });
        buttonContainer.appendChild(noButton);

        chatLog.appendChild(choiceWrapper);
        scrollToBottom();
    })
}

function resetChat() {
    displayBotMessage("Baik, mari kita mulai dari awal.");
    conversationState.stage = 'initial_choice';
    conversationState.initialSymptomsSelected = [];
    conversationState.possibleDiseases = [];
    conversationState.askedFollowUpSymptoms = [];
    conversationState.negativeSymptoms = [];
    conversationState.followUpCount = 0;

    // Untuk membersihkan tampilan chat log dari konten dinamis sebelumnya:
    // Cara 1: Hapus semua elemen anak kecuali mungkin pesan greeting awal jika ada.
    // Ini lebih aman jika ada struktur statis di dalam chatLog yang tidak ingin dihapus.
    // const messagesToRemove = chatLog.querySelectorAll('.message-container, .choice-container, .action-buttons-container');
    // messagesToRemove.forEach(el => el.remove());
    // Cara 2: Jika chatLog hanya berisi pesan dinamis, bisa lebih simpel:
    // chatLog.innerHTML = ''; // Akan menghapus semua. Jika greeting awal juga dinamis, ini oke.

    setTimeout(() => {
        showInitialOptions();
    }, 1000);
}

function displayBotMessage(message, useHTML = false) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container text-left mb-2 animate__animated animate__fadeInUp';
    const senderElement = document.createElement('div');
    senderElement.className = 'sender';
    senderElement.textContent = 'Medical Assistant';
    messageContainer.appendChild(senderElement);
    const messageElement = document.createElement('div');
    messageElement.className = 'bot-message';
    if (useHTML) {
        messageElement.innerHTML = message;
    } else {
        messageElement.textContent = message;
    }
    messageContainer.appendChild(messageElement);
    chatLog.appendChild(messageContainer);
    scrollToBottom();
}

function displayUserMessage(message) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container text-right mb-2 animate__animated animate__fadeInUp';
    const senderElement = document.createElement('div');
    senderElement.className = 'sender';
    senderElement.textContent = 'Anda';
    messageContainer.appendChild(senderElement);
    const messageElement = document.createElement('div');
    messageElement.className = 'user-message';
    messageElement.textContent = message;
    messageContainer.appendChild(messageElement);
    chatLog.appendChild(messageContainer);
    scrollToBottom();
}

function disableChoiceButtons(containerOfButtons, makeAllDisabled = false) {
    const buttons = containerOfButtons.querySelectorAll('.choice-button');
    buttons.forEach(originalButton => {
        // Selalu klon untuk memastikan listener lama hilang dan kita bekerja dengan node baru
        const clonedButton = originalButton.cloneNode(true);
        if (originalButton.parentNode) {
            originalButton.parentNode.replaceChild(clonedButton, originalButton);
        }

        // Terapkan status disabled pada tombol baru (klon)
        // Tombol 'Lanjutkan' (dengan kelas .proceed-button) hanya dinonaktifkan jika makeAllDisabled=true
        // atau jika itu BUKAN tombol proceed dan kita hanya menonaktifkan tombol pilihan biasa.
        if (makeAllDisabled || !clonedButton.classList.contains('proceed-button')) {
            clonedButton.disabled = true;
            clonedButton.style.cursor = 'not-allowed';
            clonedButton.style.opacity = '0.6';
        } else if (clonedButton.classList.contains('proceed-button') && !makeAllDisabled) {
            // Jika ini tombol proceed dan makeAllDisabled=false, jangan nonaktifkan.
            // Ini mencegah tombol Lanjutkan dinonaktifkan saat tombol gejala diklik.
            // (Logika ini mungkin perlu disesuaikan tergantung kapan fungsi ini dipanggil untuk tombol proceed)
            // Untuk saat ini, logika di atas (if (makeAllDisabled || !clonedButton.classList.contains('proceed-button')))
            // sudah mencakup ini: tombol proceed tidak akan disable kecuali makeAllDisabled true.
        }
    });
}

function createChoiceWrapper() {
    const choiceWrapper = document.createElement('div');
    choiceWrapper.className = 'choice-container animate__animated animate__fadeInUp';
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'choice-buttons';
    choiceWrapper.appendChild(buttonContainer);
    return choiceWrapper;
}

function scrollToBottom() {
    setTimeout(() => {
        chatLog.scrollTop = chatLog.scrollHeight;
    }, 50);
}
