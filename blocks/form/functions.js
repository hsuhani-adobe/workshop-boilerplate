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
 * @param {*} mobileNumber
 * @returns {string} returns the mobile number with first 5 digits masked
 */
function maskMobileNumber(mobileNumber) {
  console.log("working mask")
    // Check if value exists
    if (!mobileNumber) {
        return '';
    }

    // Convert input to string and remove spaces
    const value = mobileNumber.toString().trim();

    // Validate minimum length
    if (value.length < 10) {
        return value;
    }

    // Mask first 5 digits
    return `${'*'.repeat(5)}${value.substring(5)}`;
}
 
// eslint-disable-next-line import/prefer-default-export
export {
  getFullName, days, submitFormArrayToString, maskMobileNumber,validateDOBAndToggleText,startOtpTimer,resendOtp,callGetBureauOffer,callFinalSubmission,callGenerateEmailOTP,handleProceedButton,callPANEnquiry,updateOTPDescription,initWorkEmailOTP,
};
 
 

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
 
 /**
 * Updates OTP description dynamically with masked mobile number
 * @param {*} mobileNumber
 */
function updateOTPDescription(mobileNumber) {

    // Validate input
    if (!mobileNumber) {
        return;
    }

    // Convert to string
    const value = mobileNumber.toString().trim();

    // Mask first 5 digits
    const maskedNumber = `${'*'.repeat(5)}${value.substring(5)}`;

    // Target description element
    const descriptionElement = document.getElementById(
        "textinput-50d20aeb3d-description"
    );

    // Target wrapper element
    const wrapperElement = document.querySelector(
        '[data-id="textinput-50d20aeb3d"]'
    );

    // Message
    const message =
        `We have sent an OTP to your mobile number ${maskedNumber}`;

    // Update visible description
    if (descriptionElement) {
        descriptionElement.innerHTML = `<p>${message}</p>`;
    }

    // Update wrapper attributes
    if (wrapperElement) {
        wrapperElement.setAttribute(
            "data-description",
            `<p>${message}</p>`
        );

        // Update input title
        const inputField = wrapperElement.querySelector("input");

        if (inputField) {
            inputField.setAttribute("title", message);
        }

        // Update label title
        const label = wrapperElement.querySelector("label");

        if (label) {
            label.setAttribute("title", message);
        }
    }
}
 
 
 
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
function callSubmission(loanAmount, tenure) {
 
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
*/function callVerifyOTPAndGetDemogDetails(mobileNo, otp) {
 
  const API_URL = "https://loan-backend-mock.onrender.com/tier2/VerifyOTPAndGetDemogDetails";
 
  console.log("Inputs:", { mobileNo, otp });
 
  const otpWrapper = document.querySelector('.field-otp-status');
  const otpField   = document.querySelector('[name="otp_status"]');
  const submitBtn  = document.querySelector('button[name="otp_submit2"]');
  const nextBtn    = document.querySelector('button#button-508dd41726');
  const otpInput   = document.querySelector('[data-id="textinput-d8e61b9fd5"] input');
 
  // ── Hide Next button initially ───────────────────────────────────────────
  if (nextBtn) nextBtn.classList.remove("visible");
 
  // ── Re-enable submit when user edits OTP ────────────────────────────────
  if (otpInput && !otpInput.dataset.listenerAttached) {
    otpInput.addEventListener("input", () => {
      if (submitBtn) submitBtn.disabled = false;
      if (nextBtn) nextBtn.classList.remove("visible"); // hide again on edit
      if (otpWrapper) otpWrapper.classList.remove("visible");
    });
    otpInput.dataset.listenerAttached = "true";
  }
 
  // ── Hide error on fresh call ─────────────────────────────────────────────
  if (otpWrapper) otpWrapper.classList.remove('visible');
 
  // ── Guard ────────────────────────────────────────────────────────────────
  if (!mobileNo || !otp) {
    alert("Please enter mobile number and OTP");
    return;
  }
 
  // ── Helper: set field value ──────────────────────────────────────────────
  function setField(name, value) {
    const el = document.querySelector(`[name="${name}"]`);
    if (!el) return;
    el.value = value || "";
    el.dispatchEvent(new Event("input",  { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur",   { bubbles: true }));
  }
 
  // ── Helper: show OTP message ─────────────────────────────────────────────
  function updateOtpMessage(message, isError = false) {
    if (otpField) {
      otpField.value = message;
      otpField.setAttribute("value", message);
      otpField.dispatchEvent(new Event("input",  { bubbles: true }));
      otpField.dispatchEvent(new Event("change", { bubbles: true }));
    }
 
    if (otpWrapper) {
      otpWrapper.classList.add("visible");
      const msgEl = otpWrapper.querySelector(".field-description") || otpWrapper;
      msgEl.innerText = message;
      msgEl.style.color = isError ? "red" : "green";
    }
  }
 
  // ── API Call ─────────────────────────────────────────────────────────────
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contextParam: {},
      requestString: {
        mobileNo: mobileNo,
        passwordValue: otp
      }
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network error");
      return response.json();
    })
    .then((data) => {
 
      console.log("API Response:", data);
 
      // ✅ SUCCESS
      if (data?.status?.responseCode === "0") {
 
        const customer = data?.responseString?.OfferDemogDetails?.[0];
 
        if (!customer) {
          alert("Customer data not found");
          return;
        }
 
        if (submitBtn) submitBtn.disabled = false;
 
        // ✅ Show Next button via class
        if (nextBtn) nextBtn.classList.add("visible");
 
        updateOtpMessage("OTP verified successfully", false);
 
        setField("fullname_adhar", customer.fullName);
        setField("address_aadhar", customer.address);
 
        console.log("✅ Customer details filled successfully");
 
      } else {
 
        // ❌ Invalid OTP
        if (submitBtn) submitBtn.disabled = true;
        if (nextBtn) nextBtn.classList.remove("visible");
 
        updateOtpMessage(data?.status?.errorDesc || "Invalid OTP", true);
 
        console.log("❌ Invalid OTP");
      }
    })
    .catch((error) => {
      console.error("❌ Error:", error);
 
      if (submitBtn) submitBtn.disabled = true;
      if (nextBtn) nextBtn.classList.remove("visible");
 
      updateOtpMessage("Something went wrong", true);
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
 
//   // 🎯 Target wrappers (AEM safe)
 const successWrapper = document.querySelector('.field-pantext');
  const errorWrapper = document.querySelector('.field-panerror');
 
//   // 🔄 Reset messages
  if (successWrapper) successWrapper.style.display = "none";
  if (errorWrapper) errorWrapper.style.display = "none";
 
//
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
       }     }),
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
       
 
        // 📌 Other Details
        setField("inquiry_source", r.enquirySource);
 
       
 
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
 
 
/**
 * Calls FinalSubmission API and fills Loan Application Number
 * @param {string} mobileNo
 * @param {string|number} loanAmount
 * @param {string|number} tenure
 */
function callFinalSubmission(mobileNo, loanAmount, tenure) {
 
  const API_URL = "https://loan-backend-mock.onrender.com/tier2/FinalSubmission";
 
  console.log("Inputs:", { mobileNo, loanAmount, tenure });
 
  // ✅ Basic validation
  if (!mobileNo || !loanAmount || !tenure) {
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
 
  // 🚀 API Call
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contextParam: {},
      requestString: {
        mobileNo,
        loanAmount,
        tenure
      }
    })
  })
    .then((res) => {
      if (!res.ok) throw new Error("API error");
      return res.json();
    })
    .then((data) => {
 
      console.log("API Response:", data);
 
      if (data?.status?.responseCode === "0") {
 
        const acknowledgementId = data?.responseString?.acknowledgementId;
 
        // 🎯 Set value in your field
        setField("loan_application_numberr2", acknowledgementId);
 
        console.log("✅ Loan Application Number set:", acknowledgementId);
 
      } else {
        alert(data?.status?.errorDesc || "Submission failed");
      }
    })
    .catch((err) => {
      console.error("❌ Error:", err);
      alert("Something went wrong");
    });
}
 
 
 
/**
 * Calls generateEmailOTP API
 *
 * Calls generateEmailOTP API and fills OTP using data-id
 * @param {string} email
 */
function callGenerateEmailOTP(email) {
 
  const API_URL = "https://loan-backend-mock.onrender.com/tier2/generateEmailOTP";
 
  console.log("Email:", email);
 
  if (!email) {
    alert("Please enter email");
    return;
  }
 
  function setOTP(value) {
    const input = document.querySelector('[name="email_otp"]');
    if (!input) return;
 
    // 🔥 Use requestAnimationFrame (prevents blocking)
    requestAnimationFrame(() => {
      input.value = value || "";
 
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
 
  // 🚀 Async API (non-blocking)
  (async () => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contextParam: {},
          requestString: { email }
        })
      });
 
      if (!res.ok) throw new Error("API error");
 
      const data = await res.json();
 
      console.log("API Response:", data);
 
      if (data?.status?.responseCode === "0") {
 
        const otp = data?.responseString?.otp;
 
        setOTP(otp);
 
        console.log("✅ OTP set successfully:", otp);
 
      } else {
        alert(data?.status?.errorDesc || "Failed to generate OTP");
      }
 
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Something went wrong");
    }
  })();
}
 
 
 
// 🔥 global variable (must already exist)
 
 
 
/**
 * Validate Email OTP
 * - Shows error text if invalid
 * - Disables submit button if invalid
 * - Enables button if valid
 *
 *
//  */
// function callValidateEmailOTP(otp) {
 
//   const API_URL = "https://loan-backend-mock.onrender.com/tier2/validateEmailOTP";
 
//   otp = String(otp).trim();
 
//   const errorWrapper = document.querySelector('[data-id="text-d79db67206"]');
//   const submitBtn = document.querySelector('button[name="submit_otpp"]');
//   const otpInput = document.querySelector('[data-id="textinput-ed810a56e2"] input');
//   const backBtn = document.querySelector('button[name="back_email"]');
 
//   // ✅ NEW: Verify Mail Button
//   const verifyBtn = document.querySelector('[name="verify_work"]');
 
//   const errorTextEl = errorWrapper?.querySelector("p");
 
//   function showError() {
//     if (errorWrapper) errorWrapper.style.display = "block";
//     if (errorTextEl) {
//       errorTextEl.textContent =
//         "Invalid OTP. Please go back and check the email you have entered.";
//     }
//     if (submitBtn) submitBtn.disabled = true;
//     if (backBtn) backBtn.disabled = true;
//   }
 
//   function showSuccess() {
//     if (errorWrapper) errorWrapper.style.display = "block";
//     if (errorTextEl) {
//       errorTextEl.textContent = "OTP verified successfully";
//     }
 
//     if (submitBtn) submitBtn.disabled = false;
//     if (backBtn) backBtn.disabled = false;
 
//     // ✅ UPDATE VERIFY BUTTON HERE
//     if (verifyBtn) {
//       verifyBtn.textContent = "Verified";
//       verifyBtn.disabled = true;
//       verifyBtn.classList.add("verified");
//     }
//   }
 
//   function hideMessage() {
//     if (errorWrapper) errorWrapper.style.display = "none";
//   }
 
//   if (otpInput && !otpInput.dataset.listenerAttached) {
//     otpInput.addEventListener("input", () => {
//       hideMessage();
//       if (submitBtn) submitBtn.disabled = false;
//     });
//     otpInput.dataset.listenerAttached = "true";
//   }
 
//   hideMessage();
 
//   if (!otp) {
//     showError();
//     return;
//   }
 
//   if (submitBtn) submitBtn.disabled = true;
 
//   fetch(API_URL, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       contextParam: {},
//       requestString: { otp }
//     })
//   })
//     .then((response) => {
//       if (!response.ok) throw new Error("Network error");
//       return response.json();
//     })
//     .then((data) => {
//       if (data?.status?.responseCode === "0") {
//         showSuccess();   // ✅ success case
//       } else {
//         showError();     // ❌ error case
//       }
//     })
//     .catch(() => {
//       showError();
//     });
// }
 
function handleProceedButton() {
 
  console.log("Proceed clicked");
 
  function setField(name, value) {
    const el = document.querySelector(`[name="${name}"]`);
    if (!el) {
      console.warn(`⚠️ Field not found: ${name}`);
      return;
    }
 
    // Step 1: set immediately
    el.value = value || "";
    el.setAttribute("value", value || "");
 
    // Step 2: trigger events
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
 
    // Step 3: 🔥 FORCE EDS re-sync (this is the key)
    setTimeout(() => {
      el.value = value || "";
      el.setAttribute("value", value || "");
 
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
 
      console.log(`✅ FINAL SET [${name}] = ${value}`);
    }, 50);
  }
 
  // ✅ Read correct values
  const loanAmount     = document.querySelector('[name="loan_amount_inr"]')?.value;
  const tenure         = document.querySelector('[name="loan_tenure_months"]')?.value;
  const emiAmount      = document.querySelector('[name="emi_amount"]')?.value;
  const rateOfInterest = document.querySelector('[name="rate_of_interest"]')?.value;
 
  console.log("Values:", { loanAmount, tenure, emiAmount, rateOfInterest });
 
  // ✅ Set values
  setField("loan_amountr", loanAmount);
  setField("tenurer", tenure);
  setField("emi_amountr", emiAmount);
  setField("rateOFinterestr", rateOfInterest);
 
  console.log("✅ Data transferred successfully");
}
 
 
// Prevent form reload
document.addEventListener("click", function (e) {
  if (e.target && e.target.name === "proceed_button") {
    e.preventDefault();
    handleProceedButton();
  }
});
 
// function initOtpTimer() {
//   const TIMER_DURATION = 30;
//   const MAX_RESEND_CLICKS = 3;
 
//   const timerTextWrapper = document.querySelector('[data-id="text-55edb44cad"]');
//   const resendBtnWrapper = document.querySelector('[data-id="button-ae34ef57ad"]');
//   const resendBtn = document.querySelector('[name="resend_otp_mail"]');
//   const invalidOtpMsg = document.querySelector('[data-id="text-d79db67206"]');
//   const backBtn = document.querySelector('[name="back_email"]'); // ✅ added
 
//   if (!timerTextWrapper || !resendBtnWrapper || !resendBtn) {
//     console.error("Missing required elements");
//     return;
//   }
 
//   let countdown = null;
//   let resendClickCount = 0;
 
//   function setTimerText(seconds) {
//     const target = timerTextWrapper.querySelector("p");
//     if (!target) return;
 
//     target.textContent =
//       seconds > 0
//         ? `Resend OTP in ${seconds} second${seconds !== 1 ? "s" : ""}`
//         : "You can now resend the OTP.";
//   }
 
//   function disableResend() {
//     resendBtn.disabled = true;
//     resendBtnWrapper.classList.add("disabled");
//   }
 
//   function enableResend() {
//     if (resendClickCount < MAX_RESEND_CLICKS) {
//       resendBtn.disabled = false;
//       resendBtnWrapper.classList.remove("disabled");
//     }
//   }
 
//   function disableResendForever() {
//     resendBtn.disabled = true;
//     resendBtnWrapper.classList.add("disabled");
 
//     const target = timerTextWrapper.querySelector("p");
//     if (target) {
//       target.textContent = "Maximum OTP resend attempts reached.";
//     }
 
//     // ✅ ENABLE BACK BUTTON HERE
//     if (backBtn) {
//       backBtn.disabled = false;
//     }
//   }
 
//   function startTimer() {
//     if (countdown) clearInterval(countdown);
 
//     disableResend();
 
//     if (invalidOtpMsg) invalidOtpMsg.style.display = "none";
 
//     let secondsLeft = TIMER_DURATION;
//     setTimerText(secondsLeft);
 
//     countdown = setInterval(() => {
//       secondsLeft--;
//       setTimerText(secondsLeft);
 
//       if (secondsLeft <= 0) {
//         clearInterval(countdown);
//         countdown = null;
 
//         if (resendClickCount >= MAX_RESEND_CLICKS) {
//           disableResendForever();
//         } else {
//           enableResend();
//         }
//       }
//     }, 1000);
//   }
 
//   resendBtn.addEventListener("click", (e) => {
//     e.preventDefault();
 
//     if (resendClickCount >= MAX_RESEND_CLICKS) {
//       disableResendForever();
//       return;
//     }
 
//     resendClickCount++;
 
//     if (resendClickCount >= MAX_RESEND_CLICKS) {
//       disableResendForever();
//     }
 
//     startTimer();
//   });
 
//   // Initial state
//   disableResend();
 
//   // ❗ Optional (recommended): keep back disabled initially
//   if (backBtn) {
//     backBtn.disabled = true;
//   }
 
//   startTimer();
// }
 
// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", initOtpTimer);
// } else {
//   initOtpTimer();
/**
 * @file functions.js
 * @description Custom function for Work Email OTP Verification.
 * Place this file at: /blocks/form/functions.js
 *
 * Wiring (Universal Editor Rule Editor):
 *   Form container → Event: Initialise → Invoke Service → initWorkEmailOTP
 */

/* ─── Private Module State ───────────────────────────────────────────────── */

/** @private */
const _otpState = {
  timerInterval: null,
  resendCount: 0,
  MAX_RESEND: 3,
  TIMER_SECONDS: 30,
};

/* ─── Single Exported Function ───────────────────────────────────────────── */

/**
 * Initialises all Work Email OTP verification behaviour.
 * Attach once on the Form container's Initialise event in the Rule Editor.
 *
 * Covers:
 *  - "Verify Mail" → generates OTP via API, reveals OTP panel, starts timer
 *  - 30-second countdown → enables "Resend" after expiry
 *  - "Resend OTP" → re-generates OTP, restarts timer, tracks 3/3 attempts
 *  - "Submit OTP" → validates OTP via API
 *      ✓ Success: green "✓ Verified" on Verify Mail button, locks all fields
 *      ✗ Failure: red "Invalid OTP. Please try again.", re-enables Submit
 *  - Eye icon → toggles OTP field between password / plain text
 *
 * @name initWorkEmailOTP
 * @param {scope} globals - AEM globals object (form/field instance access).
 * @return {void}
 */
 function initWorkEmailOTP(globals) {

  /* ── Element Resolver ─────────────────────────────────────────────────── */

  /**
   * Finds an element by its `name` attribute, scoped to the outer Work Email panel.
   * @param {string} name
   * @returns {HTMLElement|null}
   */
  function getEl(name) {
    const panel = document.querySelector(
      'fieldset[data-id="panelcontainer-487a5832b7"]'
    );
    return panel ? panel.querySelector(`[name="${name}"]`) : null;
  }

  /**
   * Sets the text content of a plain-text wrapper identified by data-id.
   * @param {string} dataId
   * @param {string} msg
   * @param {string} [color]
   */
  function setText(dataId, msg, color) {
    const el = document.querySelector(`[data-id="${dataId}"]`);
    if (!el) return;
    el.innerHTML = `<p>${msg}</p>`;
    el.style.color = color || "";
  }

  /* ── API Calls ────────────────────────────────────────────────────────── */

  async function generateOTP(email) {
    try {
      const res = await fetch(
        "https://loan-backend-mock.onrender.com/tier2/generateEmailOTP",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contextParam: {}, requestString: { email } }),
        }
      );
      const data = await res.json();
      return data.status?.responseCode === "0"
        ? { success: true }
        : { success: false, error: data.status?.errorDesc || "Failed to generate OTP." };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }

  async function validateOTP(email, otp) {
    try {
      const res = await fetch(
        "https://loan-backend-mock.onrender.com/tier2/validateEmailOTP",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contextParam: {}, requestString: { email, otp } }),
        }
      );
      const data = await res.json();
      return data.status?.responseCode === "0" && data.responseString?.verified
        ? { success: true }
        : { success: false, error: data.status?.errorDesc || "Incorrect OTP." };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }

  /* ── Timer ────────────────────────────────────────────────────────────── */

  function startTimer() {
    const resendBtn = getEl("resend_otp");
    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.style.opacity = "0.5";
      resendBtn.style.cursor = "not-allowed";
    }

    let seconds = _otpState.TIMER_SECONDS;
    setText("text-622da24443", `Resend OTP in ${seconds} seconds`);

    clearInterval(_otpState.timerInterval);
    _otpState.timerInterval = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        clearInterval(_otpState.timerInterval);
        setText("text-622da24443", "You can resend OTP now.");
        if (_otpState.resendCount < _otpState.MAX_RESEND && resendBtn) {
          resendBtn.disabled = false;
          resendBtn.style.opacity = "1";
          resendBtn.style.cursor = "pointer";
        }
      } else {
        setText("text-622da24443", `Resend OTP in ${seconds} seconds`);
      }
    }, 1000);
  }

  /* ── Verify Mail Handler ──────────────────────────────────────────────── */

  async function onVerifyClick() {
    const emailInput = getEl("work_mail-id");
    const verifyBtn  = getEl("verify_work");
    const email      = emailInput?.value?.trim();

    if (!email) {
      setText("text-eeb45cf991", "Please enter a valid email address.", "red");
      return;
    }

    // Reset OTP section state
    _otpState.resendCount = 0;
    setText("text-ef1817e968", `${_otpState.MAX_RESEND}/${_otpState.MAX_RESEND} attempts`);
    setText("text-eeb45cf991", "");
    const otpInput = getEl("otp_codee_email");
    if (otpInput) otpInput.value = "";

    if (verifyBtn) { verifyBtn.disabled = true; verifyBtn.textContent = "Sending…"; }

    const result = await generateOTP(email);

    if (verifyBtn) { verifyBtn.disabled = false; verifyBtn.textContent = "Verify Mail"; }

    if (result.success) {
      // Show OTP panel
      const otpPanel = document.querySelector(
        'fieldset[data-id="panelcontainer-9163d6401a"]'
      );
      if (otpPanel) otpPanel.style.display = "block";

      // Show Submit button (hidden by default via data-visible="false")
      const submitWrapper = document.querySelector('[data-id="submit-ba0d5e3685"]');
      if (submitWrapper) submitWrapper.style.display = "block";

      startTimer();
    } else {
      setText("text-eeb45cf991", result.error || "Error generating OTP.", "red");
    }
  }

  /* ── Resend OTP Handler ───────────────────────────────────────────────── */

  async function onResendClick() {
    if (_otpState.resendCount >= _otpState.MAX_RESEND) return;

    const emailInput = getEl("work_mail-id");
    const resendBtn  = getEl("resend_otp");
    const email      = emailInput?.value?.trim();
    if (!email) return;

    _otpState.resendCount += 1;
    const attemptsLeft = _otpState.MAX_RESEND - _otpState.resendCount;
    setText("text-ef1817e968", `${attemptsLeft}/${_otpState.MAX_RESEND} attempts`);

    const otpInput = getEl("otp_codee_email");
    if (otpInput) otpInput.value = "";
    setText("text-eeb45cf991", "");

    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.textContent = "Sending…";
      resendBtn.style.opacity = "0.5";
    }

    const result = await generateOTP(email);
    if (resendBtn) resendBtn.textContent = "Resend";

    if (result.success) {
      if (_otpState.resendCount >= _otpState.MAX_RESEND) {
        // No more attempts — lock permanently
        if (resendBtn) {
          resendBtn.disabled = true;
          resendBtn.style.opacity = "0.4";
          resendBtn.style.cursor = "not-allowed";
        }
        setText("text-622da24443", "Maximum resend attempts reached.");
      } else {
        startTimer();
      }
    } else {
      setText("text-eeb45cf991", result.error || "Failed to resend OTP.", "red");
      if (_otpState.resendCount < _otpState.MAX_RESEND && resendBtn) {
        resendBtn.disabled = false;
        resendBtn.style.opacity = "1";
      }
    }
  }

  /* ── Submit OTP Handler ───────────────────────────────────────────────── */

  async function onSubmitClick() {
    const emailInput = getEl("work_mail-id");
    const otpInput   = getEl("otp_codee_email");
    const submitBtn  = getEl("submit_otp");

    const email = emailInput?.value?.trim();
    const otp   = otpInput?.value?.trim();

    if (!otp) {
      setText("text-eeb45cf991", "Please enter the OTP.", "red");
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Verifying…"; }
    setText("text-eeb45cf991", "");

    const result = await validateOTP(email, otp);

    if (result.success) {
      // ✓ OTP verified
      setText("text-eeb45cf991", "OTP Verified ✓", "green");

      // Verify Mail button → green tick, disabled
      const verifyBtn = getEl("verify_work");
      if (verifyBtn) {
        verifyBtn.textContent           = "✓ Verified";
        verifyBtn.disabled              = true;
        verifyBtn.style.backgroundColor = "#16a34a";
        verifyBtn.style.color           = "#ffffff";
        verifyBtn.style.borderColor     = "#16a34a";
        verifyBtn.style.cursor          = "default";
      }

      // Lock all OTP controls
      if (otpInput)   otpInput.disabled        = true;
      if (emailInput) emailInput.disabled       = true;
      if (submitBtn)  submitBtn.style.display   = "none";

      const resendBtn = getEl("resend_otp");
      if (resendBtn) { resendBtn.disabled = true; resendBtn.style.opacity = "0.4"; }

      clearInterval(_otpState.timerInterval);
      setText("text-622da24443", "");

    } else {
      // ✗ Invalid OTP
      setText("text-eeb45cf991", "Invalid OTP. Please try again.", "red");
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Submit"; }
    }
  }

  /* ── Toggle Password Visibility ───────────────────────────────────────── */

  function onTogglePassword() {
    const otpInput = getEl("otp_codee_email");
    const icon     = document.querySelector("#togglePassword");
    if (!otpInput) return;

    const isHidden = otpInput.type === "password";
    otpInput.type  = isHidden ? "text" : "password";
    if (icon) {
      icon.classList.toggle("bi-eye",       isHidden);
      icon.classList.toggle("bi-eye-slash", !isHidden);
    }
  }

  /* ── Bind All Listeners ───────────────────────────────────────────────── */

  const verifyBtn  = getEl("verify_work");
  const resendBtn  = getEl("resend_otp");
  const submitBtn  = getEl("submit_otp");
  const toggleIcon = document.querySelector("#togglePassword");

  if (verifyBtn)  verifyBtn.addEventListener("click",  onVerifyClick);
  if (resendBtn)  resendBtn.addEventListener("click",  onResendClick);
  if (submitBtn)  submitBtn.addEventListener("click",  onSubmitClick);
  if (toggleIcon) toggleIcon.addEventListener("click", onTogglePassword);
}