/**
 * Custom cards component for Income e-Verification Method selection
 * Based on: Radio Group
 */

/**
 * Card data — maps radio value to description, badge, and icon SVG.
 * Keys must match the radio input `value` attributes in your AEM form.
 */
const CARD_DATA = {
  account_aggregator: {
    title: 'Account Aggregator',
    description: 'Instant & secure, processed via RBI-regulated partner.',
    badge: 'Recommended',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#EEF2FF"/>
      <path d="M16 7L8 11V17C8 21.418 11.582 25.418 16 26C20.418 25.418 24 21.418 24 17V11L16 7Z" stroke="#1C3FCA" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
      <path d="M13 16L15.5 18.5L19.5 14" stroke="#1C3FCA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  login_to_salary_account: {
    title: 'Login to Salary Account',
    description: 'Quick & hassle-free, processed via NetBanking.',
    badge: null,
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#EEF2FF"/>
      <rect x="7" y="11" width="18" height="13" rx="2" stroke="#1C3FCA" stroke-width="1.5" fill="none"/>
      <path d="M7 15H25" stroke="#1C3FCA" stroke-width="1.5"/>
      <path d="M11 19H13" stroke="#1C3FCA" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M11 8L16 11L21 8" stroke="#1C3FCA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,
  },
  upload_bank_statement: {
    title: 'Upload Bank Statement',
    description: 'Processed via uploading bank statement of the last 6 months.',
    badge: null,
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#EEF2FF"/>
      <path d="M20 8H12C10.895 8 10 8.895 10 10V22C10 23.105 10.895 24 12 24H20C21.105 24 22 23.105 22 22V10C22 8.895 21.105 8 20 8Z" stroke="#1C3FCA" stroke-width="1.5" fill="none"/>
      <path d="M16 13V19M13.5 16.5L16 19L18.5 16.5" stroke="#1C3FCA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13 11H19" stroke="#1C3FCA" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
  },
};

/**
 * Decorates the Cards component for income e-verification method selection.
 * @param {HTMLElement} element   – the fieldset wrapper (.radio-group-wrapper)
 * @param {Object}      fieldJson – form JSON for the field
 * @param {HTMLElement} container – parent container element
 * @param {string}      formId    – unique form ID
 */
export default function decorate(element, fieldJson, container, formId) {
  // Add the base CSS class so our stylesheet applies
  element.classList.add('verify-cards');

  // Hide the fieldset legend — section heading is handled by the parent panel
  const legend = element.querySelector('legend.field-label');
  if (legend) legend.style.display = 'none';

  element.querySelectorAll('.radio-wrapper').forEach((radioWrapper) => {
    const input = radioWrapper.querySelector('input[type="radio"]');
    if (!input) return;

    const value = input.value;
    const data = CARD_DATA[value];
    if (!data) return;

    // ── 1. Custom radio circle ──────────────────────────────────────────────
    const radioCircle = document.createElement('span');
    radioCircle.className = 'vc-radio-circle';

    // ── 2. Icon ─────────────────────────────────────────────────────────────
    const iconWrap = document.createElement('div');
    iconWrap.className = 'vc-icon';
    iconWrap.innerHTML = data.icon;

    // ── 3. Text block ────────────────────────────────────────────────────────
    const textWrap = document.createElement('div');
    textWrap.className = 'vc-text';

    const titleEl = document.createElement('p');
    titleEl.className = 'vc-title';
    titleEl.textContent = data.title;

    const descEl = document.createElement('p');
    descEl.className = 'vc-desc';
    descEl.textContent = data.description;

    textWrap.appendChild(titleEl);
    textWrap.appendChild(descEl);

    // ── 4. Badge (Recommended) ───────────────────────────────────────────────
    let badgeEl = null;
    if (data.badge) {
      badgeEl = document.createElement('span');
      badgeEl.className = 'vc-badge';
      badgeEl.textContent = data.badge;
    }

    // ── 5. Clear existing content & assemble ────────────────────────────────
    // Keep the hidden radio input, remove everything else
    Array.from(radioWrapper.children).forEach((child) => {
      if (child.tagName !== 'INPUT') child.remove();
    });

    // Header row: radio circle + icon + title/desc
    const headerRow = document.createElement('div');
    headerRow.className = 'vc-header';
    headerRow.appendChild(radioCircle);
    headerRow.appendChild(iconWrap);
    headerRow.appendChild(textWrap);

    radioWrapper.appendChild(headerRow);
    if (badgeEl) radioWrapper.appendChild(badgeEl);

    // ── 6. Selected state sync ───────────────────────────────────────────────
    function syncSelected() {
      const isChecked = input.checked;
      radioWrapper.classList.toggle('is-selected', isChecked);
    }

    // Make the whole card clickable
    radioWrapper.addEventListener('click', () => {
      input.click();
      // Sync all cards in this group
      element.querySelectorAll('.radio-wrapper').forEach((rw) => {
        const inp = rw.querySelector('input[type="radio"]');
        if (inp) rw.classList.toggle('is-selected', inp.checked);
      });
    });

    input.addEventListener('change', syncSelected);
    syncSelected(); // set initial state
  });

  // Hide the separate plain-text descriptions block if present on the page
  const descBlock = container
    ? container.querySelector('.field-income-everification-method-descriptions')
    : document.querySelector('.field-income-everification-method-descriptions');
  if (descBlock) descBlock.style.display = 'none';

  return element;
}