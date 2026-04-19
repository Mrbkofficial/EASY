"""Social media and trend research tools for Agent A."""
import os
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class TrendResearchInput(BaseModel):
    keywords: list[str] = Field(description="List of keywords to research trends for (1-5 keywords)")
    timeframe: str = Field(default="today 3-m", description="Timeframe: 'now 1-d', 'now 7-d', 'today 1-m', 'today 3-m', 'today 12-m'")
    geo: str = Field(default="", description="Geographic region code, e.g. 'US', 'GB', '' for worldwide")


class GoogleTrendsTool(BaseTool):
    name: str = "google_trends"
    description: str = "Research trending topics on Google Trends. Returns interest over time and related queries. No API key needed."
    args_schema: type[BaseModel] = TrendResearchInput

    def _run(self, keywords: list[str], timeframe: str = "today 3-m", geo: str = "") -> str:
        try:
            from pytrends.request import TrendReq
            pt = TrendReq(hl="en-US", tz=0)
            kw_list = keywords[:5]
            pt.build_payload(kw_list, cat=0, timeframe=timeframe, geo=geo, gprop="")

            interest = pt.interest_over_time()
            related = {}
            for kw in kw_list:
                try:
                    rel = pt.related_queries()
                    if kw in rel and rel[kw]["top"] is not None:
                        top = rel[kw]["top"].head(5)
                        related[kw] = top["query"].tolist()
                except Exception:
                    pass

            output = [f"Google Trends Analysis\n{'='*40}"]
            output.append(f"Keywords: {', '.join(kw_list)}")
            output.append(f"Timeframe: {timeframe} | Region: {geo or 'Worldwide'}\n")

            if not interest.empty:
                output.append("Interest Summary (avg score 0-100):")
                for kw in kw_list:
                    if kw in interest.columns:
                        avg = int(interest[kw].mean())
                        peak = int(interest[kw].max())
                        output.append(f"  • {kw}: avg={avg}, peak={peak}")

            if related:
                output.append("\nRelated Rising Queries:")
                for kw, queries in related.items():
                    output.append(f"  • {kw}: {', '.join(queries)}")

            return "\n".join(output)
        except ImportError:
            return "pytrends not installed. Run: pip install pytrends"
        except Exception as e:
            return f"Google Trends error: {str(e)}"


class RedditResearchInput(BaseModel):
    subreddit: str = Field(description="Subreddit to search (without r/). Use 'all' for all subreddits.")
    query: str = Field(description="Search query within the subreddit")
    limit: int = Field(default=10, description="Number of posts to return (max 25)")
    sort: str = Field(default="hot", description="Sort order: 'hot', 'new', 'top', 'rising'")


class RedditResearchTool(BaseTool):
    name: str = "reddit_research"
    description: str = "Search Reddit for trending posts and discussions on any topic. Useful for finding what people are talking about and trending content."
    args_schema: type[BaseModel] = RedditResearchInput

    def _run(self, subreddit: str, query: str, limit: int = 10, sort: str = "hot") -> str:
        try:
            import praw
            client_id = os.getenv("REDDIT_CLIENT_ID")
            client_secret = os.getenv("REDDIT_CLIENT_SECRET")
            user_agent = os.getenv("REDDIT_USER_AGENT", "EASY-Agents/1.0")

            if not client_id or not client_secret:
                return self._fallback_reddit_search(subreddit, query)

            reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent,
            )
            sub = reddit.subreddit(subreddit)
            if query:
                posts = list(sub.search(query, sort=sort, limit=min(limit, 25)))
            else:
                posts = list(getattr(sub, sort)(limit=min(limit, 25)))

            if not posts:
                return f"No posts found in r/{subreddit} for '{query}'."

            output = [f"Reddit Research: r/{subreddit} — '{query}'\n{'='*40}"]
            for i, post in enumerate(posts, 1):
                output.append(f"{i}. **{post.title}**")
                output.append(f"   Score: {post.score} | Comments: {post.num_comments} | {post.url}")
                if post.selftext and len(post.selftext) > 20:
                    output.append(f"   {post.selftext[:200].strip()}...")
                output.append("")
            return "\n".join(output)

        except ImportError:
            return "praw not installed. Run: pip install praw"
        except Exception as e:
            return self._fallback_reddit_search(subreddit, query)

    def _fallback_reddit_search(self, subreddit: str, query: str) -> str:
        """DuckDuckGo-based Reddit search fallback when PRAW creds not set."""
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                results = list(ddgs.text(f"site:reddit.com/r/{subreddit} {query}", max_results=8))
            output = [f"Reddit (via web search) — r/{subreddit}: '{query}'\n"]
            for i, r in enumerate(results, 1):
                output.append(f"{i}. {r.get('title', '')}")
                output.append(f"   {r.get('href', '')}")
                output.append(f"   {r.get('body', '')[:200]}\n")
            return "\n".join(output)
        except Exception as e:
            return f"Reddit research failed: {str(e)}"


class TwitterTrendsInput(BaseModel):
    topic: str = Field(description="Topic or keyword to search for on X/Twitter")
    max_results: int = Field(default=10, description="Number of results to return")


class TwitterTrendsTool(BaseTool):
    name: str = "twitter_trends"
    description: str = "Search for trending discussions on X/Twitter for any topic. Uses web search as fallback if no API key."
    args_schema: type[BaseModel] = TwitterTrendsInput

    def _run(self, topic: str, max_results: int = 10) -> str:
        bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        if bearer_token:
            return self._twitter_api_search(topic, bearer_token, max_results)
        return self._twitter_web_search(topic, max_results)

    def _twitter_api_search(self, topic: str, token: str, max_results: int) -> str:
        try:
            import requests
            headers = {"Authorization": f"Bearer {token}"}
            params = {
                "query": f"{topic} -is:retweet lang:en",
                "max_results": min(max_results, 10),
                "tweet.fields": "public_metrics,created_at,author_id",
            }
            resp = requests.get("https://api.twitter.com/2/tweets/search/recent", headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()
            tweets = data.get("data", [])
            if not tweets:
                return f"No tweets found for '{topic}'."
            output = [f"X/Twitter: '{topic}'\n{'='*40}"]
            for i, t in enumerate(tweets, 1):
                metrics = t.get("public_metrics", {})
                output.append(f"{i}. {t.get('text', '')[:280]}")
                output.append(f"   ❤ {metrics.get('like_count', 0)} | 🔁 {metrics.get('retweet_count', 0)} | 💬 {metrics.get('reply_count', 0)}\n")
            return "\n".join(output)
        except Exception as e:
            return self._twitter_web_search(topic, max_results)

    def _twitter_web_search(self, topic: str, max_results: int) -> str:
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                results = list(ddgs.text(f"site:twitter.com OR site:x.com {topic}", max_results=max_results))
            output = [f"X/Twitter (web search): '{topic}'\n"]
            for i, r in enumerate(results, 1):
                output.append(f"{i}. {r.get('title', '')}")
                output.append(f"   {r.get('body', '')[:250]}\n")
            return "\n".join(output)
        except Exception as e:
            return f"Twitter search failed: {str(e)}"
