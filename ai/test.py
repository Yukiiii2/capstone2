from openai import OpenAI

client = OpenAI(
  api_key="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"
)

response = client.responses.create(
  model="gpt-5-nano",
  input="write a haiku about ai",
  store=True,
)

print(response.output_text);
