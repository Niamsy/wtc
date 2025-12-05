export let currentLang = 'en';

const listeners = new Set();

export function setCurrentLang(lang) {
    currentLang = lang;
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