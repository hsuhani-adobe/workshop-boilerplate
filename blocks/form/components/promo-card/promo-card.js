const FALLBACK_IMAGE = 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_1.jpeg';

const CARD_CONFIG = {
  'textinput-9fda00af06': {
    smallText: 'Open a new',
    title: 'Recurring Deposit',
    image: 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_1.jpeg'
  },
  'textinput-c11a1f0f56': {
    smallText: 'Buy a new',
    title: 'Health Insurance',
    image: 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_2.jpeg'
  }
};
export default function decorate(fieldDiv, fieldJson, parentElement, formId) {
  const img = fieldDiv.querySelector('.promo-card-image');
  const smallText = fieldDiv.querySelector('.promo-card-small-text');
  const title = fieldDiv.querySelector('.promo-card-title');

  if (fieldDiv.classList.contains('field-promo-card1777106717593')) {
    img.src = 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_1.jpeg';
    smallText.textContent = 'Open a new';
    title.textContent = 'Recurring Deposit';
  } else if (fieldDiv.classList.contains('field-promo-card-18703026471777106744307')) {
    img.src = 'https://author-p96753-e1523920.adobeaemcloud.com/content/dam/myhdfc/image_2.jpeg';
    smallText.textContent = 'Buy a new';
    title.textContent = 'Health Insurance';
  }

  return fieldDiv;
}