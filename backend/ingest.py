"""
One-time script: OCR research.pdf with docling, chunk the text,
embed with Google, and save to chroma_db/.

Run from backend/ directory:
    python3 ingest.py
"""

import os
from dotenv import load_dotenv
from docling.document_converter import DocumentConverter
from docling.datamodel.pipeline_options import PdfPipelineOptions, AcceleratorOptions
from docling.datamodel.accelerator_options import AcceleratorDevice
from docling.datamodel.base_models import InputFormat
from docling.document_converter import PdfFormatOption
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from tqdm import tqdm

load_dotenv()

PDF_PATH = os.path.join(os.path.dirname(__file__), "research.pdf")
TEXT_PATH = os.path.join(os.path.dirname(__file__), "research_text.txt")
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")


def ocr_pdf_with_docling() -> str:
    print("  Converting PDF with docling (OCR)...")
    pipeline_options = PdfPipelineOptions()
    pipeline_options.accelerator_options = AcceleratorOptions(device=AcceleratorDevice.CPU)
    converter = DocumentConverter(
        format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
    )
    result = converter.convert(PDF_PATH)
    return result.document.export_to_markdown()


def main():
    # Step 1: OCR (or reuse cached text)
    if os.path.exists(TEXT_PATH):
        print(f"Found cached {TEXT_PATH}, skipping OCR. Delete it to re-OCR.")
        with open(TEXT_PATH, "r") as f:
            full_text = f.read()
    else:
        print("OCR-ing PDF with docling...")
        full_text = ocr_pdf_with_docling()
        with open(TEXT_PATH, "w", encoding="utf-8") as f:
            f.write(full_text)
        print(f"  Saved extracted text to {TEXT_PATH}")

    print(f"  Total characters: {len(full_text)}")

    # Step 2: Chunk
    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=60)
    chunks = splitter.split_documents([Document(page_content=full_text)])
    print(f"  Split into {len(chunks)} chunks")

    # Step 3: Embed and store
    print("Embedding and storing in ChromaDB...")
    embeddings = HuggingFaceEmbeddings(model_name="Snowflake/snowflake-arctic-embed-m")
    db = Chroma(embedding_function=embeddings, persist_directory=CHROMA_DIR)
    batch_size = 50
    for i in tqdm(range(0, len(chunks), batch_size), desc="Embedding", unit="batch"):
        db.add_documents(chunks[i:i + batch_size])
    print(f"  Saved {db._collection.count()} vectors to {CHROMA_DIR}")
    print("Done! Commit both chroma_db/ and research_text.txt to git.")


if __name__ == "__main__":
    main()
