import ollama

class Llama3Analyzer:
    def __init__(self, model_name="llama3"):
        self.model_name = model_name

    def analyze(self, prompt: str) -> str:
        try:
            # Send the prompt to the Llama3 model
            response = ollama.chat(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            # Validate the response structure
            if "message" in response and "content" in response["message"]:
                return response["message"]["content"]
            else:
                return "Error: Unexpected response format from the model."
        except Exception as e:
            # Handle any errors during the API call
            return f"Error during analysis: {str(e)}"