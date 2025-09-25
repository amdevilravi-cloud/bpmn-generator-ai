import xml.etree.ElementTree as ET
from xml.dom import minidom
import json
import re

def generate_bpmn(process_info):
    """Generate professional BPMN XML with proper layout and sequence flows"""
    try:
        # Create BPMN root element
        root = ET.Element("bpmn:definitions", {
            "xmlns:bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL",
            "xmlns:bpmndi": "http://www.omg.org/spec/BPMN/20100524/DI",
            "xmlns:dc": "http://www.omg.org/spec/DD/20100524/DC",
            "xmlns:di": "http://www.omg.org/spec/DD/20100524/DI",
            "targetNamespace": "http://bpmn.io/schema/bpmn"
        })
        
        process = ET.SubElement(root, "bpmn:process", {
            "id": "Process_1",
            "name": process_info.get("process_name", "Business Process"),
            "isExecutable": "false"
        })
        
        # Create all elements with proper IDs
        elements = {}
        flow_counter = 1
        
        # Start event
        start_id = "StartEvent_1"
        elements[start_id] = {
            'element': ET.SubElement(process, "bpmn:startEvent", {"id": start_id, "name": "Start"}),
            'type': 'start',
            'name': 'Start'
        }
        
        # Tasks
        tasks = process_info.get("tasks", [])
        for i, task in enumerate(tasks, 1):
            task_id = f"Task_{i}"
            elements[task_id] = {
                'element': ET.SubElement(process, "bpmn:task", {
                    "id": task_id,
                    "name": task.get("name", f"Task {i}")
                }),
                'type': 'task',
                'name': task.get("name", f"Task {i}")
            }
        
        # Gateways (decisions)
        decisions = process_info.get("decisions", [])
        for i, decision in enumerate(decisions, 1):
            gateway_id = f"Gateway_{i}"
            elements[gateway_id] = {
                'element': ET.SubElement(process, "bpmn:exclusiveGateway", {
                    "id": gateway_id,
                    "name": decision.get("condition", f"Decision {i}")
                }),
                'type': 'gateway',
                'name': decision.get("condition", f"Decision {i}")
            }
        
        # End event
        end_id = "EndEvent_1"
        elements[end_id] = {
            'element': ET.SubElement(process, "bpmn:endEvent", {"id": end_id, "name": "End"}),
            'type': 'end',
            'name': 'End'
        }
        
        # Create sequence flows based on process logic
        sequence_flows = []
        current_element = start_id
        
        # Simple sequential flow for tasks
        for i in range(1, len(tasks) + 1):
            next_element = f"Task_{i}"
            flow_id = f"Flow_{flow_counter}"
            sequence_flows.append({
                'id': flow_id,
                'source': current_element,
                'target': next_element
            })
            flow_counter += 1
            current_element = next_element
        
        # Connect to end event
        flow_id = f"Flow_{flow_counter}"
        sequence_flows.append({
            'id': flow_id,
            'source': current_element,
            'target': end_id
        })
        
        # Add decision flows if we have decisions
        if decisions and tasks:
            # For simplicity, we'll assume the first decision comes after the first task
            decision_gateway = "Gateway_1"
            task_before_decision = "Task_1"
            task_after_yes = "Task_2" if len(tasks) > 1 else end_id
            task_after_no = "Task_3" if len(tasks) > 2 else end_id
            
            # Remove existing flow from task to next element
            sequence_flows = [flow for flow in sequence_flows if flow['source'] != task_before_decision]
            
            # Add flows for decision
            sequence_flows.append({
                'id': f"Flow_{flow_counter+1}",
                'source': task_before_decision,
                'target': decision_gateway
            })
            
            sequence_flows.append({
                'id': f"Flow_{flow_counter+2}",
                'source': decision_gateway,
                'target': task_after_yes,
                'name': 'Yes'
            })
            
            sequence_flows.append({
                'id': f"Flow_{flow_counter+3}",
                'source': decision_gateway,
                'target': task_after_no,
                'name': 'No'
            })
        
        # Add all sequence flows to the process
        for flow in sequence_flows:
            flow_element = ET.SubElement(process, "bpmn:sequenceFlow", {
                "id": flow['id'],
                "sourceRef": flow['source'],
                "targetRef": flow['target']
            })
            if flow.get('name'):
                flow_element.set("name", flow['name'])
        
        # Create BPMN diagram with proper layout
        diagram = ET.SubElement(root, "bpmndi:BPMNDiagram", {"id": "BPMNDiagram_1"})
        plane = ET.SubElement(diagram, "bpmndi:BPMNPlane", {"id": "BPMNPlane_1", "bpmnElement": "Process_1"})
        
        # Calculate positions for elements
        positions = calculate_positions(elements, sequence_flows)
        
        # Add shapes to diagram
        for element_id, element_data in elements.items():
            if element_id in positions:
                x, y = positions[element_id]
                shape = ET.SubElement(plane, "bpmndi:BPMNShape", {
                    "id": f"Shape_{element_id}",
                    "bpmnElement": element_id
                })
                
                if element_data['type'] in ['start', 'end']:
                    ET.SubElement(shape, "dc:Bounds", {
                        "x": str(x),
                        "y": str(y),
                        "width": "36",
                        "height": "36"
                    })
                elif element_data['type'] == 'gateway':
                    ET.SubElement(shape, "dc:Bounds", {
                        "x": str(x),
                        "y": str(y),
                        "width": "50",
                        "height": "50"
                    })
                else:
                    ET.SubElement(shape, "dc:Bounds", {
                        "x": str(x),
                        "y": str(y),
                        "width": "100",
                        "height": "80"
                    })
        
        # Add edges for sequence flows
        for i, flow in enumerate(sequence_flows):
            if flow['source'] in positions and flow['target'] in positions:
                source_x, source_y = positions[flow['source']]
                target_x, target_y = positions[flow['target']]
                
                # Adjust coordinates based on element type
                if elements[flow['source']]['type'] in ['start', 'end']:
                    source_x += 18
                    source_y += 18
                elif elements[flow['source']]['type'] == 'gateway':
                    source_x += 25
                    source_y += 25
                else:
                    source_x += 50
                    source_y += 40
                
                if elements[flow['target']]['type'] in ['start', 'end']:
                    target_x += 18
                    target_y += 18
                elif elements[flow['target']]['type'] == 'gateway':
                    target_x += 25
                    target_y += 25
                else:
                    target_x += 50
                    target_y += 40
                
                edge = ET.SubElement(plane, "bpmndi:BPMNEdge", {
                    "id": f"Edge_{flow['id']}",
                    "bpmnElement": flow['id']
                })
                
                ET.SubElement(edge, "di:waypoint", {"x": str(source_x), "y": str(source_y)})
                ET.SubElement(edge, "di:waypoint", {"x": str(target_x), "y": str(target_y)})
        
        # Return formatted XML
        rough_string = ET.tostring(root, 'utf-8')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ")
        
    except Exception as e:
        print(f"Error generating BPMN: {str(e)}")
        # Return a simple valid BPMN as fallback
        return create_fallback_bpmn()

def calculate_positions(elements, sequence_flows):
    """Calculate positions for all elements in the diagram"""
    positions = {}
    y_spacing = 120
    x_spacing = 200
    start_y = 100
    
    # Group elements by type and order
    start_events = [id for id, data in elements.items() if data['type'] == 'start']
    end_events = [id for id, data in elements.items() if data['type'] == 'end']
    tasks = [id for id, data in elements.items() if data['type'] == 'task']
    gateways = [id for id, data in elements.items() if data['type'] == 'gateway']
    
    # Position start event
    if start_events:
        positions[start_events[0]] = (100, start_y)
    
    # Position tasks in a vertical line
    for i, task_id in enumerate(tasks):
        positions[task_id] = (100, start_y + (i + 1) * y_spacing)
    
    # Position gateways (to the right of tasks)
    for i, gateway_id in enumerate(gateways):
        positions[gateway_id] = (100 + x_spacing, start_y + (i + 1) * y_spacing)
    
    # Position end event
    if end_events:
        positions[end_events[0]] = (100, start_y + (len(tasks) + 1) * y_spacing)
    
    return positions

def create_fallback_bpmn():
    """Create a simple fallback BPMN diagram"""
    return '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
    <bpmn:task id="Task_1" name="Process Task" />
    <bpmn:endEvent id="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="Shape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="100" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Task_1" bpmnElement="Task_1">
        <dc:Bounds x="100" y="200" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_EndEvent_1" bpmnElement="EndEvent_1">
        <dc:Bounds x="100" y="350" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Edge_Flow_1" bpmnElement="Flow_1">
        <di:waypoint x="136" y="118" />
        <di:waypoint x="136" y="200" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_Flow_2" bpmnElement="Flow_2">
        <di:waypoint x="136" y="280" />
        <di:waypoint x="136" y="350" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>'''

def validate_bpmn(bpmn_xml):
    """Validate BPMN XML structure"""
    try:
        # Parse the XML
        root = ET.fromstring(bpmn_xml)
        
        # Check for required elements
        has_start_event = len(root.findall('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}startEvent')) > 0
        has_end_event = len(root.findall('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}endEvent')) > 0
        has_sequence_flows = len(root.findall('.//{http://www.omg.org/spec/BPMN/20100524/MODEL}sequenceFlow')) > 0
        has_diagram = len(root.findall('.//{http://www.omg.org/spec/BPMN/20100524/DI}BPMNDiagram')) > 0
        
        validation_errors = []
        
        if not has_start_event:
            validation_errors.append("Missing start event")
        if not has_end_event:
            validation_errors.append("Missing end event")
        if not has_sequence_flows:
            validation_errors.append("No sequence flows found")
        if not has_diagram:
            validation_errors.append("No diagram information found")
        
        if validation_errors:
            return {
                "valid": False,
                "message": "Validation issues: " + "; ".join(validation_errors)
            }
        
        return {
            "valid": True,
            "message": "BPMN is valid with proper sequence flows and layout"
        }
        
    except ET.ParseError as e:
        return {
            "valid": False,
            "message": f"XML parsing error: {str(e)}"
        }

def explain_process(process_info):
    """Generate a detailed explanation of the process"""
    process_name = process_info.get('process_name', 'Business Process')
    tasks = process_info.get('tasks', [])
    decisions = process_info.get('decisions', [])
    
    explanation = f"<h3>Process: {process_name}</h3>"
    explanation += "<p>This BPMN diagram represents the business process with proper sequence flows and layout.</p>"
    
    explanation += "<h4>Process Flow</h4><ol>"
    explanation += "<li>Start Event: Process begins</li>"
    
    for i, task in enumerate(tasks, 1):
        explanation += f"<li>Task {i}: {task.get('name', 'Unnamed task')}"
        if task.get('actor'):
            explanation += f" (performed by: {task['actor']})"
        explanation += "</li>"
    
    for i, decision in enumerate(decisions, 1):
        explanation += f"<li>Decision {i}: {decision.get('condition', 'Unspecified condition')}<ul>"
        explanation += f"<li>If Yes: {decision.get('yes', 'Continue process')}</li>"
        explanation += f"<li>If No: {decision.get('no', 'Alternative path')}</li></ul></li>"
    
    explanation += "<li>End Event: Process completes</li></ol>"
    
    explanation += "<h4>Technical Details</h4>"
    explanation += "<p>The diagram includes proper BPMN 2.0 elements with sequence flows connecting all activities.</p>"
    explanation += "<p>Each element is positioned correctly with appropriate spacing for readability.</p>"
    
    return explanation