import os
import json
import re
import nltk
import numpy as np
import google.generativeai as genai

from nltk.tokenize import sent_tokenize
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans

# ---------------- SETUP ----------------

nltk.download("punkt", quiet=True)

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


# ---------------- STEP 1: TOKENIZER ----------------

def tokenize_and_chunk(transcript, chunk_size=3):

    sentences = sent_tokenize(transcript)

    chunks = []

    for i in range(0, len(sentences), chunk_size):

        chunk = " ".join(
            sentences[i:i + chunk_size]
        )

        if chunk.strip():
            chunks.append(chunk)

    return chunks


# ---------------- STEP 2: EMBEDDINGS ----------------

def create_embeddings(chunks):

    embeddings = embedding_model.encode(
        chunks,
        convert_to_numpy=True
    )

    return embeddings


# ---------------- STEP 3: IMPORTANT CHUNKS ----------------

def get_important_chunks(
    chunks,
    embeddings,
    top_k=5
):

    similarity_matrix = cosine_similarity(
        embeddings
    )

    np.fill_diagonal(
        similarity_matrix,
        0
    )

    scores = similarity_matrix.mean(axis=1)

    top_indexes = np.argsort(
        scores
    )[::-1][:top_k]

    important_chunks = [
        chunks[i]
        for i in top_indexes
    ]

    return important_chunks


# ---------------- STEP 4: TOPIC EXTRACTION (ML) ----------------

def extract_topics(
    chunks,
    embeddings,
    num_topics=3
):

    n_clusters = min(
        num_topics,
        len(chunks)
    )

    kmeans = KMeans(
        n_clusters=n_clusters,
        random_state=42,
        n_init=10
    )

    labels = kmeans.fit_predict(
        embeddings
    )

    topics = []

    for topic_id in range(n_clusters):

        indices = [
            i for i, label in enumerate(labels)
            if label == topic_id
        ]

        representative_chunk = chunks[
            indices[0]
        ]
        confidence = round(
        len(indices) / len(chunks),
        2
    )

    topics.append({
        "topic": f"Topic {topic_id + 1}",
        "text": representative_chunk,
        "confidence": confidence
    })

    return topics


# ---------------- STEP 5: GEMINI INSIGHTS ----------------

def generate_insights(
    important_chunks,
    topics
):

    chunk_text = "\n".join(
        important_chunks
    )

    topic_text = "\n".join([
        t["text"]
        for t in topics
    ])

    prompt = f"""
    Analyze this transcript.

    Topics:
    {topic_text}

    Transcript:
    {chunk_text}

    Return ONLY JSON:

    {{
      "summary": "",
      "emotion": "",
      "sentiment": ""
    }}
    """

    model = genai.GenerativeModel(
        "gemini-1.5-flash"
    )

    response = model.generate_content(
        prompt
    )

    text = response.text.strip()

    text = re.sub(
        r"```json|```",
        "",
        text
    ).strip()

    return json.loads(text)


# ---------------- STEP 6: RAG STORE ----------------

class RAGStore:

    def __init__(
        self,
        chunks,
        embeddings
    ):

        self.chunks = chunks
        self.embeddings = embeddings

    def search(
        self,
        query,
        top_k=3
    ):

        query_embedding = embedding_model.encode(
            [query],
            convert_to_numpy=True
        )

        scores = cosine_similarity(
            query_embedding,
            self.embeddings
        )[0]

        top_indexes = np.argsort(
            scores
        )[::-1][:top_k]

        return [
            self.chunks[i]
            for i in top_indexes
        ]


# ---------------- STEP 7: RAG CHATBOT ----------------

def rag_answer(
    question,
    store,
    insights
):

    retrieved_chunks = store.search(
        question
    )

    context = "\n".join(
        retrieved_chunks
    )

    prompt = f"""
    Transcript Summary:
    {insights["summary"]}

    Context:
    {context}

    Question:
    {question}

    Answer only using the context.
    """

    model = genai.GenerativeModel(
        "gemini-1.5-flash"
    )

    response = model.generate_content(
        prompt
    )

    return response.text


# ---------------- MAIN PIPELINE ----------------

def run_pipeline(transcript):

    # Step 1
    chunks = tokenize_and_chunk(
        transcript
    )

    # Step 2
    embeddings = create_embeddings(
        chunks
    )

    # Step 3
    important_chunks = get_important_chunks(
        chunks,
        embeddings
    )

    # Step 4
    topics = extract_topics(
        chunks,
        embeddings
    )

    # Step 5
    insights = generate_insights(
        important_chunks,
        topics
    )

    # Step 6
    store = RAGStore(
        chunks,
        embeddings
    )

    return {
        "topics": topics,
        "insights": insights,
        "store": store
    }

