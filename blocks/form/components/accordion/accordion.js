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







// At the bottom of your existing decorate() function, AFTER the accordion is built
export default function decorate(block) {
  // ... your existing accordion code ...

  // Add this at the very end, after DOM is ready
  enhanceVerifyForm(block);
}

function enhanceVerifyForm(block) {
  // Subtitle map
  const METHOD_DETAILS = {
    'Account Aggregrater': {
      subtitle: 'Instant & secure, processed via RBI-regulated partner.',
      recommended: true,
    },
    'Login to Salary Account': {
      subtitle: 'Quick & hassle-free, processed via NetBanking.',
      recommended: false,
    },
    'Upload Bank Statement': {
      subtitle: 'Processed via uploading bank statement of the last 6 months.',
      recommended: false,
    },
  };

  block.querySelectorAll('.field-verify-methods .radio-wrapper').forEach((wrapper) => {
    const label = wrapper.querySelector('label');
    const input = wrapper.querySelector('input[type="radio"]');
    if (!label || !input) return;

    const details = METHOD_DETAILS[input.value];
    if (!details) return;

    const title = label.textContent.trim();
    label.innerHTML = `<span class="method-title">${title}</span>`;

    const sub = document.createElement('span');
    sub.className = 'subtitle';
    sub.textContent = details.subtitle;
    label.appendChild(sub);

    if (details.recommended) {
      const badge = document.createElement('span');
      badge.className = 'recommended-badge';
      badge.textContent = 'Recommended';
      label.appendChild(badge);
      input.checked = true;
    }
  });
}