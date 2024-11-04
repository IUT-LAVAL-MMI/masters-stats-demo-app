/**
 * visDataPreprocessor.js : module chargé de fournir toutes les fonctions de préparation des données pour les visualisations.
 */

import { get as getStorage } from 'storage';

/**
   * Prépare les données pour la visualisation en carte de chaleur des salaire net moyens temps plein par discipline et par région.
   * Retour un tableau de nom de régions regionNoms, un tableau de nom de disciplines disciplineNoms, et un tableau de triplets [indexDiscipline, indexRegion, salaire], utilisable pour la visaluation heatmap
   * @returns Objet {regionNoms, disciplineNoms, salaires}
   */
function prepareDataForSalaireHeatmap() {
  const salairesAnneeRegDisc = getStorage('salairesAnneeRegDisc');
  const regionsById = getStorage('regionsById');
  const disicplinesById = getStorage('disicplinesById');
  // Nous devons générer 3 structures pour la heatmap: un tableau de noms de regions, un tableau de noms de discipline, 
  // et une liste de triplets [indice de la region du tableau de nom, indice de la discipline du tableau de nom, valeur du salaire ]

  // On commence donc par créer les tableau de nom, puis des dictionnaires idRegion->indice region du tableau de nom et idDiscipline -> indice discipline du tableau nom
  // que l'on utilisera pour générer le tableau de triplet par la suite
  const regionNoms = Object.values(regionsById).map(({ nom }) => nom);
  const disciplineNoms = Object.values(disicplinesById).map(({ nom }) => nom);
  const indexRegionById = Object.values(regionsById).reduce((dico, { id }, idx) => {
    dico[id] = idx;
    return dico;
  }, {});
  const indexDisciplineById = Object.values(disicplinesById).reduce((dico, { id }, idx) => {
    dico[id] = idx;
    return dico;
  }, {});

  // Pour les triplets, on ne va garder que pour chaque couple region-discipline le salaire de l'année la plus récente.
  // On commence donc par calculer un dictionnaire d'entrée par clé regionId-dicisplineId en mettant à jour l'entrée uniquement si l'année est plus récente
  const dicoTriplets = salairesAnneeRegDisc.reduce((dico, [annee, regionId, discId, salaireMoyen]) => {
    const key = `${regionId}-${discId}`;
    const entree = dico[key];
    if (entree) { // si l'entrée existe, on la met à jour uniquement si l'année du quadruplet courant est posterieur à l'année de l'entrée
      if (annee > entree.annee) {
        entree.annee = annee;
        entree.salaire = salaireMoyen;
      }
    } else { // si l'entrée n'existe pas encore pour le couple regionId-discId, on en créé une
      dico[key] = {
        regionId,
        discId,
        annee,
        salaire: salaireMoyen
      };
    }
    return dico;
  }, {});

  // On gérer ensuite le tableau de triplets à partir des valeur du dictionnaire de triplet en convertissant les id de region et discipline en index
  // des tableaux de nom avec nos dictionnaires indexRegionById et indexDisciplineById
  const tripletsSalaires = Object.values(dicoTriplets).map(({ regionId, discId, salaire }) => [indexRegionById[regionId],
  indexDisciplineById[discId], salaire]);

  // On met à jour du modèle de données 
  return {
    regionNoms,
    disciplineNoms,
    salaires: tripletsSalaires,
  };
}

/**
 * Prépare les données pour la visualisation en lignes de l'évolution dans le temps des salaire par région pour une discipline donnée (si selectedDisciplineId est non null) ou par discipline pour une région données (si selectedRegionId est non null).
 * Si selectedDisciplineId et selectedRegionId sont toutes les deux null ou toutes les deux non null, lèvre une exption.
 * Retour un tableau de nom de disicpline ou région (legendes), un tableau d'année (annees), un tableau de serie pour chaque ligne (series) et le nom de la visualition (vizName), utilisable pour la visaluation lines
 * @returns Objet {legendes, annees, series, vizName}
 */
function prepareDataForSalaireLines() {
  const salairesAnneeRegDisc = getStorage('salairesAnneeRegDisc');
  const regionsById = getStorage('regionsById');
  const disicplinesById = getStorage('disicplinesById');
  const selectedDisciplineId = getStorage('selectedDisciplineId', false);
  const selectedRegionId = getStorage('selectedRegionId', false);
  /*
  Deux possibilités : soit l'utilisateur a choisi une discipline particulière (selectedDisciplineId)
  et il faut alors créer des series de salaires par région pour cette discipline, 
  soit l'utilisateur a choisi une région particulière (selectedRegionId)
  et il faut alors créer des series de salaires par discipline pour cette région.

  Pour rappel, la visualisation en lignes à besoin de trois tableaux :
  - les légendes : les noms de région ou discipline 
  - les années : utilisé pour l'axe X : un tabeau d'année trié par ordre croissant
  - les série : une par ligne (i.e. : par région ou discipline) avec pour chacune d'entre elle, le nom de la région/discipline et les salaire : un tableau
    de même taille que le tableau d'années avec le salaire pour chaque année (ou null si le salaire est inconnu pour une année donnée)
  */

  if (selectedDisciplineId == null && selectedRegionId == null) {
    throw new Error("Impossible de préparer les données pour la visu lines si ni une discipline ni une région n'est selectionnée");
  }
  if (selectedDisciplineId != null && selectedRegionId != null) {
    throw new Error("Impossible de préparer les données pour la visu lines si une discipline et une région sont toutes les deux selectionnéees");
  }

  if (selectedDisciplineId !== null) { // l'utilisateur a choisi une discipline
    // On commence par filtrer les quadruplets pour ne garder que ceux qui correspondent à la dicipline selectionnée
    const salairesFiltres = salairesAnneeRegDisc.filter(([, , disciplineId]) => disciplineId === selectedDisciplineId);

    // Calcul des légendes : à partir des quadruplets selectionnés, on récupère les regionIds dans un ensemble (Set, qui garanti l'unicité des région),
    // puis l'on transforme ce Set en tableau que l'on trasforme (map) en un tableau de noms de région en utilisant le disctionnaire regionsById,
    // Enfin, on trie ce tableau par ordre alphabétique pour un plus bel affichage sur la visualisation.
    const legendes = Array.from(new Set(salairesFiltres.map(([, regionId]) => regionId))) // le set garantie que chaque regionId n'apparaissent qu'une fois
      .map((regionId) => regionsById[regionId].nom) // on créer un tableau de nom région d'après les région ids
      .sort((rNom1, rNom2) => rNom1.localeCompare(rNom2)); // on trie le tableau par ordre alphabétique de nom de région

    // Calcul des années : de manière similaire, à partir des quadruplets selectionnés, on récupère les années dans un ensemble (Set, qui garanti l'unicité des années),
    // puis l'on transforme ce Set en un tableau d'années, que l'on trie enfin par ordre croissant
    const anneesConcernees = Array.from(new Set(salairesFiltres.map(([annee]) => annee))).sort((a1, a2) => a1 - a2);

    // Pour nous permettre ensuite à partir d'un quadruplet contenant l'année et le salaire, de placer ce salaire à la bonne case du tableau, il nous faut
    // pouvoir connaitre l'indice du tableau à partir de l'année. 
    // On calcule donc un dictionnaire annee -> idx année d'après le tableau anneesConcernees
    const anneesIdxByAnnee = Object.fromEntries(anneesConcernees.map((annee, idx) => [annee, idx]));

    // Calcul des serie : on doit créer une série par région, avec pour chaque série un tableau de salaire par année, de même taille que anneesConcernees
    // à partir de nos quadruplets filtrés on crée un dictionnaire idRegion -> Serie avec comme Serie un objet {nom; nom de la region, salaires : le tableau}
    const seriesByIdRegion = salairesFiltres.reduce((dico, [annee, regionId, , salaire]) => {
      let entree = dico[regionId]; // on tente de récupérer l'entrée de la série du dictionnaire, si celle-ci existe déjà)
      if (!entree) { //si l'entrée n'existe pas, on un créer une nouvelle pour la série, avec un tableau de salaire initialement remplis de valeurs null
        entree = {
          nom: regionsById[regionId].nom,
          salaires: Array(anneesConcernees.length).fill(null),
        };
        dico[regionId] = entree;
      }
      // Dans tous les cas, on place le salaire au bon indice du tableau d'après l'année
      const anneeIdx = anneesIdxByAnnee[annee];
      entree.salaires[anneeIdx] = salaire;
      return dico;
    }, {});

    // on met à jour le modèle avec nos tableaux de légendes, d'années et de serie ainsi que le nom de la vizualisation ("discipline xxx")
    return {
      legendes,
      annees: anneesConcernees,
      series: Object.values(seriesByIdRegion), // tableau de séries
      vizName: `discipline ${disicplinesById[selectedDisciplineId].nom}`,
    }
  } else { // l'utilisateur a choisi une région
    // Le traitement est sensiblement le même que pour une discipline selectionné.
    // On va filtrer les quadruplets d'après la region selectionnée,
    // puis créer un tableau de légendes contenant les disciplines concernées par les quadruplets selectionnés.
    // On va également créer un tableau d'années concerné, avec le dictionnaire année -> indice du tableau
    // Et enfin on va créer les séries de salaire par discipline

    // Quadruplets filtrés par regionId
    const salairesFiltres = salairesAnneeRegDisc.filter(([, regionId]) => regionId === selectedRegionId);
    // Légendes : noms des régions
    const legendes = Array.from(new Set(salairesFiltres.map(([, , disciplineId]) => disciplineId)))
      .map((disciplineId) => disicplinesById[disciplineId].nom)
      .sort((rNom1, rNom2) => rNom1.localeCompare(rNom2));
    // Années et disctionnaire année->index année
    const anneesConcernees = Array.from(new Set(salairesFiltres.map(([annee]) => annee))).sort((a1, a2) => a1 - a2);
    const anneesIdxByAnnee = Object.fromEntries(anneesConcernees.map((annee, idx) => [annee, idx]));
    // Le disctionnaire de série par disciplineId
    const seriesByIdDiscipline = salairesFiltres.reduce((dico, [annee, , disciplineId, salaire]) => {
      let entree = dico[disciplineId]; // on tente de récupérer l'entrée de la série du dictionnaire, si celle-ci existe déjà)
      if (!entree) { //si l'entrée n'existe pas, on un créer une nouvelle pour la série, avec un tableau de salaire initialement remplis de valeurs null
        entree = {
          nom: disicplinesById[disciplineId].nom,
          salaires: Array(anneesConcernees.length).fill(null),
        };
        dico[disciplineId] = entree;
      }
      // Dans tous les cas, on place le salaire au bon indice du tableau d'après l'année
      const anneeIdx = anneesIdxByAnnee[annee];
      entree.salaires[anneeIdx] = salaire;
      return dico;
    }, {});
    // Mise à jour du modèle
    return {
      legendes,
      annees: anneesConcernees,
      series: Object.values(seriesByIdDiscipline), // tableau de séries
      vizName: `région ${regionsById[selectedRegionId].nom}`,
    }
  }
}

export { prepareDataForSalaireHeatmap, prepareDataForSalaireLines };