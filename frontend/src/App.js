import React, { useState, useRef } from 'react';
import axios from 'axios';
import styled, { keyframes, css } from 'styled-components';
import ProfessionalBpmnViewer from './components/ProfessionalBpmnViewer';

// Animation for simulation
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Container = styled.div`
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f8f9fa;
`;

const InputPanel = styled.div`
  width: 30%;
  padding: 25px;
  background-color: white;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
`;

const OutputPanel = styled.div`
  width: 70%;
  display: flex;
  flex-direction: column;
`;

const ViewerContainer = styled.div`
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  background-color: white;
`;

const ExplanationContainer = styled.div`
  padding: 20px;
  height: 30%;
  overflow-y: auto;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 150px;
  margin-bottom: 20px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background-color: ${props => props.primary ? '#4CAF50' : '#6c757d'};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  margin-right: 10px;
  margin-bottom: 10px;
  transition: all 0.3s;
  
  &:hover {
    background-color: ${props => props.primary ? '#45a049' : '#5a6268'};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  ${props => props.simulating && css`
    animation: ${pulse} 1.5s infinite;
  `}
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const ValidationMessage = styled.div`
  padding: 12px;
  margin: 15px 0;
  border-radius: 6px;
  background-color: ${props => props.valid ? '#d4edda' : '#f8d7da'};
  color: ${props => props.valid ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.valid ? '#c3e6cb' : '#f5c6cb'};
  display: flex;
  align-items: center;
  
  &::before {
    content: '${props => props.valid ? '✓' : '✗'}';
    margin-right: 8px;
    font-weight: bold;
  }
`;

const ExampleBox = styled.div`
  background-color: #f0f8ff;
  border-left: 4px solid #4CAF50;
  padding: 15px;
  margin: 20px 0;
  border-radius: 4px;
  
  p {
    margin: 0;
    font-style: italic;
    color: #555;
  }
`;

const SimulationControls = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  background: white;
  padding: 10px;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 10;
  display: flex;
  gap: 10px;
`;

const HighlightedText = styled.span`
  background-color: #fffacd;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid #ffeaa7;
`;

const ToolbarButton = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: #f0f0f0;
  color: #333;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e0e0e0;
    transform: translateY(-1px);
  }
  
  &.primary {
    background: #4CAF50;
    color: white;
  }
  
  &.primary:hover {
    background: #45a049;
  }
`;

function App() {
  const [inputText, setInputText] = useState('');
  const [bpmnXml, setBpmnXml] = useState('');
  const [validation, setValidation] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [processInfo, setProcessInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const bpmnViewerRef = useRef();

  const exampleText = `When a customer places an order, first check inventory. If the items are in stock, process the payment and then ship the order. If items are not in stock, notify the customer and suggest alternatives. After shipping, send a confirmation email.`;

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post('/generate-bpmn', {
        text: inputText
      });
      
      setBpmnXml(response.data.bpmn_xml);
      setValidation(response.data.validation);
      setExplanation(response.data.explanation);
      setProcessInfo(response.data.process_info);
      setSimulationStep(0);
    } catch (error) {
      console.error('Error generating BPMN:', error);
      alert('Error generating BPMN. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = () => {
    if (!processInfo) return;
    
    setSimulating(true);
    setSimulationStep(0);
    
    // Simulation steps
    const simulationSteps = [
      'StartEvent_1',
      'Task_1', // Check inventory
      'Gateway_1', // Decision
      'Task_2', // Process payment (if in stock)
      'Task_3', // Ship order (if in stock)
      'Task_4', // Notify customer (if not in stock)
      'Task_5', // Send confirmation
      'EndEvent_1'
    ];
    
    let currentStep = 0;
    
    const simulateNextStep = () => {
      if (currentStep >= simulationSteps.length) {
        setSimulating(false);
        return;
      }
      
      setSimulationStep(currentStep);
      highlightElement(simulationSteps[currentStep]);
      
      currentStep++;
      setTimeout(simulateNextStep, 1500);
    };
    
    simulateNextStep();
  };
  
  const highlightElement = (elementId) => {
    if (bpmnViewerRef.current && bpmnViewerRef.current.highlightElement) {
      bpmnViewerRef.current.highlightElement(elementId);
    }
  };
  const ValidationMessage = styled(({ valid, ...props }) => <div {...props} />)`
  padding: 12px;
  margin: 15px 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  
  background-color: ${props => props.valid ? '#d4edda' : '#f8d7da'};
  color: ${props => props.valid ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.valid ? '#c3e6cb' : '#f5c6cb'};
  
  &::before {
    content: '${props => props.valid ? '✓' : '✗'}';
    margin-right: 8px;
    font-weight: bold;
  }
`;

  const handleLoadExample = () => {
    setInputText(exampleText);
  };

  const handleZoomIn = () => {
    if (bpmnViewerRef.current && bpmnViewerRef.current.getCanvas) {
      const canvas = bpmnViewerRef.current.getCanvas();
      canvas.zoom(1.2);
    }
  };

  const handleZoomOut = () => {
    if (bpmnViewerRef.current && bpmnViewerRef.current.getCanvas) {
      const canvas = bpmnViewerRef.current.getCanvas();
      canvas.zoom(0.8);
    }
  };

  const handleFitView = () => {
    if (bpmnViewerRef.current && bpmnViewerRef.current.getCanvas) {
      const canvas = bpmnViewerRef.current.getCanvas();
      canvas.zoom('fit-viewport');
    }
  };

  return (
    <Container>
      <InputPanel>
        <h2>Process Description</h2>
        <p>Describe your business process in natural language:</p>
        <TextArea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Example: When a customer submits a request, first validate it, then approve or reject based on criteria..."
        />
        
        <ButtonGroup>
          <Button onClick={handleGenerate} disabled={loading} primary>
            {loading ? 'Generating...' : 'Generate BPMN'}
          </Button>
          
          <Button 
            onClick={handleSimulate} 
            disabled={!processInfo || simulating}
            simulating={simulating}
          >
            {simulating ? 'Simulating...' : 'Simulate Process'}
          </Button>
        </ButtonGroup>
        
        {validation && (
          <ValidationMessage valid={validation.valid}>
            {validation.message}
          </ValidationMessage>
        )}
        
        <ExampleBox>
          <p><strong>Example:</strong> {exampleText}</p>
          <Button onClick={handleLoadExample}>
            Load Example
          </Button>
        </ExampleBox>
        
        {processInfo && (
          <div>
            <h3>Process Information</h3>
            <p><strong>Name:</strong> {processInfo.process_name}</p>
            <p><strong>Tasks:</strong> {processInfo.tasks.length}</p>
            <p><strong>Decisions:</strong> {processInfo.decisions.length}</p>
          </div>
        )}
      </InputPanel>
      
      <OutputPanel>
        <ViewerContainer>
          <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>
              BPMN Diagram
              {simulating && <span style={{ marginLeft: '10px', color: '#4CAF50', fontSize: '14px' }}>• Simulating</span>}
            </h3>
            
            
{processInfo && (
  <div className="bpmn-js-toolbar" style={{ 
    position: 'absolute', 
    top: '15px', 
    right: '15px', 
    zIndex: 20,
    background: 'white',
    padding: '10px',
    borderRadius: '6px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '8px'
  }}>
    <ToolbarButton onClick={handleFitView}>
      Fit View
    </ToolbarButton>
    <ToolbarButton onClick={handleZoomIn}>
      Zoom In
    </ToolbarButton>
    <ToolbarButton onClick={handleZoomOut}>
      Zoom Out
    </ToolbarButton>
    <ToolbarButton 
      className="primary" 
      onClick={handleSimulate}
      disabled={simulating}
    >
      {simulating ? 'Stop Sim' : 'Start Sim'}
    </ToolbarButton>
  </div>
)}
          </div>
          
          <ProfessionalBpmnViewer 
            xml={bpmnXml}
            simulating={simulating}
            currentStep={simulationStep}
            ref={bpmnViewerRef}
          />
        </ViewerContainer>
        
        <ExplanationContainer>
          <h3 style={{marginTop: 0}}>Process Explanation</h3>
          <div dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br/>') }} />
        </ExplanationContainer>
      </OutputPanel>
    </Container>
  );
}

export default App;