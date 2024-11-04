/**
 * network.js : script chargé de fournir toutes les fonctions de base de récupération des données. 
 * Il n'y a donc qu'ici que nous ferons appel à l'API fetch.
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
  // Creation dans MAINAPP de l'objet dédié à la gestion des données
  window.MAINAPP.network = {};

  /*
  Fonctions et données "privées" : on ne les exporte pas dans MAINAPP, elles n'ont pas pour vocations d'être appellées depuis d'autres script
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

  /*
   Fonctions et données "publiques" : exporté pas dans MAINAPP.data
   */

  /**
   * Charges les dictionnaires d'académie par id, de secteurs disc. par id et de disicplines par id.
   * @returns promesse de chargements des dictionnaires
   */
  window.MAINAPP.network.loadEntities = function () {
    // Charge les academie et les secteurs disciplinaires
    // puis retourne les différents dictionnaires dans un objet unique
    return Promise.all([loadAcademies(), loadSecteurDisciplinaires()])
      .then(([{academiesById, regionsById}, { secteursDiscById, disicplinesById }]) => ({
        academiesById,
        regionsById,
        secteursDiscById,
        disicplinesById
      }));
  }

  window.MAINAPP.network.requestStats = function (filtres = null, collecte = null) {
    // Création de la requête
    requete = {};
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
}());
