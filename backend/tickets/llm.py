import os
import json
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def classify_ticket(description):

    prompt = f"""
You are a support ticket classifier.

Categories:
billing
technical
account
general

Priorities:
low
medium
high
critical

Return ONLY JSON like this:

{{
"category": "...",
"priority": "..."
}}

Ticket:
{description}
"""

    try:

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        result = response.choices[0].message.content

        return json.loads(result)

    except Exception as e:
        print("LLM ERROR:", e)
        return None