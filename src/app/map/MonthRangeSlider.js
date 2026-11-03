"use client";

import { useEffect, useRef } from "react";
import { monthLabel } from "./filterUtils";

const EDGE_HIT_PX = 9;

// Monthly histogram with a draggable brush. `from`/`to` are absolute month
// indices within `bounds`; `counts[i]` is the number of cases in month bounds.min + i.
export default function MonthRangeSlider({ bounds, from, to, counts, onChange, height = 56 }) {
  const areaRef = useRef(null);
  const dragRef = useRef(null);
  const liveRef = useRef({ from, to });
  const frameRef = useRef(0);
  const pendingRef = useRef(null);
  const onChangeRef = useRef(onChange);

  const monthCount = bounds.max - bounds.min + 1;
  const start = from - bounds.min;
  const end = to - bounds.min;
  const maxCount = Math.max(4, ...counts);
  const years = Array.from({ length: monthCount / 12 }, (_, i) => Math.floor(bounds.min / 12) + i);

  useEffect(() => {
    liveRef.current = { from, to };
  }, [from, to]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  // Throttle updates to one per frame so map and list follow the drag live.
  const commit = (a, b) => {
    liveRef.current = { from: bounds.min + a, to: bounds.min + b };
    pendingRef.current = [bounds.min + a, bounds.min + b];
    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0;
        onChangeRef.current(...pendingRef.current);
      });
    }
  };

  const metrics = (clientX) => {
    const rect = areaRef.current.getBoundingClientRect();
    const perMonth = rect.width / monthCount;
    const live = liveRef.current;
    const a = live.from - bounds.min;
    const b = live.to - bounds.min;
    return {
      a,
      b,
      month: Math.max(0, Math.min(monthCount - 1, Math.floor(((clientX - rect.left) / rect.width) * monthCount))),
      nearFrom: Math.abs(clientX - (rect.left + a * perMonth)) < EDGE_HIT_PX,
      nearTo: Math.abs(clientX - (rect.left + (b + 1) * perMonth)) < EDGE_HIT_PX,
    };
  };

  const handlePointerDown = (event) => {
    const { a, b, month, nearFrom, nearTo } = metrics(event.clientX);
    if (nearFrom) {
      dragRef.current = { mode: "from" };
    } else if (nearTo) {
      dragRef.current = { mode: "to" };
    } else if (month >= a && month <= b) {
      dragRef.current = { mode: "move", offset: month - a };
    } else {
      dragRef.current = { mode: "new", anchor: month };
      commit(month, month);
    }
    areaRef.current.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event) => {
    const { a, b, month, nearFrom, nearTo } = metrics(event.clientX);
    const drag = dragRef.current;

    if (!drag) {
      areaRef.current.style.cursor =
        nearFrom || nearTo ? "ew-resize" : month >= a && month <= b ? "grab" : "crosshair";
      return;
    }

    let nextA = a;
    let nextB = b;
    if (drag.mode === "new") {
      nextA = Math.min(drag.anchor, month);
      nextB = Math.max(drag.anchor, month);
    } else if (drag.mode === "from") {
      nextA = Math.min(month, b);
    } else if (drag.mode === "to") {
      nextB = Math.max(month, a);
    } else {
      const length = b - a;
      nextA = Math.max(0, Math.min(monthCount - 1 - length, month - drag.offset));
      nextB = nextA + length;
    }

    if (nextA !== a || nextB !== b) {
      commit(nextA, nextB);
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleKeyDown = (edge) => (event) => {
    const step = event.shiftKey ? 12 : 1;
    const deltas = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step };
    let value;
    if (event.key in deltas) {
      value = (edge === "from" ? from : to) + deltas[event.key];
    } else if (event.key === "Home") {
      value = edge === "from" ? bounds.min : from;
    } else if (event.key === "End") {
      value = edge === "from" ? to : bounds.max;
    } else {
      return;
    }
    event.preventDefault();
    if (edge === "from") {
      onChange(Math.max(bounds.min, Math.min(value, to)), to);
    } else {
      onChange(from, Math.min(bounds.max, Math.max(value, from)));
    }
  };

  const handleProps = (edge) => {
    const value = edge === "from" ? from : to;
    return {
      role: "slider",
      tabIndex: 0,
      "aria-label": edge === "from" ? "Zeitraum von" : "Zeitraum bis",
      "aria-valuemin": edge === "from" ? bounds.min : from,
      "aria-valuemax": edge === "from" ? to : bounds.max,
      "aria-valuenow": value,
      "aria-valuetext": monthLabel(value),
      onKeyDown: handleKeyDown(edge),
    };
  };

  return (
    <div className="month-slider">
      <div
        ref={areaRef}
        className="month-slider-area"
        style={{ height }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="month-slider-bars">
          {counts.map((count, i) => (
            <i
              key={i}
              className={i >= start && i <= end ? "is-in-range" : undefined}
              style={{ height: `${(count / maxCount) * 100}%` }}
              title={`${monthLabel(bounds.min + i)}: ${count} ${count === 1 ? "Fall" : "Fälle"}`}
            />
          ))}
        </div>
        <div
          className="month-slider-brush"
          style={{ left: `${(start / monthCount) * 100}%`, width: `${((end - start + 1) / monthCount) * 100}%` }}
        >
          <span className="month-slider-handle is-from" {...handleProps("from")} />
          <span className="month-slider-handle is-to" {...handleProps("to")} />
        </div>
      </div>
      <div className="month-slider-years" style={{ gridTemplateColumns: `repeat(${years.length}, 1fr)` }}>
        {years.map((year) => (
          <span key={year}>{year}</span>
        ))}
      </div>
    </div>
  );
}
