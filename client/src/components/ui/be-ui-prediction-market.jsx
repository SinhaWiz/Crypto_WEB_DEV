import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { SlideButton } from '@/components/ui/slide-button';

export const EASE_OUT = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT = [0.77, 0, 0.175, 1];
export const EASE_DRAWER = [0.32, 0.72, 0, 1];

export const EASE_OUT_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';

export const SPRING_PRESS = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 0.6,
};

export const SPRING_SWAP = {
  type: 'spring',
  stiffness: 460,
  damping: 30,
  mass: 0.55,
};

export const SPRING_PANEL = {
  type: 'spring',
  stiffness: 420,
  damping: 40,
  mass: 0.5,
};

export const SPRING_LAYOUT = {
  type: 'spring',
  stiffness: 360,
  damping: 32,
  mass: 0.6,
};

export const SPRING_MOUSE = {
  stiffness: 200,
  damping: 15,
  mass: 0.3,
};

export function StatefulButton({
  state = 'idle',
  variant = 'primary',
  size = 'md',
  pressScale = 0.96,
  loadingText = 'Loading',
  successText = 'Success',
  errorText = 'Error',
  className,
  children,
  disabled,
  ...props
}) {
  const reduce = useReducedMotion();

  const label =
    state === 'loading'
      ? loadingText
      : state === 'success'
        ? successText
        : state === 'error'
          ? errorText
          : children;

  const Icon =
    state === 'loading'
      ? Loader2
      : state === 'success'
        ? CheckCircle2
        : state === 'error'
          ? AlertCircle
          : null;

  return (
    <motion.button
      type="button"
      whileTap={reduce || disabled ? undefined : { scale: pressScale }}
      transition={SPRING_PRESS}
      disabled={disabled || state === 'loading'}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' &&
          'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'secondary' &&
          'border border-border bg-card text-foreground hover:bg-card/70',
        variant === 'ghost' &&
          'text-muted-foreground hover:bg-primary/5 hover:text-foreground',
        variant === 'outline' &&
          'border border-border bg-transparent text-foreground hover:bg-primary/5',
        size === 'sm' && 'h-8 rounded-full px-3 text-xs',
        size === 'md' && 'h-10 rounded-full px-5 text-sm',
        size === 'lg' && 'h-12 rounded-full px-6 text-base',
        size === 'icon' && 'h-8 w-8 rounded-lg',
        className,
      )}
      {...props}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {Icon ? (
          <motion.span
            key={state}
            initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="inline-flex items-center justify-center"
          >
            <Icon
              className={cn('h-4 w-4', state === 'loading' && 'animate-spin')}
            />
          </motion.span>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(label)}
          initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export function NumberTicker({
  value,
  duration = 0.35,
  className,
  format = (next) => next.toLocaleString(),
}) {
  const reduce = useReducedMotion();

  return (
    <motion.span
      key={value}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: EASE_OUT }}
      className={cn('inline-flex', className)}
    >
      {format(value)}
    </motion.span>
  );
}

const TabsContext = createContext(null);

export function Tabs({ value, onValueChange, variant = 'pill', className, children }) {
  const id = useId();

  return (
    <TabsContext.Provider value={{ value, onValueChange, variant, layoutId: id }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }) {
  return (
    <div className={cn('relative flex items-center rounded-full bg-muted p-1', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, indicatorClassName, children }) {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('TabsTrigger must be used inside Tabs');
  }

  const selected = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        'relative isolate inline-flex items-center justify-center rounded-full outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected ? 'text-foreground' : 'text-muted-foreground',
        className,
      )}
    >
      {selected ? (
        <motion.span
          layoutId={`${context.layoutId}-indicator`}
          className={cn(
            'absolute -z-10',
            context.variant === 'underline'
              ? 'bottom-0 left-0 right-0 h-0.5 rounded-full bg-foreground'
              : 'inset-0 rounded-[inherit] bg-background',
            indicatorClassName,
          )}
          transition={SPRING_LAYOUT}
        />
      ) : null}
      {children}
    </button>
  );
}

const DEFAULT_OUTCOMES = [
  { id: 'up', label: 'Up', price: 0.5 },
  { id: 'down', label: 'Down', price: 0.5 },
];

const MODES = [
  { id: 'buy', label: 'Buy' },
  { id: 'sell', label: 'Sell' },
];

const DEFAULT_QUICK_AMOUNTS = [10, 50, 100, 500];

const DIGIT_TRANSITION = {
  duration: 0.18,
  ease: EASE_OUT,
};

function useControllableOrder({ value, defaultValue, outcomes, onValueChange }) {
  const initialValue = {
    mode: defaultValue?.mode ?? 'buy',
    outcomeId: defaultValue?.outcomeId ?? outcomes[0]?.id ?? '',
    amount: defaultValue?.amount ?? '',
  };

  const [internalValue, setInternalValue] = useState(initialValue);
  const controlled = value !== undefined;
  const order = value ?? internalValue;

  const setOrder = useCallback(
    (next) => {
      if (!controlled) {
        setInternalValue(next);
      }

      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  return [order, setOrder];
}

function sanitizeAmount(value) {
  const normalized = value.replace(/[^\d.]/g, '');
  const [whole, ...decimalParts] = normalized.split('.');
  const decimal = decimalParts.join('');

  if (decimalParts.length === 0) return whole;

  return `${whole}.${decimal.slice(0, 2)}`;
}

function parseAmount(value) {
  return Number(value) || 0;
}

function formatPoints(value) {
  return `${Math.round(value).toLocaleString()} pts`;
}

function formatCompactPoints(value) {
  return `+${Math.round(value).toLocaleString()}`;
}

function formatMultiplier(price) {
  const safePrice = Math.max(0.01, Math.min(0.99, price));
  return `${(1 / safePrice).toFixed(2)}×`;
}

function buildQuote({ order, outcome, balance, position, minTrade }) {
  const amount = parseAmount(order.amount);
  const price = Math.max(0.01, Math.min(0.99, outcome.price));
  const shares = order.mode === 'buy' ? amount / price : amount;
  const payout = order.mode === 'buy' ? shares : amount * price;

  if (amount <= 0) {
    return { valid: false, amount, price, shares: 0, payout: 0, error: 'Enter an amount' };
  }

  if (order.mode === 'buy' && amount < minTrade) {
    return {
      valid: false,
      amount,
      price,
      shares,
      payout,
      error: `Minimum ${formatPoints(minTrade)}`,
    };
  }

  if (order.mode === 'buy' && amount > balance) {
    return { valid: false, amount, price, shares, payout, error: 'Insufficient points' };
  }

  if (order.mode === 'sell' && amount > position) {
    return { valid: false, amount, price, shares, payout, error: 'Not enough shares' };
  }

  return { valid: true, amount, price, shares, payout };
}

function keyedAmountChars(value) {
  const seen = new Map();

  return value.split('').map((char) => {
    const count = seen.get(char) ?? 0;

    seen.set(char, count + 1);

    return { id: `${char}-${count}`, char };
  });
}

function amountInputSize(value) {
  const length = value.replace(/\D/g, '').length;

  if (length >= 10) return 'text-3xl sm:text-4xl';
  if (length >= 8) return 'text-4xl sm:text-5xl';
  if (length >= 6) return 'text-[44px] sm:text-[56px]';

  return 'text-5xl sm:text-6xl';
}

function payoutTickerSize(value) {
  const length = formatPoints(value).length;

  if (length >= 16) return 'text-xl sm:text-2xl';
  if (length >= 13) return 'text-2xl';
  if (length >= 10) return 'text-3xl';

  return 'text-4xl';
}

function AnimatedAmountInput({ id, value, mode, inputSize, disabled, reduce, onChange }) {
  const displayValue = value || '0';
  const chars = keyedAmountChars(displayValue);
  const inputStyle = { '--amount-chars': String(chars.length) };
  const label = mode === 'buy' ? 'Points to stake' : 'Shares';

  return (
    <div className="flex min-w-0 items-center justify-center overflow-hidden">
      <div className="relative min-w-0 shrink">
        <input
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(sanitizeAmount(event.target.value))}
          placeholder="0"
          inputMode="decimal"
          aria-label={label}
          autoComplete="off"
          className={cn(
            'w-[calc((var(--amount-chars)+1)*0.62em)] min-w-[0.8em] max-w-[260px] bg-transparent text-left font-semibold leading-none tracking-normal text-transparent outline-none tabular-nums',
            'caret-foreground transition-[font-size] duration-200 placeholder:text-transparent selection:bg-foreground/10 disabled:cursor-not-allowed',
            inputSize,
          )}
          style={inputStyle}
        />

        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 flex min-w-0 items-center justify-start overflow-hidden font-semibold leading-none tracking-normal text-foreground tabular-nums transition-[font-size] duration-200',
            !value && 'text-muted-foreground/55',
            inputSize,
          )}
          style={inputStyle}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {chars.map(({ id: charId, char }) => (
              <motion.span
                key={charId}
                layout={reduce ? false : 'position'}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: 'blur(10px)' }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, filter: 'blur(10px)' }}
                transition={DIGIT_TRANSITION}
                className="inline-block min-w-[0.55em] text-center will-change-[transform,opacity,filter]"
              >
                {char}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function PredictionMarket({
  outcomes = DEFAULT_OUTCOMES,
  value,
  defaultValue,
  onValueChange,
  onTrade,
  onSignIn,
  authenticated = true,
  orderTypeLabel = 'Market',
  balance = 500,
  positions = {},
  quickAmounts = DEFAULT_QUICK_AMOUNTS,
  minTrade = 1,
  className,
  classNames,
}) {
  const inputId = useId();
  const reduce = useReducedMotion() ?? false;

  const [order, setOrder] = useControllableOrder({ value, defaultValue, outcomes, onValueChange });

  const selectedOutcome = outcomes.find((outcome) => outcome.id === order.outcomeId) ?? outcomes[0];

  const position = positions[selectedOutcome.id] ?? 0;

  const quote = useMemo(
    () => buildQuote({ order, outcome: selectedOutcome, balance, position, minTrade }),
    [balance, minTrade, order, position, selectedOutcome],
  );

  const setOrderValue = useCallback(
    (next) => {
      setOrder({ ...order, ...next });
    },
    [order, setOrder],
  );

  const addAmount = (increment) => {
    const next = parseAmount(order.amount) + increment;
    setOrderValue({ amount: String(next) });
  };

  const setMax = () => {
    if (order.mode === 'buy') {
      setOrderValue({ amount: String(Math.floor(balance)) });
      return;
    }

    setOrderValue({ amount: position.toFixed(position % 1 === 0 ? 0 : 2) });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmTrade = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onTrade?.(order, quote);
    } finally {
      setIsSubmitting(false);
    }
  }, [onTrade, order, quote]);

  const inputSize = amountInputSize(order.amount);
  const payoutSize = payoutTickerSize(quote.payout);

  const showFooter = authenticated;

  return (
    <div
      className={cn(
        'w-full max-w-[400px] overflow-hidden rounded-3xl border border-border bg-background',
        className,
        classNames?.root,
      )}
    >
      <div className={cn('border-b border-border/80 px-4 pt-4', classNames?.header)}>
        <div className="flex items-end justify-between gap-4">
          <Tabs
            value={order.mode}
            onValueChange={(mode) => setOrderValue({ mode, amount: '' })}
            variant="underline"
            className={cn('shrink-0', classNames?.tabs)}
          >
            <TabsList className="gap-5 border-b-0 bg-transparent p-0">
              {MODES.map((mode) => (
                <TabsTrigger
                  key={mode.id}
                  value={mode.id}
                  className="px-0 pb-3 pt-0 text-2xl font-semibold"
                  indicatorClassName="h-0.5 bg-foreground"
                >
                  {mode.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <span className="mb-3 inline-flex items-center gap-2 text-xl font-semibold text-foreground">
            {orderTypeLabel}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-3">
        <Tabs
          value={selectedOutcome.id}
          onValueChange={(outcomeId) => setOrderValue({ outcomeId })}
          variant="pill"
          className={classNames?.outcomes}
        >
          <TabsList className="grid w-full grid-cols-2 gap-2 p-1.5">
            {outcomes.map((outcome) => {
              const selected = outcome.id === selectedOutcome.id;
              const isNo = outcome.label.toLowerCase() === 'no' || outcome.label.toLowerCase() === 'down';

              return (
                <TabsTrigger
                  key={outcome.id}
                  value={outcome.id}
                  indicatorClassName={isNo ? 'bg-red-500/10 dark:bg-red-500/15' : 'bg-emerald-500/20'}
                  className={cn(
                    'h-14 w-full rounded-[1.35rem] px-0 py-0 text-base font-semibold active:scale-[0.99]',
                    isNo
                      ? selected
                        ? 'text-red-300 dark:text-red-300'
                        : 'text-red-300/55 dark:text-red-300/50'
                      : selected
                        ? 'text-emerald-400 dark:text-emerald-300'
                        : 'text-muted-foreground',
                  )}
                >
                  {outcome.label} {formatMultiplier(outcome.price)}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className={cn('rounded-3xl bg-card p-4', classNames?.amount)}>
          <div className="flex min-h-24 flex-col items-center justify-center gap-5 text-center">
            <label htmlFor={inputId} className="mr-6 text-xl font-medium text-foreground">
              {order.mode === 'buy' ? 'Points to stake' : 'Shares'}
            </label>

            <div className="w-full min-w-0">
              <AnimatedAmountInput
                id={inputId}
                mode={order.mode}
                value={order.amount}
                disabled={isSubmitting}
                inputSize={inputSize}
                reduce={reduce}
                onChange={(amount) => setOrderValue({ amount })}
              />
            </div>
          </div>

          <div className={cn('mt-8 flex flex-wrap justify-center gap-2', classNames?.chips)}>
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={isSubmitting}
                onClick={() => addAmount(amount)}
                className="h-9 rounded-xl bg-background px-3.5 text-sm font-semibold text-foreground transition-[background-color,transform] duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                {order.mode === 'buy' ? formatCompactPoints(amount) : `+${amount}`}
              </button>
            ))}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={setMax}
              className="h-9 rounded-xl bg-background px-3.5 text-sm font-semibold text-foreground transition-[background-color,transform] duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              Max
            </button>
          </div>
        </div>
      </div>

      {showFooter ? (
        <div className={cn('border-t border-border/80 px-4 py-4', classNames?.footer)}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="min-w-0 shrink">
              <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
                {order.mode === 'buy' ? 'To win' : 'To receive'}
                <Banknote className="h-5 w-5 text-emerald-500" />
              </div>

              <p className="text-sm font-medium text-muted-foreground">
                Payout {formatMultiplier(quote.price)}
              </p>
            </div>

            <NumberTicker
              value={Math.round(quote.payout)}
              duration={0.45}
              className={cn(
                'ml-auto min-w-0 shrink-0 justify-end whitespace-nowrap text-right font-semibold leading-none tracking-tight text-emerald-500 tabular-nums transition-[font-size] duration-200',
                payoutSize,
              )}
              format={(points) => formatPoints(points)}
            />
          </div>

          <SlideButton
            label={quote.valid ? 'Slide to confirm' : (quote.error ?? 'Enter an amount')}
            successLabel="Placed"
            errorLabel="Failed"
            disabled={!quote.valid}
            onConfirm={confirmTrade}
            className={cn('text-base font-semibold', classNames?.action)}
          />
        </div>
      ) : (
        <div className="px-4 pb-5">
          <StatefulButton
            state="idle"
            variant="primary"
            size="lg"
            pressScale={0.98}
            onClick={() => onSignIn?.()}
            className={cn('h-14 w-full rounded-2xl text-base font-semibold', classNames?.action)}
          >
            Connect
          </StatefulButton>
        </div>
      )}
    </div>
  );
}
