let clusterData = {};

// Load data dari JSON
fetch('data/data.json')
    .then(response => response.json())
    .then(data => {
        clusterData = data;
        initDashboard();
    });

function initDashboard() {
    // Update total responden
    document.getElementById('totalResponden').textContent = clusterData.metadata.total_respondents;

    // Chart distribusi klaster
    const ctx = document.getElementById('clusterChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: clusterData.clusters_summary.map(c => `Klaster ${c.id}`),
            datasets: [{
                data: clusterData.clusters_summary.map(c => c.percentage),
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']
            }]
        }
    });

    // Tampilkan detail klaster
    const container = document.getElementById('clusterDetails');
    clusterData.clusters_summary.forEach(cluster => {
        const html = `
            <div class="col-md-6">
                <div class="cluster-card p-3 bg-white">
                    <h6>Klaster ${cluster.id} - ${cluster.dominant_group}</h6>
                    <small class="text-muted">Usia: ${cluster.age_range[0]}-${cluster.age_range[1]} tahun</small>
                    <p class="mt-2">${cluster.description}</p>
                    <div class="badge bg-primary">Media Utama: ${cluster.main_media.join(', ')}</div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// Simulator rekomendasi
function getRecommendation() {
    const age = parseInt(document.getElementById('inputAge').value);
    const education = document.getElementById('inputEducation').value;
    const resultDiv = document.getElementById('recommendationResult');

    const matchedCluster = clusterData.clusters_summary.find(cluster => 
        age >= cluster.age_range[0] && 
        age <= cluster.age_range[1] && 
        cluster.dominant_group === education
    );

    if (matchedCluster) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <strong>Rekomendasi Media:</strong><br>
            ${matchedCluster.main_media.join(', ')}<br>
            <small class="text-muted">Klaster ${matchedCluster.id}: ${matchedCluster.description}</small>
        `;
    } else {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = 'Tidak ditemukan rekomendasi untuk kriteria ini.';
    }
}