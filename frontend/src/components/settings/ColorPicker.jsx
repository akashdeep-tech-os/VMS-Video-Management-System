import { useState, useRef, useEffect, useCallback } from "react";
import { FaSave, FaTimes, FaCheck } from "react-icons/fa";

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function ColorPicker({ value, onChange, onSave, onReset, showReset }) {
  const hex = value || "#ffffff";
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const [hue, setHue] = useState(hsl.h);
  const [sat, setSat] = useState(hsl.s);
  const [lig, setLig] = useState(hsl.l);
  const [r, setR] = useState(rgb.r);
  const [g, setG] = useState(rgb.g);
  const [b, setB] = useState(rgb.b);

  const satAreaRef = useRef(null);
  const hueBarRef = useRef(null);
  const isDraggingSat = useRef(false);
  const isDraggingHue = useRef(false);

  useEffect(() => {
    const newRgb = hslToRgb(hue, sat, lig);
    setR(newRgb.r);
    setG(newRgb.g);
    setB(newRgb.b);
  }, [hue, sat, lig]);

  const syncFromHex = useCallback(
    (newHex) => {
      const c = hexToRgb(newHex);
      const h = rgbToHsl(c.r, c.g, c.b);
      setHue(h.h);
      setSat(h.s);
      setLig(h.l);
      setR(c.r);
      setG(c.g);
      setB(c.b);
    },
    [],
  );

  useEffect(() => {
    syncFromHex(hex);
  }, [value, syncFromHex]);

  const updateFromSatArea = useCallback(
    (clientX, clientY) => {
      const rect = satAreaRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const newSat = x * 100;
      const newLig = (1 - y) * 100;
      setSat(newSat);
      setLig(newLig);
      const newRgb = hslToRgb(hue, newSat, newLig);
      onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    },
    [hue, onChange],
  );

  const updateFromHueBar = useCallback(
    (clientX) => {
      const rect = hueBarRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newHue = x * 360;
      setHue(newHue);
      const newRgb = hslToRgb(newHue, sat, lig);
      onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    },
    [sat, lig, onChange],
  );

  const handleSatMouseDown = (e) => {
    isDraggingSat.current = true;
    updateFromSatArea(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleHueMouseDown = (e) => {
    isDraggingHue.current = true;
    updateFromHueBar(e.clientX);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSat.current) updateFromSatArea(e.clientX, e.clientY);
      if (isDraggingHue.current) updateFromHueBar(e.clientX);
    };
    const handleMouseUp = () => {
      isDraggingSat.current = false;
      isDraggingHue.current = false;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [updateFromSatArea, updateFromHueBar]);

  const handleRgbChange = (channel, val) => {
    const num = Math.max(0, Math.min(255, parseInt(val) || 0));
    let newR = r,
      newG = g,
      newB = b;
    if (channel === "r") {
      newR = num;
      setR(num);
    }
    if (channel === "g") {
      newG = num;
      setG(num);
    }
    if (channel === "b") {
      newB = num;
      setB(num);
    }
    const newHex = rgbToHex(newR, newG, newB);
    const newHsl = rgbToHsl(newR, newG, newB);
    setHue(newHsl.h);
    setSat(newHsl.s);
    setLig(newHsl.l);
    onChange(newHex);
  };

  const hueColor = rgbToHex(...Object.values(hslToRgb(hue, 100, 50)));

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-2 w-[180px] shadow-lg">
      {/* Saturation Area */}
      <div
        ref={satAreaRef}
        className="relative w-full h-[100px] rounded-lg cursor-crosshair overflow-hidden mb-2"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
        }}
        onMouseDown={handleSatMouseDown}
      >
        <div
          className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${sat}%`,
            top: `${100 - lig}%`,
          }}
        />
      </div>

      {/* Hue Slider */}
      <div
        ref={hueBarRef}
        className="relative w-full h-3 rounded-full cursor-pointer mb-2"
        style={{
          background:
            "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
        }}
        onMouseDown={handleHueMouseDown}
      >
        <div
          className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${(hue / 360) * 100}%` }}
        />
      </div>

      {/* RGB Inputs */}
      <div className="flex gap-1 mb-2">
        {[
          { label: "R", val: r, ch: "r" },
          { label: "G", val: g, ch: "g" },
          { label: "B", val: b, ch: "b" },
        ].map(({ label, val, ch }) => (
          <div key={ch} className="flex-1 text-center">
            <input
              type="number"
              min={0}
              max={255}
              value={val}
              onChange={(e) => handleRgbChange(ch, e.target.value)}
              className="w-full text-center text-[10px] font-medium px-1 py-1 rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-dark)] outline-none focus:border-[var(--primary-color)]"
            />
            <span className="text-[8px] text-[var(--text-muted)] font-medium">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Preview + Actions */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-6 h-6 rounded-md border border-[var(--border-color)] shrink-0"
          style={{ backgroundColor: hex }}
        />
        <span className="text-[9px] font-mono text-[var(--text-muted)] flex-1 truncate">
          {hex}
        </span>
        {showReset && (
          <button
            onClick={onReset}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            title="Reset color"
          >
            <FaTimes size={12} />
          </button>
        )}
        <button
          onClick={onSave}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
          title="Save color"
        >
          <FaSave size={12} />
        </button>
      </div>
    </div>
  );
}

export default ColorPicker;
