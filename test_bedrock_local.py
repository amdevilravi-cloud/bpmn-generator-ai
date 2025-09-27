import os
import sys

# Add current directory to path
sys.path.append('.')

from bedrock_service import bedrock_service

# Set your AWS credentials for testing
os.environ['AWS_ACCESS_KEY_ID'] = 'your-access-key'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'your-secret-key'
os.environ['AWS_REGION'] = 'us-east-1'

def test_bedrock():
    try:
        prompt = "What is 2+2? Return only the number."
        response = bedrock_service.invoke_claude_haiku(prompt)
        print("✅ Bedrock test successful!")
        print("Response:", response)
        return True
    except Exception as e:
        print("❌ Bedrock test failed:", e)
        return False

if __name__ == "__main__":
    test_bedrock()