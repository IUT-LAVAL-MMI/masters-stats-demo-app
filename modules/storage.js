/**
 * appStorage.js : module chargé de fournir toutes les fonctions de base de  gestion des données de l'application.
 */

// fonction de test de présence du stockage local
function testAndRetrieveLocalStorage() {
  let localStorage = null;
  try {
    localStorage = window.localStorage;
    const testKey = '__STORAGE_TEST__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    // stockage présent et accessible
    return localStorage;
  } catch (error) {
    // Test si l'erreur est due à une limite de stockage atteinte ou non disponible
    if (error instanceof DOMException && (e.name === "QuotaExceededError" || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') && localStorage && localStorage.length !== 0) {
      console.warn("Le navigateur a un localStorage mais sa limite est atteinte. Impossible de l'utiliser");
    } else {
      console.warn("Le navigateur ne semble pas avoir de localStorage : trop vieux, configuration particulière ou navigation privée ?");
    }
    return null;
  }
}

// Test et récupère le localStorage si présent
const LOCAL_STORAGE = testAndRetrieveLocalStorage();

// On garde le stockage en mémoire vive pour les performances
const MEMORY_STORAGE = {

}

/**
 * Récupère une valeur associée à une clé. Par défaut, lève une excepption si la clé est absente
 * @param {String} key clé
 * @param {boolean} error_if_absent lève une erreur si la clé est absente, retourne null sinon (défaut: true)
 * @returns valeur associée à la clé, null si la clé est absente et si error_if_absent est false
 */
function get(key, error_if_absent = true) {
  if (!key) {
    throw new Error('Clé manquante.');
  }
  // Clé présente en mémoire vive, retourne la valeur directement
  if (key in MEMORY_STORAGE) {
    return MEMORY_STORAGE[key];
  }
  // Tente de récupérer la valeur du local storage si disponible
  if (LOCAL_STORAGE) {
    const rawValue = LOCAL_STORAGE.getItem(key);
    if (rawValue) {
      // Deserialise
      const value = JSON.parse(rawValue);
      // Stocke en mémoire vive et retourne la valeur récupérée
      MEMORY_STORAGE[key] = value;
      return value;
    }
  }
  // Aucune clé trouvée, lève une exception si demandée ou retourne null;
  if (error_if_absent) {
    throw new Error(`Données absente pour la clé "${key}"`);
  }
  return null;
}

/**
 * Enregistre une valeur associée à une clé. Si la clé est déjà présente, écrase la valeur
 * @param {*} key clé
 * @param {*} value valeur
 */
function set(key, value) {
  if (!key) {
    throw new Error('Clé manquante.');
  }
  // Stocke en localstorage si disponible
  if (LOCAL_STORAGE) {
    try {
      const rawValue = JSON.stringify(value, null, 0);
      LOCAL_STORAGE.setItem(key, rawValue);
    } catch (e) {
      console.warning('Impossible de stocker la valeur en localStorage: ' + e.message);
    }
  }
  // stocke en mémoire vive
  MEMORY_STORAGE[key] = value;
}

/**
 * Supprime une clé et sa valeur si la clé est présente. Ne fait rien sinon.
 * @param {*} key clé
 */
function remove(key) {
  if (!key) {
    throw new Error('Clé manquante.');
  }
  // supprime du locaStorage si disponible (et si la clé est présente)
  if (LOCAL_STORAGE) {
    LOCAL_STORAGE.removeItem(key);
  }
  if (key in MEMORY_STORAGE) {
    delete MEMORY_STORAGE[key];
  }
}

/**
 * fonction interne de test si une clé est présente dans le localStorage si celui-ci est disponible.
 * @param {String} key 
 * @returns vrai si localStorage disponible et clé présente, faux sinon
 */
function hasKeyInLocalStorage(key) {
  if (!LOCAL_STORAGE) {
    return false;
  }
  for (let i = 0; i < LOCAL_STORAGE.length; i++) {
    if (LOCAL_STORAGE.key(i) === key) {
      return true;
    }
  }
  return false;
}

/**
 * Informe si la clé est présente ou non.
 * @param {*} key clé
 * @returns true si la clé est présente, false sinon
 */
function has(key) {
  if (!key) {
    throw new Error('Clé manquante.');
  }
  if (key in MEMORY_STORAGE) {
    return true;
  };
  // Regarde si la clé est présente dans le localStorage
  return hasKeyInLocalStorage(key);
}

/**
 * Retourne la liste des clés présente
 * @returns le tableau de clés
 */
function keys() {
  // Si pas de localStorage, retourne simplement les clé en mémoire
  if (!LOCAL_STORAGE) {
    return Object.keys(MEMORY_STORAGE);
  }

  // Récupère toutes les clé en mémoire dans un ensemble
  const keySet = new Set(Object.keys(MEMORY_STORAGE));
  // Parcours les clé du localStorage et les ajoute au fur et à mesure dans le set
  for (let i = 0; i < LOCAL_STORAGE.length; i++) {
    keySet.add(LOCAL_STORAGE.key(i));
  }
  // Retourne l'ensemble en tant que tableau 
  return [...keySet];
}

function clear() {
  // vide le localStorage si présent
  if (LOCAL_STORAGE) {
    LOCAL_STORAGE.clear();
  }
  // vide l'objet en mémoire
  Object.keys(MEMORY_STORAGE).forEach((k) => {
    delete MEMORY_STORAGE[k];
  })
}

export { get, set, remove, has, keys, clear };