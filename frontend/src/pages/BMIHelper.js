export function calculateBMI(weight, height) {
  if (height <= 0 || weight <= 0) {
    return null; 
  }
    const heightM = height / 100;

  const bmi = weight / (heightM * heightM);
  return parseFloat(bmi.toFixed(1));
}

export function getBMIClassification(bmi) {
    if (isNaN(bmi) || !isFinite(bmi)) return "Normal weight";
    if (bmi < 18.5) return "Underweight";
    if (bmi >= 18.5 && bmi <= 24.9) return "Normal weight";
    if (bmi >= 25.0 && bmi <= 29.9) return "Overweight";
    return "Obese";
}

export function getTasksSummary(userData) {
    const bmi = calculateBMI(userData.weight, userData.height);
    const bmiCategory = getBMIClassification(bmi);
    const userAge = userData.age;
    const trimester = Math.ceil(userData.pregnancyMonth / 3);

    return {
        calculationBasis: {
            inputsUsed: ["height", "weight", "age", "pregnancyMonth", "working status"],
            calculatedMetrics: {
                bmiScore: bmi,
                bmiCategory: bmiCategory,
                trimester: trimester,
                userAge: userAge,
            },
        },
        tasksGeneratedFor: [
            "Default daily health routines (e.g., sleep, hygiene, core meals)",
            "BMI-specific health goals and advice (Underweight/Overweight/Obesity)",
            "Trimester-specific exercises (adjusted for energy levels/safety)",
            "Maternal age adjustments (e.g., extra rest for advanced maternal age)"
        ]
    };
}


const calculateBMICategory = (height, weight) => {
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    if (isNaN(bmi) || !isFinite(bmi)) return "Normal weight";
    if (bmi < 18.5) return "Underweight";
    if (bmi >= 18.5 && bmi <= 24.9) return "Normal weight";
    if (bmi >= 25.0 && bmi <= 29.9) return "Overweight";
    return "Obese";

};


const determineTimeSlot = (isWorking, isMorning) => {
    if (isWorking) {
        return isMorning ? "8:30 AM" : "4:30 PM"; 
    } else {
        return isMorning ? "10:00 AM" : "2:00 PM"; 
    }
};



const getTrimesterExercises = (month, userData) => {
  const isWorking = userData.working;

  if (month >= 1 && month <= 3) {
    const morningSlot = determineTimeSlot(isWorking, true); 
    return [
      { emoji: "🚶‍♀️", title: "Light walking (15-20 min)", time: morningSlot, isPreset: true },
      { emoji: "🤰", title: "Prenatal stretches", time: "Evening", isPreset: true },
    ];
  } else if (month >= 4 && month <= 6) {
    const morningSlot = determineTimeSlot(isWorking, true);
    const afternoonSlot = determineTimeSlot(isWorking, false);
    return [
      { emoji: "🚶‍♀️", title: "Moderate walking (20-30 min)", time: morningSlot, isPreset: true },
      { emoji: "🧘‍♀️", title: "Prenatal yoga (low impact)", time: afternoonSlot, isPreset: true },
    ];
  } else if (month >= 7 && month <= 9) {
    const morningSlot = determineTimeSlot(isWorking, true);
    return [
      { emoji: "🚶‍♀️", title: "Gentle walking (10-15 min)", time: morningSlot, isPreset: true },
      { emoji: "🛁", title: "Relaxation and stretching", time: "Evening", isPreset: true },
    ];
  } else {
    return [];
  }
};

const getBMISpecificTasks = (bmiCategory, userData) => {
  const isWorking = userData.working;
  const dynamicExerciseSlot = determineTimeSlot(isWorking, false); 

  switch (bmiCategory) {
    case "Underweight":
      return [
        { emoji: "🍎", title: "Extra protein snack", time: "Mid-morning", isPreset: true },
        { emoji: "🩰", title: "Light prenatal ballet/barre", time: dynamicExerciseSlot, isPreset: true },
      ];
    case "Overweight":
      return [
        { emoji: "🧘‍♂️", title: "Gentle meditation/mindfulness", time: dynamicExerciseSlot, isPreset: true },
        { emoji: "🚶‍♀️", title: "Stair climbing or walking", time: dynamicExerciseSlot, isPreset: true },
      ];
    case "Normal weight":
      return [
        { emoji: "🎨", title: "Creative activity (drawing/crafts)", time: "Evening", isPreset: true },
        { emoji: "🛁", title: "Relaxing bath/foot soak", time: "Before sleep", isPreset: true },
      ];
    case "Obese":
      return [
        { emoji: "📝", title: "Track food intake (journaling)", time: "After meals", isPreset: true },
        { emoji: "💬", title: "Discuss weight goals with dietitian", time: "Weekly", isPreset: true },
      ];
    default:
      return [];
  }
};

const getAgeAdjustments = (age) => {
  if (age < 25)
    return [{ emoji: "💪", title: "Maintain regular activity", time: "Anytime", isPreset: true }];
  if (age <= 34)
    return [{ emoji: "🧘‍♀️", title: "Mindfulness/meditation", time: "Evening", isPreset: true }];
  if (age <= 40)
    return [{ emoji: "🛌", title: "Extra rest/nap", time: "Afternoon", isPreset: true }];
  return [{ emoji: "💧", title: "Stay hydrated, rest often", time: "Throughout day", isPreset: true }];
};

const defaultTasks = [
  { emoji: "🥗", title: "Eat a balanced lunch", time: "1:00 PM", isPreset: true },
  { emoji: "📖", title: "Read a chapter from a pregnancy book", time: "4:00 PM", isPreset: true },
  { emoji: "🦷", title: "Brush and floss teeth", time: "9:30 PM", isPreset: true },
  { emoji: "📞", title: "Check in with a friend or family member", time: "Evening", isPreset: true },
  { emoji: "😴", title: "Ensure 8 hours of sleep opportunity", time: "10:00 PM", isPreset: true },
];



export function getUserTasks (userData,isDefault=true) {
    
    const bmiCategory = calculateBMICategory(userData.height, userData.weight);
    
    const userAge = userData.age; 

   
    if(isDefault){
    return [
        ...defaultTasks,
        ...getBMISpecificTasks(bmiCategory, userData),
        ...getTrimesterExercises(userData.pregnancyMonth, userData),
        ...getAgeAdjustments(userAge), 
    ];
    }
    else{
        return [
        ...getBMISpecificTasks(bmiCategory, userData),
        ...getTrimesterExercises(userData.pregnancyMonth, userData),
        ...getAgeAdjustments(userAge), 
    ];
    }
};
