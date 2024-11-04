/**
 * main.js : module "point d'entrée" de notre application web. S'appuie sur les fonctions proposées par les autres scritp et organise l'orchestration de l'application 
 */

import { loadEntities, requestStats } from 'network';
import { get as getStorage, set as setStorage, has as hasStorage } from 'storage';
import { prepareDataForSalaireHeatmap, prepareDataForSalaireLines } from 'viz/preprocessor';
import { createSalaireHeatmap, updateSalaireHeatmapData, updateSalaireHeatmapTitle } from 'viz/heatmap';

let linesVizCreated = false;

function creerMoyennesSalairesParAnneeRegionDiscipline() {
  // On part d'une liste de stats avec plusieurs salaires médian pour chaque annee, region, disciplineS
  // on doit générer des quadruplet [anne, regiosId, disciplineId, moyenne des salaire]
  // On retirera du comptage toutes les stats dont les salaires ne sont pas mentionnés (null) ou à 0 (incohérent)

  // On commence par filtrer les stats pour enlever les mauvais salaire, puis pour chaque 
  //stat restantes, générer autant de triplets qu'elles ont de disciplineId, 
  const quadrupletsBruts = getStorage('stats').insertionsPro
    .filter(({ salaire }) => salaire.netMedianTempsPlein) // On ne garde que les stats dont le salaire net médian est non null et > 0
    .map(({ identifiants, relations, salaire }) => [identifiants.anneeCollecte, relations.regionId, relations.discIds, salaire.netMedianTempsPlein]) // on extrait des stats que les informations dont on a besoin : annee, regionId, liste des discipline ids, salaire median
    .flatMap(([annee, regionId, discIds, salaire]) => discIds.map((discId) => [annee, regionId, discId, salaire])); // on création des triplet année, regionId, disciplineId, salaire

  // On collecte ensuite dans un dictionnaire la somme et le nombre de salaire par annee-regionId-disciplineId en vue du calcul de la moyenne
  const dicoQuadruplets = quadrupletsBruts.reduce((dico, [annee, regionId, discId, salaire]) => {
    // calcul de la "clé" du dico
    const key = `${annee}-${regionId}-${discId}`;
    // On tente de récupérer l'entrée existante pour cette clé
    const entree = dico[key];
    if (entree) { // si l'entrée existe on ajoute le salaire à la somme et on incrémente le nombre de salaires
      entree.sommeSalaires += salaire;
      entree.nbSalaires += 1;
    } else { // si l'entrée n'existe pas on en créé une nouvelle avec comme somme initiale le salaire, et les information d'identification de base
      dico[key] = {
        annee,
        regionId,
        discId,
        sommeSalaires: salaire,
        nbSalaires: 1
      };
    }
    return dico;
  }, {});

  // On créé un tableau avec chaque valeur du dico, puis l'on génère pour chacun d'entre elle un quadruplet  [anne, regiosId, disciplineId, moyenne des salaire]
  const quadruplets = Object.values(dicoQuadruplets).map(({ annee, regionId, discId, sommeSalaires, nbSalaires }) => [annee, regionId, discId, Math.round(sommeSalaires / nbSalaires)]);

  // on met à jour le modèle de données
  setStorage('salairesAnneeRegDisc', quadruplets);
}

/**
 * Fonction à appeler dès que les données changent, pour mettre à jour les visualisation
 */
function updateVisualisations({ updateSalaireHeatmap = false, updateSalaireLines = false }) {
  if (updateSalaireHeatmap) {
    // Prépare les données pour la heatmap de salaires
    const { regionNoms, disciplineNoms, salaires } = prepareDataForSalaireHeatmap();
    // met à jour le titre de la visualisation
    updateSalaireHeatmapTitle(regionNoms.length, disciplineNoms.length);
    // met à jour la heatmap de salaires
    updateSalaireHeatmapData(regionNoms, disciplineNoms, salaires);
  }
  if (updateSalaireLines) {
    // Vérifie que l'on ait soit une discipline selectionnée soir une region selectionnée
    const selectedDisciplineId = getStorage('selectedDisciplineId', false);
    const selectedRegionId = getStorage('selectedRegionId', false);
    if ((selectedDisciplineId !== null && selectedRegionId === null) 
    || (selectedDisciplineId === null && selectedRegionId !== null)) {
      const { legendes, annees, series, vizName } = prepareDataForSalaireLines();
      // Import dynamique du module
      import('viz/lines').then(({ createSalaireLines, updateSalaireLinesData, updateSalaireLinesTitle }) => {
        // Creation de la viz initiale si pas déjà créée
        if (!linesVizCreated) {
          linesVizCreated = true;
          createSalaireLines(false);
        }
        // met à jour le titre de la visualisation
        updateSalaireLinesTitle(vizName);
        // met à jour la vis lines de salaires
        updateSalaireLinesData(legendes, annees, series);
      });
    }
  }
}

function onSelectDisciplineByNom(disciplineNom) {
  // Récupération de la discipline
  const discipline = Object.values(getStorage('disicplinesById')).find(({ nom }) => nom === disciplineNom);
  // si la discipline existe, positionne le choix de l'utilisateur dans le modèle de données 
  // puis met à jour la visualisation de ligne de salaire
  if (discipline) {
    setStorage('selectedRegionId', null);
    setStorage('selectedDisciplineId', discipline.id);
    updateVisualisations({ updateSalaireLines: true });
  } else {
    console.warn('No discipline found for name ' + disciplineNom);
  }
}

function onSelectRegionByNom(regionNom) {
  // Récupération de la région
  const region = Object.values(getStorage('regionsById')).find(({ nom }) => nom === regionNom);
  // si la discipline existe, positionne le choix de l'utilisateur dans le modèle de données 
  // puis met à jour la visualisation de ligne de salaire
  if (region) {
    setStorage('selectedRegionId', region.id);
    setStorage('selectedDisciplineId', null);
    updateVisualisations({ updateSalaireLines: true });
  } else {
    console.warn('No region found for name ' + regionNom);
  }
}

let refreshingData = false;
function refreshData() {
  if (refreshingData) {
    return;
  }
  refreshingData = true;
  document.getElementById('refreshDataButton').setAttribute('disabled', true);
  // Chargement des entites
  const promesseEntites = loadEntities().then(({
    regionsById,
    disicplinesById
  }) => {
    setStorage('regionsById', regionsById);
    setStorage('disicplinesById', disicplinesById);
  });
  const promesseStats = requestStats({
    moisApresDiplome: 30 // on ne veut que les stats d'insertion pro à 30 mois après le diplome
  }, {
    typeStats: 'insertionsPro', // on ne s'interesse qu'aux salaire
    insertionProDetails: 'salaire' // on ne s'interesse qu'aux salaire
  }).then((stats) => {
    setStorage('stats', stats);
  });
  // On attend que les deux promesses aient réussie et le cas échéant, on prepare notre jeu de donnée intermédiaire et l'on met à jour la visualisations heatmap
  Promise.all([promesseEntites, promesseStats]).then(() => {
    creerMoyennesSalairesParAnneeRegionDiscipline();
    updateVisualisations({ updateSalaireHeatmap: true, updateSalaireLines: true });
  }).finally(() => {
    refreshingData = false;
    document.getElementById('refreshDataButton').removeAttribute('disabled');
  });
}

/**
 * Point d'entrée de l'application", la première qui sera exécutée
 */
// MEt en place une écoute sur le bouton de rafraichissement des données
document.getElementById('refreshDataButton').addEventListener('click', () => {
  refreshData();
})
// Créer la structures de visualisations initiale de la heatmap (en indicant l'indicateur de chargement
createSalaireHeatmap(onSelectDisciplineByNom, onSelectRegionByNom);

// Tente de récupérer du storage les 3 structures de base : regionsById, disicplinesById, 
// Charge les données des entités et les statistiques initiales et les stocke dans le modèles
// On ne s'interesse pour cette démo qu'aux regionsById et aux disciplinesById, stats
if (['regionsById', 'disicplinesById', 'stats'].every((k) => hasStorage(k))) {
  // Tout est prêt pour un affichage sans charger les données de l'API
  creerMoyennesSalairesParAnneeRegionDiscipline();
  updateVisualisations({ updateSalaireHeatmap: true, updateSalaireLines: true });
}
