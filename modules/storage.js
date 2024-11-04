/**
 * appStorage.js : module chargé de fournir toutes les fonctions de base de  gestion des données de l'application.
 */

// Objet contenant l'ensemble des données gérées par système de clé-valeur
const MEMORY_STORAGE = {

}

/**
 * Récupère une valeur associée à une clé. Par défaut, lève une excepption si la clé est absente
 * @param {*} key clé
 * @param {boolean} error_if_absent lève une erreur si la clé est absente, retourne null sinon (défaut: true)
 * @returns valeur associée à la clé, null si la clé est absente et si error_if_absent est false
 */
function get(key, error_if_absent = true) {
  if (!key) {
    throw new Error('Clé manquante.');
  }
  if (key in MEMORY_STORAGE) {
    return MEMORY_STORAGE[key];
  }
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
  if (key in MEMORY_STORAGE) {
    delete MEMORY_STORAGE[key];
  }
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
  return key in MEMORY_STORAGE;
}

/**
 * Retourne la liste des clés présente
 * @returns le tableau de clés
 */
function keys() {
  return Object.keys(MEMORY_STORAGE);
}

export { get, set, remove, has, keys };