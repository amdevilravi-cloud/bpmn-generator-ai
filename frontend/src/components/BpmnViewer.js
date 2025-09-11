import React, { useEffect, useRef } from 'react';
import BpmnJS from 'bpmn-js/dist/bpmn-viewer.development.js';

const BpmnViewer = ({ xml }) => {
  const containerRef = useRef();
  const viewerRef = useRef();

  useEffect(() => {
    // Initialize BPMN viewer
    viewerRef.current = new BpmnJS({
      container: containerRef.current
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (xml && viewerRef.current) {
      viewerRef.current.importXML(xml)
        .then(({ warnings }) => {
          if (warnings.length) {
            console.warn('BPMN import warnings:', warnings);
          }
          // Zoom to fit the diagram
          viewerRef.current.get('canvas').zoom('fit-viewport');
        })
        .catch(err => {
          console.error('Error rendering BPMN diagram:', err);
        });
    }
  }, [xml]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: '100%', 
        width: '100%',
        border: '1px solid #ddd',
        borderRadius: '4px'
      }} 
    />
  );
};

export default BpmnViewer;
