"""macOS automation tools for The Boss. Requires macOS."""
import os
import sys
import subprocess
from pathlib import Path
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


WORKSPACE = Path(os.getenv("BOSS_WORKSPACE", str(Path.home() / "Desktop" / "EASY-Workspace")))
IS_MAC = sys.platform == "darwin"


def _ensure_workspace() -> Path:
    WORKSPACE.mkdir(parents=True, exist_ok=True)
    return WORKSPACE


class FileWriteInput(BaseModel):
    filename: str = Field(description="Filename to write (relative to workspace). E.g., 'research-report.txt' or 'ideas/concept.md'")
    content: str = Field(description="Content to write to the file")


class FileWriteTool(BaseTool):
    name: str = "write_file"
    description: str = f"Write a file to the EASY workspace on the user's machine. Files are saved to {WORKSPACE}."
    args_schema: type[BaseModel] = FileWriteInput

    def _run(self, filename: str, content: str) -> str:
        try:
            ws = _ensure_workspace()
            filepath = (ws / filename).resolve()
            if not str(filepath).startswith(str(ws)):
                return "Error: cannot write outside workspace."
            filepath.parent.mkdir(parents=True, exist_ok=True)
            filepath.write_text(content, encoding="utf-8")
            return f"File written: {filepath}"
        except Exception as e:
            return f"File write failed: {str(e)}"


class FileReadInput(BaseModel):
    filename: str = Field(description="Filename to read (relative to workspace)")


class FileReadTool(BaseTool):
    name: str = "read_file"
    description: str = "Read a file from the EASY workspace."
    args_schema: type[BaseModel] = FileReadInput

    def _run(self, filename: str) -> str:
        try:
            ws = _ensure_workspace()
            filepath = (ws / filename).resolve()
            if not str(filepath).startswith(str(ws)):
                return "Error: cannot read outside workspace."
            if not filepath.exists():
                return f"File not found: {filename}"
            return filepath.read_text(encoding="utf-8")
        except Exception as e:
            return f"File read failed: {str(e)}"


class ListFilesInput(BaseModel):
    subdirectory: str = Field(default="", description="Subdirectory within workspace to list (empty for root)")


class ListFilesTool(BaseTool):
    name: str = "list_files"
    description: str = "List files in the EASY workspace."
    args_schema: type[BaseModel] = ListFilesInput

    def _run(self, subdirectory: str = "") -> str:
        try:
            ws = _ensure_workspace()
            target = (ws / subdirectory).resolve() if subdirectory else ws
            if not str(target).startswith(str(ws)):
                return "Error: cannot list outside workspace."
            if not target.exists():
                return f"Directory not found: {subdirectory}"
            files = list(target.rglob("*"))
            if not files:
                return f"Workspace is empty: {target}"
            output = [f"Files in {target}:"]
            for f in sorted(files):
                rel = f.relative_to(ws)
                output.append(f"  {'📁' if f.is_dir() else '📄'} {rel}")
            return "\n".join(output)
        except Exception as e:
            return f"List files failed: {str(e)}"


class OpenAppInput(BaseModel):
    app_name: str = Field(description="macOS application name to open. E.g., 'Blender', 'Keynote', 'Numbers', 'Pages', 'Preview'")
    file_path: str = Field(default="", description="Optional file path to open with the app")


class OpenAppTool(BaseTool):
    name: str = "open_app"
    description: str = "Open a macOS application, optionally with a file. Can open Blender, Keynote, AutoCAD, Sketchup, Vectorworks, Preview, etc."
    args_schema: type[BaseModel] = OpenAppInput

    def _run(self, app_name: str, file_path: str = "") -> str:
        if not IS_MAC:
            return f"macOS only. Would open: {app_name}{f' with {file_path}' if file_path else ''}"
        try:
            cmd = ["open", "-a", app_name]
            if file_path:
                fp = Path(file_path)
                if not fp.is_absolute():
                    fp = _ensure_workspace() / file_path
                cmd.append(str(fp))
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                return f"Opened {app_name}{f' with {file_path}' if file_path else ''} successfully."
            return f"Failed to open {app_name}: {result.stderr}"
        except subprocess.TimeoutExpired:
            return f"{app_name} is opening (took too long to confirm)."
        except Exception as e:
            return f"Open app failed: {str(e)}"


class AppleScriptInput(BaseModel):
    script: str = Field(description="AppleScript code to run on macOS. Use this to control apps, create automations, send notifications, etc.")


class AppleScriptTool(BaseTool):
    name: str = "run_applescript"
    description: str = "Run AppleScript to automate macOS apps. Can control Keynote, Numbers, Finder, Safari, and any scriptable app. Use for creating presentations, automating workflows."
    args_schema: type[BaseModel] = AppleScriptInput

    def _run(self, script: str) -> str:
        if not IS_MAC:
            return f"macOS only. Would run AppleScript:\n{script}"
        try:
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                return f"AppleScript executed successfully.\nOutput: {result.stdout.strip() or '(no output)'}"
            return f"AppleScript error: {result.stderr.strip()}"
        except subprocess.TimeoutExpired:
            return "AppleScript timed out after 30s."
        except Exception as e:
            return f"AppleScript failed: {str(e)}"


class RunCommandInput(BaseModel):
    command: str = Field(description="Shell command to run in the EASY workspace directory")


class RunCommandTool(BaseTool):
    name: str = "run_command"
    description: str = "Run a shell command in the EASY workspace. Use for file operations, running scripts, or checking system status."
    args_schema: type[BaseModel] = RunCommandInput

    BLOCKED = ["rm -rf /", "sudo rm", "format", "mkfs", ":(){:|:&};:"]

    def _run(self, command: str) -> str:
        for blocked in self.BLOCKED:
            if blocked in command:
                return f"Blocked: '{blocked}' is not permitted."
        try:
            ws = _ensure_workspace()
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True,
                timeout=30, cwd=str(ws)
            )
            out = result.stdout.strip()
            err = result.stderr.strip()
            response = []
            if out: response.append(f"Output:\n{out}")
            if err: response.append(f"Stderr:\n{err}")
            response.append(f"Exit code: {result.returncode}")
            return "\n".join(response) if response else "Command completed with no output."
        except subprocess.TimeoutExpired:
            return "Command timed out after 30s."
        except Exception as e:
            return f"Command failed: {str(e)}"


class MacNotificationInput(BaseModel):
    title: str = Field(description="Notification title")
    message: str = Field(description="Notification message body")
    subtitle: str = Field(default="EASY Agent Hub", description="Notification subtitle")


class MacNotificationTool(BaseTool):
    name: str = "send_notification"
    description: str = "Send a macOS notification to alert the user about something important."
    args_schema: type[BaseModel] = MacNotificationInput

    def _run(self, title: str, message: str, subtitle: str = "EASY Agent Hub") -> str:
        if not IS_MAC:
            return f"Would notify: [{title}] {message}"
        script = f'display notification "{message}" with title "{title}" subtitle "{subtitle}"'
        try:
            subprocess.run(["osascript", "-e", script], timeout=5)
            return f"Notification sent: {title}"
        except Exception as e:
            return f"Notification failed: {str(e)}"
