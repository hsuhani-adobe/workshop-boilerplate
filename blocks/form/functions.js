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
  startOtpTimer,resendOtp, callFinalSubmission, callInitiateCustomerIdentification,  callVerifyOTPAndGetDemogDetails, callPANEnquiry, callGetBureauOffer,
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
 * Calls Final Submission API and updates Loan Application Number field
 * @param {number|string} loanAmount
 * @param {number|string} tenure
 */
function callFinalSubmission(loanAmount, tenure) {

  const API_URL = "https://loan-backend-mock.onrender.com/finalSubmission";

  console.log("Calling API with:", loanAmount, tenure);

  // ✅ Validation
  if (!loanAmount || !tenure) {
    alert("Please enter loan amount and tenure");
    return;
  }

  fetch(API_URL, {
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
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network error");
      return response.json();
    })
    .then((data) => {

      console.log("API Response:", data);

      // ✅ Success case
      if (data?.status?.responseCode === "0") {

        const acknowledgementId = data?.responseString?.acknowledgementId;

        // 🎯 TARGET USING NAME ONLY (NO ID / DATA-ID)
        const inputField = document.querySelector(
          '[name="loan_application_number"]'
        );

        if (inputField) {
          inputField.value = acknowledgementId ? String(acknowledgementId) : "";

          // 🔥 Trigger change so AEM detects update
          inputField.dispatchEvent(new Event("input", { bubbles: true }));
          inputField.dispatchEvent(new Event("change", { bubbles: true }));

          // Optional UX
          inputField.readOnly = true;

          console.log("✅ Loan Application Number set:", acknowledgementId);
        } else {
          console.error("❌ Field with name 'loan_application_number' not found");
        }

      } else {
        alert(data?.status?.errorDesc || "Submission failed");
      }
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      alert("Something went wrong. Please try again.");
    });
}

/**
 * Tier2: Initiate Customer Identification
 * Uses mobile + (PAN OR DOB)
 * DOB is read directly from calendar field
 * @param {string} mobileNo
 * @param {string} pan_no
 */
function callInitiateCustomerIdentification(mobileNo, pan_no) {

  const API_URL = "https://loan-backend-mock.onrender.com/tier2/InitiateCustomerIdentification";

  // 🎯 Get DOB directly from calendar field (AEM safe)
  const dobField = document.querySelector('[name="date_of_birth"]');
  const date_of_birth = dobField ? dobField.value : "";

  console.log("Inputs:", { mobileNo, pan_no, date_of_birth });

  // ✅ Basic validation
  if (!mobileNo) {
    alert("Mobile number is required");
    return;
  }

  // ✅ Build request
  const requestString = {
    mobileNo: mobileNo
  };

  // Only one will be present
  if (pan_no && pan_no.trim() !== "") {
    requestString.panNumber = pan_no.trim();
  } 
  else if (date_of_birth && date_of_birth.trim() !== "") {
    requestString.dateOfBirth = date_of_birth.trim();
  } 
  else {
    alert("Enter PAN or Date of Birth");
    return;
  }

  // 🚀 API Call
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contextParam: {},
      requestString: requestString
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network error");
      }
      return response.json();
    })
    .then((data) => {

      console.log("API Response:", data);

      // ✅ Success case
      if (data?.status?.responseCode === "0") {

        const otp = data?.responseString?.otp;
        const partnerJourneyID = data?.contextParam?.partnerJourneyID;

        // 🎯 Set OTP field
        const otpField = document.querySelector('[name="otp_code"]');
        if (otpField) {
          otpField.value = otp ? String(otp) : "";

          // 🔥 Trigger AEM reactivity
          otpField.dispatchEvent(new Event("input", { bubbles: true }));
          otpField.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // 🎯 Set Partner Journey ID (optional hidden field)
        const journeyField = document.querySelector('[name="partner_journey_id"]');
        if (journeyField) {
          journeyField.value = partnerJourneyID ? String(partnerJourneyID) : "";
          journeyField.dispatchEvent(new Event("change", { bubbles: true }));
        }

        console.log("✅ Tier2 Initiation Success");

      } else {
        alert(data?.status?.errorDesc || "API failed");
      }
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      alert("Something went wrong. Please try again.");
    });
}






/**
 * Tier2: Verify OTP and Fetch Customer Details
 * Works with mobileNo + OTP (no partnerJourneyID)
 * Fills:
 * - fullname_adhar
 * - address_aadhar
 * @param {string} mobileNo
 * @param {string} otp
 */
function callVerifyOTPAndGetDemogDetails(mobileNo, otp) {

  const API_URL = "https://loan-backend-mock.onrender.com/tier2/VerifyOTPAndGetDemogDetails";

  console.log("Inputs:", { mobileNo, otp });

  // ✅ Basic validation
  if (!mobileNo || !otp) {
    alert("Please enter mobile number and OTP");
    return;
  }

  // 🚀 API Call
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contextParam: {},
      requestString: {
        mobileNo: mobileNo,
        passwordValue: otp
      }
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network error");
      }
      return response.json();
    })
    .then((data) => {

      console.log("API Response:", data);

      // ✅ Success case
      if (data?.status?.responseCode === "0") {

        const customer = data?.responseString?.OfferDemogDetails?.[0];

        if (!customer) {
          alert("Customer data not found");
          return;
        }

        // 🎯 Fill Full Name (Aadhar)
        const nameField = document.querySelector('[name="fullname_adhar"]');
        if (nameField) {
          nameField.value = customer.fullName || "";

          nameField.dispatchEvent(new Event("input", { bubbles: true }));
          nameField.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // 🎯 Fill Address (Aadhar)
        const addressField = document.querySelector('[name="address_aadhar"]');
        if (addressField) {
          addressField.value = customer.address || "";

          addressField.dispatchEvent(new Event("input", { bubbles: true }));
          addressField.dispatchEvent(new Event("change", { bubbles: true }));
        }

        console.log("✅ Customer details filled successfully");

      } else {
        alert(data?.status?.errorDesc || "OTP verification failed");
      }
    })
    .catch((error) => {
      console.error("❌ Error:", error);
      alert("Something went wrong. Please try again.");
    });
}



/**
 * PAN Verification Function
 * @param {string} mobileNo
 * @param {string} pan_no
 */
function callPANEnquiry(mobileNo, pan_no) {

  const API_URL = "https://loan-backend-mock.onrender.com/tier2/PANEnquiry";

  console.log("Inputs:", { mobileNo, pan_no });

  // 🎯 Get full name (auto-filled earlier)
  const nameField = document.querySelector('[name="fullname_adhar"]');
  const fullName = nameField ? nameField.value.trim() : "";

  // 🎯 Target wrappers (AEM safe)
  const successWrapper = document.querySelector('.field-verify-pan');
  const errorWrapper = document.querySelector('.field-pan-error');

  // 🔄 Reset messages
  if (successWrapper) successWrapper.style.display = "none";
  if (errorWrapper) errorWrapper.style.display = "none";

  // ✅ Basic validation
  if (!mobileNo || !pan_no || !fullName) {
    console.warn("Missing input values");
    if (errorWrapper) errorWrapper.style.display = "block";
    return;
  }

  // 🚀 Call API
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contextParam: {},
      requestString: {
        mobileNo: mobileNo,
        panNumber: pan_no,
        fullName: fullName
      }
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network error");
      return response.json();
    })
    .then((data) => {

      console.log("PAN API Response:", data);

      if (data?.status?.responseCode === "0") {

        // ✅ SUCCESS
        if (successWrapper) successWrapper.style.display = "block";
        if (errorWrapper) errorWrapper.style.display = "none";

      } else {

        // ❌ FAILURE
        if (errorWrapper) errorWrapper.style.display = "block";
        if (successWrapper) successWrapper.style.display = "none";
      }
    })
    .catch((error) => {

      console.error("PAN API Error:", error);

      // ❌ ERROR CASE
      if (errorWrapper) errorWrapper.style.display = "block";
      if (successWrapper) successWrapper.style.display = "none";
    });
}


/**
 * Get Bureau Offer + Populate All Fields (AEM Safe)
 * Uses data-id for bank selection
 */
function callGetBureauOffer(mobileNo, monthlyIncome, verificationMethod) {

  const API_URL = "https://loan-backend-mock.onrender.com/tier2/GetBureauOffer";

  // 🎯 Get selected bank using data-id
  const selectedRadio = document.querySelector('[data-id^="bank-options"] input[type="radio"]:checked');
  const bankName = selectedRadio ? selectedRadio.value.trim() : "";

  console.log("Inputs:", { mobileNo, monthlyIncome, bankName, verificationMethod });

  // ✅ Validation
  if (!mobileNo || !monthlyIncome || !bankName || !verificationMethod) {
    alert("All fields are required");
    return;
  }

  // 🔧 Helper (AEM reactive)
  function setField(name, value) {
    const el = document.querySelector(`[name="${name}"]`);
    if (!el) return;

    el.value = value ?? "";

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  // 🚀 API call
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contextParam: {},
      requestString: {
        mobileNo,
        monthlyIncome,
        bankName,
        verificationMethod
      }
    })
  })
    .then((res) => {
      if (!res.ok) {
        console.error("Status:", res.status);
        throw new Error("API not found");
      }
      return res.json();
    })
    .then((data) => {

      console.log("API Response:", data);

      if (data?.status?.responseCode === "0") {

        const r = data.responseString || {};

        // 🔢 Loan Details
        setField("loan_amount", r.offerAmount);
       
        
        setField("processing_fee", r.processingFees);
        setField("interest_rate", r.interestRate);

        // 📌 Other Details
        setField("inquiry_source", r.enquirySource);

        // Charges → string
        const charges = (r.scheduleOfCharges || [])
          .map(c => `${c.chargeType}: ${c.amount}`)
          .join(" | ");
        setField("schedule_of_charges", charges);

        // Static
        setField("type_of_loan", "Personal Loan");

        // 🏦 Salary Account Details
        setField("salary_account_number", r.salaryAccountDetails?.accountNumber);
        setField("ifsc", r.salaryAccountDetails?.ifsc);
        setField("bank_name", r.salaryAccountDetails?.bankName);

        // 🎯 Banner
        setField("loan_offer_banner", `₹ ${r.offerAmount}`);

        console.log("✅ All fields populated successfully");

      } else {
        alert(data?.status?.errorDesc || "Failed to fetch offer");
      }
    })
    .catch((err) => {
      console.error("❌ Error:", err);
      alert("Something went wrong");
    });
}