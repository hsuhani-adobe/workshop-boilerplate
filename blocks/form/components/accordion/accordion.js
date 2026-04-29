// export function handleAccordionNavigation(panel, tab, forceOpen = false) {
//   const accordionTabs = panel?.querySelectorAll(':scope > fieldset');
//   accordionTabs.forEach((otherTab) => {
//     if (otherTab !== tab) {
//       otherTab.classList.add('accordion-collapse');
//     }
//   });
//   if (forceOpen) {
//     tab.classList.remove('accordion-collapse');
//   } else {
//     tab.classList.toggle('accordion-collapse');
//   }
// }

// export default function decorate(panel) {
//   panel.classList.add('accordion');
//   const accordionTabs = panel?.querySelectorAll(':scope > fieldset');
//   accordionTabs?.forEach((tab, index) => {
//     tab.dataset.index = index;
//     const legend = tab.querySelector(':scope > legend');
//     legend?.classList.add('accordion-legend');
//     if (index !== 0) tab.classList.toggle('accordion-collapse'); // collapse all but the first tab on load
//     legend?.addEventListener('click', () => {
//       handleAccordionNavigation(panel, tab);
//     });
//   });
//   return panel;
// }



/**
 * Accordion Component (Multi-open)
 * - Allows multiple tabs to stay open
 * - First tab open by default (optional)
 */

export function handleAccordionNavigation(panel, tab, forceOpen = false) {
  if (!tab) return;

  if (forceOpen) {
    tab.classList.remove('accordion-collapse');
  } else {
    tab.classList.toggle('accordion-collapse');
  }
}

export default function decorate(panel) {
  if (!panel) return;

  panel.classList.add('accordion');

  const accordionTabs = panel.querySelectorAll(':scope > fieldset');

  accordionTabs.forEach((tab, index) => {
    tab.dataset.index = index;

    const legend = tab.querySelector(':scope > legend');
    if (!legend) return;

    legend.classList.add('accordion-legend');

    // Default state: first open, others collapsed
    if (index !== 0) {
      tab.classList.add('accordion-collapse');
    }

    // Click handler
    legend.addEventListener('click', () => {
      handleAccordionNavigation(panel, tab);
    });
  });

  return panel;
}