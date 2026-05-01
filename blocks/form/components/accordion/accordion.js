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







/**
 * e-Verify Income Form - JS Enhancement
 * Adds subtitles to verify method cards & "Recommended" badge logic
 * Drop this in your EDS block JS or as a separate script
 */
(function () {
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

  function enhanceVerifyMethods() {
    const methodsFieldset = document.querySelector('.field-verify-methods');
    if (!methodsFieldset) return;

    methodsFieldset.querySelectorAll('.radio-wrapper').forEach((wrapper) => {
      const label = wrapper.querySelector('label');
      const input = wrapper.querySelector('input[type="radio"]');
      if (!label || !input) return;

      const value = input.value;
      const details = METHOD_DETAILS[value];
      if (!details) return;

      // Wrap label text in a title span
      const title = label.textContent.trim();
      label.innerHTML = `<span class="method-title">${title}</span>`;

      // Add subtitle
      const subtitleEl = document.createElement('span');
      subtitleEl.className = 'subtitle';
      subtitleEl.textContent = details.subtitle;
      label.appendChild(subtitleEl);

      // Mark recommended
      if (details.recommended) {
        label.classList.add('recommended');
        // Auto-select first (recommended) option
        input.checked = true;
      }
    });
  }

  function enhanceBankOptions() {
    const bankFieldset = document.querySelector('.field-bank-options');
    if (!bankFieldset) return;

    // Map bank label text to display names (correcting abbreviations)
    const BANK_NAMES = {
      'HDFC': 'HDFC Bank',
      'BOB': 'Bank of Bar...',
      'IDFC': 'IDFC First',
      'Kotak': 'Kotak',
      'Axis': 'Axis Bank',
      'SBI': 'SBI',
    };

    bankFieldset.querySelectorAll('.radio-wrapper').forEach((wrapper) => {
      const label = wrapper.querySelector('label');
      if (!label) return;
      const text = label.textContent.trim();
      if (BANK_NAMES[text]) {
        label.textContent = BANK_NAMES[text];
      }
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enhanceVerifyMethods();
      enhanceBankOptions();
    });
  } else {
    enhanceVerifyMethods();
    enhanceBankOptions();
  }
})();