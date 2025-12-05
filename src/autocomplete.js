const { autocomplete } = window['@algolia/autocomplete-js'];
const { createLocalStorageRecentSearchesPlugin } =
    window['@algolia/autocomplete-plugin-recent-searches'];
const { createQuerySuggestionsPlugin } =
    window['@algolia/autocomplete-plugin-query-suggestions'];

export function initAutocomplete(searchClient, setInstantSearchUiState) {
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
            return recentSearchesPlugin.data.getAlgoliaSearchParams({
                hitsPerPage: 6,
            });
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
}

function onSelect({ setIsOpen, setQuery, event, query }) {
    if (isModifierEvent(event)) {
        return;
    }

    setQuery(query);
    setIsOpen(false);
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
