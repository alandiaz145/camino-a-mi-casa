// Pesos enteros. Solo movimientos efectivamente asignados a vivienda.
export function calculate(goal, months, balance) {
  if (!Number.isSafeInteger(goal) || goal <= 0 || !Number.isSafeInteger(months) || months <= 0 || !Number.isSafeInteger(balance)) throw Error('Invalid financial state');
  const remaining = Math.max(0, goal - balance);
  return {remaining, percent: Math.max(0, Math.min(100, balance / goal * 100)), month: remaining / months, week: remaining / months * 12 / 52, day: remaining / months * 12 / 365};
}
