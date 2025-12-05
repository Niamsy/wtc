const { instantsearch } = window;
import { searchClient } from './client.js';
import { dropdownCheckboxRefinementList } from './facets.js';
import { tUI, setCurrentLang, currentLang } from './lang.js';

export let search;
export let languageConfigure;

export function initSearch() {
    const virtualSearchBox = instantsearch.connectors.connectSearchBox(() => { });

    search = instantsearch({
        indexName: 'test',
        searchClient,
        future: { preserveSharedStateOnUnmount: true },
        insights: true,
    });

    languageConfigure = instantsearch.widgets.configure({
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
<article class="hit-card">
  <div class="hit-thumb">
    ${hit.image_url
        ? html`<img src=${hit.image_url} alt=${hit.name} loading="lazy" />`
        : html`<div class="hit-thumb__placeholder" aria-hidden="true">🍳</div>`}
  </div>
  <div class="hit-body">
    <h1 class="hit-title">
      <a href="?recipe=${encodeURIComponent(hit.objectID)}">
        ${components.Highlight({ hit, attribute: "name" })}
      </a>
    </h1>
    <p class="hit-desc">
      ${components.Snippet({ hit, attribute: "description" })}
    </p>
    ${html`<p class="hit-meta">
      ${[
          hit.course,
          hit.difficulty,
      ]
          .filter(Boolean)
          .map((meta) => html`<span>${meta}</span>`)}
    </p>`}
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
            widgets: [],
        }),
        instantsearch.widgets.pagination({
            container: '#pagination',
        }),
    ]);

    search.start();
}

export function updateLanguageFilter(newLang) {
    if (languageConfigure) {
        search.removeWidgets([languageConfigure]);
    }

    languageConfigure = instantsearch.widgets.configure({
        facetFilters: [`lang:${newLang}`],
    });

    search.addWidgets([languageConfigure]);
}
