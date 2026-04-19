"""CrewAI crew orchestration — wires T, A, and The Boss together."""
import os
import asyncio
from typing import Callable, Any
from crewai import Crew, Task, Process, LLM
from agents import create_t_agent, create_a_agent, create_boss_agent


TASK_TEMPLATES = {
    "ideate": {
        "a_task": "Research current trends relevant to: {brief}. Use Google Trends, Reddit, and news search. Write a structured trend brief with top 5 insights and opportunities.",
        "t_task": "Based on A's trend research, generate 3 original product/service ideas for: {brief}. For each idea include: name, target user, core value prop, key features, and why now.",
        "boss_task": "Review T's ideas and A's research for: {brief}. Select the strongest idea, refine it, create a 1-page concept brief saved to the workspace, and send the user a Mac notification with the result.",
    },
    "research": {
        "a_task": "Deep-dive research on: {brief}. Use all available tools — web search, Google Trends, Reddit, Twitter, news. Produce a comprehensive research report covering: market size, key players, trends, opportunities, threats.",
        "boss_task": "Take A's research on: {brief}. Synthesise it into a polished executive briefing document and a presentation deck. Save both to workspace and notify the user.",
    },
    "create": {
        "t_task": "Design the creative concept for: {brief}. Define the visual direction, messaging, key assets needed, and user experience flow.",
        "boss_task": "Using T's creative concept for: {brief}, build the actual deliverables: create a presentation deck, write the copy, save all files to workspace, and notify the user when done.",
    },
    "manage": {
        "a_task": "Research and gather all background information needed for: {brief}. Cover market context, competitor landscape, trends, and audience insights.",
        "t_task": "Taking A's research for: {brief}, develop the full creative strategy and product/concept design. Be comprehensive.",
        "boss_task": "Orchestrate the full project for: {brief}. Synthesise T and A's work, create the complete deliverable package (deck + report + brief), organise the workspace, and send a summary notification to the user.",
    },
}


class MissionCrew:
    def __init__(self, broadcast_fn: Callable[[dict], Any] = None):
        self.broadcast_fn = broadcast_fn
        self._llm = None
        self._t = None
        self._a = None
        self._boss = None

    def _get_llm(self) -> LLM:
        if not self._llm:
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY not set. Add it to backend/.env")
            self._llm = LLM(model="claude-sonnet-4-6", api_key=api_key)
        return self._llm

    def _emit(self, agent: str, event_type: str, content: str, task: str = ""):
        """Emit a WebSocket event via the broadcast function."""
        from datetime import datetime, timezone
        event = {
            "type": event_type,
            "agent": agent,
            "content": content,
            "task": task,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if self.broadcast_fn:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.run_coroutine_threadsafe(self.broadcast_fn(event), loop)
                else:
                    loop.run_until_complete(self.broadcast_fn(event))
            except Exception:
                pass

    def _step_callback(self, agent_output):
        """Called by CrewAI after each agent step."""
        agent_name = getattr(agent_output, "agent", "Unknown")
        content = str(getattr(agent_output, "output", agent_output))[:500]
        self._emit(str(agent_name), "agent_message", content)

    def _task_callback(self, task_output):
        """Called by CrewAI after each task completes."""
        agent_name = str(getattr(task_output, "agent", "Unknown"))
        description = str(getattr(task_output, "description", ""))[:100]
        self._emit(agent_name, "task_complete", f"Task complete: {description}", task=description)

    def run_mission(self, brief: str, mode: str = "ideate") -> str:
        """Execute a mission with the crew. Runs synchronously (call from thread)."""
        llm = self._get_llm()
        template = TASK_TEMPLATES.get(mode, TASK_TEMPLATES["ideate"])

        self._emit("System", "system", f"Mission started: [{mode.upper()}] {brief}")

        agents_used = []
        tasks = []

        # Build agents and tasks based on mode
        if "a_task" in template:
            self._a = create_a_agent(llm)
            a_desc = template["a_task"].format(brief=brief)
            self._emit("A", "task_start", f"Starting research: {brief}", task="Research")
            agents_used.append(self._a)
            tasks.append(Task(
                description=a_desc,
                expected_output="A comprehensive research brief with key findings, trends, and insights. Minimum 500 words.",
                agent=self._a,
                callback=self._task_callback,
            ))

        if "t_task" in template:
            self._t = create_t_agent(llm)
            t_desc = template["t_task"].format(brief=brief)
            context = [tasks[-1]] if tasks else []
            self._emit("T", "task_start", f"Developing concepts for: {brief}", task="Design & Ideation")
            agents_used.append(self._t)
            tasks.append(Task(
                description=t_desc,
                expected_output="3 well-defined product/creative concepts with clear user value, differentiation, and reasoning.",
                agent=self._t,
                context=context,
                callback=self._task_callback,
            ))

        self._boss = create_boss_agent(llm)
        boss_desc = template["boss_task"].format(brief=brief)
        self._emit("Boss", "task_start", f"Managing and delivering: {brief}", task="Orchestrate & Deliver")
        agents_used.append(self._boss)
        tasks.append(Task(
            description=boss_desc,
            expected_output="Final synthesised deliverable: a summary of what was created, files saved, and next steps.",
            agent=self._boss,
            context=tasks.copy() if tasks[:-1] else [],
            callback=self._task_callback,
        ))

        crew = Crew(
            agents=agents_used,
            tasks=tasks,
            process=Process.sequential,
            verbose=True,
            step_callback=self._step_callback,
            memory=True,
        )

        try:
            result = crew.kickoff()
            final = str(result)
            self._emit("Boss", "task_complete", f"Mission complete. {final[:300]}", task="Mission")
            self._emit("System", "system", "All agents standing by.")
            return final
        except Exception as e:
            self._emit("System", "error", f"Mission failed: {str(e)}")
            raise
