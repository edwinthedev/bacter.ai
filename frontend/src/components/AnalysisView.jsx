import Antibiogram from './Antibiogram';

const AnalysisView = ({ results, activeGene, onGeneClick }) => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Antibiogram 
        predictions={results.predictions}
        onDrugClick={onGeneClick}
      />
    </div>
  );
};

export default AnalysisView;