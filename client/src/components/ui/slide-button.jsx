import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import { Check, Loader2, SendHorizontal, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const KNOB_SIZE = 44;
const TRACK_INSET = 8;
const DRAG_THRESHOLD = 0.9
const RESET_DELAY_SUCCESS = 1200
const RESET_DELAY_ERROR = 1800

const BUTTON_STATES = {
  initial: { width: '100%' },
  completed: { width: '9rem' },
};

const ANIMATION_CONFIG = {
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
};

function StatusIcon({ status, successLabel, errorLabel }) {
  const iconMap = useMemo(
    () => ({
      loading: <Loader2 className="animate-spin" size={18} />,
      success: (
        <span className="inline-flex items-center gap-1.5">
          <Check size={18} />
          {successLabel}
        </span>
      ),
      error: (
        <span className="inline-flex items-center gap-1.5">
          <X size={18} />
          {errorLabel}
        </span>
      ),
    }),
    [successLabel, errorLabel],
  );

  if (!iconMap[status]) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      {iconMap[status]}
    </motion.div>
  );
}

export const SlideButton = forwardRef(
  (
    {
      className,
      label = 'Slide to confirm',
      successLabel = 'Done',
      errorLabel = 'Failed',
      disabled = false,
      onConfirm,
      onError,
      ...props
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [status, setStatus] = useState('idle');
    const trackRef = useRef(null);
    const resetTimeoutRef = useRef(null);
    const [dragRight, setDragRight] = useState(140);

    useEffect(() => {
      const track = trackRef.current;
      if (!track) return;

      const measure = () => {
        const width = track.clientWidth;
        setDragRight(Math.max(40, width - KNOB_SIZE - TRACK_INSET));
      };

      measure();

      const observer = new ResizeObserver(measure);
      observer.observe(track);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      return () => {
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      };
    }, []);

    const dragConstraints = useMemo(() => ({ left: 0, right: dragRight }), [dragRight]);

    const dragX = useMotionValue(0);
    const springX = useSpring(dragX, ANIMATION_CONFIG.spring);
    const dragProgress = useTransform(springX, [0, dragRight || 1], [0, 1]);
    const adjustedWidth = useTransform(springX, (x) => x + 10);

    const runConfirm = useCallback(async () => {
      setStatus('loading');

      let resultStatus = 'success';
      try {
        await onConfirm?.();
      } catch (err) {
        resultStatus = 'error';
        onError?.(err);
      }

      setStatus(resultStatus);
      resetTimeoutRef.current = setTimeout(() => {
        setStatus('idle');
        setCompleted(false);
        dragX.set(0);
      }, resultStatus === 'error' ? RESET_DELAY_ERROR : RESET_DELAY_SUCCESS);
    }, [onConfirm, onError, dragX]);

    const handleDragStart = useCallback(() => {
      if (completed || disabled) return;
      setIsDragging(true);
    }, [completed, disabled]);

    const handleDragEnd = () => {
      if (completed || disabled) return;
      setIsDragging(false);

      const progress = dragProgress.get();
      if (progress >= DRAG_THRESHOLD) {
        setCompleted(true);
        runConfirm();
      } else {
        dragX.set(0);
      }
    };

    const handleDrag = (_event, info) => {
      if (completed || disabled) return;
      const newX = Math.max(0, Math.min(info.offset.x, dragRight));
      dragX.set(newX);
    };

    return (
      <motion.div
        ref={trackRef}
        animate={completed ? BUTTON_STATES.completed : BUTTON_STATES.initial}
        transition={ANIMATION_CONFIG.spring}
        className={cn(
          'relative flex h-11 w-full max-w-sm items-center justify-center overflow-hidden rounded-full bg-muted shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {!completed && (
          <>
            <motion.div
              style={{ width: adjustedWidth }}
              className="absolute inset-y-0 left-0 z-0 rounded-full bg-primary/25"
            />
            <span className="pointer-events-none relative z-[1] text-sm font-medium text-muted-foreground">
              {label}
            </span>
          </>
        )}

        <AnimatePresence>
          {!completed && (
            <motion.div
              drag="x"
              dragConstraints={dragConstraints}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              style={{ x: springX }}
              className="absolute left-1 z-10 flex cursor-grab items-center justify-start active:cursor-grabbing"
            >
              <Button
                ref={ref}
                type="button"
                disabled={disabled}
                {...props}
                size="icon"
                className={cn(
                  'rounded-full shadow-[var(--shadow-elevated)]',
                  isDragging && 'scale-105 transition-transform',
                  className,
                )}
              >
                <SendHorizontal className="size-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {completed && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                ref={ref}
                type="button"
                disabled
                className={cn('size-full rounded-full transition-all duration-300', className)}
              >
                <AnimatePresence mode="wait">
                  <StatusIcon
                    key={status}
                    status={status}
                    successLabel={successLabel}
                    errorLabel={errorLabel}
                  />
                </AnimatePresence>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

SlideButton.displayName = 'SlideButton';
