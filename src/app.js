// src/app.js
import { searchClient } from './client.js';
import { initSearch, search } from './search.js';
import { initDetailView } from './details.js';
import { initAutocomplete } from './autocomplete.js';
import { setCurrentLang, currentLang } from './lang.js';
import { updateLanguageFilter } from './search.js';
import { switchRecipeLanguage } from './details.js';

initSearch();
initDetailView();

function setInstantSearchUiState(indexUiState) {
  search.mainIndex.setIndexUiState({ page: 1, ...indexUiState });
}

initAutocomplete(searchClient, setInstantSearchUiState);

const langSelect = document.querySelector('#lang-select');

if (langSelect) {
  langSelect.value = currentLang;
  updateLanguageFilter(currentLang);

  langSelect.addEventListener('change', async (event) => {
    const newLang = event.target.value;

    setCurrentLang(newLang);

    updateLanguageFilter(newLang);

    const params = new URLSearchParams(window.location.search);
    const currentRecipeId = params.get('recipe');

    if (currentRecipeId) {
      await switchRecipeLanguage(currentRecipeId, newLang);
    }
  });
}
