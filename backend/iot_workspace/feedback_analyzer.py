from .llama3_integration import Llama3Analyzer

class FeedbackAnalyzer:
    def __init__(self):
        self.llm = Llama3Analyzer()

    def analyze_feedback(self, feedback, device_stats):
        prompt = f"Feedback: {feedback}\nDevice Stats: {device_stats}\nAnalyze the feedback and suggest improvements."
        return self.llm.analyze(prompt)