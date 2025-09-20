import React, { forwardRef, useState, useImperativeHandle, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';

const flowAnimation = keyframes`
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
`;

const Container = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const ProcessDiagram = styled.div`
  position: relative;
  min-width: ${props => props.width || '1000'}px;
  min-height: ${props => props.height || '600'}px;
  margin: 0 auto;
`;

const Lane = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  position: relative;
`;

const Node = styled.div`
  width: ${props => props.width || '180'}px;
  height: ${props => props.height || '80'}px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  
  ${props => props.type === 'start' && css`
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
    width: 60px;
    height: 60px;
    border-radius: 50%;
  `}
  
  ${props => props.type === 'task' && css`
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    color: white;
  `}
  
  ${props => props.type === 'gateway' && css`
    background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
    color: white;
    width: 80px;
    height: 80px;
    transform: rotate(45deg);
    
    & > div {
      transform: rotate(-45deg);
    }
  `}
  
  ${props => props.type === 'end' && css`
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
    color: white;
    width: 60px;
    height: 60px;
    border-radius: 50%;
  `}
  
  ${props => props.type === 'event' && css`
    background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
    color: white;
    width: 60px;
    height: 60px;
    border-radius: 50%;
  `}
  
  ${props => props.highlighted && css`
    transform: scale(1.1);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    z-index: 3;
  `}
`;

const NodeContent = styled.div`
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NodeActor = styled.div`
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
  font-style: italic;
`;

const Connection = styled.div`
  position: absolute;
  height: 2px;
  background: #666;
  z-index: 1;
  
  ${props => props.vertical && css`
    width: 2px;
    height: ${props.height}px;
  `}
  
  ${props => props.horizontal && css`
    width: ${props.width}px;
    height: 2px;
  `}
  
  ${props => props.animated && css`
    &::after {
      content: '';
      position: absolute;
      top: -2px;
      left: 0;
      right: 0;
      height: 6px;
      background: #4CAF50;
      animation: ${flowAnimation} 1.5s linear infinite;
      stroke-dasharray: 8, 4;
    }
  `}
`;

const Arrow = styled.div`
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  
  ${props => props.direction === 'right' && css`
    border-width: 6px 0 6px 8px;
    border-color: transparent transparent transparent #666;
  `}
  
  ${props => props.direction === 'down' && css`
    border-width: 8px 6px 0 6px;
    border-color: #666 transparent transparent transparent;
  `}
  
  ${props => props.direction === 'up' && css`
    border-width: 0 6px 8px 6px;
    border-color: transparent transparent #666 transparent;
  `}
  
  ${props => props.direction === 'left' && css`
    border-width: 6px 8px 6px 0;
    border-color: transparent #666 transparent transparent;
  `}
`;

const ConditionLabel = styled.div`
  position: absolute;
  background: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 2;
`;

const BpmnVisualization = forwardRef(({ processInfo, simulating, currentStep }, ref) => {
  const [highlightedNode, setHighlightedNode] = useState(null);

  const highlightElement = (elementId) => {
    setHighlightedNode(elementId);
  };

  useImperativeHandle(ref, () => ({
    highlightElement
  }));

  // Generate layout based on process information
  const layout = useMemo(() => {
    if (!processInfo) return null;

    const { tasks = [], decisions = [], events = [], sequence = [] } = processInfo;
    const elements = [];
    const connections = [];
    const positions = {};
    
    let yOffset = 100;
    let xCenter = 50;
    let decisionCount = 0;
    let taskCount = 0;
    let eventCount = 0;

    // Add start event
    elements.push({
      id: 'start',
      type: 'start',
      content: 'Start',
      x: xCenter,
      y: yOffset
    });
    yOffset += 120;

    // Process sequence to create elements and connections
    sequence.forEach((step, index) => {
      if (step.toLowerCase().includes('start')) {
        // Already added
      } else if (step.toLowerCase().includes('task') || step.toLowerCase().includes('process')) {
        const task = tasks[taskCount] || { name: step, actor: 'System' };
        elements.push({
          id: `task${taskCount + 1}`,
          type: 'task',
          content: task.name,
          actor: task.actor,
          x: xCenter,
          y: yOffset
        });
        taskCount++;
        yOffset += 120;
      } else if (step.toLowerCase().includes('decision') || step.toLowerCase().includes('gateway') || step.toLowerCase().includes('if')) {
        const decision = decisions[decisionCount] || { condition: step };
        elements.push({
          id: `gateway${decisionCount + 1}`,
          type: 'gateway',
          content: decision.condition,
          x: xCenter,
          y: yOffset
        });
        decisionCount++;
        yOffset += 120;
      } else if (step.toLowerCase().includes('event')) {
        const event = events[eventCount] || step;
        elements.push({
          id: `event${eventCount + 1}`,
          type: 'event',
          content: event,
          x: xCenter,
          y: yOffset
        });
        eventCount++;
        yOffset += 120;
      } else if (step.toLowerCase().includes('end')) {
        elements.push({
          id: 'end',
          type: 'end',
          content: 'End',
          x: xCenter,
          y: yOffset
        });
      }
    });

    // Add end event if not already in sequence
    if (!elements.some(el => el.type === 'end')) {
      elements.push({
        id: 'end',
        type: 'end',
        content: 'End',
        x: xCenter,
        y: yOffset
      });
    }

    // Create connections between elements
    for (let i = 0; i < elements.length - 1; i++) {
      const current = elements[i];
      const next = elements[i + 1];
      
      connections.push({
        from: current.id,
        to: next.id,
        type: 'horizontal',
        length: 100,
        fromX: current.x,
        fromY: current.y + 40,
        toX: next.x,
        toY: next.y - 40
      });
    }

    // Handle decision paths
    decisions.forEach((decision, index) => {
      const gatewayId = `gateway${index + 1}`;
      const gateway = elements.find(el => el.id === gatewayId);
      
      if (gateway) {
        // Find yes and no paths
        const yesTask = elements.find(el => 
          el.type === 'task' && el.content.toLowerCase().includes(decision.yes?.toLowerCase().split(' ')[0] || '')
        );
        
        const noTask = elements.find(el => 
          el.type === 'task' && el.content.toLowerCase().includes(decision.no?.toLowerCase().split(' ')[0] || '')
        );

        if (yesTask) {
          connections.push({
            from: gatewayId,
            to: yesTask.id,
            type: 'diagonal',
            label: 'Yes',
            fromX: gateway.x,
            fromY: gateway.y + 40,
            toX: yesTask.x - 100,
            toY: yesTask.y - 40
          });
        }

        if (noTask) {
          connections.push({
            from: gatewayId,
            to: noTask.id,
            type: 'diagonal',
            label: 'No',
            fromX: gateway.x,
            fromY: gateway.y + 40,
            toX: noTask.x + 100,
            toY: noTask.y - 40
          });
        }
      }
    });

    return { elements, connections, width: 1000, height: yOffset + 100 };
  }, [processInfo]);

  if (!processInfo) {
    return (
      <Container>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: '#666',
          fontSize: '18px'
        }}>
          Generate a BPMN diagram to see the visualization
        </div>
      </Container>
    );
  }

  if (!layout) {
    return (
      <Container>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: '#f44336',
          fontSize: '16px'
        }}>
          Unable to generate visualization for this process structure
        </div>
      </Container>
    );
  }

  const { elements, connections, width, height } = layout;

  return (
    <Container>
      <ProcessDiagram width={width} height={height}>
        {/* Render elements */}
        {elements.map((element) => (
          <Lane key={element.id} style={{ position: 'absolute', top: element.y, left: `calc(50% - ${element.x}px)` }}>
            <Node 
              type={element.type} 
              highlighted={highlightedNode === element.id}
              width={element.width}
              height={element.height}
            >
              <NodeContent>{element.content}</NodeContent>
              {element.actor && <NodeActor>{element.actor}</NodeActor>}
            </Node>
          </Lane>
        ))}

        {/* Render connections */}
        {connections.map((conn, index) => (
          <React.Fragment key={index}>
            <Connection 
              horizontal 
              width={conn.length} 
              style={{ 
                top: conn.fromY, 
                left: `calc(50% - ${conn.fromX - conn.length/2}px)`,
                width: `${conn.length}px`
              }}
              animated={simulating && currentStep >= index}
            />
            <Arrow 
              direction="right" 
              style={{ top: conn.fromY - 6, left: `calc(50% - ${conn.fromX - conn.length/2 + conn.length}px)` }} 
            />
            
            {conn.label && (
              <ConditionLabel style={{ top: conn.fromY - 30, left: `calc(50% - ${conn.fromX - conn.length/2 + conn.length/2}px)` }}>
                {conn.label}
              </ConditionLabel>
            )}
          </React.Fragment>
        ))}
      </ProcessDiagram>
    </Container>
  );
});

export default BpmnVisualization;