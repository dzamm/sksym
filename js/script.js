function generateRecommendation() {
    const userAge = parseInt(document.getElementById('inputAge').value);
    const userOccupation = document.getElementById('inputOccupation').value;
    const dataSelector = document.getElementById('dataSelector').value;

    // Validasi input
    if (!userAge || userAge < 18 || userAge > 100) {
        alert("Mohon masukkan usia antara 18-100 tahun");
        return;
    }

    let fetchPromises = [];
    if (dataSelector === "both") {
        fetchPromises = [fetch('data1.json'), fetch('data2.json')];
    } else if (dataSelector === "data1") {
        fetchPromises = [fetch('data1.json')];
    } else if (dataSelector === "data2") {
        fetchPromises = [fetch('data2.json')];
    }

    Promise.all(fetchPromises)
        .then(responses => Promise.all(responses.map(response => response.json())))
        .then(datasets => {
            let combinedData;
            if (dataSelector === "both") {
                const data1 = datasets[0];
                const data2 = datasets[1];
                combinedData = combineData(data1, data2);
            } else {
                combinedData = datasets[0];
            }

            const bestCluster = calculateBestCluster(userAge, userOccupation, combinedData);
            const recommendations = getMediaRecommendations(bestCluster, combinedData);
            displayRecommendations(recommendations);
        });
}

function combineData(data1, data2) {
    // Combine clusters
    const combinedClusters = data1.clusters.concat(data2.clusters);

    // Combine demographics
    const combinedDemographics = {
        age_distribution: { ...data1.demographics.age_distribution, ...data2.demographics.age_distribution },
        occupation_distribution: { ...data1.demographics.occupation_distribution, ...data2.demographics.employment_distribution },
        education_distribution: data2.demographics.education_distribution
    };

    // Combine media preferences
    const combinedMediaPreferences = {
        frequent_media: { ...data1.media_preferences.frequent_media, ...data2.media_preferences.frequent_media },
        media_types: { ...data1.media_preferences.media_types, ...data2.media_preferences.media_types },
        first_source_of_information: data2.media_preferences.first_source_of_information
    };

    // Combine satisfaction
    const combinedSatisfaction = {
        ...data1.satisfaction,
        ...data2.satisfaction
    };

    // Combine information evaluation
    const combinedInformationEvaluation = data2.information_evaluation;

    return {
        clusters: combinedClusters,
        demographics: combinedDemographics,
        media_preferences: combinedMediaPreferences,
        satisfaction: combinedSatisfaction,
        information_evaluation: combinedInformationEvaluation
    };
}

function calculateBestCluster(age, occupation, data) {
    // 1. Cari distribusi usia
    let ageCluster = {};
    for (const [range, clusters] of Object.entries(data.demographics.age_distribution)) {
        const [min, max] = range.split('-').map(Number);
        if (age >= min && age <= max) {
            ageCluster = clusters;
            break;
        }
    }

    // 2. Cari distribusi pekerjaan
    const occupationCluster = data.demographics.occupation_distribution[occupation] || {};

    // 3. Hitung skor gabungan
    const clusterScores = data.clusters.map(cluster => {
        const clusterId = cluster.id;
        const ageScore = ageCluster[`cluster_${clusterId}`] || 0;
        const occupationScore = occupationCluster[`cluster_${clusterId}`] || 0;

        return {
            clusterId,
            totalScore: ageScore + occupationScore
        };
    });

    // 4. Ambil cluster dengan skor tertinggi
    return clusterScores.reduce((a, b) => a.totalScore > b.totalScore ? a : b).clusterId;
}

function getMediaRecommendations(clusterId, data) {
    const clusterData = data.clusters.find(c => c.id === clusterId);
    const mediaData = data.media_preferences.frequent_media;

    // Hitung persentase preferensi media
    return Object.entries(mediaData)
        .filter(([_, clusters]) => clusters[`cluster_${clusterId}`])
        .map(([media, clusters]) => {
            const count = clusters[`cluster_${clusterId}`];
            const percentage = ((count / clusterData.cases) * 100).toFixed(1);
            return { media, percentage };
        })
        .sort((a, b) => b.percentage - a.percentage);
}

function displayRecommendations(recommendations) {
    const container = document.getElementById('mediaRecommendations');
    container.innerHTML = '';

    recommendations.forEach((rec, index) => {
        const badgeColor = index === 0 ? 'bg-primary' : 'bg-secondary';
        const card = `
            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-shrink-0">
                                <span class="badge ${badgeColor} rounded-pill me-2">${index + 1}</span>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="mb-0">${rec.media}</h5>
                                <small class="text-muted">${rec.percentage}% pengguna di klaster ini</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        container.innerHTML += card;
    });

    document.getElementById('recommendationResult').style.display = 'block';
}

document.getElementById('dataSelector').addEventListener('change', function() {
    const dataSelector = document.getElementById('dataSelector').value;
    let fetchPromises = [];

    if (dataSelector === "both") {
        fetchPromises = [fetch('data1.json'), fetch('data2.json')];
    } else if (dataSelector === "data1") {
        fetchPromises = [fetch('data1.json')];
    } else if (dataSelector === "data2") {
        fetchPromises = [fetch('data2.json')];
    }

    Promise.all(fetchPromises)
        .then(responses => Promise.all(responses.map(response => response.json())))
        .then(datasets => {
            let combinedData;
            if (dataSelector === "both") {
                const data1 = datasets[0];
                const data2 = datasets[1];
                combinedData = combineData(data1, data2);
            } else {
                combinedData = datasets[0];
            }

            // Update total respondents
            document.getElementById('totalRespondents').textContent =
                combinedData.clusters.reduce((sum, cluster) => sum + cluster.cases, 0);

            // Initialize all charts
            initClusterChart(combinedData);
            initAgeChart(combinedData);
            initOccupationChart(combinedData);
            initEducationChart(combinedData);
            initMediaCharts(combinedData);
            initSatisfactionChart(combinedData);
            initInformationEvaluationCharts(combinedData);
        });
});

function initClusterChart(data) {
    new Chart(document.getElementById('clusterChart'), {
        type: 'pie',
        data: {
            labels: data.clusters.map(c => `Klaster ${c.id} (${c.percentage}%)`),
            datasets: [{
                data: data.clusters.map(c => c.cases),
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'],
                hoverOffset: 10
            }]
        }
    });
}

function initAgeChart(data) {
    const ageData = data.demographics.age_distribution;
    new Chart(document.getElementById('ageChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(ageData),
            datasets: [
                {
                    label: 'Klaster 1',
                    data: Object.values(ageData).map(d => d.cluster_1),
                    backgroundColor: '#4e73df'
                },
                {
                    label: 'Klaster 2',
                    data: Object.values(ageData).map(d => d.cluster_2),
                    backgroundColor: '#1cc88a'
                },
                {
                    label: 'Klaster 3',
                    data: Object.values(ageData).map(d => d.cluster_3),
                    backgroundColor: '#36b9cc'
                },
                {
                    label: 'Klaster 4',
                    data: Object.values(ageData).map(d => d.cluster_4),
                    backgroundColor: '#f6c23e'
                }
            ]
        },
        options: {
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });
}

function initOccupationChart(data) {
    const occupationData = data.demographics.occupation_distribution;
    new Chart(document.getElementById('occupationChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(occupationData),
            datasets: [
                {
                    label: 'Klaster 1',
                    data: Object.values(occupationData).map(d => d.cluster_1 || 0),
                    backgroundColor: '#4e73df'
                },
                {
                    label: 'Klaster 2',
                    data: Object.values(occupationData).map(d => d.cluster_2 || 0),
                    backgroundColor: '#1cc88a'
                },
                {
                    label: 'Klaster 3',
                    data: Object.values(occupationData).map(d => d.cluster_3 || 0),
                    backgroundColor: '#36b9cc'
                },
                {
                    label: 'Klaster 4',
                    data: Object.values(occupationData).map(d => d.cluster_4 || 0),
                    backgroundColor: '#f6c23e'
                }
            ]
        },
        options: {
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });
}

function initEducationChart(data) {
    const educationData = data.demographics.education_distribution;
    new Chart(document.getElementById('educationChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(educationData),
            datasets: [
                {
                    label: 'Klaster 1',
                    data: Object.values(educationData).map(d => d.cluster_1 || 0),
                    backgroundColor: '#4e73df'
                },
                {
                    label: 'Klaster 2',
                    data: Object.values(educationData).map(d => d.cluster_2 || 0),
                    backgroundColor: '#1cc88a'
                },
                {
                    label: 'Klaster 3',
                    data: Object.values(educationData).map(d => d.cluster_3 || 0),
                    backgroundColor: '#36b9cc'
                },
                {
                    label: 'Klaster 4',
                    data: Object.values(educationData).map(d => d.cluster_4 || 0),
                    backgroundColor: '#f6c23e'
                }
            ]
        },
        options: {
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });
}

function initMediaCharts(data) {
    // Frequent Media Chart
    new Chart(document.getElementById('mediaFrequentChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(data.media_preferences.frequent_media),
            datasets: [
                {
                    label: 'Klaster 1',
                    data: Object.values(data.media_preferences.frequent_media).map(m => m.cluster_1 || 0),
                    backgroundColor: '#4e73df'
                },
                {
                    label: 'Klaster 2',
                    data: Object.values(data.media_preferences.frequent_media).map(m => m.cluster_2 || 0),
                    backgroundColor: '#1cc88a'
                },
                {
                    label: 'Klaster 3',
                    data: Object.values(data.media_preferences.frequent_media).map(m => m.cluster_3 || 0),
                    backgroundColor: '#36b9cc'
                },
                {
                    label: 'Klaster 4',
                    data: Object.values(data.media_preferences.frequent_media).map(m => m.cluster_4 || 0),
                    backgroundColor: '#f6c23e'
                }
            ]
        }
    });

    // Media Types Charts
    const mediaTypes = data.media_preferences.media_types;

    // Media Cetak
    new Chart(document.getElementById('mediaCetakChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(mediaTypes['Media Cetak']),
            datasets: [{
                data: Object.values(mediaTypes['Media Cetak']),
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc']
            }]
        }
    });

    // Internet
    new Chart(document.getElementById('internetChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(mediaTypes.Internet),
            datasets: [{
                data: Object.values(mediaTypes.Internet),
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc']
            }]
        }
    });

    // Media Sosial
    new Chart(document.getElementById('mediaSosialChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(mediaTypes['Media Sosial']),
            datasets: [{
                data: Object.values(mediaTypes['Media Sosial']),
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc']
            }]
        }
    });
}

function initSatisfactionChart(data) {
    new Chart(document.getElementById('satisfactionChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(data.satisfaction),
            datasets: [{
                label: 'Jumlah Responden',
                data: Object.values(data.satisfaction),
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']
            }]
        }
    });
}

function initInformationEvaluationCharts(data) {
    // Searching for Additional Information Chart
    new Chart(document.getElementById('searchingInfoChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(data.information_evaluation.searching_for_additional_information),
            datasets: [
                {
                    label: 'Klaster 1',
                    data: Object.values(data.information_evaluation.searching_for_additional_information).map(d => d.cluster_1 || 0),
                    backgroundColor: '#4e73df'
                },
                {
                    label: 'Klaster 2',
                    data: Object.values(data.information_evaluation.searching_for_additional_information).map(d => d.cluster_2 || 0),
                    backgroundColor: '#1cc88a'
                },
                {
                    label: 'Klaster 3',
                    data: Object.values(data.information_evaluation.searching_for_additional_information).map(d => d.cluster_3 || 0),
                    backgroundColor: '#36b9cc'
                },
                {
                    label: 'Klaster 4',
                    data: Object.values(data.information_evaluation.searching_for_additional_information).map(d => d.cluster_4 || 0),
                    backgroundColor: '#f6c23e'
                }
            ]
        },
        options: {
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });

    // Completeness of Information Chart
    new Chart(document.getElementById('completenessInfoChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(data.information_evaluation.completeness_of_information),
            datasets: [
                {
                    label: 'Klaster 1',
                    data: Object.values(data.information_evaluation.completeness_of_information).map(d => d.cluster_1 || 0),
                    backgroundColor: '#4e73df'
                },
                {
                    label: 'Klaster 2',
                    data: Object.values(data.information_evaluation.completeness_of_information).map(d => d.cluster_2 || 0),
                    backgroundColor: '#1cc88a'
                },
                {
                    label: 'Klaster 3',
                    data: Object.values(data.information_evaluation.completeness_of_information).map(d => d.cluster_3 || 0),
                    backgroundColor: '#36b9cc'
                },
                {
                    label: 'Klaster 4',
                    data: Object.values(data.information_evaluation.completeness_of_information).map(d => d.cluster_4 || 0),
                    backgroundColor: '#f6c23e'
                }
            ]
        },
        options: {
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });
}