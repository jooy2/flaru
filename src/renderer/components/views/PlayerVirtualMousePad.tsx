import {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, Lock, LockOpen, Move, X, Zap } from 'lucide-react';
import { clamp } from 'qsu';

// On-screen mouse emulation for Flash content that expects a pointer.
//
// Draws a cursor over the player and a small draggable pad that steers it: an
// analog stick for fine aiming, left/middle/right buttons, a turbo toggle that
// repeats a held button as fast clicks, and a hold-lock that latches a button
// down.
//
// The same pad as FlashArch Player's, so the layout, the timings and the event
// synthesis are deliberately identical. The skin lives in `app.css`.

const PANEL_WIDTH = 178;

// Approximate rendered height of the pad, used only until the panel has been
// measured. The panel itself is sized by its content.
const PANEL_HEIGHT = 238;
const STICK_SIZE = 108;
const KNOB_SIZE = STICK_SIZE * 0.42;
const KNOB_TRAVEL = (STICK_SIZE - KNOB_SIZE) / 2;
const CURSOR_WIDTH = 22;
const CURSOR_HEIGHT = 26;

// Cursor travel at full stick deflection, in CSS pixels per second.
const CURSOR_SPEED = 620;

// Below this the stick is treated as centred. A resting thumb otherwise makes
// the cursor creep.
const STICK_DEAD_ZONE = 0.12;

// Longest frame gap the cursor is allowed to travel for. A window that was
// hidden resumes with a huge one, which would teleport the cursor across the
// stage.
const MAX_FRAME_INTERVAL = 100;

// The cursor is repainted every frame, but each move dispatch makes Ruffle
// hit-test the stage, so those are forwarded at ~30 per second.
const MOVE_SEND_INTERVAL = 32;

// One half of a turbo click cycle: the button is held down for this long, then
// released for this long, giving ~10 clicks per second.
const TURBO_HALF_PERIOD = 50;

// Shortest press the movie is guaranteed to notice. See `endPress`.
const MIN_PRESS_DURATION = 80;

// Mouse `button` values, matching the DOM's numbering.
const BUTTON_LEFT = 0;
const BUTTON_MIDDLE = 1;
const BUTTON_RIGHT = 2;

// DOM `buttons` bitmask per `button` index: left, middle, right.
const MOUSE_BUTTON_MASKS = [1, 4, 2];

// `pointerId` for the events we synthesize. Ruffle's core captures the pointer
// it takes a press from, so keep ours out of the range a real one can occupy.
const SYNTHETIC_POINTER_ID = 0x7ffffff0;

// Keeps the rest of a gesture on the control it started on. Best effort: a
// browser that refuses the capture still delivers the press, so a failure here
// must not take the handler down with it.
const capturePointer = (event: ReactPointerEvent<HTMLElement>) => {
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    // Do nothing
  }
};

// One mouse button. Follows a finger: lit only while it is actually held,
// whether by the pointer itself or by the hold-lock.
function ClickButton({
  label,
  flex,
  isPressed = false,
  onDown = undefined,
  onUp = undefined,
}: {
  label: string;
  flex: number;
  isPressed?: boolean;
  onDown?: () => void;
  onUp?: () => void;
}) {
  return (
    <div
      className={`virtual-mouse__click${isPressed ? ' virtual-mouse__click--pressed' : ''}`}
      style={{ flex }}
      onPointerDown={(event) => {
        capturePointer(event);

        if (onDown) {
          onDown();
        }
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div className="virtual-mouse__cap">
        <span className="virtual-mouse__cap-label">{label}</span>
      </div>
    </div>
  );
}

// Shared chassis for the two latching toggles (turbo, hold-lock). Squared like
// the click buttons, but it holds its lit state instead of following a pointer,
// which is what separates "mode" from "press" at a glance.
function ToggleButton({
  flex,
  label = undefined,
  isActive = false,
  onClick = undefined,
  children = undefined,
}: {
  flex: number;
  label?: string;
  isActive?: boolean;
  onClick?: () => void;
  children?: ReactNode | ReactNode[];
}) {
  return (
    <button
      type="button"
      className={`virtual-mouse__toggle${isActive ? ' virtual-mouse__toggle--active' : ''}`}
      style={{ flex }}
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function PlayerVirtualMousePad({
  rufflePlayer = null,
  onClose = undefined,
}: {
  rufflePlayer?: any;
  onClose?: () => void;
}) {
  const [t] = useTranslation(['menu']);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursor = useRef({ x: 0, y: 0 });
  // Last known area of the player. Kept because the releases that run while the
  // pad is unmounting still need it: React has already dropped the ref by then,
  // and a button left pressed would freeze the movie mid-drag.
  const lastContainerRect = useRef<DOMRect | null>(null);
  const stick = useRef({ x: 0, y: 0 });
  const lastSentCursor = useRef<{ x: number; y: number } | null>(null);
  // DOM `buttons` bitmask of the mouse buttons the pad is holding.
  const heldButtons = useRef(0);
  // Whether we've told Ruffle the virtual pointer is over the stage.
  const enteredStage = useRef(false);
  const isPressed = useRef([false, false, false]);
  const turboTimers = useRef<Record<number, any>>({});
  const turboDown = useRef<Record<number, boolean>>({});
  // Pending releases held back to give a tap a visible press. See `endPress`.
  const releaseTimers = useRef<Record<number, any>>({});
  const pressStartedAt = useRef<Record<number, number>>({});
  const pressGeneration = useRef<Record<number, number>>({});
  // The one button currently latched by the hold-lock, if any.
  const latchedButton = useRef<number | null>(null);
  const panelDrag = useRef<{ x: number; y: number } | null>(null);
  const isPlaced = useRef(false);

  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [pressedState, setPressedState] = useState([false, false, false]);
  const [stickValue, setStickValue] = useState({ x: 0, y: 0 });
  const [stickActive, setStickActive] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [lockHold, setLockHold] = useState(false);

  const getPanelSize = () => {
    return {
      width: panelRef.current?.offsetWidth || PANEL_WIDTH,
      height: panelRef.current?.offsetHeight || PANEL_HEIGHT,
    };
  };

  const clampCursor = (x: number, y: number) => {
    const container = containerRef.current;

    if (!container) {
      return { x, y };
    }

    return {
      x: clamp(x, 0, container.clientWidth),
      y: clamp(y, 0, container.clientHeight),
    };
  };

  // The pad may never leave the player area, so it is clamped to whatever room
  // is left once its own size is taken off.
  const clampPanel = (x: number, y: number) => {
    const container = containerRef.current;

    if (!container) {
      return { x, y };
    }

    const panel = getPanelSize();

    return {
      x: clamp(x, 0, Math.max(0, container.clientWidth - panel.width)),
      y: clamp(y, 0, Math.max(0, container.clientHeight - panel.height)),
    };
  };

  // Ruffle's live canvas. Always the LAST one: a renderer restart can leave an
  // older canvas in the shadow root, and a stale one still reports a valid rect
  // while Ruffle's input listeners live on the current one.
  const getRuffleCanvas = () => {
    const canvases = rufflePlayer?.shadowRoot?.querySelectorAll('canvas');

    return canvases?.length ? canvases[canvases.length - 1] : null;
  };

  const emitPointerEvent = useCallback(
    (type: string, button: number, bubbles = true) => {
      const canvas = getRuffleCanvas();
      const target =
        canvas ?? rufflePlayer?.shadowRoot?.getElementById('container') ?? rufflePlayer;
      const containerRect =
        containerRef.current?.getBoundingClientRect() ?? lastContainerRect.current;

      if (!target || !containerRect) {
        return;
      }

      lastContainerRect.current = containerRect;

      const x = containerRect.left + cursor.current.x;
      const y = containerRect.top + cursor.current.y;
      const rect = (canvas ?? target).getBoundingClientRect?.();
      // Position within the canvas, which is what Ruffle actually consumes.
      const localX = rect ? x - rect.left : x;
      const localY = rect ? y - rect.top : y;
      const mask = MOUSE_BUTTON_MASKS[button] ?? MOUSE_BUTTON_MASKS[BUTTON_LEFT];

      if (type === 'pointerdown') {
        heldButtons.current |= mask;
      } else if (type === 'pointerup') {
        heldButtons.current &= ~mask;
      }

      // Deliberately a mouse pointer, not a touch one. Touch has no hover (so
      // Flash rollovers would never fire) and it arms Ruffle's long-press
      // context menu detector, which would fire on every turbo burst.
      const event = new PointerEvent(type, {
        pointerId: SYNTHETIC_POINTER_ID,
        pointerType: 'mouse',
        isPrimary: true,
        view: window,
        clientX: x,
        clientY: y,
        // -1 is what a real browser reports for a move: no button changed.
        button: type === 'pointermove' ? -1 : button,
        buttons: heldButtons.current,
        pressure: heldButtons.current ? 0.5 : 0,
        bubbles,
        cancelable: true,
        composed: true,
      });

      // Ruffle's core reads the pointer position from `offsetX`/`offsetY` and
      // never looks at clientX/clientY. Those two are NOT part of
      // PointerEventInit: the engine derives them lazily from the event's
      // absolute location, and for a constructor-built event that can come out
      // as 0, which makes every synthetic click resolve to the stage's top-left
      // corner. Pin them to the real local coordinates instead.
      try {
        Object.defineProperty(event, 'offsetX', { configurable: true, get: () => localX });
        Object.defineProperty(event, 'offsetY', { configurable: true, get: () => localY });
      } catch {
        // Read-only in some engines; the native value is the best we have.
      }

      target.dispatchEvent(event);
    },
    [rufflePlayer],
  );

  const sendMouseEvent = useCallback(
    (type: string, button = BUTTON_LEFT) => {
      // Ruffle tracks whether the pointer is over the stage via
      // `pointerenter`/`pointerleave` and stops hit-testing once it believes the
      // pointer has left, so announce ours before the first event, and again
      // before every press, which the core needs to keep hit-testing. On the
      // desktop this matters more than anywhere: the real mouse leaves the stage
      // every time it moves onto the pad. `pointerenter` does not bubble for a
      // real pointer, so don't let ours.
      if (type === 'pointerdown' || !enteredStage.current) {
        enteredStage.current = true;
        emitPointerEvent('pointerover', button);
        emitPointerEvent('pointerenter', button, false);
      }

      // A release resolves against wherever the core last saw the pointer, not
      // against the coordinates on the release itself, so refresh that first.
      // Without it Flash reports `releaseOutside`: the button lights up but
      // never fires.
      if (type === 'pointerup') {
        emitPointerEvent('pointermove', button);
      }

      emitPointerEvent(type, button);
    },
    [emitPointerEvent],
  );

  const moveCursor = useCallback((x: number, y: number) => {
    cursor.current = clampCursor(x, y);

    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate3d(${cursor.current.x}px, ${cursor.current.y}px, 0)`;
    }
  }, []);

  const setButtonPressed = (button: number, value: boolean) => {
    isPressed.current[button] = value;
    setPressedState([...isPressed.current]);
  };

  const startTurbo = useCallback(
    (button: number) => {
      turboDown.current[button] = true;
      clearInterval(turboTimers.current[button]);
      turboTimers.current[button] = setInterval(() => {
        const isDown = turboDown.current[button] ?? false;

        turboDown.current[button] = !isDown;
        sendMouseEvent(isDown ? 'pointerup' : 'pointerdown', button);
      }, TURBO_HALF_PERIOD);
    },
    [sendMouseEvent],
  );

  const beginPress = (button: number) => {
    setButtonPressed(button, true);
    pressGeneration.current[button] = (pressGeneration.current[button] ?? 0) + 1;
    pressStartedAt.current[button] = Date.now();
    clearTimeout(releaseTimers.current[button]);
    delete releaseTimers.current[button];

    // A move always precedes the press so Ruffle resolves the click against the
    // cursor's current spot even if the stick was never touched.
    sendMouseEvent('pointermove', button);
    sendMouseEvent('pointerdown', button);

    if (turbo) {
      startTurbo(button);
    }
  };

  const endPress = (button: number) => {
    if (!isPressed.current[button]) {
      return;
    }

    setButtonPressed(button, false);

    clearInterval(turboTimers.current[button]);
    delete turboTimers.current[button];

    // Turbo may have left the button released; a stray extra release is
    // harmless, whereas a missed one would leave the movie stuck mid-drag.
    delete turboDown.current[button];

    const startedAt = pressStartedAt.current[button];
    const held = startedAt ? Date.now() - startedAt : MIN_PRESS_DURATION;

    if (held >= MIN_PRESS_DURATION) {
      sendMouseEvent('pointerup', button);
      return;
    }

    // A tap that presses and releases inside one frame is a press the movie
    // never sees: Flash resolves button state per frame tick, so both land in
    // the same one and cancel out. Hold the release back for the remainder
    // instead of stretching every tap by a fixed delay.
    const generation = pressGeneration.current[button] ?? 0;

    releaseTimers.current[button] = setTimeout(() => {
      delete releaseTimers.current[button];

      // A new press in the meantime owns the button now; its own release will
      // send the pointerup.
      if (pressGeneration.current[button] !== generation) {
        return;
      }

      sendMouseEvent('pointerup', button);
    }, MIN_PRESS_DURATION - held);
  };

  const releaseLatched = () => {
    const latched = latchedButton.current;

    if (latched === null) {
      return;
    }

    latchedButton.current = null;
    endPress(latched);
  };

  const handleButtonDown = (button: number) => {
    // Only ever one mouse button at a time. A real mouse cannot report two, so
    // a second pointer landing on another button lets the first one go.
    isPressed.current.forEach((pressed, other) => {
      if (pressed && other !== button) {
        endPress(other);
      }
    });

    if (!lockHold) {
      beginPress(button);
      return;
    }

    // Locked: a press latches the button down and it stays down after the
    // pointer lifts. Pressing it again lets go, and latching a different button
    // lets the previous one go first, so only one button is ever held.
    const latched = latchedButton.current;

    if (latched !== null) {
      releaseLatched();

      if (latched === button) {
        return;
      }
    }

    latchedButton.current = button;
    beginPress(button);
  };

  const handleButtonUp = (button: number) => {
    // A latched button ignores the release, which is the whole point of it.
    if (lockHold && latchedButton.current === button) {
      return;
    }

    endPress(button);
  };

  const handleToggleLock = () => {
    setLockHold(!lockHold);

    if (lockHold) {
      releaseLatched();
    }
  };

  const handleToggleTurbo = () => {
    setTurbo(!turbo);

    if (!turbo) {
      // Anything already held, most likely a latched button, starts bursting
      // straight away rather than waiting to be pressed again.
      isPressed.current.forEach((pressed, button) => {
        if (pressed) {
          startTurbo(button);
        }
      });
      return;
    }

    // Leaving turbo mid-burst must not strand the button: it is still being held
    // (by a pointer or by the latch), so settle it back into the down state
    // rather than releasing it.
    Object.keys(turboTimers.current).forEach((key) => {
      const button = Number(key);

      clearInterval(turboTimers.current[button]);
      delete turboTimers.current[button];

      if (turboDown.current[button] !== true) {
        sendMouseEvent('pointerdown', button);
      }

      delete turboDown.current[button];
    });
  };

  const handleStickMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width / 2;
    const rawX = (event.clientX - rect.left - radius) / radius;
    const rawY = (event.clientY - rect.top - radius) / radius;
    const distance = Math.hypot(rawX, rawY);
    // Past the rim the knob stays on it, still pointing the same way.
    const scale = distance > 1 ? 1 / distance : 1;
    const x = rawX * scale;
    const y = rawY * scale;

    setStickValue({ x, y });
    stick.current = distance < STICK_DEAD_ZONE ? { x: 0, y: 0 } : { x, y };
  };

  const handleStickDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    capturePointer(event);
    setStickActive(true);
    handleStickMove(event);
  };

  const handleStickUp = () => {
    setStickActive(false);
    setStickValue({ x: 0, y: 0 });
    stick.current = { x: 0, y: 0 };
  };

  const handleGripDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    capturePointer(event);
    panelDrag.current = {
      x: event.clientX - (panelPosition?.x ?? 0),
      y: event.clientY - (panelPosition?.y ?? 0),
    };
  };

  const handleGripMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panelDrag.current) {
      return;
    }

    setPanelPosition(
      clampPanel(event.clientX - panelDrag.current.x, event.clientY - panelDrag.current.y),
    );
  };

  const handleGripUp = () => {
    panelDrag.current = null;
  };

  // Places the cursor and the pad the first time we know how big the player is,
  // and keeps both inside it afterwards, since a resize can leave them out of
  // reach.
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const sync = () => {
      if (container.clientWidth < 1 || container.clientHeight < 1) {
        return;
      }

      if (!isPlaced.current) {
        const panel = getPanelSize();

        isPlaced.current = true;
        moveCursor(container.clientWidth / 2, container.clientHeight / 2);
        // Middle right, where it covers the least of the content.
        setPanelPosition(
          clampPanel(
            container.clientWidth - panel.width - 12,
            (container.clientHeight - panel.height) / 2,
          ),
        );
        return;
      }

      moveCursor(cursor.current.x, cursor.current.y);
      setPanelPosition((current) => (current ? clampPanel(current.x, current.y) : current));
    };

    const observer = new ResizeObserver(sync);

    observer.observe(container);
    sync();

    return () => observer.disconnect();
  }, [moveCursor]);

  // Cursor travel is driven off the frame clock rather than a fixed interval:
  // a timer is clamped to one tick per second while the window is hidden, which
  // would make the stick crawl for a second after coming back.
  useEffect(() => {
    let frame = 0;
    let lastTime = 0;
    let sinceSent = 0;

    const step = (time: number) => {
      frame = requestAnimationFrame(step);

      const elapsed = lastTime ? Math.min(time - lastTime, MAX_FRAME_INTERVAL) : 0;

      lastTime = time;
      sinceSent += elapsed;

      if (stick.current.x !== 0 || stick.current.y !== 0) {
        const seconds = elapsed / 1000;

        moveCursor(
          cursor.current.x + stick.current.x * CURSOR_SPEED * seconds,
          cursor.current.y + stick.current.y * CURSOR_SPEED * seconds,
        );
      }

      if (
        sinceSent >= MOVE_SEND_INTERVAL &&
        (lastSentCursor.current?.x !== cursor.current.x ||
          lastSentCursor.current?.y !== cursor.current.y)
      ) {
        sinceSent = 0;
        lastSentCursor.current = { ...cursor.current };
        sendMouseEvent('pointermove');
      }
    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [moveCursor, sendMouseEvent]);

  // A real click on the movie warps the cursor to where it landed, so the pad
  // can be aimed by hand instead of walked across the stage with the stick.
  useEffect(() => {
    const container = containerRef.current;
    const host = container?.parentElement;

    if (!host) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      // A press on the pad is not a press on the movie.
      if (panelRef.current?.contains(event.target as Node)) {
        return;
      }

      const rect = container.getBoundingClientRect();

      moveCursor(event.clientX - rect.left, event.clientY - rect.top);

      // Keep Ruffle's own hover state in step with the jump, so a click that
      // follows immediately lands on whatever is under the new position.
      sendMouseEvent('pointermove');
    };

    host.addEventListener('pointerdown', handlePointerDown, true);

    return () => host.removeEventListener('pointerdown', handlePointerDown, true);
  }, [moveCursor, sendMouseEvent]);

  // Whatever the pad was holding must not outlive it, or the movie is left
  // stuck mid-drag with no way to release the button.
  useEffect(() => {
    return () => {
      Object.values(turboTimers.current).forEach((timer) => clearInterval(timer));
      Object.values(releaseTimers.current).forEach((timer) => clearTimeout(timer));

      isPressed.current.forEach((pressed, button) => {
        if (pressed) {
          sendMouseEvent('pointerup', button);
        }
      });
    };
  }, [sendMouseEvent]);

  // Both are placed together, once the player area has been measured. Until
  // then they would sit in the top left corner.
  const visibility = panelPosition ? 'visible' : 'hidden';

  return (
    <div ref={containerRef} className="virtual-mouse">
      <div
        ref={cursorRef}
        className="virtual-mouse__cursor"
        style={{ width: CURSOR_WIDTH, height: CURSOR_HEIGHT, visibility }}
      >
        <svg
          width={CURSOR_WIDTH}
          height={CURSOR_HEIGHT}
          viewBox={`0 0 ${CURSOR_WIDTH} ${CURSOR_HEIGHT}`}
          aria-hidden="true"
        >
          <path
            d="M0 0 L0 17.5 L4.6 13.4 L7.6 20.4 L10.8 19 L7.9 12.2 L13.6 11.9 Z"
            fill="#fff"
            stroke="rgba(0, 0, 0, 0.87)"
            strokeWidth="1.4"
          />
        </svg>
      </div>
      {/* The movie keeps the keyboard focus while the pad is used: Ruffle takes
          keys only while it is focused, and a game is often played with the
          keyboard and the pad at once. Holding back the mouse press is what
          stops the pad from taking the focus; a toggle is still reached and
          pressed from the keyboard. */}
      <div
        ref={panelRef}
        className="virtual-mouse__panel"
        style={{
          width: PANEL_WIDTH,
          transform: `translate3d(${panelPosition?.x ?? 0}px, ${panelPosition?.y ?? 0}px, 0)`,
          visibility,
        }}
        onMouseDown={(event) => event.preventDefault()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="virtual-mouse__header">
          {/* Only the grip drags the pad. The stick and buttons below need their
              own pointers. */}
          <div
            className="virtual-mouse__grip"
            onPointerDown={handleGripDown}
            onPointerMove={handleGripMove}
            onPointerUp={handleGripUp}
            onPointerCancel={handleGripUp}
          >
            <GripVertical className="virtual-mouse__glyph" aria-hidden="true" />
          </div>
          <button
            type="button"
            className="virtual-mouse__close"
            aria-label={t('close')}
            onClick={onClose}
          >
            <X className="virtual-mouse__glyph" aria-hidden="true" />
          </button>
        </div>
        <div
          className="virtual-mouse__stick"
          style={{ width: STICK_SIZE, height: STICK_SIZE }}
          onPointerDown={handleStickDown}
          onPointerMove={(event) => {
            if (stickActive) {
              handleStickMove(event);
            }
          }}
          onPointerUp={handleStickUp}
          onPointerCancel={handleStickUp}
        >
          {/* Two rims: a dark ring outside so the well shows up on pale content,
              and a light one inside so it doesn't vanish into a black stage. */}
          <div className="virtual-mouse__well">
            <div
              className={`virtual-mouse__knob${stickActive ? ' virtual-mouse__knob--active' : ''}`}
              style={{
                width: KNOB_SIZE,
                height: KNOB_SIZE,
                transform: `translate(${stickValue.x * KNOB_TRAVEL}px, ${
                  stickValue.y * KNOB_TRAVEL
                }px) scale(${stickActive ? 0.92 : 1})`,
              }}
            >
              <Move
                aria-hidden="true"
                style={{ width: KNOB_SIZE * 0.46, height: KNOB_SIZE * 0.46 }}
              />
            </div>
          </div>
        </div>
        {/* Left is the button that actually gets used, so it takes the widest
            share of the row; middle and right split the rest evenly. */}
        <div className="virtual-mouse__clicks">
          <ClickButton
            label="L"
            flex={4}
            isPressed={pressedState[BUTTON_LEFT]}
            onDown={() => handleButtonDown(BUTTON_LEFT)}
            onUp={() => handleButtonUp(BUTTON_LEFT)}
          />
          <ClickButton
            label="M"
            flex={3}
            isPressed={pressedState[BUTTON_MIDDLE]}
            onDown={() => handleButtonDown(BUTTON_MIDDLE)}
            onUp={() => handleButtonUp(BUTTON_MIDDLE)}
          />
          <ClickButton
            label="R"
            flex={3}
            isPressed={pressedState[BUTTON_RIGHT]}
            onDown={() => handleButtonDown(BUTTON_RIGHT)}
            onUp={() => handleButtonUp(BUTTON_RIGHT)}
          />
        </div>
        <div className="virtual-mouse__toggles">
          <ToggleButton flex={3} isActive={turbo} onClick={handleToggleTurbo}>
            <Zap className="virtual-mouse__glyph" aria-hidden="true" />
            <span className="virtual-mouse__toggle-label">TURBO</span>
          </ToggleButton>
          <ToggleButton
            flex={2}
            label={t('mouse-hold')}
            isActive={lockHold}
            onClick={handleToggleLock}
          >
            {lockHold ? (
              <Lock className="virtual-mouse__glyph" aria-hidden="true" />
            ) : (
              <LockOpen className="virtual-mouse__glyph" aria-hidden="true" />
            )}
          </ToggleButton>
        </div>
      </div>
    </div>
  );
}
