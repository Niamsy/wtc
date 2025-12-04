const { algoliasearch, instantsearch } = window;
const { autocomplete } = window['@algolia/autocomplete-js'];
const { createLocalStorageRecentSearchesPlugin } = window[
  '@algolia/autocomplete-plugin-recent-searches'
];
const { createQuerySuggestionsPlugin } = window[
  '@algolia/autocomplete-plugin-query-suggestions'
];
const { connectRefinementList } = instantsearch.connectors;

// Labels displayed in the checkbox facets per language.
const labelTranslations = {
  en: {
    attributes: {},
  },
  fr: {
    attributes: {
      season: 'saison',
      course: 'type',
      difficulty: 'difficulté',
      temperature: 'température',
      ingredients: 'ingrédients',
    }
  },
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

const search = instantsearch({
  indexName: 'test',
  searchClient,
  future: { preserveSharedStateOnUnmount: true },
  insights: true,
});

const virtualSearchBox = instantsearch.connectors.connectSearchBox(() => { });

// default language
let currentLang = "en";
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
    <h1>${components.Highlight({ hit, attribute: "name" })}</h1>
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

langSelect.addEventListener('change', (event) => {
  currentLang = event.target.value;

  // Update the configure widget with the new language facet filter
  updateLanguageFilter(currentLang);
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
