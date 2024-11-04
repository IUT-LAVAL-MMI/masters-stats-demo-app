let salaireLines;

function createSalaireLines(showLoading = true) {
  // Si l'instance echart n'existe pas encore, récupère le conteneur du DOM et la créé
  if (!salaireLines) {
    const chartDom = document.querySelector('#salaireLines > .viz');
    salaireLines = echarts.init(chartDom);
  } else { // Si l'instance existe déjà, la vide de tout contenu
    salaireLines.clear();
  }
  // Prépare les options de base
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {},
    grid: {
      left: '5%',
      right: '5%',
      bottom: '5%',
      containLabel: false
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
    },
    yAxis: {
      type: 'value'
    },
    series: []
  };
  // Met en place l'option
  salaireLines.setOption(option);
  // Affiche l'indicateur de chargement si demandé
  if (showLoading) {
    salaireLines.showLoading();
  }
}

function updateSalaireLinesData(legendes, annees, series) {
  // Vérifie que l'instance existe bien
  if (!salaireLines) {
    throw new Error("L'instance echarts Salaire lines n'a pas été initialisée");
  }
  // Créer l'option de mise à jour
  const option = {
    legend: {
      data: legendes,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: annees,
    },
    series: series.map(({ nom, salaires }) => ({
      name: nom,
      type: 'line',
      connectNulls: true,
      data: salaires,
    }))
  };
  // met à jour l'option dans la visualisation
  salaireLines.setOption(option, {
    replaceMerge: ['xAxis', 'series']
  });
}

function updateSalaireLinesTitle(entityName) {
  const titleDom = document.querySelector('#salaireLines > h3');
  titleDom.textContent = `Evolution des salaires médians pour la ${entityName}`;
}

export { createSalaireLines, updateSalaireLinesData, updateSalaireLinesTitle };