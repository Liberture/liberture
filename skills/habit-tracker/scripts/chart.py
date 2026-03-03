#!/usr/bin/env python3
"""
chart.py — Habit Tracker stats chart generator for OpenClaw

Generates a PNG showing:
  - Top: 30-day completion heatmap (GitHub-style)
  - Bottom: Per-habit 7-day completion rate bars

Usage:
  python3 chart.py --output /tmp/habits.png --json '{"stats": ..., "habits": ...}'
  python3 chart.py --output /tmp/habits.png < data.json
  python3 chart.py < data.json > habits.png
"""

import sys
import json
import argparse
import io
from datetime import datetime, timedelta, date

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import numpy as np
except ImportError:
    print(
        "matplotlib not found. Install with: sudo apt-get install python3-matplotlib python3-numpy",
        file=sys.stderr,
    )
    sys.exit(1)


# ── Color palette (dark purple theme matching the app) ──────────────────────
BG_DARK      = "#0f0f1a"
BG_CARD      = "#1a1a2e"
BG_CARD2     = "#16213e"
PURPLE       = "#8B5CF6"
BLUE         = "#3B82F6"
GREEN        = "#10B981"
GRAY_DIM     = "#374151"
GRAY_TEXT    = "#9CA3AF"
WHITE        = "#F9FAFB"
HEAT_COLORS  = ["#1a1a2e", "#312e6d", "#5b21b6", "#7c3aed", "#a78bfa"]


def _heat_color(count: int, max_count: int) -> str:
    if max_count == 0 or count == 0:
        return HEAT_COLORS[0]
    ratio = count / max_count
    idx = max(0, min(len(HEAT_COLORS) - 1, int(ratio * (len(HEAT_COLORS) - 1) + 0.5)))
    return HEAT_COLORS[idx]


def build_chart(data: dict, output_path: str | None = None) -> bytes | None:
    stats  = data.get("stats", {})
    habits = data.get("habits", [])

    # ── Prep completions-by-day dict ────────────────────────────────────────
    cbd      = {item["date"]: item["count"] for item in stats.get("completionsByDay", [])}
    today    = date.today()
    max_c    = max(cbd.values(), default=1) or 1

    # 30 days window
    days_list = [(today - timedelta(days=29 - i)) for i in range(30)]
    counts    = [cbd.get(str(d), 0) for d in days_list]

    # ── Layout ───────────────────────────────────────────────────────────────
    n_habits = max(1, len(habits))
    fig_height = 5.5 + max(0, n_habits - 5) * 0.3

    fig = plt.figure(figsize=(12, fig_height), facecolor=BG_DARK)
    gs  = fig.add_gridspec(
        3, 1,
        height_ratios=[0.8, 2.0, max(1.5, n_habits * 0.5)],
        hspace=0.55,
        left=0.05, right=0.97, top=0.88, bottom=0.06,
    )

    # ── Header row ───────────────────────────────────────────────────────────
    ax_header = fig.add_subplot(gs[0])
    ax_header.set_facecolor(BG_DARK)
    ax_header.axis("off")

    best_streak  = stats.get("bestCurrentStreak", 0)
    best_name    = stats.get("bestHabitName", "")
    rate_today   = int(stats.get("completionRateToday", 0) * 100)
    rate_7d      = int(stats.get("completionRate7d", 0) * 100)
    total_habits = stats.get("totalHabits", len(habits))
    active       = stats.get("activeHabits", 0)

    ax_header.text(
        0.0, 0.85, "Habit Tracker",
        transform=ax_header.transAxes,
        color=WHITE, fontsize=16, fontweight="bold", va="top",
    )
    ax_header.text(
        0.0, 0.25,
        f"Generated {today.strftime('%B %d, %Y')}  ·  "
        f"{total_habits} habits  ·  {active} active this month",
        transform=ax_header.transAxes,
        color=GRAY_TEXT, fontsize=9.5, va="top",
    )

    # Stat pills
    pills = [
        (f">> {best_streak}d streak", PURPLE, f"{best_name}" if best_name else ""),
        (f"OK {rate_today}% today", GREEN, ""),
        (f"UP {rate_7d}% last 7d", BLUE, ""),
    ]
    for i, (label, color, sub) in enumerate(pills):
        x = 0.62 + i * 0.13
        ax_header.text(
            x, 0.85, label,
            transform=ax_header.transAxes,
            color=color, fontsize=10, fontweight="bold", va="top",
        )
        if sub:
            ax_header.text(
                x, 0.25, sub,
                transform=ax_header.transAxes,
                color=GRAY_TEXT, fontsize=8, va="top",
            )

    # ── Heatmap row ─────────────────────────────────────────────────────────
    ax_heat = fig.add_subplot(gs[1])
    ax_heat.set_facecolor(BG_CARD)

    cell_size = 0.85
    gap       = 0.15
    step      = cell_size + gap

    for i, (d, c) in enumerate(zip(days_list, counts)):
        color = _heat_color(c, max_c)
        rect  = mpatches.FancyBboxPatch(
            (i * step, 0.1), cell_size, cell_size,
            boxstyle="round,pad=0.05",
            linewidth=0,
            facecolor=color,
        )
        ax_heat.add_patch(rect)
        # Label weekends
        if d.weekday() in (5, 6):
            ax_heat.text(
                i * step + cell_size / 2, -0.25,
                d.strftime("%d"),
                ha="center", va="top", color=GRAY_TEXT, fontsize=6.5,
            )

    # Month labels on first of month
    for i, d in enumerate(days_list):
        if d.day == 1:
            ax_heat.text(
                i * step, 1.25,
                d.strftime("%b"),
                ha="left", va="bottom", color=GRAY_TEXT, fontsize=8,
            )

    ax_heat.set_xlim(-0.2, 30 * step)
    ax_heat.set_ylim(-0.6, 1.8)
    ax_heat.axis("off")
    ax_heat.set_title(
        "Completions — last 30 days",
        color=WHITE, fontsize=11, fontweight="bold",
        pad=10, loc="left",
    )

    # Legend
    for idx, label in enumerate(["0", "1-2", "3-4", "5+"]):
        rx = 30 * step - 4 * step + idx * step * 0.9
        r  = mpatches.FancyBboxPatch(
            (rx, 1.0), 0.7, 0.7,
            boxstyle="round,pad=0.05", linewidth=0,
            facecolor=HEAT_COLORS[min(idx, len(HEAT_COLORS) - 1)],
        )
        ax_heat.add_patch(r)
        ax_heat.text(rx + 0.35, 0.65, label, ha="center", color=GRAY_TEXT, fontsize=6)

    # ── Bar chart row ─────────────────────────────────────────────────────────
    ax_bars = fig.add_subplot(gs[2])
    ax_bars.set_facecolor(BG_CARD2)

    sorted_habits = sorted(habits, key=lambda h: h.get("completionRate7d", 0), reverse=True)
    names   = [h["name"][:28] for h in sorted_habits]
    rates   = [h.get("completionRate7d", 0) * 100 for h in sorted_habits]
    streaks = [h.get("currentStreak", 0) for h in sorted_habits]
    today_flags = [h.get("completedToday", False) for h in sorted_habits]

    y_pos = np.arange(len(names))

    # Bar colors: green if completed today, purple otherwise
    bar_colors = [GREEN if t else PURPLE for t in today_flags]

    bars = ax_bars.barh(
        y_pos, rates,
        color=bar_colors,
        height=0.6,
        alpha=0.85,
    )

    # Streak labels on bars
    for i, (bar, streak) in enumerate(zip(bars, streaks)):
        w = bar.get_width()
        if streak > 0:
            ax_bars.text(
                min(w + 1.5, 102), i,
                f"{streak}d",
                va="center", color=PURPLE if not today_flags[i] else GREEN,
                fontsize=8, fontweight="bold",
            )

    ax_bars.set_yticks(y_pos)
    ax_bars.set_yticklabels(names, color=WHITE, fontsize=9)
    ax_bars.set_xlabel("Completion rate — last 7 days (%)", color=GRAY_TEXT, fontsize=9)
    ax_bars.set_xlim(0, 115)
    ax_bars.tick_params(colors=GRAY_TEXT, labelsize=8)
    ax_bars.xaxis.label.set_color(GRAY_TEXT)
    for spine in ax_bars.spines.values():
        spine.set_edgecolor(GRAY_DIM)
    ax_bars.xaxis.set_tick_params(color=GRAY_DIM)
    ax_bars.set_facecolor(BG_CARD2)
    ax_bars.set_title(
        "Habits — 7-day completion rate",
        color=WHITE, fontsize=11, fontweight="bold",
        pad=8, loc="left",
    )
    ax_bars.axvline(x=70, color=GRAY_DIM, linestyle="--", linewidth=0.8, alpha=0.6)

    # Legend for bar colors
    legend_elements = [
        mpatches.Patch(facecolor=GREEN, label="Done today"),
        mpatches.Patch(facecolor=PURPLE, label="Pending today"),
    ]
    ax_bars.legend(
        handles=legend_elements,
        loc="lower right",
        framealpha=0.3,
        facecolor=BG_CARD,
        labelcolor=WHITE,
        fontsize=8,
    )

    # ── Output ────────────────────────────────────────────────────────────────
    if output_path:
        fig.savefig(output_path, format="png", dpi=130, bbox_inches="tight", facecolor=BG_DARK)
        plt.close(fig)
        return None
    else:
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=130, bbox_inches="tight", facecolor=BG_DARK)
        plt.close(fig)
        buf.seek(0)
        return buf.read()


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate habit tracker chart")
    parser.add_argument("--output", "-o", help="Output PNG file path (default: stdout)")
    parser.add_argument("--json", "-j", help="JSON data string (default: stdin)")
    args = parser.parse_args()

    if args.json:
        raw = args.json
    else:
        raw = sys.stdin.read()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)

    result = build_chart(data, output_path=args.output)

    if result is not None:
        sys.stdout.buffer.write(result)


if __name__ == "__main__":
    main()
