import React, { useEffect, useRef, forwardRef, useState, useImperativeHandle } from 'react';
import BpmnJS from 'bpmn-js/dist/bpmn-viewer.development.js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import './ProfessionalBpmnViewer.css';

const ProfessionalBpmnViewer = forwardRef(({ xml, simulating, currentStep }, ref) => {
  const containerRef = useRef();
  const viewerRef = useRef();
  const [currentElement, setCurrentElement] = useState(null);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useImperativeHandle(ref, () => ({
    highlightElement: (elementId) => {
      if (viewerRef.current) {
        const elementRegistry = viewerRef.current.get('elementRegistry');
        const canvas = viewerRef.current.get('canvas');
        
        // Remove previous highlights
        if (currentElement) {
          const previousElement = elementRegistry.get(currentElement);
          if (previousElement) {
            canvas.removeMarker(previousElement, 'highlight');
          }
        }
        
        // Highlight new element
        const element = elementRegistry.get(elementId);
        if (element) {
          canvas.addMarker(element, 'highlight');
          setCurrentElement(elementId);
          
          // Zoom to element
          canvas.zoom('fit-viewport', element);
        }
      }
    },
    getCanvas: () => {
      return viewerRef.current ? viewerRef.current.get('canvas') : null;
    },
    zoomIn: () => {
      if (viewerRef.current) {
        const canvas = viewerRef.current.get('canvas');
        const zoomLevel = canvas.zoom();
        canvas.zoom(zoomLevel * 1.2);
      }
    },
    zoomOut: () => {
      if (viewerRef.current) {
        const canvas = viewerRef.current.get('canvas');
        const zoomLevel = canvas.zoom();
        canvas.zoom(zoomLevel * 0.8);
      }
    },
    fitView: () => {
      if (viewerRef.current) {
        const canvas = viewerRef.current.get('canvas');
        canvas.zoom('fit-viewport');
      }
    }
  }));

  // Handle container resizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    // Initialize BPMN viewer
    viewerRef.current = new BpmnJS({
      container: containerRef.current
    });

    viewerRef.current.on('import.done', (event) => {
      setError(null);
      
      // Resize the viewer to fit the container
      if (viewerRef.current) {
        viewerRef.current.get('canvas').resized();
      }
    });

    viewerRef.current.on('import.error', (event) => {
      setError('Failed to load BPMN diagram. The XML may be invalid.');
      console.error('BPMN import error:', event.error);
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (xml && viewerRef.current) {
      setError(null);
      viewerRef.current.importXML(xml)
        .then(({ warnings }) => {
          if (warnings.length) {
            console.warn('BPMN import warnings:', warnings);
          }
          viewerRef.current.get('canvas').zoom('fit-viewport');
        })
        .catch(err => {
          setError('Failed to render BPMN diagram. Please check the console for details.');
          console.error('Error rendering BPMN diagram:', err);
        });
    }
  }, [xml]);

  // Resize the viewer when dimensions change
  useEffect(() => {
    if (viewerRef.current && dimensions.width > 0 && dimensions.height > 0) {
      viewerRef.current.get('canvas').resized();
    }
  }, [dimensions]);

  if (error) {
    return (
      <div className="professional-bpmn-container">
        <div className="error-message">
          <h3>Diagram Error</h3>
          <p>{error}</p>
          <p>Please try generating the diagram again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="professional-bpmn-container">
      <div 
        ref={containerRef} 
        className="bpmn-diagram"
      />
      
      {!xml && (
        <div className="placeholder-message">
          <h3>BPMN Diagram</h3>
          <p>Generate a BPMN diagram to see the visualization here.</p>
          <p>The diagram will show proper sequence flows between all elements.</p>
        </div>
      )}
      
      {simulating && (
        <div className="simulation-controls">
          <div className="simulation-progress">
            <span>Step {currentStep} of 8</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentStep / 8) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProfessionalBpmnViewer;