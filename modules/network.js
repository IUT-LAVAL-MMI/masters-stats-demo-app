/**
 * network.js : module chargé de fournir toutes les fonctions de base de récupération des données. 
 * Il n'y a donc qu'ici que nous ferons appel à l'API fetch.
 */

const BASE_API_URL = 'https://la-lab4ce.univ-lemans.fr/masters-stats/api/rest';

/**
   * Récupère la liste des académies, construit et retourne un dictionnaire d'académies par id
   * @returns Promesse du dictionnaire d'académies par id
   */
function loadAcademies() {
  return fetch(`${BASE_API_URL}/academies`)
    .then((reponse) => {
      if (!reponse.ok) {
        throw new Error(`Erreur serveur lors du chargement des academie (code ${reponse.status}).`);
      }
      return reponse.json();
    })
    .then((academies) => {
      // Créer un dicitionaire (objet) d'académies par id
      const academiesById = Object.fromEntries(academies.map((academie) => [academie.id, academie]));
      // Créer un dicitionaire (objet) de région par id
      const regionsById = Object.fromEntries(academies.map((academie) => [academie.regionId, {
        id: academie.regionId,
        nom: academie.regionNom
      }]));
      // Retourne les deux dicitonnaires
      return {
        academiesById,
        regionsById
      };
    });
}

/**
 * Récupère la liste des secteur disciplinaire, construit et retourne un dictionnaire de sect. disc. par id
 * et un dictionnaire de disicpline par id
 * @returns Promesse des deux dictionnaires
 */
function loadSecteurDisciplinaires() {
  return fetch(`${BASE_API_URL}/secteurs-disciplinaires`)
    .then((reponse) => {
      if (!reponse.ok) {
        throw new Error(`Erreur serveur lors du chargement des secteurs disciplinaires (code ${reponse.status}).`);
      }
      return reponse.json();
    })
    .then((secteursDisc) => {
      // Créer un dicitionaire (objet) de secteur disciplinaire par id
      const secteursDiscById = Object.fromEntries(secteursDisc.map((secDisc) => [secDisc.id, secDisc]));
      // Créer un second disctionnaire (objet) de discipline par id
      const disicplinesById = Object.fromEntries(secteursDisc.map((secDisc) => [secDisc.disciplineId, {
        id: secDisc.disciplineId,
        nom: secDisc.disciplineNom,
      }]));
      // Retourne les deux dicitonnaires
      return {
        secteursDiscById,
        disicplinesById
      };
    });
}

function loadEntities() {
  // Charge les academie et les secteurs disciplinaires
  // puis retourne les différents dictionnaires dans un objet unique
  return Promise.all([loadAcademies(), loadSecteurDisciplinaires()])
    .then(([{ academiesById, regionsById }, { secteursDiscById, disicplinesById }]) => ({
      academiesById,
      regionsById,
      secteursDiscById,
      disicplinesById
    }));
}

function requestStats(filtres = null, collecte = null) {
  // Création de la requête
  const requete = {};
  if (filtres) {
    requete.filters = filtres;
  }
  if (collecte) {
    requete.harvest = collecte;
  }
  // Exécution de la recherche de statistiques
  return fetch(`${BASE_API_URL}/stats/search`, {
    method: 'POST',
    headers: new Headers({ 'content-type': 'application/json' }),
    body: JSON.stringify(requete, null, 0)
  }).then((reponse) => {
    if (!reponse.ok) {
      throw new Error(`Erreur serveur lors du chargement des statistiques (code ${reponse.status}.`, requete);
    }
    return reponse.json();
  });
}

export { loadEntities, requestStats };