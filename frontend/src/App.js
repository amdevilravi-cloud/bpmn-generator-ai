import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import BpmnViewer from './components/BpmnViewer';

const Container = styled.div`
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
`;

const InputPanel = styled.div`
  width: 30%;
  padding: 20px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  overflow-y: auto;
`;

const OutputPanel = styled.div`
  width: 70%;
  display: flex;
  flex-direction: column;
`;

const ViewerContainer = styled.div`
  flex: 1;
  border-bottom: 1px solid #ddd;
`;

const ExplanationContainer = styled.div`
  padding: 20px;
  height: 30%;
  overflow-y: auto;
  background-color: #f9f9f9;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 150px;
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    background-color: #45a049;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ValidationMessage = styled.div`
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  background-color: ${props => props.valid ? '#d4edda' : '#f8d7da'};
  color: ${props => props.valid ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.valid ? '#c3e6cb' : '#f5c6cb'};
`;

// Create axios instance with base URL
// Replace the api instance creation with:
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000'
});

function App() {
  const [inputText, setInputText] = useState('');
  const [bpmnXml, setBpmnXml] = useState('');
  const [validation, setValidation] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    try {
      const response = await api.post('/generate-bpmn', {
        text: inputText
      });
      
      setBpmnXml(response.data.bpmn_xml);
      setValidation(response.data.validation);
      setExplanation(response.data.explanation);
    } catch (error) {
      console.error('Error generating BPMN:', error);
      alert('Error generating BPMN. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const exampleText = `When a customer places an order, first check inventory. If the items are in stock, process the payment and then ship the order. If items are not in stock, notify the customer and suggest alternatives. After shipping, send a confirmation email.`;

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
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate BPMN'}
        </Button>
        
        <div style={{marginTop: '20px'}}>
          <h3>Example</h3>
          <p>{exampleText}</p>
          <Button onClick={() => setInputText(exampleText)}>
            Load Example
          </Button>
        </div>
      </InputPanel>
      
      <OutputPanel>
        <ViewerContainer>
          <h3>BPMN Diagram</h3>
          <BpmnViewer xml={bpmnXml} />
        </ViewerContainer>
        
        <ExplanationContainer>
          <h3>Explanation</h3>
          {validation && (
            <ValidationMessage valid={validation.valid}>
              <strong>Validation:</strong> {validation.message}
            </ValidationMessage>
          )}
          <p>{explanation || 'The explanation will appear here after generation.'}</p>
        </ExplanationContainer>
      </OutputPanel>
    </Container>
  );
}

export default App;