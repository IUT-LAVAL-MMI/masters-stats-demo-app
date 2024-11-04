let salaireHeatmap = null;

/**
   * Créer la structure echart de base de la heatmap des salaires median, sans les données
   * @param {bool} showLoading indique si l'on doit afficher l'indicateur de chargement ou non
   */
function createSalaireHeatmap(onClickDiscipline, onClickRegion, showLoading = true) {
  // Si l'instance echart n'existe pas encore, récupère le conteneur du DOM et la créé
  if (!salaireHeatmap) {
    const chartDom = document.querySelector('#salaireMedianHeatmap > .viz');
    salaireHeatmap = echarts.init(chartDom);
  } else { // Si l'instance existe déjà, la vide de tout contenu
    salaireHeatmap.clear();
  }
  // Prépare les options de base
  const option = {
    tooltip: {
      position: 'top'
    },
    grid: {
      width: '60%',
      height: '60%',
      top: '5%',
      left: '20%'
    },
    xAxis: {
      type: 'category',
      splitArea: {
        show: true
      },
      axisLabel: {
        rotate: 60,
        width: 100,
        overflow: 'truncate'
      },
      triggerEvent: true,
    },
    yAxis: {
      type: 'category',
      splitArea: {
        show: true
      },
      triggerEvent: true,
    },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%'
    },
    series: [
      {
        name: 'salaires medians',
        type: 'heatmap',
        label: {
          show: true
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  // Met en place l'option
  salaireHeatmap.setOption(option);

  // Met en place les écoute d'évènement click
  // xAxis.category : sera une region
  salaireHeatmap.on('click', 'xAxis.category', (evt) => {
    onClickRegion(evt.value);
  });
  // yAxis.category : sera une disicpline
  salaireHeatmap.on('click', 'yAxis.category', (evt) => {
    onClickDiscipline(evt.value);
  });

  // Affiche l'indicateur de chargement si demandé
  if (showLoading) {
    salaireHeatmap.showLoading();
  }

}

/**
 * Mets à jour la heatmap des salaire
 * @param {*} regionNoms Liste des noms de région
 * @param {*} disciplineNoms  Liste des noms de régions
 * @param {*} salaires Liste de triplet de valeurs [index de la region d'après regionNoms, index de la disciplines d'après disciplineNoms, salaire]
 */
function updateSalaireHeatmapData(regionNoms, disciplineNoms, salaires) {
  // Vérifie que l'instance existe bien
  if (!salaireHeatmap) {
    throw new Error("L'instance echarts Salaire Heatmap n'a pas été initialisée");
  }
  // Calcul le min et max des salaires fournis pour la visualMap
  const [minSalaire, maxSalaire] = salaires
    .map(([, , salaire]) => salaire)
    .reduce(([minS, maxS], salaire) => [Math.min(minS, salaire), Math.max(maxS, salaire)],
      [salaires[0][2], salaires[0][2]]);
  // Enleve l'indicateur de chargement si présent
  salaireHeatmap.hideLoading();
  // Créer l'option de mise à jour
  const option = {
    xAxis: {
      data: regionNoms,
    },
    yAxis: {
      data: disciplineNoms,
    },
    visualMap: {
      min: minSalaire,
      max: maxSalaire,
    },
    series: [
      {
        name: 'salaires medians',
        data: salaires
      }
    ]

  }
  // met à jour l'option dans la visualisation
  salaireHeatmap.setOption(option);
}

function updateSalaireHeatmapTitle(nbRegions, nbDisciplines) {
  const titleDom = document.querySelector('#salaireMedianHeatmap > h3');
  titleDom.textContent = `Carte de chaleur des salaires médians temps plein pour ${nbRegions} region${nbRegions > 1 ? 's' : ''} et ${nbDisciplines} discipline${nbDisciplines > 1 ? 's' : ''}.`;
}

export { createSalaireHeatmap, updateSalaireHeatmapData, updateSalaireHeatmapTitle }