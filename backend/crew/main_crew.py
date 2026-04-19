"""EASY Agent Hub — Mission Crew using Anthropic SDK directly (no crewai required)."""
import asyncio
import json
import os
from datetime import datetime, timezone
from typing import Any, Callable, Optional

import anthropic


TOOLS = [
    {
        "name": "web_search",
        "description": "Search the web for current information, news, trends, or any topic.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query."}
            },
            "required": ["query"],
        },
    },
    {
        "name": "scrape_url",
        "description": "Fetch and read the text content of a web page URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The full URL to fetch."}
            },
            "required": ["url"],
        },
    },
    {
        "name": "get_trends",
        "description": "Get Google Trends data showing interest over time for keywords.",
        "input_schema": {
            "type": "object",
            "properties": {
                "keywords": {
                    "type": "string",
                    "description": "Comma-separated keywords to check trends for, e.g. 'AI,design,technology'.",
                }
            },
            "required": ["keywords"],
        },
    },
]

AGENT_SYSTEMS = {
    "T": (
        "You are Agent T — Idea Creator and Product Designer for EASY Agent Hub. "
        "Your role: generate innovative product/service concepts, design thinking, creative direction. "
        "Use web_search to research inspiration, trends, and validate ideas. "
        "Be creative, specific, and actionable. Format your output clearly with headers."
    ),
    "A": (
        "You are Agent A — Adventurous Researcher and Trend Hunter for EASY Agent Hub. "
        "Your role: research markets, track trends, analyze competitors, find data-driven insights. "
        "Use web_search and get_trends to gather real, current information. "
        "Be thorough and cite specific findings. Format your output as a structured report."
    ),
    "Boss": (
        "You are The Boss — Creative Director and Team Manager for EASY Agent Hub. "
        "Your role: synthesize research and ideas into clear strategy and action plans. "
        "Review your team's work and produce polished, executive-level output. "
        "Be decisive, strategic, and inspiring. End with concrete next steps."
    ),
}


class MissionCrew:
    def __init__(self, broadcast_fn: Optional[Callable[[dict], Any]] = None):
        self.broadcast_fn = broadcast_fn
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.model = "claude-sonnet-4-6"

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _emit(self, agent: str, content: str, event_type: str = "message"):
        if not self.broadcast_fn:
            return
        msg = {
            "type": event_type,
            "agent": agent,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        try:
            self.broadcast_fn(msg)
        except Exception:
            pass

    def _web_search(self, query: str) -> str:
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=5))
            if not results:
                return "No results found."
            return "\n\n".join(
                f"**{r.get('title', '')}**\n{r.get('body', '')}\n{r.get('href', '')}"
                for r in results
            )
        except Exception as e:
            return f"Search unavailable: {e}"

    def _scrape_url(self, url: str) -> str:
        try:
            import requests
            from bs4 import BeautifulSoup
            resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            soup = BeautifulSoup(resp.text, "lxml")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            text = soup.get_text(separator="\n", strip=True)
            return text[:3000] or "Page content empty."
        except Exception as e:
            return f"Could not fetch URL: {e}"

    def _get_trends(self, keywords: str) -> str:
        try:
            from pytrends.request import TrendReq
            pt = TrendReq(hl="en-US", tz=360)
            kw_list = [k.strip() for k in keywords.split(",")][:5]
            pt.build_payload(kw_list, timeframe="today 1-m")
            data = pt.interest_over_time()
            if data.empty:
                return f"No trend data for: {keywords}"
            summary = data.tail(4).to_string()
            return f"Google Trends (last 4 weeks) for [{', '.join(kw_list)}]:\n{summary}"
        except Exception as e:
            return f"Trends unavailable: {e}"

    def _handle_tool(self, name: str, tool_input: dict) -> str:
        if name == "web_search":
            return self._web_search(tool_input.get("query", ""))
        if name == "scrape_url":
            return self._scrape_url(tool_input.get("url", ""))
        if name == "get_trends":
            return self._get_trends(tool_input.get("keywords", ""))
        return f"Unknown tool: {name}"

    # ── Agent runner ──────────────────────────────────────────────────────────

    def _run_agent(self, agent_name: str, task: str, use_tools: bool = True) -> str:
        self._emit(agent_name, f"Working on: {task[:120]}…", "task_start")

        messages = [{"role": "user", "content": task}]
        agent_tools = TOOLS if use_tools else []

        for _ in range(10):  # max tool-use loops
            kwargs: dict = dict(
                model=self.model,
                max_tokens=4096,
                system=AGENT_SYSTEMS[agent_name],
                messages=messages,
            )
            if agent_tools:
                kwargs["tools"] = agent_tools

            response = self.client.messages.create(**kwargs)

            if response.stop_reason == "end_turn":
                text = next(
                    (b.text for b in response.content if hasattr(b, "text")), ""
                )
                self._emit(agent_name, text[:600] or "Done.", "message")
                self._emit(agent_name, "Task completed.", "task_complete")
                return text

            if response.stop_reason == "tool_use":
                messages.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        self._emit(
                            agent_name,
                            f"Using {block.name}: {json.dumps(block.input)[:80]}",
                            "tool_use",
                        )
                        result = self._handle_tool(block.name, block.input)
                        self._emit(agent_name, f"Got result: {result[:200]}", "tool_result")
                        tool_results.append(
                            {"type": "tool_result", "tool_use_id": block.id, "content": result}
                        )
                messages.append({"role": "user", "content": tool_results})
            else:
                break

        return "Agent reached max iterations."

    # ── Mission modes ─────────────────────────────────────────────────────────

    def run_mission(self, brief: str, mode: str = "ideate") -> str:
        self._emit("System", f"Mission launched [{mode.upper()}]: {brief[:100]}", "system")

        if mode == "ideate":
            t_out = self._run_agent(
                "T",
                f"Generate 5 original product/service ideas for this brief: '{brief}'. "
                "Search the web for trends and inspiration first. "
                "For each idea: Name, Concept (2 sentences), Target Market, Key Differentiator, Why Now.",
            )
            a_out = self._run_agent(
                "A",
                f"Research the market landscape for: '{brief}'. "
                "Search for trends, competitors, audience insights, and opportunities. "
                f"Also consider these ideas already generated by your colleague:\n{t_out[:1200]}",
            )
            return self._run_agent(
                "Boss",
                f"Brief: '{brief}'\n\nIdeas from Agent T:\n{t_out}\n\nResearch from Agent A:\n{a_out}\n\n"
                "Select the top 2 concepts and explain why. Create a 30-day action plan for the best one.",
                use_tools=False,
            )

        if mode == "research":
            a_out = self._run_agent(
                "A",
                f"Conduct deep research on: '{brief}'. "
                "Search for trends, data, key players, recent news, opportunities, and threats. "
                "Produce a comprehensive research report with sections and data points.",
            )
            t_out = self._run_agent(
                "T",
                f"Based on this research about '{brief}', generate creative insights and "
                f"design/product opportunities:\n{a_out[:1500]}",
            )
            return self._run_agent(
                "Boss",
                f"Brief: '{brief}'\n\nResearch from A:\n{a_out}\n\nCreative insights from T:\n{t_out}\n\n"
                "Synthesize into a strategic briefing with key findings, opportunities, and recommendations.",
                use_tools=False,
            )

        if mode == "create":
            t_out = self._run_agent(
                "T",
                f"Design a creative concept for: '{brief}'. "
                "Define visual direction, messaging, brand voice, key assets needed, and user experience flow. "
                "Search for design inspiration and reference examples.",
            )
            return self._run_agent(
                "Boss",
                f"Brief: '{brief}'\n\nDesign concept from T:\n{t_out}\n\n"
                "Develop this into a full creative brief suitable for a design team. "
                "Include: project overview, objectives, audience, deliverables, timeline, and success metrics.",
                use_tools=False,
            )

        if mode == "manage":
            a_out = self._run_agent(
                "A",
                f"Research and gather background for project management of: '{brief}'. "
                "Cover market context, competitor landscape, trends, risks, and resource benchmarks.",
            )
            t_out = self._run_agent(
                "T",
                f"Taking A's research for '{brief}', develop the creative strategy and product design approach:\n{a_out[:1200]}",
                use_tools=False,
            )
            return self._run_agent(
                "Boss",
                f"Brief: '{brief}'\n\nResearch:\n{a_out}\n\nCreative strategy:\n{t_out}\n\n"
                "Create a full project plan: milestones, team structure, budget considerations, risks, and success metrics.",
                use_tools=False,
            )

        return f"Unknown mission mode: {mode}"
