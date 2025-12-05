const { instantsearch } = window;
import { translateAttributeLabel } from './lang.js';

const { connectRefinementList } = instantsearch.connectors;

export const dropdownCheckboxRefinementList = connectRefinementList(
    (renderOptions, isFirstRender) => {
        const { items, refine, widgetParams } = renderOptions;
        const { container, attribute } = widgetParams;

        if (isFirstRender) {
            const details = document.createElement('details');
            details.className = 'facet-dropdown';

            const summary = document.createElement('summary');
            summary.className = 'facet-dropdown__summary';
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
            text.textContent = `${item.label} (${item.count})`;

            label.appendChild(checkbox);
            label.appendChild(text);
            list.appendChild(label);
        });
    }
);
