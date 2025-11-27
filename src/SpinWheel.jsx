import React, { useEffect, useRef, useState } from "react";

/*
  SpinWheel.jsx
  - Spin a wheel of challenges
  - After the wheel stops, a scratch card appears.
  - Scratch off the gray layer (mouse or touch). When enough scratched, the reveal buttons appear.
*/

const DEFAULT_SEGMENTS = [
  "Act like a cat for 10s",
  "Silly dance 5s",
  "Sing one line of a fav song",
  "Tell a shared memory",
  "Guess the song (5s)",
  "Tongue twister x3 ",
  "Balance item 10s",
  "Truth or Dare",
  "Freeze pose 10s",
  "Solve a short riddle",
  "Do a silly walk 5s",
   "Pretend to be a news reporter 10s",
   "tell a joke",
   "Act like a baby 5s",
    "Pretend to be a robot chef 10s",
    "Act like a zombie 10s",
     "Make a paper airplane",
       "Spin around 3 times",
];

export default function SpinWheel() {
  const [segments, setSegments] = useState(DEFAULT_SEGMENTS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0); // degrees
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showScratch, setShowScratch] = useState(false);
  const [stars, setStars] = useState(0);
  const [targetStars, setTargetStars] = useState(7);

  const wheelRef = useRef(null);
  const canvasRef = useRef(null);
  const scratchingRef = useRef({ drawing: false });
  const [scratchComplete, setScratchComplete] = useState(false);

  const segDeg = 360 / segments.length;

  // Spin the wheel to pick a random segment
  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    // choose target segment index
    const pick = Math.floor(Math.random() * segments.length);
    // full spins between 4 and 7
    const fullSpins = Math.floor(Math.random() * 4) + 4;
    // compute final rotation so pointer lands on pick
    // pointer is at top (0 degrees). We rotate wheel so that pick's center aligns to top.
    const final = fullSpins * 360 + (360 - (pick * segDeg + segDeg / 2));
    setRotation((r) => r + final);

    // after animation finishes (match CSS duration 4s)
    setTimeout(() => {
      setSelectedIndex(pick);
      setShowScratch(true);
      setIsSpinning(false);
      // reset scratch state for next time
      setScratchComplete(false);
      setTimeout(() => {
        initScratchCanvas();
      }, 100); // short delay so modal is rendered
    }, 4200);
  };

  // complete challenge and award a star
  const completeChallenge = () => {
    setStars((s) => s + 1);
    setShowScratch(false);
    setSelectedIndex(null);
    // Optionally: reset canvas
  };

  // add custom segment
  const addSegment = (text) => {
    if (!text || !text.trim()) return;
    setSegments((s) => {
      const next = [...s, text.trim()];
      if (next.length > 24) next.length = 24;
      return next;
    });
  };

  // scratch canvas initialization and handlers
  const initScratchCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Fill overlay with gray
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#B9B9B9"; // scratch cover color
    ctx.fillRect(0, 0, w, h);

    // brush settings
    ctx.lineWidth = Math.max(20, Math.floor(Math.min(w, h) * 0.06));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    scratchingRef.current.ctx = ctx;
    scratchingRef.current.w = w;
    scratchingRef.current.h = h;
    scratchingRef.current.totalPixels = w * h;
    scratchingRef.current.revealed = false;
  };

  // compute scratched percentage
  const computeScratchedPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    try {
      const imageData = ctx.getImageData(0, 0, width, height).data;
      let clearPixels = 0;
      // check alpha channel every 4th byte starting at index 3
      for (let i = 3; i < imageData.length; i += 4) {
        if (imageData[i] === 0) clearPixels++;
      }
      const percent = (clearPixels / (width * height)) * 100;
      return percent;
    } catch (err) {
      // security or other error
      return 0;
    }
  };

  // start drawing
  const startDraw = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = scratchingRef.current.ctx;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(x, y);
    scratchingRef.current.drawing = true;
  };

  const moveDraw = (clientX, clientY) => {
    if (!scratchingRef.current.drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = scratchingRef.current.ctx;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!scratchingRef.current.drawing) return;
    scratchingRef.current.drawing = false;
    // check completion
    const percent = computeScratchedPercentage();
    if (percent > 55 && !scratchingRef.current.revealed) {
      scratchingRef.current.revealed = true;
      setScratchComplete(true);
      // clear the canvas completely for neatness
      const canvas = canvasRef.current;
      const ctx = scratchingRef.current.ctx;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // mouse handlers
  const onMouseDown = (e) => {
    e.preventDefault();
    startDraw(e.clientX, e.clientY);
  };
  const onMouseMove = (e) => {
    if (!scratchingRef.current.drawing) return;
    e.preventDefault();
    moveDraw(e.clientX, e.clientY);
  };
  const onMouseUp = () => {
    endDraw();
  };

  // touch handlers
  const onTouchStart = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    startDraw(t.clientX, t.clientY);
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    moveDraw(t.clientX, t.clientY);
  };
  const onTouchEnd = (e) => {
    e.preventDefault();
    endDraw();
  };

  // ensure event listeners are set for the canvas area
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // attach handlers
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line
  }, [showScratch, selectedIndex]);

  // limit rotation number growth
  useEffect(() => {
    if (rotation > 100000) setRotation((r) => r % 360);
  }, [rotation]);

  // build wheel SVG slices
  const renderSlices = () => {
    return segments.map((label, i) => {
      const start = (i * segDeg * Math.PI) / 180 - Math.PI / 2;
      const end = ((i + 1) * segDeg * Math.PI) / 180 - Math.PI / 2;
      const x1 = Math.cos(start) * 120;
      const y1 = Math.sin(start) * 120;
      const x2 = Math.cos(end) * 120;
      const y2 = Math.sin(end) * 120;
      const large = segDeg > 180 ? 1 : 0;
      const pathData = `M 0 0 L ${x1} ${y1} A 120 120 0 ${large} 1 ${x2} ${y2} Z`;
      const rotateLabel = i * segDeg + segDeg / 2;
      return (
        <g key={i}>
          <path d={pathData} fill={i % 2 === 0 ? "#fff" : "#f3f6ff"} stroke="#e6eefb" />
          <text x="0" y="-58" textAnchor="middle"
  transform={`rotate(${rotateLabel})`}
  fontSize="6"
  style={{ userSelect: "none" , fontSize: 15}}
>
  {i + 1}
</text>

        </g>
      );
    });
  };

  return (
    <div className="container">
      <div className="left">
        <div className="wheel-wrap">
          <div
            ref={wheelRef}
            className="wheel"
            style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? "transform 4s cubic-bezier(.08,.82,.17,1)" : "transform 0.6s ease" }}
          >
            <svg viewBox="0 0 240 240" style={{ width: "100%", height: "100%" }}>
              <g transform="translate(120,120)">{renderSlices()}</g>
            </svg>
          </div>

          <div className="pointer" />
        </div>

        <div className="controls">
          <button className="btn btn-primary" onClick={spin} disabled={isSpinning}>
            {isSpinning ? "Spinning..." : "Spin"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              // small nudge
              setRotation((r) => r + 360);
            }}
          >
            lol ntg
          </button>
        </div>

        <div className="status">
          <div>Stars: <strong>{stars}</strong> / {targetStars}</div>
          <div className="small">Complete challenges to earn stars and unlock the gift</div>
        </div>

        {stars >= targetStars && (
          <div className="congrats">
            <div><strong>Congratulations 🎉</strong></div>
            <div className="small">You've collected enough stars. Click the gift to open it.</div>
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-primary" onClick={() => alert("Go to terrace you'll find ...")}>Open Gift</button>
            </div>
          </div>
        )}
      </div>

      <div className="right">
        <div style={{ marginBottom: 12 }}>
          <label className="small">Target stars to unlock (1 - {segments.length}):</label>
          <input
            type="number"
            value={targetStars}
            min={1}
            max={segments.length}
            onChange={(e) => setTargetStars(Number(e.target.value))}
            className="input"
            style={{ marginTop: 6 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label className="small">Add a challenge</label>
          <SegmentAdder onAdd={addSegment} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div className="small" style={{ marginBottom: 6 }}>Segments ({segments.length})</div>
          <div className="segment-list">
            {segments.map((s, i) => (
              <div key={i} className="segment-row">
                <div style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 10 }} className="small">How to play: Spin → Scratch the card to reveal the challenge → Complete it → Tap Complete Challenge to earn a star.</div>
      </div>

      {/* Scratch Modal */}
      {showScratch && selectedIndex !== null && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Scratch to reveal your challenge</h3>
            <div className="scratch-area">
              <div className="scratch-hidden-text">{segments[selectedIndex]}</div>
              <canvas
                ref={canvasRef}
                className="scratch-canvas"
                // sized by CSS; canvas actual size set in initScratchCanvas
              />
            </div>

            <div className="reveal-btns">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowScratch(false);
                  setSelectedIndex(null);
                }}
              >
                Skip
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  // if not scratched enough, force scratchComplete false; check percent
                  if (!scratchComplete) {
                    const percent = computeScratchedPercentage();
                    if (percent < 30) {
                      alert("Scratch more to reveal the challenge.");
                      return;
                    } else {
                      setScratchComplete(true);
                    }
                  }
                  completeChallenge();
                }}
              >
                Complete Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// small helper component for adding segments
function SegmentAdder({ onAdd }) {
  const [value, setValue] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input className="input" placeholder="e.g. Do a funny face" value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="btn btn-primary" onClick={() => { onAdd(value); setValue(""); }}>Add</button>
    </div>
  );
}
