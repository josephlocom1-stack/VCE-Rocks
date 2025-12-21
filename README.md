# VCE-Rocks
To be able to automate downloading things in VCE Bricks
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import os

BASE_URL = "https://vce-bricks-index.pages.dev/contour/pdfs/Spesh_1-2/"
OUTPUT_DIR = "Spesh_1-2_PDFs"

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Fetching page...")
response = requests.get(BASE_URL, timeout=10)
response.raise_for_status()

soup = BeautifulSoup(response.text, "html.parser")

pdf_links = []

for a in soup.find_all("a", href=True):
    href = a["href"]
    if href.lower().endswith(".pdf"):
        pdf_links.append(urljoin(BASE_URL, href))

print(f"Found {len(pdf_links)} PDFs")

for url in pdf_links:
    filename = os.path.join(OUTPUT_DIR, url.split("/")[-1])

    if os.path.exists(filename):
        print(f"Skipping existing: {filename}")
        continue

    print(f"Downloading {filename}...")
    r = requests.get(url, stream=True)
    r.raise_for_status()

    with open(filename, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)

print("✅ Done")
