import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import GenomeSelector from './components/GenomeSelector';
import AnalysisView from './components/AnalysisView';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [genomes, setGenomes] = useState([]);
  const [selectedGenome, setSelectedGenome] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeGene, setActiveGene] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/genomes`)
      .then(res => setGenomes(res.data.genomes))
      .catch(err => console.error('Failed to load genomes:', err));
  }, []);

  const handleSelectGenome = async (genomeId) => {
    setLoading(true);
    setActiveGene(null);
    setSelectedGenome(genomeId);
    
    try {
      const res = await axios.post(`${API_URL}/analyze`, { genome_id: genomeId });
      setAnalysisResults(res.data);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />
      
      <GenomeSelector 
        genomes={genomes} 
        selectedGenome={selectedGenome}
        onSelect={handleSelectGenome} 
      />
      
      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500" />
        </div>
      )}
      
      {analysisResults && !loading && (
        <AnalysisView 
          results={analysisResults}
          activeGene={activeGene}
          onGeneClick={setActiveGene}
        />
      )}
    </div>
  );
}

export default App;