// Load Data
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        initDashboard(data);
        initSimulator(data.clusters);
        initMediaPreferences(data.preferensi_media, data.clusters);
    });

function initDashboard(data) {
    // Update total responden
    document.getElementById('totalResponden').textContent = data.total_responden;

    // Chart Distribusi Klaster
    const clusterSizes = data.clusters.map(c => c.jumlah_responden);
    new Chart(document.getElementById('clusterChart'), {
        type: 'pie',
        data: {
            labels: data.clusters.map(c => `Klaster ${c.id}`),
            datasets: [{
                data: clusterSizes,
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']
            }]
        }
    });

    // Chart Preferensi Media
    const mediaLabels = Object.keys(data.preferensi_media);
    const mediaData = mediaLabels.map(media => 
        data.preferensi_media[media].flatMap(c => 
            data.clusters.find(cl => `Cluster ${cl.id}` === c).jumlah_responden
        ).reduce((a, b) => a + b, 0)
    );
    
    new Chart(document.getElementById('mediaChart'), {
        type: 'bar',
        data: {
            labels: mediaLabels,
            datasets: [{
                label: 'Jumlah Responden',
                data: mediaData,
                backgroundColor: '#4e73df'
            }]
        }
    });

    // Isi Tabel Klaster
    const tbody = document.querySelector('#clusterTable tbody');
    data.clusters.forEach(cluster => {
        tbody.innerHTML += `
            <tr>
                <td>${cluster.id}</td>
                <td>${cluster.rentang_usia_dominan}</td>
                <td>${cluster.pendidikan_terakhir}</td>
                <td>${cluster.pekerjaan}</td>
                <td>${cluster.media_informasi_utama.join(', ')}</td>
                <td>${cluster.kepuasan_media}</td>
            </tr>
        `;
    });
}

function initSimulator(clusters) {
    window.recommendMedia = () => {
        const age = document.getElementById('inputAge').value;
        const education = document.getElementById('inputEducation').value;
        const resultDiv = document.getElementById('recommendationResult');

        const matchedCluster = clusters.find(c => 
            c.rentang_usia_dominan === age &&
            c.pendidikan_terakhir === education
        );

        if (matchedCluster) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <strong>Rekomendasi Media:</strong><br>
                ${matchedCluster.media_informasi_utama.join(', ')}<br>
                <small>Berdasarkan Klaster ${matchedCluster.id}</small>
            `;
        } else {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = 'Tidak ditemukan rekomendasi untuk kriteria ini.';
        }
    };
}

function initMediaPreferences(preferences, clusters) {
    const populateList = (listId, mediaType) => {
        const ul = document.getElementById(listId);
        preferences[mediaType].forEach(clusterName => {
            const clusterId = clusterName.split(' ')[1];
            const cluster = clusters.find(c => c.id == clusterId);
            ul.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${clusterName}
                    <span class="badge bg-primary rounded-pill">
                        ${cluster.jumlah_responden} responden
                    </span>
                </li>
            `;
        });
    };

    populateList('printMediaList', 'media_cetak');
    populateList('digitalMediaList', 'internet_media_sosial');
    populateList('digitalMediaList', 'website_pemerintah');
    populateList('digitalMediaList', 'tiktok_instagram');
}