import { calculateBMI, getBMIClassification,getTasksSummary,getUserTasks } from './BMIHelper';
import './css/BmiResultsDisplay.css'; 

const BmiResultsDisplay = ({ userData }) => {
  const bmi = calculateBMI(userData.weight, userData.height);
  const classification = getBMIClassification(bmi);

  const summary = getTasksSummary(userData);
  const metrics = summary.calculationBasis.calculatedMetrics;
  const tasksFor = summary.tasksGeneratedFor;

  const dailyTasks = getUserTasks(userData,false);

  if (bmi === null) {
    return <p>Please enter valid height and weight to calculate BMI.</p>;
  }

  
  const statusClassName = `status-${classification.split(' ')[0]}`; 

  return (
    <div className={`bmi-card ${statusClassName}`}>
      <h2>Your BMI Results</h2>
       <h2>
    
        <span className="info-icon" title="How these tasks are generated">
            💬
            
            <div className="tooltip-text summary-tooltip-content">
                <strong>Tasks Based On:</strong>
                <ul>
                    {summary.tasksGeneratedFor.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>

            <p><small>Inputs Used: {summary.calculationBasis.inputsUsed.join(', ')}</small></p>
            </div>
        </span>
      </h2>
     
      <div className="bmi-status-container">
        <span className={`bmi-classification ${statusClassName}`}>
          {classification}
        </span>
      </div>

       <h2>Task Generation Summary</h2>
      
      <div className="summary-section">
        <h3>Calculated Metrics:</h3>
        <ul>
          <li><strong>BMI Score:</strong> {metrics.bmiScore}</li>
          <li><strong>BMI Category:</strong> {metrics.bmiCategory}</li>
          <li><strong>User Age:</strong> {metrics.userAge}</li>
          <li><strong>Trimester:</strong> {metrics.trimester}</li>
        </ul>
      </div>

      <h2>Your Personalized Daily Task List</h2>
            <p>Here are your recommended tasks based on your current health profile:</p>

            <ul>
                {dailyTasks.map((task, index) => (
                    <li key={index}>
                        <strong>{task.title}</strong> 
                    </li>
                ))}
            </ul>
    </div>
  );
};

export default BmiResultsDisplay;
