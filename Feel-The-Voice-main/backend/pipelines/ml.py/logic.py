import os
import json
import re
import nltk
import google.generativeai as genai

from nltk.tokenize import sent_tokenize
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

nltk.download("punkt", quiet=True)

# Gemini API
genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

# Embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")


# ---------------- CHUNK TEXT ----------------

def chunk_text(text, chunk_size=3):
    sentences = sent_tokenize(text)

    chunks = []

    for i in range(0, len(sentences), chunk_size):
        chunks.append(
            " ".join(sentences[i:i + chunk_size])
        )

    return chunks


# ---------------- CREATE EMBEDDINGS ----------------

def create_embeddings(chunks):
    return model.encode(chunks, convert_to_numpy=True)


# ---------------- GET SUMMARY + EMOTION ----------------

def analyze_transcript(chunks):

    prompt = f"""
    Analyze this transcript.

    Return JSON only:

    {{
      "summary": "",
      "emotion": "",
      "sentiment": ""
    }}

    Transcript:
    {chr(10).join(chunks)}
    """

    gemini = genai.GenerativeModel("gemini-1.5-flash")

    response = gemini.generate_content(prompt)

    text = response.text.strip()

    text = re.sub(r"```json|```", "", text).strip()

    return json.loads(text)


# ---------------- ASK QUESTIONS ----------------

def ask_question(question, chunks, embeddings):

    query_embedding = model.encode(
        [question],
        convert_to_numpy=True
    )

    scores = cosine_similarity(
        query_embedding,
        embeddings
    )[0]

    best_index = scores.argmax()

    context = chunks[best_index]

    prompt = f"""
    Answer only using this context:

    {context}

    Question:
    {question}
    """

    gemini = genai.GenerativeModel("gemini-1.5-flash")

    response = gemini.generate_content(prompt)

    return response.text


# ---------------- MAIN ----------------

if __name__ == "__main__":

    transcript = """
    Revenue increased this quarter.
    Marketing campaigns performed well.
    Customer feedback was positive.
    """

    chunks = chunk_text(transcript)

    embeddings = create_embeddings(chunks)

    insights = analyze_transcript(chunks)

    print("\nInsights:")
    print(insights)

    answer = ask_question(
        "How was customer feedback?",
        chunks,
        embeddings
    )

    print("\nAnswer:")
    print(answer)