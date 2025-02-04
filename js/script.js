// Load Data
Promise.all([
    fetch('data/clusters.json').then(res => res.json()),
    fetch('data/stats.json').then(res => res.json())
]).then(([clusters, stats]) => {
    initCharts(stats);
    initSimulator(clusters);
});

// Initialize Charts
function initCharts(stats) {
    // Cluster Distribution Pie Chart
    new Chart(document.getElementById('clusterChart'), {
        type: 'pie',
        data: {
            labels: stats.clusterLabels,
            datasets: [{
                data: stats.clusterSizes,
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc']
            }]
        }
    });

    // Media Preference Bar Chart
    new Chart(document.getElementById('mediaPreferenceChart'), {
        type: 'bar',
        data: {
            labels: stats.mediaTypes,
            datasets: [{
                label: 'Persentase Pengguna',
                data: stats.mediaPercentages,
                backgroundColor: '#4e73df'
            }]
        }
    });
}

// Simulator Logic
function initSimulator(clusters) {
    window.recommendMedia = () => {
        const age = parseInt(document.getElementById('age').value);
        const education = document.getElementById('education').value;
        const resultDiv = document.getElementById('recommendationResult');

        const match = clusters.find(c => 
            age >= c.age_range[0] && 
            age <= c.age_range[1] && 
            c.education === education
        );

        if (match) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <strong>Rekomendasi Media:</strong><br>
                ${match.recommended_media.join(', ')}<br>
                <small class="text-muted">Klaster ${match.cluster}: ${match.description}</small>
            `;
        } else {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = 'Tidak ditemukan rekomendasi untuk kriteria ini.';
        }
    };
}