/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Custom submit function
 * @param {scope} globals
 */
function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns {number} returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
* Masks the first 5 digits of the mobile number with *
* @param {*} mobileNumber
* @returns {string} returns the mobile number with first 5 digits masked
*/
function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) {
    return '';
  }
  const value = mobileNumber.toString();
  // Mask first 5 digits and keep the rest
  return ` ${'*'.repeat(5)}${value.substring(5)}`;
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, maskMobileNumber,validateDOBAndToggleText,
  startOtpTimer,resendOtp,callFinalSubmission
};



function calcEMI(principal, annualRate, months) {
    const r = annualRate / 12 / 100;
    if (r === 0) return Math.round(principal / months);
    return Math.round(
        principal * r * Math.pow(1 + r, months) /
        (Math.pow(1 + r, months) - 1)
    );
}
/**
 * Validates the given date of birth and toggles the visibility of the DOB validation text component
 * @param {*} dob - Date of birth (can be YYYY-MM-DD or DD/MM/YYYY or M/D/YY)
 * @returns {void}
 */
function validateDOBAndToggleText(dob) {
    const textComponent = document.querySelector(".field-dob-validation");

    if (!textComponent) return;

    // Hide initially when no dob
    if (!dob) {
        textComponent.style.setProperty('display', 'none', 'important');
        return;
    }

    let birthDate;

    try {
        // ✅ Case 1: YYYY-MM-DD (EDS standard)
        if (dob.includes("-")) {
            birthDate = new Date(dob);
        }

        // ✅ Case 2: DD/MM/YYYY or M/D/YY
        else if (dob.includes("/")) {
            const parts = dob.split("/");

            let day, month, year;

            // Detect format safely
            if (parts[2].length === 4) {
                // DD/MM/YYYY
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                year = parseInt(parts[2], 10);
            } else {
                // M/D/YY
                month = parseInt(parts[0], 10) - 1;
                day = parseInt(parts[1], 10);
                year = parseInt(parts[2], 10);

                if (year < 100) {
                    year += (year > 50 ? 1900 : 2000);
                }
            }

            birthDate = new Date(year, month, day);
        }

        // ❌ Invalid date fallback
        if (!birthDate || isNaN(birthDate.getTime())) {
            textComponent.style.setProperty('display', 'none', 'important');
            return;
        }

        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }

        // ✅ FINAL CONDITION
        if (age < 21) {
            textComponent.style.setProperty('display', 'block', 'important');
        } else {
            textComponent.style.setProperty('display', 'none', 'important');
        }

        console.log("DOB:", dob);
        console.log("Parsed:", birthDate);
        console.log("Age:", age);

    } catch (e) {
        console.error("DOB parsing error:", e);
        textComponent.style.setProperty('display', 'none', 'important');
    }
}




// let timerInterval = null;
// let timerValue = 40;

// /**
//  * Starts a 40 second countdown timer
//  * Updates timer field and shows/hides resend OTP button automatically
//  * @returns {string} initial timer display value
//  */
// function startOtpTimer() {
//   timerValue = 40;

//   if (timerInterval) {
//     clearInterval(timerInterval);
//   }

//   // Get elements using exact name attributes from your HTML
//   const timerInput = document.querySelector('input[name="timer"]');
//   const timerWrapper = document.querySelector('.field-timer');
//   const resendWrapper = document.querySelector('.field-resend-otp');
//   const resendBtn = document.querySelector('button[name="resend_otp"]');

//   // Make sure timer is visible and resend is hidden at start
//   if (timerWrapper) timerWrapper.style.display = '';
//   if (resendWrapper) resendWrapper.style.display = 'none';
//   if (resendBtn) resendBtn.disabled = true;

//   timerInterval = setInterval(() => {
//     timerValue--;

//     // Update timer input value
//     if (timerInput) {
//       timerInput.value = `Resend OTP in ${timerValue}s`;
//     }

//     if (timerValue <= 0) {
//       clearInterval(timerInterval);
//       timerInterval = null;

//       // Hide timer field using exact class from HTML
//       if (timerWrapper) timerWrapper.style.display = 'none';

//       // Show and enable resend OTP button using exact class from HTML
//       if (resendWrapper) resendWrapper.style.display = '';
//       if (resendBtn) resendBtn.display = ;
//     }
//   }, 1000);

//   return `Resend OTP in ${timerValue}s`;
// }





let timerInterval = null;
let timerValue = 40;
let attemptsLeft = 3;
const totalAttempts = 3;

/**
 * Starts a 40 second countdown timer
 * Updates timer field and shows/hides resend OTP button automatically
 * @returns {string} initial timer display value
 */
function startOtpTimer() {
  timerValue = 40;

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  const timerInput = document.querySelector('input[name="timer"]');
  const timerWrapper = timerInput?.closest('.field-wrapper');
  const resendBtn = document.querySelector('button[name="resend_otp"]');
  const resendWrapper = resendBtn?.closest('.field-wrapper');

  // Show timer, hide resend at start
  if (timerWrapper) timerWrapper.style.setProperty('display', '', 'important');
  if (resendWrapper) {
    resendWrapper.classList.remove('hidden');
    resendWrapper.classList.remove('hide');
    resendWrapper.style.setProperty('display', 'none', 'important');
  }
  if (resendBtn) resendBtn.disabled = true;

  timerInterval = setInterval(() => {
    timerValue--;

    if (timerInput) {
      timerInput.value = `Resend OTP in ${timerValue} secs`;
    }

    if (timerValue <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;

      // Hide timer
      if (timerWrapper) {
        timerWrapper.style.setProperty('display', 'none', 'important');
      }

      // Show resend button only if attempts remain
      if (attemptsLeft > 0) {
        if (resendWrapper) {
          resendWrapper.classList.remove('hidden');
          resendWrapper.classList.remove('hide');
          resendWrapper.style.setProperty('display', '', 'important');
        }
        if (resendBtn) resendBtn.disabled = false;
      }
    }
  }, 1000);

  return `Resend OTP in ${timerValue} secs`;
}



/**
 * Handles resend OTP click - decreases attempts and restarts timer
 * @returns {string} updated attempts display value
 */
function resendOtp() {
  const attemptsInput = document.querySelector('input[name="otp_attempts_left"]');
  const resendBtn = document.querySelector('button[name="resend_otp"]');
  const resendWrapper = resendBtn?.closest('.field-wrapper');

  // Decrease attempts
  attemptsLeft--;

  // Update attempts field display
  if (attemptsInput) {
    attemptsInput.value = `${attemptsLeft}/${totalAttempts} attempts lef`;
  }

  // Always restart timer on a valid click
  startOtpTimer();

  // After last click (attemptsLeft === 0), disable button permanently
  if (attemptsLeft <= 0) {
    if (resendWrapper) {
      resendWrapper.style.setProperty('display', 'none', 'important');
    }
    if (resendBtn) resendBtn.disabled = true;
    return `0/${totalAttempts} attempts left`;
  }

  return `${attemptsLeft}/${totalAttempts} attempts `;
}




/**
 * Calls the Final Submission API
 * @param {number} loanAmount - Loan amount
 * @param {number} tenure - Tenure in months
 * @param {scope} globals - Global object (injected by AEM Forms)
 * @returns {Promise}
 */
async function callFinalSubmission(loanAmount, tenure, globals) {
  const API_URL = "https://loan-backend-mock.onrender.com/finalSubmission";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestString: {
          loanAmount: loanAmount,
          tenure: tenure,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check API-level success
    if (data.status?.responseCode === "0") {
      const { vkycLink, acknowledgementId } = data.responseString;

      // Set values into your form fields using globals
      globals.functions.setProperty("vkycLink", { value: vkycLink });
      globals.functions.setProperty("acknowledgementId", { value: acknowledgementId });

      console.log("Submission successful:", data);
      return data;
    } else {
      console.error("API Error:", data.status?.errorDesc);
      globals.functions.markFieldAsInvalid(
        "loanAmount",
        data.status?.errorDesc || "Submission failed"
      );
    }
  } catch (error) {
    console.error("Network/fetch error:", error);
    throw error;
  }
}