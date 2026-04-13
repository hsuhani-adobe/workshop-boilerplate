/**
 * Custom cards component
 * Based on: Radio Group
 */

/**
 * Decorates a custom form field component
 * @param {HTMLElement} fieldDiv - The DOM element containing the field wrapper. Refer to the documentation for its structure for each component.
 * @param {Object} fieldJson - The form json object for the component.
 * @param {HTMLElement} parentElement - The parent container element of the field.
 * @param {string} formId - The unique identifier of the form.
 */
// export default async function decorate(fieldDiv, fieldJson, parentElement, formId) {
//   console.log('⚙️ Decorating cards component:', fieldDiv, fieldJson, parentElement, formId);
  
//   // TODO: Implement your custom component logic here
//   // You can access the field properties via fieldJson.properties
//   // You can access the parent container via parentElement
//   // You can access the form ID via formId
  
//   return fieldDiv;
// }
import { createOptimizedPicture } from '../../../../scripts/aem.js';


 export default function decorate(element, fieldJson, container, formId) {

 element.classList.add('card');

 element.querySelectorAll('.radio-wrapper').forEach((radioWrapper) => {

 const image = createOptimizedPicture('https://main--afb--jalagari.aem.live/lab/images/media_14e602bb8ead2da119302beb16f79574bcce4995f.png', 'card-image');

 radioWrapper.appendChild(image);

 });

 return element;

 }



