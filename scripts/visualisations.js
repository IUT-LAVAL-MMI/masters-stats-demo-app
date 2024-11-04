/**
 * visualisations.js : script chargé de fournir toutes les fonctions de base de manipulation des visualisations. 
 */

// garantie de ne pas polluer l'espace de noms de notre environnement javascript par  l'encapsulation de tout notre script dans l'exécution d'une fonction anonyme
(function () {
  /*
  Comme notre code-source est séparé en différents fichiers, nous rassemblons toutes nos fonctions ou autres données qui doivent être accessibles d'un script à l'autre
  dans une structure (un objet) global nommé MAINAPP. Dans chaque script, nous la créeons si elle n'existe pas, puis nous y déclarerons nos fonctions 
  */
  if (!window.MAINAPP) {
    // Création de MAINAPP
    window.MAINAPP = {};
  }
  // Creation dans MAINAPP de l'objet dédié à la gestion des visualisations
  window.MAINAPP.viz = {};

  /*
  Fonctions et données "privées" : on ne les exporte pas dans MAINAPP, elles n'ont pas pour vocations d'être appellées depuis d'autres script
  */

  // Dictionnaire interne des instance echarts
  const ECHARTS_INSTANCES = {
    salaireHeatmap: null,
    salaireLines: null,
  }
  // Aucune pour l'instant

  /*
   Fonctions et données "publiques" : exporté pas dans MAINAPP.viz
   */


  /**
   * Créer la structure echart de base de la heatmap des salaires median, sans les données
   * @param {bool} showLoading indique si l'on doit afficher l'indicateur de chargement ou non
   */
  window.MAINAPP.viz.createSalaireHeatmap = function (onClickDiscipline, onClickRegion, showLoading = true) {
    // Si l'instance echart n'existe pas encore, récupère le conteneur du DOM et la créé
    if (!ECHARTS_INSTANCES.salaireHeatmap) {
      const chartDom = document.querySelector('#salaireMedianHeatmap > .viz');
      ECHARTS_INSTANCES.salaireHeatmap = echarts.init(chartDom);
    } else { // Si l'instance existe déjà, la vide de tout contenu
      ECHARTS_INSTANCES.salaireHeatmap.clear();
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
    ECHARTS_INSTANCES.salaireHeatmap.setOption(option);

    // Met en place les écoute d'évènement click
    // xAxis.category : sera une region
    ECHARTS_INSTANCES.salaireHeatmap.on('click', 'xAxis.category', (evt) => {
      onClickRegion(evt.value);
    });
    // yAxis.category : sera une disicpline
    ECHARTS_INSTANCES.salaireHeatmap.on('click', 'yAxis.category', (evt) => {
      onClickDiscipline(evt.value);
    });

    // Affiche l'indicateur de chargement si demandé
    if (showLoading) {
      ECHARTS_INSTANCES.salaireHeatmap.showLoading();
    }

  }

  /**
   * Mets à jour la heatmap des salaire
   * @param {*} regionNoms Liste des noms de région
   * @param {*} disciplineNoms  Liste des noms de régions
   * @param {*} salaires Liste de triplet de valeurs [index de la region d'après regionNoms, index de la disciplines d'après disciplineNoms, salaire]
   */
  window.MAINAPP.viz.updateSalaireHeatmapData = function (regionNoms, disciplineNoms, salaires) {
    // Vérifie que l'instance existe bien
    if (!ECHARTS_INSTANCES.salaireHeatmap) {
      throw new Error("L'instance echarts Salaire Heatmap n'a pas été initialisée");
    }
    // Calcul le min et max des salaires fournis pour la visualMap
    const [minSalaire, maxSalaire] = salaires
      .map(([, , salaire]) => salaire)
      .reduce(([minS, maxS], salaire) => [Math.min(minS, salaire), Math.max(maxS, salaire)],
        [salaires[0][2], salaires[0][2]]);
    // Enleve l'indicateur de chargement si présent
    ECHARTS_INSTANCES.salaireHeatmap.hideLoading();
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
    ECHARTS_INSTANCES.salaireHeatmap.setOption(option);
  }

  window.MAINAPP.viz.updateSalaireHeatmapTitle = function (nbRegions, nbDisciplines) {
    const titleDom = document.querySelector('#salaireMedianHeatmap > h3');
    titleDom.textContent = `Carte de chaleur des salaires médians temps plein pour ${nbRegions} region${nbRegions > 1 ? 's' : ''} et ${nbDisciplines} discipline${nbDisciplines > 1 ? 's' : ''}.`;
  }

  window.MAINAPP.viz.createSalaireLines = function (showLoading = true) {
    // Si l'instance echart n'existe pas encore, récupère le conteneur du DOM et la créé
    if (!ECHARTS_INSTANCES.salaireLines) {
      const chartDom = document.querySelector('#salaireLines > .viz');
      ECHARTS_INSTANCES.salaireLines = echarts.init(chartDom);
    } else { // Si l'instance existe déjà, la vide de tout contenu
      ECHARTS_INSTANCES.salaireLines.clear();
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
    ECHARTS_INSTANCES.salaireLines.setOption(option);
    // Affiche l'indicateur de chargement si demandé
    if (showLoading) {
      ECHARTS_INSTANCES.salaireLines.showLoading();
    }
  }

  window.MAINAPP.viz.updateSalaireLinesData = function (legendes, annees, series) {
    // Vérifie que l'instance existe bien
    if (!ECHARTS_INSTANCES.salaireLines) {
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
      series: series.map(({nom, salaires}) => ({
        name: nom,
        type: 'line',
        connectNulls: true,
        data: salaires,
      }))
    };
     // met à jour l'option dans la visualisation
     ECHARTS_INSTANCES.salaireLines.setOption(option, {
      replaceMerge: ['xAxis', 'series']
     });
  }

  window.MAINAPP.viz.updateSalaireLinesTitle = function (entityName) {
    const titleDom = document.querySelector('#salaireLines > h3');
    titleDom.textContent = `Evolution des salaires médians pour la ${entityName}`;
  }
}());
