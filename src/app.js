const { algoliasearch, instantsearch } = window;
const { autocomplete } = window['@algolia/autocomplete-js'];
const { createLocalStorageRecentSearchesPlugin } = window[
  '@algolia/autocomplete-plugin-recent-searches'
];
const { createQuerySuggestionsPlugin } = window[
  '@algolia/autocomplete-plugin-query-suggestions'
];
const { connectRefinementList } = instantsearch.connectors;

let currentLang = "en";

const labelTranslations = {
  en: {
    attributes: {},
    ui: {
      course: "Course",
      difficulty: "Difficulty",
      temperature: "Temperature",
      season: "Season",
      prep: "Prep",
      cook: "Cook",
      ingredients: "Ingredients",
      description: "Description",
      notes: "Personal notes",
      back: "Back to recipes",
    }
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
      course: "Type",
      difficulty: "Difficulté",
      temperature: "Température",
      season: "Saison",
      prep: "Préparation",
      cook: "Cuisson",
      ingredients: "Ingrédients",
      description: "Description",
      notes: "Notes personnelles",
      back: "Retour aux recettes",
    }
  }
};

const tUI = (key) => {
  return labelTranslations[currentLang]?.ui?.[key] || key;
};

const translateAttributeLabel = (attribute) => {
  const translations = labelTranslations[currentLang]?.attributes ?? {};
  const normalizedAttribute = attribute?.split('.')[0] || attribute;

  return (
    translations[attribute] ||
    translations[normalizedAttribute] ||
    attribute
  );
};


// Dropdown with checkboxes powered by connectRefinementList.
const dropdownCheckboxRefinementList = connectRefinementList(
  (renderOptions, isFirstRender) => {
    const { items, refine, widgetParams } = renderOptions;
    const { container, attribute } = widgetParams;

    if (isFirstRender) {
      const details = document.createElement('details');
      details.className = 'facet-dropdown';

      const summary = document.createElement('summary');
      summary.className = 'facet-dropdown__summary';

      // Use translated label already on first render
      summary.textContent = translateAttributeLabel(attribute);

      const list = document.createElement('div');
      list.className = 'facet-dropdown__options';

      details.appendChild(summary);
      details.appendChild(list);
      container.appendChild(details);

      widgetParams._elements = { list, summary };
    }

    const { list, summary } = widgetParams._elements;

    const translatedAttribute = translateAttributeLabel(attribute);
    const refinedCount = items.filter((item) => item.isRefined).length;

    summary.textContent = refinedCount
      ? `${translatedAttribute} (${refinedCount})`
      : translatedAttribute;

    list.innerHTML = '';

    items.forEach((item) => {
      const label = document.createElement('label');
      label.className = 'facet-dropdown__option';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = item.value;
      checkbox.checked = item.isRefined;
      checkbox.addEventListener('change', () => refine(item.value));

      const text = document.createElement('span');
      // Just use the label as-is, since values are already localized in your records
      text.textContent = `${item.label} (${item.count})`;

      label.appendChild(checkbox);
      label.appendChild(text);
      list.appendChild(label);
    });
  }
);

const searchClient = algoliasearch('2NLPXJ1X2G', process.env.API_KEY);
const index = searchClient.initIndex('test');

const search = instantsearch({
  indexName: 'test',
  searchClient,
  future: { preserveSharedStateOnUnmount: true },
  insights: true,
});

const virtualSearchBox = instantsearch.connectors.connectSearchBox(() => { });

let languageConfigure = instantsearch.widgets.configure({
  facetFilters: [`lang:${currentLang}`],
});
const baseConfigure = instantsearch.widgets.configure({
  hitsPerPage: 8,
  attributesToSnippet: ['description:20'],
  snippetEllipsisText: '...',
});

search.addWidgets([
  virtualSearchBox({}),
  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      item: (hit, { html, components }) => html`
<article class="hit">
  <img src=${hit.image_url || ''} alt=${hit.name} />
  <div>
    <h1><a href="?recipe=${encodeURIComponent(hit.objectID)}">${components.Highlight({ hit, attribute: "name" })}</a></h1>
    <p>${components.Snippet({ hit, attribute: "description" })}</p>
  </div>
</article>
`,
    },
  }),
  baseConfigure,
  languageConfigure,
  instantsearch.widgets.dynamicWidgets({
    container: '#dynamic-widgets',
    fallbackWidget({ container, attribute }) {
      return dropdownCheckboxRefinementList({
        container,
        attribute,
        limit: 20,
        showMore: true,
        showMoreLimit: 50,
      });
    },
    widgets: [
    ],
  }),
  instantsearch.widgets.pagination({
    container: '#pagination',
  }),
]);

search.start();

const searchView = document.getElementById('search-view');
const recipeView = document.getElementById('recipe-view');
const recipeDetail = document.getElementById('recipe-detail');
const backButton = document.getElementById('back-to-search');
backButton.textContent = tUI("back");

function getRecipeIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('recipe');
}

function showSearchView() {
  recipeView.style.display = 'none';
  searchView.style.display = '';
}

function showRecipeView() {
  searchView.style.display = 'none';
  recipeView.style.display = '';
}

async function renderRecipe(recipeId) {
  if (!recipeDetail) return;

  recipeDetail.innerHTML = '<p>Loading…</p>';

  try {
    const hit = await index.getObject(recipeId);

    // 🔹 Sync UI language with the record language
    if (hit.lang) {
      currentLang = hit.lang;

      // Sync the <select> as well
      const langSelect = document.querySelector('#lang-select');
      if (langSelect) {
        langSelect.value = currentLang;
      }

      // (optional) keep list view filter in sync too
      updateLanguageFilter(currentLang);
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
              View original recipe ↗
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

// Back button: go back to list (remove ?recipe from URL)
if (backButton) {
  backButton.addEventListener('click', () => {
    // simplest: go back to root without query params
    window.location.href = window.location.pathname;
  });
}

// On first load: decide which view to show
const recipeId = getRecipeIdFromUrl();

if (recipeId) {
  showRecipeView();
  renderRecipe(recipeId);
} else {
  showSearchView();
}

const langSelect = document.querySelector('#lang-select');

const updateLanguageFilter = (newLang) => {
  if (languageConfigure) {
    search.removeWidgets([languageConfigure]);
  }

  languageConfigure = instantsearch.widgets.configure({
    facetFilters: [`lang:${newLang}`],
  });

  search.addWidgets([languageConfigure]);
};

langSelect.addEventListener('change', async (event) => {
  const newLang = event.target.value;
  currentLang = newLang;

  updateLanguageFilter(currentLang);

  const params = new URLSearchParams(window.location.search);
  const currentRecipeId = params.get('recipe');

  if (currentRecipeId) {
    await switchRecipeLanguage(currentRecipeId, newLang);
  }
});

const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
  key: 'instantsearch',
  limit: 3,
  transformSource({ source }) {
    return {
      ...source,
      onSelect({ setIsOpen, setQuery, item, event }) {
        onSelect({ setQuery, setIsOpen, event, query: item.label });
      },
    };
  },
});

const querySuggestionsPlugin = createQuerySuggestionsPlugin({
  searchClient,
  indexName: 'test',
  getSearchParams() {
    return recentSearchesPlugin.data.getAlgoliaSearchParams({ hitsPerPage: 6 });
  },
  transformSource({ source }) {
    return {
      ...source,
      sourceId: 'querySuggestionsPlugin',
      onSelect({ setIsOpen, setQuery, event, item }) {
        onSelect({ setQuery, setIsOpen, event, query: item.query });
      },
      getItems(params) {
        if (!params.state.query) {
          return [];
        }

        return source.getItems(params);
      },
    };
  },
});

autocomplete({
  container: '#searchbox',
  openOnFocus: true,
  detachedMediaQuery: 'none',
  onSubmit({ state }) {
    setInstantSearchUiState({ query: state.query });
  },
  plugins: [recentSearchesPlugin, querySuggestionsPlugin],
});

function setInstantSearchUiState(indexUiState) {
  search.mainIndex.setIndexUiState({ page: 1, ...indexUiState });
}

function onSelect({ setIsOpen, setQuery, event, query }) {
  if (isModifierEvent(event)) {
    return;
  }

  setQuery(query);
  setIsOpen(false);
  setInstantSearchUiState({ query });
}

function isModifierEvent(event) {
  const isMiddleClick = event.button === 1;

  return (
    isMiddleClick ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  );
}

async function switchRecipeLanguage(currentRecipeId, newLang) {
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