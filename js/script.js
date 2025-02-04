let researchData = {};

// Load data
fetch('data/data.json')
    .then(res => res.json())
    .then(data => {
        researchData = data;
        initDashboard();
        initSimulator();
    });

// Initialize dashboard
function initDashboard() {
    // Main pie chart
    new Chart(document.getElementById('mainPieChart'), {
        type: 'pie',
        data: {
            labels: researchData.clusters.map(c => `Klaster ${c.id}`),
            datasets: [{
                data: researchData.clusters.map(c => c.percentage),
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']
            }]
        }
    });

    // Populate summary table
    const tableBody = document.querySelector('#summaryTable tbody');
    researchData.clusters.forEach(cluster => {
        const topAge = getMaxKey(cluster.age_distribution);
        const topJob = getMaxKey(cluster.dominant_job);
        const topMedia = getMaxKey(cluster.main_media);
        
        tableBody.innerHTML += `
            <tr>
                <td>Klaster ${cluster.id}</td>
                <td>${topAge} (${cluster.age_distribution[topAge]}%)</td>
                <td>${topJob} (${cluster.dominant_job[topJob]}%)</td>
                <td>${topMedia} (${cluster.main_media[topMedia]}%)</td>
                <td>${cluster.satisfaction}% Puas</td>
            </tr>
        `;
    });

    // Create cluster accordion
    const accordion = document.getElementById('clusterAccordion');
    researchData.clusters.forEach((cluster, index) => {
        accordion.innerHTML += `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#cluster${cluster.id}">
                        Klaster ${cluster.id} - ${getMaxKey(cluster.dominant_job)}
                    </button>
                </h2>
                <div id="cluster${cluster.id}" 
                     class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
                     data-bs-parent="#clusterAccordion">
                    <div class="accordion-body">
                        <div class="row g-4">
                            <!-- Age Distribution -->
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h6>📈 Distribusi Usia</h6>
                                        <canvas id="ageChart${cluster.id}"></canvas>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Media Preference -->
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h6>📱 Media Preferensi</h6>
                                        <canvas id="mediaChart${cluster.id}"></canvas>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Importance Factors -->
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h6>⚖️ Prioritas Informasi</h6>
                                        ${Object.entries(cluster.importance).map(([key, val]) => `
                                            <div class="mb-3">
                                                <small>${key.charAt(0).toUpperCase() + key.slice(1)}</small>
                                                <div class="progress">
                                                    <div class="progress-bar" 
                                                         style="width: ${val}%"
                                                         aria-valuenow="${val}" 
                                                         aria-valuemin="0" 
                                                         aria-valuemax="100">
                                                        ${val}%
                                                    </div>
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

        // Initialize charts for each cluster
        initClusterCharts(cluster);
    });
}

// Initialize simulator
function initSimulator() {
    window.getRecommendation = () => {
        const age = parseInt(document.getElementById('inputAge').value);
        const job = document.getElementById('inputJob').value;
        const resultDiv = document.getElementById('recommendationResult');

        const matchedCluster = researchData.clusters.find(cluster => {
            const ageGroup = Object.keys(cluster.age_distribution).find(group => {
                const [min, max] = group.split('-')[0].split(' ')[0].split('-').map(Number);
                return age >= min && age <= max;
            });
            return ageGroup && cluster.dominant_job[job] > 20;
        });

        if (matchedCluster) {
            const mediaList = Object.entries(matchedCluster.preferred_media_types)
                .sort((a, b) => b[1] - a[1])
                .map(([media, val]) => `${media} (${val}%)`);

            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <strong>Rekomendasi Media:</strong><br>
                ${mediaList.slice(0, 3).join(', ')}<br>
                <small class="text-muted">Klaster ${matchedCluster.id}: 
                    ${getMaxKey(cluster.dominant_job)} - 
                    Kepuasan ${matchedCluster.satisfaction}%
                </small>
            `;
        } else {
            resultDiv.innerHTML = "Rekomendasi tidak ditemukan. Gunakan media campuran (online & tradisional).";
        }
    };
}

// Helper functions
function getMaxKey(obj) {
    return Object.entries(obj).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

function initClusterCharts(cluster) {
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

    // Media preference chart
    new Chart(document.getElementById(`mediaChart${cluster.id}`), {
        type: 'bar',
        data: {
            labels: Object.keys(cluster.preferred_media_types),
            datasets: [{
                label: 'Persentase Pengguna',
                data: Object.values(cluster.preferred_media_types),
                backgroundColor: '#f6c23e'
            }]
        }
    });
}