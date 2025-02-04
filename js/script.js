let appData = {};
const AGE_GROUP_REGEX = /(\d+)-(\d+)/;

// Helper functions
const getMaxKey = (obj) => Object.entries(obj).reduce((a, b) => a[1] > b[1] ? a : b)[0];
const parseAgeGroup = (group) => group.match(AGE_GROUP_REGEX)?.slice(1,3).map(Number) || [0,0];

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    fetch('./data/data.json')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (!data.clusters) throw new Error("Invalid data structure");
            appData = data;
            initDashboard();
            initSimulator();
        })
        .catch(err => {
            console.error("Error loading data:", err);
            alert("Gagal memuat data! Lihat konsol untuk detail.");
        });
});

// Dashboard
function initDashboard() {
    // Update total respondents
    document.getElementById('totalResponden').textContent = appData.metadata.total_respondents;

    // Main pie chart
    new Chart(document.getElementById('mainChart'), {
        type: 'pie',
        data: {
            labels: appData.clusters.map(c => `Klaster ${c.id}`),
            datasets: [{
                data: appData.clusters.map(c => c.percentage),
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']
            }]
        }
    });

    // Accordion
    const accordion = document.getElementById('clusterAccordion');
    appData.clusters.forEach((cluster, idx) => {
        const html = `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button ${idx === 0 ? '' : 'collapsed'}" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#cluster${cluster.id}">
                        Klaster ${cluster.id} - ${getMaxKey(cluster.dominant_job)}
                    </button>
                </h2>
                <div id="cluster${cluster.id}" 
                     class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}" 
                     data-bs-parent="#clusterAccordion">
                    <div class="accordion-body">
                        <div class="row g-4">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6>📊 Distribusi Usia</h6>
                                        <canvas id="ageChart${cluster.id}"></canvas>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6>📈 Prioritas Informasi</h6>
                                        ${Object.entries(cluster.importance).map(([key, val]) => `
                                            <div class="mb-3">
                                                <small>${key.toUpperCase()}</small>
                                                <div class="progress">
                                                    <div class="progress-bar" style="width: ${val}%">${val}%</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        accordion.insertAdjacentHTML('beforeend', html);

        // Age distribution chart
        new Chart(document.getElementById(`ageChart${cluster.id}`), {
            type: 'doughnut',
            data: {
                labels: Object.keys(cluster.age_distribution),
                datasets: [{
                    data: Object.values(cluster.age_distribution),
                    backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc']
                }]
            }
        });
    });
}

// Simulator
function initSimulator() {
    window.getRecommendation = () => {
        const ageInput = document.getElementById('inputAge');
        const jobInput = document.getElementById('inputJob');
        const resultDiv = document.getElementById('result');

        // Validation
        if (!ageInput.value || !jobInput.value) {
            resultDiv.textContent = "Harap isi semua kolom!";
            resultDiv.style.display = 'block';
            return;
        }

        const age = parseInt(ageInput.value);
        const job = jobInput.value;

        // Find matching cluster
        const matchedCluster = appData.clusters.find(cluster => {
            // Check age group
            const ageGroup = Object.keys(cluster.age_distribution).find(group => {
                const [min, max] = parseAgeGroup(group);
                return age >= min && age <= max;
            });

            // Check job dominance
            return ageGroup && cluster.dominant_job[job] > 20;
        });

        // Show result
        if (matchedCluster) {
            const media = Object.entries(matchedCluster.preferred_media_types)
                .sort((a, b) => b[1] - a[1])
                .map(([media, pct]) => `${media} (${pct}%)`)
                .join(', ');

            resultDiv.innerHTML = `
                <strong>REKOMENDASI:</strong><br>
                ${media}<br>
                <small class="text-muted">
                    Klaster ${matchedCluster.id} | 
                    Tingkat Kepuasan: ${matchedCluster.satisfaction}%
                </small>
            `;
            resultDiv.style.display = 'block';
        } else {
            resultDiv.textContent = "Tidak ditemukan rekomendasi spesifik. Gunakan media campuran.";
            resultDiv.style.display = 'block';
        }
    };
}