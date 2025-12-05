const DEFAULT_LANG = 'en';
const LANG_STORAGE_KEY = 'wtc:lang';

function loadInitialLang() {
    try {
        return localStorage.getItem(LANG_STORAGE_KEY) || DEFAULT_LANG;
    } catch (error) {
        console.warn('Unable to read stored language preference', error);
        return DEFAULT_LANG;
    }
}

export let currentLang = loadInitialLang();

const listeners = new Set();

export function setCurrentLang(lang) {
    currentLang = lang;
    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (error) {
        console.warn('Unable to persist language preference', error);
    }
    listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export const labelTranslations = {
    en: {
        attributes: {},
        ui: {
            course: 'Course',
            difficulty: 'Difficulty',
            temperature: 'Temperature',
            season: 'Season',
            prep: 'Prep',
            cook: 'Cook',
            ingredients: 'Ingredients',
            description: 'Description',
            notes: 'Personal notes',
            back: 'Back to recipes',
            url: 'View original recipe'
        },
    },
    fr: {
        attributes: {
            season: 'saison',
            course: 'type',
            difficulty: 'difficulté',
            temperature: 'température',
            ingredients: 'ingrédients',
        },
        ui: {
            course: 'Type',
            difficulty: 'Difficulté',
            temperature: 'Température',
            season: 'Saison',
            prep: 'Préparation',
            cook: 'Cuisson',
            ingredients: 'Ingrédients',
            description: 'Description',
            notes: 'Notes personnelles',
            back: 'Retour aux recettes',
            url: 'Voir la recette originale'
        },
    },
};

export function translateAttributeLabel(attribute) {
    const translations = labelTranslations[currentLang]?.attributes ?? {};
    const normalizedAttribute = attribute?.split('.')[0] || attribute;

    return (
        translations[attribute] ||
        translations[normalizedAttribute] ||
        attribute
    );
}

export function tUI(key) {
    return labelTranslations[currentLang]?.ui?.[key] || key;
}
