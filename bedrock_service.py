import boto3
import json
import os
from botocore.exceptions import ClientError, BotoCoreError

class BedrockService:
    def __init__(self):
        self.region = os.environ.get('AWS_REGION', 'us-east-1')
        self.client = self._initialize_bedrock_client()
    
    def _initialize_bedrock_client(self):
        """Initialize AWS Bedrock client"""
        try:
            # boto3 will automatically use AWS credentials from environment variables
            client = boto3.client(
                'bedrock-runtime',
                region_name=self.region
            )
            return client
        except Exception as e:
            print(f"Error initializing Bedrock client: {e}")
            return None
    
    def invoke_claude_haiku(self, prompt, max_tokens=1000, temperature=0.7):
        """Invoke Claude 3 Haiku model"""
        if not self.client:
            raise Exception("Bedrock client not initialized")
        
        try:
            # Claude 3 Haiku model ID
            model_id = "anthropic.claude-3-haiku-20240307-v1:0"
            
            # Format the request body for Claude
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            response = self.client.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body)
            )
            
            # Parse the response
            response_body = json.loads(response['body'].read())
            return response_body['content'][0]['text']
            
        except ClientError as e:
            error_message = f"AWS ClientError: {e.response['Error']['Message']}"
            print(error_message)
            raise Exception(error_message)
        except BotoCoreError as e:
            error_message = f"AWS BotoCoreError: {str(e)}"
            print(error_message)
            raise Exception(error_message)
        except Exception as e:
            error_message = f"Unexpected error: {str(e)}"
            print(error_message)
            raise Exception(error_message)

# Singleton instance
bedrock_service = BedrockService()
# Add this to bedrock_service.py
class CostTracker:
    def __init__(self):
        # Claude 3 Haiku pricing (per 1M tokens)
        self.input_cost_per_million = 0.25  # $0.25 per 1M input tokens
        self.output_cost_per_million = 1.25  # $1.25 per 1M output tokens
    
    def estimate_cost(self, input_tokens, output_tokens):
        input_cost = (input_tokens / 1_000_000) * self.input_cost_per_million
        output_cost = (output_tokens / 1_000_000) * self.output_cost_per_million
        return round(input_cost + output_cost, 6)