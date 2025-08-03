/**
 * Security Questions Configuration for Password Reset
 * 
 * These questions are designed to generate sufficiently random answers
 * to prevent common or easily guessable responses.
 */

const securityQuestions = [
  {
    id: 'childhood_address_number',
    question: 'What was the house/apartment number of your childhood home? (numbers only)',
    category: 'personal_history',
    guidance: 'Enter only the numeric part of your address (e.g., if you lived at "123 Main St", enter "123")',
    validation: {
      minLength: 1,
      maxLength: 10,
      pattern: /^\d+$/,
      errorMessage: 'Please enter only numbers'
    }
  },
  {
    id: 'first_phone_last_four',
    question: 'What were the last four digits of your first personal phone number?',
    category: 'personal_history',
    guidance: 'Enter the last 4 digits of the first phone number that was specifically yours',
    validation: {
      minLength: 4,
      maxLength: 4,
      pattern: /^\d{4}$/,
      errorMessage: 'Please enter exactly 4 digits'
    }
  },
  {
    id: 'childhood_friend_first_name',
    question: 'What was the first name of your best friend in elementary school?',
    category: 'personal_history',
    guidance: 'Enter the first name only, exactly as you remember it',
    validation: {
      minLength: 2,
      maxLength: 30,
      pattern: /^[a-zA-Z\s-']+$/,
      errorMessage: 'Please enter only letters, spaces, hyphens, and apostrophes'
    }
  },
  {
    id: 'first_car_license_last_three',
    question: 'What were the last three characters of your first car\'s license plate?',
    category: 'personal_history',
    guidance: 'Enter the last 3 characters (letters or numbers) of your first car\'s license plate',
    validation: {
      minLength: 3,
      maxLength: 3,
      pattern: /^[A-Z0-9]{3}$/,
      errorMessage: 'Please enter exactly 3 characters (letters or numbers)'
    }
  },
  {
    id: 'graduation_year',
    question: 'What year did you graduate from high school? (YYYY format)',
    category: 'education',
    guidance: 'Enter the 4-digit year you graduated from high school',
    validation: {
      minLength: 4,
      maxLength: 4,
      pattern: /^(19|20)\d{2}$/,
      errorMessage: 'Please enter a valid 4-digit year (1900-2099)'
    }
  },
  {
    id: 'first_job_building_number',
    question: 'What was the building/street number of your first job location?',
    category: 'work_history',
    guidance: 'Enter only the numeric part of the address where you had your first job',
    validation: {
      minLength: 1,
      maxLength: 10,
      pattern: /^\d+$/,
      errorMessage: 'Please enter only numbers'
    }
  },
  {
    id: 'childhood_pet_age',
    question: 'How old was your first pet when you got it? (in years, whole numbers only)',
    category: 'personal_history',
    guidance: 'Enter the age in years as a whole number (e.g., if 6 months old, enter 0)',
    validation: {
      minLength: 1,
      maxLength: 2,
      pattern: /^\d{1,2}$/,
      errorMessage: 'Please enter a number between 0-99'
    }
  },
  {
    id: 'birth_hospital_first_word',
    question: 'What is the first word in the name of the hospital where you were born?',
    category: 'personal_history',
    guidance: 'Enter only the first word of the hospital name (e.g., for "St. Mary\'s Hospital", enter "St")',
    validation: {
      minLength: 2,
      maxLength: 20,
      pattern: /^[a-zA-Z.']+$/,
      errorMessage: 'Please enter only letters, periods, and apostrophes'
    }
  },
  {
    id: 'elementary_school_mascot',
    question: 'What was your elementary school\'s mascot or team name?',
    category: 'education',
    guidance: 'Enter the mascot or team name (e.g., Eagles, Tigers, Lions)',
    validation: {
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-zA-Z\s-']+$/,
      errorMessage: 'Please enter only letters, spaces, hyphens, and apostrophes'
    }
  },
  {
    id: 'first_concert_year',
    question: 'What year did you attend your first concert or live music event? (YYYY format)',
    category: 'personal_history',
    guidance: 'Enter the 4-digit year of your first concert experience',
    validation: {
      minLength: 4,
      maxLength: 4,
      pattern: /^(19|20)\d{2}$/,
      errorMessage: 'Please enter a valid 4-digit year (1900-2099)'
    }
  }
];

/**
 * Get questions by category
 */
const getQuestionsByCategory = (category) => {
  return securityQuestions.filter(q => q.category === category);
};

/**
 * Get a random selection of questions
 */
const getRandomQuestions = (count = 3) => {
  const shuffled = [...securityQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * Get question by ID
 */
const getQuestionById = (id) => {
  return securityQuestions.find(q => q.id === id);
};

/**
 * Validate answer format
 */
const validateAnswer = (questionId, answer) => {
  const question = getQuestionById(questionId);
  if (!question) {
    return { isValid: false, error: 'Invalid question ID' };
  }

  const { validation } = question;
  const trimmedAnswer = answer.trim();

  // Check length
  if (trimmedAnswer.length < validation.minLength || trimmedAnswer.length > validation.maxLength) {
    return { 
      isValid: false, 
      error: `Answer must be between ${validation.minLength} and ${validation.maxLength} characters` 
    };
  }

  // Check pattern
  if (validation.pattern && !validation.pattern.test(trimmedAnswer)) {
    return { 
      isValid: false, 
      error: validation.errorMessage 
    };
  }

  return { isValid: true };
};

/**
 * Security guidelines for answers
 */
const securityGuidelines = {
  general: [
    'Choose questions you can answer consistently over time',
    'Avoid answers that might change or that others could easily guess',
    'Your answers are case-insensitive and will be trimmed of extra spaces',
    'Make sure you can remember your exact answers for future password resets'
  ],
  examples: {
    good: [
      'Specific numbers (house numbers, phone digits, years)',
      'First names of childhood friends',
      'Specific locations or places from your past'
    ],
    bad: [
      'Common answers like "blue" for favorite color',
      'Popular books, movies, or songs',
      'Generic pet names like "Fluffy" or "Buddy"'
    ]
  }
};

module.exports = {
  securityQuestions,
  getQuestionsByCategory,
  getRandomQuestions,
  getQuestionById,
  validateAnswer,
  securityGuidelines
};
