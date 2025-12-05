import { index } from './client.js';
import { tUI, currentLang, setCurrentLang } from './lang.js';
import { updateLanguageFilter } from './search.js';

const searchView = document.getElementById('search-view');
const recipeView = document.getElementById('recipe-view');
const recipeDetail = document.getElementById('recipe-detail');
const backButton = document.getElementById('back-to-search');
const langSelect = document.querySelector('#lang-select');

function getRecipeIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('recipe');
}

function showSearchView() {
  if (recipeView) recipeView.style.display = 'none';
  if (searchView) searchView.style.display = '';
}

function showRecipeView() {
  if (searchView) searchView.style.display = 'none';
  if (recipeView) recipeView.style.display = '';
}

export async function renderRecipe(recipeId) {
  if (!recipeDetail) return;

  recipeDetail.innerHTML = '<p>Loading…</p>';

  try {
    const hit = await index.getObject(recipeId);

    // sync language with record
    if (hit.lang) {
      setCurrentLang(hit.lang);
      if (langSelect) langSelect.value = hit.lang;
      updateLanguageFilter(hit.lang);
      if (backButton) backButton.textContent = tUI('back');
    }

    recipeDetail.innerHTML = `
      <article class="recipe-detail-card">
        ${hit.image_url ? `<img src="${hit.image_url}" alt="${hit.name}" class="recipe-detail__image" />` : ''}

        <h1 class="recipe-detail__title">${hit.name}</h1>

        <p class="recipe-detail__meta">
          ${hit.course ? `<strong>${tUI("course")}:</strong> ${hit.course} · ` : ''}
          ${hit.difficulty ? `<strong>${tUI("difficulty")}:</strong> ${hit.difficulty} · ` : ''}
          ${hit.temperature ? `<strong>${tUI("temperature")}:</strong> ${hit.temperature} · ` : ''}
          ${hit.season ? `<strong>${tUI("season")}:</strong> ${Array.isArray(hit.season) ? hit.season.join(', ') : hit.season
        } · ` : ''}
          ${hit.prep_time_minutes ? `<strong>${tUI("prep")}:</strong> ${hit.prep_time_minutes} min · ` : ''}
          ${hit.cooking_time_minutes ? `<strong>${tUI("cook")}:</strong> ${hit.cooking_time_minutes} min` : ''}
        </p>

        ${hit.ingredients ? `
          <section class="recipe-detail__section">
            <h2>${tUI("ingredients")}</h2>
            <ul>
              ${(Array.isArray(hit.ingredients) ? hit.ingredients : [hit.ingredients])
          .map((ingredient) => `<li>${ingredient}</li>`)
          .join('')}
            </ul>
          </section>
        ` : ''}

        ${hit.description ? `
          <section class="recipe-detail__section">
            <h2>${tUI("description")}</h2>
            <p>${hit.description}</p>
          </section>
        ` : ''}

        <section class="recipe-detail__section">
          <h2>${tUI("notes")}</h2>
          <p>${hit.personal_notes || '<em>No notes yet.</em>'}</p>
        </section>

        ${hit.recipe_url ? `
          <p class="recipe-detail__link">
            <a href="${hit.recipe_url}" target="_blank" rel="noopener noreferrer">
              ${tUI("url")} ↗
            </a>
          </p>
        ` : ''}
      </article>
    `;
  } catch (error) {
    console.error(error);
    recipeDetail.innerHTML = '<p>Recipe not found.</p>';
  }
}

export function initDetailView() {
  if (backButton) {
    backButton.textContent = tUI('back');
    backButton.addEventListener('click', () => {
      window.location.href = window.location.pathname;
    });
  }

  const recipeId = getRecipeIdFromUrl();

  if (recipeId) {
    showRecipeView();
    renderRecipe(recipeId);
  } else {
    showSearchView();
  }
}

export async function switchRecipeLanguage(currentRecipeId, newLang) {
  try {
    const currentHit = await index.getObject(currentRecipeId);

    const groupId = currentHit.group_id;
    if (!groupId) {
      console.warn('No group_id on current recipe, cannot switch language');
      return;
    }

    const { hits } = await index.search('', {
      filters: `group_id:"${groupId}" AND lang:"${newLang}"`,
      hitsPerPage: 1,
    });

    if (!hits.length) {
      console.warn('No recipe found for group_id and lang', groupId, newLang);
      return;
    }

    const target = hits[0];
    window.location.href = `?recipe=${encodeURIComponent(target.objectID)}`;
  } catch (error) {
    console.error('Error switching recipe language:', error);
  }
}