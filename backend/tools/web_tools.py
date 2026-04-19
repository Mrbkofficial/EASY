"""Web search and scraping tools for Agent T and Agent A."""
import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Optional


class WebSearchInput(BaseModel):
    query: str = Field(description="Search query to look up on the web")
    max_results: int = Field(default=5, description="Maximum number of results to return")


class WebSearchTool(BaseTool):
    name: str = "web_search"
    description: str = "Search the web for current information on any topic using DuckDuckGo. Returns titles, URLs, and snippets."
    args_schema: type[BaseModel] = WebSearchInput

    def _run(self, query: str, max_results: int = 5) -> str:
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
            if not results:
                return f"No results found for '{query}'."
            output = [f"Search results for: {query}\n"]
            for i, r in enumerate(results, 1):
                output.append(f"{i}. **{r.get('title', 'No title')}**")
                output.append(f"   URL: {r.get('href', '')}")
                output.append(f"   {r.get('body', '')[:300]}\n")
            return "\n".join(output)
        except Exception as e:
            return f"Web search failed: {str(e)}"


class URLScrapeInput(BaseModel):
    url: str = Field(description="URL to scrape and extract text content from")
    max_chars: int = Field(default=3000, description="Maximum characters to return")


class URLScrapeTool(BaseTool):
    name: str = "scrape_url"
    description: str = "Fetch and extract readable text content from a specific URL. Use this to deep-read articles, product pages, or research papers."
    args_schema: type[BaseModel] = URLScrapeInput

    def _run(self, url: str, max_chars: int = 3000) -> str:
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
            resp = requests.get(url, headers=headers, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")
            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()
            text = " ".join(soup.get_text(separator=" ", strip=True).split())
            return text[:max_chars] + ("..." if len(text) > max_chars else "")
        except Exception as e:
            return f"Failed to scrape {url}: {str(e)}"


class NewsSearchInput(BaseModel):
    query: str = Field(description="News topic to search for")
    max_results: int = Field(default=8, description="Maximum number of news articles to return")


class NewsSearchTool(BaseTool):
    name: str = "search_news"
    description: str = "Search for recent news articles on any topic using DuckDuckGo News. Returns current news with titles, dates and snippets."
    args_schema: type[BaseModel] = NewsSearchInput

    def _run(self, query: str, max_results: int = 8) -> str:
        try:
            with DDGS() as ddgs:
                results = list(ddgs.news(query, max_results=max_results))
            if not results:
                return f"No news found for '{query}'."
            output = [f"Latest news for: {query}\n"]
            for i, r in enumerate(results, 1):
                output.append(f"{i}. **{r.get('title', '')}** ({r.get('date', 'unknown date')})")
                output.append(f"   Source: {r.get('source', '')} | {r.get('url', '')}")
                output.append(f"   {r.get('body', '')[:250]}\n")
            return "\n".join(output)
        except Exception as e:
            return f"News search failed: {str(e)}"
